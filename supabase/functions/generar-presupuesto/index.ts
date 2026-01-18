import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BudgetGenerationRequest {
  projectId: string;
  projectTitle: string;
  projectType: string; // 'largometraje' | 'cortometraje' | 'serie' | 'documental'
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

const SYSTEM_PROMPT = `Eres un experto en presupuestos audiovisuales españoles. Genera presupuestos ICAA concisos.

## ESTRUCTURA ICAA (12 Capítulos)
CAP. 01 - GUIÓN Y MÚSICA
CAP. 02 - PERSONAL ARTÍSTICO  
CAP. 03 - EQUIPO TÉCNICO
CAP. 04 - ESCENOGRAFÍA
CAP. 05 - ESTUDIOS Y SONORIZACIÓN
CAP. 06 - MAQUINARIA Y TRANSPORTES
CAP. 07 - VIAJES, HOTELES Y COMIDAS
CAP. 08 - MATERIAL DIGITAL
CAP. 09 - POSTPRODUCCIÓN
CAP. 10 - SEGUROS
CAP. 11 - GASTOS GENERALES
CAP. 12 - GASTOS DE EXPLOTACIÓN

## TARIFAS 2025 (nivel medio, ajustar según nivel)
- Protagonista: 2.500-4.000€/día
- Principal: 1.200-2.000€/día
- Director: 6.000-10.000€/semana
- DOP: 4.000-6.000€/semana
- Jefes dpto: 1.800-2.500€/semana
- Pack cámara: 1.500-3.000€/día

## REGLAS
- Genera 30-50 líneas máximo (partidas principales)
- Agrupa conceptos similares
- Incluye agencia 15-20% para artístico
- IVA 21%

## FORMATO JSON (obligatorio, sin markdown)
{"budgetLines":[{"chapter":1,"account_number":"01.01","concept":"Guión","units":1,"quantity":1,"unit_price":15000,"agency_percentage":0,"social_security_percentage":0,"vat_percentage":21,"tariff_source":"Convenio 2024","notes":""}],"summary":{"totalShootingDays":25,"prepDays":5,"postWeeks":10,"totalBudget":1500000,"warnings":[],"recommendations":[]}}`;

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

    // Build the user prompt with all project data
    const userPrompt = buildUserPrompt(requestData);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt + "\n\nIMPORTANTE: Responde SOLO con JSON válido, sin markdown ni explicaciones. Máximo 40 líneas de presupuesto." }
        ],
        temperature: 0.2,
        max_tokens: 32000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let budgetData;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      
      // Remove markdown code fences more robustly
      cleanContent = cleanContent.replace(/^```json\s*/i, '');
      cleanContent = cleanContent.replace(/^```\s*/i, '');
      cleanContent = cleanContent.replace(/\s*```$/i, '');
      cleanContent = cleanContent.trim();
      
      // Try to find JSON object boundaries if there's extra text
      const jsonStart = cleanContent.indexOf('{');
      const jsonEnd = cleanContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanContent = cleanContent.slice(jsonStart, jsonEnd + 1);
      }
      
      budgetData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      
      // Try a more aggressive extraction
      try {
        const jsonMatch = content.match(/\{[\s\S]*"budgetLines"[\s\S]*\}/);
        if (jsonMatch) {
          budgetData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not find valid JSON in response");
        }
      } catch (retryError) {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    // Validate and enrich budget lines
    const enrichedLines = budgetData.budgetLines.map((line: BudgetLine) => ({
      ...line,
      budget_level: requestData.budgetLevel,
      // Calculate derived fields
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

  // Analyze sequences for special requirements
  const nightScenes = sequences.filter(s => s.timeOfDay?.toLowerCase().includes('noche')).length;
  const complexScenes = sequences.filter(s => s.sceneComplexity === 'alta').length;
  const vfxScenes = sequences.filter(s => s.hasVFX).length;
  const actionScenes = sequences.filter(s => s.hasAction).length;
  const childrenScenes = sequences.filter(s => s.hasChildren).length;
  const animalScenes = sequences.filter(s => s.hasAnimals).length;

  // Calculate page eighths for duration estimate
  const totalEighths = sequences.reduce((sum, s) => sum + (s.pageEighths || 1), 0);
  const estimatedPages = totalEighths / 8;

  // Group characters by category
  const protagonists = characters.filter(c => c.category?.toLowerCase() === 'protagonista');
  const principals = characters.filter(c => c.category?.toLowerCase() === 'principal');
  const supporting = characters.filter(c => c.category?.toLowerCase() === 'secundario');

  // Location analysis
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
