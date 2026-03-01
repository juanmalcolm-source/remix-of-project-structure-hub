// Shooting Plan Service - Intelligent scheduling using the Law of Eighths
// Implements professional 1st AD time estimation formulas

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// ═══════════════════════════════════════════════════════════════════════
// FÓRMULA PROFESIONAL DE TIEMPO DE RODAJE (PRD v3.0)
// ═══════════════════════════════════════════════════════════════════════

// PRD v3: Rodaje base = octavos × 8 × 13min (= 104 min/página)
const BASE_MINUTES_PER_EIGHTH = 13; // 13 min/octavo

// PRD v3: Tiempos de setup
const SETUP_TIMES = {
  INT: 30,  // Interior: 30 min setup
  EXT: 45,  // Exterior: 45 min setup
  NIGHT_BONUS: 15, // Bonus nocturno: +15 min
};

// PRD v3: Transición base entre escenas
const TRANSITION_BASE_MINUTES = 5;

// Multiplicadores de complejidad (legacy, para compatibilidad)
const COMPLEXITY_MULTIPLIERS: Record<string, number> = {
  bajo: 1.0,
  media: 1.2,
  alto: 2.0,
  extremo: 3.0,
  baja: 1.0,
  alta: 2.0,
};

// PRD v3: 15 pesos de complejidad (minutos extra)
const COMPLEXITY_WEIGHTS: Record<string, number> = {
  movimiento_camara: 15,
  accion_fisica: 20,
  stunts: 40,
  efectos_especiales: 30,
  ninos: 15,
  animales: 25,
  vehiculos_movimiento: 30,
  iluminacion_compleja: 20,
  escena_noche: 10,
  exteriores_clima: 8,
  dialogo_extenso: 10,
  requiere_grua: 20,
  planos_especiales: 15,
  // num_personajes > 2: +5min/personaje extra (handled in code)
  // num_extras: +5min por cada 5 extras (handled in code)
};

// Mini-setup para escenas en misma localización (reposición de cámara)
const MINI_SETUP_MINUTES = 10;

// Jornada laboral
export const WARNING_WORKDAY_HOURS = 10;
export const MAX_WORKDAY_HOURS = 12;
export const MAX_WORKDAY_MINUTES = MAX_WORKDAY_HOURS * 60;

// PRD v3: Restricciones laborales
export const RESTRICTIONS = {
  REST_BETWEEN_SHIFTS_HOURS: 12,
  MAX_CONSECUTIVE_NIGHTS: 5,
  WARN_CONSECUTIVE_NIGHTS: 3,
  REST_DAY_EVERY: 6,
  MAX_ACTOR_WAIT_DAYS: 7,
  CHILDREN_MAX_HOURS: 8,
  CHILDREN_NO_NIGHT: true,
};

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
  // Campos de complejidad (PRD v3 — 15 factores)
  complejidad_factores?: Record<string, boolean | number> | null;
  int_ext?: string | null;
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
  locations: string[];           // Array de localizaciones
  location: string;              // Localización principal (para compatibilidad)
  locationId: string | null;
  timeOfDay: string;
  scenes: SceneForPlanning[];
  totalEighths: number;
  estimatedHours: number;
  targetHours: number;           // Objetivo de horas (ej. 10h)
  remainingHours: number;        // Horas restantes/sobrantes
  characters: string[];
  warnings: string[];
  // Campos de tiempo desglosados
  totalSetupMinutes?: number;
  totalShootingMinutes?: number;
  totalMinutes?: number;
  // Campos profesionales (prompt mejorado v2)
  companyMoves?: number;
  mealBreakAfterScene?: number;
  coverSets?: { sceneId: string; title: string; reason: string }[];
  specialEquipment?: string[];
  callTimeNotes?: string;
  weatherRisk?: 'bajo' | 'medio' | 'alto';
  notes?: string;
}

