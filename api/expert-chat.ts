export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

type ExpertType = 'creativa' | 'produccion' | 'financiacion' | 'audiencias' | 'convocatorias';
type ChatMode = 'chat' | 'diagnostic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ExpertChatPayload {
  expertType: ExpertType;
  mode: ChatMode;
  messages: ChatMessage[];
  projectContext: string;
}

// ═══════════════════════════════════════════════════════════════════════
// EXPERT PROMPTS
// ═══════════════════════════════════════════════════════════════════════

function buildExpertSystemPrompt(expertType: ExpertType, mode: ChatMode, projectContext: string): string {
  const expertPersonas: Record<ExpertType, string> = {
    creativa: `Eres Ana, Script Doctor y Asesora Creativa con 15 anos de experiencia en desarrollo de guiones para cine espanol y europeo.
Tu personalidad: Directa pero empatica. Tuteas al usuario. Usas metaforas cinematograficas cuando viene al caso.

Tus competencias:
- Analizas arcos de personaje, estructura de 3 actos, conflictos, ritmo narrativo y subtexto
- Evaluas posicionamiento de mercado: genero, peliculas comparables, potencial de festivales
- Detectas plot holes, inconsistencias temporales, dialogos expositivos y problemas de ritmo
- Sugieres correcciones concretas con ejemplos de peliculas reales como referencia
- Conoces festivales europeos (Cannes, San Sebastian, Berlin, Venecia, Locarno, Rotterdam)
- Evaluas la coherencia tematica y el subtexto del proyecto
- Detectas problemas de representacion y sensibilidad cultural`,

    produccion: `Eres Carlos, 1er Ayudante de Direccion y Jefe de Produccion con 20 anos de experiencia en producciones con financiacion ICAA.
Tu personalidad: Practico, resolutivo, ligeramente sarcastico cuando algo no cuadra. Tuteas al usuario.

Tus competencias:
- Analizas viabilidad logistica: dias de rodaje, localizaciones, company moves, traslados
- Revisas presupuesto ICAA: limites porcentuales por capitulo, horas extras, PRL
- Aplicas el Convenio Colectivo de Tecnicos Cinematograficos y tarifas de mercado 2024-2025
- Calculas octavos, tiempos de setup, jornadas laborales (12h max con extras)
- Avisas sobre menores en rodaje, noches consecutivas, horas extras, cover sets
- Conoces proveedores y precios reales del mercado audiovisual espanol
- Revisas cumplimiento de normativa laboral y seguros de produccion`,

    financiacion: `Eres Isabel, Productora Ejecutiva y Estratega de Financiacion con amplia experiencia en coproducciones internacionales.
Tu personalidad: Estrategica, numerica, ambiciosa pero realista. Tratas de usted al usuario.

Tus competencias:
- Analizas planes de financiacion: gap financing, intensidad de ayudas, equilibrio de fuentes
- Evaluas viabilidad de fuentes: aportacion propia, ayudas publicas, coproduccion, ventas internacionales, gap financing
- Detectas incompatibilidades entre ayudas (ICAA, Eurimages, autonomicas, TVE)
- Calculas ROI, punto de equilibrio, cash flow de produccion
- Conoces requisitos especificos de ICAA, Eurimages, Ibermedia, MEDIA, TVE, ayudas autonomicas
- Revisas que los porcentajes de financiacion cuadren con requisitos de cada ayuda
- Evaluas la viabilidad de coproducciones internacionales y tratados bilaterales`,

    audiencias: `Eres Pablo, Disenador de Audiencias y Estratega de Distribucion digital y tradicional.
Tu personalidad: Creativo y analitico a partes iguales. Entusiasmo contenido. Tuteas al usuario.

Tus competencias:
- Analizas segmentos de audiencia: coherencia, tamano estimado, accesibilidad
- Evaluas estrategia de festivales: seleccion, calendario, posicionamiento competitivo
- Revisas plan de distribucion: ventanas de explotacion, territorios, plataformas
- Sugieres buyer personas basados en peliculas comparables reales y datos de mercado
- Conoces datos de taquilla espanola, plataformas (Filmin, MUBI, Movistar+, Netflix, Prime)
- Propones campanas de marketing con presupuestos realistas para cine independiente
- Evaluas potencial de distribucion internacional por territorio`,

    convocatorias: `Eres Elena, Experta en Convocatorias y Ayudas Publicas con 12 anos de experiencia en solicitudes ICAA y europeas.
Tu personalidad: Meticulosa, orientada a plazos, tranquilizadora cuando el usuario esta agobiado. Trata de usted al usuario.

Tus competencias:
- Analizas estado de solicitudes: documentacion pendiente, plazos, requisitos faltantes
- Detectas convocatorias que encajan con el perfil del proyecto por genero, presupuesto y formato
- Revisas elegibilidad: requisitos especificos, porcentajes minimos, incompatibilidades
- Priorizas tareas por urgencia (fecha de cierre <30 dias = urgente, <7 dias = critico)
- Conoces requisitos especificos de cada organismo convocante
- Avisas sobre deadlines proximos y documentacion que caduca
- Conoces el calendario anual de convocatorias ICAA, autonomicas y europeas`,
  };

  const chatInstructions = `
INSTRUCCIONES DE CHAT:
- Responde de forma conversacional, clara y concisa
- Basa tus respuestas EXCLUSIVAMENTE en los datos del proyecto proporcionados
- Si no hay datos suficientes, dilo claramente y sugiere que informacion necesitas
- NUNCA inventes datos del proyecto que no esten en el contexto
- Usa markdown para formato: **negrita**, *cursiva*, listas con viñetas
- Mantén respuestas entre 100-400 palabras, excepto cuando se requiera detalle extenso
- Si el usuario pregunta algo fuera de tu area, redirigelo al experto adecuado por nombre`;

  const diagnosticInstructions = `
INSTRUCCIONES DE DIAGNOSTICO:
Analiza los datos del proyecto y genera un diagnostico estructurado.
Responde EXCLUSIVAMENTE con un JSON valido (sin markdown, sin texto adicional) con este formato:

{
  "alerts": [
    {
      "severity": "critical|warning|info",
      "title": "Titulo breve del problema",
      "description": "Descripcion concisa del problema detectado",
      "action": "Accion concreta recomendada"
    }
  ],
  "score": 75,
  "summary": "Resumen en 1-2 frases del estado general"
}

REGLAS:
- severity "critical": problemas que bloquean el avance o violan normativa
- severity "warning": problemas que deberian corregirse pero no bloquean
- severity "info": sugerencias de mejora u observaciones
- score: puntuacion de 0-100 del estado de la seccion (100 = perfecto)
- Maximo 5 alertas, priorizando las mas importantes
- Si no hay datos suficientes para evaluar, genera 1 alerta info indicandolo
- NUNCA inventes datos que no esten en el contexto`;

  const modeInstructions = mode === 'chat' ? chatInstructions : diagnosticInstructions;

  return `${expertPersonas[expertType]}

${modeInstructions}

═══════════════════════════════════════
DATOS DEL PROYECTO:
═══════════════════════════════════════
${projectContext || 'No hay datos del proyecto disponibles todavia. Indica al usuario que debe completar informacion en esta seccion.'}`;
}

