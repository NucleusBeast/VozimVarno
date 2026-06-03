import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Header, PhoneFrame } from '../components/layout';
import { InfoRows, ScoreRing } from '../components/metrics';
import { PrimaryButton } from '../components/PrimaryButton';
import { getRideById } from '../services/storage/rideStorage';
import { getLatestCompletedRide } from '../state/currentRide';
import { formatDuration } from '../utils/formatDuration';
import { styles } from '../styles';
import type { GoToScreen, Ride } from '../types';

export function SummaryScreen({ go, elapsedSeconds, rideId }: { go: GoToScreen; elapsedSeconds: number; rideId?: string }) {
  const [ride, setRide] = useState<Ride | null>(getLatestCompletedRide());

  useEffect(() => {
    if (!rideId) return;
    getRideById(rideId).then((storedRide) => {
      if (storedRide) setRide(storedRide);
    });
  }, [rideId]);

  const displayDuration = ride?.durationSeconds ?? elapsedSeconds;
  const points = ride?.points ?? [];
  const incidents = ride?.incidents ?? [];

  return (
    <PhoneFrame>
      <Header title="Povzetek voznje" back="active" go={go} />
      <View style={styles.content}>
        <View style={styles.centerBlock}>
          <ScoreRing value={ride?.score ?? 82} size={122} stroke={9} />
          <Text style={styles.successText}>Dobro opravljeno!</Text>
        </View>
        <InfoRows
          rows={[
            ['Razdalja', ride ? `${ride.distanceKm.toFixed(2)} km` : '0,00 km'],
            ['Cas voznje', formatDuration(displayDuration)],
            ['Povprecna hitrost', ride ? `${ride.avgSpeedKmh} km/h` : '0 km/h'],
          ]}
        />
        <Text style={styles.sectionTitle}>Dosezeni dogodki</Text>
        <InfoRows
          compact
          rows={[
            ['Incidenti', `${incidents.length}`],
            ['GPS tocke', `${points.length}`],
            ['Najvisja hitrost', ride ? `${ride.maxSpeedKmh} km/h` : '0 km/h'],
          ]}
        />
        <View style={styles.flexSpacer} />
        <PrimaryButton title="Shrani voznjo" onPress={() => go('rating')} />
      </View>
    </PhoneFrame>
  );
}
