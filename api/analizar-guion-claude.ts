export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
    const { texto } = await req.json();

    if (!texto || texto.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No se proporcionó texto del guión' }),
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

    const contextoProduccion = `[DOCUMENTO PROFESIONAL: Análisis Integral de Guión Cinematográfico]
[TIPO: Guión de ficción para evaluación narrativa + técnica de preproducción]
[PROPÓSITO: Análisis narrativo profundo + desglose de producción + evaluación de mercado]
[PÁGINAS ESTIMADAS: ${paginasEstimadas}]
[NOTA: Este es un trabajo de ficción que requiere análisis técnico y narrativo profesional]

--- INICIO DEL GUIÓN ---
${textoFinal}
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

B) SCORING (usa estas rúbricas EXACTAS):
   - score_narrativo (0-100): calidad del guión como obra narrativa
     0-30: Estructura rota, personajes planos, conflictos incoherentes
     31-50: Estructura reconocible pero con problemas serios de ritmo o motivación
     51-70: Guión funcional con arco dramático claro pero predecible o con lagunas
     71-85: Guión sólido con personajes memorables, giros efectivos y tema resonante
     86-100: Excepcional — obra maestra narrativa comparable a guiones premiados
   - score_comercial (0-100): potencial de mercado y taquilla
     0-30: Nicho extremo, sin audiencia clara, experimental puro
     31-50: Audiencia limitada, difícil de distribuir comercialmente
     51-70: Audiencia identificable, comparable a éxitos moderados del género
     71-85: Alto potencial comercial, crossover entre segmentos, plataformas interesadas
     86-100: Blockbuster potencial o fenómeno cultural
   - score_festival (0-100): potencial para circuito de festivales
     0-30: Sin elementos para circuito festival
     31-50: Podría entrar en festivales nacionales o secciones paralelas
     51-70: Competitivo en festivales clase A nacionales (San Sebastián, Málaga, Valladolid)
     71-85: Competitivo en festivales clase A internacionales (Cannes, Venecia, Berlín secciones)
     86-100: Candidato a premios principales en festivales Clase A

C) AUDIENCIA Y MERCADO:
   - Perfiles de audiencia sugeridos (2-3 segmentos con rango_edad, motivacion_ver, canales_alcance)
   - Territorios principales de interés (MÍNIMO 2 territorios)
   - Películas/series comparables (MÍNIMO 3 comparables REALES con año)
   - Festivales sugeridos (MÍNIMO 3 festivales REALES que encajen: incluir al menos 1 español + 1 internacional)
   - Plataformas potenciales (Netflix, Movistar+, Filmin, MUBI, Amazon, HBO, etc.)

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
7. Los scores DEBEN seguir las rúbricas definidas arriba — justifica mentalmente cada puntuación
8. Los perfiles_audiencia deben ser perfiles reales de espectadores con rango_edad y canales_alcance
9. festivales_sugeridos MÍNIMO 3 festivales REALES (al menos 1 español + 1 internacional). Ej: San Sebastián, Málaga, Cannes, Berlín, Toronto, Rotterdam, Locarno, Mar del Plata
10. territorios_principales MÍNIMO 2 territorios (siempre incluir España)
11. Para personajes PROTAGONISTA: ghost, stakes, transformacion y necesidad_dramatica son OBLIGATORIOS — si el guión no los define claramente, indica "No explicitado en el guión — recomendación: desarrollar"
12. comparables: MÍNIMO 3 películas/series REALES con año de estreno
13. Sé EXHAUSTIVO y PROFESIONAL — este análisis vale dinero
14. Devuelve SOLO el JSON, sin markdown ni explicaciones`;

    // Llamar a Anthropic con streaming para evitar timeouts de Vercel
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 32000,
        temperature: 0.3,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: contextoProduccion }],
      }),
    });

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
                    // Enviar delta de texto al cliente
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: parsed.delta.text })}\n\n`)
                    );
                  } else if (parsed.type === 'message_delta') {
                    // Metadata final (stop_reason, usage)
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({
                        type: 'metadata',
                        stop_reason: parsed.delta?.stop_reason,
                        usage: parsed.usage,
                        paginas_estimadas: paginasEstimadas,
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
                  // Líneas no parseables se ignoran (event: lines, empty lines, etc.)
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
