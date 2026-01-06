import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto } = await req.json();
    
    if (!texto || texto.trim().length === 0) {
      throw new Error('No se proporcionó texto del guión');
    }

    console.log('Analizando guión con Lovable AI (Gemini)...');
    console.log('Longitud del texto:', texto.length);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no está configurada');
    }

    // Definir el schema para extracción estructurada (formato Lovable AI / tool calling)
    const analysisSchema = {
      type: "function",
      function: {
        name: "analizar_guion_cinematografico",
        description: "Analiza un guión cinematográfico y extrae información estructurada completa para desglose de producción",
        parameters: {
          type: "object",
          properties: {
            informacion_general: {
              type: "object",
              properties: {
                titulo: { type: "string", description: "Título de la película (si está indicado, sino 'Sin título')" },
                genero: { type: "string", description: "Género identificado del guión" },
                duracion_estimada_minutos: { type: "number", description: "Número basado en páginas, aprox 1 pág = 1 min" },
                paginas_totales: { type: "number", description: "Número de páginas estimadas" },
                paginas_dialogo: { type: "number", description: "Estimación páginas con diálogo" },
                paginas_accion: { type: "number", description: "Estimación páginas de acción" }
              },
              required: ["titulo", "genero", "duracion_estimada_minutos", "paginas_totales", "paginas_dialogo", "paginas_accion"]
            },
            personajes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nombre: { type: "string", description: "NOMBRE DEL PERSONAJE" },
                  categoria: { 
                    type: "string", 
                    enum: ["PROTAGONISTA", "PRINCIPAL", "SECUNDARIO", "FIGURACION"],
                    description: "Categoría del personaje" 
                  },
                  descripcion: { type: "string", description: "Descripción física y edad si se menciona" },
                  genero: { 
                    type: "string",
                    enum: ["Masculino", "Femenino", "No especificado"],
                    description: "Género del personaje"
                  },
                  edad_aproximada: { type: "string", description: "Rango de edad" },
                  primera_aparicion: { type: "string", description: "Número de secuencia o página" },
                  escenas_aparicion: { 
                    type: "array",
                    items: { type: "number" },
                    description: "Lista de números de escena donde aparece"
                  },
                  dias_rodaje_estimados: { type: "number", description: "Número estimado de días" },
                  dialogos_principales: { type: "boolean", description: "Si tiene diálogos principales" },
                  importancia_trama: {
                    type: "string",
                    enum: ["Alta", "Media", "Baja"],
                    description: "Importancia en la trama"
                  }
                },
                required: ["nombre", "categoria", "descripcion", "genero", "edad_aproximada", "primera_aparicion", "escenas_aparicion", "dias_rodaje_estimados", "dialogos_principales", "importancia_trama"]
              }
            },
            localizaciones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nombre: { type: "string", description: "NOMBRE DE LA LOCALIZACIÓN" },
                  tipo: { 
                    type: "string", 
                    enum: ["INT", "EXT"],
                    description: "Tipo de localización" 
                  },
                  momento_dia: { 
                    type: "string",
                    enum: ["DÍA", "NOCHE", "ATARDECER", "AMANECER"],
                    description: "Momento del día"
                  },
                  descripcion: { type: "string", description: "Descripción detallada del espacio" },
                  escenas: { 
                    type: "array",
                    items: { type: "number" },
                    description: "Lista de números de escena"
                  },
                  paginas_totales: { type: "number", description: "Suma de octavos" },
                  dias_rodaje_estimados: { type: "number", description: "Número de días" },
                  complejidad: {
                    type: "string",
                    enum: ["Baja", "Media", "Alta"],
                    description: "Complejidad de rodaje"
                  },
                  necesidades_especiales: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de requerimientos técnicos"
                  }
                },
                required: ["nombre", "tipo", "momento_dia", "descripcion", "escenas", "paginas_totales", "dias_rodaje_estimados", "complejidad", "necesidades_especiales"]
              }
            },
            desglose_secuencias: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  numero_secuencia: { type: "number", description: "Número de secuencia" },
                  numero_escena: { type: "string", description: "Número de escena" },
                  encabezado: { type: "string", description: "Encabezado completo (INT/EXT. LOCACIÓN - MOMENTO)" },
                  localizacion: { type: "string", description: "Localización" },
                  momento_dia: { type: "string", description: "Momento del día" },
                  paginas_octavos: { type: "number", description: "Páginas en octavos (1 página = 8/8)" },
                  personajes: { 
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de personajes"
                  },
                  attrezzo: { 
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de attrezzo/utilería"
                  },
                  vestuario: {
                    type: "array",
                    items: { type: "string" },
                    description: "Descripción vestuario personajes"
                  },
                  vehiculos: {
                    type: "array",
                    items: { type: "string" },
                    description: "Vehículos si hay"
                  },
                  efectos_especiales: {
                    type: "array",
                    items: { type: "string" },
                    description: "Efectos especiales si hay"
                  },
                  complejidad_rodaje: {
                    type: "string",
                    enum: ["Baja", "Media", "Alta"],
                    description: "Complejidad de rodaje"
                  }
                },
                required: ["numero_secuencia", "numero_escena", "encabezado", "localizacion", "momento_dia", "paginas_octavos", "personajes", "attrezzo", "vestuario", "vehiculos", "efectos_especiales", "complejidad_rodaje"]
              }
            },
            resumen_produccion: {
              type: "object",
              properties: {
                total_personajes: {
                  type: "object",
                  properties: {
                    protagonistas: { type: "number" },
                    principales: { type: "number" },
                    secundarios: { type: "number" },
                    figuracion: { type: "number" }
                  },
                  required: ["protagonistas", "principales", "secundarios", "figuracion"]
                },
                total_localizaciones: {
                  type: "object",
                  properties: {
                    interiores: { type: "number" },
                    exteriores: { type: "number" }
                  },
                  required: ["interiores", "exteriores"]
                },
                dias_rodaje: {
                  type: "object",
                  properties: {
                    estimacion_minima: { type: "number" },
                    estimacion_maxima: { type: "number" },
                    estimacion_recomendada: { type: "number" }
                  },
                  required: ["estimacion_minima", "estimacion_maxima", "estimacion_recomendada"]
                },
                complejidad_general: {
                  type: "string",
                  enum: ["Baja", "Media", "Alta"],
                  description: "Complejidad general de producción"
                }
              },
              required: ["total_personajes", "total_localizaciones", "dias_rodaje", "complejidad_general"]
            }
          },
          required: ["informacion_general", "personajes", "localizaciones", "desglose_secuencias", "resumen_produccion"],
          additionalProperties: false
        }
      }
    };

    const systemPrompt = `Eres un experto en análisis de guiones cinematográficos y planificación de producción.

Tu tarea es analizar el siguiente guión y extraer información estructurada para generar un desglose de producción completo.

IMPORTANTE:
- Sé preciso con los nombres de personajes (usa mayúsculas como aparecen en el guión)
- Identifica TODOS los personajes, incluso los que solo aparecen una vez
- Para calcular octavos: 1 página = 8/8, media página = 4/8
- Categoriza personajes según líneas de diálogo y presencia en trama
- NO inventes información que no esté en el guión
- Si algo no está claro, marca como "No especificado"
- Identifica TODAS las localizaciones con sus características exactas
- Extrae TODO el attrezzo y elementos de vestuario mencionados
- Sé exhaustivo en el desglose secuencia por secuencia`;

    // Llamar a Lovable AI Gateway (usa Google Gemini 2.0 Flash)
    console.log('Llamando a Lovable AI...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Modelo predeterminado de Lovable AI
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analiza este guión cinematográfico:\n\n${texto}` }
        ],
        tools: [analysisSchema],
        tool_choice: { type: "function", function: { name: "analizar_guion_cinematografico" } }
      }),
    });
    
    console.log('Respuesta de Lovable AI recibida, status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de Lovable AI:', response.status);
      console.error('Detalles del error:', errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Límite de solicitudes de Lovable AI excedido. Por favor, intenta de nuevo en unos momentos o verifica tu plan.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Créditos de Lovable AI insuficientes. Por favor, añade créditos a tu workspace.' 
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Error de Lovable AI (${response.status}): ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log('Respuesta de IA recibida');

    // Extraer los argumentos del tool call (formato OpenAI/Lovable AI)
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      console.error('No se recibió tool call:', JSON.stringify(aiResponse));
      throw new Error('No se pudo obtener el análisis estructurado del guión');
    }

    const analisis = JSON.parse(toolCall.function.arguments);
    
    console.log('Análisis completado exitosamente');
    console.log('Personajes encontrados:', analisis.personajes?.length || 0);
    console.log('Localizaciones encontradas:', analisis.localizaciones?.length || 0);
    console.log('Secuencias encontradas:', analisis.desglose_secuencias?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        analisis: analisis,
        metadata: {
          modelo: 'google/gemini-2.5-flash',
          proveedor: 'lovable-ai',
          timestamp: new Date().toISOString(),
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error en analizar-guion:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al analizar el guión';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
