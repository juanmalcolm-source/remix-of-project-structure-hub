import { AnalisisGuion } from '@/types/analisisGuion';

// Timeout de 270s (4.5 min) por fase — cortar antes del límite de Vercel (300s)
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;
const CLIENT_TIMEOUT_MS = 270_000; // 4.5 minutos por fase
const STREAM_STALL_TIMEOUT_MS = 60_000; // 60s sin datos = stream muerto

interface AnalisisResponse {
  success: boolean;
  analisis?: Record<string, unknown>;
  error?: string;
  truncated?: boolean;
  metadata?: {
    modelo: string;
    timestamp: string;
  };
}

/**
 * Error personalizado para el servicio de análisis
 */
export class AnalisisError extends Error {
  constructor(
    message: string,
    public code: 'TIMEOUT' | 'VALIDATION' | 'API_ERROR' | 'NETWORK_ERROR' | 'RATE_LIMIT' | 'PAYMENT_REQUIRED' | 'GUION_MUY_LARGO' | 'GUION_MAL_FORMATEADO' | 'JSON_INVALIDO',
    public originalError?: unknown,
    public metadata?: {
      sugerencia?: string;
      accion?: string;
      accionSecundaria?: string;
    }
  ) {
    super(message);
    this.name = 'AnalisisError';
  }
}

// ═══════════════════════════════════════════════════════════════
// VALIDACIÓN POR FASE
// ═══════════════════════════════════════════════════════════════

function validarFase1(data: Record<string, unknown>): boolean {
  // Validación leniente: solo exigir informacion_general (siempre se genera primero).
  // El resto puede faltar si la respuesta fue truncada por max_tokens.
  // El UI manejará secciones vacías gracefully.
  return data.informacion_general !== undefined;
}

function validarFase2(data: Record<string, unknown>): boolean {
  return data.analisis_narrativo !== undefined;
}

function validarFase3(data: Record<string, unknown>): boolean {
  return data.analisis_dafo !== undefined;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS JSON
// ═══════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Repara JSON truncado usando un STACK para cerrar contenedores en orden correcto.
 * Usa truncamiento progresivo: recorta caracteres del final hasta encontrar
 * un punto de corte que produce JSON válido al cerrar los contenedores.
 */
function repairTruncatedJSON(text: string): string {
  // Si ya es válido, devolver tal cual
  try { JSON.parse(text); return text; } catch {}

  // Truncamiento progresivo — probar cortando 0..maxCut caracteres del final
  const maxCut = Math.min(500, Math.floor(text.length * 0.02));

  for (let cut = 0; cut <= maxCut; cut++) {
    let attempt = cut === 0 ? text : text.substring(0, text.length - cut);
    attempt = attempt.trimEnd();

    // Eliminar tokens parciales al final (coma, dos puntos, barra invertida)
    while (attempt.endsWith(',') || attempt.endsWith(':') || attempt.endsWith('\\')) {
      attempt = attempt.slice(0, -1).trimEnd();
    }

    // Rastrear strings y contenedores con STACK (orden correcto de cierre)
    let inStr = false;
    let esc = false;
    const stack: string[] = [];

    for (const ch of attempt) {
      if (esc) { esc = false; continue; }
      if (ch === '\\' && inStr) { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{') stack.push('}');
      else if (ch === '[') stack.push(']');
      else if (ch === '}' || ch === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === ch) {
          stack.pop();
        }
      }
    }

    // Cerrar string abierto
    if (inStr) {
      if (attempt.endsWith('\\')) attempt = attempt.slice(0, -1);
      attempt += '"';
    }

    // Limpiar coma final después de cerrar string
    const afterStr = attempt.trimEnd();
    if (afterStr.endsWith(',')) {
      attempt = afterStr.slice(0, -1);
    }

    // Cerrar contenedores en orden LIFO (el stack ya tiene el orden correcto)
    let closed = attempt;
    const stackCopy = [...stack];
    while (stackCopy.length > 0) {
      closed += stackCopy.pop();
    }

    try {
      JSON.parse(closed);
      return closed;
    } catch {
      // Continuar con más truncamiento
    }
  }

  // Último recurso: extraer el mayor bloque JSON con regex
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { JSON.parse(jsonMatch[0]); return jsonMatch[0]; } catch {}
  }

  return text;
}

