/**
 * Budget Estimator Service
 * Generates estimated ICAA budget lines based on script analysis data
 * Supports both local estimation and AI-powered generation via edge function
 */

import type { Tables } from '@/integrations/supabase/types';
import {
  TARIFAS_EQUIPO_TECNICO,
  TARIFAS_GUIONISTA,
  TARIFAS_ACTORES,
  TARIFAS_EQUIPAMIENTO,
  TARIFAS_POSTPRODUCCION,
  COSTES_SOCIALES,
  DIETAS,
  SEGUROS,
  PORCENTAJES,
  RANGOS_PROYECTO,
  TARIFAS_AUDITORIA,
  type NivelPresupuesto,
  type CategoriaPresupuesto,
} from '@/data/tarifas-icaa-2025';

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
  budgetLevel: BudgetLevel = 'medio',
  projectType: string = 'largometraje'
): Promise<AIBudgetResponse> {
  // Prepare data for the edge function
  const requestData = {
    projectId,
    projectTitle: 'Proyecto',
    projectType,
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
 * Get actor daily rate from real tariff data
 */
function getCategoryRate(category: string | null, level: BudgetLevel = 'medio'): number {
  const key = (category?.toLowerCase() || 'secundario') as keyof typeof TARIFAS_ACTORES;
  const tarifas = TARIFAS_ACTORES[key] || TARIFAS_ACTORES.secundario;
  return tarifas[level];
}

/**
 * Get crew weekly rate from Convenio Colectivo
 */
function getCrewRate(role: string, level: BudgetLevel): number {
  const tarifa = TARIFAS_EQUIPO_TECNICO[role];
  if (!tarifa) return 2000;
  return level === 'alto' ? tarifa.presupuesto_estandar : tarifa.bajo_presupuesto;
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
  const guionTarifas = TARIFAS_GUIONISTA[level];
  const guionRate = Math.round((guionTarifas.minimo + guionTarifas.maximo) / 2);
  addLine(1, 'Guión original', 1, 1, guionRate, 0, 0, 21, 'Convenio DAMA 2025');
  addLine(1, 'Música original (compositor)', 1, 1, level === 'bajo' ? 3000 : level === 'alto' ? 12000 : 7000, 0, 0, 21, 'Mercado');
  addLine(1, 'Derechos musicales (sincronización)', 1, 1, level === 'bajo' ? 500 : level === 'alto' ? 5000 : 2000, 0, 0, 21, 'Dato factura real 500-5.000');
  
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
  
  // ============ CHAPTER 3 - Equipo Técnico (Convenio Colectivo 2025) ============
  const ssPct = COSTES_SOCIALES.seguridad_social_empresa * 100; // 23.5%
  const src = 'Convenio Colectivo Técnicos 2025';

  // Direccion
  addLine(3, 'Director/Realizador', 1, shootingWeeks + prepWeeks, getCrewRate('director_realizador', level), 0, ssPct, 21, src);
  addLine(3, '1er Ayudante Dirección', 1, shootingWeeks + prepWeeks, getCrewRate('primer_ayudante_direccion', level), 0, ssPct, 21, src);
  if (totalShootingDays > 10) {
    addLine(3, 'Script / Continuidad', 1, shootingWeeks, getCrewRate('script', level), 0, ssPct, 21, src);
  }

  // Produccion
  addLine(3, 'Director/a de Producción', 1, shootingWeeks + prepWeeks + 4, getCrewRate('director_produccion', level), 0, ssPct, 21, src);
  addLine(3, 'Jefe/a de Producción', 1, shootingWeeks + prepWeeks, getCrewRate('jefe_produccion', level), 0, ssPct, 21, src);
  if (totalShootingDays > 10) {
    addLine(3, 'Ayudante de Producción', 1, shootingWeeks + prepWeeks, getCrewRate('ayudante_produccion', level), 0, ssPct, 21, src);
  }

  // Fotografia
  addLine(3, 'Director/a de Fotografía', 1, shootingWeeks + 2, getCrewRate('director_fotografia', level), 0, ssPct, 21, src);
  if (totalShootingDays > 15) {
    addLine(3, 'Operador/a de Cámara', 1, shootingWeeks, getCrewRate('camarografo', level), 0, ssPct, 21, src);
  }
  addLine(3, '1er Ayudante Cámara', 1, shootingWeeks, getCrewRate('primer_ayudante_camara', level), 0, ssPct, 21, src);

  // Arte y decoracion
  addLine(3, 'Director/a de Arte', 1, shootingWeeks + 2, getCrewRate('director_arte', level), 0, ssPct, 21, src);
  if (totalShootingDays > 15) {
    addLine(3, 'Attrezzista', 1, shootingWeeks, getCrewRate('attrezzista', level), 0, ssPct, 21, src);
  }

  // Vestuario, maquillaje, peluqueria
  addLine(3, 'Figurinista', 1, shootingWeeks + 1, getCrewRate('figurinista', level), 0, ssPct, 21, src);
  addLine(3, 'Jefe/a de Maquillaje', 1, shootingWeeks, getCrewRate('jefe_maquillaje', level), 0, ssPct, 21, src);
  addLine(3, 'Jefe/a de Peluquería', 1, shootingWeeks, getCrewRate('jefe_peluqueria', level), 0, ssPct, 21, src);

  // Sonido
  addLine(3, 'Jefe/a de Sonido', 1, shootingWeeks, getCrewRate('jefe_sonido', level), 0, ssPct, 21, src);
  if (totalShootingDays > 10) {
    addLine(3, 'Microfonista', 1, shootingWeeks, getCrewRate('microfonista', level), 0, ssPct, 21, src);
  }

  // Montaje
  addLine(3, 'Montador/a', 1, postWeeks, getCrewRate('montador', level), 0, ssPct, 21, src);
  if (totalShootingDays > 20) {
    addLine(3, 'Ayudante Montaje', 1, postWeeks, getCrewRate('ayudante_montaje', level), 0, ssPct, 21, src);
  }

  // Electricos y maquinistas
  addLine(3, 'Jefe/a de Eléctricos', 1, shootingWeeks, getCrewRate('jefe_electricos', level), 0, ssPct, 21, src);
  if (totalShootingDays > 10) {
    addLine(3, 'Eléctrico', 1, shootingWeeks, getCrewRate('electrico', level), 0, ssPct, 21, src);
    addLine(3, 'Maquinista Jefe', 1, shootingWeeks, getCrewRate('maquinista', level), 0, ssPct, 21, src);
  }
  
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

  addLine(4, 'Attrezzo', 1, totalShootingDays, level === 'bajo' ? 300 : level === 'alto' ? 800 : 500, 0, 0, 21, 'Dato factura proveedores');
  addLine(4, 'Vestuario (compra/alquiler)', characters.length || 8, 1, level === 'bajo' ? 500 : level === 'alto' ? 1200 : 800, 0, 0, 21, 'Dato presupuestos ICAA reales');
  addLine(4, 'Materiales maquillaje y peluquería', 1, totalShootingDays, level === 'bajo' ? 150 : level === 'alto' ? 350 : 200, 0, 0, 21, 'Dato presupuestos ICAA reales');
  
  // ============ CHAPTER 5 - Estudios y Sonorización ============
  const isLargo = totalShootingDays >= 20;
  const tipoProyecto = isLargo ? 'largometraje' : 'cortometraje';
  const platoDays = Math.ceil(totalShootingDays * 0.3);
  addLine(5, 'Alquiler plató / Localizaciones interiores', 1, platoDays, level === 'bajo' ? 2000 : level === 'alto' ? 5000 : 3000, 0, 0, 21, 'Mercado estudios Madrid/Barcelona');
  addLine(5, 'Sala de sonorización (edición diálogos)', 1, isLargo ? 25 : 5, level === 'bajo' ? 500 : 680, 0, 0, 21, 'Factura Antaviana/El Colorado');
  addLine(5, 'Mezcla 5.1', 1, 1, TARIFAS_POSTPRODUCCION.sonido.mezcla_5_1[tipoProyecto], 0, 0, 21, 'Factura Antaviana');
  
  // ============ CHAPTER 6 - Maquinaria y Transportes ============
  // Cámara: desde Blackmagic URSA (120/dia) hasta ARRI ALEXA MINI (450/dia)
  const camaraKey = level === 'bajo' ? 'blackmagic_ursa' : level === 'alto' ? 'arri_alexa_mini' : 'red_v_raptor';
  const camaraTarifa = TARIFAS_EQUIPAMIENTO.camara[camaraKey];
  addLine(6, `Equipo cámara (${camaraKey.replace(/_/g, ' ')})`, 1, totalShootingDays, camaraTarifa.dia, 0, 0, 21, 'Factura By Jarana Films');
  // Óptica
  const opticaKey = level === 'bajo' ? 'zoom_cine' : level === 'alto' ? 'primos_master' : 'primos_medio';
  addLine(6, `Óptica (${opticaKey.replace(/_/g, ' ')})`, 1, totalShootingDays, TARIFAS_EQUIPAMIENTO.optica[opticaKey].dia, 0, 0, 21, 'Factura By Jarana Films');
  // Iluminación
  const ilumKey = level === 'bajo' ? 'kit_basico' : level === 'alto' ? 'kit_avanzado' : 'kit_medio';
  addLine(6, `Iluminación (${ilumKey.replace(/_/g, ' ')})`, 1, totalShootingDays, TARIFAS_EQUIPAMIENTO.iluminacion[ilumKey].dia, 0, 0, 21, 'Factura proveedores reales');
  // Sonido directo
  addLine(6, 'Sonido directo (equipos)', 1, totalShootingDays, TARIFAS_EQUIPAMIENTO.sonido.kit_directo.dia, 0, 0, 21, 'Factura proveedores reales');
  // Grip
  if (level !== 'bajo') {
    addLine(6, 'Dolly / Track', 1, Math.ceil(totalShootingDays * 0.5), TARIFAS_EQUIPAMIENTO.grip.dolly_track.dia, 0, 0, 21, 'Factura proveedores reales');
  }
  // Transportes
  addLine(6, 'Transportes (vehículos producción)', 1, totalShootingDays, level === 'bajo' ? 800 : level === 'alto' ? 2000 : 1200, 0, 0, 21, 'Presupuestos ICAA reales');
  
  // ============ CHAPTER 7 - Viajes, Hoteles y Comidas ============
  const crewSize = isLargo ? 25 : 12;
  addLine(7, 'Viajes equipo', crewSize, 2, level === 'bajo' ? 80 : level === 'alto' ? 200 : 120, 0, 0, 10, 'Presupuestos ICAA reales', 'Ida y vuelta');
  addLine(7, 'Hoteles equipo', Math.ceil(crewSize * 0.4), totalShootingDays, level === 'bajo' ? 60 : level === 'alto' ? 120 : 80, 0, 0, 10, 'Presupuestos ICAA reales', '40% del equipo desplazado');
  addLine(7, 'Dietas completas', crewSize + characters.length, totalShootingDays, DIETAS.dieta_completa, 0, 0, 10, 'Convenio Colectivo 2025', `${DIETAS.dieta_completa} EUR/persona/dia`);
  addLine(7, 'Catering rodaje', crewSize + characters.length, totalShootingDays, level === 'bajo' ? 15 : level === 'alto' ? 25 : 18, 0, 0, 10, 'Presupuestos ICAA reales');
  
  // ============ CHAPTER 8 - Material Sensible ============
  addLine(8, 'Tarjetas / Discos / Almacenamiento digital', 1, totalShootingDays, level === 'bajo' ? 50 : level === 'alto' ? 150 : 80, 0, 0, 21, 'Presupuestos ICAA reales');
  addLine(8, 'Copias de seguridad y archivo LTO', 1, 1, level === 'bajo' ? 800 : level === 'alto' ? 2500 : 1500, 0, 0, 21, 'Presupuestos ICAA reales');
  
  // ============ CHAPTER 9 - Laboratorio / Postproducción ============
  const postTarifas = TARIFAS_POSTPRODUCCION;
  // Etalonaje
  const etalonajeRange = postTarifas.etalonaje[tipoProyecto];
  const etalonajeRate = level === 'bajo' ? etalonajeRange.minimo : level === 'alto' ? etalonajeRange.maximo : Math.round((etalonajeRange.minimo + etalonajeRange.maximo) / 2);
  addLine(9, 'Etalonaje / Corrección de color', 1, 1, etalonajeRate, 0, 0, 21, 'Factura El Colorado');
  // Diseño sonoro
  addLine(9, 'Diseño sonoro', 1, 1, postTarifas.sonido.diseno_sonoro[tipoProyecto], 0, 0, 21, 'Factura Antaviana');
  // Edición diálogos
  addLine(9, 'Edición de diálogos', 1, 1, postTarifas.sonido.edicion_dialog[tipoProyecto], 0, 0, 21, 'Factura Antaviana');
  // Foley
  addLine(9, 'Foley', 1, 1, postTarifas.sonido.foley[tipoProyecto], 0, 0, 21, 'Factura Antaviana');
  // Grafismo (títulos y créditos)
  addLine(9, 'Títulos y créditos', 1, 1, postTarifas.grafismo.titulos_creditos[tipoProyecto], 0, 0, 21, 'Presupuestos ICAA reales');
  // DCP
  addLine(9, 'DCP', 1, 1, level === 'alto' ? postTarifas.mastering.dcp_4k : postTarifas.mastering.dcp_2k, 0, 0, 21, 'Factura proveedores reales');
  // Master adicional
  addLine(9, 'Master UHD Rec.709', 1, 1, postTarifas.mastering.master_uhd_709, 0, 0, 21, 'Factura proveedores reales');
  // Coordinación postproducción
  addLine(9, 'Coordinación postproducción', 1, 1, postTarifas.coordinacion_postpro[tipoProyecto], 0, ssPct, 21, 'Presupuestos ICAA reales');

  // VFX estimation based on analysis
  const hasComplexVFX = creativeAnalysis?.viability_factors_negative?.toString().toLowerCase().includes('vfx') ||
                        creativeAnalysis?.viability_factors_negative?.toString().toLowerCase().includes('efectos');
  if (hasComplexVFX) {
    const vfxPlanos = level === 'bajo' ? 20 : level === 'alto' ? 80 : 40;
    const vfxMediaRate = Math.round((postTarifas.vfx.plano_medio.minimo + postTarifas.vfx.plano_medio.maximo) / 2);
    addLine(9, 'VFX (planos complejidad media)', vfxPlanos, 1, vfxMediaRate, 0, 0, 21, 'Factura Antaviana VFX');
  } else {
    const vfxPlanos = level === 'bajo' ? 5 : level === 'alto' ? 20 : 10;
    const vfxSimpleRate = Math.round((postTarifas.vfx.plano_simple.minimo + postTarifas.vfx.plano_simple.maximo) / 2);
    addLine(9, 'VFX básicos (retoques, borrados)', vfxPlanos, 1, vfxSimpleRate, 0, 0, 21, 'Factura Antaviana VFX');
  }

  // Subtítulos
  const duracionMinutos = isLargo ? 100 : 15;
  addLine(9, 'Subtitulado (transcripción)', duracionMinutos, 1, postTarifas.subtitulos.por_minuto_transcripcion, 0, 0, 21, 'Factura proveedores reales');
  addLine(9, 'Subtitulado (traducción inglés)', duracionMinutos, 1, postTarifas.subtitulos.por_minuto_traduccion, 0, 0, 21, 'Factura proveedores reales');
  
  // ============ CHAPTER 10 - Seguros ============
  const subtotalForInsurance = lines.reduce((sum, l) => {
    const base = l.units * l.quantity * l.unit_price;
    return sum + base * (1 + (l.agency_percentage || 0) / 100) * (1 + (l.social_security_percentage || 0) / 100);
  }, 0);

  addLine(10, 'Seguro de responsabilidad civil', 1, 1, Math.ceil(subtotalForInsurance * SEGUROS.responsabilidad_civil), 0, 0, 21, 'Dato sector', `${SEGUROS.responsabilidad_civil * 100}% del presupuesto producción`);
  addLine(10, 'Seguro de accidentes', 1, 1, Math.ceil(subtotalForInsurance * SEGUROS.accidentes), 0, 0, 21, 'Dato sector', `${SEGUROS.accidentes * 100}% del presupuesto producción`);
  addLine(10, 'Seguro interrupción de rodaje', 1, 1, Math.ceil(subtotalForInsurance * SEGUROS.interrupcion_rodaje), 0, 0, 21, 'Dato sector', `${SEGUROS.interrupcion_rodaje * 100}% del presupuesto producción`);
  addLine(10, 'Seguro equipo/material', 1, 1, Math.ceil(subtotalForInsurance * SEGUROS.equipo_material), 0, 0, 21, 'Dato sector', `${SEGUROS.equipo_material * 100}% del presupuesto producción`);

  // ============ CHAPTER 11 - Gastos Generales ============
  const subtotalForGeneral = lines.reduce((sum, l) => {
    const base = l.units * l.quantity * l.unit_price;
    return sum + base * (1 + (l.agency_percentage || 0) / 100) * (1 + (l.social_security_percentage || 0) / 100);
  }, 0);

  addLine(11, 'Gastos generales (oficina, teléfono, copistería)', 1, 1, Math.ceil(subtotalForGeneral * PORCENTAJES.gastos_generales), 0, 0, 21, 'Estándar ICAA', `${PORCENTAJES.gastos_generales * 100}% del presupuesto producción`);
  addLine(11, 'Asesoría legal y fiscal', 1, 1, level === 'bajo' ? 2500 : level === 'alto' ? 8000 : 4000, 0, 0, 21, 'Presupuestos ICAA reales');
  addLine(11, 'Auditoría (coste ICAA)', 1, 1, TARIFAS_AUDITORIA[tipoProyecto], 0, 0, 21, 'Dato ICAA', isLargo ? 'Obligatoria para largos' : '');
  addLine(11, 'Imprevistos', 1, 1, Math.ceil(subtotalForGeneral * PORCENTAJES.imprevistos), 0, 0, 21, 'Estándar ICAA', `${PORCENTAJES.imprevistos * 100}% del presupuesto producción`);

  // ============ CHAPTER 12 - Gastos Explotación ============
  addLine(12, 'Copias promocionales (screeners, Blu-ray)', 1, 1, level === 'bajo' ? 1500 : level === 'alto' ? 5000 : 2500, 0, 0, 21, 'Presupuestos ICAA reales');
  addLine(12, 'Publicidad y marketing (materiales, cartel)', 1, 1, level === 'bajo' ? 3000 : level === 'alto' ? 15000 : 7000, 0, 0, 21, 'Presupuestos ICAA reales');
  addLine(12, 'Festivales y mercados (inscripciones, viajes)', 1, 1, level === 'bajo' ? 2000 : level === 'alto' ? 8000 : 4000, 0, 0, 21, 'Presupuestos ICAA reales');
  addLine(12, 'Tráiler', 1, 1, level === 'bajo' ? 1500 : level === 'alto' ? 6000 : 3000, 0, 0, 21, 'Presupuestos ICAA reales');
  
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

export async function readSSEStream(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No se pudo leer la respuesta del servidor');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          if (parsed.type === 'complete' && parsed.text) {
            return parsed.text;
          } else if (parsed.type === 'delta' && parsed.text) {
            fullText += parsed.text;
          } else if (parsed.type === 'progress') {
            continue;
          } else if (parsed.type === 'error') {
            throw new Error(parsed.error || 'Error en la generación');
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Error en la generación') {
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