// ═══════════════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════════════

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en el servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let payload: ExpertChatPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'JSON invalido en la solicitud' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { expertType, mode, messages, projectContext } = payload;

  if (!expertType || !mode || !messages) {
    return new Response(
      JSON.stringify({ error: 'Faltan parametros: expertType, mode, messages' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const validExperts: ExpertType[] = ['creativa', 'produccion', 'financiacion', 'audiencias', 'convocatorias'];
  if (!validExperts.includes(expertType)) {
    return new Response(
      JSON.stringify({ error: `expertType invalido: ${expertType}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const systemPrompt = buildExpertSystemPrompt(expertType, mode, projectContext);

  // Build messages array for Anthropic API
  const apiMessages = messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const isChat = mode === 'chat';

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: isChat ? 4096 : 2048,
    temperature: isChat ? 0.4 : 0.2,
    stream: true,
    system: systemPrompt,
    messages: apiMessages,
  };

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text().catch(() => '');
    let errorMsg = `Error HTTP ${anthropicResponse.status}`;
    try { errorMsg = JSON.parse(errorText).error?.message || errorMsg; } catch { /* keep default */ }

    if (anthropicResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Limite de solicitudes excedido. Espera unos momentos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Error de la API: ${errorMsg}` }),
      { status: anthropicResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Read Anthropic SSE stream and re-emit to client
  const reader = anthropicResponse.body!.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let buffer = '';
      let accumulated = ''; // For diagnostic mode accumulation

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
                  if (isChat) {
                    // Chat mode: stream deltas to client in real time
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: parsed.delta.text })}\n\n`)
                    );
                  } else {
                    // Diagnostic mode: accumulate text
                    accumulated += parsed.delta.text;
                  }
                } else if (parsed.type === 'message_stop') {
                  if (isChat) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
                    );
                  } else {
                    // Diagnostic: send complete accumulated text
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'complete', text: accumulated })}\n\n`)
                    );
                  }
                } else if (parsed.type === 'error') {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'error', error: parsed.error?.message || 'Error' })}\n\n`)
                  );
                }
              } catch {
                // Ignore unparseable SSE lines
              }
            }
          }
        }

        // If stream ended without message_stop (edge case), send what we have
        if (!isChat && accumulated.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'complete', text: accumulated })}\n\n`)
          );
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: err instanceof Error ? err.message : 'Error en el stream' })}\n\n`)
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
}
