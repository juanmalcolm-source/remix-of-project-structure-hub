// Distance Matrix Service - Calculate and manage distances between locations
import { supabase } from "@/integrations/supabase/client";

export interface LocationWithCoords {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  zone: string | null;
  address: string | null;
}

export interface DistanceEntry {
  id?: string;
  from_location_id: string;
  to_location_id: string;
  distance_km: number | null;
  duration_minutes: number | null;
  source: 'manual' | 'google_maps' | 'estimated';
}

export interface DistanceMatrix {
  locations: LocationWithCoords[];
  distances: Map<string, DistanceEntry>; // Key: "fromId-toId"
}

// ═══════════════════════════════════════════════════════════════════════
// HAVERSINE FORMULA - Calculate distance between two GPS coordinates
// ═══════════════════════════════════════════════════════════════════════

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
}

/**
 * Estimate travel time based on distance
 * Uses average speed of 40 km/h for urban areas
 */
export function estimateTravelTime(distanceKm: number): number {
  const AVERAGE_SPEED_KMH = 40; // Urban average including traffic
  return Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60); // Minutes
}

// ═══════════════════════════════════════════════════════════════════════
// ZONE-BASED GROUPING
// ═══════════════════════════════════════════════════════════════════════

export interface ZoneGroup {
  zone: string;
  zoneName: string;
  locations: LocationWithCoords[];
  averageInternalDistance: number;
}

const ZONE_NAMES: Record<string, string> = {
  'zona-norte': 'Zona Norte',
  'zona-sur': 'Zona Sur',
  'zona-centro': 'Zona Centro',
  'zona-este': 'Zona Este',
  'zona-oeste': 'Zona Oeste',
  'exterior-ciudad': 'Exterior Ciudad',
  'estudio': 'Estudio/Plató',
  'sin-zona': 'Sin zona asignada',
};

/**
 * Group locations by zone
 */
export function groupLocationsByZone(locations: LocationWithCoords[]): ZoneGroup[] {
  const groups: Map<string, LocationWithCoords[]> = new Map();
  
  for (const location of locations) {
    const zone = location.zone || 'sin-zona';
    if (!groups.has(zone)) {
      groups.set(zone, []);
    }
    groups.get(zone)!.push(location);
  }
  
  const result: ZoneGroup[] = [];
  
  for (const [zone, locs] of groups) {
    // Calculate average internal distance
    let totalDistance = 0;
    let distanceCount = 0;
    
    for (let i = 0; i < locs.length; i++) {
      for (let j = i + 1; j < locs.length; j++) {
        if (locs[i].latitude && locs[i].longitude && locs[j].latitude && locs[j].longitude) {
          totalDistance += calculateHaversineDistance(
            locs[i].latitude,
            locs[i].longitude,
            locs[j].latitude,
            locs[j].longitude
          );
          distanceCount++;
        }
      }
    }
    
    result.push({
      zone,
      zoneName: ZONE_NAMES[zone] || zone,
      locations: locs,
      averageInternalDistance: distanceCount > 0 ? totalDistance / distanceCount : 0,
    });
  }
  
  return result.sort((a, b) => b.locations.length - a.locations.length);
}

/**
 * Calculate distance between two zones (average of all location pairs)
 */
export function calculateZoneDistance(
  zone1: ZoneGroup,
  zone2: ZoneGroup,
  distanceMatrix: Map<string, DistanceEntry>
): number {
  let totalDistance = 0;
  let count = 0;
  
  for (const loc1 of zone1.locations) {
    for (const loc2 of zone2.locations) {
      // Check if we have a stored distance
      const key = `${loc1.id}-${loc2.id}`;
      const reverseKey = `${loc2.id}-${loc1.id}`;
      
      const entry = distanceMatrix.get(key) || distanceMatrix.get(reverseKey);
      
      if (entry?.distance_km) {
        totalDistance += entry.distance_km;
        count++;
      } else if (loc1.latitude && loc1.longitude && loc2.latitude && loc2.longitude) {
        // Calculate from coordinates
        totalDistance += calculateHaversineDistance(
          loc1.latitude,
          loc1.longitude,
          loc2.latitude,
          loc2.longitude
        );
        count++;
      }
    }
  }
  
  return count > 0 ? totalDistance / count : Infinity;
}

// ═══════════════════════════════════════════════════════════════════════
// DATABASE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Load distance matrix from database
 */
export async function loadDistanceMatrix(projectId: string): Promise<Map<string, DistanceEntry>> {
  const { data, error } = await supabase
    .from('location_distances')
    .select('*')
    .eq('project_id', projectId);
  
  if (error) throw error;
  
  const matrix = new Map<string, DistanceEntry>();
  
  for (const entry of data || []) {
    const key = `${entry.from_location_id}-${entry.to_location_id}`;
    matrix.set(key, {
      id: entry.id,
      from_location_id: entry.from_location_id,
      to_location_id: entry.to_location_id,
      distance_km: entry.distance_km,
      duration_minutes: entry.duration_minutes,
      source: entry.source as 'manual' | 'google_maps' | 'estimated',
    });
  }
  
  return matrix;
}

/**
 * Save or update a distance entry
 */
export async function saveDistanceEntry(
  projectId: string,
  entry: DistanceEntry
): Promise<void> {
  const { error } = await supabase
    .from('location_distances')
    .upsert({
      project_id: projectId,
      from_location_id: entry.from_location_id,
      to_location_id: entry.to_location_id,
      distance_km: entry.distance_km,
      duration_minutes: entry.duration_minutes,
      source: entry.source,
    }, {
      onConflict: 'project_id,from_location_id,to_location_id',
    });
  
  if (error) throw error;
}

