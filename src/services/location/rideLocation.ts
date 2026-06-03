import * as Location from 'expo-location';

import type { RidePoint } from '../../types';

export type LocationTrackingState = {
  hasPermission: boolean;
  isAvailable: boolean;
  statusText: string;
};

export type LocationSample = {
  point: RidePoint;
  accuracy?: number | null;
};

export async function ensureLocationPermission(): Promise<LocationTrackingState> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  const permission = await Location.getForegroundPermissionsAsync();

  if (!servicesEnabled) {
    return {
      hasPermission: permission.granted,
      isAvailable: false,
      statusText: 'GPS: lokacijske storitve so izklopljene',
    };
  }

  if (!permission.granted) {
    return {
      hasPermission: false,
      isAvailable: false,
      statusText: 'GPS: dovoljenje manjka',
    };
  }

  return {
    hasPermission: true,
    isAvailable: true,
    statusText: 'GPS: povezujem...',
  };
}

export function toRidePoint(location: Location.LocationObject, previous?: RidePoint): LocationSample {
  const timestamp = location.timestamp || Date.now();
  const rawSpeedMs = location.coords.speed;
  const measuredSpeedKmh = rawSpeedMs !== null && rawSpeedMs !== undefined && rawSpeedMs >= 0
    ? rawSpeedMs * 3.6
    : undefined;

  const estimatedSpeedKmh = previous
    ? estimateSpeedKmh(previous, {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp,
    })
    : 0;

  return {
    accuracy: location.coords.accuracy,
    point: {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      speedKmh: Math.max(0, Math.round(measuredSpeedKmh ?? estimatedSpeedKmh)),
      timestamp,
      altitude: location.coords.altitude ?? undefined,
    },
  };
}

export function calculateDistanceKm(points: RidePoint[]): number {
  if (points.length < 2) return 0;

  let distance = 0;
  for (let i = 1; i < points.length; i += 1) {
    distance += haversineKm(points[i - 1], points[i]);
  }

  return Math.round(distance * 100) / 100;
}

export function calculateAverageSpeedKmh(points: RidePoint[]): number {
  const movingPoints = points.filter((point) => point.speedKmh > 1);
  if (movingPoints.length === 0) return 0;

  return Math.round(movingPoints.reduce((sum, point) => sum + point.speedKmh, 0) / movingPoints.length);
}

export function calculateMaxSpeedKmh(points: RidePoint[]): number {
  return points.reduce((max, point) => Math.max(max, point.speedKmh), 0);
}

function estimateSpeedKmh(previous: RidePoint, next: Pick<RidePoint, 'latitude' | 'longitude' | 'timestamp'>): number {
  const elapsedHours = (next.timestamp - previous.timestamp) / 3600000;
  if (elapsedHours <= 0) return 0;

  return haversineKm(previous, next) / elapsedHours;
}

function haversineKm(
  a: Pick<RidePoint, 'latitude' | 'longitude'>,
  b: Pick<RidePoint, 'latitude' | 'longitude'>,
): number {
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(b.latitude - a.latitude);
  const dLon = degreesToRadians(b.longitude - a.longitude);
  const lat1 = degreesToRadians(a.latitude);
  const lat2 = degreesToRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}
