import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ═══════════════════════════════════════════════════════════════
// PROMPTS POR FASE (sincronizados con api/analizar-guion-claude.ts)
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
    "synopsis": "string (UN PÁRRAFO, 100-200 palabras)",
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

function buildSystemPromptFase2(): string {
  return `Eres un SCRIPT DOCTOR cinematográfico con décadas de experiencia evaluando guiones para producción y festivales.

Tu tarea: Realizar un ANÁLISIS NARRATIVO EXHAUSTIVO Y EN PROFUNDIDAD del guión. Solo narrativa — NO incluyas análisis de mercado, DAFO ni viabilidad (eso se hace en otra fase).

REGLA ANTI-GENERICIDAD: Cada observación DEBE citar una escena, página o diálogo CONCRETO. Si no puedes señalar un momento específico, tu observación es genérica y NO tiene valor.

CONTEXTO DE FASE 1 — CÓMO USARLO:
- personajes y escenas_aparicion: verifica que los que analizas en profundidad son los que más aparecen
- paginas_totales: calibra proporciones de actos (Acto 1 ≈ 25%)
- genero: calibra expectativas (thriller: giros cada 10-15 págs, drama: ritmo más lento OK)
- NO repitas datos de producción. Solo REFERENCIA cuando justifiquen tu análisis.

PROFUNDIDAD OBLIGATORIA:
- ESTRUCTURA_ACTOS: detonante exacto, punto de no retorno, midpoint, clímax vs premisa, % de cada acto
- ERRORES: critico=rompe lógica, importante=debilita estructura, menor=mejoraría, sugerencia=oportunidad perdida
- PERSONAJES: Ghost/herida, Want vs Need, transformación inicio vs fin, test del taxi (voz distinguible)

Devuelve SOLO JSON válido (sin markdown) con esta estructura:

{
  "analisis_narrativo": {
    "estructura_actos": [{ "acto": number, "descripcion": "string (responde preguntas de profundidad)", "paginas_inicio": number, "paginas_fin": number }],
    "puntos_de_giro": [{ "nombre": "string", "pagina_aproximada": number, "descripcion": "string (cita escena)" }],
    "curva_emocional": [{ "momento": "string", "emocion": "string", "intensidad": number }],
    "errores_narrativos": [{ "tipo": "plot_hole|inconsistencia|ritmo|personaje|dialogo|estructura|logica", "gravedad": "critico|importante|menor|sugerencia", "ubicacion": "string (escena concreta)", "pagina_aproximada": number, "descripcion": "string (con evidencia)", "sugerencia_correccion": "string" }],
    "conflictos": {
      "conflicto_principal": { "tipo": "persona_vs_persona|persona_vs_sociedad|persona_vs_naturaleza|persona_vs_si_mismo|persona_vs_destino|persona_vs_tecnologia", "descripcion": "string", "personajes_involucrados": ["string"], "detonante": "string (escena y página)", "desarrollo": "string (2-3 momentos clave)", "resolucion": "string", "resuelto": boolean },
      "conflictos_secundarios": [{ "tipo": "string", "descripcion": "string", "personajes_involucrados": ["string"], "detonante": "string", "desarrollo": "string", "resolucion": "string", "resuelto": boolean }],
      "conflictos_internos": [{ "personaje": "string", "conflicto": "string", "manifestacion": "string (cita escena)", "evolucion": "string" }],
      "mapa_tensiones": [{ "pagina_aproximada": number, "nivel_tension": number, "descripcion": "string", "conflicto_asociado": "string" }]
    },
    "ritmo": { "ritmo_general": "lento|moderado|rapido|variable", "observaciones": "string (con páginas concretas)", "secciones_lentas": [{ "paginas": "string", "descripcion": "string", "sugerencia": "string" }], "secciones_rapidas": [{ "paginas": "string", "descripcion": "string", "sugerencia": "string" }], "equilibrio_dialogo_accion": "string" },
    "tematica": {
      "tema_principal": { "nombre": "string", "descripcion": "string", "como_se_desarrolla": "string (cita escenas)", "escenas_clave": ["string"] },
      "temas_secundarios": [{ "nombre": "string", "descripcion": "string", "como_se_desarrolla": "string", "escenas_clave": ["string"] }],
      "simbolismos": [{ "elemento": "string", "significado": "string (con evidencia)", "apariciones": ["string"] }],
      "mensaje_universal": "string"
    }
  },
  "personajes_profundidad": [{ "nombre": "string (EN MAYÚSCULAS)", "arco_dramatico": "string (inicio vs fin con escenas)", "motivaciones": "string (WANT vs NEED)", "conflictos": "string", "necesidad_dramatica": "string", "flaw_principal": "string (con ejemplo)", "funcion_narrativa": "string", "ghost": "string (si ausente, indicar)", "stakes": "string", "transformacion": "string (acción inicio vs fin)" }],
  "relaciones_personajes": [{ "personaje_a": "string", "personaje_b": "string", "tipo_relacion": "aliado|antagonista|mentor|romantica|familiar|profesional|rival|protector", "descripcion": "string (con escena ejemplo)", "evolucion": "string (momento de cambio)" }]
}

INSTRUCCIONES:
1. personajes_profundidad: SOLO para PROTAGONISTA y PRINCIPAL.
2. curva_emocional: MÍNIMO 8 puntos. mapa_tensiones: mínimo 8 puntos.
3. Errores narrativos con evidencia textual. conflictos con escenas concretas.
4. tematica: simbolismos MÍNIMO 2. mensaje_universal NO genérico.
5. relaciones_personajes: TODAS las relaciones significativas.
6. Devuelve SOLO el JSON, sin markdown ni explicaciones.`;
}

