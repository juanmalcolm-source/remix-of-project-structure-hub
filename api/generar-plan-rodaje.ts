export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ── System prompt: 1er Ayudante de Direccion experto ─────────────────

function buildSystemPrompt(productionType: string): string {
  const isCorto = productionType === 'cortometraje';
  const ritmo = isCorto ? '2-3 paginas/dia (16-24 octavos)' : '3-5 paginas/dia (24-40 octavos)';

  return `Eres un 1er Ayudante de Direccion (1er AD) espanol con 20 anos de experiencia en planificacion de rodajes para cine y television.
Tu trabajo es generar un PLAN DE RODAJE (shooting schedule) optimizado, profesional y realista.

TIPO DE PRODUCCION: ${isCorto ? 'CORTOMETRAJE (hasta 60 min)' : 'LARGOMETRAJE (60+ min)'}
RITMO ESPERADO: ${ritmo}

## LEY DE LOS OCTAVOS

- 1 pagina de guion (Courier 12) = 8 octavos
- El minimo por escena es 1/8
- Una pagina ≈ 1 minuto en pantalla

## FORMULA PRD v3.0 — Calculo de tiempo de rodaje

Tiempos base:
- Rodaje: octavos x 13 min (1 pagina completa = 104 min de rodaje puro)
- Setup INTERIOR: 30 min
- Setup EXTERIOR: 45 min
- Bonus NOCHE: +15 min al setup
- Mini-setup (misma localizacion, cambio escena): 10 min
- Transicion entre escenas: 5 min

Cobertura extra:
- Accion/stunts: +50% del rodaje base
- Dialogo extenso: +30% del rodaje base

## RESTRICCIONES LABORALES

- Jornada maxima: 12 horas (aviso a partir de 10h)
- Descanso entre jornadas: minimo 12 horas
- Maximo 5 noches consecutivas (aviso a 3)
- Dia de descanso cada 6 jornadas
- Menores: maximo 8 horas, sin escenas nocturnas
- Actor: maximo 7 dias de espera entre jornadas (optimizar para minimizar "idle days")

## CRITERIOS DE OPTIMIZACION (por prioridad)

1. **Localizacion**: Agrupar escenas de la misma localizacion para minimizar traslados y montajes
2. **Continuidad temporal**: Separar DIA y NOCHE (diferentes setups de iluminacion)
3. **Actores**: Concentrar dias de trabajo de cada actor para minimizar "idle days" (dias muertos)
4. **Distancia entre localizaciones**: Si hay datos de distancia, minimizar traslados entre jornadas consecutivas
5. **Complejidad**: No acumular muchas escenas complejas en un solo dia
6. **Balance**: Distribuir la carga de trabajo equitativamente entre jornadas

## FORMATO DE RESPUESTA

Responde EXCLUSIVAMENTE con un JSON valido (sin markdown, sin texto adicional):

{
  "shootingDays": [
    {
      "dayNumber": 1,
      "location": "NOMBRE_PRINCIPAL_LOCALIZACION",
      "locationId": "uuid-de-localizacion-o-null",
      "locations": ["LOC1", "LOC2"],
      "timeOfDay": "DIA",
      "scenes": [
        {
          "id": "uuid-escena",
          "sequence_number": 1,
          "title": "INT. CASA DE CLARA - DIA",
          "page_eighths": 4,
          "effectiveEighths": 4.8,
          "scene_complexity": "media",
          "characters": ["CLARA", "PEDRO"],
          "location_name": "CASA DE CLARA",
          "time_of_day": "DIA",
          "int_ext": "INT",
          "complejidad_factores": null
        }
      ],
      "totalEighths": 28,
      "estimatedHours": 9.5,
      "targetHours": 10,
      "remainingHours": 0.5,
      "characters": ["CLARA", "PEDRO"],
      "warnings": [],
      "notes": "Razonamiento de agrupacion para este dia"
    }
  ],
  "summary": {
    "totalDays": 15,
    "rationale": "Estrategia general de optimizacion...",
    "optimizations": [
      "Agrupadas 12 escenas de CASA DE CLARA en 3 dias consecutivos",
      "Actor PEDRO concentrado en dias 1-8 para minimizar idle days"
    ],
    "warnings": [
      "Dias 8-10: 3 noches consecutivas",
      "Dia 5: jornada de 11.2h, cerca del maximo"
    ],
    "actorScheduleSummary": {
      "CLARA": { "totalDays": 12, "firstDay": 1, "lastDay": 15, "waitDays": 3 },
      "PEDRO": { "totalDays": 8, "firstDay": 1, "lastDay": 10, "waitDays": 2 }
    }
  }
}

## REGLAS CRITICAS

1. Cada escena del input debe aparecer EXACTAMENTE 1 vez en el output. No fabricar ni omitir escenas.
2. Usa los IDs exactos (uuid) de las escenas tal como vienen en el input.
3. Si una escena tiene location_id, usa ese locationId en el dia. Si no, usa null.
4. Copia los campos de cada escena tal como vienen (id, sequence_number, title, page_eighths, effectiveEighths, scene_complexity, characters, location_name, time_of_day, int_ext, complejidad_factores).
5. totalEighths del dia = suma de effectiveEighths de sus escenas.
6. estimatedHours: calcula con la formula PRD v3.0 (setup + rodaje + cobertura + complejidad + transiciones).
7. targetHours: ${isCorto ? '8' : '10'} (horas objetivo por jornada).
8. remainingHours = targetHours - estimatedHours.
9. characters del dia = union de characters de todas sus escenas.
10. warnings: genera avisos si estimatedHours > 10h, si hay menores en nocturnas, si muchas localizaciones en un dia, etc.
11. timeOfDay del dia: predominante entre sus escenas (DIA, NOCHE, MIXTO).`;
}

