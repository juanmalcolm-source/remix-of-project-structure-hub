import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BudgetGenerationRequest {
  projectId: string;
  projectTitle: string;
  projectType: string;
  budgetLevel: 'bajo' | 'medio' | 'alto';
  estimatedShootingDays: number;
  characters: Array<{
    name: string;
    category: string | null;
    shootingDays: number | null;
    agencyPercentage: number | null;
  }>;
  locations: Array<{
    name: string;
    complexity: string | null;
    estimatedDays: number | null;
    locationType: string | null;
  }>;
  sequences: Array<{
    sequenceNumber: number;
    title: string | null;
    timeOfDay: string | null;
    sceneComplexity: string | null;
    pageEighths: number | null;
    hasVFX: boolean;
    hasAction: boolean;
    hasNight: boolean;
    hasChildren: boolean;
    hasAnimals: boolean;
  }>;
  creativeAnalysis?: {
    synopsis: string | null;
    producibilityScore: number | null;
    estimatedBudgetRange: string | null;
    viabilityFactorsPositive: string[];
    viabilityFactorsNegative: string[];
  } | null;
}

interface BudgetLine {
  chapter: number;
  account_number: string;
  concept: string;
  units: number;
  quantity: number;
  unit_price: number;
  agency_percentage: number;
  social_security_percentage: number;
  vat_percentage: number;
  tariff_source: string;
  notes: string;
  budget_level: string;
}

const SYSTEM_PROMPT = `Eres un experto en presupuestos audiovisuales españoles formato ICAA. Responde ÚNICAMENTE con un objeto JSON válido.

ESTRUCTURA: 12 capítulos ICAA (01-Guión/Música, 02-Personal Artístico, 03-Equipo Técnico, 04-Escenografía, 05-Estudios/Sonorización, 06-Maquinaria/Transportes, 07-Viajes/Hoteles/Comidas, 08-Material Digital, 09-Postproducción, 10-Seguros, 11-Gastos Generales, 12-Gastos Explotación).

REGLAS: Genera 30-40 líneas principales. Agencia 15-20% para artístico. IVA 21%.

FORMATO OBLIGATORIO:
{"budgetLines":[{"chapter":1,"account_number":"01.01","concept":"Guión","units":1,"quantity":1,"unit_price":15000,"agency_percentage":0,"social_security_percentage":0,"vat_percentage":21,"tariff_source":"Convenio 2024","notes":""}],"summary":{"totalShootingDays":25,"prepDays":5,"postWeeks":10,"totalBudget":1500000,"warnings":[],"recommendations":[]}}`;

async function callAI(apiKey: string, userPrompt: string): Promise<any> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 32000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw { status: 429, message: "Rate limits exceeded, please try again later." };
    }
    if (response.status === 402) {
      throw { status: 402, message: "Payment required, please add funds to your Lovable AI workspace." };
    }
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw { status: 500, message: `AI gateway error: ${response.status}` };
  }

  const aiResponse = await response.json();
  const content = aiResponse.choices?.[0]?.message?.content;

  if (!content) {
    throw { status: 500, message: "No content in AI response" };
  }

  return parseAIContent(content);
}

