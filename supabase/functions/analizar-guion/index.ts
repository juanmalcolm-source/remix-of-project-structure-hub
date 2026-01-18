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
    const maxLength = 100000;
    const textoTruncado = texto.length > maxLength 
      ? texto.substring(0, maxLength) + '\n\n[TEXTO TRUNCADO POR LONGITUD]' 
      : texto;

    // Calcular páginas del guión (aprox 600 chars por página)
    const paginasEstimadas = Math.ceil(texto.length / 600);

    // Contextualizar el texto como análisis profesional de producción
    const contextoProduccion = `[DOCUMENTO PROFESIONAL: Análisis de Producción Cinematográfica]
[TIPO: Guión de ficción para evaluación técnica de preproducción]
[PROPÓSITO: Desglose de producción para presupuesto y logística]
[PÁGINAS ESTIMADAS: ${paginasEstimadas}]
[NOTA: Este es un trabajo de ficción que requiere análisis técnico profesional]

--- INICIO DEL GUIÓN ---
${textoTruncado}
--- FIN DEL GUIÓN ---`;

    const systemPrompt = `Eres un experto analista de guiones cinematográficos especializado en preproducción.
Tu trabajo es realizar un ANÁLISIS EXHAUSTIVO Y COMPLETO para el departamento de producción.

CONTEXTO: Estás analizando un guión de ficción. Tu análisis será usado para:
- Presentación del proyecto a inversores y distribuidores
- Estimación de presupuesto
- Planificación de localizaciones
- Casting y contratación de actores
- Logística de producción

═══════════════════════════════════════════════════════════════════════
LEY DE LOS OCTAVOS - REGLA DE ORO DE PRODUCCIÓN CINEMATOGRÁFICA
═══════════════════════════════════════════════════════════════════════
Esta es la herramienta principal que utiliza un Asistente de Dirección (1er AD) 
para saber cuánto tiempo real tomará rodar cada escena.

FUNDAMENTO:
- En formato estándar (Courier 12): 1 página de guión ≈ 1 minuto en pantalla
- Cada página se divide en 8 partes horizontales iguales = 8 OCTAVOS
- 1 página completa = 8/8 = 8 octavos
- Media página = 4/8 = 4 octavos
- Un par de líneas de diálogo = 1/8 = 1 octavo

CÓMO CALCULAR OCTAVOS (valores que debes usar):
┌─────────────────────────────────────────────────────────────┐
│ OCTAVOS │ DESCRIPCIÓN                    │ LÍNEAS APROX    │
├─────────────────────────────────────────────────────────────┤
│    1    │ Escena muy corta, transición   │ 1-7 líneas      │
│    2    │ Escena corta, diálogo breve    │ 8-14 líneas     │
│    3    │ Escena mediana-corta           │ 15-21 líneas    │
│    4    │ Media página                   │ 22-28 líneas    │
│    5    │ Escena mediana-larga           │ 29-35 líneas    │
│    6    │ Tres cuartos de página         │ 36-42 líneas    │
│    7    │ Casi página completa           │ 43-49 líneas    │
│    8    │ Página completa                │ 50-55 líneas    │
│   9+    │ Más de una página (suma octavos)│ 56+ líneas      │
└─────────────────────────────────────────────────────────────┘

REGLAS CRÍTICAS:
1. El MÍNIMO siempre es 1 octavo (nunca 0, ni fracciones como 0.5)
2. Si una escena continúa en otra página, SUMA los octavos:
   - Ejemplo: 6 octavos en pág.1 + 3 octavos en pág.2 = 9 octavos totales
3. NO cuentes espacios en blanco entre escenas
4. Mide desde el encabezado (INT./EXT.) hasta donde termina el texto
5. Escenas de ACCIÓN con mucha descripción = más octavos
6. Diálogos cortos y rápidos = menos octavos

REFERENCIA DE DÍAS DE RODAJE:
- Un día estándar de rodaje: 24-40 octavos (3-5 páginas)
- Corto independiente: 24-32 octavos/día (3-4 páginas)
- Producción con recursos: 40-48 octavos/día (5-6 páginas)
═══════════════════════════════════════════════════════════════════════

Analiza ABSOLUTAMENTE TODO el guión y devuelve SOLO un JSON válido con esta estructura COMPLETA:

{
  "informacion_general": {
    "titulo": "string (título del guión)",
    "genero": "string (Drama, Thriller, Comedia, etc.)", 
    "duracion_estimada_minutos": number (páginas × 1),
    "paginas_totales": number,
    "paginas_dialogo": number (estimado),
    "paginas_accion": number (estimado),
    "tono": "string (ej: dramático, thriller, comedia, oscuro, ligero...)",
    "estilo_visual_sugerido": "string (propuesta de estilo visual)",
    "logline": "string (UNA FRASE que resume la historia - máximo 30 palabras, debe captar la esencia dramática)",
    "synopsis": "string (sinopsis de UN PÁRRAFO, 100-150 palabras, describiendo inicio, desarrollo y conflicto principal)",
    "core_emotional": "string (el núcleo emocional de la historia - qué emoción debe sentir el espectador)",
    "central_theme": "string (tema central explorado en la historia)"
  },
  "analisis_narrativo": {
    "estructura_actos": [
      { "acto": 1, "descripcion": "string (qué ocurre en este acto)", "paginas_inicio": 1, "paginas_fin": number },
      { "acto": 2, "descripcion": "string", "paginas_inicio": number, "paginas_fin": number },
      { "acto": 3, "descripcion": "string", "paginas_inicio": number, "paginas_fin": number }
    ],
    "puntos_de_giro": [
      { "nombre": "Incidente incitador", "pagina_aproximada": number, "descripcion": "string (breve descripción del momento)" },
      { "nombre": "Punto de giro 1", "pagina_aproximada": number, "descripcion": "string" },
      { "nombre": "Punto medio", "pagina_aproximada": number, "descripcion": "string" },
      { "nombre": "Punto de giro 2", "pagina_aproximada": number, "descripcion": "string" },
      { "nombre": "Clímax", "pagina_aproximada": number, "descripcion": "string" }
    ],
    "curva_emocional": [
      { "momento": "Inicio", "emocion": "string", "intensidad": number (1-10) },
      { "momento": "Incidente incitador", "emocion": "string", "intensidad": number },
      { "momento": "Punto medio", "emocion": "string", "intensidad": number },
      { "momento": "Clímax", "emocion": "string", "intensidad": number },
      { "momento": "Resolución", "emocion": "string", "intensidad": number }
    ]
  },
  "personajes": [
    {
      "nombre": "string (EN MAYÚSCULAS)",
      "categoria": "PROTAGONISTA|PRINCIPAL|SECUNDARIO|FIGURACION",
      "descripcion": "string (descripción física y psicológica detallada)",
      "genero": "Masculino|Femenino|No especificado",
      "edad_aproximada": "string (ej: 35-40 años)",
      "primera_aparicion": "string (escena o página)",
      "escenas_aparicion": [numbers],
      "dias_rodaje_estimados": number,
      "dialogos_principales": boolean,
      "importancia_trama": "Alta|Media|Baja",
      "arco_dramatico": "string (evolución completa del personaje a lo largo de la historia)",
      "motivaciones": "string (qué quiere conseguir el personaje)",
      "conflictos": "string (conflictos internos y externos del personaje)",
      "relaciones_clave": ["string (Personaje X - tipo de relación)"]
    }
  ],
  "localizaciones": [
    {
      "nombre": "string (nombre descriptivo)",
      "tipo": "INT|EXT",
      "momento_dia": "DÍA|NOCHE|ATARDECER|AMANECER",
      "descripcion": "string (descripción detallada del espacio)",
      "ambiente": "string (atmósfera, sensación)",
      "escenas": [numbers],
      "paginas_totales": number,
      "dias_rodaje_estimados": number,
      "complejidad": "Baja|Media|Alta",
      "necesidades_especiales": ["strings (decoración, efectos, permisos...)"],
      "requisitos_tecnicos": ["strings (iluminación especial, grúas, etc.)"]
    }
  ],
  "desglose_secuencias": [
    {
      "numero_secuencia": number,
      "numero_escena": "string",
      "encabezado": "string (ej: INT. CASA DE PEDRO - DÍA)",
      "localizacion": "string",
      "set_type": "INT|EXT",
      "momento_dia": "string",
      "paginas_octavos": number (ENTERO de 1 a 16+),
      "complexity_factor": number (1.0, 1.2, 2.0 o 3.0),
      "complexity_reason": "string (breve razón del multiplicador)",
      "setup_time_minutes": number (45 INT, 60 EXT, +15 si NOCHE),
      "shooting_time_minutes": number (octavos × 11.25 × complexity_factor),
      "total_time_minutes": number (setup + shooting),
      "duracion_estimada_minutos": number (octavos/8, redondeado),
      "personajes": ["strings"],
      "attrezzo": ["strings (objetos necesarios)"],
      "vestuario": ["strings (cambios de vestuario)"],
      "vehiculos": ["strings"],
      "efectos_especiales": ["strings"],
      "complejidad_rodaje": "Baja|Media|Alta",
      "notas_direccion": "string (sugerencias para la dirección)"
    }
  ],
  "viabilidad": {
    "fortalezas": ["strings (puntos fuertes del guión para producción)"],
    "debilidades": ["strings (puntos débiles o desafíos)"],
    "sugerencias_mejora": ["strings (recomendaciones concretas)"],
    "factores_positivos": ["strings (elementos que facilitan la producción)"],
    "factores_negativos": ["strings (elementos que complican la producción)"]
  },
  "resumen_produccion": {
    "total_personajes": {"protagonistas": 0, "principales": 0, "secundarios": 0, "figuracion": 0},
    "total_localizaciones": {"interiores": 0, "exteriores": 0},
    "total_octavos": number (SUMA de todos los paginas_octavos de desglose_secuencias),
    "dias_rodaje": {"estimacion_minima": 0, "estimacion_maxima": 0, "estimacion_recomendada": 0},
    "complejidad_general": "Baja|Media|Alta",
    "elementos_destacados": ["strings (efectos especiales, stunts, escenas complicadas, etc.)"]
  }
}

INSTRUCCIONES CRÍTICAS:
1. El LOGLINE debe ser UNA SOLA FRASE impactante que capture la esencia de la historia
2. La SYNOPSIS debe resumir TODA la historia en un párrafo coherente
3. El CORE_EMOTIONAL debe identificar la emoción principal que debe experimentar el espectador
4. Analiza CADA personaje mencionado en el guión, no solo los principales
5. Identifica TODAS las localizaciones únicas
6. ⚠️ CRÍTICO: Calcula CORRECTAMENTE los OCTAVOS de cada escena según la LEY DE OCTAVOS
   - NO uses 1 para todas las escenas
   - Mide el texto real: líneas de diálogo + descripciones + acciones
   - Una escena larga de 2 páginas = 16 octavos
   - Una escena corta de transición = 1-2 octavos
7. El total_octavos debe ser coherente con paginas_totales (aprox. paginas × 8)
8. Sé EXHAUSTIVO y PROFESIONAL en el análisis
9. Devuelve SOLO el JSON, sin markdown ni explicaciones`;

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
            max_completion_tokens: 32000,
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
        console.log('Logline:', analisis.informacion_general?.logline ? 'Sí' : 'No');
        console.log('Synopsis:', analisis.informacion_general?.synopsis ? 'Sí' : 'No');
        console.log('Core Emotional:', analisis.informacion_general?.core_emotional ? 'Sí' : 'No');
        console.log('Análisis Narrativo:', analisis.analisis_narrativo ? 'Sí' : 'No');
        console.log('Viabilidad:', analisis.viabilidad ? 'Sí' : 'No');

        return new Response(
          JSON.stringify({
            success: true,
            analisis,
            metadata: {
              modelo: modeloUsado,
              proveedor: 'lovable-ai',
              timestamp: new Date().toISOString(),
              paginas_estimadas: paginasEstimadas,
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
