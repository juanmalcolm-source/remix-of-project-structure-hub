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
- Actor: maximo 7 dias de espera entre jornadas (optimizar para minimizar "idle days")

## COMIDAS Y DESCANSOS (OBLIGATORIO)

- PRIMERA COMIDA: obligatoria antes de las 6h de jornada (regla de las 6 horas, convenio colectivo espanol)
- Duracion comida: 1 hora (estandar Espana)
- Al calcular estimatedHours: INCLUIR 1h de comida como overhead fijo
- Jornada efectiva de rodaje = targetHours - 1h comida (ej: jornada 10h = 9h rodaje efectivo)
- SEGUNDA COMIDA: si jornada supera 12h, segunda comida obligatoria (+1h mas)
- El campo "mealBreakAfterScene" indica tras que escena (sequence_number) cae la comida
- Colocar la comida en un corte natural: cambio de setup, localizacion o iluminacion

## TRASLADOS (COMPANY MOVES)

- MAXIMO 1 traslado de localizacion por jornada (idealmente 0)
- 2 traslados SOLO si localizaciones estan a menos de 15 min entre si
- Cada traslado consume 45-90 min (desmontaje 30min + viaje + montaje nuevo setup)
- Dias con traslado: reducir octavos planificados un 15% respecto al maximo
- Campo "companyMoves" en cada shootingDay (0, 1, o maximo 2)
- PROHIBIDO: 3+ localizaciones distintas en un dia (salvo localizaciones en mismo recinto)

## CONTINUIDAD Y dia_ficcion

- dia_ficcion = numero de dia dentro de la historia (campo proporcionado en las escenas)
- Escenas del mismo dia_ficcion: AGRUPAR en sesiones cercanas (misma semana si posible)
- Escenas con progresion fisica (heridas, maquillaje FX, envejecimiento): rodar en secuencia cronologica
- ATARDECER/AMANECER: ventana real de golden hour = 30-45 min utiles de rodaje
- DAY-FOR-NIGHT: sugerir como nota cuando escenas NOCHE EXT podrian rodarse de DIA con filtros, ahorrando jornada nocturna completa
- Si dia_ficcion es null, ignorar esta restriccion para esa escena

## COVER SETS (CONTINGENCIA LLUVIA)

- Para cada dia con escenas EXT, identificar 1-2 escenas INT alternativas como cover sets
- Cover sets DEBEN usar actores YA convocados ese dia (no convocar actores extra)
- Cover sets son escenas que pueden adelantarse de dias posteriores sin romper el plan
- Campo "coverSets" con [{sceneId, title, reason}] en cada shootingDay que tenga EXT
- Si no hay escenas INT disponibles con los mismos actores, dejar coverSets vacio

## AGRUPACION EQUIPAMIENTO ESPECIAL

- Escenas con requiere_grua: AGRUPAR en 1-2 dias (alquiler diario grua 200-600 EUR)
- Escenas con planos_especiales (steadicam/drone): AGRUPAR en dias consecutivos
- Escenas con vehiculos_movimiento: AGRUPAR (necesitan coordinacion policial y cortes de trafico)
- Campo "specialEquipment" con array ["grua", "steadicam", "drone", "vehiculos"] por dia
- NUNCA repartir escenas de grua en mas de 2-3 dias salvo imposibilidad logistica

## MENORES EN RODAJE (REGLAS POR FRANJA DE EDAD)

- Menores 12-16 anos: max 8h jornada, PROHIBIDO horario nocturno (21h-8h), descanso cada 3h
- Menores 6-12 anos: max 6h jornada, descanso cada 2h, tutor obligatorio en set
- Bebes y menores <6 anos: max 2h en set, pediatra disponible
- CONCENTRAR escenas de menores en el MINIMO de dias posible
- NUNCA programar menores el ultimo dia de la semana (viernes/sabado — riesgo de extension)
- Si edad_aproximada del personaje indica menor, aplicar estas restricciones automaticamente
- Warning obligatorio si menor + escena nocturna detectada

