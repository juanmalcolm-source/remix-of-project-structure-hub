import { AnalisisGuion } from '@/types/analisisGuion';

// SIN LÍMITE DE TIEMPO - El análisis tarda lo que necesite (streaming)
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

interface AnalisisResponse {
  success: boolean;
  analisis?: AnalisisGuion;
  error?: string;
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

/**
 * Valida que la respuesta del análisis tenga la estructura correcta
 */
function validarAnalisis(data: unknown): data is AnalisisResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const response = data as AnalisisResponse;

  if (!response.success) {
    return true; // Si success es false, es válido (es un error controlado)
  }

  if (!response.analisis) {
    return false;
  }

  const analisis = response.analisis;

  // Validar estructura básica
  return (
    analisis.informacion_general !== undefined &&
    Array.isArray(analisis.personajes) &&
    Array.isArray(analisis.localizaciones) &&
    Array.isArray(analisis.desglose_secuencias) &&
    analisis.resumen_produccion !== undefined
  );
}

/**
 * Espera un tiempo determinado
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Limpia JSON de markdown fences y extrae el objeto JSON
 */
function limpiarYParsearJSON(text: string): Record<string, unknown> {
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

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Fallback: buscar JSON con regex
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No se encontró JSON válido en la respuesta');
  }
}

/**
 * Llama a la API Route de Vercel con streaming SSE
 * El streaming mantiene la conexión viva sin límite de tiempo
 */
async function llamarVercelAPI(
  texto: string,
  onStreamProgress?: (chars: number) => void
): Promise<AnalisisResponse> {
  try {
    const response = await fetch('/api/analizar-guion-claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
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
        `Error en la API: ${errorMsg}`,
        'API_ERROR'
      );
    }

    // Verificar si es streaming (SSE) o JSON directo
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      // === MODO STREAMING ===
      // Leer el stream SSE y acumular el texto completo del análisis
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let streamMetadata: Record<string, unknown> | null = null;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

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
                data.error || 'Error en el stream de análisis',
                'API_ERROR'
              );
            }
            // 'done' type = stream completado, continuamos al parseo
          } catch (parseErr) {
            if (parseErr instanceof AnalisisError) throw parseErr;
            // Ignorar eventos no parseables
          }
        }
      }

      // Stream completado — parsear el texto acumulado como JSON
      if (!fullText || fullText.trim().length === 0) {
        throw new AnalisisError(
          'El análisis no generó contenido',
          'API_ERROR'
        );
      }

      console.log(`Stream completado: ${fullText.length} caracteres recibidos`);

      let analisis: Record<string, unknown>;
      try {
        analisis = limpiarYParsearJSON(fullText);
      } catch (jsonErr) {
        console.error('Error parseando JSON del stream:', jsonErr);
        console.error('Primeros 300 chars:', fullText.substring(0, 300));
        console.error('Últimos 300 chars:', fullText.substring(fullText.length - 300));
        throw new AnalisisError(
          'La respuesta del análisis no contiene JSON válido',
          'JSON_INVALIDO',
          jsonErr,
          {
            sugerencia: 'Esto puede ocurrir si la IA no generó el formato correcto. Se reintentará automáticamente.',
            accion: 'Reintentar'
          }
        );
      }

      // Verificar si Claude fue cortado por max_tokens
      if (streamMetadata && (streamMetadata as Record<string, unknown>).stop_reason === 'max_tokens') {
        console.warn('Respuesta truncada por max_tokens — se intentará usar lo disponible');
      }

      return {
        success: true,
        analisis: analisis as unknown as AnalisisGuion,
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
    if (error instanceof AnalisisError) {
      throw error;
    }

    // Error de red o conexión
    throw new AnalisisError(
      'Error de conexión al servidor. Verifica tu conexión a internet.',
      'NETWORK_ERROR',
      error
    );
  }
}

/**
 * Analiza un guión cinematográfico usando Claude via Vercel Edge Function
 *
 * Usa streaming SSE para mantener la conexión viva sin límite de tiempo.
 * Claude Sonnet analiza el guión completo (hasta 200K tokens) sin truncar.
 *
 * @param texto - Texto completo del guión
 * @param onProgress - Callback opcional para reportar progreso
 * @returns Análisis estructurado del guión
 * @throws AnalisisError si hay algún problema
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

  // Sin límite de páginas - analizar guiones de cualquier tamaño
  const paginasEstimadas = Math.round(texto.length / 600);
  console.log(`Analizando guión de aproximadamente ${paginasEstimadas} páginas`);

  let lastError: AnalisisError | null = null;

  // Retry logic
  for (let intento = 1; intento <= MAX_RETRIES; intento++) {
    try {
      onProgress?.(
        intento === 1
          ? 'Conectando con Claude para analizar el guión...'
          : `Reintentando análisis (${intento}/${MAX_RETRIES})...`,
        intento
      );

      const response = await llamarVercelAPI(texto, (chars) => {
        // Reportar progreso durante el streaming
        const kChars = Math.round(chars / 1000);
        onProgress?.(
          `Analizando... (${kChars}K caracteres recibidos)`,
          intento
        );
      });

      // Validar estructura de respuesta
      if (!validarAnalisis(response)) {
        // Si es la primera vez, podría ser JSON inválido
        if (intento === 1) {
          throw new AnalisisError(
            'La respuesta del análisis no es válida. Reintentando...',
            'JSON_INVALIDO',
            undefined,
            {
              sugerencia: 'Esto puede ocurrir si la IA no generó el formato correcto. Se reintentará automáticamente.',
              accion: 'Reintentar'
            }
          );
        }
        throw new AnalisisError(
          'No se pudo obtener un análisis válido después de varios intentos',
          'VALIDATION'
        );
      }

      // Si la respuesta indica error
      if (!response.success) {
        const errorMsg = response.error || 'Error desconocido en el análisis';

        // Detectar guión mal formateado
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

        throw new AnalisisError(
          errorMsg,
          'API_ERROR'
        );
      }

      // Si no hay análisis en la respuesta
      if (!response.analisis) {
        throw new AnalisisError(
          'No se recibió análisis en la respuesta',
          'VALIDATION'
        );
      }

      onProgress?.('Análisis completado con éxito', intento);

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

        // Si es el último intento, lanzar el error
        if (intento === MAX_RETRIES) {
          throw error;
        }

        // Esperar antes del siguiente intento
        onProgress?.(`Error: ${error.message}. Reintentando en ${RETRY_DELAY_MS / 1000}s...`, intento);
        await sleep(RETRY_DELAY_MS);
      } else {
        // Error inesperado
        throw new AnalisisError(
          'Error inesperado durante el análisis',
          'API_ERROR',
          error
        );
      }
    }
  }

  // Si llegamos aquí, fallaron todos los intentos
  throw lastError || new AnalisisError(
    'Fallaron todos los intentos de análisis',
    'API_ERROR'
  );
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
