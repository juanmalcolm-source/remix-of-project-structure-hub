import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    console.log('Analizando guión con Claude...');
    console.log('Longitud del texto:', texto.length);

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no está configurada');
    }

    // Claude maneja 200K tokens — no necesitamos truncar
    // Solo advertimos si el texto es extremadamente largo (>300K chars ≈ 500 páginas)
    const maxLength = 300000;
    let textoFinal = texto;
    if (texto.length > maxLength) {
      textoFinal = texto.substring(0, maxLength) + '\n\n[TEXTO TRUNCADO POR LONGITUD EXTREMA — se analizaron las primeras ~500 páginas]';
      console.log(`Texto truncado de ${texto.length} a ${maxLength} caracteres`);
    }

    // Calcular páginas del guión (aprox 600 chars por página)
    const paginasEstimadas = Math.ceil(texto.length / 600);

    // Contextualizar el texto como análisis profesional de producción
    const contextoProduccion = `[DOCUMENTO PROFESIONAL: Análisis Integral de Guión Cinematográfico]
[TIPO: Guión de ficción para evaluación narrativa + técnica de preproducción]
[PROPÓSITO: Análisis narrativo profundo + desglose de producción + evaluación de mercado]
[PÁGINAS ESTIMADAS: ${paginasEstimadas}]
[NOTA: Este es un trabajo de ficción que requiere análisis técnico y narrativo profesional]

--- INICIO DEL GUIÓN ---
${textoFinal}
--- FIN DEL GUIÓN ---`;

    const systemPrompt = `Eres un ANALISTA EXPERTO de guiones cinematográficos (script doctor + director de producción + estratega de mercado).

╔══════════════════════════════════════════════════════════════════════╗
║  REGLA #1 — PRIORIDAD MÁXIMA — LEE ESTO PRIMERO                   ║
║                                                                      ║
║  El array "desglose_secuencias" DEBE contener UNA entrada por       ║
║  CADA cabecera INT/EXT del guión. Cada cambio de encabezado =       ║
║  nueva entrada. NO agrupes, NO resumas, NO omitas escenas.          ║
║  Un largometraje de ~100 págs tiene 80-130 escenas.                 ║
║  Si generas menos de 50 entradas para un largo, HAS FALLADO.        ║
║  Genera el array desglose_secuencias COMPLETO antes de las demás    ║
║  secciones del JSON.                                                 ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║  REGLA #2 — BREVEDAD OBLIGATORIA                                    ║
║                                                                      ║
║  - Todas las descripciones: máx 15 palabras.                        ║
║  - synopsis: 80-100 palabras exactas.                               ║
║  - arcos, motivaciones, conflictos: 1 frase (máx 20 palabras).     ║
║  - recomendacion_general: máx 2 frases.                             ║
║  - sugerencia_correccion: máx 1 frase.                              ║
║  - Arrays (attrezzo, vestuario, vehiculos, efectos_especiales):     ║
║    solo items EXPLÍCITOS en el texto, máx 3 por array, nombre corto.║
║  - Arrays vacíos [] si el item no se menciona en el guión.          ║
║  - NO generes texto explicativo. Solo datos concretos.              ║
╚══════════════════════════════════════════════════════════════════════╝

LEY DE OCTAVOS: 1 página = 8 octavos ≈ 1 minuto. Calcula paginas_octavos por escena según el texto real.
Complejidad: <10 puntos=Baja, 10-25=Media, >25=Alta (factores: personajes, acción, FX, noche, exterior, etc.)

ANÁLISIS NARRATIVO: Busca errores narrativos (plot holes, inconsistencias, ritmo), analiza conflictos, pacing, temática.
PERSONAJES: Para protagonistas incluye arco dramático, ghost, stakes, transformación.
MERCADO: DAFO con scores 0-100, festivales reales, audiencia, territorios.

Devuelve SOLO JSON válido (sin markdown) con esta estructura. El orden del JSON DEBE ser exactamente este:

{
  "informacion_general": {
    "titulo": "string", "genero": "string", "subgeneros": ["string"],
    "duracion_estimada_minutos": number, "paginas_totales": number,
    "paginas_dialogo": number, "paginas_accion": number,
    "tono": "string", "estilo_visual_sugerido": "string",
    "logline": "string (UNA FRASE, máx 30 palabras)",
    "synopsis": "string (UN PÁRRAFO, 100-150 palabras)",
    "core_emotional": "string", "central_theme": "string",
    "temas_secundarios": ["string"],
    "referentes_cinematograficos": ["string (3-5 películas con año)"],
    "publico_objetivo_sugerido": "string",
    "potencial_festival": "Alto|Medio|Bajo",
    "potencial_comercial": "Alto|Medio|Bajo"
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
      "attrezzo": ["strings"],
      "vestuario": ["strings"],
      "vehiculos": ["strings"],
      "efectos_especiales": ["strings"],
      "complejidad_rodaje": "Baja|Media|Alta"
    }
  ],
  "localizaciones": [
    {
      "nombre": "string",
      "tipo": "INT|EXT",
      "momento_dia": "DÍA|NOCHE|ATARDECER|AMANECER",
      "descripcion": "string (breve)",
      "escenas": [numbers],
      "paginas_totales": number,
      "dias_rodaje_estimados": number,
      "complejidad": "Baja|Media|Alta",
      "necesidades_especiales": ["strings"]
    }
  ],
  "personajes": [
    {
      "nombre": "string (EN MAYÚSCULAS)",
      "categoria": "PROTAGONISTA|PRINCIPAL|SECUNDARIO|FIGURACION",
      "descripcion": "string (breve)",
      "genero": "Masculino|Femenino|No especificado",
      "edad_aproximada": "string",
      "escenas_aparicion": [numbers],
      "dias_rodaje_estimados": number,
      "importancia_trama": "Alta|Media|Baja",
      "arco_dramatico": "string",
      "relaciones_clave": ["string"],
      "motivaciones": "string (solo PROTAGONISTA/PRINCIPAL)",
      "conflictos": "string (solo PROTAGONISTA/PRINCIPAL)",
      "necesidad_dramatica": "string (solo PROTAGONISTA/PRINCIPAL)",
      "flaw_principal": "string (solo PROTAGONISTA/PRINCIPAL)",
      "funcion_narrativa": "string (mentor|sombra|heraldo|guardian|embaucador|aliado — solo PROTAGONISTA/PRINCIPAL)",
      "ghost": "string (solo protagonistas)",
      "stakes": "string (solo protagonistas)",
      "transformacion": "string (solo protagonistas)"
    }
  ],
  "resumen_produccion": {
    "total_personajes": {"protagonistas": 0, "principales": 0, "secundarios": 0, "figuracion": 0},
    "total_localizaciones": {"interiores": 0, "exteriores": 0},
    "total_octavos": number,
    "dias_rodaje": {"estimacion_minima": 0, "estimacion_maxima": 0, "estimacion_recomendada": 0},
    "complejidad_general": "Baja|Media|Alta"
  },
  "analisis_narrativo": {
    "estructura_actos": [
      { "acto": number, "descripcion": "string", "paginas_inicio": number, "paginas_fin": number }
    ],
    "puntos_de_giro": [
      { "nombre": "string", "pagina_aproximada": number, "descripcion": "string" }
    ],
    "curva_emocional": [
      { "momento": "string", "emocion": "string", "intensidad": number }
    ],
    "errores_narrativos": [
      { "tipo": "plot_hole|inconsistencia|ritmo|personaje|dialogo|estructura|logica", "gravedad": "critico|importante|menor|sugerencia", "ubicacion": "string", "pagina_aproximada": number, "descripcion": "string", "sugerencia_correccion": "string" }
    ],
    "conflictos": {
      "conflicto_principal": { "tipo": "persona_vs_persona|persona_vs_sociedad|persona_vs_naturaleza|persona_vs_si_mismo|persona_vs_destino|persona_vs_tecnologia", "descripcion": "string", "personajes_involucrados": ["string"], "detonante": "string", "desarrollo": "string", "resolucion": "string", "resuelto": boolean },
      "conflictos_secundarios": [{ "tipo": "string", "descripcion": "string", "personajes_involucrados": ["string"], "detonante": "string", "desarrollo": "string", "resolucion": "string", "resuelto": boolean }],
      "conflictos_internos": [{ "personaje": "string", "conflicto": "string", "manifestacion": "string", "evolucion": "string" }],
      "mapa_tensiones": [{ "pagina_aproximada": number, "nivel_tension": number, "descripcion": "string", "conflicto_asociado": "string" }]
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
    { "segmento": "string", "rango_edad": "string", "intereses": ["string"], "motivacion_ver": "string", "canales_alcance": ["string"], "comparables": ["string"] }
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
  "relaciones_personajes": [
    { "personaje_a": "string", "personaje_b": "string", "tipo_relacion": "aliado|antagonista|mentor|romantica|familiar|profesional|rival|protector", "descripcion": "string", "evolucion": "string" }
  ]
}

INSTRUCCIONES:
1. LOGLINE: UNA FRASE, máx 30 palabras. SYNOPSIS: UN PÁRRAFO, 100-150 palabras.
2. desglose_secuencias: UNA entrada por CADA INT/EXT del guión. La suma de paginas_octavos ÷ 8 ≈ paginas_totales.
3. localizaciones: Lista TODAS las localizaciones únicas. nombre debe coincidir con localizacion de desglose_secuencias.
4. curva_emocional: MÍNIMO 8 puntos, intensidad 1-10. Cubre toda la historia (inicio → clímax → desenlace).
5. Errores narrativos ESPECÍFICOS con sugerencias útiles. mapa_tensiones: mínimo 8 puntos con conflicto_asociado.
6. conflictos: detonante/desarrollo/resolución OBLIGATORIOS para conflicto_principal. Incluir conflictos_secundarios y conflictos_internos.
7. ritmo: equilibrio_dialogo_accion OBLIGATORIO. Incluir secciones_lentas y secciones_rapidas con sugerencias.
8. tematica: tema_principal DEBE ser un OBJETO con {nombre, descripcion, como_se_desarrolla, escenas_clave}. NO un string. simbolismos: MÍNIMO 2.
9. DAFO: impacto (alto|medio|bajo) y categoria (narrativa|produccion|mercado|audiencia) OBLIGATORIOS en cada elemento.
10. Scores: score_narrativo/comercial/festival (0-100) con rúbricas estrictas.
11. festivales_sugeridos: MÍNIMO 3 REALES (1 español + 1 internacional). comparables: MÍNIMO 3 REALES con año.
12. territorios_principales: MÍNIMO 2 (siempre España). ventanas_distribucion: MÍNIMO 2.
13. Para PROTAGONISTAS: ghost, stakes, transformacion, motivaciones, flaw_principal, funcion_narrativa, necesidad_dramatica son OBLIGATORIOS.
14. relaciones_personajes: Incluir las relaciones principales entre personajes.
15. viabilidad: Incluir factores_positivos y factores_negativos.
16. Devuelve SOLO el JSON, sin markdown ni explicaciones.`;

    console.log(`Enviando a Claude Sonnet (${paginasEstimadas} páginas estimadas)...`);

    // Llamada directa a la API de Anthropic (sin intermediarios)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: contextoProduccion }],
      }),
    });

    console.log('Claude - Status:', response.status);

    // Error handling específico
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude - Error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Límite de solicitudes excedido. Intenta de nuevo en unos momentos.' }),
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
          JSON.stringify({ success: false, error: 'API de Anthropic temporalmente sobrecargada. Intenta de nuevo en 30 segundos.' }),
          { status: 529, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();

    // Verificar stop_reason
    const stopReason = aiResponse.stop_reason;
    if (stopReason === 'max_tokens') {
      console.warn('Claude - Respuesta truncada por max_tokens, intentando parsear lo disponible...');
    }

    // Extraer texto de la respuesta de Claude
    const content = aiResponse.content?.[0]?.text;
    if (!content) {
      console.error('Claude - Sin contenido:', JSON.stringify(aiResponse));
      throw new Error('Claude no generó respuesta');
    }

    console.log('Claude - Contenido recibido, longitud:', content.length);
    console.log('Claude - Tokens usados:', JSON.stringify(aiResponse.usage));

    // Parse JSON from response
    let analisis;
    try {
      let jsonStr = content.trim();
      // Limpiar markdown fences si Claude las incluye
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
      console.error('Claude - Error parseando JSON:', parseError);
      console.error('Primeros 500 chars:', content.substring(0, 500));
      console.error('Últimos 500 chars:', content.substring(content.length - 500));

      // Intento de recuperación: buscar el JSON dentro del texto
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analisis = JSON.parse(jsonMatch[0]);
          console.log('Claude - JSON recuperado con regex fallback');
        } else {
          throw new Error('No se encontró JSON válido en la respuesta');
        }
      } catch (fallbackError) {
        throw new Error(`Error parseando respuesta de Claude: ${parseError instanceof Error ? parseError.message : 'JSON inválido'}`);
      }
    }

    console.log('✓ Análisis completado con Claude Sonnet');
    console.log('Personajes:', analisis.personajes?.length || 0);
    console.log('Localizaciones:', analisis.localizaciones?.length || 0);
    console.log('Secuencias:', analisis.desglose_secuencias?.length || 0);
    console.log('Errores Narrativos:', analisis.analisis_narrativo?.errores_narrativos?.length || 0);
    console.log('DAFO:', analisis.analisis_dafo ? 'Sí' : 'No');

    return new Response(
      JSON.stringify({
        success: true,
        analisis,
        metadata: {
          modelo: 'claude-sonnet-4-20250514',
          proveedor: 'anthropic',
          timestamp: new Date().toISOString(),
          paginas_estimadas: paginasEstimadas,
          version_analisis: '3.0',
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
