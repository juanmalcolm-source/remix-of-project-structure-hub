export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const systemPrompt = `Eres un experto en presupuestos de producción cinematográfica en España, con profundo conocimiento del formato ICAA y los convenios colectivos vigentes.

Genera un presupuesto detallado siguiendo la estructura de capítulos del ICAA:
1. Guión y Música
2. Personal Artístico
3. Equipo Técnico
4. Escenografía
5. Estudios y Sonorización
6. Maquinaria y Transportes
7. Viajes, Hoteles y Comidas
8. Material Sensible
9. Laboratorio / Postproducción
10. Seguros
11. Gastos Generales
12. Gastos de Explotación

Para cada línea presupuestaria incluye:
- chapter: número del capítulo
- account_number: código de cuenta (ej: "02.01")
- concept: descripción del concepto
- units: número de unidades
- quantity: cantidad por unidad
- unit_price: precio unitario en euros
- agency_percentage: porcentaje de agencia (0-20)
- social_security_percentage: porcentaje de seguridad social si aplica
- vat_percentage: IVA aplicable
- tariff_source: fuente de la tarifa
- notes: notas adicionales
- budget_level: nivel de presupuesto solicitado

IMPORTANTE: Responde ÚNICAMENTE con el JSON. Sin texto explicativo antes ni después. Sin markdown fences.
La respuesta debe comenzar directamente con { y terminar con }.

Estructura exacta:
{
  "budgetLines": [...],
  "summary": {
    "totalShootingDays": number,
    "prepDays": number,
    "postWeeks": number,
    "totalBudget": number,
    "warnings": [...],
    "recommendations": [...]
  }
}`;

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
      JSON.stringify({ error: 'JSON inválido en la solicitud' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userPrompt = `Genera un presupuesto ICAA para el siguiente proyecto cinematográfico:

NIVEL DE PRESUPUESTO: ${requestData.budgetLevel || 'medio'}
TIPO: ${requestData.projectType || 'largometraje'}
DÍAS DE RODAJE ESTIMADOS: ${requestData.estimatedShootingDays || 'a determinar'}

PERSONAJES (${(requestData.characters as unknown[])?.length || 0}):
${((requestData.characters as Array<{ name: string; category: string; shootingDays?: number; agencyPercentage?: number }>) || []).map(c =>
  `- ${c.name} (${c.category}, ${c.shootingDays || '?'} días, agencia: ${c.agencyPercentage || 0}%)`
).join('\n')}

LOCALIZACIONES (${(requestData.locations as unknown[])?.length || 0}):
${((requestData.locations as Array<{ name: string; complexity: string; estimatedDays?: number; locationType?: string }>) || []).map(l =>
  `- ${l.name} (complejidad: ${l.complexity}, ${l.estimatedDays || '?'} días, tipo: ${l.locationType || 'no especificado'})`
).join('\n')}

SECUENCIAS (${(requestData.sequences as unknown[])?.length || 0}):
${((requestData.sequences as Array<{ sequenceNumber: number; title: string; sceneComplexity?: string; hasVFX: boolean; hasAction: boolean; hasNight: boolean }>) || []).map(s =>
  `- Sec ${s.sequenceNumber}: ${s.title} (complejidad: ${s.sceneComplexity || 'media'}${s.hasVFX ? ', VFX' : ''}${s.hasAction ? ', acción' : ''}${s.hasNight ? ', noche' : ''})`
).join('\n')}

${(requestData.creativeAnalysis as Record<string, unknown>) ? `ANÁLISIS CREATIVO:
Sinopsis: ${(requestData.creativeAnalysis as Record<string, unknown>).synopsis || 'N/A'}
Puntuación de producibilidad: ${(requestData.creativeAnalysis as Record<string, unknown>).producibilityScore || 'N/A'}
Rango de presupuesto estimado: ${(requestData.creativeAnalysis as Record<string, unknown>).estimatedBudgetRange || 'N/A'}
Factores positivos: ${((requestData.creativeAnalysis as Record<string, unknown>).viabilityFactorsPositive as string[] || []).join(', ')}
Factores negativos: ${((requestData.creativeAnalysis as Record<string, unknown>).viabilityFactorsNegative as string[] || []).join(', ')}` : ''}

Genera el presupuesto completo con líneas detalladas para cada capítulo. Usa tarifas realistas del mercado español 2024-2025.
Responde SOLO con JSON, sin texto adicional.`;

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
