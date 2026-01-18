// Shooting Plan Service - Intelligent scheduling using the Law of Eighths
// Implements professional 1st AD time estimation formulas

import { supabase } from "@/integrations/supabase/client";

// ═══════════════════════════════════════════════════════════════════════
// FÓRMULA PROFESIONAL DE TIEMPO DE RODAJE (1st AD Standard)
// ═══════════════════════════════════════════════════════════════════════

// Base: 1 página (8/8) = 90 minutos de rodaje en condiciones normales
const BASE_MINUTES_PER_PAGE = 90;
const BASE_MINUTES_PER_EIGHTH = BASE_MINUTES_PER_PAGE / 8; // 11.25 min/octavo

// Tiempos de setup por tipo de set
const SETUP_TIMES = {
  INT: 45,  // Interior: 45 min setup
  EXT: 60,  // Exterior: 60 min setup
  NIGHT_BONUS: 15, // Bonus nocturno: +15 min
};

// Multiplicadores de complejidad profesionales
const COMPLEXITY_MULTIPLIERS: Record<string, number> = {
  bajo: 1.0,     // Diálogo estático, 2 personas, interior día
  media: 1.2,    // Walk and talk, comida, >3 personajes
  alto: 2.0,     // Peleas, persecuciones, niños, animales, lluvia, VFX
  extremo: 3.0,  // Escenas de masas, stunts complejos
  // Alias en español
  baja: 1.0,
  alta: 2.0,
};

// Mini-setup para escenas en misma localización (reposición de cámara)
const MINI_SETUP_MINUTES = 10;

// Jornada máxima recomendada
export const MAX_WORKDAY_HOURS = 12;
export const MAX_WORKDAY_MINUTES = MAX_WORKDAY_HOURS * 60;

// ═══════════════════════════════════════════════════════════════════════

export interface SceneForPlanning {
  id: string;
  sequence_number: number;
  title: string;
  description: string;
  location_name: string;
  location_id: string | null;
  time_of_day: string; // DÍA, NOCHE, ATARDECER, AMANECER
  page_eighths: number;
  scene_complexity: string;
  characters: string[];
  effectiveEighths: number; // Adjusted by complexity
  // Campos profesionales de tiempo
  set_type?: 'INT' | 'EXT';
  complexity_factor?: number;
  complexity_reason?: string;
  setup_time_minutes?: number;
  shooting_time_minutes?: number;
  total_time_minutes?: number;
}

export interface SceneTimeBreakdown {
  setupMinutes: number;
  shootingMinutes: number;
  totalMinutes: number;
  complexityFactor: number;
}

export interface ProposedShootingDay {
  dayNumber: number;
  location: string;
  locationId: string | null;
  timeOfDay: string;
  scenes: SceneForPlanning[];
  totalEighths: number;
  estimatedHours: number;
  characters: string[];
  warnings: string[];
  // Nuevos campos de tiempo
  totalSetupMinutes?: number;
  totalShootingMinutes?: number;
  totalMinutes?: number;
}

export interface PlanGenerationOptions {
  groupBy: 'location' | 'time_of_day' | 'proximity';
  maxEighthsPerDay: number;
  separateDayNight: boolean;
  optimizeByProximity: boolean;
}

// Detectar si es INT o EXT desde el encabezado de escena
export function detectSetType(title: string): 'INT' | 'EXT' {
  const titleUpper = title?.toUpperCase() || '';
  if (titleUpper.startsWith('EXT')) return 'EXT';
  return 'INT';
}

// Detectar si es escena nocturna
export function isNightScene(timeOfDay: string): boolean {
  const tod = timeOfDay?.toUpperCase() || '';
  return tod.includes('NOCHE') || tod.includes('NIGHT');
}

// Normalizar octavos según la Ley de los Octavos profesional
// El valor debe ser un entero de 1 a 16+ (nunca 0, nunca fracciones)
export function normalizeEighths(rawValue: number | null | undefined): number {
  if (!rawValue || rawValue <= 0) return 1; // Mínimo es 1/8
  
  // Si viene como decimal pequeño (0.125, 0.5, 0.875), convertir de páginas a octavos
  if (rawValue > 0 && rawValue < 1) {
    return Math.max(1, Math.round(rawValue * 8));
  }
  
  // Si está entre 1 y 3 con decimales, podría ser páginas
  if (rawValue >= 1 && rawValue < 3 && rawValue !== Math.floor(rawValue)) {
    return Math.max(1, Math.round(rawValue * 8));
  }
  
  return Math.max(1, Math.round(rawValue));
}

