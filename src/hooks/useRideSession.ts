import { useCallback, useEffect, useRef, useState } from 'react';

import type { FatigueResult } from '../services/camera';
import { disableFatigueDetection, enableFatigueDetection, onFatigueUpdate } from '../services/camera';
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
import type { Incident, Ride } from '../types';

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
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('off');
  const [fatigueResult, setFatigueResult] = useState<FatigueResult | null>(null);

  const incidentsRef = useRef<Incident[]>([]);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const speedRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const start = useCallback(async () => {
    // Clean up any previous ride
    if (timerRef.current) clearInterval(timerRef.current);
    stopAccelerometer();
    stopGyroscope();
    disableFatigueDetection();
    unsubFatigueRef.current?.();
    unsubFatigueRef.current = null;

    const settings = await loadSettings();
    detectorRef.current = createIncidentDetector(settings.incidentThresholds);
    detectorRef.current.reset();

    incidentsRef.current = [];
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

    await startAccelerometer((data) => {
      const incident = detectorRef.current.processAccelerometer(data, speedRef.current);
      if (incident) addIncident(incident);
    });

    await startGyroscope((data) => {
      const incident = detectorRef.current.processGyroscope(data, speedRef.current);
      if (incident) addIncident(incident);
    });

    if (settings.cameraEnabled) {
      enableFatigueDetection();
      unsubFatigueRef.current = onFatigueUpdate(setFatigueResult);
    }
  }, [addIncident]);

  const end = useCallback(async (): Promise<Ride> => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopAccelerometer();
    stopGyroscope();
    disableFatigueDetection();
    unsubFatigueRef.current?.();
    unsubFatigueRef.current = null;

    setIsActive(false);
    setFatigueResult(null);

    const finalIncidents = incidentsRef.current;
    const score = calculateScore(finalIncidents);

    const ride: Ride = {
      id: `ride_${startTimeRef.current}`,
      startTime: startTimeRef.current,
      endTime: Date.now(),
      durationSeconds: elapsedRef.current,
      distanceKm: 0,    // populated by GPS module (Member 2)
      score,
      incidents: finalIncidents,
      points: [],        // populated by GPS module (Member 2)
      maxSpeedKmh: speedRef.current,
      avgSpeedKmh: speedRef.current,
    };

    try {
      await saveRide(ride);
    } catch {
      // Return ride data for display even if storage fails
    }

    return ride;
  }, []);

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
      stopAccelerometer();
      stopGyroscope();
      disableFatigueDetection();
      unsubFatigueRef.current?.();
    };
  }, []);

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
