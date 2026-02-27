export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ── System prompt builder with real market data ─────────────────────

function buildSystemPrompt(projectType: string, budgetLevel: string): string {
  const isCorto = projectType === 'cortometraje';
  const categoriaSalarial = budgetLevel === 'alto' ? 'presupuesto_estandar' : 'bajo_presupuesto';

  return `Eres un Director de Produccion cinematografico espanol con 20 anos de experiencia en presupuestos ICAA (Instituto de la Cinematografia y de las Artes Audiovisuales).
Generas presupuestos de coste detallados siguiendo el formulario 601 del ICAA.

TIPO DE PROYECTO: ${isCorto ? 'CORTOMETRAJE (hasta 60 min)' : 'LARGOMETRAJE (60+ min)'}
NIVEL: ${budgetLevel}
CATEGORIA SALARIAL: ${categoriaSalarial === 'bajo_presupuesto' ? 'Bajo Presupuesto (<=1.125.000 EUR)' : 'Presupuesto Estandar (>1.125.000 EUR)'}

## ESTRUCTURA ICAA FORMULARIO 601 (formato CC.SS)

Cap 01 - GUION Y MUSICA
  01.01 Guion (derechos autor, guion original, adaptacion, dialogos, storyboard)
  01.02 Musica (derechos, compositor, interpretes, grabacion)
  01.03 Obras externas sujetas a derechos

Cap 02 - PERSONAL ARTISTICO
  02.01 Protagonistas | 02.02 Principales | 02.03 Secundarios
  02.04 Pequenas partes | 02.05 Figuracion | 02.06 Especialistas
  02.07 Ballet/Orquestas | 02.08 Doblaje

Cap 03 - EQUIPO TECNICO
  03.01 Direccion | 03.02 Produccion | 03.03 Fotografia
  03.04 Decoracion | 03.05 Vestuario | 03.06 Maquillaje
  03.07 Peluqueria | 03.08 EFX mecanicos | 03.09 Sonido
  03.10 Montaje | 03.11 Electricos/Maquinistas
  03.12 Personal complementario | 03.13 Segunda Unidad

Cap 04 - ESCENOGRAFIA
  04.01 Decorados y construccion | 04.02 Ambientacion/Attrezzo
  04.03 Vestuario | 04.04 Semovientes | 04.05 Varios

Cap 05 - ESTUDIOS RODAJE/SONORIZACION Y VARIOS PRODUCCION
  05.01 Estudios rodaje | 05.02 Montaje y sonorizacion
  05.03 Varios produccion

Cap 06 - MAQUINARIA, RODAJE Y TRANSPORTES
  06.01 Maquinaria y elementos rodaje | 06.02 Transportes

Cap 07 - VIAJES, DIETAS Y COMIDAS
  07.01 Desplazamientos | 07.02 Hoteles y comidas

Cap 08 - PELICULA VIRGEN / SOPORTE DIGITAL
  08.01 Negativo, positivo, soporte digital

Cap 09 - LABORATORIO / PROCESOS DIGITALES
  09.01 Laboratorio analogico | 09.02 Efectos digitales y varios

Cap 10 - SEGUROS
  10.01 Seguros produccion | 10.02 Seguridad Social complementaria

Cap 11 - GASTOS GENERALES
  11.01 Generales (oficina, comunicaciones, asesoria, imprevistos)

Cap 12 - GASTOS EXPLOTACION, COPIAS Y PUBLICIDAD
  12.01 Copias distribucion | 12.02 Publicidad y marketing

## TARIFAS EQUIPO TECNICO — Convenio Colectivo Tecnicos (Agosto 2025)

Categoria: ${categoriaSalarial} (EUR/semana)

DIRECCION:
  Director/Realizador: ${categoriaSalarial === 'bajo_presupuesto' ? '4.713' : '5.890'}
  1er Ayudante Direccion: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}
  2o Ayudante Direccion: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}
  Script/Continuidad: ${categoriaSalarial === 'bajo_presupuesto' ? '2.197' : '2.747'}

PRODUCCION:
  Director Produccion: ${categoriaSalarial === 'bajo_presupuesto' ? '3.954' : '4.882'}
  Jefe Produccion: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}
  Ayudante Produccion: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}
  Auxiliar Produccion: ${categoriaSalarial === 'bajo_presupuesto' ? '1.717' : '2.079'}

FOTOGRAFIA:
  Director Fotografia: ${categoriaSalarial === 'bajo_presupuesto' ? '3.954' : '4.882'}
  Operador Camara: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}
  1er Ayudante Camara: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}
  Foquista: ${categoriaSalarial === 'bajo_presupuesto' ? '2.197' : '2.747'}

DECORACION:
  Director Arte: ${categoriaSalarial === 'bajo_presupuesto' ? '3.954' : '4.882'}
  Decorador: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}
  Attrezzista: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}

VESTUARIO: Figurinista: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}
MAQUILLAJE: Jefe Maquillaje: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}
PELUQUERIA: Jefe Peluqueria: ${categoriaSalarial === 'bajo_presupuesto' ? '2.197' : '2.747'}
SONIDO: Jefe Sonido: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}, Micro: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}
MONTAJE: Montador: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}, Ayud: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}
ELECTRICOS: Jefe: ${categoriaSalarial === 'bajo_presupuesto' ? '2.197' : '2.747'}, Electrico: ${categoriaSalarial === 'bajo_presupuesto' ? '1.717' : '2.079'}
MAQUINISTA: Jefe: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}, Ayud: ${categoriaSalarial === 'bajo_presupuesto' ? '1.717' : '2.079'}

## TARIFAS EQUIPAMIENTO (EUR/dia, datos mercado espanol 2024-2025)

CAMARA: ARRI Alexa Mini pack 450/dia | RED V-Raptor 400/dia | Blackmagic URSA 120/dia
OPTICA: Juego primos master 300/dia | Primos medio 150/dia | Zoom cine 100/dia
ILUMINACION: Kit basico 80/dia | Kit medio 200/dia | Kit avanzado 450/dia
SONIDO: Kit directo 150/dia | Micros extra 50/dia
GRIP: Dolly+via 120/dia | Grua peq 200/dia | Steadicam 300/dia | Drone+piloto 600/dia

## TARIFAS POSTPRODUCCION (datos facturas reales Antaviana/El Colorado 2024-2025)

ETALONAJE: Corto 2.000-5.000 | Largo 10.000-25.000 (1.600/dia HDR)
SONIDO POSTPRO:
  Diseno sonoro: Corto 2.000 | Largo 21.450 (715/dia x 30 dias)
  Edicion dialogos: Corto 1.500 | Largo 17.000 (680/dia x 25 dias)
  Foley: Corto 1.000 | Largo 10.000
  Mezcla 5.1: Corto 3.000 | Largo 12.000
VFX: Plano simple 300-800 | Medio 800-2.500 | Complejo 2.500-8.000
GRAFISMO: Titulos+creditos: Corto 800 | Largo 4.600
DCP: 2K 1.500 | 4K 2.250 | IMF Netflix 1.800
SUBTITULOS: Transcripcion 4,80/min | Traduccion 10,80/min | Accesibilidad 22/min
COORDINACION POSTPRO: Corto 1.500 | Largo 9.000

## REGLAS DE CALCULO OBLIGATORIAS

- Seguridad Social empresa: 23,5% sobre remuneracion bruta (Cap 10.02 o incluido en Cap 03)
- IRPF retencion: 15% general, 19% para ingresos >60.000 EUR/anual
- Dietas: 55 EUR/dia completa (personal desplazado), 15 EUR media dieta
- Seguros: RC ~0,3% presupuesto, Accidentes ~0,2%, Interrupcion ~0,5%, Equipo ~0,8%
- Gastos generales: ~5% del presupuesto de produccion (Cap 01-10)
- Imprevistos: ~10% (incluir en Cap 11)

## DIFERENCIAS ${isCorto ? 'CORTOMETRAJE' : 'LARGOMETRAJE'}

${isCorto ? `CORTOMETRAJE:
- Equipo reducido: ~7-10 personas clave (sin 2o ayte dir, sin auxiliares)
- Rodaje tipico: 3-10 dias
- Presupuesto total tipico: 15.000-150.000 EUR
- Sin Cap 02.07/02.08 normalmente
- Sin Segunda Unidad (03.13)
- Postproduccion corta: 2-6 semanas montaje
- Mezcla estereo o 5.1 sencilla
- Master digital (sin DCP normalmente, o DCP basico)
- Sin gastos distribucion/marketing significativos` : `LARGOMETRAJE:
- Equipo completo: 20-30+ personas
- Rodaje tipico: 20-50 dias
- Presupuesto total tipico: 300.000-5.000.000 EUR
- 2-3 ayudantes direccion, auxiliares en cada departamento
- Segunda Unidad posible
- Postproduccion: 3-6 meses montaje + mezcla 5.1 Dolby
- DCP 2K/4K + masters para plataformas
- Marketing y distribucion significativos`}

## EJEMPLO DE PRESUPUESTO REAL

${isCorto ? `Cortometraje ficcion "ED" — 5 dias rodaje, bajo presupuesto, Madrid
Cap 01 Guion y Musica: 6.500 EUR
  01.01.02 Guion original: 5.000 | 01.02.02 Compositor: 1.500
Cap 02 Personal Artistico: 4.200 EUR
  02.01 Protagonista (5 dias x 500): 2.500 | 02.03 Secundarios: 1.200 | 02.05 Figuracion: 500
Cap 03 Equipo Tecnico: 26.800 EUR
  03.01.01 Director: 9.426 (2 sem) | 03.02.01 Dir.Produccion: 7.908 (2 sem)
  03.03.01 Dir.Foto: 7.908 (2 sem) | 03.09.01 Jefe Sonido: 5.272 (2 sem)
  03.06.01 Maquillaje: 2.636 (1 sem) | 03.10.01 Montador: 5.272 (2 sem)
  03.11.01 Jefe Electricos: 2.197 (1 sem)
  +SS empresa 23,5%: ~6.300
Cap 04 Escenografia: 3.500 EUR
Cap 05 Estudios/Varios: 5.000 EUR
Cap 06 Maquinaria: 7.500 EUR (camara 5 dias, iluminacion, transporte)
Cap 07 Viajes/Dietas: 3.800 EUR (15 pers x 5 dias x 55 dieta = 4.125, ajustado)
Cap 08 Soporte digital: 500 EUR
Cap 09 Postproduccion: 6.500 EUR (etalonaje 2.500 + sonido 3.000 + titulos 1.000)
Cap 10 Seguros: 3.200 EUR
Cap 11 Gastos generales: 2.500 EUR
Cap 12 Explotacion: 1.000 EUR
TOTAL: ~71.000 EUR` : `Largometraje ficcion "LMDS" — 30 dias rodaje, bajo presupuesto
Cap 01 Guion y Musica: 25.000 EUR
  01.01.02 Guion: 18.000 | 01.02.02 Compositor: 7.000
Cap 02 Personal Artistico: 85.000 EUR
  02.01 Protagonistas (2 x 30d x 2.500): 75.000 | 02.03 Secundarios: 8.000 | 02.05 Figuracion: 2.000
Cap 03 Equipo Tecnico: 380.000 EUR
  03.01.01 Director: 65.000 (14 sem) | 03.01.02 1er Ayte Dir: 26.360 (10 sem)
  03.02.01 Dir.Produccion: 55.000 (14 sem) | 03.02.02 Jefe Prod: 26.360 (10 sem)
  03.03.01 Dir.Foto: 47.000 (12 sem) | 03.03.02 Camara: 21.000 (8 sem)
  03.04.01 Dir.Arte: 47.000 (12 sem) | 03.05.01 Figurinista: 21.000 (8 sem)
  03.06.01 Maquillaje: 21.000 (8 sem) | 03.07.01 Peluqueria: 17.500 (8 sem)
  03.09.01 Sonido: 21.000 (8 sem) | 03.10.01 Montador: 39.500 (15 sem)
  03.11 Electricos+Maquinistas: 35.000 | +Ayudantes y auxiliares: ~40.000
  +SS empresa 23,5% sobre todo personal: ~85.000
Cap 04 Escenografia: 45.000 EUR
Cap 05 Estudios/Varios: 160.000 EUR (montaje 15.000 + sonido postpro 62.000 + varios 83.000)
Cap 06 Maquinaria: 120.000 EUR (camara 30d + ilum + grip + transporte)
Cap 07 Viajes/Dietas: 95.000 EUR (25 pers x 30d x 55 + hoteles)
Cap 08 Soporte digital: 8.000 EUR
Cap 09 Lab/Efectos digitales: 180.000 EUR (etalonaje 20.000 + DCP 3.000 + VFX 150.000 + grafismo 7.000)
Cap 10 Seguros: 55.000 EUR
Cap 11 Gastos generales: 85.000 EUR (oficina + asesoria + imprevistos 10%)
Cap 12 Copias/Publicidad: 45.000 EUR
TOTAL APROXIMADO: ~1.338.000 EUR`}

## FORMATO DE RESPUESTA

Responde EXCLUSIVAMENTE con JSON valido. Sin texto antes ni despues. Sin markdown fences.
La respuesta debe comenzar con { y terminar con }.

{
  "budgetLines": [
    {
      "chapter": 1,
      "account_number": "01.01.02",
      "concept": "Guion original",
      "units": 1,
      "quantity": 1,
      "unit_price": 15000,
      "agency_percentage": 0,
      "social_security_percentage": 0,
      "vat_percentage": 21,
      "tariff_source": "Convenio DAMA 2025",
      "notes": "Guionista con experiencia media",
      "budget_level": "${budgetLevel}"
    }
  ],
  "summary": {
    "totalShootingDays": 30,
    "prepDays": 15,
    "postWeeks": 12,
    "totalBudget": 1200000,
    "warnings": ["El presupuesto de VFX es estimado; solicitar presupuesto detallado a proveedor"],
    "recommendations": ["Considerar coproduccion para acceder a fondos adicionales"]
  }
}

REGLAS:
- Usa SIEMPRE codigos CC.SS del ICAA (ej: "03.01.01" para Director)
- Aplica tarifas del Convenio Colectivo para todo el personal tecnico
- Incluye social_security_percentage (23.5) para TODAS las partidas de personal
- units = numero de personas, quantity = semanas/dias de contrato, unit_price = tarifa semanal/diaria
- Genera MINIMO ${isCorto ? '25' : '60'} partidas detalladas cubriendo TODOS los capitulos
- El total debe ser coherente con los rangos tipicos del tipo de proyecto
- Incluye notas justificativas para partidas significativas`;
}

