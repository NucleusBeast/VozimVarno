import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Header, PhoneFrame } from '../components/layout';
import { MetricCard, SpeedGauge } from '../components/metrics';
import { PrimaryButton } from '../components/PrimaryButton';
import { getWeatherForPoint } from '../services/api';
import {
  calculateAverageSpeedKmh,
  calculateDistanceKm,
  calculateMaxSpeedKmh,
  useRideLocation,
} from '../services/location';
import { saveRide } from '../services/storage/rideStorage';
import { setLatestCompletedRide } from '../state/currentRide';
import { formatDuration } from '../utils/formatDuration';
import { styles } from '../styles';
import type { GoToScreen, Ride } from '../types';

export function ActiveRideScreen({
  go,
  elapsedSeconds,
  setElapsedSeconds,
}: {
  go: GoToScreen;
  elapsedSeconds: number;
  setElapsedSeconds: React.Dispatch<React.SetStateAction<number>>;
}) {
  const startTimeRef = useRef(Date.now());
  const [isFinishing, setIsFinishing] = useState(false);
  const { points, currentSpeedKmh, statusText, accuracyMeters, reset } = useRideLocation(!isFinishing);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [setElapsedSeconds]);

  const finishRide = async () => {
    if (isFinishing) return;

    setIsFinishing(true);
    const now = Date.now();
    const distanceKm = calculateDistanceKm(points);
    const avgSpeedKmh = calculateAverageSpeedKmh(points);
    const maxSpeedKmh = calculateMaxSpeedKmh(points);

    const ride: Ride = {
      id: `ride_${now}`,
      startTime: startTimeRef.current,
      endTime: now,
      durationSeconds: elapsedSeconds,
      distanceKm,
      score: 82,
      incidents: [],
      points,
      maxSpeedKmh,
      avgSpeedKmh,
    };

    setLatestCompletedRide(ride);
    reset();
    go('summary', { rideId: ride.id });

    void persistFinishedRide(ride);
  };

  return (
    <PhoneFrame>
      <Header title="Voznja v teku" go={go} />
      <View style={styles.activeBody}>
        <View style={styles.timerRow}>
          <View style={styles.redDot} />
          <Text style={styles.timerText}>{formatDuration(elapsedSeconds)}</Text>
        </View>
        <SpeedGauge value={currentSpeedKmh} />
        <View style={styles.metricGrid}>
          <MetricCard label="Razdalja" value={`${calculateDistanceKm(points).toFixed(2)} km`} />
          <MetricCard label="GPS tocke" value={`${points.length}`} />
          <MetricCard label="Najv. hitrost" value={`${calculateMaxSpeedKmh(points)} km/h`} />
        </View>
        <View style={styles.gpsRow}>
          <View style={styles.greenDot} />
          <Text style={styles.gpsText}>
            {statusText}{accuracyMeters ? ` (${Math.round(accuracyMeters)} m)` : ''}
          </Text>
        </View>
        <PrimaryButton
          title={isFinishing ? 'Shranjujem...' : 'Zakljuci voznjo'}
          onPress={finishRide}
          disabled={isFinishing}
          outline
          danger
        />
      </View>
    </PhoneFrame>
  );
}

async function persistFinishedRide(ride: Ride): Promise<void> {
  try {
    const weather = await getWeatherForPoint(ride.points[ride.points.length - 1]);
    const rideWithWeather = {
      ...ride,
      weather,
    };

    setLatestCompletedRide(rideWithWeather);
    await saveRide(rideWithWeather);
  } catch {
    try {
      await saveRide(ride);
    } catch {
      // Summary already has the in-memory ride; storage failure must not blank the UI.
    }
  }
}
