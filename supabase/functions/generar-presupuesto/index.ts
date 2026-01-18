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

const SYSTEM_PROMPT = `Eres un experto en presupuestos audiovisuales españoles con 20 años de experiencia en producción cinematográfica y conocimiento detallado de las tarifas del sector audiovisual español 2024-2025.

Tu tarea es generar un presupuesto ICAA completo y realista basado en el análisis del guión proporcionado.

## ESTRUCTURA ICAA OBLIGATORIA (12 Capítulos)

**CAP. 01 - GUIÓN Y MÚSICA**
- 01.01 Guión: derechos de autor, adaptaciones
- 01.02 Música original: compositor, orquesta, grabación
- 01.03 Derechos musicales: sincronización, licencias

**CAP. 02 - PERSONAL ARTÍSTICO**
- 02.01-02.03 Protagonistas (cat. 1-3): tarifas según convenio + agencia 15-20%
- 02.04-02.06 Principales (cat. 1-3)
- 02.07-02.09 Secundarios (cat. 1-3)  
- 02.10 Figuración especial
- 02.11 Dobladores y locutores

**CAP. 03 - EQUIPO TÉCNICO**
Incluir todos los departamentos con jefes y auxiliares:
- Dirección (director, ayudante 1º, 2º, script)
- Producción (productor ejecutivo, director producción, jefe producción, auxiliares)
- Fotografía (DOP, operador, foquista, auxiliares)
- Sonido (jefe, microfonista, auxiliar)
- Arte (director arte, ambientador, attrezzista, construcción)
- Maquillaje y peluquería
- Vestuario
- Montaje y postproducción

**CAP. 04 - ESCENOGRAFÍA**
- Decorados: construcción, ambientación, pintura
- Attrezzo: alquiler, compra, efectos
- Vestuario: diseño, confección, alquiler
- Maquillaje y peluquería: materiales

**CAP. 05 - ESTUDIOS Y SONORIZACIÓN**
- Platós: alquiler, electricidad, infraestructura
- Localizaciones: permisos, tasas, compensaciones
- Sonorización: doblaje, foley, mezclas

**CAP. 06 - MAQUINARIA Y TRANSPORTES**
- Cámara: cuerpos, ópticas, accesorios
- Iluminación: focos, grip, consumibles
- Sonido: micrófonos, grabadoras, inalámbricos
- Transportes: camiones, furgonetas, grúas

**CAP. 07 - VIAJES, HOTELES Y COMIDAS**
- Viajes: desplazamientos equipo y reparto
- Hoteles: alojamiento equipo
- Dietas: catering, per diem

**CAP. 08 - PELÍCULA VIRGEN / MATERIAL DIGITAL**
- Almacenamiento: tarjetas, discos, backup
- Material fungible: baterías, consumibles

**CAP. 09 - LABORATORIO / POSTPRODUCCIÓN**
- Etalonaje y corrección de color
- VFX y efectos visuales
- Grafismo y títulos
- DCPs y copias

**CAP. 10 - SEGUROS**
- Responsabilidad civil (1-1.5% del subtotal)
- Negativo/material (0.5-1%)
- Accidentes y buen fin

**CAP. 11 - GASTOS GENERALES**
- Oficina y administración
- Asesoría legal y fiscal
- Imprevistos (3-5% del subtotal)

**CAP. 12 - GASTOS DE EXPLOTACIÓN**
- Copias promocionales
- Marketing y publicidad
- Festivales y mercados

## TARIFAS DE REFERENCIA 2025 (nivel medio)

### Personal Artístico (por día)
- Protagonista: 2.500-4.000€
- Principal: 1.200-2.000€
- Secundario: 600-1.000€
- Figuración especial: 150-300€
- Agencia: 15-20%

### Equipo Técnico (por semana)
- Director: 6.000-10.000€
- Productor ejecutivo: 5.000-8.000€
- Director de fotografía: 4.000-6.000€
- Operador de cámara: 2.000-3.000€
- Jefe de sonido: 2.000-3.000€
- Director de arte: 2.500-4.000€
- Montador: 2.500-4.000€
- Jefes departamento: 1.800-2.500€
- Auxiliares: 800-1.200€

### Equipamiento (por día)
- Pack cámara digital: 1.500-3.000€
- Iluminación completa: 1.000-2.000€
- Sonido: 500-1.000€
- Transportes: 800-1.500€

## REGLAS DE CÁLCULO

1. **Preparación**: 20-25% de días de rodaje
2. **Rodaje**: Días indicados o estimados
3. **Desmontaje**: 10% de días de rodaje
4. **Postproducción**: 8-12 semanas según complejidad

## FACTORES DE AJUSTE

Detecta y ajusta por:
- **Escenas de acción**: +15-25% en maquinaria y seguros
- **Escenas nocturnas**: +10-20% en iluminación y dietas
- **Efectos VFX**: Capítulo 09 según complejidad
- **Niños**: +10% coordinación y tiempos
- **Animales**: +5-15% según tipo
- **Localizaciones especiales**: Permisos adicionales

## FORMATO DE RESPUESTA

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "budgetLines": [
    {
      "chapter": 1,
      "account_number": "01.01",
      "concept": "Guión original - Derechos de autor",
      "units": 1,
      "quantity": 1,
      "unit_price": 15000,
      "agency_percentage": 0,
      "social_security_percentage": 0,
      "vat_percentage": 21,
      "tariff_source": "Convenio DAMA 2024",
      "notes": "Estimación basada en guión original de largometraje"
    }
  ],
  "summary": {
    "totalShootingDays": 25,
    "prepDays": 5,
    "postWeeks": 10,
    "totalBudget": 1500000,
    "warnings": ["El proyecto incluye escenas de acción que requieren coordinación de especialistas"],
    "recommendations": ["Considerar seguro de buen fin dado el presupuesto"]
  }
}

NO incluyas texto adicional, solo el JSON.`;

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
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 16000,
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
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      budgetData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
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
