import { supabase } from '@/integrations/supabase/client';
import { AnalisisGuion } from '@/types/analisisGuion';

const TIMEOUT_MS = 120000; // 2 minutos para análisis completos
const MAX_RETRIES = 2; // Reducido porque el timeout es mayor
const RETRY_DELAY_MS = 3000; // 3 segundos entre reintentos

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
 * Llama a la Edge Function con timeout
 */
async function llamarEdgeFunctionConTimeout(
  texto: string,
  timeoutMs: number
): Promise<AnalisisResponse> {
  // Usar Promise.race en lugar de AbortSignal para evitar el error "signal is aborted without reason"
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AnalisisError(
        'El análisis tardó demasiado tiempo. Por favor, intenta con un guión más corto.',
        'TIMEOUT'
      ));
    }, timeoutMs);
  });

  const fetchPromise = (async (): Promise<AnalisisResponse> => {
    const { data, error } = await supabase.functions.invoke('analizar-guion', {
      body: { texto },
    });

    if (error) {
      // Detectar tipo de error
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        throw new AnalisisError(
          'Límite de solicitudes excedido. Por favor, espera unos momentos antes de intentar de nuevo.',
          'RATE_LIMIT',
          error
        );
      }

      if (error.message?.includes('402') || error.message?.includes('Payment')) {
        throw new AnalisisError(
          'Créditos insuficientes. Por favor, añade créditos a tu cuenta.',
          'PAYMENT_REQUIRED',
          error
        );
      }

      throw new AnalisisError(
        `Error en la API: ${error.message}`,
        'API_ERROR',
        error
      );
    }

    return data as AnalisisResponse;
  })();

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof AnalisisError) {
      throw error;
    }

    throw new AnalisisError(
      'Error de conexión al servidor',
      'NETWORK_ERROR',
      error
    );
  }
}

/**
 * Analiza un guión cinematográfico usando la Edge Function
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

  // Validar longitud del guión (estimación: 600 caracteres por página)
  const paginasEstimadas = texto.length / 600;
  if (paginasEstimadas > 200) {
    throw new AnalisisError(
      `El guión es muy extenso (aproximadamente ${Math.round(paginasEstimadas)} páginas). Divide en actos para analizar.`,
      'GUION_MUY_LARGO',
      undefined,
      {
        sugerencia: 'Los guiones muy largos pueden causar timeouts. Considera analizar por actos o secciones.',
        accion: 'Dividir guión',
        accionSecundaria: 'Analizar primeras 100 páginas'
      }
    );
  }

  let lastError: AnalisisError | null = null;

  // Retry logic
  for (let intento = 1; intento <= MAX_RETRIES; intento++) {
    try {
      onProgress?.(
        intento === 1 
          ? 'Iniciando análisis del guión...' 
          : `Reintentando análisis (${intento}/${MAX_RETRIES})...`,
        intento
      );

      const response = await llamarEdgeFunctionConTimeout(texto, TIMEOUT_MS);

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