function limpiarYParsearJSON(text: string, wasTruncated: boolean = false): Record<string, unknown> {
  let jsonStr = text.trim();

  // Limpiar markdown fences
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  // Intento 1: parsear directamente
  try {
    return JSON.parse(jsonStr);
  } catch {}

  // Intento 2: reparar y parsear (siempre, no solo cuando truncado)
  try {
    const repaired = repairTruncatedJSON(jsonStr);
    console.log(`JSON reparado: ${jsonStr.length} → ${repaired.length} chars (${wasTruncated ? 'truncado por max_tokens' : 'formato irregular'})`);
    return JSON.parse(repaired);
  } catch {}

  // Intento 3: extraer bloque JSON con regex, luego reparar
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
    try {
      const repaired = repairTruncatedJSON(jsonMatch[0]);
      return JSON.parse(repaired);
    } catch {}
  }

  throw new Error('No se encontró JSON válido en la respuesta');
}

// ═══════════════════════════════════════════════════════════════
// CONTEXTO FASE 1 → FASE 2
// ═══════════════════════════════════════════════════════════════

/**
 * Construye un resumen de texto de la Fase 1 para alimentar la Fase 2.
 * Esto permite que Claude haga "análisis sobre análisis".
 */
function buildContextoFase1(analisis: Record<string, unknown>): string {
  const info = analisis.informacion_general as Record<string, unknown> | undefined;
  const personajes = analisis.personajes as Array<Record<string, unknown>> | undefined;
  const localizaciones = analisis.localizaciones as Array<Record<string, unknown>> | undefined;
  const secuencias = analisis.desglose_secuencias as Array<Record<string, unknown>> | undefined;
  const resumen = analisis.resumen_produccion as Record<string, unknown> | undefined;

  let ctx = `DATOS DEL GUIÓN (extraídos en Fase 1):\n`;
  ctx += `- Título: ${info?.titulo || 'Desconocido'}\n`;
  ctx += `- Género: ${info?.genero || 'Desconocido'}`;
  if (info?.subgeneros && Array.isArray(info.subgeneros) && info.subgeneros.length > 0) {
    ctx += ` (${(info.subgeneros as string[]).join(', ')})`;
  }
  ctx += `\n`;
  ctx += `- Tono: ${info?.tono || '?'}\n`;
  ctx += `- Duración estimada: ${info?.duracion_estimada_minutos || '?'} min\n`;
  ctx += `- Páginas totales: ${info?.paginas_totales || '?'} (diálogo: ${info?.paginas_dialogo || '?'}, acción: ${info?.paginas_accion || '?'})\n`;
  ctx += `- Total secuencias: ${secuencias?.length || '?'}\n`;
  ctx += `- Complejidad general: ${resumen?.complejidad_general || '?'}\n`;

  const diasRodaje = resumen?.dias_rodaje as Record<string, unknown> | undefined;
  if (diasRodaje) {
    ctx += `- Días de rodaje estimados: ${diasRodaje.estimacion_minima}-${diasRodaje.estimacion_maxima} (recomendado: ${diasRodaje.estimacion_recomendada})\n`;
  }

  ctx += `\nPERSONAJES (${personajes?.length || 0}):\n`;
  if (personajes) {
    for (const p of personajes) {
      const escenas = p.escenas_aparicion as number[] | undefined;
      ctx += `  - ${p.nombre} [${p.categoria}] — ${p.descripcion || 'Sin descripción'}`;
      if (escenas) ctx += ` (${escenas.length} escenas)`;
      if (p.arco_dramatico) ctx += ` | Arco: ${p.arco_dramatico}`;
      ctx += `\n`;
    }
  }

  ctx += `\nLOCALIZACIONES (${localizaciones?.length || 0}):\n`;
  if (localizaciones) {
    for (const l of localizaciones) {
      const escenas = l.escenas as number[] | undefined;
      ctx += `  - ${l.nombre} [${l.tipo}/${l.momento_dia}] — complejidad: ${l.complejidad}`;
      if (escenas) ctx += ` (${escenas.length} escenas)`;
      ctx += `\n`;
    }
  }

  return ctx;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXTO FASE 2 → FASE 3
// ═══════════════════════════════════════════════════════════════

/**
 * Construye un resumen de texto de la Fase 2 para alimentar la Fase 3.
 * Extrae los hallazgos narrativos clave sin enviar el JSON completo.
 */
function buildContextoFase2(analisis: Record<string, unknown>): string {
  let ctx = 'ANÁLISIS NARRATIVO (extraído en Fase 2):\n';

  const narrativo = analisis.analisis_narrativo as Record<string, unknown> | undefined;

  // Estructura de actos
  const actos = narrativo?.estructura_actos as Array<Record<string, unknown>> | undefined;
  if (actos && actos.length > 0) {
    ctx += `\nESTRUCTURA (${actos.length} actos):\n`;
    for (const a of actos) {
      ctx += `  - Acto ${a.acto} (pp. ${a.paginas_inicio}-${a.paginas_fin}): ${(a.descripcion as string || '').substring(0, 150)}\n`;
    }
  }

  // Errores narrativos críticos
  const errores = narrativo?.errores_narrativos as Array<Record<string, unknown>> | undefined;
  if (errores && errores.length > 0) {
    const criticos = errores.filter(e => e.gravedad === 'critico' || e.gravedad === 'importante');
    ctx += `\nERRORES NARRATIVOS: ${errores.length} total (${criticos.length} críticos/importantes)\n`;
    for (const e of criticos.slice(0, 5)) {
      ctx += `  - [${e.gravedad}] ${e.tipo}: ${(e.descripcion as string || '').substring(0, 100)}\n`;
    }
  }

  // Puntos de giro
  const giros = narrativo?.puntos_de_giro as Array<Record<string, unknown>> | undefined;
  if (giros && giros.length > 0) {
    ctx += `\nPUNTOS DE GIRO: ${giros.length}\n`;
    for (const g of giros) {
      ctx += `  - ${g.nombre} (p. ${g.pagina_aproximada})\n`;
    }
  }

  // Conflictos resumen
  const conflictos = narrativo?.conflictos as Record<string, unknown> | undefined;
  if (conflictos) {
    const principal = conflictos.conflicto_principal as Record<string, unknown> | undefined;
    if (principal) {
      ctx += `\nCONFLICTO PRINCIPAL: ${principal.tipo} — ${(principal.descripcion as string || '').substring(0, 150)}`;
      ctx += ` — Resuelto: ${principal.resuelto ? 'Sí' : 'No'}\n`;
    }
    const secundarios = conflictos.conflictos_secundarios as Array<Record<string, unknown>> | undefined;
    if (secundarios) {
      ctx += `  Conflictos secundarios: ${secundarios.length}\n`;
    }
  }

  // Temática
  const tematica = narrativo?.tematica as Record<string, unknown> | undefined;
  if (tematica) {
    const principal = tematica.tema_principal as Record<string, unknown> | undefined;
    if (principal) {
      ctx += `\nTEMA PRINCIPAL: ${principal.nombre}\n`;
    }
    if (tematica.mensaje_universal) {
      ctx += `  Mensaje universal: ${tematica.mensaje_universal}\n`;
    }
  }

  // Ritmo
  const ritmo = narrativo?.ritmo as Record<string, unknown> | undefined;
  if (ritmo) {
    ctx += `\nRITMO: ${ritmo.ritmo_general}\n`;
    if (ritmo.observaciones) {
      ctx += `  ${(ritmo.observaciones as string).substring(0, 150)}\n`;
    }
  }

  // Personajes profundidad — resumen
  const profundidad = analisis.personajes_profundidad as Array<Record<string, unknown>> | undefined;
  if (profundidad && profundidad.length > 0) {
    ctx += `\nPERSONAJES ANALIZADOS EN PROFUNDIDAD (${profundidad.length}):\n`;
    for (const p of profundidad) {
      ctx += `  - ${p.nombre}: arco=${(p.arco_dramatico as string || '').substring(0, 80)}`;
      if (p.ghost) ctx += ` | ghost=${(p.ghost as string).substring(0, 50)}`;
      if (p.flaw_principal) ctx += ` | flaw=${(p.flaw_principal as string).substring(0, 50)}`;
      ctx += `\n`;
    }
  }

  return ctx;
}

// ═══════════════════════════════════════════════════════════════
// MERGE FASES 1 + 2 + 3
// ═══════════════════════════════════════════════════════════════

/**
 * Combina los resultados de Fase 1 (producción), Fase 2 (narrativo) y Fase 3 (mercado)
 * en un único AnalisisGuion completo.
 */
function mergeAnalisis(
  fase1: Record<string, unknown>,
  fase2: Record<string, unknown> | null,
  fase3: Record<string, unknown> | null
): AnalisisGuion {
  // Empezar con Fase 1 como base
  const merged: Record<string, unknown> = { ...fase1 };

  if (fase2) {
    // Añadir campos de Fase 2 (narrativo puro)
    merged.analisis_narrativo = fase2.analisis_narrativo;
    merged.relaciones_personajes = fase2.relaciones_personajes;

    // Merge profundidad de personajes de Fase 2 en personajes de Fase 1
    const personajesProfundidad = fase2.personajes_profundidad as Array<Record<string, unknown>> | undefined;
    const personajes = merged.personajes as Array<Record<string, unknown>> | undefined;

    if (personajesProfundidad && personajes) {
      for (const profundidad of personajesProfundidad) {
        const nombreProf = (profundidad.nombre as string || '').toUpperCase().trim();
        const personaje = personajes.find(
          p => (p.nombre as string || '').toUpperCase().trim() === nombreProf
        );
        if (personaje) {
          if (profundidad.arco_dramatico) personaje.arco_dramatico = profundidad.arco_dramatico;
          if (profundidad.motivaciones) personaje.motivaciones = profundidad.motivaciones;
          if (profundidad.conflictos) personaje.conflictos = profundidad.conflictos;
          if (profundidad.necesidad_dramatica) personaje.necesidad_dramatica = profundidad.necesidad_dramatica;
          if (profundidad.flaw_principal) personaje.flaw_principal = profundidad.flaw_principal;
          if (profundidad.funcion_narrativa) personaje.funcion_narrativa = profundidad.funcion_narrativa;
          if (profundidad.ghost) personaje.ghost = profundidad.ghost;
          if (profundidad.stakes) personaje.stakes = profundidad.stakes;
          if (profundidad.transformacion) personaje.transformacion = profundidad.transformacion;
        }
      }
    }
  }

  if (fase3) {
    // Añadir campos de Fase 3 (mercado/estrategia)
    merged.analisis_dafo = fase3.analisis_dafo;
    merged.perfiles_audiencia_sugeridos = fase3.perfiles_audiencia_sugeridos;
    merged.potencial_mercado = fase3.potencial_mercado;
    merged.recomendaciones_estrategicas = fase3.recomendaciones_estrategicas;
    // NO merged.viabilidad — reemplazado por recomendaciones_estrategicas
  }

  return merged as unknown as AnalisisGuion;
}

// ═══════════════════════════════════════════════════════════════
// LLAMADA A LA API CON STREAMING SSE
// ═══════════════════════════════════════════════════════════════

/**
 * Llama a la API Route de Vercel con streaming SSE.
 * Acepta fase (1 o 2) y contexto de Fase 1 para la Fase 2.
 */
async function llamarVercelAPI(
  texto: string,
  fase: 1 | 2 | 3,
  contextoFase1: string | null,
  contextoFase2: string | null,
  onStreamProgress?: (chars: number) => void
): Promise<AnalisisResponse> {
  const abortController = new AbortController();
  const clientTimeout = setTimeout(() => abortController.abort(), CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch('/api/analizar-guion-claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, fase, contextoFase1, ...(contextoFase2 && { contextoFase2 }) }),
      signal: abortController.signal,
    });

    // Si la respuesta no es OK, puede ser un JSON de error
    if (!response.ok) {
      let errorData: { success?: boolean; error?: string };
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `Error del servidor: ${response.status}` };
      }

      const errorMsg = errorData.error || `Error HTTP ${response.status}`;

      if (response.status === 429 || errorMsg.includes('Rate limit') || errorMsg.includes('Límite')) {
        throw new AnalisisError(
          'Límite de solicitudes excedido. Por favor, espera unos momentos antes de intentar de nuevo.',
          'RATE_LIMIT'
        );
      }

      if (response.status === 402 || errorMsg.includes('Payment') || errorMsg.includes('créditos')) {
        throw new AnalisisError(
          'Créditos insuficientes. Por favor, añade créditos a tu cuenta.',
          'PAYMENT_REQUIRED'
        );
      }

      throw new AnalisisError(
        `Error en la API (Fase ${fase}): ${errorMsg}`,
        'API_ERROR'
      );
    }

    // Verificar si es streaming (SSE) o JSON directo
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      // === MODO STREAMING ===
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let streamMetadata: Record<string, unknown> | null = null;
      let buffer = '';
      let lastActivityTime = Date.now();

      while (true) {
        // Watchdog: si no llegan datos en 60s, el stream está muerto
        if (Date.now() - lastActivityTime > STREAM_STALL_TIMEOUT_MS) {
          reader.cancel();
          throw new AnalisisError(
            `Fase ${fase}: El servidor dejó de enviar datos durante el análisis.`,
            'TIMEOUT',
            undefined,
            { sugerencia: 'Se reintentará automáticamente.', accion: 'Reintentar' }
          );
        }

        const { done, value } = await reader.read();
        if (done) break;

        lastActivityTime = Date.now();
        buffer += decoder.decode(value, { stream: true });

        // Procesar eventos SSE completos (separados por \n\n)
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const trimmed = event.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.type === 'delta' && data.text) {
              fullText += data.text;
              onStreamProgress?.(fullText.length);
            } else if (data.type === 'metadata') {
              streamMetadata = data;
            } else if (data.type === 'error') {
              throw new AnalisisError(
                data.error || `Error en el stream de análisis (Fase ${fase})`,
                'API_ERROR'
              );
            }
            // 'done' type = stream completado
          } catch (parseErr) {
            if (parseErr instanceof AnalisisError) throw parseErr;
            // Ignorar eventos no parseables
          }
        }
      }

      // Stream completado — parsear el texto acumulado como JSON
      if (!fullText || fullText.trim().length === 0) {
        throw new AnalisisError(
          `Fase ${fase}: El análisis no generó contenido`,
          'API_ERROR'
        );
      }

      console.log(`Fase ${fase} stream completado: ${fullText.length} caracteres recibidos`);

      // Detectar si fue truncado por max_tokens
      const wasTruncated = streamMetadata &&
        (streamMetadata as Record<string, unknown>).stop_reason === 'max_tokens';
      if (wasTruncated) {
        console.warn(`Fase ${fase}: Respuesta truncada por max_tokens — intentando reparar JSON`);
      }

      let analisis: Record<string, unknown>;
      try {
        analisis = limpiarYParsearJSON(fullText, !!wasTruncated);
      } catch (jsonErr) {
        console.error(`Fase ${fase}: Error parseando JSON del stream:`, jsonErr);
        console.error('Primeros 300 chars:', fullText.substring(0, 300));
        console.error('Últimos 300 chars:', fullText.substring(fullText.length - 300));
        throw new AnalisisError(
          `Fase ${fase}: La respuesta no contiene JSON válido`,
          'JSON_INVALIDO',
          jsonErr,
          {
            sugerencia: 'Esto puede ocurrir si la IA no generó el formato correcto. Se reintentará automáticamente.',
            accion: 'Reintentar'
          }
        );
      }

      return {
        success: true,
        analisis,
        truncated: !!wasTruncated,
        metadata: {
          modelo: 'claude-sonnet-4-20250514',
          timestamp: new Date().toISOString(),
        }
      };

    } else {
      // === MODO JSON DIRECTO (fallback / respuestas de error) ===
      return await response.json() as AnalisisResponse;
    }

  } catch (error) {
    clearTimeout(clientTimeout);

    if (error instanceof AnalisisError) {
      throw error;
    }

    // AbortError = timeout del cliente
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AnalisisError(
        `Fase ${fase}: El análisis excedió el tiempo máximo (4.5 min).`,
        'TIMEOUT',
        error,
        { sugerencia: 'Se reintentará automáticamente.', accion: 'Reintentar' }
      );
    }

    // Error de red o conexión
    throw new AnalisisError(
      'Error de conexión al servidor. Verifica tu conexión a internet.',
      'NETWORK_ERROR',
      error
    );
  } finally {
    clearTimeout(clientTimeout);
  }
}

