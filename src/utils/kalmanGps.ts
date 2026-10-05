/**
 * High-Accuracy GPS Kalman & Anti-Drift Filter
 * Designed specifically for field engineering & walking surveys
 */

import { calculateDistance } from './geo';

export interface FilteredGpsReading {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  isStationary: boolean;
}

export class AntiDriftGpsFilter {
  private lastLat: number | null = null;
  private lastLng: number | null = null;
  private lastAccuracy: number = 999;
  private lastTimestamp: number = 0;

  /**
   * Reset filter state
   */
  public reset() {
    this.lastLat = null;
    this.lastLng = null;
    this.lastAccuracy = 999;
    this.lastTimestamp = 0;
  }

  /**
   * Process a raw GPS reading from navigator.geolocation
   * Ensures real-time responsiveness when walking, while rejecting erratic cell-tower jumps
   */
  public process(
    rawLat: number,
    rawLng: number,
    rawAccuracy: number | null,
    speed: number | null = null,
    heading: number | null = null,
    isLiveTracking = false
  ): FilteredGpsReading {
    const accuracy = rawAccuracy !== null && rawAccuracy > 0 ? rawAccuracy : 10;
    const now = Date.now();

    // 1. First reading initialization
    if (this.lastLat === null || this.lastLng === null) {
      this.lastLat = rawLat;
      this.lastLng = rawLng;
      this.lastAccuracy = accuracy;
      this.lastTimestamp = now;
      return {
        lat: rawLat,
        lng: rawLng,
        accuracy,
        speed,
        heading,
        isStationary: true,
      };
    }

    const distFromLast = calculateDistance(this.lastLat, this.lastLng, rawLat, rawLng);

    // 2. Extreme Outlier Rejection:
    // Only reject if we already had a decent fix (< 15m) and suddenly a degraded fix (> 60m)
    // teleports more than 80 meters in 1 second (cell tower fallback)
    if (this.lastAccuracy <= 15 && accuracy > 60 && distFromLast > 80) {
      return {
        lat: this.lastLat,
        lng: this.lastLng,
        accuracy: this.lastAccuracy,
        speed,
        heading,
        isStationary: true,
      };
    }

    // 3. Live Walking Responsiveness:
    // When live tracking or when the user is walking (distFromLast >= 0.8m),
    // update coordinates immediately without artificial lag!
    let alpha: number;

    if (isLiveTracking) {
      // In Live Tracking mode, technician is actively walking: minimal lag!
      alpha = 0.9;
    } else if (distFromLast < 0.8 && (speed === null || speed < 0.3)) {
      // Micro-jitter deadband: only ignore sub-meter noise (< 0.8m) when completely stationary
      alpha = 0.15;
    } else if (accuracy <= 10) {
      // Good satellite fix: high responsiveness
      alpha = 0.8;
    } else {
      // Fair fix (10m - 30m): smooth glide
      alpha = 0.5;
    }

    const smoothedLat = this.lastLat + alpha * (rawLat - this.lastLat);
    const smoothedLng = this.lastLng + alpha * (rawLng - this.lastLng);

    this.lastLat = smoothedLat;
    this.lastLng = smoothedLng;
    this.lastAccuracy = accuracy;
    this.lastTimestamp = now;

    return {
      lat: smoothedLat,
      lng: smoothedLng,
      accuracy,
      speed,
      heading,
      isStationary: distFromLast < 0.8,
    };
  }
}
