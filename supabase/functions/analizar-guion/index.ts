import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto } = await req.json();
    
    if (!texto || texto.trim().length === 0) {
      throw new Error('No se proporcionó texto del guión');
    }

    console.log('Analizando guión con Lovable AI...');
    console.log('Longitud del texto:', texto.length);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no está configurada');
    }

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
                titulo: { type: "string" },
                genero: { type: "string" },
                duracion_estimada_minutos: { type: "number" },
                paginas_totales: { type: "number" },
                paginas_dialogo: { type: "number" },
                paginas_accion: { type: "number" }
              },
              required: ["titulo", "genero", "duracion_estimada_minutos", "paginas_totales", "paginas_dialogo", "paginas_accion"]
            },
            personajes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nombre: { type: "string" },
                  categoria: { type: "string", enum: ["PROTAGONISTA", "PRINCIPAL", "SECUNDARIO", "FIGURACION"] },
                  descripcion: { type: "string" },
                  genero: { type: "string", enum: ["Masculino", "Femenino", "No especificado"] },
                  edad_aproximada: { type: "string" },
                  primera_aparicion: { type: "string" },
                  escenas_aparicion: { type: "array", items: { type: "number" } },
                  dias_rodaje_estimados: { type: "number" },
                  dialogos_principales: { type: "boolean" },
                  importancia_trama: { type: "string", enum: ["Alta", "Media", "Baja"] }
                },
                required: ["nombre", "categoria", "descripcion", "genero", "edad_aproximada", "primera_aparicion", "escenas_aparicion", "dias_rodaje_estimados", "dialogos_principales", "importancia_trama"]
              }
            },
            localizaciones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nombre: { type: "string" },
                  tipo: { type: "string", enum: ["INT", "EXT"] },
                  momento_dia: { type: "string", enum: ["DÍA", "NOCHE", "ATARDECER", "AMANECER"] },
                  descripcion: { type: "string" },
                  escenas: { type: "array", items: { type: "number" } },
                  paginas_totales: { type: "number" },
                  dias_rodaje_estimados: { type: "number" },
                  complejidad: { type: "string", enum: ["Baja", "Media", "Alta"] },
                  necesidades_especiales: { type: "array", items: { type: "string" } }
                },
                required: ["nombre", "tipo", "momento_dia", "descripcion", "escenas", "paginas_totales", "dias_rodaje_estimados", "complejidad", "necesidades_especiales"]
              }
            },
            desglose_secuencias: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  numero_secuencia: { type: "number" },
                  numero_escena: { type: "string" },
                  encabezado: { type: "string" },
                  localizacion: { type: "string" },
                  momento_dia: { type: "string" },
                  paginas_octavos: { type: "number" },
                  personajes: { type: "array", items: { type: "string" } },
                  attrezzo: { type: "array", items: { type: "string" } },
                  vestuario: { type: "array", items: { type: "string" } },
                  vehiculos: { type: "array", items: { type: "string" } },
                  efectos_especiales: { type: "array", items: { type: "string" } },
                  complejidad_rodaje: { type: "string", enum: ["Baja", "Media", "Alta"] }
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
                complejidad_general: { type: "string", enum: ["Baja", "Media", "Alta"] }
              },
              required: ["total_personajes", "total_localizaciones", "dias_rodaje", "complejidad_general"]
            }
          },
          required: ["informacion_general", "personajes", "localizaciones", "desglose_secuencias", "resumen_produccion"],
          additionalProperties: false
        }
      }
    };

    const systemPrompt = `Eres un experto en análisis de guiones cinematográficos profesional.

Tu tarea es analizar el guión proporcionado y extraer información estructurada para producción.

REGLAS:
- Usa los nombres de personajes EXACTAMENTE como aparecen en el guión (en mayúsculas)
- Identifica TODOS los personajes, incluso figurantes
- 1 página = 8/8 octavos, media página = 4/8
- Categoriza personajes por importancia en la trama
- NO inventes información
- Si algo no está claro, marca "No especificado"
- Extrae TODO: attrezzo, vestuario, vehículos, efectos`;

    // Try with different models as fallback
    const models = ['openai/gpt-5-mini', 'google/gemini-2.5-flash'];
    let lastError: Error | null = null;

    for (const model of models) {
      try {
        console.log(`Intentando con modelo: ${model}`);
        
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Analiza este guión cinematográfico:\n\n${texto}` }
            ],
            tools: [analysisSchema],
            tool_choice: { type: "function", function: { name: "analizar_guion_cinematografico" } }
          }),
        });
        
        console.log(`Respuesta de ${model}, status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error de ${model}:`, response.status, errorText);
          
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ success: false, error: 'Límite de solicitudes excedido. Intenta de nuevo en unos momentos.' }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ success: false, error: 'Créditos insuficientes. Añade créditos a tu workspace.' }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          lastError = new Error(`Error de ${model}: ${response.status}`);
          continue; // Try next model
        }

        const aiResponse = await response.json();
        
        // Check for content moderation errors in the response body
        if (aiResponse.error) {
          console.error(`Error en respuesta de ${model}:`, JSON.stringify(aiResponse.error));
          if (aiResponse.error.message?.includes('PROHIBITED_CONTENT')) {
            console.log('Contenido bloqueado por filtro de seguridad, probando siguiente modelo...');
            lastError = new Error('Contenido bloqueado por el filtro de seguridad del modelo');
            continue; // Try next model
          }
          lastError = new Error(aiResponse.error.message || 'Error desconocido');
          continue;
        }

        const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall || !toolCall.function?.arguments) {
          console.error(`No se recibió tool call de ${model}:`, JSON.stringify(aiResponse));
          lastError = new Error('No se recibió análisis estructurado');
          continue; // Try next model
        }

        const analisis = JSON.parse(toolCall.function.arguments);
        
        console.log('Análisis completado con:', model);
        console.log('Personajes:', analisis.personajes?.length || 0);
        console.log('Localizaciones:', analisis.localizaciones?.length || 0);
        console.log('Secuencias:', analisis.desglose_secuencias?.length || 0);

        return new Response(
          JSON.stringify({
            success: true,
            analisis,
            metadata: {
              modelo: model,
              proveedor: 'lovable-ai',
              timestamp: new Date().toISOString(),
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

      } catch (modelError) {
        console.error(`Error con modelo ${model}:`, modelError);
        lastError = modelError instanceof Error ? modelError : new Error('Error desconocido');
        continue; // Try next model
      }
    }

    // All models failed
    throw lastError || new Error('No se pudo analizar el guión con ningún modelo disponible');

  } catch (error) {
    console.error('Error en analizar-guion:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al analizar el guión',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
