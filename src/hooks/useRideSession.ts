import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useMutation } from 'convex/react';

import type { FatigueResult } from '../services/camera';
import { disableFatigueDetection, enableFatigueDetection, onFatigueUpdate } from '../services/camera';
import { getWeatherForPoint } from '../services/api';
import {
  calculateAverageSpeedKmh,
  calculateDistanceKm,
  calculateMaxSpeedKmh,
  ensureLocationPermission,
  toRidePoint,
} from '../services/location';
import { calculateScore } from '../services/scoring';
import {
  createIncidentDetector,
  startAccelerometer,
  startGyroscope,
  stopAccelerometer,
  stopGyroscope,
} from '../services/sensors';
import { startNoiseMonitoring, stopNoiseMonitoring } from '../services/audio';
import { saveRide } from '../services/storage/rideStorage';
import { toRideSyncPayload } from '../services/storage/rideSync';
import { defaultSettings, loadSettings } from '../services/storage/settingsStorage';
import type { Incident, Ride, RidePoint } from '../types';
import { api } from '../../backend/convex/_generated/api';

export type GpsStatus = 'good' | 'poor' | 'off';

export type RideSession = {
  isActive: boolean;
  elapsedSeconds: number;
  incidents: Incident[];
  currentSpeedKmh: number;
  gpsStatus: GpsStatus;
  fatigueResult: FatigueResult | null;
  start: () => Promise<void>;
  end: () => Promise<Ride>;
  updateSpeed: (kmh: number) => void;
  updateGpsStatus: (status: GpsStatus) => void;
};

