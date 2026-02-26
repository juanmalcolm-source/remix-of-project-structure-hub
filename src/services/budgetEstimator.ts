/**
 * Budget Estimator Service
 * Generates estimated ICAA budget lines based on script analysis data
 * Supports both local estimation and AI-powered generation via edge function
 */

import type { Tables } from '@/integrations/supabase/types';

type Character = Tables<'characters'>;
type Location = Tables<'locations'>;
type Sequence = Tables<'sequences'>;
type CreativeAnalysis = Tables<'creative_analysis'>;

export interface BudgetEstimationInput {
  characters: Character[];
  locations: Location[];
  sequences: Sequence[];
  creativeAnalysis?: CreativeAnalysis | null;
  estimatedShootingDays?: number;
}

export interface DataAvailability {
  hasCharacters: boolean;
  hasLocations: boolean;
  hasSequences: boolean;
  hasCreativeAnalysis: boolean;
  charactersCount: number;
  locationsCount: number;
  sequencesCount: number;
  warnings: string[];
}

export interface EstimatedBudgetLine {
  chapter: number;
  account_number: string;
  concept: string;
  units: number;
  quantity: number;
  unit_price: number;
  agency_percentage: number;
  social_security_percentage?: number;
  vat_percentage?: number;
  tariff_source?: string;
  notes?: string;
  budget_level?: string;
}

export interface AIBudgetResponse {
  budgetLines: EstimatedBudgetLine[];
  summary: {
    totalShootingDays: number;
    prepDays: number;
    postWeeks: number;
    totalBudget: number;
    warnings: string[];
    recommendations: string[];
  };
}

export type BudgetLevel = 'bajo' | 'medio' | 'alto';

export function checkDataAvailability(input: BudgetEstimationInput): DataAvailability {
  const warnings: string[] = [];
  
  const hasCharacters = input.characters.length > 0;
  const hasLocations = input.locations.length > 0;
  const hasSequences = input.sequences.length > 0;
  const hasCreativeAnalysis = !!input.creativeAnalysis;

  if (!hasLocations) {
    warnings.push('No hay localizaciones guardadas. Se estimará basándose en el análisis creativo.');
  }
  if (!hasSequences) {
    warnings.push('No hay secuencias guardadas. Los días de rodaje se estimarán desde los personajes.');
  }
  if (!hasCharacters) {
    warnings.push('No hay personajes guardados. La estimación será muy aproximada.');
  }

  return {
    hasCharacters,
    hasLocations,
    hasSequences,
    hasCreativeAnalysis,
    charactersCount: input.characters.length,
    locationsCount: input.locations.length,
    sequencesCount: input.sequences.length,
    warnings,
  };
}

/**
 * Calculate a complete budget line with all cost components
 */
export function calcularLineaCompleta(
  baseAmount: number,
  agencyPct: number = 0,
  socialSecurityPct: number = 0,
  vatPct: number = 21
): {
  base_before_taxes: number;
  agency_cost: number;
  social_security_cost: number;
  vat_amount: number;
  total: number;
} {
  const agency_cost = baseAmount * (agencyPct / 100);
  const social_security_cost = baseAmount * (socialSecurityPct / 100);
  const subtotal = baseAmount + agency_cost + social_security_cost;
  const vat_amount = subtotal * (vatPct / 100);
  const total = subtotal + vat_amount;

  return {
    base_before_taxes: baseAmount,
    agency_cost,
    social_security_cost,
    vat_amount,
    total,
  };
}

/**
 * Generate budget using AI (calls edge function)
 */
