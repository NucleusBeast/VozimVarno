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
import { saveRide } from '../services/storage/rideStorage';
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
  // Called by GPS module (Member 2) during active ride
  updateSpeed: (kmh: number) => void;
  updateGpsStatus: (status: GpsStatus) => void;
};

export function useRideSession(): RideSession {
  const createBackendRide = useMutation(api.rides.createRide);
  const addBackendPoint = useMutation(api.rides.addPoint);
  const addBackendIncident = useMutation(api.rides.addIncident);
  const finishBackendRide = useMutation(api.rides.finishRide);

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
      },
    );
  }, [stopLocationTracking]);

  const syncRideToBackend = useCallback(async (ride: Ride) => {
    try {
      const rideId = await createBackendRide({ startTime: ride.startTime });

      for (const point of ride.points) {
        await addBackendPoint({
          rideId,
          latitude: point.latitude,
          longitude: point.longitude,
          speedKmh: point.speedKmh,
          timestamp: point.timestamp,
          altitude: point.altitude,
        });
      }

      for (const incident of ride.incidents) {
        await addBackendIncident({
          rideId,
          type: incident.type,
          timestamp: incident.timestamp,
          intensity: incident.intensity,
          speedKmh: incident.speedKmh,
          latitude: incident.latitude,
          longitude: incident.longitude,
        });
      }

      await finishBackendRide({
        rideId,
        endTime: ride.endTime,
        durationSeconds: ride.durationSeconds,
        distanceKm: ride.distanceKm,
        score: ride.score,
        maxSpeedKmh: ride.maxSpeedKmh,
        avgSpeedKmh: ride.avgSpeedKmh,
        weatherCondition: ride.weather?.condition,
        temperatureC: ride.weather?.temperatureC,
        windSpeedKmh: ride.weather?.windSpeedKmh,
      });
    } catch {
      // Local ride storage is the source of truth for offline demo flow.
    }
  }, [addBackendIncident, addBackendPoint, createBackendRide, finishBackendRide]);

  const start = useCallback(async () => {
    // Clean up any previous ride
    if (timerRef.current) clearInterval(timerRef.current);
    stopLocationTracking();
    stopAccelerometer();
    stopGyroscope();
    disableFatigueDetection();
    unsubFatigueRef.current?.();
    unsubFatigueRef.current = null;

    const settings = await loadSettings();
    detectorRef.current = createIncidentDetector(settings.incidentThresholds);
    detectorRef.current.reset();

    incidentsRef.current = [];
    pointsRef.current = [];
    latestPointRef.current = undefined;
    startTimeRef.current = Date.now();
    elapsedRef.current = 0;
    speedRef.current = 0;

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

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopLocationTracking();
      stopAccelerometer();
      stopGyroscope();
      disableFatigueDetection();
      unsubFatigueRef.current?.();
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