// Calculate effective eighths based on complexity
export function calculateEffectiveEighths(pageEighths: number, complexity: string): number {
  const normalizedEighths = normalizeEighths(pageEighths);
  const multiplier = COMPLEXITY_MULTIPLIERS[complexity?.toLowerCase()] || 1.0;
  return normalizedEighths * multiplier;
}

// ═══════════════════════════════════════════════════════════════════════
// CÁLCULO PROFESIONAL DE TIEMPO POR ESCENA
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calcular tiempo de rodaje por escena con desglose profesional
 * Fórmula: (Octavos × 11.25 min) × Multiplicador de Complejidad + Setup
 */
export function calculateSceneShootingTimeDetailed(scene: SceneForPlanning | any): SceneTimeBreakdown {
  // Determinar tipo INT/EXT
  const setType = scene.set_type || detectSetType(scene.title || '');
  const isNight = isNightScene(scene.time_of_day);
  
  // Calcular setup time
  let setupMinutes = setType === 'EXT' ? SETUP_TIMES.EXT : SETUP_TIMES.INT;
  if (isNight) setupMinutes += SETUP_TIMES.NIGHT_BONUS;
  
  // Usar setup precalculado si existe
  if (scene.setup_time_minutes) {
    setupMinutes = scene.setup_time_minutes;
  }
  
  // Calcular shooting time
  const eighths = scene.page_eighths || scene.effectiveEighths || 1;
  const normalizedEighths = normalizeEighths(eighths);
  
  // Determinar multiplicador de complejidad
  let complexityFactor = scene.complexity_factor || 1.0;
  if (!scene.complexity_factor) {
    const complexity = scene.scene_complexity?.toLowerCase() || 'media';
    complexityFactor = COMPLEXITY_MULTIPLIERS[complexity] || 1.2;
  }
  
  // Usar shooting time precalculado si existe
  let shootingMinutes = scene.shooting_time_minutes;
  if (!shootingMinutes) {
    shootingMinutes = Math.round(normalizedEighths * BASE_MINUTES_PER_EIGHTH * complexityFactor);
  }
  
  return {
    setupMinutes,
    shootingMinutes,
    totalMinutes: setupMinutes + shootingMinutes,
    complexityFactor,
  };
}

/**
 * Versión simplificada que devuelve horas (para compatibilidad)
 */
export function calculateSceneShootingTime(scene: SceneForPlanning | any): number {
  const breakdown = calculateSceneShootingTimeDetailed(scene);
  return breakdown.totalMinutes / 60;
}

// ═══════════════════════════════════════════════════════════════════════
// OPTIMIZACIÓN POR LOCALIZACIÓN COMPARTIDA
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calcular tiempo total del día con optimización por localización
 * Escenas consecutivas en la misma localización ahorran tiempo de setup
 */
export function calculateDayTimeWithLocationOptimization(scenes: SceneForPlanning[]): {
  totalHours: number;
  totalSetupMinutes: number;
  totalShootingMinutes: number;
  totalMinutes: number;
} {
  if (!scenes || scenes.length === 0) {
    return { totalHours: 0, totalSetupMinutes: 0, totalShootingMinutes: 0, totalMinutes: 0 };
  }
  
  let totalSetupMinutes = 0;
  let totalShootingMinutes = 0;
  let previousLocation: string | null = null;
  
  for (const scene of scenes) {
    const breakdown = calculateSceneShootingTimeDetailed(scene);
    const currentLocation = scene.location_name || 'UNKNOWN';
    
    // Si es la misma localización que la escena anterior, solo mini-setup
    if (previousLocation === currentLocation) {
      totalSetupMinutes += MINI_SETUP_MINUTES;
    } else {
      totalSetupMinutes += breakdown.setupMinutes;
    }
    
    totalShootingMinutes += breakdown.shootingMinutes;
    previousLocation = currentLocation;
  }
  
  const totalMinutes = totalSetupMinutes + totalShootingMinutes;
  
  return {
    totalHours: totalMinutes / 60,
    totalSetupMinutes,
    totalShootingMinutes,
    totalMinutes,
  };
}

/**
 * Recalcular tiempo total de un día (versión simplificada para compatibilidad)
 */
export function recalculateDayTime(scenes: (SceneForPlanning | any)[]): number {
  const result = calculateDayTimeWithLocationOptimization(scenes);
  return result.totalHours;
}

// Parse time of day from scene header
export function parseTimeOfDay(header: string): string {
  const headerUpper = header.toUpperCase();
  if (headerUpper.includes('NOCHE')) return 'NOCHE';
  if (headerUpper.includes('ATARDECER')) return 'ATARDECER';
  if (headerUpper.includes('AMANECER')) return 'AMANECER';
  return 'DÍA';
}