// ── User prompt builder ──────────────────────────────────────────────

interface SceneInput {
  id: string;
  sequence_number: number;
  title: string;
  description: string;
  location_name: string;
  location_id: string | null;
  time_of_day: string;
  page_eighths: number;
  effectiveEighths: number;
  scene_complexity: string;
  characters: string[];
  int_ext: string | null;
  complejidad_factores: Record<string, boolean | number> | null;
  setup_time_minutes?: number;
  shooting_time_minutes?: number;
  total_time_minutes?: number;
}

interface LocationInput {
  id: string;
  name: string;
  zone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface CharacterInput {
  id: string;
  name: string;
  category: string | null;
  scenes_count: number;
}

interface DistanceInput {
  from: string;
  to: string;
  distance_km: number;
  duration_minutes: number;
}

interface RequestData {
  projectId: string;
  productionType: string;
  targetHoursPerDay: number;
  maxEighthsPerDay: number;
  separateDayNight: boolean;
  scenes: SceneInput[];
  locations: LocationInput[];
  characters: CharacterInput[];
  distances: DistanceInput[];
}

function buildUserPrompt(data: RequestData): string {
  const scenesText = data.scenes.map(s => {
    const factors = s.complejidad_factores ? Object.entries(s.complejidad_factores)
      .filter(([, v]) => v === true || (typeof v === 'number' && v > 0))
      .map(([k]) => k)
      .join(', ') : '';
    const timeInfo = s.total_time_minutes
      ? ` | precalc: ${s.setup_time_minutes}min setup + ${s.shooting_time_minutes}min rodaje = ${s.total_time_minutes}min total`
      : '';
    return `- [${s.id}] Sec ${s.sequence_number}: "${s.title}" | ${s.page_eighths} octavos (eff: ${s.effectiveEighths}) | ${s.int_ext || '?'}. ${s.location_name} - ${s.time_of_day} | complejidad: ${s.scene_complexity} | personajes: ${s.characters.join(', ') || 'ninguno'}${factors ? ` | factores: ${factors}` : ''}${timeInfo}`;
  }).join('\n');

  const locationsText = data.locations.map(l => {
    const coords = l.latitude && l.longitude ? ` (${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)})` : '';
    return `- [${l.id}] ${l.name} | zona: ${l.zone || 'sin zona'}${coords}${l.address ? ` | ${l.address}` : ''}`;
  }).join('\n');

  const charactersText = data.characters.map(c =>
    `- ${c.name} (${c.category || 'sin categoria'}) — aparece en ${c.scenes_count} escenas`
  ).join('\n');

  const distancesText = data.distances.length > 0
    ? data.distances.map(d => `- ${d.from} → ${d.to}: ${d.distance_km} km (~${d.duration_minutes} min)`).join('\n')
    : 'No hay datos de distancia disponibles. Optimiza por agrupacion de localizacion.';

  return `Genera un plan de rodaje optimizado para este proyecto.

CONFIGURACION:
- Horas objetivo por jornada: ${data.targetHoursPerDay}h
- Maximo octavos por jornada: ${data.maxEighthsPerDay}
- Separar DIA/NOCHE: ${data.separateDayNight ? 'SI' : 'NO'}

ESCENAS (${data.scenes.length} total):
${scenesText}

LOCALIZACIONES (${data.locations.length}):
${locationsText}

PERSONAJES (${data.characters.length}):
${charactersText}

DISTANCIAS ENTRE LOCALIZACIONES:
${distancesText}

INSTRUCCIONES:
- Genera el plan completo con TODAS las ${data.scenes.length} escenas asignadas.
- Agrupa por localizacion primero, luego optimiza actores y complejidad.
- Usa la formula PRD v3.0 para calcular estimatedHours de cada dia.
- Responde SOLO con JSON valido, sin texto adicional.`;
}

// ── Main handler ─────────────────────────────────────────────────────

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key no configurada' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let requestData: RequestData;
  try {
    requestData = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!requestData.scenes || !Array.isArray(requestData.scenes) || requestData.scenes.length === 0) {
    return new Response(JSON.stringify({ error: 'No hay escenas para planificar' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const productionType = requestData.productionType || 'largometraje';
  const systemPrompt = buildSystemPrompt(productionType);
  const userPrompt = buildUserPrompt(requestData);

  // Stream from Anthropic with stream:true
  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 64000,
      temperature: 0.2,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text().catch(() => '');
    let errorMsg = `Error HTTP ${anthropicResponse.status}`;
    try { errorMsg = JSON.parse(errorText).error?.message || errorMsg; } catch { /* keep default */ }

    return new Response(
      JSON.stringify({ error: `Error de la API: ${errorMsg}` }),
      { status: anthropicResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Accumulate ALL text server-side, send ONE complete event to avoid browser SSE data loss
  const reader = anthropicResponse.body!.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let buffer = '';
      let fullText = '';

      // Heartbeat every 5s to keep Vercel/browser connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'progress', length: fullText.length })}\n\n`)
          );
        } catch { clearInterval(heartbeat); }
      }, 5000);

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
                  fullText += parsed.delta.text;
                } else if (parsed.type === 'error') {
                  clearInterval(heartbeat);
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

        clearInterval(heartbeat);

        // Send ALL accumulated text in ONE event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete', text: fullText })}\n\n`)
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        );
      } catch (err) {
        clearInterval(heartbeat);
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
