import { Text, View } from 'react-native';

import { Header, PhoneFrame } from '../components/layout';
import { InfoRows, ScoreRing } from '../components/metrics';
import { PrimaryButton } from '../components/PrimaryButton';
import { formatDuration } from '../utils/formatDuration';
import { styles } from '../styles';
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
  if (score >= 90) return 'Odlično!';
  if (score >= 75) return 'Dobro opravljeno!';
  if (score >= 60) return 'Voznja v redu.';
  return 'Priporočamo izboljšave.';
}

export function SummaryScreen({ go, ride }: { go: GoToScreen; ride: Ride | null }) {
  if (!ride) {
    return (
      <PhoneFrame>
        <Header title="Povzetek voznje" go={go} />
        <View style={[styles.content, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={styles.emptyState}>Ni podatkov o tej vožnji.</Text>
          <View style={{ marginTop: 24 }}>
            <PrimaryButton title="Domov" onPress={() => go('home')} />
          </View>
        </View>
      </PhoneFrame>
    );
  }

  const accelerations = ride.incidents.filter((i) => i.type === 'hard_acceleration').length;
  const brakings = ride.incidents.filter((i) => i.type === 'hard_braking').length;
  const turns = ride.incidents.filter((i) => i.type === 'sharp_turn').length;

  return (
    <PhoneFrame>
      <Header title="Povzetek voznje" go={go} />
      <View style={styles.content}>
        <View style={styles.centerBlock}>
          <ScoreRing value={ride.score} size={122} stroke={9} />
          <Text style={styles.successText}>{scoreLabel(ride.score)}</Text>
        </View>
        <InfoRows
          rows={[
            ['Razdalja', formatDistance(ride.distanceKm)],
            ['Čas voznje', formatDuration(ride.durationSeconds)],
            ['Povprečna hitrost', formatSpeed(ride.avgSpeedKmh)],
          ]}
        />
        <Text style={styles.sectionTitle}>Doseženi dogodki</Text>
        <InfoRows
          compact
          rows={[
            ['Pospeski', String(accelerations)],
            ['Zaviranja', String(brakings)],
            ['Ostro zavijanje', String(turns)],
          ]}
        />
        <View style={styles.flexSpacer} />
        <PrimaryButton title="Oceni voznjo" onPress={() => go('rating')} />
      </View>
    </PhoneFrame>
  );
}
