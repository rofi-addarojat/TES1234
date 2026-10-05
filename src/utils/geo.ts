/**
 * Geographic utilities for FTTH precision tagging & anti-drift
 */

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
}

/**
 * Format meters cleanly (e.g. "2.4 m" or "1.8 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(1)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Multi-sample GPS averaging filter (Anti-drift)
 * Filters out outlier samples (samples with high variance or poor accuracy)
 * and calculates the weighted average.
 */
export function averageCoordinates(
  samples: Array<{ lat: number; lng: number; accuracy?: number | null }>
): { lat: number; lng: number; accuracy: number } {
  if (samples.length === 0) {
    return { lat: 0, lng: 0, accuracy: 0 };
  }
  if (samples.length === 1) {
    return {
      lat: samples[0].lat,
      lng: samples[0].lng,
      accuracy: samples[0].accuracy || 5,
    };
  }

  // Weight by inverse accuracy squared (higher accuracy = higher weight)
  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;
  let minAccuracy = 999;

  for (const s of samples) {
    const acc = s.accuracy && s.accuracy > 0 ? s.accuracy : 10;
    const weight = 1 / (acc * acc);
    weightedLat += s.lat * weight;
    weightedLng += s.lng * weight;
    totalWeight += weight;
    if (acc < minAccuracy) minAccuracy = acc;
  }

  return {
    lat: weightedLat / totalWeight,
    lng: weightedLng / totalWeight,
    accuracy: Number(minAccuracy.toFixed(1)),
  };
}