function buildSystemPromptFase3(): string {
  return `Eres un ESTRATEGA DE MERCADO Y CONSULTOR DE DESARROLLO cinematográfico con experiencia en distribución, festivales y financiación.

Tu tarea: Evaluar el POTENCIAL COMERCIAL, de FESTIVAL y de MERCADO del guión, y generar RECOMENDACIONES ESTRATÉGICAS.

REGLA ANTI-GENERICIDAD: Cada puntuación, territorio y plataforma DEBE estar justificada con evidencia del guión o del análisis narrativo.

CONTEXTO DE FASES 1 y 2 — CÓMO USARLO:
- De Fase 1: género, localizaciones, complejidad técnica → viabilidad de producción
- De Fase 2: errores narrativos, personajes, estructura → INPUT para DAFO
- Errores críticos en Fase 2 → DEBILIDAD. Personajes profundos → FORTALEZA. Temática actual → OPORTUNIDAD.
- NO repitas análisis narrativo. Traduce conclusiones a impacto de mercado.

RÚBRICA (0-100): 90-100=premiado, 75-89=profesional sólido, 60-74=prometedor, 40-59=borrador temprano, 20-39=necesita reconceptualización. Cita evidencia para CADA score.

Devuelve SOLO JSON válido (sin markdown):

{
  "analisis_dafo": {
    "fortalezas": [{ "titulo": "string", "descripcion": "string", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia", "evidencia": "string" }],
    "debilidades": [{ "titulo": "string", "descripcion": "string", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia", "evidencia": "string" }],
    "oportunidades": [{ "titulo": "string", "descripcion": "string", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia", "evidencia": "string" }],
    "amenazas": [{ "titulo": "string", "descripcion": "string", "impacto": "alto|medio|bajo", "categoria": "narrativa|produccion|mercado|audiencia", "evidencia": "string" }],
    "score_narrativo": number, "score_comercial": number, "score_festival": number,
    "justificacion_scores": "string (POR QUÉ estos números con evidencia)",
    "recomendacion_general": "string"
  },
  "perfiles_audiencia_sugeridos": [{ "segmento": "string", "rango_edad": "string", "intereses": ["string"], "motivacion_ver": "string (específico a ESTE guión)", "canales_alcance": ["string"], "comparables": ["string (películas REALES con año)"] }],
  "potencial_mercado": { "territorios_principales": ["string (MÁXIMO 3-4, justificados)"], "genero_tendencia": "en_alza|estable|en_baja", "ventanas_distribucion": ["string"], "festivales_sugeridos": ["string (REALES, justifica línea editorial)"], "plataformas_potenciales": ["string (2-3 MÁS probables, justificadas)"] },
  "recomendaciones_estrategicas": { "sugerencias_desarrollo": [{ "area": "string", "prioridad": "alta|media|baja", "descripcion": "string", "impacto_esperado": "string" }], "factores_positivos": ["string"], "factores_negativos": ["string"], "proximos_pasos": ["string (orden cronológico)"] }
}

INSTRUCCIONES:
1. DAFO: Cada elemento con "evidencia". Mínimo 2 por categoría.
2. Scores con rúbrica. justificacion_scores OBLIGATORIO.
3. Audiencia: MÍNIMO 2 perfiles. comparables MÍNIMO 3 REALES con año.
4. Mercado: NO listes todo. Selecciona los MÁS probables. festivales MÍNIMO 3 REALES.
5. recomendaciones_estrategicas: Mínimo 3 sugerencias. proximos_pasos en orden cronológico.
6. Devuelve SOLO el JSON, sin markdown ni explicaciones.`;
}

