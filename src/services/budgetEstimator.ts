/**
 * Budget Estimator Service
 * Generates estimated ICAA budget lines based on script analysis data
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

export interface EstimatedBudgetLine {
  chapter: number;
  account_number: string;
  concept: string;
  units: number;
  quantity: number;
  unit_price: number;
  agency_percentage: number;
  total: number;
}

// Base rates for estimation (editable by user later)
const TARIFAS_BASE = {
  // Chapter 1 - Guión y Música
  guion_derechos: 15000,
  musica_original: 8000,
  derechos_musicales: 3000,
  
  // Chapter 2 - Personal Artístico (per day)
  protagonista_dia: 3000,
  principal_dia: 1500,
  secundario_dia: 800,
  figuracion_dia: 150,
  
  // Chapter 3 - Equipo Técnico (per week)
  director_semana: 8000,
  productor_ejecutivo_semana: 6000,
  dir_produccion_semana: 4000,
  dop_semana: 5000,
  operador_camara_semana: 2500,
  jefe_sonido_semana: 2500,
  director_arte_semana: 3000,
  jefe_maquillaje_semana: 2000,
  jefe_vestuario_semana: 2000,
  script_semana: 1500,
  montador_semana: 3000,
  
  // Chapter 4 - Escenografía (per location)
  localizacion_simple: 2000,
  localizacion_media: 5000,
  localizacion_compleja: 10000,
  attrezzo_dia: 500,
  vestuario_personaje: 800,
  
  // Chapter 5 - Estudios (per day)
  plato_dia: 3000,
  sonorizacion_dia: 1500,
  
  // Chapter 6 - Maquinaria (per day)
  camara_equipamiento_dia: 2000,
  iluminacion_dia: 1500,
  sonido_equipamiento_dia: 800,
  transportes_dia: 1200,
  
  // Chapter 7 - Viajes (per day per person)
  dietas_persona_dia: 50,
  hotel_persona_noche: 80,
  viajes_estimado: 2000,
  
  // Chapter 8 - Material
  almacenamiento_digital: 3000,
  
  // Chapter 9 - Laboratorio
  etalonaje: 5000,
  dcps: 3000,
  vfx_simple: 5000,
  vfx_medio: 15000,
  vfx_complejo: 40000,
  
  // Chapter 10 - Seguros (percentage of total)
  seguro_rc_porcentaje: 0.01,
  seguro_negativo_porcentaje: 0.005,
  
  // Chapter 11 - Gastos generales (percentage of subtotal)
  gastos_generales_porcentaje: 0.05,
  imprevistos_porcentaje: 0.03,
  
  // Chapter 12 - Explotación
  copias_promocionales: 5000,
  marketing_base: 10000,
};

function getCategoryRate(category: string | null): number {
  switch (category?.toLowerCase()) {
    case 'protagonista':
      return TARIFAS_BASE.protagonista_dia;
    case 'principal':
      return TARIFAS_BASE.principal_dia;
    case 'secundario':
      return TARIFAS_BASE.secundario_dia;
    case 'figuración':
    case 'figuracion':
      return TARIFAS_BASE.figuracion_dia;
    default:
      return TARIFAS_BASE.secundario_dia;
  }
}

function getLocationRate(complexity: string | null): number {
  switch (complexity?.toLowerCase()) {
    case 'alta':
    case 'compleja':
      return TARIFAS_BASE.localizacion_compleja;
    case 'media':
      return TARIFAS_BASE.localizacion_media;
    case 'baja':
    case 'simple':
    default:
      return TARIFAS_BASE.localizacion_simple;
  }
}

function calculateTotal(units: number, quantity: number, unitPrice: number, agencyPct: number = 0): number {
  return units * quantity * unitPrice * (1 + agencyPct / 100);
}

export function generarPresupuestoEstimado(input: BudgetEstimationInput): EstimatedBudgetLine[] {
  const { characters, locations, sequences, creativeAnalysis, estimatedShootingDays } = input;
  
  // Smart estimation of shooting days with fallbacks
  let totalShootingDays = estimatedShootingDays;
  
  if (!totalShootingDays) {
    // Priority 1: From character shooting days
    const maxCharacterDays = Math.max(...characters.map(c => c.shooting_days || 0), 0);
    
    // Priority 2: From sequences
    const daysFromSequences = sequences.length > 0 ? Math.ceil(sequences.length / 5) : 0;
    
    // Priority 3: Estimate from creative analysis (budget range)
    let daysFromAnalysis = 0;
    if (creativeAnalysis?.estimated_budget_range) {
      const budgetStr = creativeAnalysis.estimated_budget_range;
      // Extract numbers from strings like "€50K - €200K" or "50.000 - 200.000"
      const numbers = budgetStr.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        const avgBudget = (parseInt(numbers[0]) + parseInt(numbers[1])) / 2;
        // Rough: 1 day of shooting ≈ €15K-20K total cost
        daysFromAnalysis = Math.ceil(avgBudget / 15);
      }
    }
    
    totalShootingDays = Math.max(maxCharacterDays, daysFromSequences, daysFromAnalysis, 15);
  }
  
  const shootingWeeks = Math.ceil(totalShootingDays / 5);
  const teamSize = 15; // Average crew size
  
  // Estimate number of locations if none saved
  let effectiveLocations = locations;
  if (locations.length === 0 && creativeAnalysis) {
    // Extract location count from viability factors or estimate from genre/complexity
    const negativeFactors = JSON.stringify(creativeAnalysis.viability_factors_negative || []).toLowerCase();
    const positiveFactors = JSON.stringify(creativeAnalysis.viability_factors_positive || []).toLowerCase();
    
    let estimatedLocationCount = 8; // Default for a standard film
    
    if (negativeFactors.includes('múltiples') || negativeFactors.includes('localizaciones')) {
      estimatedLocationCount = 12;
    }
    if (positiveFactors.includes('pocas') || positiveFactors.includes('unitaria')) {
      estimatedLocationCount = 4;
    }
    
    // Create synthetic locations for estimation
    effectiveLocations = Array.from({ length: estimatedLocationCount }, (_, i) => ({
      id: `estimated-${i}`,
      project_id: '',
      name: `Localización estimada ${i + 1}`,
      complexity: i < 2 ? 'alta' : i < 5 ? 'media' : 'baja',
      location_type: null,
      estimated_days: Math.ceil(totalShootingDays / estimatedLocationCount),
      production_notes: null,
      special_needs: null,
      created_at: '',
      updated_at: '',
    })) as Location[];
  }
  
  const lines: EstimatedBudgetLine[] = [];
  let lineCounter: Record<number, number> = {};
  
  const addLine = (chapter: number, concept: string, units: number, quantity: number, unitPrice: number, agencyPct: number = 0) => {
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
      total: calculateTotal(units, quantity, unitPrice, agencyPct),
    });
  };
  
  // ============ CHAPTER 1 - Guión y Música ============
  addLine(1, 'Guión (derechos de autor)', 1, 1, TARIFAS_BASE.guion_derechos);
  addLine(1, 'Música original', 1, 1, TARIFAS_BASE.musica_original);
  addLine(1, 'Derechos musicales (sincronización)', 1, 1, TARIFAS_BASE.derechos_musicales);
  
  // ============ CHAPTER 2 - Personal Artístico ============
  // Group characters by category
  const protagonistas = characters.filter(c => c.category?.toLowerCase() === 'protagonista');
  const principales = characters.filter(c => c.category?.toLowerCase() === 'principal');
  const secundarios = characters.filter(c => c.category?.toLowerCase() === 'secundario');
  const figuracion = characters.filter(c => c.category?.toLowerCase().includes('figuraci'));
  
  // Add individual characters for protagonists and principales
  [...protagonistas, ...principales].forEach(char => {
    const days = char.shooting_days || Math.ceil(totalShootingDays * 0.8);
    const rate = getCategoryRate(char.category);
    const agency = char.agency_percentage || 15;
    addLine(2, char.name, 1, days, rate, agency);
  });
  
  // Group secundarios
  if (secundarios.length > 0) {
    const avgDays = Math.ceil(secundarios.reduce((sum, c) => sum + (c.shooting_days || 2), 0) / secundarios.length);
    addLine(2, `Secundarios (${secundarios.length} personajes)`, secundarios.length, avgDays, TARIFAS_BASE.secundario_dia, 15);
  }
  
  // Figuración estimate
  if (figuracion.length > 0 || sequences.length > 5) {
    const numFiguracion = figuracion.length || Math.ceil(sequences.length / 3);
    addLine(2, 'Figuración especial', numFiguracion, 5, TARIFAS_BASE.figuracion_dia, 0);
  }
  
  // ============ CHAPTER 3 - Equipo Técnico ============
  addLine(3, 'Director/a', 1, shootingWeeks + 4, TARIFAS_BASE.director_semana); // +4 prep/post
  addLine(3, 'Productor/a ejecutivo', 1, shootingWeeks + 8, TARIFAS_BASE.productor_ejecutivo_semana);
  addLine(3, 'Director/a de producción', 1, shootingWeeks + 4, TARIFAS_BASE.dir_produccion_semana);
  addLine(3, 'Director/a de fotografía', 1, shootingWeeks + 2, TARIFAS_BASE.dop_semana);
  addLine(3, 'Operador/a de cámara', 1, shootingWeeks, TARIFAS_BASE.operador_camara_semana);
  addLine(3, 'Jefe/a de sonido', 1, shootingWeeks, TARIFAS_BASE.jefe_sonido_semana);
  addLine(3, 'Director/a de arte', 1, shootingWeeks + 2, TARIFAS_BASE.director_arte_semana);
  addLine(3, 'Jefe/a de maquillaje', 1, shootingWeeks, TARIFAS_BASE.jefe_maquillaje_semana);
  addLine(3, 'Jefe/a de vestuario', 1, shootingWeeks, TARIFAS_BASE.jefe_vestuario_semana);
  addLine(3, 'Script / Continuidad', 1, shootingWeeks, TARIFAS_BASE.script_semana);
  addLine(3, 'Montador/a', 1, shootingWeeks + 4, TARIFAS_BASE.montador_semana);
  
  // ============ CHAPTER 4 - Escenografía ============
  if (effectiveLocations.length > 0) {
    effectiveLocations.forEach(loc => {
      const rate = getLocationRate(loc.complexity);
      const isEstimated = loc.id.startsWith('estimated-');
      const prefix = isEstimated ? 'Loc (est): ' : 'Loc: ';
      addLine(4, `${prefix}${loc.name}`, 1, loc.estimated_days || 1, rate);
    });
  } else {
    // Fallback estimate based on sequences
    const estimatedLocations = Math.max(5, Math.ceil(sequences.length / 4));
    addLine(4, 'Decorados y localizaciones (estimado)', estimatedLocations, 1, TARIFAS_BASE.localizacion_media);
  }
  
  addLine(4, 'Attrezzo', 1, totalShootingDays, TARIFAS_BASE.attrezzo_dia);
  addLine(4, 'Vestuario', characters.length || 8, 1, TARIFAS_BASE.vestuario_personaje);
  addLine(4, 'Materiales maquillaje y peluquería', 1, totalShootingDays, 200);
  
  // ============ CHAPTER 5 - Estudios y Sonorización ============
  addLine(5, 'Alquiler plató / Localizaciones interiores', 1, Math.ceil(totalShootingDays * 0.3), TARIFAS_BASE.plato_dia);
  addLine(5, 'Sala de doblaje y sonorización', 1, 5, TARIFAS_BASE.sonorizacion_dia);
  addLine(5, 'Mezclas', 1, 1, 8000);
  
  // ============ CHAPTER 6 - Maquinaria y Transportes ============
  addLine(6, 'Equipo cámara (alquiler)', 1, totalShootingDays, TARIFAS_BASE.camara_equipamiento_dia);
  addLine(6, 'Iluminación (alquiler)', 1, totalShootingDays, TARIFAS_BASE.iluminacion_dia);
  addLine(6, 'Sonido (alquiler equipos)', 1, totalShootingDays, TARIFAS_BASE.sonido_equipamiento_dia);
  addLine(6, 'Transportes', 1, totalShootingDays, TARIFAS_BASE.transportes_dia);
  
  // ============ CHAPTER 7 - Viajes, Hoteles y Comidas ============
  addLine(7, 'Viajes equipo', 1, 1, TARIFAS_BASE.viajes_estimado);
  addLine(7, 'Hoteles equipo', teamSize, totalShootingDays, TARIFAS_BASE.hotel_persona_noche);
  addLine(7, 'Dietas y comidas', teamSize + characters.length, totalShootingDays, TARIFAS_BASE.dietas_persona_dia);
  
  // ============ CHAPTER 8 - Material Sensible ============
  addLine(8, 'Almacenamiento digital / Discos / Tarjetas', 1, 1, TARIFAS_BASE.almacenamiento_digital);
  addLine(8, 'Copias de seguridad y archivo', 1, 1, 2000);
  
  // ============ CHAPTER 9 - Laboratorio / Postproducción ============
  addLine(9, 'Etalonaje / Corrección de color', 1, 1, TARIFAS_BASE.etalonaje);
  addLine(9, 'DCPs y copias', 1, 1, TARIFAS_BASE.dcps);
  
  // VFX estimation based on analysis
  const hasComplexVFX = creativeAnalysis?.viability_factors_negative?.toString().toLowerCase().includes('vfx') ||
                        creativeAnalysis?.viability_factors_negative?.toString().toLowerCase().includes('efectos');
  if (hasComplexVFX) {
    addLine(9, 'Efectos visuales (VFX)', 1, 1, TARIFAS_BASE.vfx_medio);
  } else {
    addLine(9, 'Efectos visuales básicos', 1, 1, TARIFAS_BASE.vfx_simple);
  }
  
  // ============ CHAPTER 10 - Seguros ============
  const subtotalForInsurance = lines.reduce((sum, l) => sum + l.total, 0);
  addLine(10, 'Seguro de responsabilidad civil', 1, 1, Math.ceil(subtotalForInsurance * TARIFAS_BASE.seguro_rc_porcentaje));
  addLine(10, 'Seguro de negativo / material', 1, 1, Math.ceil(subtotalForInsurance * TARIFAS_BASE.seguro_negativo_porcentaje));
  addLine(10, 'Seguro de accidentes', 1, 1, 3000);
  
  // ============ CHAPTER 11 - Gastos Generales ============
  const subtotalForGeneral = lines.reduce((sum, l) => sum + l.total, 0);
  addLine(11, 'Gastos de oficina y comunicaciones', 1, 1, 3000);
  addLine(11, 'Asesoría legal y fiscal', 1, 1, 4000);
  addLine(11, 'Imprevistos (3%)', 1, 1, Math.ceil(subtotalForGeneral * TARIFAS_BASE.imprevistos_porcentaje));
  
  // ============ CHAPTER 12 - Gastos Explotación ============
  addLine(12, 'Copias promocionales', 1, 1, TARIFAS_BASE.copias_promocionales);
  addLine(12, 'Publicidad y marketing inicial', 1, 1, TARIFAS_BASE.marketing_base);
  addLine(12, 'Festivales y mercados', 1, 1, 5000);
  
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
