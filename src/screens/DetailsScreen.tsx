import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Header, PhoneFrame } from '../components/layout';
import { InfoRows, MapCard, MetricCard } from '../components/metrics';
import { getRideById } from '../services/storage/rideStorage';
import { formatDuration } from '../utils/formatDuration';
import { useAppStyles } from '../styles';
import type { GoToScreen, Ride } from '../types';

function formatRideDate(timestamp: number): string {
  return new Intl.DateTimeFormat('sl-SI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function DetailsScreen({ go, rideId }: { go: GoToScreen; rideId?: string }) {
  const [ride, setRide] = useState<Ride | null>(null);
  const styles = useAppStyles();

  useEffect(() => {
    if (!rideId) return;
    getRideById(rideId).then(setRide);
  }, [rideId]);

  const points = ride?.points ?? [];
  const incidents = ride?.incidents ?? [];

  return (
    <PhoneFrame>
      <Header title="Podrobnosti voznje" back="history" go={go} />
      <ScrollView contentContainerStyle={styles.detailsBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.dateCenter}>{ride ? formatRideDate(ride.startTime) : 'Demo voznja'}</Text>
        <MapCard points={points} />
        <View style={styles.metricGrid}>
          <MetricCard label="Razdalja" value={ride ? `${ride.distanceKm.toFixed(2)} km` : '18,7 km'} />
          <MetricCard label="Cas voznje" value={ride ? formatDuration(ride.durationSeconds) : '00:24:18'} />
          <MetricCard label="Povp. hitrost" value={ride ? `${ride.avgSpeedKmh} km/h` : '46 km/h'} />
        </View>
        <Text style={styles.sectionTitle}>Dogodki</Text>
        <InfoRows
          compact
          rows={ride ? [
            ['Incidenti skupaj', `${incidents.length}`],
            ['Hrup opozorila', `${incidents.filter((i) => i.type === 'noise_alert').length}`],
            ['GPS tocke', `${points.length}`],
            ['Najvisja hitrost', `${ride.maxSpeedKmh} km/h`],
          ] : [
            ['Pospeski', '5'],
            ['Zaviranja', '2'],
            ['Odstopanja hitrosti', '1'],
          ]}
        />
        {ride?.weather ? (
          <>
            <Text style={styles.sectionTitle}>Kontekst voznje</Text>
            <InfoRows
              compact
              rows={[
                ['Vreme', ride.weather.condition ?? 'Ni podatka'],
                ['Temperatura', ride.weather.temperatureC !== undefined ? `${Math.round(ride.weather.temperatureC)} °C` : 'Ni podatka'],
                ['Veter', ride.weather.windSpeedKmh !== undefined ? `${Math.round(ride.weather.windSpeedKmh)} km/h` : 'Ni podatka'],
              ]}
            />
          </>
        ) : null}
      </ScrollView>
    </PhoneFrame>
  );
}
