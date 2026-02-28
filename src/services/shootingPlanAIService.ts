// AI Shooting Plan Service — Generates optimized shooting schedules using Claude
// Follows the same SSE pattern as budgetEstimator.ts

import { readSSEStream } from './budgetEstimator';
import {
  SceneForPlanning,
  ProposedShootingDay,
  calculateSceneShootingTimeDetailed,
  calculateEffectiveEighths,
  normalizeEighths,
  parseTimeOfDay,
  detectSetType,
} from './shootingPlanService';
import {
  loadDistanceMatrix,
  type LocationWithCoords,
  type DistanceEntry,
} from './distanceMatrixService';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface AIShootingPlanResponse {
  shootingDays: ProposedShootingDay[];
  summary: {
    totalDays: number;
    rationale: string;
    optimizations: string[];
    warnings: string[];
    actorScheduleSummary: Record<string, {
      totalDays: number;
      firstDay: number;
      lastDay: number;
      waitDays: number;
    }>;
  };
}

interface AISceneInput {
  id: string;
  sequence_number: number;
  title: string;
  description: string;
  location_name: string;
  location_id: string | null;
  time_of_day: string;
  page_eighths: number;
  effectiveEighths: number;
  scene_complexity: string;
  characters: string[];
  int_ext: string | null;
  complejidad_factores: Record<string, boolean | number> | null;
  setup_time_minutes?: number;
  shooting_time_minutes?: number;
  total_time_minutes?: number;
}

interface AILocationInput {
  id: string;
  name: string;
  zone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface AICharacterInput {
  id: string;
  name: string;
  category: string | null;
  scenes_count: number;
}

interface AIDistanceInput {
  from: string;
  to: string;
  distance_km: number;
  duration_minutes: number;
}

interface AIRequestPayload {
  projectId: string;
  productionType: string;
  targetHoursPerDay: number;
  maxEighthsPerDay: number;
  separateDayNight: boolean;
  scenes: AISceneInput[];
  locations: AILocationInput[];
  characters: AICharacterInput[];
  distances: AIDistanceInput[];
}

// ═══════════════════════════════════════════════════════════════════════
// PREPARE DATA FOR AI
// ═══════════════════════════════════════════════════════════════════════

/**
 * Prepare scenes for AI input with pre-calculated time breakdowns
 */
function prepareScenesForAI(
  sequences: Tables<'sequences'>[],
  locations: Tables<'locations'>[]
): AISceneInput[] {
  return sequences.map(seq => {
    // Match location using FK first, then fallback to substring
    const locationMatch = locations.find(
      loc =>
        (seq.location_id && loc.id === seq.location_id) ||
        seq.description?.toLowerCase().includes(loc.name.toLowerCase()) ||
        seq.title?.toLowerCase().includes(loc.name.toLowerCase())
    );

    const rawEighths = seq.page_eighths;
    const pageEighths = normalizeEighths(rawEighths);
    const complexity = seq.scene_complexity || 'media';
    const effEighths = calculateEffectiveEighths(pageEighths, complexity);

    // Build a SceneForPlanning to calculate time
    const sceneForTime: SceneForPlanning = {
      id: seq.id,
      sequence_number: seq.sequence_number,
      title: seq.title || `Escena ${seq.sequence_number}`,
      description: seq.description || '',
      location_name: locationMatch?.name || extractLocationFallback(seq.title || ''),
      location_id: locationMatch?.id || null,
      time_of_day: seq.time_of_day || parseTimeOfDay(seq.title || ''),
      page_eighths: pageEighths,
      scene_complexity: complexity,
      characters: Array.isArray(seq.characters_in_scene) ? (seq.characters_in_scene as string[]) : [],
      effectiveEighths: effEighths,
      complejidad_factores: seq.complejidad_factores as Record<string, boolean | number> | null,
      int_ext: seq.int_ext,
      set_type: detectSetType(seq.title || '') as 'INT' | 'EXT',
    };

    const timeBreakdown = calculateSceneShootingTimeDetailed(sceneForTime);

    return {
      id: seq.id,
      sequence_number: seq.sequence_number,
      title: sceneForTime.title,
      description: sceneForTime.description,
      location_name: sceneForTime.location_name,
      location_id: sceneForTime.location_id,
      time_of_day: sceneForTime.time_of_day,
      page_eighths: pageEighths,
      effectiveEighths: effEighths,
      scene_complexity: complexity,
      characters: sceneForTime.characters,
      int_ext: seq.int_ext,
      complejidad_factores: sceneForTime.complejidad_factores,
      setup_time_minutes: timeBreakdown.setupMinutes,
      shooting_time_minutes: timeBreakdown.shootingMinutes,
      total_time_minutes: timeBreakdown.totalMinutes,
    };
  });
}

/**
 * Prepare locations for AI input
 */
function prepareLocationsForAI(locations: Tables<'locations'>[]): AILocationInput[] {
  return locations.map(loc => ({
    id: loc.id,
    name: loc.name,
    zone: loc.zone,
    address: loc.address,
    latitude: loc.latitude,
    longitude: loc.longitude,
  }));
}

/**
 * Load characters from Supabase and count their scene appearances
 */
async function loadCharactersForAI(
  projectId: string,
  sequences: Tables<'sequences'>[]
): Promise<AICharacterInput[]> {
  // Try to load from characters table
  const { data: chars } = await supabase
    .from('characters')
    .select('id, name, category')
    .eq('project_id', projectId);

  // Count scenes per character from sequences
  const sceneCounts = new Map<string, number>();
  for (const seq of sequences) {
    const seqChars = Array.isArray(seq.characters_in_scene) ? (seq.characters_in_scene as string[]) : [];
    for (const charName of seqChars) {
      sceneCounts.set(charName, (sceneCounts.get(charName) || 0) + 1);
    }
  }

  if (chars && chars.length > 0) {
    return chars.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      scenes_count: sceneCounts.get(c.name) || 0,
    }));
  }

  // Fallback: create character list from sequence data
  return Array.from(sceneCounts.entries()).map(([name, count]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    category: null,
    scenes_count: count,
  }));
}