// ── Handler ─────────────────────────────────────────────────────────

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

  let requestData: Record<string, unknown>;
  try {
    requestData = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'JSON invalido en la solicitud' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const projectType = (requestData.projectType as string) || 'largometraje';
  const budgetLevel = (requestData.budgetLevel as string) || 'medio';

  const systemPrompt = buildSystemPrompt(projectType, budgetLevel);

  const userPrompt = `Genera un presupuesto ICAA completo y detallado para el siguiente proyecto:

TIPO: ${projectType}
NIVEL: ${budgetLevel}
DIAS DE RODAJE ESTIMADOS: ${requestData.estimatedShootingDays || 'a determinar por ti segun los datos'}

PERSONAJES (${(requestData.characters as unknown[])?.length || 0}):
${((requestData.characters as Array<{ name: string; category: string; shootingDays?: number; agencyPercentage?: number }>) || []).map(c =>
  `- ${c.name} (${c.category}, ${c.shootingDays || '?'} dias rodaje, agencia: ${c.agencyPercentage || 0}%)`
).join('\n')}

LOCALIZACIONES (${(requestData.locations as unknown[])?.length || 0}):
${((requestData.locations as Array<{ name: string; complexity: string; estimatedDays?: number; locationType?: string }>) || []).map(l =>
  `- ${l.name} (complejidad: ${l.complexity}, ${l.estimatedDays || '?'} dias, tipo: ${l.locationType || 'no especificado'})`
).join('\n')}

SECUENCIAS (${(requestData.sequences as unknown[])?.length || 0}):
${((requestData.sequences as Array<{ sequenceNumber: number; title: string; sceneComplexity?: string; hasVFX: boolean; hasAction: boolean; hasNight: boolean }>) || []).map(s =>
  `- Sec ${s.sequenceNumber}: ${s.title} (complejidad: ${s.sceneComplexity || 'media'}${s.hasVFX ? ', VFX' : ''}${s.hasAction ? ', accion' : ''}${s.hasNight ? ', noche' : ''})`
).join('\n')}

${(requestData.creativeAnalysis as Record<string, unknown>) ? `ANALISIS CREATIVO:
Sinopsis: ${(requestData.creativeAnalysis as Record<string, unknown>).synopsis || 'N/A'}
Puntuacion producibilidad: ${(requestData.creativeAnalysis as Record<string, unknown>).producibilityScore || 'N/A'}
Rango presupuesto estimado: ${(requestData.creativeAnalysis as Record<string, unknown>).estimatedBudgetRange || 'N/A'}
Factores positivos: ${((requestData.creativeAnalysis as Record<string, unknown>).viabilityFactorsPositive as string[] || []).join(', ')}
Factores negativos: ${((requestData.creativeAnalysis as Record<string, unknown>).viabilityFactorsNegative as string[] || []).join(', ')}` : ''}

INSTRUCCIONES:
- Aplica las tarifas del Convenio Colectivo para todo el personal tecnico
- Usa precios de mercado reales para equipamiento y postproduccion
- Incluye SS empresa 23,5% para todo el personal
- Genera partidas detalladas para TODOS los 12 capitulos
- Responde SOLO con JSON valido, sin texto adicional`;

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
      max_tokens: 16000,
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

  // Stream SSE deltas TO the client to keep Vercel connection alive
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
                } else if (parsed.type === 'message_stop') {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
                  );
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