export interface PlanGenerationOptions {
  groupBy: 'location' | 'time_of_day' | 'proximity' | 'zone' | 'balanced';
  maxEighthsPerDay: number;
  separateDayNight: boolean;
  optimizeByProximity: boolean;
  targetHoursPerDay?: number;
  // Datos de zona/distancia para optimización geográfica
  locationZones?: Map<string, string>; // location_id -> zone
  distanceMatrix?: Map<string, { distance_km: number; duration_minutes: number }>; // "fromId-toId" -> distance
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
 * Calcular tiempo extra por factores de complejidad (PRD v3: 15 factores)
 */
function calculateComplexityExtraMinutes(scene: SceneForPlanning): number {
  const factores = scene.complejidad_factores;
  if (!factores || typeof factores !== 'object') return 0;

  let extra = 0;

  // Boolean factors
  for (const [key, weight] of Object.entries(COMPLEXITY_WEIGHTS)) {
    if (factores[key] === true) {
      extra += weight;
    }
  }

  // num_personajes > 2: +5min/personaje extra
  const numPersonajes = Number(factores.num_personajes) || 0;
  if (numPersonajes > 2) {
    extra += (numPersonajes - 2) * 5;
  }

  // num_extras: +5min por cada 5 extras
  const numExtras = Number(factores.num_extras) || 0;
  extra += Math.floor(numExtras / 5) * 5;

  return extra;
}

/**
 * Calcular cobertura extra (PRD v3)
 * +50% del rodaje base si acción/stunts, +30% si diálogo extenso
 */
function calculateCoverageMinutes(scene: SceneForPlanning, baseShootingMinutes: number): number {
  const factores = scene.complejidad_factores;
  if (!factores || typeof factores !== 'object') return 0;

  if (factores.accion_fisica || factores.stunts) {
    return Math.round(baseShootingMinutes * 0.5);
  }
  if (factores.dialogo_extenso) {
    return Math.round(baseShootingMinutes * 0.3);
  }
  return 0;
}

/**
 * Calcular tiempo de rodaje por escena con desglose profesional (PRD v3)
 * Setup: 30min (INT) o 45min (EXT), +15 si NOCHE
 * Rodaje: octavos × 13min
 * Cobertura: +50% si acción/stunts, +30% si diálogo extenso
 * Complejidad: 15 factores con pesos específicos
 * Transición: 5min base
 */
export function calculateSceneShootingTimeDetailed(scene: SceneForPlanning): SceneTimeBreakdown {
  // Determinar tipo INT/EXT
  const setType = scene.set_type || scene.int_ext || detectSetType(scene.title || '');
  const isNight = isNightScene(scene.time_of_day);
  
  // PRD v3: Setup = 30min (INT) o 45min (EXT), +15 si NOCHE
  let setupMinutes = setType === 'EXT' ? SETUP_TIMES.EXT : SETUP_TIMES.INT;
  if (isNight) setupMinutes += SETUP_TIMES.NIGHT_BONUS;
  
  // Usar setup precalculado si existe
  if (scene.setup_time_minutes) {
    setupMinutes = scene.setup_time_minutes;
  }
  
  // PRD v3: Rodaje = octavos × 13min
  const eighths = scene.page_eighths || scene.effectiveEighths || 1;
  const normalizedEighths = normalizeEighths(eighths);
  
  let shootingMinutes = scene.shooting_time_minutes;
  if (!shootingMinutes) {
    shootingMinutes = Math.round(normalizedEighths * BASE_MINUTES_PER_EIGHTH);
  }

  // PRD v3: Cobertura extra
  const coverageMinutes = calculateCoverageMinutes(scene, shootingMinutes);

  // PRD v3: Tiempo extra por 15 factores de complejidad
  const complexityExtraMinutes = calculateComplexityExtraMinutes(scene);

  // PRD v3: Transición base
  const transitionMinutes = TRANSITION_BASE_MINUTES;

  // Determinar multiplicador de complejidad (legacy compatibility)
  let complexityFactor = scene.complexity_factor || 1.0;
  if (!scene.complexity_factor) {
    const complexity = scene.scene_complexity?.toLowerCase() || 'media';
    complexityFactor = COMPLEXITY_MULTIPLIERS[complexity] || 1.2;
  }
  
  const totalShootingWithExtras = shootingMinutes + coverageMinutes + complexityExtraMinutes + transitionMinutes;
  
  return {
    setupMinutes,
    shootingMinutes: totalShootingWithExtras,
    totalMinutes: setupMinutes + totalShootingWithExtras,
    complexityFactor,
  };
}

/**
 * Versión simplificada que devuelve horas (para compatibilidad)
 */
export function calculateSceneShootingTime(scene: SceneForPlanning): number {
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
export function recalculateDayTime(scenes: SceneForPlanning[]): number {
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

// Distribute scenes into days respecting TIME limit (not just eighths)
function distributeIntoDaysFlexible(
  scenes: SceneForPlanning[],
  options: PlanGenerationOptions,
  startingDayNumber: number
): ProposedShootingDay[] {
  const days: ProposedShootingDay[] = [];
  const targetHours = options.targetHoursPerDay || 10;
  const targetMinutes = targetHours * 60;
  let dayNumber = startingDayNumber;
  
  // Sort scenes by sequence number
  const sortedScenes = [...scenes].sort((a, b) => a.sequence_number - b.sequence_number);
  const remainingScenes = [...sortedScenes];
  
  while (remainingScenes.length > 0) {
    const dayScenes: SceneForPlanning[] = [];
    let currentMinutes = 0;
    let previousLocation: string | null = null;
    
    // Fill day until we reach target time
    while (remainingScenes.length > 0) {
      const candidateScene = remainingScenes[0];
      const sceneBreakdown = calculateSceneShootingTimeDetailed(candidateScene);
      
      // Calculate effective time (considering location optimization)
      let sceneMinutes = sceneBreakdown.shootingMinutes;
      if (previousLocation === candidateScene.location_name) {
        sceneMinutes += MINI_SETUP_MINUTES; // Same location = mini setup
      } else {
        sceneMinutes += sceneBreakdown.setupMinutes; // New location = full setup
      }
      
      // Check if this scene fits in the day
      if (currentMinutes + sceneMinutes > targetMinutes && dayScenes.length > 0) {
        break; // Day is full
      }
      
      // Add scene to day
      const scene = remainingScenes.shift()!;
      dayScenes.push(scene);
      currentMinutes += sceneMinutes;
      previousLocation = scene.location_name;
    }
    
    // Create day with multiple locations
    const dayLocations = [...new Set(dayScenes.map(s => s.location_name))];
    const primaryLocation = dayLocations[0] || 'Sin localización';
    const allCharacters = [...new Set(dayScenes.flatMap(s => s.characters || []))];
    const totalEighths = dayScenes.reduce((sum, s) => sum + (s.effectiveEighths || s.page_eighths || 1), 0);
    const dayTimeResult = calculateDayTimeWithLocationOptimization(dayScenes);
    const estimatedHours = dayTimeResult.totalHours;
    
    const newDay: ProposedShootingDay = {
      dayNumber: dayNumber++,
      locations: dayLocations,
      location: dayLocations.length > 1 ? `${primaryLocation} + ${dayLocations.length - 1} más` : primaryLocation,
      locationId: dayScenes[0]?.location_id || null,
      timeOfDay: getMostCommonTimeOfDay(dayScenes),
      scenes: dayScenes,
      totalEighths,
      estimatedHours,
      targetHours,
      remainingHours: targetHours - estimatedHours,
      characters: allCharacters,
      warnings: [],
      totalSetupMinutes: dayTimeResult.totalSetupMinutes,
      totalShootingMinutes: dayTimeResult.totalShootingMinutes,
      totalMinutes: dayTimeResult.totalMinutes,
    };
    
    // Add warnings (PRD v3)
    if (estimatedHours > MAX_WORKDAY_HOURS) {
      newDay.warnings.push(`🔴 Jornada de ${estimatedHours.toFixed(1)}h excede máximo ${MAX_WORKDAY_HOURS}h`);
    } else if (estimatedHours > WARNING_WORKDAY_HOURS) {
      newDay.warnings.push(`⚠️ Jornada de ${estimatedHours.toFixed(1)}h supera las ${WARNING_WORKDAY_HOURS}h recomendadas`);
    }
    if (allCharacters.length > 10) {
      newDay.warnings.push(`Muchos personajes: ${allCharacters.length}`);
    }
    if (dayLocations.length > 3) {
      newDay.warnings.push(`${dayLocations.length} localizaciones en un día`);
    }
    
    days.push(newDay);
  }
  
  // PRD v3: Add cross-day restriction warnings
  addCrossDayWarnings(days);
  
  return days;
}

/**
 * PRD v3: Validar restricciones que afectan a múltiples días
 */
function addCrossDayWarnings(days: ProposedShootingDay[]): void {
  let consecutiveNights = 0;
  let consecutiveWorkDays = 0;

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const isNight = day.timeOfDay?.toUpperCase().includes('NOCHE');

    // Max 5 noches consecutivas
    if (isNight) {
      consecutiveNights++;
      if (consecutiveNights >= RESTRICTIONS.MAX_CONSECUTIVE_NIGHTS) {
        day.warnings.push(`🔴 ${consecutiveNights} noches consecutivas (máx ${RESTRICTIONS.MAX_CONSECUTIVE_NIGHTS})`);
      } else if (consecutiveNights >= RESTRICTIONS.WARN_CONSECUTIVE_NIGHTS) {
        day.warnings.push(`⚠️ ${consecutiveNights} noches consecutivas`);
      }
    } else {
      consecutiveNights = 0;
    }

    // 1 día descanso cada 6
    consecutiveWorkDays++;
    if (consecutiveWorkDays >= RESTRICTIONS.REST_DAY_EVERY) {
      day.warnings.push(`⚠️ ${consecutiveWorkDays} días sin descanso (recomendado: 1 cada ${RESTRICTIONS.REST_DAY_EVERY})`);
      // Don't reset - keeps warning until plan is adjusted
    }

    // Niños: max 8h, no noche
    if (RESTRICTIONS.CHILDREN_NO_NIGHT && isNight) {
      const hasChildren = day.scenes.some((s) => {
        const f = s.complejidad_factores;
        return f && f.ninos === true;
      });
      if (hasChildren) {
        day.warnings.push('🔴 Niños en escena nocturna (prohibido)');
      }
    }

    // Niños: max 8h
    const hasChildrenInDay = day.scenes.some((s) => {
      const f = s.complejidad_factores;
      return f && f.ninos === true;
    });
    if (hasChildrenInDay && day.estimatedHours > RESTRICTIONS.CHILDREN_MAX_HOURS) {
      day.warnings.push(`🔴 Niños en jornada de ${day.estimatedHours.toFixed(1)}h (máx ${RESTRICTIONS.CHILDREN_MAX_HOURS}h)`);
    }
  }

  // Actor wait days check
  checkActorWaitDays(days);
}

/**
 * PRD v3: Verificar que ningún actor espera más de 7 días entre apariciones
 */
function checkActorWaitDays(days: ProposedShootingDay[]): void {
  const actorLastDay = new Map<string, number>();
  
  for (const day of days) {
    for (const char of day.characters) {
      const lastDay = actorLastDay.get(char);
      if (lastDay !== undefined) {
        const waitDays = day.dayNumber - lastDay - 1;
        if (waitDays > RESTRICTIONS.MAX_ACTOR_WAIT_DAYS) {
          day.warnings.push(`⚠️ ${char}: ${waitDays} días de espera (máx ${RESTRICTIONS.MAX_ACTOR_WAIT_DAYS})`);
        }
      }
      actorLastDay.set(char, day.dayNumber);
    }
  }
}

// Helper to get most common time of day
function getMostCommonTimeOfDay(scenes: SceneForPlanning[]): string {
  const counts: Record<string, number> = {};
  for (const scene of scenes) {
    const tod = scene.time_of_day || 'DÍA';
    counts[tod] = (counts[tod] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || 'DÍA';
}

// LEGACY: Distribute scenes into days respecting the eighths limit (for compatibility)
function distributeIntoDays(
  scenes: SceneForPlanning[],
  location: string,
  locationId: string | null,
  timeOfDay: string,
  maxEighthsPerDay: number,
  startingDayNumber: number,
  targetHoursPerDay: number = 10
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
        // Update remaining hours before pushing
        const timeResult = calculateDayTimeWithLocationOptimization(currentDay.scenes);
        currentDay.estimatedHours = timeResult.totalHours;
        currentDay.remainingHours = currentDay.targetHours - timeResult.totalHours;
        currentDay.totalSetupMinutes = timeResult.totalSetupMinutes;
        currentDay.totalShootingMinutes = timeResult.totalShootingMinutes;
        currentDay.totalMinutes = timeResult.totalMinutes;
        currentDay.locations = [...new Set(currentDay.scenes.map(s => s.location_name))];
        days.push(currentDay);
      }
      
      currentDay = {
        dayNumber: dayNumber++,
        locations: [location],
        location,
        locationId,
        timeOfDay,
        scenes: [],
        totalEighths: 0,
        estimatedHours: 0,
        targetHours: targetHoursPerDay,
        remainingHours: targetHoursPerDay,
        characters: [],
        warnings: [],
      };
    }
    
    // Add scene to current day
    currentDay.scenes.push(scene);
    currentDay.totalEighths += scene.effectiveEighths;
    
    // Update locations array
    if (!currentDay.locations.includes(scene.location_name)) {
      currentDay.locations.push(scene.location_name);
      if (currentDay.locations.length > 1) {
        currentDay.location = `${currentDay.locations[0]} + ${currentDay.locations.length - 1} más`;
      }
    }
    
    // Recalcular tiempo estimado basado en escenas individuales
    const timeResult = calculateDayTimeWithLocationOptimization(currentDay.scenes);
    currentDay.estimatedHours = timeResult.totalHours;
    currentDay.remainingHours = currentDay.targetHours - timeResult.totalHours;
    
    // Merge characters
    for (const char of scene.characters) {
      if (!currentDay.characters.includes(char)) {
        currentDay.characters.push(char);
      }
    }
  }
  
  // Don't forget the last day
  if (currentDay && currentDay.scenes.length > 0) {
    const timeResult = calculateDayTimeWithLocationOptimization(currentDay.scenes);
    currentDay.estimatedHours = timeResult.totalHours;
    currentDay.remainingHours = currentDay.targetHours - timeResult.totalHours;
    currentDay.totalSetupMinutes = timeResult.totalSetupMinutes;
    currentDay.totalShootingMinutes = timeResult.totalShootingMinutes;
    currentDay.totalMinutes = timeResult.totalMinutes;
    currentDay.locations = [...new Set(currentDay.scenes.map(s => s.location_name))];
    days.push(currentDay);
  }
  
  // Add warnings for days with issues (PRD v3)
  for (const day of days) {
    if (day.totalEighths > maxEighthsPerDay) {
      day.warnings.push(`Día sobrecargado: ${day.totalEighths.toFixed(1)}/8 octavos`);
    }
    if (day.estimatedHours > MAX_WORKDAY_HOURS) {
      day.warnings.push(`🔴 Jornada de ${day.estimatedHours.toFixed(1)}h excede máximo ${MAX_WORKDAY_HOURS}h`);
    } else if (day.estimatedHours > WARNING_WORKDAY_HOURS) {
      day.warnings.push(`⚠️ Jornada de ${day.estimatedHours.toFixed(1)}h supera las ${WARNING_WORKDAY_HOURS}h recomendadas`);
    }
    if (day.characters.length > 10) {
      day.warnings.push(`Muchos personajes: ${day.characters.length}`);
    }
  }
  
  return days;
}

// Group and distribute by LOCATION (mejorado: permite múltiples localizaciones por día)
function groupAndDistributeByLocation(
  scenes: SceneForPlanning[],
  options: PlanGenerationOptions
): ProposedShootingDay[] {
  const targetHours = options.targetHoursPerDay || 10;
  
  // Sort scenes by location first, then by time of day, then by sequence
  const sortedScenes = [...scenes].sort((a, b) => {
    // Primary sort: location
    const locCompare = a.location_name.localeCompare(b.location_name);
    if (locCompare !== 0) return locCompare;
    
    // Secondary: time of day (DÍA first)
    if (options.separateDayNight) {
      const timeOrder: Record<string, number> = { 'DÍA': 0, 'AMANECER': 1, 'ATARDECER': 2, 'NOCHE': 3 };
      const timeA = timeOrder[a.time_of_day] ?? 0;
      const timeB = timeOrder[b.time_of_day] ?? 0;
      if (timeA !== timeB) return timeA - timeB;
    }
    
    // Tertiary: sequence number
    return a.sequence_number - b.sequence_number;
  });
  
  // Use flexible distribution that respects time limits
  return distributeIntoDaysFlexible(sortedScenes, { ...options, targetHoursPerDay: targetHours }, 1);
}

// Group and distribute by TIME OF DAY first (mejorado: permite múltiples localizaciones)
function groupAndDistributeByTimeOfDay(
  scenes: SceneForPlanning[],
  options: PlanGenerationOptions
): ProposedShootingDay[] {
  const targetHours = options.targetHoursPerDay || 10;
  
  // Sort by time of day first, then by location, then by sequence
  const sortedScenes = [...scenes].sort((a, b) => {
    // Primary: time of day (DÍA first, NOCHE last)
    const timeOrder: Record<string, number> = { 'DÍA': 0, 'AMANECER': 1, 'ATARDECER': 2, 'NOCHE': 3 };
    const timeA = timeOrder[a.time_of_day] ?? 0;
    const timeB = timeOrder[b.time_of_day] ?? 0;
    if (timeA !== timeB) return timeA - timeB;
    
    // Secondary: location (to group same locations together)
    const locCompare = a.location_name.localeCompare(b.location_name);
    if (locCompare !== 0) return locCompare;
    
    // Tertiary: sequence number
    return a.sequence_number - b.sequence_number;
  });
  
  return distributeIntoDaysFlexible(sortedScenes, { ...options, targetHoursPerDay: targetHours }, 1);
}

// Group and distribute by CHARACTERS (proximity) - mejorado
function groupAndDistributeByCharacters(
  scenes: SceneForPlanning[],
  options: PlanGenerationOptions
): ProposedShootingDay[] {
  const targetHours = options.targetHoursPerDay || 10;
  
  // Sort by main characters (first 2), then by time of day, then by sequence
  const sortedScenes = [...scenes].sort((a, b) => {
    // Primary: main characters
    const aChars = (a.characters || []).slice(0, 2).sort().join(',');
    const bChars = (b.characters || []).slice(0, 2).sort().join(',');
    const charCompare = aChars.localeCompare(bChars);
    if (charCompare !== 0) return charCompare;
    
    // Secondary: time of day
    if (options.separateDayNight) {
      const timeOrder: Record<string, number> = { 'DÍA': 0, 'AMANECER': 1, 'ATARDECER': 2, 'NOCHE': 3 };
      const timeA = timeOrder[a.time_of_day] ?? 0;
      const timeB = timeOrder[b.time_of_day] ?? 0;
      if (timeA !== timeB) return timeA - timeB;
    }
    
    // Tertiary: sequence number
    return a.sequence_number - b.sequence_number;
  });
  
  return distributeIntoDaysFlexible(sortedScenes, { ...options, targetHoursPerDay: targetHours }, 1);
}

// ═══════════════════════════════════════════════════════════════════════
// AGRUPACIÓN POR ZONA GEOGRÁFICA (NUEVO)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Group and distribute by GEOGRAPHIC ZONE
 * Uses location zones and distance matrix for optimal grouping
 */
function groupAndDistributeByZone(
  scenes: SceneForPlanning[],
  locations: Tables<'locations'>[],
  options: PlanGenerationOptions
): ProposedShootingDay[] {
  const targetHours = options.targetHoursPerDay || 10;
  const locationZones = options.locationZones || new Map<string, string>();
  const distanceMatrix = options.distanceMatrix || new Map<string, { distance_km: number; duration_minutes: number }>();
  
  // Create a map of location name to zone
  const locationNameToZone = new Map<string, string>();
  for (const loc of locations) {
    if (loc.zone) {
      locationNameToZone.set(loc.name.toLowerCase(), loc.zone);
    }
    if (loc.id && locationZones.has(loc.id)) {
      locationNameToZone.set(loc.name.toLowerCase(), locationZones.get(loc.id)!);
    }
  }
  
  // Sort scenes by zone first, then by location within zone, then by time of day
  const sortedScenes = [...scenes].sort((a, b) => {
    // Primary sort: zone
    const zoneA = locationNameToZone.get(a.location_name.toLowerCase()) || 'zzz-sin-zona';
    const zoneB = locationNameToZone.get(b.location_name.toLowerCase()) || 'zzz-sin-zona';
    const zoneCompare = zoneA.localeCompare(zoneB);
    if (zoneCompare !== 0) return zoneCompare;
    
    // Secondary: location within same zone
    const locCompare = a.location_name.localeCompare(b.location_name);
    if (locCompare !== 0) return locCompare;
    
    // Tertiary: time of day (DÍA first)
    if (options.separateDayNight) {
      const timeOrder: Record<string, number> = { 'DÍA': 0, 'AMANECER': 1, 'ATARDECER': 2, 'NOCHE': 3 };
      const timeA = timeOrder[a.time_of_day] ?? 0;
      const timeB = timeOrder[b.time_of_day] ?? 0;
      if (timeA !== timeB) return timeA - timeB;
    }
    
    // Quaternary: sequence number
    return a.sequence_number - b.sequence_number;
  });
  
  // Distribute into days with zone-aware optimization
  const days = distributeIntoDaysFlexibleWithZones(sortedScenes, options, locationNameToZone, distanceMatrix, 1);
  
  // Add zone information to warnings/notes
  for (const day of days) {
    const dayZones = new Set<string>();
    for (const scene of day.scenes) {
      const zone = locationNameToZone.get(scene.location_name.toLowerCase());
      if (zone) dayZones.add(zone);
    }
    if (dayZones.size > 1) {
      day.warnings.push(`${dayZones.size} zonas: desplazamientos`);
    }
  }
  
  return days;
}

/**
 * Distribute scenes with zone-aware optimization
 * Adds travel time between different zones/locations
 */
function distributeIntoDaysFlexibleWithZones(
  scenes: SceneForPlanning[],
  options: PlanGenerationOptions,
  locationZones: Map<string, string>,
  distanceMatrix: Map<string, { distance_km: number; duration_minutes: number }>,
  startingDayNumber: number
): ProposedShootingDay[] {
  const days: ProposedShootingDay[] = [];
  const targetHours = options.targetHoursPerDay || 10;
  const targetMinutes = targetHours * 60;
  let dayNumber = startingDayNumber;
  
  const remainingScenes = [...scenes];
  
  // Average travel time between different zones (in minutes)
  const INTER_ZONE_TRAVEL_MINUTES = 45;
  const INTRA_ZONE_TRAVEL_MINUTES = 15;
  
  while (remainingScenes.length > 0) {
    const dayScenes: SceneForPlanning[] = [];
    let currentMinutes = 0;
    let previousLocation: string | null = null;
    let previousZone: string | null = null;
    
    while (remainingScenes.length > 0) {
      const candidateScene = remainingScenes[0];
      const sceneBreakdown = calculateSceneShootingTimeDetailed(candidateScene);
      
      const currentZone = locationZones.get(candidateScene.location_name.toLowerCase()) || null;
      
      // Calculate effective time (considering location and zone)
      let sceneMinutes = sceneBreakdown.shootingMinutes;
      
      if (previousLocation === candidateScene.location_name) {
        // Same location = mini setup
        sceneMinutes += MINI_SETUP_MINUTES;
      } else {
        // Different location = full setup
        sceneMinutes += sceneBreakdown.setupMinutes;
        
        // Add travel time if changing zones or locations
        if (previousZone && currentZone && previousZone !== currentZone) {
          sceneMinutes += INTER_ZONE_TRAVEL_MINUTES;
        } else if (previousLocation && previousLocation !== candidateScene.location_name) {
          sceneMinutes += INTRA_ZONE_TRAVEL_MINUTES;
        }
      }
      
      // Check if this scene fits in the day
      if (currentMinutes + sceneMinutes > targetMinutes && dayScenes.length > 0) {
        break; // Day is full
      }
      
      // Add scene to day
      const scene = remainingScenes.shift()!;
      dayScenes.push(scene);
      currentMinutes += sceneMinutes;
      previousLocation = scene.location_name;
      previousZone = currentZone;
    }
    
    // Create day
    const dayLocations = [...new Set(dayScenes.map(s => s.location_name))];
    const primaryLocation = dayLocations[0] || 'Sin localización';
    const allCharacters = [...new Set(dayScenes.flatMap(s => s.characters || []))];
    const totalEighths = dayScenes.reduce((sum, s) => sum + (s.effectiveEighths || s.page_eighths || 1), 0);
    const dayTimeResult = calculateDayTimeWithLocationOptimization(dayScenes);
    const estimatedHours = currentMinutes / 60;
    
    const newDay: ProposedShootingDay = {
      dayNumber: dayNumber++,
      locations: dayLocations,
      location: dayLocations.length > 1 ? `${primaryLocation} + ${dayLocations.length - 1} más` : primaryLocation,
      locationId: dayScenes[0]?.location_id || null,
      timeOfDay: getMostCommonTimeOfDay(dayScenes),
      scenes: dayScenes,
      totalEighths,
      estimatedHours,
      targetHours,
      remainingHours: targetHours - estimatedHours,
      characters: allCharacters,
      warnings: [],
      totalSetupMinutes: dayTimeResult.totalSetupMinutes,
      totalShootingMinutes: dayTimeResult.totalShootingMinutes,
      totalMinutes: currentMinutes,
    };
    
    // Add warnings (PRD v3)
    if (estimatedHours > MAX_WORKDAY_HOURS) {
      newDay.warnings.push(`🔴 Jornada de ${estimatedHours.toFixed(1)}h excede máximo ${MAX_WORKDAY_HOURS}h`);
    } else if (estimatedHours > WARNING_WORKDAY_HOURS) {
      newDay.warnings.push(`⚠️ Jornada de ${estimatedHours.toFixed(1)}h supera las ${WARNING_WORKDAY_HOURS}h recomendadas`);
    }
    if (allCharacters.length > 10) {
      newDay.warnings.push(`Muchos personajes: ${allCharacters.length}`);
    }
    if (dayLocations.length > 3) {
      newDay.warnings.push(`${dayLocations.length} localizaciones en un día`);
    }
    
    days.push(newDay);
  }
  
  return days;
}

// Main function: Generate smart shooting plan
export function generateSmartShootingPlan(
  sequences: Tables<'sequences'>[],
  locations: Tables<'locations'>[],
  options: PlanGenerationOptions
): ProposedShootingDay[] {
  console.log('[ShootingPlan] Generating plan with options:', options);
  
  // 1. Prepare scenes for planning
  const scenes: SceneForPlanning[] = sequences.map((seq) => {
    // Match location: FK first (location_id), then fallback to substring match
    const locationMatch = locations.find(
      (loc) => (seq.location_id && loc.id === seq.location_id) ||
               seq.description?.toLowerCase().includes(loc.name.toLowerCase()) ||
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
      characters: Array.isArray(seq.characters_in_scene) ? seq.characters_in_scene as string[] : [],
      effectiveEighths: calculateEffectiveEighths(pageEighths, complexity),
      complejidad_factores: seq.complejidad_factores as Record<string, boolean | number> | null,
      int_ext: seq.int_ext,
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
    
    case 'zone':
      console.log('[ShootingPlan] Grouping by GEOGRAPHIC ZONE');
      allDays = groupAndDistributeByZone(scenes, locations, options);
      break;

    case 'balanced':
      console.log('[ShootingPlan] Grouping BALANCED (multi-criteria)');
      // Balanced: sort by location first, then by characters within location, then time_of_day
      {
        const sortedScenes = [...scenes].sort((a, b) => {
          const locCompare = a.location_name.localeCompare(b.location_name);
          if (locCompare !== 0) return locCompare;
          const aChars = (a.characters || []).slice(0, 2).sort().join(',');
          const bChars = (b.characters || []).slice(0, 2).sort().join(',');
          const charCompare = aChars.localeCompare(bChars);
          if (charCompare !== 0) return charCompare;
          if (options.separateDayNight) {
            const timeOrder: Record<string, number> = { 'DÍA': 0, 'AMANECER': 1, 'ATARDECER': 2, 'NOCHE': 3 };
            const timeA = timeOrder[a.time_of_day] ?? 0;
            const timeB = timeOrder[b.time_of_day] ?? 0;
            if (timeA !== timeB) return timeA - timeB;
          }
          return a.sequence_number - b.sequence_number;
        });
        allDays = distributeIntoDaysFlexible(sortedScenes, options, 1);
      }
      break;
      
    case 'location':
    default:
      console.log('[ShootingPlan] Grouping by LOCATION');
      allDays = groupAndDistributeByLocation(scenes, options);
      break;
  }
  
  // PRD v3: Apply cross-day restriction warnings to all strategies
  addCrossDayWarnings(allDays);
  
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
        complejidad_factores: s.complejidad_factores ?? null,
        int_ext: s.int_ext ?? null,
        location_name: s.location_name,
        time_of_day: s.time_of_day,
        scene_complexity: s.scene_complexity,
        characters: s.characters,
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
  } catch (error: unknown) {
    console.error('Error saving shooting plan:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
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
  
  return (data || []).map((row) => {
    const scenes = (row.sequences as SceneForPlanning[]) || [];
    const estimatedHours = Number(row.estimated_hours) || 0;
    const targetHours = 10; // Default target

    // Extract unique locations from scenes
    const sceneLocations = scenes.map((s) => s.location_name).filter(Boolean);
    const uniqueLocations = [...new Set(sceneLocations)];
    const locations = uniqueLocations.length > 0 ? uniqueLocations : [row.location_name || 'Sin localización'];
    
    return {
      dayNumber: row.day_number,
      locations: locations as string[],
      location: row.location_name || '',
      locationId: row.location_id,
      timeOfDay: row.time_of_day || 'DÍA',
      scenes,
      totalEighths: Number(row.total_eighths) || 0,
      estimatedHours,
      targetHours,
      remainingHours: targetHours - estimatedHours,
      characters: (row.characters as string[]) || [],
      warnings: row.notes ? row.notes.split('; ') : [],
    };
  });
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