// Group scenes by location
function groupByLocation(scenes: SceneForPlanning[]): Map<string, SceneForPlanning[]> {
  const groups = new Map<string, SceneForPlanning[]>();
  
  for (const scene of scenes) {
    const key = scene.location_name || 'Sin localización';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(scene);
  }
  
  return groups;
}

// Group scenes by time of day
function groupByTimeOfDay(scenes: SceneForPlanning[]): Map<string, SceneForPlanning[]> {
  const groups = new Map<string, SceneForPlanning[]>();
  
  for (const scene of scenes) {
    const key = scene.time_of_day || 'DÍA';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(scene);
  }
  
  return groups;
}

// Group scenes by characters (proximity optimization)
function groupByCharacters(scenes: SceneForPlanning[]): Map<string, SceneForPlanning[]> {
  const groups = new Map<string, SceneForPlanning[]>();
  
  // Sort by main characters to group similar casts together
  const sortedScenes = [...scenes].sort((a, b) => {
    const aKey = a.characters.slice(0, 3).sort().join(',') || 'SIN PERSONAJES';
    const bKey = b.characters.slice(0, 3).sort().join(',') || 'SIN PERSONAJES';
    return aKey.localeCompare(bKey);
  });
  
  for (const scene of sortedScenes) {
    const mainChars = scene.characters.slice(0, 2).sort().join(' + ') || 'SIN PERSONAJES';
    if (!groups.has(mainChars)) {
      groups.set(mainChars, []);
    }
    groups.get(mainChars)!.push(scene);
  }
  
  return groups;
}

// Distribute scenes into days respecting the eighths limit
function distributeIntoDays(
  scenes: SceneForPlanning[],
  location: string,
  locationId: string | null,
  timeOfDay: string,
  maxEighthsPerDay: number,
  startingDayNumber: number
): ProposedShootingDay[] {
  const days: ProposedShootingDay[] = [];
  let currentDay: ProposedShootingDay | null = null;
  let dayNumber = startingDayNumber;
  
  // Sort scenes by sequence number
  const sortedScenes = [...scenes].sort((a, b) => a.sequence_number - b.sequence_number);
  
  for (const scene of sortedScenes) {
    // If no current day or adding this scene would exceed limit, create new day
    if (!currentDay || currentDay.totalEighths + scene.effectiveEighths > maxEighthsPerDay) {
      if (currentDay) {
        days.push(currentDay);
      }
      
      currentDay = {
        dayNumber: dayNumber++,
        location,
        locationId,
        timeOfDay,
        scenes: [],
        totalEighths: 0,
        estimatedHours: 0,
        characters: [],
        warnings: [],
      };
    }
    
    // Add scene to current day
    currentDay.scenes.push(scene);
    currentDay.totalEighths += scene.effectiveEighths;
    // Recalcular tiempo estimado basado en escenas individuales
    currentDay.estimatedHours = recalculateDayTime(currentDay.scenes);
    
    // Merge characters
    for (const char of scene.characters) {
      if (!currentDay.characters.includes(char)) {
        currentDay.characters.push(char);
      }
    }
  }
  
  // Don't forget the last day
  if (currentDay && currentDay.scenes.length > 0) {
    days.push(currentDay);
  }
  
  // Add warnings for days with issues
  for (const day of days) {
    if (day.totalEighths > maxEighthsPerDay) {
      day.warnings.push(`Día sobrecargado: ${day.totalEighths.toFixed(1)}/8 octavos`);
    }
    if (day.characters.length > 10) {
      day.warnings.push(`Muchos personajes: ${day.characters.length}`);
    }
  }
  
  return days;
}

// Group and distribute by LOCATION
function groupAndDistributeByLocation(
  scenes: SceneForPlanning[],
  options: PlanGenerationOptions
): ProposedShootingDay[] {
  const allDays: ProposedShootingDay[] = [];
  let dayNumber = 1;
  
  const locationGroups = groupByLocation(scenes);
  
  for (const [locationName, locationScenes] of locationGroups) {
    const locationId = locationScenes[0]?.location_id || null;
    
    if (options.separateDayNight) {
      const timeGroups = groupByTimeOfDay(locationScenes);
      const timeOrder = ['DÍA', 'AMANECER', 'ATARDECER', 'NOCHE'];
      
      for (const time of timeOrder) {
        const timeScenes = timeGroups.get(time);
        if (timeScenes && timeScenes.length > 0) {
          const days = distributeIntoDays(timeScenes, locationName, locationId, time, options.maxEighthsPerDay, dayNumber);
          for (const day of days) {
            day.dayNumber = dayNumber++;
            allDays.push(day);
          }
        }
      }
    } else {
      const days = distributeIntoDays(locationScenes, locationName, locationId, 'MIXTO', options.maxEighthsPerDay, dayNumber);
      for (const day of days) {
        day.dayNumber = dayNumber++;
        allDays.push(day);
      }
    }
  }
  
  return allDays;
}

