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

Responde SOLO con un JSON válido con esta estructura:
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

  try {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en el servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();

    const userPrompt = `Genera un presupuesto ICAA para el siguiente proyecto cinematográfico:

NIVEL DE PRESUPUESTO: ${requestData.budgetLevel || 'medio'}
TIPO: ${requestData.projectType || 'largometraje'}
DÍAS DE RODAJE ESTIMADOS: ${requestData.estimatedShootingDays || 'a determinar'}

PERSONAJES (${requestData.characters?.length || 0}):
${(requestData.characters || []).map((c: { name: string; category: string; shootingDays?: number; agencyPercentage?: number }) =>
  `- ${c.name} (${c.category}, ${c.shootingDays || '?'} días, agencia: ${c.agencyPercentage || 0}%)`
).join('\n')}

LOCALIZACIONES (${requestData.locations?.length || 0}):
${(requestData.locations || []).map((l: { name: string; complexity: string; estimatedDays?: number; locationType?: string }) =>
  `- ${l.name} (complejidad: ${l.complexity}, ${l.estimatedDays || '?'} días, tipo: ${l.locationType || 'no especificado'})`
).join('\n')}

SECUENCIAS (${requestData.sequences?.length || 0}):
${(requestData.sequences || []).map((s: { sequenceNumber: number; title: string; sceneComplexity?: string; hasVFX: boolean; hasAction: boolean; hasNight: boolean }) =>
  `- Sec ${s.sequenceNumber}: ${s.title} (complejidad: ${s.sceneComplexity || 'media'}${s.hasVFX ? ', VFX' : ''}${s.hasAction ? ', acción' : ''}${s.hasNight ? ', noche' : ''})`
).join('\n')}

${requestData.creativeAnalysis ? `ANÁLISIS CREATIVO:
Sinopsis: ${requestData.creativeAnalysis.synopsis || 'N/A'}
Puntuación de producibilidad: ${requestData.creativeAnalysis.producibilityScore || 'N/A'}
Rango de presupuesto estimado: ${requestData.creativeAnalysis.estimatedBudgetRange || 'N/A'}
Factores positivos: ${(requestData.creativeAnalysis.viabilityFactorsPositive || []).join(', ')}
Factores negativos: ${(requestData.creativeAnalysis.viabilityFactorsNegative || []).join(', ')}` : ''}

Genera el presupuesto completo con líneas detalladas para cada capítulo. Usa tarifas realistas del mercado español 2024-2025.`;

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
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json().catch(() => ({}));
      const errorMsg = (errorData as { error?: { message?: string } }).error?.message || `Error HTTP ${anthropicResponse.status}`;

      return new Response(
        JSON.stringify({ error: `Error de la API: ${errorMsg}` }),
        { status: anthropicResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await anthropicResponse.json() as {
      content: Array<{ type: string; text?: string }>;
    };

    const text = data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text || '')
      .join('');

    // Parse JSON from response (handle markdown fences)
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se encontró JSON válido en la respuesta');
      }
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generar-presupuesto:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor al generar presupuesto' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
