import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Incident, Ride, RidePoint, RideSummary } from '../../types';

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
    userRating: ride.userRating,
    userComment: ride.userComment,
    weather: ride.weather,
  };
}

// --- Demo seed ---

export async function seedDemoRide(): Promise<void> {
  const existing = await readAll();
  if (existing.length > 0) return;

  const now = Date.now();
  const start = now - 25 * 60 * 1000;

  const points: RidePoint[] = Array.from({ length: 60 }, (_, i) => ({
    latitude: 46.0569 + i * 0.0005 + (Math.random() - 0.5) * 0.0002,
    longitude: 14.5058 + i * 0.0008 + (Math.random() - 0.5) * 0.0002,
    speedKmh: 35 + Math.random() * 25,
    timestamp: start + i * 25000,
    altitude: 290 + Math.random() * 20,
  }));

  const incidents: Incident[] = [
    { id: 'demo_1', type: 'hard_braking', timestamp: start + 5 * 60000, intensity: 0.72, speedKmh: 52, latitude: points[12]?.latitude, longitude: points[12]?.longitude },
    { id: 'demo_2', type: 'sharp_turn', timestamp: start + 11 * 60000, intensity: 0.58, speedKmh: 38, latitude: points[26]?.latitude, longitude: points[26]?.longitude },
    { id: 'demo_3', type: 'hard_acceleration', timestamp: start + 18 * 60000, intensity: 0.65, speedKmh: 28, latitude: points[43]?.latitude, longitude: points[43]?.longitude },
    { id: 'demo_4', type: 'noise_alert', timestamp: start + 22 * 60000, intensity: 0.4, speedKmh: 44, latitude: points[52]?.latitude, longitude: points[52]?.longitude },
  ];

  const ride: Ride = {
    id: `ride_demo_${start}`,
    startTime: start,
    endTime: now,
    durationSeconds: 25 * 60,
    distanceKm: 14.7,
    score: 83,
    incidents,
    points,
    maxSpeedKmh: 72,
    avgSpeedKmh: 47,
    weather: {
      temperatureC: 18,
      windSpeedKmh: 12,
      condition: 'Delno oblacno',
      fetchedAt: now,
      source: 'fallback',
    },
  };

  await writeAll([ride]);
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