// ═══════════════════════════════════════════════════════════════
// EJECUTAR UNA FASE CON REINTENTOS
// ═══════════════════════════════════════════════════════════════

async function ejecutarFase(
  texto: string,
  fase: 1 | 2 | 3,
  contextoFase1: string | null,
  contextoFase2: string | null,
  validar: (data: Record<string, unknown>) => boolean,
  faseLabel: string,
  onProgress?: (mensaje: string, intento: number) => void,
): Promise<Record<string, unknown>> {
  let lastError: AnalisisError | null = null;

  for (let intento = 1; intento <= MAX_RETRIES; intento++) {
    try {
      onProgress?.(
        intento === 1
          ? `${faseLabel}: Conectando con Claude...`
          : `${faseLabel}: Reintentando (${intento}/${MAX_RETRIES})...`,
        fase
      );

      const response = await llamarVercelAPI(texto, fase, contextoFase1, contextoFase2, (chars) => {
        const kChars = Math.round(chars / 1000);
        onProgress?.(
          `${faseLabel}: Analizando... (${kChars}K caracteres recibidos)`,
          fase
        );
      });

      // Verificar respuesta exitosa
      if (!response.success) {
        const errorMsg = response.error || 'Error desconocido en el análisis';

        if (errorMsg.toLowerCase().includes('formato') || errorMsg.toLowerCase().includes('estructura')) {
          throw new AnalisisError(
            'No se pudo identificar la estructura del guión',
            'GUION_MAL_FORMATEADO',
            undefined,
            {
              sugerencia: 'Asegúrate de que el guión siga un formato estándar (INT/EXT, nombre de personajes en mayúsculas, etc.)',
              accion: 'Revisar formato',
              accionSecundaria: 'Subir en .txt plano'
            }
          );
        }

        throw new AnalisisError(errorMsg, 'API_ERROR');
      }

      if (!response.analisis) {
        throw new AnalisisError(
          `${faseLabel}: No se recibió análisis en la respuesta`,
          'VALIDATION'
        );
      }

      // Validar estructura según la fase
      if (!validar(response.analisis)) {
        // Si fue truncado y tenemos ALGO, no reintentar (volverá a truncar igual)
        if (response.truncated && Object.keys(response.analisis).length > 0) {
          console.warn(`${faseLabel}: Respuesta truncada pero con datos parciales — aceptando`);
        } else if (intento < MAX_RETRIES) {
          throw new AnalisisError(
            `${faseLabel}: Respuesta inválida, reintentando...`,
            'JSON_INVALIDO',
            undefined,
            { sugerencia: 'Se reintentará automáticamente.', accion: 'Reintentar' }
          );
        } else {
          throw new AnalisisError(
            `${faseLabel}: No se obtuvo una respuesta válida después de ${MAX_RETRIES} intentos`,
            'VALIDATION'
          );
        }
      }

      onProgress?.(`${faseLabel}: Completada con éxito`, fase);
      return response.analisis;

    } catch (error) {
      if (error instanceof AnalisisError) {
        lastError = error;

        // No reintentar en estos casos
        if (
          error.code === 'VALIDATION' ||
          error.code === 'PAYMENT_REQUIRED' ||
          error.code === 'RATE_LIMIT' ||
          error.code === 'GUION_MUY_LARGO' ||
          error.code === 'GUION_MAL_FORMATEADO'
        ) {
          throw error;
        }

        if (intento === MAX_RETRIES) {
          throw error;
        }

        onProgress?.(`${faseLabel}: Error: ${error.message}. Reintentando en ${RETRY_DELAY_MS / 1000}s...`, fase);
        await sleep(RETRY_DELAY_MS);
      } else {
        throw new AnalisisError(
          `${faseLabel}: Error inesperado`,
          'API_ERROR',
          error
        );
      }
    }
  }

  throw lastError || new AnalisisError(
    `${faseLabel}: Fallaron todos los intentos`,
    'API_ERROR'
  );
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL — ANÁLISIS EN 3 FASES
// ═══════════════════════════════════════════════════════════════

/**
 * Analiza un guión cinematográfico usando Claude en 3 fases:
 *
 * Fase 1: Extracción de datos de producción (secuencias, personajes, localizaciones)
 * Fase 2: Análisis narrativo puro (conflictos, estructura, personajes, temática)
 * Fase 3: Mercado y estrategia (DAFO, audiencias, distribución, recomendaciones)
 *
 * Cada fase recibe el contexto resumido de las anteriores.
 * Si Fase 2 falla → devuelve Fase 1 solamente.
 * Si Fase 3 falla → devuelve Fase 1 + 2 (sin mercado).
 *
 * @param texto - Texto completo del guión
 * @param onProgress - Callback opcional para reportar progreso
 * @returns Análisis estructurado del guión (Fase 1 + 2 + 3 merged)
 * @throws AnalisisError si Fase 1 falla
 */
export async function analizarGuion(
  texto: string,
  onProgress?: (mensaje: string, intento: number) => void
): Promise<AnalisisGuion> {
  if (!texto || texto.trim().length === 0) {
    throw new AnalisisError(
      'El texto del guión está vacío',
      'VALIDATION'
    );
  }

  if (texto.length < 100) {
    throw new AnalisisError(
      'El texto del guión es demasiado corto para analizar',
      'VALIDATION'
    );
  }

  const paginasEstimadas = Math.round(texto.length / 600);
  console.log(`Analizando guión de ~${paginasEstimadas} páginas en 3 fases`);

  // ═══════════════════════════════════════════════
  // FASE 1 — Extracción de Producción
  // ═══════════════════════════════════════════════
  const fase1Data = await ejecutarFase(
    texto,
    1,
    null,
    null,
    validarFase1,
    'Fase 1/3 — Producción',
    onProgress
  );

  console.log('Fase 1 completada:', {
    secuencias: (fase1Data.desglose_secuencias as unknown[])?.length,
    personajes: (fase1Data.personajes as unknown[])?.length,
    localizaciones: (fase1Data.localizaciones as unknown[])?.length,
  });

  // ═══════════════════════════════════════════════
  // Construir contexto para Fase 2
  // ═══════════════════════════════════════════════
  const contextoFase1 = buildContextoFase1(fase1Data);
  console.log(`Contexto Fase 1 generado: ${contextoFase1.length} caracteres`);

  // ═══════════════════════════════════════════════
  // FASE 2 — Análisis Narrativo Puro
  // ═══════════════════════════════════════════════
  let fase2Data: Record<string, unknown> | null = null;

  try {
    fase2Data = await ejecutarFase(
      texto,
      2,
      contextoFase1,
      null,
      validarFase2,
      'Fase 2/3 — Narrativo',
      onProgress
    );

    console.log('Fase 2 completada:', {
      errores_narrativos: ((fase2Data.analisis_narrativo as Record<string, unknown>)?.errores_narrativos as unknown[])?.length,
      personajes_profundidad: (fase2Data.personajes_profundidad as unknown[])?.length,
      relaciones: (fase2Data.relaciones_personajes as unknown[])?.length,
    });
  } catch (fase2Error) {
    console.error('Fase 2 falló, devolviendo solo datos de producción:', fase2Error);
    onProgress?.(
      'Fase 2 falló — guardando datos de producción disponibles.',
      2
    );
  }

  // ═══════════════════════════════════════════════
  // FASE 3 — Mercado y Estrategia (solo si Fase 2 OK)
  // ═══════════════════════════════════════════════
  let fase3Data: Record<string, unknown> | null = null;

  if (fase2Data) {
    const contextoFase2Str = buildContextoFase2(fase2Data);
    console.log(`Contexto Fase 2 generado: ${contextoFase2Str.length} caracteres`);

    try {
      fase3Data = await ejecutarFase(
        texto,
        3,
        contextoFase1,
        contextoFase2Str,
        validarFase3,
        'Fase 3/3 — Mercado',
        onProgress
      );

      console.log('Fase 3 completada:', {
        dafo: fase3Data.analisis_dafo ? 'Sí' : 'No',
        audiencias: (fase3Data.perfiles_audiencia_sugeridos as unknown[])?.length,
        recomendaciones: fase3Data.recomendaciones_estrategicas ? 'Sí' : 'No',
      });
    } catch (fase3Error) {
      console.error('Fase 3 falló, devolviendo Fase 1 + 2 sin mercado:', fase3Error);
      onProgress?.(
        'Fase 3 falló — guardando análisis narrativo sin datos de mercado.',
        3
      );
    }
  }

  // ═══════════════════════════════════════════════
  // MERGE — Combinar las 3 fases
  // ═══════════════════════════════════════════════
  const resultado = mergeAnalisis(fase1Data, fase2Data, fase3Data);

  onProgress?.('Análisis completado con éxito', 3);
  return resultado;
}

/**
 * Obtiene un mensaje de error amigable según el código
 */
export function obtenerMensajeError(error: unknown): string {
  if (error instanceof AnalisisError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Error desconocido al analizar el guión';
}
