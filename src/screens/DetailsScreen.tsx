import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';

import { Header, PhoneFrame } from '../components/layout';
import { InfoRows, MapCard, MetricCard } from '../components/metrics';
import { BLUE, YELLOW } from '../constants';
import { getRideById } from '../services/storage/rideStorage';
import { toRideSyncPayload } from '../services/storage/rideSync';
import { formatDuration } from '../utils/formatDuration';
import { useAppStyles } from '../styles';
import type { GoToScreen, Ride } from '../types';
import { Star } from 'lucide-react-native';
import { api } from '../../backend/convex/_generated/api';

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
  const remoteRide = useQuery(api.rides.detailsByIdentifier, rideId ? { rideIdentifier: rideId } : 'skip');
  const syncLocalRide = useMutation(api.rides.syncLocalRide);
  const [localRide, setLocalRide] = useState<Ride | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const styles = useAppStyles();

  const loadLocalRide = useCallback(async () => {
    if (!rideId) {
      setLocalRide(null);
      return null;
    }

    const storedRide = await getRideById(rideId);
    setLocalRide(storedRide);
    return storedRide;
  }, [rideId]);

  useEffect(() => {
    void loadLocalRide();
  }, [loadLocalRide]);

  useEffect(() => {
    if (!localRide) return;
    if (remoteRide === undefined) return;
    if (remoteRide && remoteRide.points.length >= localRide.points.length) return;

    void syncLocalRide(toRideSyncPayload(localRide));
  }, [localRide, remoteRide, syncLocalRide]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const minVisibleTime = wait(1000);

    try {
      await loadLocalRide();
    } finally {
      await minVisibleTime;
      setRefreshing(false);
    }
  }, [loadLocalRide]);

  const ride = selectBestRide(remoteRide as Ride | null | undefined, localRide);
  const points = ride?.points ?? [];
  const incidents = ride?.incidents ?? [];

  return (
    <PhoneFrame>
      <Header title="Podrobnosti voznje" back="history" go={go} />
      <ScrollView
        contentContainerStyle={styles.detailsBody}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BLUE]}
            tintColor={BLUE}
            progressBackgroundColor="#ffffff"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dateCenter}>{ride ? formatRideDate(ride.startTime) : 'Vožnja ni najdena'}</Text>
        <MapCard points={points} incidents={incidents} />
        <View style={styles.metricGrid}>
          <MetricCard label="Razdalja" value={ride ? `${ride.distanceKm.toFixed(2)} km` : '0,00 km'} />
          <MetricCard label="Cas voznje" value={ride ? formatDuration(ride.durationSeconds) : '00:00'} />
          <MetricCard label="Povp. hitrost" value={ride ? `${ride.avgSpeedKmh} km/h` : '0 km/h'} />
        </View>
        <Text style={styles.sectionTitle}>Dogodki</Text>
        <InfoRows
          compact
          rows={[
            ['Incidenti skupaj', `${incidents.length}`],
            ['Hrup opozorila', `${incidents.filter((i) => i.type === 'noise_alert').length}`],
            ['GPS tocke', `${points.length}`],
            ['Najvisja hitrost', ride ? `${ride.maxSpeedKmh} km/h` : '0 km/h'],
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
        {ride?.userRating ? (
          <>
            <Text style={styles.sectionTitle}>Ocena voznje</Text>
            <View style={styles.detailsRatingCard}>
              <View style={styles.detailsStarRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={24}
                    color={star <= ride.userRating! ? YELLOW : '#6b7280'}
                    fill={star <= ride.userRating! ? YELLOW : 'none'}
                    strokeWidth={1.8}
                  />
                ))}
              </View>
              {ride.userComment ? <Text style={styles.detailsCommentText}>{ride.userComment}</Text> : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </PhoneFrame>
  );
}

function selectBestRide(remoteRide: Ride | null | undefined, localRide: Ride | null): Ride | null {
  if (!remoteRide) return localRide;
  if (!localRide) return remoteRide;
  if (remoteRide.points.length < localRide.points.length) return localRide;
  return remoteRide;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