export function useRideSession(): RideSession {
  const syncLocalRide = useMutation(api.rides.syncLocalRide);

  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('off');
  const [fatigueResult, setFatigueResult] = useState<FatigueResult | null>(null);

  const incidentsRef = useRef<Incident[]>([]);
  const pointsRef = useRef<RidePoint[]>([]);
  const latestPointRef = useRef<RidePoint | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const speedRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const unsubFatigueRef = useRef<(() => void) | null>(null);
  const detectorRef = useRef(createIncidentDetector(defaultSettings.incidentThresholds));
  const micActiveRef = useRef(false);
  const lastNoiseAlertRef = useRef(0);

  useEffect(() => {
    speedRef.current = currentSpeedKmh;
  }, [currentSpeedKmh]);

  const addIncident = useCallback((incident: Incident) => {
    const updated = [...incidentsRef.current, incident];
    incidentsRef.current = updated;
    setIncidents(updated);
  }, []);

  const stopLocationTracking = useCallback(() => {
    try {
      locationSubscriptionRef.current?.remove();
    } catch {
      // expo-location can throw during cleanup on web; leaving the watcher scope is enough.
    }
    locationSubscriptionRef.current = null;
  }, []);

  const startLocationTracking = useCallback(async () => {
    stopLocationTracking();
    pointsRef.current = [];
    latestPointRef.current = undefined;

    const permissionState = await ensureLocationPermission();
    if (!permissionState.isAvailable) {
      setGpsStatus('off');
      return;
    }

    setGpsStatus('poor');

    locationSubscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 1000,
      },
      (location) => {
        const sample = toRidePoint(location, latestPointRef.current);
        latestPointRef.current = sample.point;
        pointsRef.current = [...pointsRef.current, sample.point];

        speedRef.current = sample.point.speedKmh;
        setCurrentSpeedKmh(sample.point.speedKmh);
        setGpsStatus((sample.accuracy ?? 999) <= 25 ? 'good' : 'poor');

        const speedIncident = detectorRef.current.processSpeed(sample.point.speedKmh, sample.point);
        if (speedIncident) addIncident(speedIncident);
      },
    );
  }, [stopLocationTracking]);

  const syncRideToBackend = useCallback(async (ride: Ride) => {
    try {
      await syncLocalRide(toRideSyncPayload(ride));
    } catch {
      // Local ride storage is the source of truth for offline demo flow.
    }
  }, [syncLocalRide]);

  const start = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopLocationTracking();
    stopAccelerometer();
    stopGyroscope();
    disableFatigueDetection();
    unsubFatigueRef.current?.();
    unsubFatigueRef.current = null;
    micActiveRef.current = false;
    void stopNoiseMonitoring();

    const settings = await loadSettings();
    detectorRef.current = createIncidentDetector(settings.incidentThresholds);
    detectorRef.current.reset();

    incidentsRef.current = [];
    pointsRef.current = [];
    latestPointRef.current = undefined;
    startTimeRef.current = Date.now();
    elapsedRef.current = 0;
    speedRef.current = 0;
    lastNoiseAlertRef.current = 0;

    setIncidents([]);
    setElapsedSeconds(0);
    setCurrentSpeedKmh(0);
    setGpsStatus('off');
    setFatigueResult(null);
    setIsActive(true);

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSeconds(elapsedRef.current);
    }, 1000);

    if (settings.gpsEnabled) {
      try {
        await startLocationTracking();
      } catch {
        setGpsStatus('off');
      }
    }

    await startAccelerometer((data) => {
      const incident = detectorRef.current.processAccelerometer(data, speedRef.current, latestPointRef.current);
      if (incident) addIncident(incident);
    });

    await startGyroscope((data) => {
      const incident = detectorRef.current.processGyroscope(data, speedRef.current, latestPointRef.current);
      if (incident) addIncident(incident);
    });

    if (settings.cameraEnabled) {
      enableFatigueDetection();
      unsubFatigueRef.current = onFatigueUpdate(setFatigueResult);
    }

    if (settings.microphoneEnabled) {
      const noiseThreshold = settings.incidentThresholds.noiseAlertDb;
      const scale = Math.abs(noiseThreshold) || 20;
      micActiveRef.current = true;
      void startNoiseMonitoring((dbLevel) => {
        if (!micActiveRef.current) return;
        if (dbLevel < noiseThreshold) return;
        const now = Date.now();
        if (now - lastNoiseAlertRef.current < 5000) return;
        lastNoiseAlertRef.current = now;
        addIncident({
          id: `noise_${now}`,
          type: 'noise_alert',
          timestamp: now,
          intensity: Math.min(1, Math.max(0, (dbLevel - noiseThreshold) / scale)),
          speedKmh: speedRef.current,
          latitude: latestPointRef.current?.latitude,
          longitude: latestPointRef.current?.longitude,
        });
      }, noiseThreshold);
    }
  }, [addIncident, startLocationTracking, stopLocationTracking]);

  const end = useCallback(async (): Promise<Ride> => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopLocationTracking();
    stopAccelerometer();
    stopGyroscope();
    disableFatigueDetection();
    unsubFatigueRef.current?.();
    unsubFatigueRef.current = null;
    micActiveRef.current = false;
    void stopNoiseMonitoring();

    setIsActive(false);
    setFatigueResult(null);

    const finalIncidents = incidentsRef.current;
    const finalPoints = pointsRef.current;
    const score = calculateScore(finalIncidents);
    const weather = await getWeatherForPoint(finalPoints[finalPoints.length - 1]);

    const ride: Ride = {
      id: `ride_${startTimeRef.current}`,
      startTime: startTimeRef.current,
      endTime: Date.now(),
      durationSeconds: elapsedRef.current,
      distanceKm: calculateDistanceKm(finalPoints),
      score,
      incidents: finalIncidents,
      points: finalPoints,
      maxSpeedKmh: calculateMaxSpeedKmh(finalPoints),
      avgSpeedKmh: calculateAverageSpeedKmh(finalPoints),
      weather,
    };

    try {
      await saveRide(ride);
      void syncRideToBackend(ride);
    } catch {
      // Return ride data for display even if storage fails
    }

    return ride;
  }, [stopLocationTracking, syncRideToBackend]);

  const updateSpeed = useCallback((kmh: number) => {
    speedRef.current = kmh;
    setCurrentSpeedKmh(kmh);
  }, []);

  const updateGpsStatus = useCallback((status: GpsStatus) => {
    setGpsStatus(status);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopLocationTracking();
      stopAccelerometer();
      stopGyroscope();
      disableFatigueDetection();
      unsubFatigueRef.current?.();
      micActiveRef.current = false;
      void stopNoiseMonitoring();
    };
  }, [stopLocationTracking]);

  return {
    isActive,
    elapsedSeconds,
    incidents,
    currentSpeedKmh,
    gpsStatus,
    fatigueResult,
    start,
    end,
    updateSpeed,
    updateGpsStatus,
  };
}
