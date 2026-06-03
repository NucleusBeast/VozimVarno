import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Ride, RideSummary } from '../../types';

const RIDES_KEY = 'vv_rides';

async function readAll(): Promise<Ride[]> {
  try {
    const raw = await AsyncStorage.getItem(RIDES_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as Partial<Ride>[]).map(normalizeRide);
  } catch {
    return [];
  }
}

async function writeAll(rides: Ride[]): Promise<void> {
  await AsyncStorage.setItem(RIDES_KEY, JSON.stringify(rides));
}

export async function saveRide(ride: Ride): Promise<void> {
  const rides = await readAll();
  const idx = rides.findIndex((r) => r.id === ride.id);
  if (idx >= 0) {
    rides[idx] = ride;
  } else {
    rides.unshift(ride); // newest first
  }
  await writeAll(rides);
}

export async function getRides(): Promise<Ride[]> {
  return readAll();
}

export async function getRideSummaries(): Promise<RideSummary[]> {
  const rides = await readAll();
  return rides.map((r) => ({
    id: r.id,
    startTime: r.startTime,
    durationSeconds: r.durationSeconds,
    distanceKm: r.distanceKm,
    score: r.score,
    incidentCount: r.incidents.length,
  }));
}

export async function getRideById(id: string): Promise<Ride | null> {
  const rides = await readAll();
  return rides.find((r) => r.id === id) ?? null;
}

export async function deleteRide(id: string): Promise<void> {
  const rides = await readAll();
  await writeAll(rides.filter((r) => r.id !== id));
}

export async function clearAllRides(): Promise<void> {
  await AsyncStorage.removeItem(RIDES_KEY);
}

function normalizeRide(ride: Partial<Ride>): Ride {
  const startTime = ride.startTime ?? Date.now();
  const endTime = ride.endTime ?? startTime;
  const points = Array.isArray(ride.points) ? ride.points : [];
  const incidents = Array.isArray(ride.incidents) ? ride.incidents : [];

  return {
    id: ride.id ?? `ride_${startTime}`,
    startTime,
    endTime,
    durationSeconds: ride.durationSeconds ?? Math.max(0, Math.round((endTime - startTime) / 1000)),
    distanceKm: ride.distanceKm ?? 0,
    score: ride.score ?? 82,
    incidents,
    points,
    maxSpeedKmh: ride.maxSpeedKmh ?? 0,
    avgSpeedKmh: ride.avgSpeedKmh ?? 0,
    weather: ride.weather,
  };
}

// --- Stats helpers ---

export type RideStats = {
  totalRides: number;
  avgScore: number;
  totalDistanceKm: number;
};

export async function getRideStats(): Promise<RideStats> {
  const rides = await readAll();
  if (rides.length === 0) {
    return { totalRides: 0, avgScore: 0, totalDistanceKm: 0 };
  }
  const totalRides = rides.length;
  const avgScore = Math.round(rides.reduce((sum, r) => sum + r.score, 0) / totalRides);
  const totalDistanceKm = Math.round(rides.reduce((sum, r) => sum + r.distanceKm, 0) * 10) / 10;
  return { totalRides, avgScore, totalDistanceKm };
}