// Group and distribute by TIME OF DAY first
function groupAndDistributeByTimeOfDay(
  scenes: SceneForPlanning[],
  options: PlanGenerationOptions
): ProposedShootingDay[] {
  const allDays: ProposedShootingDay[] = [];
  let dayNumber = 1;
  
  const timeGroups = groupByTimeOfDay(scenes);
  const timeOrder = ['DÍA', 'AMANECER', 'ATARDECER', 'NOCHE'];
  
  for (const time of timeOrder) {
    const timeScenes = timeGroups.get(time);
    if (!timeScenes || timeScenes.length === 0) continue;
    
    if (options.separateDayNight) {
      // Sub-group by location within each time period
      const locationGroups = groupByLocation(timeScenes);
      
      for (const [locationName, locScenes] of locationGroups) {
        const locationId = locScenes[0]?.location_id || null;
        const days = distributeIntoDays(locScenes, locationName, locationId, time, options.maxEighthsPerDay, dayNumber);
        for (const day of days) {
          day.dayNumber = dayNumber++;
          allDays.push(day);
        }
      }
    } else {
      // All scenes from this time period together
      const days = distributeIntoDays(timeScenes, 'VARIAS LOCALIZACIONES', null, time, options.maxEighthsPerDay, dayNumber);
      for (const day of days) {
        day.dayNumber = dayNumber++;
        allDays.push(day);
      }
    }
  }
  
  return allDays;
}

// Group and distribute by CHARACTERS (proximity)
function groupAndDistributeByCharacters(
  scenes: SceneForPlanning[],
  options: PlanGenerationOptions
): ProposedShootingDay[] {
  const allDays: ProposedShootingDay[] = [];
  let dayNumber = 1;
  
  const charGroups = groupByCharacters(scenes);
  
  for (const [charKey, charScenes] of charGroups) {
    if (options.separateDayNight) {
      const timeGroups = groupByTimeOfDay(charScenes);
      const timeOrder = ['DÍA', 'AMANECER', 'ATARDECER', 'NOCHE'];
      
      for (const time of timeOrder) {
        const timeScenes = timeGroups.get(time);
        if (timeScenes && timeScenes.length > 0) {
          const primaryLocation = timeScenes[0]?.location_name || 'VARIAS';
          const days = distributeIntoDays(timeScenes, primaryLocation, null, time, options.maxEighthsPerDay, dayNumber);
          for (const day of days) {
            day.dayNumber = dayNumber++;
            day.warnings.push(`Personajes: ${charKey}`);
            allDays.push(day);
          }
        }
      }
    } else {
      const primaryLocation = charScenes[0]?.location_name || 'VARIAS';
      const days = distributeIntoDays(charScenes, primaryLocation, null, 'MIXTO', options.maxEighthsPerDay, dayNumber);
      for (const day of days) {
        day.dayNumber = dayNumber++;
        day.warnings.push(`Personajes: ${charKey}`);
        allDays.push(day);
      }
    }
  }
  
  return allDays;
}

// Main function: Generate smart shooting plan
export function generateSmartShootingPlan(
  sequences: any[],
  locations: any[],
  options: PlanGenerationOptions
): ProposedShootingDay[] {
  console.log('[ShootingPlan] Generating plan with options:', options);
  
  // 1. Prepare scenes for planning
  const scenes: SceneForPlanning[] = sequences.map((seq) => {
    const locationMatch = locations.find(
      (loc) => seq.description?.toLowerCase().includes(loc.name.toLowerCase()) ||
               seq.title?.toLowerCase().includes(loc.name.toLowerCase())
    );
    
    const rawEighths = seq.page_eighths;
    const pageEighths = normalizeEighths(rawEighths);
    const complexity = seq.scene_complexity || 'media';
    
    return {
      id: seq.id,
      sequence_number: seq.sequence_number,
      title: seq.title || `Escena ${seq.sequence_number}`,
      description: seq.description || '',
      location_name: locationMatch?.name || extractLocationFromTitle(seq.title || ''),
      location_id: locationMatch?.id || null,
      time_of_day: seq.time_of_day || parseTimeOfDay(seq.title || ''),
      page_eighths: pageEighths,
      scene_complexity: complexity,
      characters: Array.isArray(seq.characters_in_scene) ? seq.characters_in_scene : [],
      effectiveEighths: calculateEffectiveEighths(pageEighths, complexity),
    };
  });
  
  console.log(`[ShootingPlan] Processing ${scenes.length} scenes with groupBy: ${options.groupBy}`);
  
  if (scenes.length === 0) {
    return [];
  }
  
  // 2. Generate days based on groupBy option
  let allDays: ProposedShootingDay[] = [];
  
  switch (options.groupBy) {
    case 'time_of_day':
      console.log('[ShootingPlan] Grouping by TIME OF DAY');
      allDays = groupAndDistributeByTimeOfDay(scenes, options);
      break;
      
    case 'proximity':
      console.log('[ShootingPlan] Grouping by CHARACTERS/PROXIMITY');
      allDays = groupAndDistributeByCharacters(scenes, options);
      break;
      
    case 'location':
    default:
      console.log('[ShootingPlan] Grouping by LOCATION');
      allDays = groupAndDistributeByLocation(scenes, options);
      break;
  }
  
  console.log(`[ShootingPlan] Generated ${allDays.length} shooting days`);
  
  return allDays;
}

