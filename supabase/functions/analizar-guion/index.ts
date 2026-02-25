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
    const contextoProduccion = `[DOCUMENTO PROFESIONAL: Análisis Integral de Guión Cinematográfico]
[TIPO: Guión de ficción para evaluación narrativa + técnica de preproducción]
[PROPÓSITO: Análisis narrativo profundo + desglose de producción + evaluación de mercado]
[PÁGINAS ESTIMADAS: ${paginasEstimadas}]
[NOTA: Este es un trabajo de ficción que requiere análisis técnico y narrativo profesional]

--- INICIO DEL GUIÓN ---
${textoTruncado}
--- FIN DEL GUIÓN ---`;

    const systemPrompt = `Eres un ANALISTA EXPERTO de guiones cinematográficos con triple especialización:
1. SCRIPT DOCTOR — Detectas problemas narrativos, errores de estructura, inconsistencias y sugieres correcciones
2. DIRECTOR DE PRODUCCIÓN — Realizas desgloses profesionales para presupuesto y logística
3. ESTRATEGA DE MERCADO — Evalúas potencial de festivales, audiencia y distribución

Tu análisis será usado para:
- Mejorar el guión antes de producción (como un script doctor profesional)
- Presentación a inversores, distribuidores y comités de selección de festivales
- Estimación de presupuesto y planificación de producción
- Diseño de estrategia de audiencia y distribución
- Solicitudes de ayudas públicas (ICAA, Eurimages, Ibermedia, MEDIA)

═══════════════════════════════════════════════════════════════════════
SECCIÓN 1: LEY DE LOS OCTAVOS - PRODUCCIÓN
═══════════════════════════════════════════════════════════════════════
- 1 página de guión ≈ 1 minuto en pantalla
- Cada página = 8 OCTAVOS
- Calcula octavos por escena según el texto real (NO uses 1 para todas)

CÁLCULO DE COMPLEJIDAD POR ESCENA (15 factores):
- num_personajes: +1 punto por cada personaje extra después de 2
- movimiento_camara: +2 / accion_fisica: +3 / stunts: +10
- efectos_especiales: +5 / ninos: +3 / animales: +3
- vehiculos_movimiento: +5 / coordinacion_extras: +1 por cada 5
- iluminacion_compleja: +2 / escena_noche: +2 / exteriores_clima: +2
- dialogo_extenso: +1 / requiere_grua: +3 / planos_especiales: +2
- Score: <10=Baja, 10-25=Media, >25=Alta

═══════════════════════════════════════════════════════════════════════
SECCIÓN 2: ANÁLISIS NARRATIVO PROFUNDO (SCRIPT DOCTOR)
═══════════════════════════════════════════════════════════════════════
Analiza como un script doctor profesional:

A) ERRORES NARRATIVOS: Busca activamente:
   - Plot holes (información contradictoria o faltante)
   - Inconsistencias de personaje (actúa fuera de su lógica)
   - Problemas de ritmo (escenas que sobran, transiciones bruscas)
   - Diálogos expositivos o artificiales
   - Resoluciones deus ex machina
   - Subtramas abandonadas
   - Personajes sin función narrativa clara

B) MAPA DE CONFLICTOS:
   - Conflicto principal: tipo, detonante, desarrollo, resolución
   - Conflictos secundarios
   - Conflictos internos de cada personaje relevante
   - Mapa de tensión escena por escena

C) ANÁLISIS DE RITMO/PACING:
   - Equilibrio diálogo vs acción
   - Secciones que pierden ritmo
   - Secciones que van demasiado rápido

D) ANÁLISIS TEMÁTICO:
   - Temas principales y secundarios
   - Simbolismos encontrados
   - Mensaje universal

E) PERSONAJES EN PROFUNDIDAD:
   - Necesidad dramática (qué necesita, no qué quiere)
   - Flaw principal (defecto que debe superar)
   - Ghost (herida del pasado)
   - Transformación (inicio → fin)
   - Stakes (qué pierde si falla)
   - Función narrativa (mentor, sombra, heraldo, etc.)

═══════════════════════════════════════════════════════════════════════
SECCIÓN 3: ANÁLISIS DAFO + MERCADO
═══════════════════════════════════════════════════════════════════════
Evalúa el guión como un productor experimentado:

A) DAFO:
   - Fortalezas: qué tiene el guión que lo hace especial
   - Debilidades: qué problemas narrativos o de producción tiene
   - Oportunidades: tendencias de mercado, festivales afines, nichos
   - Amenazas: competencia, saturación de género, dificultades

B) SCORING:
   - score_narrativo (0-100): calidad del guión como obra
   - score_comercial (0-100): potencial comercial
   - score_festival (0-100): potencial para circuito de festivales

C) AUDIENCIA Y MERCADO:
   - Perfiles de audiencia sugeridos (2-3 segmentos)
   - Territorios principales de interés
   - Películas/series comparables
   - Festivales sugeridos según género/temática
   - Plataformas potenciales

Devuelve SOLO un JSON válido con esta estructura COMPLETA:

{
  "informacion_general": {
    "titulo": "string",
    "genero": "string",
    "subgeneros": ["string"],
    "duracion_estimada_minutos": number,
    "paginas_totales": number,
    "paginas_dialogo": number,
    "paginas_accion": number,
    "tono": "string",
    "estilo_visual_sugerido": "string",
    "logline": "string (UNA FRASE, máx 30 palabras)",
    "synopsis": "string (UN PÁRRAFO, 100-150 palabras)",
    "core_emotional": "string",
    "central_theme": "string",
    "temas_secundarios": ["string"],
    "referentes_cinematograficos": ["string (3-5 películas similares)"],
    "publico_objetivo_sugerido": "string",
    "potencial_festival": "Alto|Medio|Bajo",
    "potencial_comercial": "Alto|Medio|Bajo"
  },
  "analisis_narrativo": {
    "estructura_actos": [
      { "acto": 1, "descripcion": "string", "paginas_inicio": 1, "paginas_fin": number },
      { "acto": 2, "descripcion": "string", "paginas_inicio": number, "paginas_fin": number },
      { "acto": 3, "descripcion": "string", "paginas_inicio": number, "paginas_fin": number }
    ],
    "puntos_de_giro": [
      { "nombre": "Incidente incitador", "pagina_aproximada": number, "descripcion": "string" },
      { "nombre": "Punto de giro 1", "pagina_aproximada": number, "descripcion": "string" },
      { "nombre": "Punto medio", "pagina_aproximada": number, "descripcion": "string" },
      { "nombre": "Punto de giro 2", "pagina_aproximada": number, "descripcion": "string" },
      { "nombre": "Clímax", "pagina_aproximada": number, "descripcion": "string" }
    ],
    "curva_emocional": [
      { "momento": "string", "emocion": "string", "intensidad": number }
    ],
    "errores_narrativos": [
      {
        "tipo": "plot_hole|inconsistencia|ritmo|personaje|dialogo|estructura|logica",
        "gravedad": "critico|importante|menor|sugerencia",
        "ubicacion": "string (escena o página)",
        "pagina_aproximada": number,
        "descripcion": "string (qué falla)",
        "sugerencia_correccion": "string (cómo arreglarlo)"
      }
    ],
    "conflictos": {
      "conflicto_principal": {
        "tipo": "persona_vs_persona|persona_vs_sociedad|persona_vs_naturaleza|persona_vs_si_mismo|persona_vs_destino|persona_vs_tecnologia",
        "descripcion": "string",
        "personajes_involucrados": ["string"],
        "detonante": "string",
        "desarrollo": "string",
        "resolucion": "string",
        "resuelto": boolean
      },
      "conflictos_secundarios": [{ "...mismo formato..." }],
      "conflictos_internos": [
        { "personaje": "string", "conflicto": "string", "manifestacion": "string", "evolucion": "string" }
      ],
      "mapa_tensiones": [
        { "pagina_aproximada": number, "nivel_tension": number, "descripcion": "string", "conflicto_asociado": "string" }
      ]
    },
    "ritmo": {
      "ritmo_general": "lento|moderado|rapido|variable",
      "observaciones": "string",
      "secciones_lentas": [{ "paginas": "string", "descripcion": "string", "sugerencia": "string" }],
      "secciones_rapidas": [{ "paginas": "string", "descripcion": "string", "sugerencia": "string" }],
      "equilibrio_dialogo_accion": "string"
    },
    "tematica": {
      "tema_principal": { "nombre": "string", "descripcion": "string", "como_se_desarrolla": "string", "escenas_clave": ["string"] },
      "temas_secundarios": [{ "nombre": "string", "descripcion": "string", "como_se_desarrolla": "string", "escenas_clave": ["string"] }],
      "simbolismos": [{ "elemento": "string", "significado": "string", "apariciones": ["string"] }],
      "mensaje_universal": "string"
    }
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
      "importancia_trama": "Alta|Media|Baja",
      "arco_dramatico": "string (evolución completa)",
      "motivaciones": "string",
      "conflictos": "string",
      "relaciones_clave": ["string"],
      "necesidad_dramatica": "string (qué necesita realmente)",
      "flaw_principal": "string (defecto/debilidad)",
      "transformacion": "string (de X a Y)",
      "ghost": "string (herida del pasado)",
      "stakes": "string (qué pierde si falla)",
      "funcion_narrativa": "string (mentor, sombra, heraldo, etc.)"
    }
  ],
  "localizaciones": [
    {
      "nombre": "string",
      "tipo": "INT|EXT",
      "momento_dia": "DÍA|NOCHE|ATARDECER|AMANECER",
      "descripcion": "string",
      "ambiente": "string",
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
      "set_type": "INT|EXT",
      "momento_dia": "string",
      "paginas_octavos": number,
      "complexity_factor": number,
      "complexity_reason": "string",
      "setup_time_minutes": number,
      "shooting_time_minutes": number,
      "total_time_minutes": number,
      "duracion_estimada_minutos": number,
      "personajes": ["strings"],
      "attrezzo": ["strings"],
      "vestuario": ["strings"],
      "vehiculos": ["strings"],
      "efectos_especiales": ["strings"],
      "complejidad_rodaje": "Baja|Media|Alta",
      "notas_direccion": "string",
      "analisis_complejidad": {
        "tipo_escena": "dialogo_estatico|movimiento|accion|intimista|accion_compleja",
        "factores": {
          "num_personajes": number,
          "movimiento_camara": boolean,
          "accion_fisica": boolean,
          "stunts": boolean,
          "efectos_especiales": boolean,
          "ninos": boolean,
          "animales": boolean,
          "vehiculos_movimiento": boolean,
          "coordinacion_extras": number,
          "iluminacion_compleja": boolean,
          "escena_noche": boolean,
          "exteriores_clima": boolean,
          "dialogo_extenso": boolean,
          "requiere_grua": boolean,
          "planos_especiales": boolean
        },
        "score_complejidad": number,
        "categoria": "Baja|Media|Alta",
        "tiempo_setup_estimado_minutos": number,
        "paginas_por_dia_sugerido": number
      }
    }
  ],
  "relaciones_personajes": [
    {
      "personaje_a": "string",
      "personaje_b": "string",
      "tipo_relacion": "aliado|antagonista|mentor|romantica|familiar|profesional|rival|protector",
      "descripcion": "string",
      "evolucion": "string",
      "escenas_interaccion": [numbers]
    }
  ],
  "analisis_dafo": {
    "fortalezas": [{ "titulo": "string", "descripcion": "string", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia" }],
    "debilidades": [{ "titulo": "string", "descripcion": "string", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia" }],
    "oportunidades": [{ "titulo": "string", "descripcion": "string", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia" }],
    "amenazas": [{ "titulo": "string", "descripcion": "string", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia" }],
    "score_narrativo": number,
    "score_comercial": number,
    "score_festival": number,
    "recomendacion_general": "string"
  },
  "perfiles_audiencia_sugeridos": [
    {
      "segmento": "string",
      "rango_edad": "string",
      "intereses": ["string"],
      "motivacion_ver": "string",
      "canales_alcance": ["string"],
      "comparables": ["string (películas/series que vieron)"]
    }
  ],
  "potencial_mercado": {
    "territorios_principales": ["string"],
    "genero_tendencia": "en_alza|estable|en_baja",
    "ventanas_distribucion": ["string"],
    "festivales_sugeridos": ["string"],
    "plataformas_potenciales": ["string"]
  },
  "viabilidad": {
    "fortalezas": ["strings"],
    "debilidades": ["strings"],
    "sugerencias_mejora": ["strings"],
    "factores_positivos": ["strings"],
    "factores_negativos": ["strings"]
  },
  "resumen_produccion": {
    "total_personajes": {"protagonistas": 0, "principales": 0, "secundarios": 0, "figuracion": 0},
    "total_localizaciones": {"interiores": 0, "exteriores": 0},
    "total_octavos": number,
    "dias_rodaje": {"estimacion_minima": 0, "estimacion_maxima": 0, "estimacion_recomendada": 0},
    "complejidad_general": "Baja|Media|Alta",
    "elementos_destacados": ["strings"]
  }
}

INSTRUCCIONES CRÍTICAS:
1. El LOGLINE debe ser UNA SOLA FRASE impactante (máximo 30 palabras)
2. La SYNOPSIS debe resumir TODA la historia en UN PÁRRAFO (100-150 palabras)
3. BUSCA ACTIVAMENTE errores narrativos — sé honesto y constructivo como un script doctor
4. Calcula CORRECTAMENTE los OCTAVOS según la ley de octavos
5. Los errores_narrativos deben ser ESPECÍFICOS con sugerencias de corrección útiles
6. El mapa_tensiones debe tener al menos 8-10 puntos a lo largo del guión
7. Los scores del DAFO deben ser realistas y justificados
8. Los perfiles_audiencia deben ser perfiles reales de espectadores
9. Los festivales_sugeridos deben ser festivales REALES que encajen con el género
10. Sé EXHAUSTIVO y PROFESIONAL — este análisis vale dinero
11. Devuelve SOLO el JSON, sin markdown ni explicaciones`;

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
            max_completion_tokens: 64000,
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

        // Verificar si hay errores en la respuesta
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
        console.log('Errores Narrativos:', analisis.analisis_narrativo?.errores_narrativos?.length || 0);
        console.log('DAFO:', analisis.analisis_dafo ? 'Sí' : 'No');
        console.log('Relaciones:', analisis.relaciones_personajes?.length || 0);
        console.log('Audiencias:', analisis.perfiles_audiencia_sugeridos?.length || 0);
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
              version_analisis: '2.0',
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
