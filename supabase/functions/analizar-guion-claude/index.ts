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
        max_tokens: 32000,
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