// ═══════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto, fase = 1, contextoFase1, contextoFase2 } = await req.json();

    if (!texto || texto.trim().length === 0) {
      throw new Error('No se proporcionó texto del guión');
    }

    if (fase !== 1 && fase !== 2 && fase !== 3) {
      throw new Error('Fase debe ser 1, 2 o 3');
    }

    console.log(`Analizando guión con Claude — Fase ${fase}...`);
    console.log('Longitud del texto:', texto.length);

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no está configurada');
    }

    const maxLength = 300000;
    let textoFinal = texto;
    if (texto.length > maxLength) {
      textoFinal = texto.substring(0, maxLength) + '\n\n[TEXTO TRUNCADO POR LONGITUD EXTREMA]';
      console.log(`Texto truncado de ${texto.length} a ${maxLength} caracteres`);
    }

    const paginasEstimadas = Math.ceil(texto.length / 600);

    // Build prompt and user message based on phase
    let systemPrompt: string;
    let userMessage: string;

    if (fase === 1) {
      systemPrompt = buildSystemPromptFase1();
      userMessage = `[DOCUMENTO PROFESIONAL: Desglose de Producción — Fase 1 de 3]
[PÁGINAS ESTIMADAS: ${paginasEstimadas}]
[NOTA: Trabajo de ficción para análisis técnico profesional]

--- INICIO DEL GUIÓN ---
${textoFinal}
--- FIN DEL GUIÓN ---`;
    } else if (fase === 2) {
      systemPrompt = buildSystemPromptFase2();
      userMessage = `[DOCUMENTO PROFESIONAL: Análisis Narrativo — Fase 2 de 3 (solo narrativa)]
[PÁGINAS ESTIMADAS: ${paginasEstimadas}]
[NOTA: Trabajo de ficción para análisis narrativo profesional]

${contextoFase1 ? `=== CONTEXTO DE PRODUCCIÓN (Fase 1) ===
${contextoFase1}
=== FIN CONTEXTO ===

` : ''}--- INICIO DEL GUIÓN ---
${textoFinal}
--- FIN DEL GUIÓN ---`;
    } else {
      systemPrompt = buildSystemPromptFase3();
      userMessage = `[DOCUMENTO PROFESIONAL: Mercado y Estrategia — Fase 3 de 3]
[PÁGINAS ESTIMADAS: ${paginasEstimadas}]
[NOTA: Trabajo de ficción para evaluación estratégica profesional]

${contextoFase1 ? `=== CONTEXTO DE PRODUCCIÓN (Fase 1) ===
${contextoFase1}
=== FIN CONTEXTO ===

` : ''}${contextoFase2 ? `=== ANÁLISIS NARRATIVO (Fase 2) ===
${contextoFase2}
=== FIN ANÁLISIS NARRATIVO ===

` : ''}--- INICIO DEL GUIÓN ---
${textoFinal}
--- FIN DEL GUIÓN ---`;
    }

    console.log(`Enviando a Claude Sonnet — Fase ${fase} (${paginasEstimadas} páginas)...`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    console.log('Claude - Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude - Error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Límite de solicitudes excedido.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ success: false, error: 'API key de Anthropic inválida o expirada.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 529) {
        return new Response(
          JSON.stringify({ success: false, error: 'API de Anthropic temporalmente sobrecargada.' }),
          { status: 529, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();

    const stopReason = aiResponse.stop_reason;
    if (stopReason === 'max_tokens') {
      console.warn(`Fase ${fase}: Respuesta truncada por max_tokens`);
    }

    const content = aiResponse.content?.[0]?.text;
    if (!content) {
      console.error('Claude - Sin contenido:', JSON.stringify(aiResponse));
      throw new Error('Claude no generó respuesta');
    }

    console.log(`Fase ${fase} - Contenido recibido: ${content.length} chars`);
    console.log('Claude - Tokens usados:', JSON.stringify(aiResponse.usage));

    // Parse JSON from response
    let analisis;
    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
      jsonStr = jsonStr.trim();
      analisis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error(`Fase ${fase} - Error parseando JSON:`, parseError);
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analisis = JSON.parse(jsonMatch[0]);
          console.log('JSON recuperado con regex fallback');
        } else {
          throw new Error('No se encontró JSON válido');
        }
      } catch (fallbackError) {
        throw new Error(`Error parseando respuesta de Claude: ${parseError instanceof Error ? parseError.message : 'JSON inválido'}`);
      }
    }

    console.log(`✓ Fase ${fase} completada con Claude Sonnet`);

    return new Response(
      JSON.stringify({
        success: true,
        analisis,
        metadata: {
          modelo: 'claude-sonnet-4-20250514',
          proveedor: 'anthropic',
          timestamp: new Date().toISOString(),
          paginas_estimadas: paginasEstimadas,
          fase: fase,
          version_analisis: '4.0',
          tokens: aiResponse.usage || null,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error en analizar-guion-claude:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al analizar el guión',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
