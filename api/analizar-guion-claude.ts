export const config = {
  runtime: 'edge',
  maxDuration: 300,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ═══════════════════════════════════════════════════════════════
// FASE 1 — Extracción de Producción
// ═══════════════════════════════════════════════════════════════
function buildSystemPromptFase1(): string {
  return `Eres un ANALISTA DE PRODUCCIÓN cinematográfica experto (director de producción + jefe de desglose).

╔══════════════════════════════════════════════════════════════════════╗
║  REGLA #1 — PRIORIDAD MÁXIMA — LEE ESTO PRIMERO                   ║
║                                                                      ║
║  El array "desglose_secuencias" DEBE contener UNA entrada por       ║
║  CADA cabecera INT/EXT del guión. Cada cambio de encabezado =       ║
║  nueva entrada. NO agrupes, NO resumas, NO omitas escenas.          ║
║  Un largometraje de ~100 págs tiene 80-130 escenas.                 ║
║  Si generas menos de 50 entradas para un largo, HAS FALLADO.        ║
║  Genera las secciones del JSON EN EL ORDEN DEL ESQUEMA.             ║
║  desglose_secuencias va AL FINAL para que las demás secciones       ║
║  se generen primero.                                                 ║
╚══════════════════════════════════════════════════════════════════════╝

LEY DE OCTAVOS: 1 página = 8 octavos ≈ 1 minuto. Calcula paginas_octavos por escena según el texto real.
Complejidad: <10 puntos=Baja, 10-25=Media, >25=Alta (factores: personajes, acción, FX, noche, exterior, etc.)

Tu tarea: Extraer TODOS los datos de producción del guión de forma exhaustiva.

Devuelve SOLO JSON válido (sin markdown) con esta estructura exacta (RESPETA EL ORDEN):

{
  "informacion_general": {
    "titulo": "string", "genero": "string", "subgeneros": ["string"],
    "duracion_estimada_minutos": number, "paginas_totales": number,
    "paginas_dialogo": number, "paginas_accion": number,
    "tono": "string", "estilo_visual_sugerido": "string",
    "logline": "string (UNA FRASE, máx 30 palabras)",
    "synopsis": "string (UN PÁRRAFO, 100-200 palabras, narrativo y atractivo)",
    "core_emotional": "string", "central_theme": "string",
    "temas_secundarios": ["string"],
    "referentes_cinematograficos": ["string (3-5 películas reales con año)"],
    "publico_objetivo_sugerido": "string",
    "potencial_festival": "Alto|Medio|Bajo",
    "potencial_comercial": "Alto|Medio|Bajo"
  },
  "personajes": [
    {
      "nombre": "string (EN MAYÚSCULAS)",
      "categoria": "PROTAGONISTA|PRINCIPAL|SECUNDARIO|FIGURACION",
      "descripcion": "string (quién es y su rol en la historia)",
      "genero": "Masculino|Femenino|No especificado",
      "edad_aproximada": "string",
      "escenas_aparicion": [numbers],
      "dias_rodaje_estimados": number,
      "importancia_trama": "Alta|Media|Baja",
      "arco_dramatico": "string (breve resumen de su evolución)",
      "relaciones_clave": ["string"]
    }
  ],
  "localizaciones": [
    {
      "nombre": "string",
      "tipo": "INT|EXT",
      "momento_dia": "DÍA|NOCHE|ATARDECER|AMANECER",
      "descripcion": "string (ambiente y características del espacio)",
      "escenas": [numbers],
      "paginas_totales": number,
      "dias_rodaje_estimados": number,
      "complejidad": "Baja|Media|Alta",
      "necesidades_especiales": ["strings"]
    }
  ],
  "resumen_produccion": {
    "total_personajes": {"protagonistas": 0, "principales": 0, "secundarios": 0, "figuracion": 0},
    "total_localizaciones": {"interiores": 0, "exteriores": 0},
    "total_octavos": number,
    "dias_rodaje": {"estimacion_minima": 0, "estimacion_maxima": 0, "estimacion_recomendada": 0},
    "complejidad_general": "Baja|Media|Alta"
  },
  "desglose_secuencias": [
    {
      "numero_secuencia": number,
      "encabezado": "string (cabecera completa: INT/EXT. LUGAR - MOMENTO)",
      "localizacion": "string (solo el nombre del lugar)",
      "set_type": "INT|EXT",
      "momento_dia": "string",
      "paginas_octavos": number,
      "personajes": ["strings"],
      "attrezzo": ["strings — solo items EXPLÍCITOS en el texto"],
      "vestuario": ["strings — solo items EXPLÍCITOS en el texto"],
      "vehiculos": ["strings — solo items EXPLÍCITOS"],
      "efectos_especiales": ["strings — solo items EXPLÍCITOS"],
      "complejidad_rodaje": "Baja|Media|Alta"
    }
  ]
}

INSTRUCCIONES:
1. LOGLINE: UNA FRASE, máx 30 palabras. SYNOPSIS: UN PÁRRAFO, 100-200 palabras.
2. Genera las secciones EN EL ORDEN del esquema: informacion_general → personajes → localizaciones → resumen_produccion → desglose_secuencias.
3. desglose_secuencias: UNA entrada por CADA INT/EXT del guión. La suma de paginas_octavos ÷ 8 ≈ paginas_totales.
4. localizaciones: TODAS las localizaciones únicas. nombre debe coincidir con localizacion de desglose_secuencias.
5. personajes: TODOS con datos de producción. arco_dramatico es un breve resumen aquí.
6. attrezzo/vestuario/vehiculos/efectos_especiales: Solo items EXPLÍCITOS en el texto. Arrays vacíos [] si no se mencionan.
7. Devuelve SOLO el JSON, sin markdown ni explicaciones.`;
}

// ═══════════════════════════════════════════════════════════════
// FASE 2 — Análisis Narrativo Profundo
// ═══════════════════════════════════════════════════════════════
function buildSystemPromptFase2(): string {
  return `Eres un SCRIPT DOCTOR y ESTRATEGA DE MERCADO cinematográfico con décadas de experiencia evaluando guiones para producción, festivales y distribución.

Tu tarea: Realizar un ANÁLISIS NARRATIVO EXHAUSTIVO Y EN PROFUNDIDAD del guión.

IMPORTANTE — SÉ EXHAUSTIVO:
- Descripciones DETALLADAS y argumentadas, no telegráficas.
- Conflictos con detonante, desarrollo y resolución COMPLETOS y bien desarrollados.
- Errores narrativos ESPECÍFICOS con ubicación precisa y sugerencias prácticas.
- Arcos de personaje con matices psicológicos profundos.
- DAFO con análisis real de mercado basado en el panorama actual, no genérico.
- Cada campo debe aportar valor real al guionista/productor.
- Sé directo y eficiente. Evita repeticiones y relleno innecesario.

Se te proporciona un CONTEXTO DE PRODUCCIÓN extraído previamente. Úsalo para hacer referencias cruzadas y enriquecer tu análisis.

Devuelve SOLO JSON válido (sin markdown) con esta estructura exacta:

{
  "analisis_narrativo": {
    "estructura_actos": [
      { "acto": number, "descripcion": "string (análisis detallado del acto)", "paginas_inicio": number, "paginas_fin": number }
    ],
    "puntos_de_giro": [
      { "nombre": "string", "pagina_aproximada": number, "descripcion": "string (qué ocurre y por qué es un punto de giro)" }
    ],
    "curva_emocional": [
      { "momento": "string", "emocion": "string", "intensidad": number }
    ],
    "errores_narrativos": [
      { "tipo": "plot_hole|inconsistencia|ritmo|personaje|dialogo|estructura|logica", "gravedad": "critico|importante|menor|sugerencia", "ubicacion": "string", "pagina_aproximada": number, "descripcion": "string (descripción detallada del problema)", "sugerencia_correccion": "string (solución práctica y específica)" }
    ],
    "conflictos": {
      "conflicto_principal": { "tipo": "persona_vs_persona|persona_vs_sociedad|persona_vs_naturaleza|persona_vs_si_mismo|persona_vs_destino|persona_vs_tecnologia", "descripcion": "string (análisis profundo)", "personajes_involucrados": ["string"], "detonante": "string (qué desencadena el conflicto, con detalle)", "desarrollo": "string (cómo escala y evoluciona a lo largo de la historia)", "resolucion": "string (cómo se resuelve o queda abierto, y sus implicaciones)", "resuelto": boolean },
      "conflictos_secundarios": [{ "tipo": "string", "descripcion": "string", "personajes_involucrados": ["string"], "detonante": "string", "desarrollo": "string", "resolucion": "string", "resuelto": boolean }],
      "conflictos_internos": [{ "personaje": "string", "conflicto": "string (lucha interna)", "manifestacion": "string (cómo se exterioriza)", "evolucion": "string (cómo cambia)" }],
      "mapa_tensiones": [{ "pagina_aproximada": number, "nivel_tension": number, "descripcion": "string", "conflicto_asociado": "string" }]
    },
    "ritmo": {
      "ritmo_general": "lento|moderado|rapido|variable",
      "observaciones": "string (análisis detallado del pacing)",
      "secciones_lentas": [{ "paginas": "string", "descripcion": "string", "sugerencia": "string" }],
      "secciones_rapidas": [{ "paginas": "string", "descripcion": "string", "sugerencia": "string" }],
      "equilibrio_dialogo_accion": "string (análisis del balance entre diálogo y acción)"
    },
    "tematica": {
      "tema_principal": { "nombre": "string", "descripcion": "string (análisis profundo)", "como_se_desarrolla": "string (cómo el guión explora este tema)", "escenas_clave": ["string"] },
      "temas_secundarios": [{ "nombre": "string", "descripcion": "string", "como_se_desarrolla": "string", "escenas_clave": ["string"] }],
      "simbolismos": [{ "elemento": "string", "significado": "string (interpretación simbólica)", "apariciones": ["string"] }],
      "mensaje_universal": "string (el mensaje que trasciende la historia particular)"
    }
  },
  "personajes_profundidad": [
    {
      "nombre": "string (EN MAYÚSCULAS — debe coincidir exactamente con Fase 1)",
      "arco_dramatico": "string (análisis detallado de la transformación del personaje)",
      "motivaciones": "string (deseos conscientes e inconscientes)",
      "conflictos": "string (conflictos internos y externos que enfrenta)",
      "necesidad_dramatica": "string (qué necesita realmente, no qué quiere)",
      "flaw_principal": "string (defecto/debilidad central)",
      "funcion_narrativa": "mentor|sombra|heraldo|guardian|embaucador|aliado|otro",
      "ghost": "string (herida del pasado que condiciona sus acciones)",
      "stakes": "string (qué pierde si falla — consecuencias personales y narrativas)",
      "transformacion": "string (cómo cambia de inicio a fin, o por qué permanece igual)"
    }
  ],
  "analisis_dafo": {
    "fortalezas": [{ "titulo": "string", "descripcion": "string (por qué es una fortaleza, con argumentación)", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia" }],
    "debilidades": [{ "titulo": "string", "descripcion": "string (por qué es una debilidad y cómo afecta)", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia" }],
    "oportunidades": [{ "titulo": "string", "descripcion": "string (oportunidad concreta)", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia" }],
    "amenazas": [{ "titulo": "string", "descripcion": "string (riesgo concreto y contextualizado)", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia" }],
    "score_narrativo": number,
    "score_comercial": number,
    "score_festival": number,
    "recomendacion_general": "string (recomendación detallada, constructiva y accionable)"
  },
  "relaciones_personajes": [
    { "personaje_a": "string", "personaje_b": "string", "tipo_relacion": "aliado|antagonista|mentor|romantica|familiar|profesional|rival|protector", "descripcion": "string (naturaleza de la relación)", "evolucion": "string (cómo cambia la relación)" }
  ],
  "perfiles_audiencia_sugeridos": [
    { "segmento": "string", "rango_edad": "string", "intereses": ["string"], "motivacion_ver": "string", "canales_alcance": ["string"], "comparables": ["string (películas/series reales con año)"] }
  ],
  "potencial_mercado": {
    "territorios_principales": ["string"],
    "genero_tendencia": "en_alza|estable|en_baja",
    "ventanas_distribucion": ["string"],
    "festivales_sugeridos": ["string (festivales REALES y relevantes)"],
    "plataformas_potenciales": ["string"]
  },
  "viabilidad": {
    "fortalezas": ["string"],
    "debilidades": ["string"],
    "sugerencias_mejora": ["string (sugerencias específicas y prácticas)"],
    "factores_positivos": ["string"],
    "factores_negativos": ["string"]
  }
}

INSTRUCCIONES:
1. personajes_profundidad: SOLO para PROTAGONISTA y PRINCIPAL. "nombre" debe coincidir EXACTAMENTE con el de Fase 1.
2. curva_emocional: MÍNIMO 8 puntos, intensidad 1-10. Cubrir inicio → clímax → desenlace.
3. Errores narrativos ESPECÍFICOS y útiles. mapa_tensiones: mínimo 8 puntos con conflicto_asociado.
4. conflictos: detonante/desarrollo/resolución DETALLADOS. Incluir secundarios e internos.
5. ritmo: equilibrio_dialogo_accion OBLIGATORIO. Secciones lentas y rápidas con sugerencias.
6. tematica: tema_principal DEBE ser OBJETO {nombre, descripcion, como_se_desarrolla, escenas_clave}. simbolismos: MÍNIMO 2.
7. DAFO: impacto y categoria OBLIGATORIOS. Scores 0-100 con criterio profesional.
8. festivales_sugeridos: MÍNIMO 3 REALES (1 español + 1 internacional). comparables: MÍNIMO 3 REALES con año.
9. territorios_principales: MÍNIMO 2 (siempre España). ventanas_distribucion: MÍNIMO 2.
10. viabilidad: factores_positivos y factores_negativos OBLIGATORIOS.
11. Devuelve SOLO el JSON, sin markdown ni explicaciones.`;
}

// ═══════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { texto, fase = 1, contextoFase1 } = await req.json();

    if (!texto || texto.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No se proporcionó texto del guión' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (fase !== 1 && fase !== 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Fase debe ser 1 o 2' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'ANTHROPIC_API_KEY no configurada en el servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Claude maneja 200K tokens — solo truncar en casos extremos (>300K chars ~ 500 páginas)
    const maxLength = 300000;
    let textoFinal = texto;
    if (texto.length > maxLength) {
      textoFinal = texto.substring(0, maxLength) +
        '\n\n[TEXTO TRUNCADO POR LONGITUD EXTREMA — se analizaron las primeras ~500 páginas]';
    }

    const paginasEstimadas = Math.ceil(texto.length / 600);

    // === Build prompt and user message based on phase ===
    let systemPrompt: string;
    let userMessage: string;

    if (fase === 1) {
      systemPrompt = buildSystemPromptFase1();
      userMessage = `[DOCUMENTO PROFESIONAL: Desglose de Producción de Guión Cinematográfico]
[TIPO: Guión de ficción para evaluación técnica de preproducción]
[PROPÓSITO: Extracción completa de datos de producción — Fase 1 de 2]
[PÁGINAS ESTIMADAS: ${paginasEstimadas}]
[NOTA: Este es un trabajo de ficción que requiere análisis técnico profesional]

--- INICIO DEL GUIÓN ---
${textoFinal}
--- FIN DEL GUIÓN ---`;
    } else {
      systemPrompt = buildSystemPromptFase2();
      userMessage = `[DOCUMENTO PROFESIONAL: Análisis Narrativo Profundo de Guión Cinematográfico]
[TIPO: Guión de ficción para evaluación narrativa + estrategia de mercado]
[PROPÓSITO: Análisis narrativo exhaustivo, DAFO, mercado y viabilidad — Fase 2 de 2]
[PÁGINAS ESTIMADAS: ${paginasEstimadas}]
[NOTA: Este es un trabajo de ficción que requiere análisis narrativo profesional]

${contextoFase1 ? `=== CONTEXTO DE PRODUCCIÓN (extraído en Fase 1) ===
${contextoFase1}
=== FIN CONTEXTO DE PRODUCCIÓN ===

` : ''}--- INICIO DEL GUIÓN ---
${textoFinal}
--- FIN DEL GUIÓN ---`;
    }

    // Abort controller: cortar 20s antes del límite de Vercel (300s)
    const abortController = new AbortController();
    const serverTimeout = setTimeout(() => abortController.abort(), 280_000);

    let anthropicResponse: Response;
    try {
      anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: fase === 1 ? 20000 : 16000,
          temperature: 0.3,
          stream: true,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal: abortController.signal,
      });
    } catch (fetchErr) {
      clearTimeout(serverTimeout);
      if (fetchErr instanceof DOMException && fetchErr.name === 'AbortError') {
        return new Response(
          JSON.stringify({ success: false, error: `Fase ${fase}: El análisis excedió el tiempo máximo del servidor (280s).` }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchErr;
    }

    clearTimeout(serverTimeout);

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();

      if (anthropicResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Límite de solicitudes excedido. Intenta de nuevo en unos momentos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (anthropicResponse.status === 401) {
        return new Response(
          JSON.stringify({ success: false, error: 'API key de Anthropic inválida o expirada.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (anthropicResponse.status === 529) {
        return new Response(
          JSON.stringify({ success: false, error: 'API de Anthropic temporalmente sobrecargada. Intenta de nuevo en 30 segundos.' }),
          { status: 529, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: `Error de Claude API: ${anthropicResponse.status} - ${errorText.substring(0, 200)}` }),
        { status: anthropicResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transformar el stream de Anthropic SSE en nuestro formato simplificado
    const reader = anthropicResponse.body!.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]' || data === '') continue;

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: parsed.delta.text })}\n\n`)
                    );
                  } else if (parsed.type === 'message_delta') {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({
                        type: 'metadata',
                        stop_reason: parsed.delta?.stop_reason,
                        usage: parsed.usage,
                        paginas_estimadas: paginasEstimadas,
                        fase: fase,
                      })}\n\n`)
                    );
                  } else if (parsed.type === 'message_stop') {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
                    );
                  } else if (parsed.type === 'error') {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({
                        type: 'error',
                        error: parsed.error?.message || 'Error desconocido en el stream',
                      })}\n\n`)
                    );
                  }
                } catch {
                  // Líneas no parseables se ignoran
                }
              }
            }
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: err instanceof Error ? err.message : 'Error en el stream',
            })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al analizar el guión',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