function parseAIContent(content: string): any {
  // Try direct parse first
  try {
    return JSON.parse(content.trim());
  } catch (_) { /* continue */ }

  // Clean markdown fences
  let clean = content.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch (_) { /* continue */ }

  // Extract JSON object boundaries
  const jsonStart = clean.indexOf('{');
  const jsonEnd = clean.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      return JSON.parse(clean.slice(jsonStart, jsonEnd + 1));
    } catch (_) { /* continue */ }
  }

  // Last resort: regex match
  const match = content.match(/\{[\s\S]*"budgetLines"[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }

  throw new Error("Could not parse AI response as JSON");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const requestData: BudgetGenerationRequest = await req.json();
    console.log("Generating budget for project:", requestData.projectId, "Level:", requestData.budgetLevel);

    const userPrompt = buildUserPrompt(requestData) + "\n\nResponde SOLO con JSON válido. Máximo 40 líneas.";

    // Attempt 1
    let budgetData: any;
    try {
      budgetData = await callAI(LOVABLE_API_KEY, userPrompt);
    } catch (err: any) {
      // If it's a rate limit or payment error, propagate immediately
      if (err.status === 429 || err.status === 402) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Retry once on parse failure
      console.warn("First attempt failed, retrying...", err.message || err);
      try {
        budgetData = await callAI(LOVABLE_API_KEY, userPrompt);
      } catch (retryErr: any) {
        if (retryErr.status === 429 || retryErr.status === 402) {
          return new Response(JSON.stringify({ error: retryErr.message }), {
            status: retryErr.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.error("Retry also failed:", retryErr.message || retryErr);
        throw new Error("Failed to generate budget after 2 attempts. Please try again.");
      }
    }

    // Validate and enrich budget lines
    const enrichedLines = budgetData.budgetLines.map((line: BudgetLine) => ({
      ...line,
      budget_level: requestData.budgetLevel,
      base_before_taxes: line.units * line.quantity * line.unit_price,
      agency_cost: line.units * line.quantity * line.unit_price * (line.agency_percentage / 100),
      social_security_cost: line.units * line.quantity * line.unit_price * (line.social_security_percentage / 100),
      vat_amount: line.units * line.quantity * line.unit_price * (1 + line.agency_percentage / 100) * (line.vat_percentage / 100),
      total: calculateLineTotal(line),
    }));

    console.log(`Generated ${enrichedLines.length} budget lines`);

    return new Response(JSON.stringify({
      budgetLines: enrichedLines,
      summary: budgetData.summary,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Budget generation error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildUserPrompt(data: BudgetGenerationRequest): string {
  const {
    projectTitle,
    projectType,
    budgetLevel,
    estimatedShootingDays,
    characters,
    locations,
    sequences,
    creativeAnalysis,
  } = data;

  const nightScenes = sequences.filter(s => s.timeOfDay?.toLowerCase().includes('noche')).length;
  const complexScenes = sequences.filter(s => s.sceneComplexity === 'alta').length;
  const vfxScenes = sequences.filter(s => s.hasVFX).length;
  const actionScenes = sequences.filter(s => s.hasAction).length;
  const childrenScenes = sequences.filter(s => s.hasChildren).length;
  const animalScenes = sequences.filter(s => s.hasAnimals).length;

  const totalEighths = sequences.reduce((sum, s) => sum + (s.pageEighths || 1), 0);
  const estimatedPages = totalEighths / 8;

  const protagonists = characters.filter(c => c.category?.toLowerCase() === 'protagonista');
  const principals = characters.filter(c => c.category?.toLowerCase() === 'principal');
  const supporting = characters.filter(c => c.category?.toLowerCase() === 'secundario');

  const complexLocations = locations.filter(l => l.complexity?.toLowerCase() === 'alta');
  const exteriorLocations = locations.filter(l => l.locationType?.toLowerCase().includes('ext'));

  let prompt = `## PROYECTO: ${projectTitle}

**Tipo:** ${projectType || 'Largometraje'}
**Nivel de presupuesto:** ${budgetLevel.toUpperCase()}
**Días de rodaje estimados:** ${estimatedShootingDays}

## ANÁLISIS DEL GUIÓN

### Personajes (${characters.length} total)
`;

  if (protagonists.length > 0) {
    prompt += `\n**Protagonistas (${protagonists.length}):**\n`;
    protagonists.forEach(c => {
      prompt += `- ${c.name}: ${c.shootingDays || 'todos'} días, agencia ${c.agencyPercentage || 15}%\n`;
    });
  }

  if (principals.length > 0) {
    prompt += `\n**Principales (${principals.length}):**\n`;
    principals.forEach(c => {
      prompt += `- ${c.name}: ${c.shootingDays || 'varios'} días\n`;
    });
  }

  if (supporting.length > 0) {
    prompt += `\n**Secundarios (${supporting.length}):** ${supporting.map(c => c.name).join(', ')}\n`;
  }

  prompt += `\n### Localizaciones (${locations.length} total)
- Complejas: ${complexLocations.length}
- Exteriores: ${exteriorLocations.length}
`;

  locations.forEach(l => {
    prompt += `- ${l.name} (${l.complexity || 'media'}): ${l.estimatedDays || 1} días\n`;
  });

  prompt += `\n### Secuencias (${sequences.length} total)
- Páginas estimadas: ${estimatedPages.toFixed(1)}
- Escenas nocturnas: ${nightScenes}
- Escenas de alta complejidad: ${complexScenes}
- Escenas con VFX: ${vfxScenes}
- Escenas de acción: ${actionScenes}
- Escenas con niños: ${childrenScenes}
- Escenas con animales: ${animalScenes}
`;

  if (creativeAnalysis) {
    prompt += `\n### Análisis Creativo
**Sinopsis:** ${creativeAnalysis.synopsis || 'No disponible'}
**Puntuación de producibilidad:** ${creativeAnalysis.producibilityScore || 'N/A'}/10
**Rango presupuestario estimado:** ${creativeAnalysis.estimatedBudgetRange || 'No especificado'}
`;

    if (creativeAnalysis.viabilityFactorsPositive?.length > 0) {
      prompt += `\n**Factores positivos:** ${creativeAnalysis.viabilityFactorsPositive.join(', ')}`;
    }
    if (creativeAnalysis.viabilityFactorsNegative?.length > 0) {
      prompt += `\n**Factores de riesgo:** ${creativeAnalysis.viabilityFactorsNegative.join(', ')}`;
    }
  }

  prompt += `\n\n## INSTRUCCIONES

Genera un presupuesto ICAA completo para nivel ${budgetLevel.toUpperCase()} con:
1. Los 12 capítulos oficiales ICAA
2. Partidas detalladas para cada concepto
3. Tarifas actualizadas 2025 ajustadas al nivel ${budgetLevel}
4. Cálculos de agencia (15-20% donde aplique)
5. Seguros sociales donde corresponda
6. IVA al 21%

Considera especialmente:
- ${nightScenes} escenas nocturnas (ajustar iluminación y dietas)
- ${actionScenes > 0 ? `${actionScenes} escenas de acción (especialistas, seguros adicionales)` : 'Sin escenas de acción especiales'}
- ${vfxScenes > 0 ? `${vfxScenes} escenas con VFX (presupuesto postproducción)` : 'VFX básicos'}
- ${childrenScenes > 0 ? `${childrenScenes} escenas con menores (coordinación adicional)` : ''}
- ${animalScenes > 0 ? `${animalScenes} escenas con animales (adiestradores)` : ''}

El presupuesto debe ser realista y coherente con producciones españolas de nivel ${budgetLevel}.`;

  return prompt;
}

function calculateLineTotal(line: BudgetLine): number {
  const baseAmount = line.units * line.quantity * line.unit_price;
  const agencyCost = baseAmount * (line.agency_percentage / 100);
  const socialSecurityCost = baseAmount * (line.social_security_percentage / 100);
  const subtotal = baseAmount + agencyCost + socialSecurityCost;
  const vatAmount = subtotal * (line.vat_percentage / 100);
  return subtotal + vatAmount;
}
