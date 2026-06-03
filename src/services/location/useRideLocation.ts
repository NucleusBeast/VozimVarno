import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import type { RidePoint } from '../../types';
import { ensureLocationPermission, toRidePoint } from './rideLocation';

export function useRideLocation(isTracking: boolean) {
  const [points, setPoints] = useState<RidePoint[]>([]);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [statusText, setStatusText] = useState('GPS: pripravljeno');
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const previousPointRef = useRef<RidePoint | undefined>(undefined);

  const reset = useCallback(() => {
    previousPointRef.current = undefined;
    setPoints([]);
    setCurrentSpeedKmh(0);
    setAccuracyMeters(null);
    setStatusText('GPS: pripravljeno');
  }, []);

  useEffect(() => {
    if (!isTracking) return undefined;

    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    const startTracking = async () => {
      try {
        const permissionState = await ensureLocationPermission();
        if (cancelled) return;

        setStatusText(permissionState.statusText);
        if (!permissionState.isAvailable) return;

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 5,
            timeInterval: 1000,
          },
          (location) => {
            const sample = toRidePoint(location, previousPointRef.current);
            previousPointRef.current = sample.point;
            setPoints((existing) => [...existing, sample.point]);
            setCurrentSpeedKmh(sample.point.speedKmh);
            setAccuracyMeters(sample.accuracy ?? null);
            setStatusText((sample.accuracy ?? 999) <= 25 ? 'GPS: odlicen' : 'GPS: povezan');
          },
        );
      } catch {
        if (!cancelled) {
          setStatusText('GPS: simulacijski fallback');
        }
      }
    };

    void startTracking();

    return () => {
      cancelled = true;
      safelyRemoveSubscription(subscription);
    };
  }, [isTracking]);

  return {
    points,
    currentSpeedKmh,
    statusText,
    accuracyMeters,
    reset,
  };
}

function safelyRemoveSubscription(subscription?: Location.LocationSubscription): void {
  try {
    subscription?.remove();
  } catch {
    // expo-location can throw during web cleanup; the watch is already leaving scope.
  }
}
