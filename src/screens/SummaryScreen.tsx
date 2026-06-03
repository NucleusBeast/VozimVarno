import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Header, PhoneFrame } from '../components/layout';
import { InfoRows, ScoreRing } from '../components/metrics';
import { PrimaryButton } from '../components/PrimaryButton';
import { getRideById } from '../services/storage/rideStorage';
import { getLatestCompletedRide } from '../state/currentRide';
import { formatDuration } from '../utils/formatDuration';
import { useAppStyles } from '../styles';
import type { GoToScreen, Ride } from '../types';

function formatDistance(km: number): string {
  if (km <= 0) return 'N/A';
  return `${km.toFixed(1)} km`;
}

function formatSpeed(kmh: number): string {
  if (kmh <= 0) return 'N/A';
  return `${Math.round(kmh)} km/h`;
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Odlicno!';
  if (score >= 75) return 'Dobro opravljeno!';
  if (score >= 60) return 'Voznja v redu.';
  return 'Priporocamo izboljsave.';
}

type Props = {
  go: GoToScreen;
  ride: Ride | null;
  elapsedSeconds?: number;
  rideId?: string;
};

export function SummaryScreen({ go, ride: completedRide, elapsedSeconds = 0, rideId }: Props) {
  const [storedRide, setStoredRide] = useState<Ride | null>(getLatestCompletedRide());
  const styles = useAppStyles();

  useEffect(() => {
    setStoredRide(completedRide ?? getLatestCompletedRide());
  }, [completedRide]);

  useEffect(() => {
    if (!rideId) return;
    getRideById(rideId).then((ride) => {
      if (ride) setStoredRide(ride);
    });
  }, [rideId]);

  const ride = completedRide ?? storedRide;

  if (!ride && elapsedSeconds <= 0) {
    return (
      <PhoneFrame>
        <Header title="Povzetek voznje" go={go} />
        <View style={[styles.content, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={styles.emptyState}>Ni podatkov o tej voznjo.</Text>
          <View style={{ marginTop: 24 }}>
            <PrimaryButton title="Domov" onPress={() => go('home')} />
          </View>
        </View>
      </PhoneFrame>
    );
  }

  const displayDuration = ride?.durationSeconds ?? elapsedSeconds;
  const incidents = ride?.incidents ?? [];
  const points = ride?.points ?? [];
  const accelerations = incidents.filter((i) => i.type === 'hard_acceleration').length;
  const brakings = incidents.filter((i) => i.type === 'hard_braking').length;
  const turns = incidents.filter((i) => i.type === 'sharp_turn').length;
  const noises = incidents.filter((i) => i.type === 'noise_alert').length;

  return (
    <PhoneFrame>
      <Header title="Povzetek voznje" go={go} />
      <View style={styles.content}>
        <View style={styles.centerBlock}>
          <ScoreRing value={ride?.score ?? 0} size={122} stroke={9} />
          <Text style={styles.successText}>{scoreLabel(ride?.score ?? 0)}</Text>
        </View>
        <InfoRows
          rows={[
            ['Razdalja', ride ? formatDistance(ride.distanceKm) : 'N/A'],
            ['Cas voznje', formatDuration(displayDuration)],
            ['Povprecna hitrost', ride ? formatSpeed(ride.avgSpeedKmh) : 'N/A'],
          ]}
        />
        <Text style={styles.sectionTitle}>Dosezeni dogodki</Text>
        <InfoRows
          compact
          rows={[
            ['Pospeski', String(accelerations)],
            ['Zaviranja', String(brakings)],
            ['Ostro zavijanje', String(turns)],
            ['Hrup opozorila', String(noises)],
            ['GPS tocke', `${points.length}`],
            ['Najvisja hitrost', ride ? formatSpeed(ride.maxSpeedKmh) : 'N/A'],
          ]}
        />
        <View style={styles.flexSpacer} />
        <PrimaryButton title="Oceni voznjo" onPress={() => go('rating')} />
      </View>
    </PhoneFrame>
  );
}
