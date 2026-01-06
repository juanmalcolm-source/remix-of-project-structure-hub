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
    const maxLength = 50000;
    const textoTruncado = texto.length > maxLength 
      ? texto.substring(0, maxLength) + '\n\n[TEXTO TRUNCADO POR LONGITUD]' 
      : texto;

    const systemPrompt = `Eres un experto en análisis de guiones cinematográficos.
Analiza el guión y devuelve SOLO un JSON válido con esta estructura exacta:

{
  "informacion_general": {
    "titulo": "string",
    "genero": "string", 
    "duracion_estimada_minutos": number,
    "paginas_totales": number,
    "paginas_dialogo": number,
    "paginas_accion": number
  },
  "personajes": [
    {
      "nombre": "string (EN MAYÚSCULAS)",
      "categoria": "PROTAGONISTA|PRINCIPAL|SECUNDARIO|FIGURACION",
      "descripcion": "string",
      "genero": "Masculino|Femenino|No especificado",
      "edad_aproximada": "string",
      "primera_aparicion": "string",
      "escenas_aparicion": [numbers],
      "dias_rodaje_estimados": number,
      "dialogos_principales": boolean,
      "importancia_trama": "Alta|Media|Baja"
    }
  ],
  "localizaciones": [
    {
      "nombre": "string",
      "tipo": "INT|EXT",
      "momento_dia": "DÍA|NOCHE|ATARDECER|AMANECER",
      "descripcion": "string",
      "escenas": [numbers],
      "paginas_totales": number,
      "dias_rodaje_estimados": number,
      "complejidad": "Baja|Media|Alta",
      "necesidades_especiales": ["strings"]
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
      "complejidad_rodaje": "Baja|Media|Alta"
    }
  ],
  "resumen_produccion": {
    "total_personajes": {"protagonistas": 0, "principales": 0, "secundarios": 0, "figuracion": 0},
    "total_localizaciones": {"interiores": 0, "exteriores": 0},
    "dias_rodaje": {"estimacion_minima": 0, "estimacion_maxima": 0, "estimacion_recomendada": 0},
    "complejidad_general": "Baja|Media|Alta"
  }
}

IMPORTANTE: Devuelve SOLO el JSON, sin markdown ni explicaciones.`;

    console.log('Llamando a Lovable AI con GPT-5-mini...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analiza este guión:\n\n${textoTruncado}` }
        ],
        max_completion_tokens: 16000,
      }),
    });
    
    console.log('Respuesta recibida, status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de API:', response.status, errorText);
      
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
      
      throw new Error(`Error de API: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('Respuesta de IA recibida');
    
    // Check for errors in response
    if (aiResponse.error) {
      console.error('Error en respuesta:', JSON.stringify(aiResponse.error));
      throw new Error(aiResponse.error.message || 'Error del modelo de IA');
    }

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No se recibió contenido:', JSON.stringify(aiResponse));
      throw new Error('No se recibió respuesta del modelo');
    }

    console.log('Contenido recibido, longitud:', content.length);

    // Parse JSON from response
    let analisis;
    try {
      // Remove markdown code blocks if present
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
      console.error('Error parseando JSON:', parseError);
      console.error('Contenido recibido:', content.substring(0, 500));
      throw new Error('Error al parsear la respuesta del modelo');
    }
    
    console.log('Análisis completado');
    console.log('Personajes:', analisis.personajes?.length || 0);
    console.log('Localizaciones:', analisis.localizaciones?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        analisis,
        metadata: {
          modelo: 'openai/gpt-5-mini',
          proveedor: 'lovable-ai',
          timestamp: new Date().toISOString(),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

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