/**
 * Convert distance matrix to flat array for API
 */
function prepareDistancesForAI(
  distanceMatrix: Map<string, DistanceEntry>,
  locations: Tables<'locations'>[]
): AIDistanceInput[] {
  const locNameMap = new Map<string, string>();
  for (const loc of locations) {
    locNameMap.set(loc.id, loc.name);
  }

  const distances: AIDistanceInput[] = [];
  const seen = new Set<string>();

  for (const [, entry] of distanceMatrix) {
    if (!entry.distance_km) continue;

    // Only include one direction to reduce payload
    const pair = [entry.from_location_id, entry.to_location_id].sort().join('-');
    if (seen.has(pair)) continue;
    seen.add(pair);

    const fromName = locNameMap.get(entry.from_location_id) || entry.from_location_id;
    const toName = locNameMap.get(entry.to_location_id) || entry.to_location_id;

    distances.push({
      from: fromName,
      to: toName,
      distance_km: Math.round(entry.distance_km * 10) / 10,
      duration_minutes: entry.duration_minutes || 0,
    });
  }

  return distances;
}

/**
 * Extract location name from scene title (fallback)
 */
function extractLocationFallback(title: string): string {
  const cleaned = title
    .replace(/^(INT\.|EXT\.|INT\/EXT\.)\s*/i, '')
    .replace(/\s*[-—]\s*(DÍA|NOCHE|ATARDECER|AMANECER|CONTINUO|MÁS TARDE).*$/i, '')
    .trim();
  return cleaned || 'Sin localización';
}

// ═══════════════════════════════════════════════════════════════════════
// JSON EXTRACTION
// ═══════════════════════════════════════════════════════════════════════

function extractShootingPlanJson(raw: string): AIShootingPlanResponse {
  const trimmed = raw.trim();

  // 1) Direct parse
  try { return JSON.parse(trimmed); } catch { /* continue */ }

  // 2) Markdown fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* continue */ }
  }

  // 3) First { to last }
  const braceStart = trimmed.indexOf('{');
  const braceEnd = trimmed.lastIndexOf('}');
  if (braceStart >= 0 && braceEnd > braceStart) {
    try { return JSON.parse(trimmed.slice(braceStart, braceEnd + 1)); } catch { /* continue */ }
  }

  throw new Error('La IA no generó un plan de rodaje válido. Inténtalo de nuevo.');
}

// ═══════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Validate that ALL input scenes appear exactly once in the AI output
 */
