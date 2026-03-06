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
// FASE 2 — Análisis Narrativo Puro (sin mercado/DAFO)
// ═══════════════════════════════════════════════════════════════
function buildSystemPromptFase2(): string {
  return `Eres un SCRIPT DOCTOR cinematográfico con décadas de experiencia evaluando guiones para producción y festivales.

Tu tarea: Realizar un ANÁLISIS NARRATIVO EXHAUSTIVO Y EN PROFUNDIDAD del guión. Solo narrativa — NO incluyas análisis de mercado, DAFO ni viabilidad (eso se hace en otra fase).

╔══════════════════════════════════════════════════════════════════════╗
║  REGLA ANTI-GENERICIDAD — LEE ESTO PRIMERO                         ║
║                                                                      ║
║  Cada observación que hagas DEBE citar una escena, página o          ║
║  diálogo CONCRETO del guión. Si no puedes señalar un momento         ║
║  específico, tu observación es genérica y NO tiene valor.            ║
║  Pregúntate: "¿Esto que escribo aplica SOLO a ESTE guión,           ║
║  o podría aplicar a cualquier guión del mismo género?"               ║
║  Si la respuesta es "a cualquiera", REESCRÍBELO con evidencia.      ║
╚══════════════════════════════════════════════════════════════════════╝

CONTEXTO DE FASE 1 — CÓMO USARLO:
- personajes y escenas_aparicion: verifica que los personajes que analizas en profundidad son los que más aparecen
- paginas_totales: calibra proporciones de actos (Acto 1 ≈ 25% de las páginas totales)
- genero: calibra expectativas (un thriller necesita giros cada 10-15 págs, un drama puede ser más lento)
- NO repitas datos de producción. Solo REFERENCIA cuando justifiquen tu análisis.

PROFUNDIDAD OBLIGATORIA — Para cada sección, responde estas preguntas:

ESTRUCTURA_ACTOS:
- Acto 1: ¿Cuál es el detonante exacto (escena y página)? ¿Hay un punto de no retorno claro?
- Acto 2: ¿Los obstáculos escalan o se repiten? ¿Hay un midpoint que cambie la dirección?
- Acto 3: ¿El clímax resuelve la premisa del Acto 1? ¿La resolución se gana o es deus ex machina?
- ¿Qué porcentaje del guión ocupa cada acto? (ideal: 25/50/25)

ERRORES_NARRATIVOS — Definición de gravedad:
- "critico": Rompe la lógica interna. El espectador lo notaría. Ej: un personaje sabe algo que no pudo saber.
- "importante": Debilita la estructura. Un lector profesional lo marcaría. Ej: un subplot abandonado.
- "menor": Mejoraría el guión pero no es un fallo. Ej: un diálogo que podría ser más natural.
- "sugerencia": Oportunidad perdida. Ej: una escena que funcionaría mejor en otro orden.

PERSONAJES_PROFUNDIDAD — Para cada PROTAGONISTA y PRINCIPAL:
- Ghost/herida: ¿Qué evento pasado NO mostrado explica su comportamiento? Si no hay, indica "ausente — el guión se beneficiaría de establecer una herida del pasado".
- Want vs Need: ¿Qué quiere conscientemente vs qué necesita realmente? Si coinciden, el arco es plano.
- Transformación: Compara una acción/diálogo del INICIO con uno del FINAL. ¿Hay cambio observable?
- Test del taxi: ¿Tiene una forma de hablar distinguible? Si dos personajes hablan igual, su voz es genérica.

Devuelve SOLO JSON válido (sin markdown) con esta estructura exacta:

{
  "analisis_narrativo": {
    "estructura_actos": [
      { "acto": number, "descripcion": "string (análisis detallado respondiendo las preguntas de profundidad)", "paginas_inicio": number, "paginas_fin": number }
    ],
    "puntos_de_giro": [
      { "nombre": "string", "pagina_aproximada": number, "descripcion": "string (qué ocurre y por qué es un punto de giro — cita la escena)" }
    ],
    "curva_emocional": [
      { "momento": "string", "emocion": "string", "intensidad": number }
    ],
    "errores_narrativos": [
      { "tipo": "plot_hole|inconsistencia|ritmo|personaje|dialogo|estructura|logica", "gravedad": "critico|importante|menor|sugerencia", "ubicacion": "string (escena concreta)", "pagina_aproximada": number, "descripcion": "string (descripción detallada con evidencia del texto)", "sugerencia_correccion": "string (solución práctica y específica)" }
    ],
    "conflictos": {
      "conflicto_principal": { "tipo": "persona_vs_persona|persona_vs_sociedad|persona_vs_naturaleza|persona_vs_si_mismo|persona_vs_destino|persona_vs_tecnologia", "descripcion": "string (análisis profundo)", "personajes_involucrados": ["string"], "detonante": "string (escena y página exacta donde se desencadena)", "desarrollo": "string (cómo escala — cita 2-3 momentos clave)", "resolucion": "string (cómo se resuelve y si es satisfactorio narrativamente)", "resuelto": boolean },
      "conflictos_secundarios": [{ "tipo": "string", "descripcion": "string", "personajes_involucrados": ["string"], "detonante": "string", "desarrollo": "string", "resolucion": "string", "resuelto": boolean }],
      "conflictos_internos": [{ "personaje": "string", "conflicto": "string (lucha interna específica)", "manifestacion": "string (cómo se exterioriza — cita escena)", "evolucion": "string (cómo cambia o no)" }],
      "mapa_tensiones": [{ "pagina_aproximada": number, "nivel_tension": number, "descripcion": "string", "conflicto_asociado": "string" }]
    },
    "ritmo": {
      "ritmo_general": "lento|moderado|rapido|variable",
      "observaciones": "string (análisis detallado del pacing con páginas concretas)",
      "secciones_lentas": [{ "paginas": "string", "descripcion": "string", "sugerencia": "string" }],
      "secciones_rapidas": [{ "paginas": "string", "descripcion": "string", "sugerencia": "string" }],
      "equilibrio_dialogo_accion": "string (análisis del balance con datos del contexto de producción)"
    },
    "tematica": {
      "tema_principal": { "nombre": "string", "descripcion": "string (análisis profundo)", "como_se_desarrolla": "string (cómo el guión explora este tema — cita escenas)", "escenas_clave": ["string"] },
      "temas_secundarios": [{ "nombre": "string", "descripcion": "string", "como_se_desarrolla": "string", "escenas_clave": ["string"] }],
      "simbolismos": [{ "elemento": "string", "significado": "string (interpretación con evidencia)", "apariciones": ["string"] }],
      "mensaje_universal": "string (el mensaje que trasciende la historia particular)"
    }
  },
  "personajes_profundidad": [
    {
      "nombre": "string (EN MAYÚSCULAS — debe coincidir exactamente con Fase 1)",
      "arco_dramatico": "string (transformación detallada: compara inicio vs fin con escenas concretas)",
      "motivaciones": "string (WANT consciente vs NEED inconsciente — si coinciden, indica que el arco es plano)",
      "conflictos": "string (conflictos internos y externos con escenas donde se manifiestan)",
      "necesidad_dramatica": "string (qué necesita realmente, no qué quiere)",
      "flaw_principal": "string (defecto central y cómo afecta sus decisiones — cita ejemplo)",
      "funcion_narrativa": "mentor|sombra|heraldo|guardian|embaucador|aliado|otro",
      "ghost": "string (herida del pasado. Si ausente: 'Ausente — se sugiere establecer...')",
      "stakes": "string (qué pierde si falla — consecuencias personales Y narrativas)",
      "transformacion": "string (acción/diálogo del INICIO vs del FINAL — ¿hay cambio observable?)"
    }
  ],
  "relaciones_personajes": [
    { "personaje_a": "string", "personaje_b": "string", "tipo_relacion": "aliado|antagonista|mentor|romantica|familiar|profesional|rival|protector", "descripcion": "string (naturaleza de la relación con escena ejemplo)", "evolucion": "string (cómo cambia — cita momento de cambio)" }
  ]
}

INSTRUCCIONES:
1. personajes_profundidad: SOLO para PROTAGONISTA y PRINCIPAL. "nombre" debe coincidir EXACTAMENTE con el de Fase 1.
2. curva_emocional: MÍNIMO 8 puntos, intensidad 1-10. Cubrir inicio → clímax → desenlace.
3. Errores narrativos ESPECÍFICOS con evidencia del texto. mapa_tensiones: mínimo 8 puntos con conflicto_asociado.
4. conflictos: detonante/desarrollo/resolución con escenas concretas. Incluir secundarios e internos.
5. ritmo: usa datos de páginas_dialogo vs páginas_accion del contexto. Secciones lentas y rápidas con sugerencias.
6. tematica: simbolismos MÍNIMO 2 con evidencia textual. mensaje_universal NO genérico.
7. relaciones_personajes: incluir TODAS las relaciones significativas entre personajes principales.
8. Devuelve SOLO el JSON, sin markdown ni explicaciones.`;
}