## DIAS DE CONTINGENCIA

- Recomendar 1 dia de contingencia por cada 5 dias de rodaje (ratio 20%), maximo 3 dias
- Dias de contingencia NO tienen escenas asignadas
- En summary: campos "contingencyDays" (numero) y "contingencyRationale" (explicacion)
- Generar warnings para dias con ALTO riesgo EXT + clima impredecible
- Orden sugerido: intercalar contingencia cada 5-6 dias de rodaje

## CONVOCATORIAS ESCALONADAS

- Maquillaje FX/protesis: convocar +2h antes del inicio de rodaje
- Protagonistas maquillaje estandar: convocar +1h antes
- Secundarios/reparto: convocar +30min antes
- Figuracion: convocar 30min antes de SU escena, NO al inicio de la jornada (evitar horas muertas)
- Campo "callTimeNotes" por dia con indicaciones de convocatoria escalonada
- Ejemplo: "07:00 MQ FX (CLARA herida), 08:00 Protagonistas, 08:30 Secundarios, 10:00 Figuración Esc.12"

## CRITERIOS DE OPTIMIZACION (por prioridad)

1. **Localizacion**: Agrupar escenas de la misma localizacion para minimizar traslados y montajes
2. **Company moves**: Maximo 1 traslado por dia; penalizar dias con 2+ localizaciones distantes
3. **Continuidad temporal**: Separar DIA y NOCHE (diferentes setups de iluminacion)
4. **dia_ficcion**: Escenas del mismo dia de ficcion en la misma semana
5. **Actores**: Concentrar dias de trabajo de cada actor para minimizar "idle days" (dias muertos)
6. **Equipamiento especial**: Agrupar escenas de grua/steadicam/drone en dias consecutivos
7. **Menores**: Concentrar en minimo de dias, respetar franjas horarias por edad
8. **Distancia entre localizaciones**: Si hay datos de distancia, minimizar traslados entre jornadas consecutivas
9. **Complejidad**: No acumular muchas escenas complejas en un solo dia
10. **Balance**: Distribuir la carga de trabajo equitativamente entre jornadas

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
      "companyMoves": 0,
      "mealBreakAfterScene": 5,
      "specialEquipment": [],
      "callTimeNotes": "08:00 Protagonistas, 08:30 Secundarios",
      "weatherRisk": "bajo",
      "coverSets": [],
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
    "contingencyDays": 3,
    "contingencyRationale": "3 dias contingencia (ratio 20% sobre 15 dias rodaje). Intercalados tras dias 5, 10 y 15.",
    "equipmentDays": {
      "crane": [3, 4],
      "steadicam": [7, 8],
      "drone": [12]
    },
    "nightBlocks": [
      { "startDay": 8, "endDay": 10, "nights": 3 }
    ],
    "rationale": "Estrategia general de optimizacion...",
    "optimizations": [
      "Agrupadas 12 escenas de CASA DE CLARA en 3 dias consecutivos",
      "Actor PEDRO concentrado en dias 1-8 para minimizar idle days",
      "Escenas de grua concentradas en dias 3-4 (ahorro alquiler)",
      "Comida programada tras cambios de setup para optimizar tiempo"
    ],
    "warnings": [
      "Dias 8-10: 3 noches consecutivas",
      "Dia 5: jornada de 11.2h, cerca del maximo",
      "Dia 7: 1 company move (PARQUE -> OFICINA, ~35 min)"
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
6. estimatedHours: calcula con formula PRD v3.0 (setup + rodaje + cobertura + complejidad + transiciones) + 1h comida obligatoria.
7. targetHours: ${isCorto ? '8' : '10'} (horas objetivo por jornada, INCLUYENDO 1h comida).
8. remainingHours = targetHours - estimatedHours.
9. characters del dia = union de characters de todas sus escenas.
10. warnings: genera avisos si estimatedHours > 10h, menores en nocturnas, >1 company move, equipamiento no agrupado, etc.
11. timeOfDay del dia: predominante entre sus escenas (DIA, NOCHE, MIXTO).
12. companyMoves: contar localizaciones DISTINTAS - 1 (ej: 2 localizaciones = 1 company move). MAXIMO 2.
13. mealBreakAfterScene: sequence_number de la escena tras la que cae la comida (antes de 6h de rodaje).
14. coverSets: para dias con EXT, listar escenas INT alternativas con actores ya convocados. Array vacio si no hay.
15. specialEquipment: agregar equipamiento del dia basado en complejidad_factores de sus escenas.
16. callTimeNotes: generar notas de convocatoria escalonada segun maquillaje y tipo de actor.
17. weatherRisk: "alto" si >60% de octavos del dia son EXT, "medio" si 30-60%, "bajo" si <30%.
18. contingencyDays y contingencyRationale en summary: calcular dias buffer recomendados.
19. equipmentDays en summary: mapear en que dias se necesita grua, steadicam, drone.
20. nightBlocks en summary: agrupar dias de noche consecutivos con start/end.`;
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
  // Nuevos campos para prompt mejorado
  dia_ficcion?: number | null;
  requiere_grua?: boolean;
  planos_especiales?: boolean;
  vehiculos_movimiento?: boolean;
}

interface LocationInput {
  id: string;
  name: string;
  zone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  production_notes?: string | null;
  special_needs?: string | null;
}

interface CharacterInput {
  id: string;
  name: string;
  category: string | null;
  scenes_count: number;
  edad_aproximada?: string | null;
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
  // Formatear escenas con nuevos datos (dia_ficcion, equipamiento)
  const scenesText = data.scenes.map(s => {
    const factors = s.complejidad_factores ? Object.entries(s.complejidad_factores)
      .filter(([, v]) => v === true || (typeof v === 'number' && v > 0))
      .map(([k]) => k)
      .join(', ') : '';
    const timeInfo = s.total_time_minutes
      ? ` | precalc: ${s.setup_time_minutes}min setup + ${s.shooting_time_minutes}min rodaje = ${s.total_time_minutes}min total`
      : '';
    // Nuevo: dia_ficcion
    const diaFiccion = s.dia_ficcion != null ? ` | dia_ficcion: ${s.dia_ficcion}` : '';
    // Nuevo: flags de equipamiento especial
    const equipFlags: string[] = [];
    if (s.requiere_grua) equipFlags.push('GRUA');
    if (s.planos_especiales) equipFlags.push('STEADICAM/DRONE');
    if (s.vehiculos_movimiento) equipFlags.push('VEHICULOS');
    const equipText = equipFlags.length > 0 ? ` | equipo: ${equipFlags.join(', ')}` : '';

    return `- [${s.id}] Sec ${s.sequence_number}: "${s.title}" | ${s.page_eighths} octavos (eff: ${s.effectiveEighths}) | ${s.int_ext || '?'}. ${s.location_name} - ${s.time_of_day} | complejidad: ${s.scene_complexity} | personajes: ${s.characters.join(', ') || 'ninguno'}${factors ? ` | factores: ${factors}` : ''}${timeInfo}${diaFiccion}${equipText}`;
  }).join('\n');

  // Formatear localizaciones con production_notes y special_needs
  const locationsText = data.locations.map(l => {
    const coords = l.latitude && l.longitude ? ` (${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)})` : '';
    const notes = l.production_notes ? ` | notas: "${l.production_notes}"` : '';
    const needs = l.special_needs ? ` | necesidades: "${l.special_needs}"` : '';
    return `- [${l.id}] ${l.name} | zona: ${l.zone || 'sin zona'}${coords}${l.address ? ` | ${l.address}` : ''}${notes}${needs}`;
  }).join('\n');

  // Formatear personajes con flag de MENOR si edad_aproximada indica menor de 16
  const charactersText = data.characters.map(c => {
    let menorFlag = '';
    if (c.edad_aproximada) {
      const edadNum = parseInt(c.edad_aproximada.replace(/\D/g, ''), 10);
      if (!isNaN(edadNum) && edadNum < 16) {
        menorFlag = ` (MENOR edad ~${edadNum})`;
      }
    }
    return `- ${c.name} (${c.category || 'sin categoria'})${menorFlag} — aparece en ${c.scenes_count} escenas`;
  }).join('\n');

  const distancesText = data.distances.length > 0
    ? data.distances.map(d => `- ${d.from} → ${d.to}: ${d.distance_km} km (~${d.duration_minutes} min)`).join('\n')
    : 'No hay datos de distancia disponibles. Optimiza por agrupacion de localizacion.';

  // Construir seccion de restricciones adicionales
  const menores = data.characters.filter(c => {
    if (!c.edad_aproximada) return false;
    const edadNum = parseInt(c.edad_aproximada.replace(/\D/g, ''), 10);
    return !isNaN(edadNum) && edadNum < 16;
  });
  const escenasConGrua = data.scenes.filter(s => s.requiere_grua).length;
  const escenasConSteadicam = data.scenes.filter(s => s.planos_especiales).length;
  const escenasConVehiculos = data.scenes.filter(s => s.vehiculos_movimiento).length;
  const escenasExt = data.scenes.filter(s => (s.int_ext || '').toUpperCase().includes('EXT')).length;
  const locConNotas = data.locations.filter(l => l.production_notes).length;

  let restriccionesExtra = '\nRESTRICCIONES ADICIONALES:\n';
  if (menores.length > 0) {
    restriccionesExtra += `- HAY ${menores.length} MENOR(ES): ${menores.map(m => `${m.name} (edad ~${m.edad_aproximada})`).join(', ')}. Aplicar reglas de menores por franja de edad.\n`;
  }
  if (escenasConGrua > 0) {
    restriccionesExtra += `- ${escenasConGrua} escenas necesitan GRUA. AGRUPAR en 1-2 dias.\n`;
  }
  if (escenasConSteadicam > 0) {
    restriccionesExtra += `- ${escenasConSteadicam} escenas con PLANOS ESPECIALES (steadicam/drone). AGRUPAR en dias consecutivos.\n`;
  }
  if (escenasConVehiculos > 0) {
    restriccionesExtra += `- ${escenasConVehiculos} escenas con VEHICULOS EN MOVIMIENTO. AGRUPAR (coordinacion policial).\n`;
  }
  if (escenasExt > 0) {
    restriccionesExtra += `- ${escenasExt} escenas EXTERIORES (${Math.round(escenasExt / data.scenes.length * 100)}% del total). Necesitan cover sets.\n`;
  }
  if (locConNotas > 0) {
    restriccionesExtra += `- ${locConNotas} localizaciones con NOTAS DE PRODUCCION (permisos, horarios). Revisar restricciones.\n`;
  }

  return `Genera un plan de rodaje optimizado para este proyecto.

CONFIGURACION:
- Horas objetivo por jornada: ${data.targetHoursPerDay}h (INCLUYE 1h comida = ${data.targetHoursPerDay - 1}h rodaje efectivo)
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
${restriccionesExtra}
INSTRUCCIONES:
- Genera el plan completo con TODAS las ${data.scenes.length} escenas asignadas.
- Agrupa por localizacion primero, luego optimiza actores, equipamiento y complejidad.
- MAXIMO 1 company move por dia. 2 SOLO si localizaciones a <15 min.
- Agrupa escenas de grua/steadicam/drone en dias consecutivos.
- Para dias con EXT, proporciona cover sets con escenas INT de actores ya convocados.
- Incluye 1 dia contingencia por cada 5 dias de rodaje.
- Calcula estimatedHours con PRD v3.0 + 1h comida obligatoria.
- Incluye convocatorias escalonadas en callTimeNotes.
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
