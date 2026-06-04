import type { Incident, IncidentThresholds, IncidentType } from '../../types';

type Vec3 = { x: number; y: number; z: number };
type Axis = 'x' | 'y' | 'z';

const FILTER_ALPHA = 0.85;
const COOLDOWN_MS = 2500;
const SPEED_EXCEEDED_COOLDOWN_MS = 10000;
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
  processSpeed: (
    speedKmh: number,
    location?: { latitude: number; longitude: number },
  ) => Incident | null;
  reset: () => void;
};

export function createIncidentDetector(thresholds: IncidentThresholds): IncidentDetector {
  let gravity: Vec3 = { x: 0, y: 0, z: 9.81 };
  const lastTime: Partial<Record<IncidentType, number>> = {};
  let warmupEnd = Date.now() + WARMUP_MS;

  // Orientation detection: infer the phone's forward axis from gravity during warmup
  const warmupSamples: Vec3[] = [];
  let forwardAxis: Axis = 'y';
  let orientationDetected = false;

  function detectOrientation(): void {
    if (warmupSamples.length < 3) return;
    const n = warmupSamples.length;
    const avgX = warmupSamples.reduce((s, v) => s + v.x, 0) / n;
    const avgY = warmupSamples.reduce((s, v) => s + v.y, 0) / n;
    const avgZ = warmupSamples.reduce((s, v) => s + v.z, 0) / n;

    const absX = Math.abs(avgX);
    const absY = Math.abs(avgY);
    const absZ = Math.abs(avgZ);

    // The axis with maximum gravity is the vertical mounting axis.
    // Pick the remaining axis with more expected motion as the forward/backward axis.
    if (absY >= absX && absY >= absZ) {
      // Gravity mostly on Y → phone upright portrait in cup-holder or angled mount
      // Forward direction is Z (along the screen depth)
      forwardAxis = 'z';
    } else if (absX >= absY && absX >= absZ) {
      // Gravity mostly on X → phone in landscape orientation
      // Forward direction is Y
      forwardAxis = 'y';
    } else {
      // Gravity mostly on Z → phone flat / dashboard face-up mount
      // Forward direction is Y
      forwardAxis = 'y';
    }
    orientationDetected = true;
  }

  function canRecord(type: IncidentType): boolean {
    if (Date.now() < warmupEnd) return false;
    const last = lastTime[type];
    const cooldown = type === 'speed_exceeded' ? SPEED_EXCEEDED_COOLDOWN_MS : COOLDOWN_MS;
    return !last || Date.now() - last >= cooldown;
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

  function processAccelerometer(
    raw: Vec3,
    speedKmh: number,
    location?: { latitude: number; longitude: number },
  ): Incident | null {
    gravity.x = FILTER_ALPHA * gravity.x + (1 - FILTER_ALPHA) * raw.x;
    gravity.y = FILTER_ALPHA * gravity.y + (1 - FILTER_ALPHA) * raw.y;
    gravity.z = FILTER_ALPHA * gravity.z + (1 - FILTER_ALPHA) * raw.z;

    const now = Date.now();
    if (!orientationDetected) {
      if (now < warmupEnd) {
        warmupSamples.push({ x: raw.x, y: raw.y, z: raw.z });
      } else {
        detectOrientation();
      }
    }

    const lx = raw.x - gravity.x;
    const ly = raw.y - gravity.y;
    const lz = raw.z - gravity.z;
    const magnitude = Math.sqrt(lx * lx + ly * ly + lz * lz);

    const minThreshold = Math.min(thresholds.hardBrakingMs2, thresholds.hardAccelerationMs2);
    if (magnitude < minThreshold) return null;

    const linear = { x: lx, y: ly, z: lz };
    const forwardComponent = linear[forwardAxis];
    const type: IncidentType = forwardComponent <= 0 ? 'hard_braking' : 'hard_acceleration';
    const threshold = type === 'hard_braking' ? thresholds.hardBrakingMs2 : thresholds.hardAccelerationMs2;

    if (magnitude < threshold || !canRecord(type)) return null;

    return makeIncident(type, magnitude, threshold, speedKmh, location);
  }

  function processGyroscope(
    data: Vec3,
    speedKmh: number,
    location?: { latitude: number; longitude: number },
  ): Incident | null {
    const yawRate = Math.abs(data.z);
    const thresholdRadS = thresholds.sharpTurnDegS * (Math.PI / 180);

    if (yawRate < thresholdRadS || !canRecord('sharp_turn')) return null;

    return makeIncident('sharp_turn', yawRate, thresholdRadS, speedKmh, location);
  }

  function processSpeed(
    speedKmh: number,
    location?: { latitude: number; longitude: number },
  ): Incident | null {
    const limit = thresholds.speedLimitKmh;
    if (!limit || speedKmh <= limit) return null;
    if (!canRecord('speed_exceeded')) return null;

    return makeIncident('speed_exceeded', speedKmh, limit, speedKmh, location);
  }

  function reset(): void {
    gravity = { x: 0, y: 0, z: 9.81 };
    for (const key of Object.keys(lastTime) as IncidentType[]) delete lastTime[key];
    warmupEnd = Date.now() + WARMUP_MS;
    warmupSamples.length = 0;
    orientationDetected = false;
    forwardAxis = 'y';
  }

  return { processAccelerometer, processGyroscope, processSpeed, reset };
}