// ═══════════════════════════════════════════════════════════════
// FASE 3 — Mercado, Estrategia y DAFO
// ═══════════════════════════════════════════════════════════════
function buildSystemPromptFase3(): string {
  return `Eres un ESTRATEGA DE MERCADO Y CONSULTOR DE DESARROLLO cinematográfico con experiencia en distribución, festivales y financiación de proyectos audiovisuales.

Tu tarea: Evaluar el POTENCIAL COMERCIAL, de FESTIVAL y de MERCADO del guión, y generar RECOMENDACIONES ESTRATÉGICAS accionables.

╔══════════════════════════════════════════════════════════════════════╗
║  REGLA ANTI-GENERICIDAD                                             ║
║                                                                      ║
║  Cada puntuación, cada territorio, cada plataforma DEBE estar       ║
║  justificada con evidencia del guión o del análisis narrativo.       ║
║  Si escribes "tiene potencial en Latinoamérica" sin explicar        ║
║  POR QUÉ este guión específico y no cualquier otro, REESCRÍBELO.    ║
╚══════════════════════════════════════════════════════════════════════╝

CONTEXTO DE FASES 1 y 2 — CÓMO USARLO:
- De Fase 1: género, localizaciones, complejidad técnica → para estimar viabilidad de producción
- De Fase 2: errores narrativos, calidad de personajes, estructura → como INPUT para el DAFO
- Si Fase 2 detectó errores narrativos críticos → automáticamente DEBILIDAD en DAFO
- Si Fase 2 destacó personajes profundos con arcos completos → automáticamente FORTALEZA
- Si la temática es de actualidad → OPORTUNIDAD
- NO repitas el análisis narrativo. REFERENCIA sus conclusiones y tradúcelas a impacto de mercado.

RÚBRICA DE PUNTUACIÓN (0-100):
- 90-100: Nivel de guión premiado. Fortalezas excepcionales en 3+ categorías. Sin debilidades críticas.
- 75-89: Profesional sólido. Competitivo en su segmento. Debilidades menores/subsanables.
- 60-74: Prometedor pero necesita reescritura. Potencial identificable, debilidades estructurales.
- 40-59: Borrador temprano. Concepto interesante, múltiples problemas fundamentales.
- 20-39: Necesita reconceptualización significativa.
Para CADA puntuación, cita evidencia específica del guión o del análisis narrativo.

Devuelve SOLO JSON válido (sin markdown) con esta estructura exacta:

{
  "analisis_dafo": {
    "fortalezas": [{ "titulo": "string", "descripcion": "string (por qué es una fortaleza)", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia", "evidencia": "string (cita concreta del guión o hallazgo de Fase 2)" }],
    "debilidades": [{ "titulo": "string", "descripcion": "string (por qué es una debilidad y cómo afecta)", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia", "evidencia": "string" }],
    "oportunidades": [{ "titulo": "string", "descripcion": "string (oportunidad concreta y contextualizada)", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia", "evidencia": "string" }],
    "amenazas": [{ "titulo": "string", "descripcion": "string (riesgo concreto)", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia", "evidencia": "string" }],
    "score_narrativo": number,
    "score_comercial": number,
    "score_festival": number,
    "justificacion_scores": "string (POR QUÉ estos números — cita evidencia para cada score)",
    "recomendacion_general": "string (recomendación detallada, constructiva y accionable)"
  },
  "perfiles_audiencia_sugeridos": [
    { "segmento": "string", "rango_edad": "string", "intereses": ["string"], "motivacion_ver": "string (qué de ESTE guión les atraería — sé específico)", "canales_alcance": ["string"], "comparables": ["string (películas/series REALES con año que este público vio)"] }
  ],
  "potencial_mercado": {
    "territorios_principales": ["string (MÁXIMO 3-4, los MÁS probables, con justificación)"],
    "genero_tendencia": "en_alza|estable|en_baja",
    "ventanas_distribucion": ["string"],
    "festivales_sugeridos": ["string (festivales REALES — justifica por qué encaja en la línea editorial)"],
    "plataformas_potenciales": ["string (2-3 MÁS probables, no todas — justifica cada una)"]
  },
  "recomendaciones_estrategicas": {
    "sugerencias_desarrollo": [{ "area": "string (guión|producción|financiación|distribución|marketing)", "prioridad": "alta|media|baja", "descripcion": "string (acción concreta y específica)", "impacto_esperado": "string (qué mejoraría si se implementa)" }],
    "factores_positivos": ["string (ventajas competitivas de ESTE proyecto específico)"],
    "factores_negativos": ["string (obstáculos reales que enfrentará)"],
    "proximos_pasos": ["string (acciones concretas ordenadas cronológicamente)"]
  }
}

INSTRUCCIONES:
1. DAFO: Cada elemento DEBE incluir "evidencia". Mínimo 2 elementos por categoría (F/D/O/A).
2. Scores: Usa la rúbrica. justificacion_scores OBLIGATORIO con evidencia para los 3 scores.
3. Audiencia: MÍNIMO 2 perfiles. comparables: MÍNIMO 3 películas/series REALES con año.
4. Mercado: NO listes todas las plataformas/territorios. Selecciona los MÁS probables y justifica.
5. festivales_sugeridos: MÍNIMO 3 REALES (al menos 1 español + 1 internacional). Justifica la línea editorial.
6. territorios_principales: Siempre incluir España. Para cada territorio cita un comparable exitoso.
7. recomendaciones_estrategicas: Mínimo 3 sugerencias_desarrollo con prioridad. proximos_pasos en orden cronológico.
8. Devuelve SOLO el JSON, sin markdown ni explicaciones.`;
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
    const { texto, fase = 1, contextoFase1, contextoFase2 } = await req.json();

    if (!texto || texto.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No se proporcionó texto del guión' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (fase !== 1 && fase !== 2 && fase !== 3) {
      return new Response(
        JSON.stringify({ success: false, error: 'Fase debe ser 1, 2 o 3' }),
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
[PROPÓSITO: Extracción completa de datos de producción — Fase 1 de 3]
[PÁGINAS ESTIMADAS: ${paginasEstimadas}]
[NOTA: Este es un trabajo de ficción que requiere análisis técnico profesional]

--- INICIO DEL GUIÓN ---
${textoFinal}
--- FIN DEL GUIÓN ---`;
    } else if (fase === 2) {
      systemPrompt = buildSystemPromptFase2();
      userMessage = `[DOCUMENTO PROFESIONAL: Análisis Narrativo Profundo de Guión Cinematográfico]
[TIPO: Guión de ficción para evaluación narrativa profesional]
[PROPÓSITO: Análisis narrativo exhaustivo — Fase 2 de 3 (solo narrativa)]
[PÁGINAS ESTIMADAS: ${paginasEstimadas}]
[NOTA: Este es un trabajo de ficción que requiere análisis narrativo profesional]

${contextoFase1 ? `=== CONTEXTO DE PRODUCCIÓN (extraído en Fase 1) ===
${contextoFase1}
=== FIN CONTEXTO DE PRODUCCIÓN ===

` : ''}--- INICIO DEL GUIÓN ---
${textoFinal}
--- FIN DEL GUIÓN ---`;
    } else {
      // Fase 3 — Mercado, Estrategia y DAFO
      systemPrompt = buildSystemPromptFase3();
      userMessage = `[DOCUMENTO PROFESIONAL: Evaluación de Mercado y Estrategia de Guión Cinematográfico]
[TIPO: Guión de ficción para evaluación comercial y estratégica]
[PROPÓSITO: DAFO, audiencias, mercado y recomendaciones — Fase 3 de 3]
[PÁGINAS ESTIMADAS: ${paginasEstimadas}]
[NOTA: Este es un trabajo de ficción que requiere análisis estratégico profesional]

${contextoFase1 ? `=== CONTEXTO DE PRODUCCIÓN (Fase 1) ===
${contextoFase1}
=== FIN CONTEXTO DE PRODUCCIÓN ===

` : ''}${contextoFase2 ? `=== ANÁLISIS NARRATIVO (Fase 2) ===
${contextoFase2}
=== FIN ANÁLISIS NARRATIVO ===

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
          max_tokens: fase === 1 ? 20000 : fase === 2 ? 20000 : 16000,
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