function validateAllScenesPresent(
  inputScenes: AISceneInput[],
  outputDays: ProposedShootingDay[]
): { valid: boolean; missing: string[]; duplicated: string[] } {
  const inputIds = new Set(inputScenes.map(s => s.id));
  const outputIds = new Map<string, number>();

  for (const day of outputDays) {
    for (const scene of day.scenes) {
      outputIds.set(scene.id, (outputIds.get(scene.id) || 0) + 1);
    }
  }

  const missing = Array.from(inputIds).filter(id => !outputIds.has(id));
  const duplicated = Array.from(outputIds.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);

  return {
    valid: missing.length === 0 && duplicated.length === 0,
    missing,
    duplicated,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════

export async function generarPlanRodajeConIA(
  projectId: string,
  sequences: Tables<'sequences'>[],
  locations: Tables<'locations'>[],
  options: {
    productionType: string;
    targetHoursPerDay: number;
    maxEighthsPerDay: number;
    separateDayNight: boolean;
  }
): Promise<AIShootingPlanResponse> {
  // 1. Prepare scenes with pre-calculated times
  const scenes = prepareScenesForAI(sequences, locations);

  // 2. Prepare locations
  const aiLocations = prepareLocationsForAI(locations);

  // 3. Load characters
  const characters = await loadCharactersForAI(projectId, sequences);

  // 4. Load distance matrix
  let distances: AIDistanceInput[] = [];
  try {
    const distMatrix = await loadDistanceMatrix(projectId);
    distances = prepareDistancesForAI(distMatrix, locations);
  } catch {
    // No distance data — AI will optimize by grouping
  }

  // 5. Build request payload
  const payload: AIRequestPayload = {
    projectId,
    productionType: options.productionType,
    targetHoursPerDay: options.targetHoursPerDay,
    maxEighthsPerDay: options.maxEighthsPerDay,
    separateDayNight: options.separateDayNight,
    scenes,
    locations: aiLocations,
    characters,
    distances,
  };

  // 6. Call edge function
  const response = await fetch('/api/generar-plan-rodaje', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error((errBody as { error?: string }).error || `Error HTTP ${response.status}`);
  }

  // 7. Read SSE stream (reuses budgetEstimator's readSSEStream)
  const fullText = await readSSEStream(response);

  // 8. Extract JSON
  const aiResponse = extractShootingPlanJson(fullText);

  // 9. Validate all scenes present
  const validation = validateAllScenesPresent(scenes, aiResponse.shootingDays);
  if (!validation.valid) {
    console.warn('[ShootingPlanAI] Validation issues:', validation);

    // If scenes are missing, add them to the last day or create a new day
    if (validation.missing.length > 0) {
      const missingScenesData = scenes.filter(s => validation.missing.includes(s.id));
      const extraDay: ProposedShootingDay = {
        dayNumber: aiResponse.shootingDays.length + 1,
        location: 'Escenas pendientes',
        locationId: null,
        locations: [...new Set(missingScenesData.map(s => s.location_name))],
        timeOfDay: 'DÍA',
        scenes: missingScenesData.map(s => ({
          ...s,
          description: s.description || '',
        })),
        totalEighths: missingScenesData.reduce((sum, s) => sum + s.effectiveEighths, 0),
        estimatedHours: missingScenesData.reduce((sum, s) => sum + (s.total_time_minutes || 60) / 60, 0),
        targetHours: options.targetHoursPerDay,
        remainingHours: 0,
        characters: [...new Set(missingScenesData.flatMap(s => s.characters))],
        warnings: [`⚠️ ${validation.missing.length} escenas no asignadas por la IA fueron añadidas aquí`],
      };
      extraDay.remainingHours = extraDay.targetHours - extraDay.estimatedHours;
      aiResponse.shootingDays.push(extraDay);
    }

    // Remove duplicates (keep first occurrence)
    if (validation.duplicated.length > 0) {
      const seen = new Set<string>();
      for (const day of aiResponse.shootingDays) {
        day.scenes = day.scenes.filter(s => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
        // Recalculate day totals
        day.totalEighths = day.scenes.reduce((sum, s) => sum + (s.effectiveEighths || s.page_eighths || 1), 0);
        day.characters = [...new Set(day.scenes.flatMap(s => s.characters || []))];
      }
      // Remove empty days
      aiResponse.shootingDays = aiResponse.shootingDays.filter(d => d.scenes.length > 0);
    }

    // Renumber days
    aiResponse.shootingDays.forEach((day, i) => {
      day.dayNumber = i + 1;
    });
  }

  return aiResponse;
}
