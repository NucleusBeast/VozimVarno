import type { Incident, IncidentThresholds, IncidentType } from '../../types';

type Vec3 = { x: number; y: number; z: number };

// Low-pass filter coefficient for gravity extraction: higher = slower adaptation
const FILTER_ALPHA = 0.85;
// Minimum gap between two incidents of the same type
const COOLDOWN_MS = 2500;
// Ignore initial samples until gravity filter converges
const WARMUP_MS = 3000;

export type IncidentDetector = {
  processAccelerometer: (
    data: Vec3,
    speedKmh: number,
    location?: { latitude: number; longitude: number },
  ) => Incident | null;
  processGyroscope: (
    data: Vec3,
    speedKmh: number,
    location?: { latitude: number; longitude: number },
  ) => Incident | null;
  reset: () => void;
};

export function createIncidentDetector(thresholds: IncidentThresholds): IncidentDetector {
  let gravity: Vec3 = { x: 0, y: 0, z: 9.81 };
  const lastTime: Partial<Record<IncidentType, number>> = {};
  let warmupEnd = Date.now() + WARMUP_MS;

  function canRecord(type: IncidentType): boolean {
    if (Date.now() < warmupEnd) return false;
    const last = lastTime[type];
    return !last || Date.now() - last >= COOLDOWN_MS;
  }

  function makeIncident(
    type: IncidentType,
    magnitude: number,
    threshold: number,
    speedKmh: number,
    location?: { latitude: number; longitude: number },
  ): Incident {
    const now = Date.now();
    lastTime[type] = now;
    return {
      id: `${type}_${now}`,
      type,
      timestamp: now,
      intensity: Math.min(1, (magnitude - threshold) / threshold),
      speedKmh,
      latitude: location?.latitude,
      longitude: location?.longitude,
    };
  }

  // Assumes portrait phone orientation: y-axis ≈ forward/backward direction.
  // Gravity component is removed via low-pass filter before magnitude check.
  function processAccelerometer(
    raw: Vec3,
    speedKmh: number,
    location?: { latitude: number; longitude: number },
  ): Incident | null {
    gravity.x = FILTER_ALPHA * gravity.x + (1 - FILTER_ALPHA) * raw.x;
    gravity.y = FILTER_ALPHA * gravity.y + (1 - FILTER_ALPHA) * raw.y;
    gravity.z = FILTER_ALPHA * gravity.z + (1 - FILTER_ALPHA) * raw.z;

    const lx = raw.x - gravity.x;
    const ly = raw.y - gravity.y;
    const lz = raw.z - gravity.z;
    const magnitude = Math.sqrt(lx * lx + ly * ly + lz * lz);

    const minThreshold = Math.min(thresholds.hardBrakingMs2, thresholds.hardAccelerationMs2);
    if (magnitude < minThreshold) return null;

    const type: IncidentType = ly <= 0 ? 'hard_braking' : 'hard_acceleration';
    const threshold = type === 'hard_braking' ? thresholds.hardBrakingMs2 : thresholds.hardAccelerationMs2;

    if (magnitude < threshold || !canRecord(type)) return null;

    return makeIncident(type, magnitude, threshold, speedKmh, location);
  }

  function processGyroscope(
    data: Vec3,
    speedKmh: number,
    location?: { latitude: number; longitude: number },
  ): Incident | null {
    const yawRate = Math.abs(data.z); // rad/s
    const thresholdRadS = thresholds.sharpTurnDegS * (Math.PI / 180);

    if (yawRate < thresholdRadS || !canRecord('sharp_turn')) return null;

    return makeIncident('sharp_turn', yawRate, thresholdRadS, speedKmh, location);
  }

  function reset(): void {
    gravity = { x: 0, y: 0, z: 9.81 };
    for (const key of Object.keys(lastTime) as IncidentType[]) delete lastTime[key];
    warmupEnd = Date.now() + WARMUP_MS;
  }

  return { processAccelerometer, processGyroscope, reset };
}