/**
 * Auto-calculate distances for all location pairs with GPS coordinates
 */
export async function autoCalculateDistances(
  projectId: string,
  locations: LocationWithCoords[]
): Promise<{ calculated: number; skipped: number }> {
  const locationsWithCoords = locations.filter(l => l.latitude && l.longitude);
  let calculated = 0;
  let skipped = 0;
  
  for (let i = 0; i < locationsWithCoords.length; i++) {
    for (let j = i + 1; j < locationsWithCoords.length; j++) {
      const loc1 = locationsWithCoords[i];
      const loc2 = locationsWithCoords[j];
      
      const distance = calculateHaversineDistance(
        loc1.latitude!,
        loc1.longitude!,
        loc2.latitude!,
        loc2.longitude!
      );
      
      const duration = estimateTravelTime(distance);
      
      // Save both directions
      await saveDistanceEntry(projectId, {
        from_location_id: loc1.id,
        to_location_id: loc2.id,
        distance_km: Math.round(distance * 100) / 100,
        duration_minutes: duration,
        source: 'estimated',
      });
      
      await saveDistanceEntry(projectId, {
        from_location_id: loc2.id,
        to_location_id: loc1.id,
        distance_km: Math.round(distance * 100) / 100,
        duration_minutes: duration,
        source: 'estimated',
      });
      
      calculated++;
    }
  }
  
  skipped = locations.length - locationsWithCoords.length;
  
  return { calculated, skipped };
}

// ═══════════════════════════════════════════════════════════════════════
// PROXIMITY OPTIMIZATION FOR SHOOTING PLAN
// ═══════════════════════════════════════════════════════════════════════

export interface ProximityScore {
  locationId: string;
  locationName: string;
  totalDistanceToOthers: number;
  averageDistanceToOthers: number;
  nearestLocations: { id: string; name: string; distance: number }[];
}

/**
 * Calculate proximity scores for all locations
 * Used to optimize shooting schedule by minimizing travel
 */
export function calculateProximityScores(
  locations: LocationWithCoords[],
  distanceMatrix: Map<string, DistanceEntry>
): ProximityScore[] {
  const scores: ProximityScore[] = [];
  
  for (const location of locations) {
    const distances: { id: string; name: string; distance: number }[] = [];
    let totalDistance = 0;
    
    for (const other of locations) {
      if (other.id === location.id) continue;
      
      const key = `${location.id}-${other.id}`;
      const reverseKey = `${other.id}-${location.id}`;
      const entry = distanceMatrix.get(key) || distanceMatrix.get(reverseKey);
      
      let distance = Infinity;
      
      if (entry?.distance_km) {
        distance = entry.distance_km;
      } else if (location.latitude && location.longitude && other.latitude && other.longitude) {
        distance = calculateHaversineDistance(
          location.latitude,
          location.longitude,
          other.latitude,
          other.longitude
        );
      }
      
      if (distance !== Infinity) {
        distances.push({ id: other.id, name: other.name, distance });
        totalDistance += distance;
      }
    }
    
    distances.sort((a, b) => a.distance - b.distance);
    
    scores.push({
      locationId: location.id,
      locationName: location.name,
      totalDistanceToOthers: totalDistance,
      averageDistanceToOthers: distances.length > 0 ? totalDistance / distances.length : 0,
      nearestLocations: distances.slice(0, 5),
    });
  }
  
  return scores.sort((a, b) => a.averageDistanceToOthers - b.averageDistanceToOthers);
}

/**
 * Find optimal location groupings for a shooting day
 * Groups nearby locations that can be shot together
 */
export function findOptimalLocationGroupings(
  locations: LocationWithCoords[],
  distanceMatrix: Map<string, DistanceEntry>,
  maxDistanceKm: number = 10
): LocationWithCoords[][] {
  const groups: LocationWithCoords[][] = [];
  const assigned = new Set<string>();
  
  // Sort locations by zone first, then by proximity
  const sortedLocations = [...locations].sort((a, b) => {
    if (a.zone && b.zone) {
      if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    }
    return 0;
  });
  
  for (const location of sortedLocations) {
    if (assigned.has(location.id)) continue;
    
    const group: LocationWithCoords[] = [location];
    assigned.add(location.id);
    
    // Find nearby locations not yet assigned
    for (const other of sortedLocations) {
      if (assigned.has(other.id)) continue;
      
      // Check distance to all locations in the current group
      let isNearAll = true;
      
      for (const grouped of group) {
        const key = `${grouped.id}-${other.id}`;
        const reverseKey = `${other.id}-${grouped.id}`;
        const entry = distanceMatrix.get(key) || distanceMatrix.get(reverseKey);
        
        let distance = Infinity;
        
        if (entry?.distance_km) {
          distance = entry.distance_km;
        } else if (grouped.latitude && grouped.longitude && other.latitude && other.longitude) {
          distance = calculateHaversineDistance(
            grouped.latitude,
            grouped.longitude,
            other.latitude,
            other.longitude
          );
        }
        
        if (distance > maxDistanceKm) {
          isNearAll = false;
          break;
        }
      }
      
      if (isNearAll) {
        group.push(other);
        assigned.add(other.id);
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}
