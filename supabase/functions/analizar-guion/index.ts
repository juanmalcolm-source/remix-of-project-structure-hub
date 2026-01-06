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

    console.log('Analizando guión...');
    console.log('Longitud del texto:', texto.length);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no está configurada');
    }

    // Truncar texto si es muy largo para evitar timeouts
    const maxLength = 80000;
    const textoTruncado = texto.length > maxLength 
      ? texto.substring(0, maxLength) + '\n\n[TEXTO TRUNCADO POR LONGITUD]' 
      : texto;

    // Contextualizar el texto como análisis profesional de producción
    const contextoProduccion = `[DOCUMENTO PROFESIONAL: Análisis de Producción Cinematográfica]
[TIPO: Guión de ficción para evaluación técnica de preproducción]
[PROPÓSITO: Desglose de producción para presupuesto y logística]
[NOTA: Este es un trabajo de ficción que requiere análisis técnico profesional]

--- INICIO DEL GUIÓN ---
${textoTruncado}
--- FIN DEL GUIÓN ---`;

    const systemPrompt = `Eres un experto analista de guiones cinematográficos especializado en preproducción.
Tu trabajo es realizar un DESGLOSE TÉCNICO PROFESIONAL para el departamento de producción.

CONTEXTO: Estás analizando un guión de ficción para planificación de rodaje. Tu análisis será usado para:
- Estimación de presupuesto
- Planificación de localizaciones
- Casting y contratación de actores
- Logística de producción

Analiza CADA DETALLE del guión y devuelve SOLO un JSON válido con esta estructura:

{
  "informacion_general": {
    "titulo": "string",
    "genero": "string", 
    "duracion_estimada_minutos": number,
    "paginas_totales": number,
    "paginas_dialogo": number,
    "paginas_accion": number,
    "tono": "string (ej: dramático, thriller, comedia...)",
    "estilo_visual_sugerido": "string"
  },
  "personajes": [
    {
      "nombre": "string (EN MAYÚSCULAS)",
      "categoria": "PROTAGONISTA|PRINCIPAL|SECUNDARIO|FIGURACION",
      "descripcion": "string (descripción física y psicológica)",
      "genero": "Masculino|Femenino|No especificado",
      "edad_aproximada": "string",
      "primera_aparicion": "string",
      "escenas_aparicion": [numbers],
      "dias_rodaje_estimados": number,
      "dialogos_principales": boolean,
      "importancia_trama": "Alta|Media|Baja",
      "arco_dramatico": "string (evolución del personaje)",
      "motivaciones": "string",
      "relaciones_clave": ["strings"]
    }
  ],
  "localizaciones": [
    {
      "nombre": "string",
      "tipo": "INT|EXT",
      "momento_dia": "DÍA|NOCHE|ATARDECER|AMANECER",
      "descripcion": "string (detallada)",
      "ambiente": "string (atmósfera, sensación)",
      "escenas": [numbers],
      "paginas_totales": number,
      "dias_rodaje_estimados": number,
      "complejidad": "Baja|Media|Alta",
      "necesidades_especiales": ["strings"],
      "requisitos_tecnicos": ["strings"]
    }
  ],
  "desglose_secuencias": [
    {
      "numero_secuencia": number,
      "numero_escena": "string",
      "encabezado": "string",
      "localizacion": "string",
      "momento_dia": "string",
      "paginas_octavos": number,
      "personajes": ["strings"],
      "attrezzo": ["strings"],
      "vestuario": ["strings"],
      "vehiculos": ["strings"],
      "efectos_especiales": ["strings"],
      "complejidad_rodaje": "Baja|Media|Alta",
      "notas_direccion": "string"
    }
  ],
  "resumen_produccion": {
    "total_personajes": {"protagonistas": 0, "principales": 0, "secundarios": 0, "figuracion": 0},
    "total_localizaciones": {"interiores": 0, "exteriores": 0},
    "dias_rodaje": {"estimacion_minima": 0, "estimacion_maxima": 0, "estimacion_recomendada": 0},
    "complejidad_general": "Baja|Media|Alta",
    "elementos_destacados": ["strings (efectos especiales, stunts, etc.)"]
  }
}

IMPORTANTE: 
- Analiza CADA palabra del guión con detalle profesional
- Devuelve SOLO el JSON, sin markdown ni explicaciones
- Sé exhaustivo en el desglose de elementos de producción`;

    // Modelos a intentar en orden de preferencia
    const modelos = [
      { id: 'google/gemini-2.5-pro', nombre: 'Gemini Pro' },
      { id: 'google/gemini-2.5-flash', nombre: 'Gemini Flash' },
      { id: 'openai/gpt-5-mini', nombre: 'GPT-5 Mini' }
    ];

    let ultimoError = '';
    let modeloUsado = '';

    for (const modelo of modelos) {
      try {
        console.log(`Intentando análisis con ${modelo.nombre}...`);
        
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelo.id,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: contextoProduccion }
            ],
            max_completion_tokens: 16000,
          }),
        });
        
        console.log(`${modelo.nombre} - Status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`${modelo.nombre} - Error:`, response.status, errorText);
          
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
          
          ultimoError = `${modelo.nombre}: Error ${response.status}`;
          continue;
        }

        const aiResponse = await response.json();
        
        // Verificar si hay errores en la respuesta (ej: PROHIBITED_CONTENT)
        if (aiResponse.error) {
          console.error(`${modelo.nombre} - Error en respuesta:`, JSON.stringify(aiResponse.error));
          ultimoError = `${modelo.nombre}: ${aiResponse.error.message || 'Error del modelo'}`;
          continue;
        }

        // Verificar si el modelo rechazó el contenido
        const finishReason = aiResponse.choices?.[0]?.finish_reason;
        if (finishReason === 'content_filter' || finishReason === 'safety') {
          console.log(`${modelo.nombre} - Contenido filtrado, probando siguiente modelo...`);
          ultimoError = `${modelo.nombre}: Filtro de contenido activado`;
          continue;
        }

        const content = aiResponse.choices?.[0]?.message?.content;
        if (!content) {
          console.error(`${modelo.nombre} - Sin contenido:`, JSON.stringify(aiResponse));
          ultimoError = `${modelo.nombre}: Sin respuesta`;
          continue;
        }

        console.log(`${modelo.nombre} - Contenido recibido, longitud:`, content.length);

        // Parse JSON from response
        let analisis;
        try {
          let jsonStr = content.trim();
          if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.slice(7);
          } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.slice(3);
          }
          if (jsonStr.endsWith('```')) {
            jsonStr = jsonStr.slice(0, -3);
          }
          jsonStr = jsonStr.trim();
          
          analisis = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error(`${modelo.nombre} - Error parseando JSON:`, parseError);
          console.error('Contenido:', content.substring(0, 500));
          ultimoError = `${modelo.nombre}: Error parseando respuesta`;
          continue;
        }
        
        modeloUsado = modelo.id;
        console.log(`✓ Análisis completado con ${modelo.nombre}`);
        console.log('Personajes:', analisis.personajes?.length || 0);
        console.log('Localizaciones:', analisis.localizaciones?.length || 0);

        return new Response(
          JSON.stringify({
            success: true,
            analisis,
            metadata: {
              modelo: modeloUsado,
              proveedor: 'lovable-ai',
              timestamp: new Date().toISOString(),
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

      } catch (error) {
        console.error(`${modelo.nombre} - Excepción:`, error);
        ultimoError = `${modelo.nombre}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        continue;
      }
    }

    // Si llegamos aquí, ningún modelo funcionó
    throw new Error(`No se pudo analizar el guión. Último error: ${ultimoError}`);

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