// Extract location name from scene title (e.g., "INT. CASA DE CLARA — DÍA" -> "CASA DE CLARA")
function extractLocationFromTitle(title: string): string {
  // Remove INT./EXT. and time of day
  const cleaned = title
    .replace(/^(INT\.|EXT\.|INT\/EXT\.)\s*/i, '')
    .replace(/\s*[-—]\s*(DÍA|NOCHE|ATARDECER|AMANECER|CONTINUO|MÁS TARDE).*$/i, '')
    .trim();
  
  return cleaned || 'Sin localización';
}

// Save shooting plan to database
export async function saveShootingPlan(
  projectId: string,
  days: ProposedShootingDay[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, delete existing shooting days for this project
    const { error: deleteError } = await supabase
      .from('shooting_days')
      .delete()
      .eq('project_id', projectId);
    
    if (deleteError) throw deleteError;
    
    // Insert new days
    const shootingDaysData = days.map((day) => ({
      project_id: projectId,
      day_number: day.dayNumber,
      location_id: day.locationId,
      location_name: day.location,
      time_of_day: day.timeOfDay,
      sequences: day.scenes.map((s) => ({
        id: s.id,
        sequence_number: s.sequence_number,
        title: s.title,
        page_eighths: s.page_eighths,
        effectiveEighths: s.effectiveEighths,
      })),
      characters: day.characters,
      total_eighths: day.totalEighths,
      estimated_hours: day.estimatedHours,
      notes: day.warnings.length > 0 ? day.warnings.join('; ') : null,
    }));
    
    const { error: insertError } = await supabase
      .from('shooting_days')
      .insert(shootingDaysData);
    
    if (insertError) throw insertError;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error saving shooting plan:', error);
    return { success: false, error: error.message };
  }
}

// Load shooting plan from database
export async function loadShootingPlan(projectId: string): Promise<ProposedShootingDay[]> {
  const { data, error } = await supabase
    .from('shooting_days')
    .select('*')
    .eq('project_id', projectId)
    .order('day_number', { ascending: true });
  
  if (error) {
    console.error('Error loading shooting plan:', error);
    return [];
  }
  
  return (data || []).map((row) => ({
    dayNumber: row.day_number,
    location: row.location_name || '',
    locationId: row.location_id,
    timeOfDay: row.time_of_day || 'DÍA',
    scenes: (row.sequences as any[]) || [],
    totalEighths: Number(row.total_eighths) || 0,
    estimatedHours: Number(row.estimated_hours) || 0,
    characters: (row.characters as string[]) || [],
    warnings: row.notes ? row.notes.split('; ') : [],
  }));
}

// Calculate total statistics
export function calculatePlanStats(days: ProposedShootingDay[]) {
  const totalScenes = days.reduce((sum, day) => sum + day.scenes.length, 0);
  const totalEighths = days.reduce((sum, day) => sum + day.totalEighths, 0);
  const totalDays = days.length;
  const uniqueLocations = new Set(days.map((d) => d.location)).size;
  const nightDays = days.filter((d) => d.timeOfDay === 'NOCHE').length;
  const allCharacters = new Set(days.flatMap((d) => d.characters));
  
  return {
    totalScenes,
    totalEighths,
    totalDays,
    uniqueLocations,
    nightDays,
    dayDays: totalDays - nightDays,
    totalCharacters: allCharacters.size,
    avgEighthsPerDay: totalDays > 0 ? totalEighths / totalDays : 0,
  };
}
