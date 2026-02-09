/**
 * Haversine distance calculation between two GPS coordinates
 * Returns distance in kilometers
 */
export function calcularDistanciaHaversine(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // 2 decimals
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimate driving duration in minutes from km distance
 * Rough estimate: 50 km/h average speed in production context
 */
export function estimarDuracionMinutos(distanciaKm: number): number {
  return Math.round((distanciaKm / 50) * 60);
}

export interface DistanceEntry {
  from_location_id: string;
  to_location_id: string;
  distance_km: number;
  duration_minutes: number;
}

/**
 * Calculate distance matrix between all locations that have GPS coordinates
 */
export function calcularMatrizDistancias(
  locations: Array<{ id: string; latitude: number | null; longitude: number | null }>
): DistanceEntry[] {
  const withCoords = locations.filter(
    (l) => l.latitude != null && l.longitude != null
  );
  const entries: DistanceEntry[] = [];

  for (let i = 0; i < withCoords.length; i++) {
    for (let j = i + 1; j < withCoords.length; j++) {
      const a = withCoords[i];
      const b = withCoords[j];
      const km = calcularDistanciaHaversine(
        a.latitude!, a.longitude!,
        b.latitude!, b.longitude!
      );
      entries.push({
        from_location_id: a.id,
        to_location_id: b.id,
        distance_km: km,
        duration_minutes: estimarDuracionMinutos(km),
      });
    }
  }

  return entries;
}