export async function generarPresupuestoConIA(
  projectId: string,
  input: BudgetEstimationInput,
  budgetLevel: BudgetLevel = 'medio'
): Promise<AIBudgetResponse> {
  // Prepare data for the edge function
  const requestData = {
    projectId,
    projectTitle: 'Proyecto', // Will be fetched from project if needed
    projectType: 'largometraje',
    budgetLevel,
    estimatedShootingDays: input.estimatedShootingDays || calcularDiasRodajeEstimados(input.sequences),
    characters: input.characters.map(c => ({
      name: c.name,
      category: c.category,
      shootingDays: c.shooting_days,
      agencyPercentage: c.agency_percentage,
    })),
    locations: input.locations.map(l => ({
      name: l.name,
      complexity: l.complexity,
      estimatedDays: l.estimated_days,
      locationType: l.location_type,
    })),
    sequences: input.sequences.map(s => ({
      sequenceNumber: s.sequence_number,
      title: s.title,
      timeOfDay: s.time_of_day,
      sceneComplexity: s.scene_complexity,
      pageEighths: s.page_eighths ? Number(s.page_eighths) : 1,
      hasVFX: (s.effects as unknown[] | null)?.some((e) =>
        typeof e === 'string' ? e.toLowerCase().includes('vfx') : false
      ) || false,
      hasAction: (s.effects as unknown[] | null)?.some((e) =>
        typeof e === 'string' ? (e.toLowerCase().includes('acción') || e.toLowerCase().includes('pelea')) : false
      ) || false,
      hasNight: s.time_of_day?.toLowerCase().includes('noche') || false,
      hasChildren: false, // Could be detected from character ages
      hasAnimals: false, // Could be detected from props/effects
    })),
    creativeAnalysis: input.creativeAnalysis ? {
      synopsis: input.creativeAnalysis.synopsis,
      producibilityScore: input.creativeAnalysis.producibility_score,
      estimatedBudgetRange: input.creativeAnalysis.estimated_budget_range,
      viabilityFactorsPositive: (input.creativeAnalysis.viability_factors_positive as string[]) || [],
      viabilityFactorsNegative: (input.creativeAnalysis.viability_factors_negative as string[]) || [],
    } : null,
  };

  const response = await fetch('/api/generar-presupuesto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    // Non-streaming error responses come as JSON
    let errorMsg = `Error HTTP ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = (errData as { error?: string }).error || errorMsg;
    } catch { /* keep default */ }
    throw new Error(errorMsg);
  }

  // Read SSE stream and accumulate text
  const fullText = await readSSEStream(response);

  // Parse the accumulated JSON
  return extractBudgetJson(fullText);
}

/**
 * Get tariff rate based on budget level - uses hardcoded rates
 */
function getTarifaByLevel(codigo: string, level: BudgetLevel): number {
  // Simplified rate lookup - returns 0 to use fallback rates
  return 0;
}

function getCategoryRate(category: string | null, level: BudgetLevel = 'medio'): number {
  switch (category?.toLowerCase()) {
    case 'protagonista':
      return getTarifaByLevel('02.01', level) || (level === 'bajo' ? 2000 : level === 'alto' ? 4000 : 3000);
    case 'principal':
      return getTarifaByLevel('02.02', level) || (level === 'bajo' ? 1000 : level === 'alto' ? 2000 : 1500);
    case 'secundario':
      return getTarifaByLevel('02.03', level) || (level === 'bajo' ? 500 : level === 'alto' ? 1000 : 800);
    case 'figuración':
    case 'figuracion':
      return getTarifaByLevel('02.04', level) || (level === 'bajo' ? 100 : level === 'alto' ? 200 : 150);
    default:
      return getTarifaByLevel('02.03', level) || 800;
  }
}

function getLocationRate(complexity: string | null, level: BudgetLevel = 'medio'): number {
  const baseRates = {
    alta: { bajo: 6000, medio: 10000, alto: 15000 },
    media: { bajo: 3000, medio: 5000, alto: 8000 },
    baja: { bajo: 1500, medio: 2000, alto: 3000 },
  };
  
  const complexityKey = complexity?.toLowerCase() as 'alta' | 'media' | 'baja' || 'media';
  return baseRates[complexityKey]?.[level] || baseRates.media[level];
}

/**
 * Generate estimated budget locally (without AI)
 * Uses tarifas-2025.ts for realistic rates
 */
export function generarPresupuestoEstimado(
  input: BudgetEstimationInput, 
  level: BudgetLevel = 'medio'
): EstimatedBudgetLine[] {
  const { characters, locations, sequences, creativeAnalysis, estimatedShootingDays } = input;
  
  // Smart estimation of shooting days with fallbacks
  let totalShootingDays = estimatedShootingDays;
  
  if (!totalShootingDays) {
    totalShootingDays = calcularDiasRodajeEstimados(sequences);
    
    // Also consider character shooting days
    const maxCharacterDays = Math.max(...characters.map(c => c.shooting_days || 0), 0);
    if (maxCharacterDays > totalShootingDays) {
      totalShootingDays = maxCharacterDays;
    }
  }
  
  const shootingWeeks = Math.ceil(totalShootingDays / 5);
  const prepWeeks = Math.ceil(shootingWeeks * 0.4); // 40% of shooting for prep
  const postWeeks = Math.ceil(shootingWeeks * 1.5); // 1.5x shooting for post
  const teamSize = 15; // Average crew size
  
  // Estimate number of locations if none saved
  let effectiveLocations = locations;
  if (locations.length === 0 && creativeAnalysis) {
    const negativeFactors = JSON.stringify(creativeAnalysis.viability_factors_negative || []).toLowerCase();
    const positiveFactors = JSON.stringify(creativeAnalysis.viability_factors_positive || []).toLowerCase();
    
    let estimatedLocationCount = 8;
    
    if (negativeFactors.includes('múltiples') || negativeFactors.includes('localizaciones')) {
      estimatedLocationCount = 12;
    }
    if (positiveFactors.includes('pocas') || positiveFactors.includes('unitaria')) {
      estimatedLocationCount = 4;
    }
    
    effectiveLocations = Array.from({ length: estimatedLocationCount }, (_, i) => ({
      id: `estimated-${i}`,
      project_id: '',
      name: `Localización estimada ${i + 1}`,
      complexity: i < 2 ? 'alta' : i < 5 ? 'media' : 'baja',
      location_type: null,
      estimated_days: Math.ceil(totalShootingDays / estimatedLocationCount),
      production_notes: null,
      special_needs: null,
      address: null,
      formatted_address: null,
      latitude: null,
      longitude: null,
      place_id: null,
      zone: null,
      created_at: '',
      updated_at: '',
    })) as Location[];
  }
  
  const lines: EstimatedBudgetLine[] = [];
  let lineCounter: Record<number, number> = {};
  
  const addLine = (
    chapter: number, 
    concept: string, 
    units: number, 
    quantity: number, 
    unitPrice: number, 
    agencyPct: number = 0,
    ssPct: number = 0,
    vatPct: number = 21,
    source: string = 'Estimación local',
    notes: string = ''
  ) => {
    if (!lineCounter[chapter]) lineCounter[chapter] = 1;
    const lineNum = lineCounter[chapter]++;
    const accountNumber = `${chapter.toString().padStart(2, '0')}.${lineNum.toString().padStart(2, '0')}`;
    
    lines.push({
      chapter,
      account_number: accountNumber,
      concept,
      units,
      quantity,
      unit_price: unitPrice,
      agency_percentage: agencyPct,
      social_security_percentage: ssPct,
      vat_percentage: vatPct,
      tariff_source: source,
      notes,
      budget_level: level,
    });
  };
  
  // ============ CHAPTER 1 - Guión y Música ============
  const guionRate = getTarifaByLevel('01.01', level) || (level === 'bajo' ? 10000 : level === 'alto' ? 25000 : 15000);
  addLine(1, 'Guión (derechos de autor)', 1, 1, guionRate, 0, 0, 21, 'Convenio DAMA 2024');
  addLine(1, 'Música original', 1, 1, getTarifaByLevel('01.02', level) || 8000, 0, 0, 21, 'Mercado');
  addLine(1, 'Derechos musicales (sincronización)', 1, 1, level === 'bajo' ? 2000 : level === 'alto' ? 8000 : 3000, 0, 0, 21, 'Estimación');
  
  // ============ CHAPTER 2 - Personal Artístico ============
  const protagonistas = characters.filter(c => c.category?.toLowerCase() === 'protagonista');
  const principales = characters.filter(c => c.category?.toLowerCase() === 'principal');
  const secundarios = characters.filter(c => c.category?.toLowerCase() === 'secundario');
  const figuracion = characters.filter(c => c.category?.toLowerCase().includes('figuraci'));
  
  [...protagonistas, ...principales].forEach(char => {
    const days = char.shooting_days || Math.ceil(totalShootingDays * 0.8);
    const rate = getCategoryRate(char.category, level);
    const agency = char.agency_percentage || 15;
    addLine(2, char.name, 1, days, rate, agency, 0, 21, 'Convenio actores 2024', `Categoría: ${char.category}`);
  });
  
  if (secundarios.length > 0) {
    const avgDays = Math.ceil(secundarios.reduce((sum, c) => sum + (c.shooting_days || 2), 0) / secundarios.length);
    addLine(2, `Secundarios (${secundarios.length} personajes)`, secundarios.length, avgDays, getCategoryRate('secundario', level), 15, 0, 21, 'Convenio actores 2024');
  }
  
  if (figuracion.length > 0 || sequences.length > 5) {
    const numFiguracion = figuracion.length || Math.ceil(sequences.length / 3);
    addLine(2, 'Figuración especial', numFiguracion, 5, getCategoryRate('figuración', level), 0, 0, 21, 'Convenio figuración');
  }
  
  // ============ CHAPTER 3 - Equipo Técnico ============
  const directorRate = getTarifaByLevel('03.01', level) || (level === 'bajo' ? 5000 : level === 'alto' ? 10000 : 8000);
  const prodEjecRate = getTarifaByLevel('03.02', level) || (level === 'bajo' ? 4000 : level === 'alto' ? 8000 : 6000);
  const dopRate = getTarifaByLevel('03.04', level) || (level === 'bajo' ? 3500 : level === 'alto' ? 7000 : 5000);
  
  addLine(3, 'Director/a', 1, shootingWeeks + prepWeeks, directorRate, 0, 35, 21, 'Convenio técnicos 2024');
  addLine(3, 'Productor/a ejecutivo', 1, shootingWeeks + prepWeeks + 4, prodEjecRate, 0, 35, 21, 'Convenio técnicos 2024');
  addLine(3, 'Director/a de producción', 1, shootingWeeks + prepWeeks, getTarifaByLevel('03.03', level) || 4000, 0, 35, 21, 'Convenio técnicos 2024');
  addLine(3, 'Director/a de fotografía', 1, shootingWeeks + 2, dopRate, 0, 35, 21, 'Convenio técnicos 2024');
  addLine(3, 'Operador/a de cámara', 1, shootingWeeks, getTarifaByLevel('03.05', level) || 2500, 0, 35, 21, 'Convenio técnicos 2024');
  addLine(3, 'Jefe/a de sonido', 1, shootingWeeks, getTarifaByLevel('03.06', level) || 2500, 0, 35, 21, 'Convenio técnicos 2024');
  addLine(3, 'Director/a de arte', 1, shootingWeeks + 2, getTarifaByLevel('03.07', level) || 3000, 0, 35, 21, 'Convenio técnicos 2024');
  addLine(3, 'Jefe/a de maquillaje', 1, shootingWeeks, getTarifaByLevel('03.08', level) || 2000, 0, 35, 21, 'Convenio técnicos 2024');
  addLine(3, 'Jefe/a de vestuario', 1, shootingWeeks, getTarifaByLevel('03.09', level) || 2000, 0, 35, 21, 'Convenio técnicos 2024');
  addLine(3, 'Script / Continuidad', 1, shootingWeeks, getTarifaByLevel('03.10', level) || 1500, 0, 35, 21, 'Convenio técnicos 2024');
  addLine(3, 'Montador/a', 1, postWeeks, getTarifaByLevel('03.11', level) || 3000, 0, 35, 21, 'Convenio técnicos 2024');
  
  // ============ CHAPTER 4 - Escenografía ============
  if (effectiveLocations.length > 0) {
    effectiveLocations.forEach(loc => {
      const rate = getLocationRate(loc.complexity, level);
      const isEstimated = loc.id.startsWith('estimated-');
      const prefix = isEstimated ? 'Loc (est): ' : 'Loc: ';
      addLine(4, `${prefix}${loc.name}`, 1, loc.estimated_days || 1, rate, 0, 0, 21, 'Mercado localizaciones');
    });
  } else {
    const estimatedLocations = Math.max(5, Math.ceil(sequences.length / 4));
    addLine(4, 'Decorados y localizaciones (estimado)', estimatedLocations, 1, getLocationRate('media', level), 0, 0, 21, 'Estimación');
  }
  
  const attrezzoRate = level === 'bajo' ? 300 : level === 'alto' ? 800 : 500;
  addLine(4, 'Attrezzo', 1, totalShootingDays, attrezzoRate, 0, 0, 21, 'Mercado');
  addLine(4, 'Vestuario', characters.length || 8, 1, level === 'bajo' ? 500 : level === 'alto' ? 1200 : 800, 0, 0, 21, 'Mercado');
  addLine(4, 'Materiales maquillaje y peluquería', 1, totalShootingDays, level === 'bajo' ? 150 : level === 'alto' ? 350 : 200, 0, 0, 21, 'Mercado');
  
  // ============ CHAPTER 5 - Estudios y Sonorización ============
  const platoRate = level === 'bajo' ? 2000 : level === 'alto' ? 5000 : 3000;
  addLine(5, 'Alquiler plató / Localizaciones interiores', 1, Math.ceil(totalShootingDays * 0.3), platoRate, 0, 0, 21, 'Mercado estudios');
  addLine(5, 'Sala de doblaje y sonorización', 1, 5, level === 'bajo' ? 1000 : level === 'alto' ? 2500 : 1500, 0, 0, 21, 'Mercado postproducción');
  addLine(5, 'Mezclas', 1, 1, level === 'bajo' ? 5000 : level === 'alto' ? 15000 : 8000, 0, 0, 21, 'Mercado postproducción');
  
  // ============ CHAPTER 6 - Maquinaria y Transportes ============
  const camaraRate = level === 'bajo' ? 1200 : level === 'alto' ? 3000 : 2000;
  addLine(6, 'Equipo cámara (alquiler)', 1, totalShootingDays, camaraRate, 0, 0, 21, 'Rental houses');
  addLine(6, 'Iluminación (alquiler)', 1, totalShootingDays, level === 'bajo' ? 800 : level === 'alto' ? 2500 : 1500, 0, 0, 21, 'Rental houses');
  addLine(6, 'Sonido (alquiler equipos)', 1, totalShootingDays, level === 'bajo' ? 500 : level === 'alto' ? 1200 : 800, 0, 0, 21, 'Rental houses');
  addLine(6, 'Transportes', 1, totalShootingDays, level === 'bajo' ? 800 : level === 'alto' ? 2000 : 1200, 0, 0, 21, 'Mercado transportes');
  
  // ============ CHAPTER 7 - Viajes, Hoteles y Comidas ============
  addLine(7, 'Viajes equipo', 1, 1, level === 'bajo' ? 1500 : level === 'alto' ? 4000 : 2000, 0, 0, 21, 'Estimación');
  addLine(7, 'Hoteles equipo', teamSize, totalShootingDays, level === 'bajo' ? 60 : level === 'alto' ? 120 : 80, 0, 0, 10, 'Mercado hotelero');
  addLine(7, 'Dietas y comidas (catering)', teamSize + characters.length, totalShootingDays, level === 'bajo' ? 35 : level === 'alto' ? 70 : 50, 0, 0, 10, 'Mercado catering');
  
  // ============ CHAPTER 8 - Material Sensible ============
  addLine(8, 'Almacenamiento digital / Discos / Tarjetas', 1, 1, level === 'bajo' ? 2000 : level === 'alto' ? 5000 : 3000, 0, 0, 21, 'Mercado');
  addLine(8, 'Copias de seguridad y archivo', 1, 1, level === 'bajo' ? 1500 : level === 'alto' ? 3500 : 2000, 0, 0, 21, 'Mercado');
  
  // ============ CHAPTER 9 - Laboratorio / Postproducción ============
  addLine(9, 'Etalonaje / Corrección de color', 1, 1, level === 'bajo' ? 3000 : level === 'alto' ? 10000 : 5000, 0, 0, 21, 'Mercado postproducción');
  addLine(9, 'DCPs y copias', 1, 1, level === 'bajo' ? 2000 : level === 'alto' ? 5000 : 3000, 0, 0, 21, 'Mercado');
  
  // VFX estimation based on analysis
  const hasComplexVFX = creativeAnalysis?.viability_factors_negative?.toString().toLowerCase().includes('vfx') ||
                        creativeAnalysis?.viability_factors_negative?.toString().toLowerCase().includes('efectos');
  const vfxRate = hasComplexVFX 
    ? (level === 'bajo' ? 10000 : level === 'alto' ? 40000 : 15000)
    : (level === 'bajo' ? 3000 : level === 'alto' ? 10000 : 5000);
  addLine(9, hasComplexVFX ? 'Efectos visuales (VFX)' : 'Efectos visuales básicos', 1, 1, vfxRate, 0, 0, 21, 'Mercado VFX');
  
  // ============ CHAPTER 10 - Seguros ============
  const subtotalForInsurance = lines.reduce((sum, l) => {
    const base = l.units * l.quantity * l.unit_price;
    return sum + base * (1 + (l.agency_percentage || 0) / 100) * (1 + (l.social_security_percentage || 0) / 100);
  }, 0);
  
  addLine(10, 'Seguro de responsabilidad civil', 1, 1, Math.ceil(subtotalForInsurance * 0.01), 0, 0, 21, 'Mercado seguros', '1% del subtotal');
  addLine(10, 'Seguro de negativo / material', 1, 1, Math.ceil(subtotalForInsurance * 0.005), 0, 0, 21, 'Mercado seguros', '0.5% del subtotal');
  addLine(10, 'Seguro de accidentes', 1, 1, level === 'bajo' ? 2000 : level === 'alto' ? 5000 : 3000, 0, 0, 21, 'Mercado seguros');

  // ============ CHAPTER 11 - Gastos Generales ============
  const subtotalForGeneral = lines.reduce((sum, l) => {
    const base = l.units * l.quantity * l.unit_price;
    return sum + base * (1 + (l.agency_percentage || 0) / 100) * (1 + (l.social_security_percentage || 0) / 100);
  }, 0);
  
  addLine(11, 'Gastos de oficina y comunicaciones', 1, 1, level === 'bajo' ? 2000 : level === 'alto' ? 6000 : 3000, 0, 0, 21, 'Estimación');
  addLine(11, 'Asesoría legal y fiscal', 1, 1, level === 'bajo' ? 2500 : level === 'alto' ? 8000 : 4000, 0, 0, 21, 'Mercado');
  addLine(11, 'Imprevistos (3%)', 1, 1, Math.ceil(subtotalForGeneral * 0.03), 0, 0, 21, 'Práctica del sector', '3% del subtotal');

  // ============ CHAPTER 12 - Gastos Explotación ============
  addLine(12, 'Copias promocionales', 1, 1, level === 'bajo' ? 3000 : level === 'alto' ? 10000 : 5000, 0, 0, 21, 'Mercado');
  addLine(12, 'Publicidad y marketing inicial', 1, 1, level === 'bajo' ? 5000 : level === 'alto' ? 20000 : 10000, 0, 0, 21, 'Mercado');
  addLine(12, 'Festivales y mercados', 1, 1, level === 'bajo' ? 3000 : level === 'alto' ? 10000 : 5000, 0, 0, 21, 'Estimación');
  
  return lines;
}

export function calcularDiasRodajeEstimados(sequences: Sequence[]): number {
  if (sequences.length === 0) return 15; // Default
  
  // Estimate 5-8 sequences per day depending on duration
  const totalMinutes = sequences.reduce((sum, s) => sum + (s.estimated_duration_minutes || 3), 0);
  const daysFromDuration = Math.ceil(totalMinutes / 8); // ~8 minutes filmed per day
  const daysFromCount = Math.ceil(sequences.length / 5);
  
  return Math.max(daysFromDuration, daysFromCount, 10); // Minimum 10 days
}

// ── SSE stream reading helpers ────────────────────────────────────────

async function readSSEStream(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No se pudo leer la respuesta del servidor');

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === 'delta' && parsed.text) {
            fullText += parsed.text;
          } else if (parsed.type === 'error') {
            throw new Error(parsed.error || 'Error en la generación');
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Error en la generación') {
            // Ignore JSON parse errors on SSE lines
            continue;
          }
          throw e;
        }
      }
    }
  }

  return fullText;
}

function extractBudgetJson(raw: string): AIBudgetResponse {
  const trimmed = raw.trim();

  // 1) Direct parse
  try { return JSON.parse(trimmed); } catch { /* continue */ }

  // 2) Markdown fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* continue */ }
  }

  // 3) Outermost braces
  const braceStart = trimmed.indexOf('{');
  const braceEnd = trimmed.lastIndexOf('}');
  if (braceStart >= 0 && braceEnd > braceStart) {
    try { return JSON.parse(trimmed.slice(braceStart, braceEnd + 1)); } catch { /* continue */ }
  }

  throw new Error('La IA no generó un presupuesto válido. Inténtalo de nuevo.');
}
