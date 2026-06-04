import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useConvexAuth } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';

import { BottomNav, Header, PhoneFrame } from '../components/layout';
import { ScoreRing } from '../components/metrics';
import { getRides } from '../services/storage/rideStorage';
import { toRideSyncPayload } from '../services/storage/rideSync';
import { rideHistory } from '../data';
import { useAppStyles } from '../styles';
import type { GoToScreen, Ride, RideSummary } from '../types';
import { formatDuration } from '../utils/formatDuration';
import { api } from '../../backend/convex/_generated/api';
import { BLUE } from '../constants';

type Tab = 'vse' | 'teden' | 'mesec';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function formatRideDate(timestamp: number): string {
  return new Intl.DateTimeFormat('sl-SI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function HistoryScreen({ go }: { go: GoToScreen }) {
  const [storedRides, setStoredRides] = useState<Ride[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('vse');
  const { isAuthenticated } = useConvexAuth();
  const convexRides = useQuery(api.rides.history);
  const syncLocalRide = useMutation(api.rides.syncLocalRide);
  const styles = useAppStyles();

  const loadStoredRides = useCallback(async () => {
    const rides = await getRides();
    setStoredRides(rides);
    return rides;
  }, []);

  useEffect(() => {
    void loadStoredRides();
  }, [loadStoredRides]);

  const getRidesNeedingSync = useCallback((rides: Ride[]) => {
    if (!isAuthenticated || convexRides === undefined) return [];
    const convexByClientId = new Map(convexRides.map((ride) => [ride.clientRideId, ride]));
    return rides.filter((ride) => {
      const convexRide = convexByClientId.get(ride.id);
      return (
        !convexRide ||
        convexRide.userRating !== ride.userRating ||
        (convexRide.userComment ?? '') !== (ride.userComment ?? '')
      );
    });
  }, [convexRides, isAuthenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const minVisibleTime = wait(1000);

    try {
      const latestRides = await loadStoredRides();
      const ridesToSync = getRidesNeedingSync(latestRides);

      for (const ride of ridesToSync) {
        await syncLocalRide(toRideSyncPayload(ride));
      }
    } finally {
      await minVisibleTime;
      setRefreshing(false);
    }
  }, [getRidesNeedingSync, loadStoredRides, syncLocalRide]);

  const filterRides = useCallback(
    (rides: RideSummary[]) => {
      const now = Date.now();
      if (activeTab === 'teden') return rides.filter((r) => now - r.startTime < ONE_WEEK_MS);
      if (activeTab === 'mesec') return rides.filter((r) => now - r.startTime < ONE_MONTH_MS);
      return rides;
    },
    [activeTab],
  );

  const storedRideSummaries = useMemo<RideSummary[]>(() => {
    return storedRides.map((ride) => ({
      id: ride.id,
      clientRideId: ride.id,
      startTime: ride.startTime,
      durationSeconds: ride.durationSeconds,
      distanceKm: ride.distanceKm,
      score: ride.score,
      incidentCount: ride.incidents.length,
      userRating: ride.userRating,
      userComment: ride.userComment,
    }));
  }, [storedRides]);

  const remoteOnlyRides = useMemo<RideSummary[]>(() => {
    if (convexRides === undefined) return [];
    const localIds = new Set(storedRides.map((ride) => ride.id));
    return convexRides
      .filter((ride) => !ride.clientRideId || !localIds.has(ride.clientRideId))
      .map((ride) => ({
        id: ride.clientRideId ?? ride.id,
        clientRideId: ride.clientRideId,
        startTime: ride.startTime,
        durationSeconds: ride.durationSeconds,
        distanceKm: ride.distanceKm,
        score: ride.score,
        incidentCount: ride.incidentCount,
        userRating: ride.userRating,
        userComment: ride.userComment,
      }));
  }, [convexRides, storedRides]);

  const allRides = useMemo(() => {
    return [...storedRideSummaries, ...remoteOnlyRides].sort((a, b) => b.startTime - a.startTime);
  }, [remoteOnlyRides, storedRideSummaries]);

  const hasRealData = allRides.length > 0;
  const displayRides = filterRides(allRides);
  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[BLUE]}
      tintColor={BLUE}
      progressBackgroundColor="#ffffff"
    />
  );

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'vse', label: 'Vse' },
    { key: 'teden', label: 'Ta teden' },
    { key: 'mesec', label: 'Ta mesec' },
  ];

  return (
    <PhoneFrame>
      <Header title="Moje voznje" back="home" go={go} />
      <View style={styles.tabs}>
        {tabs.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {hasRealData ? (
        <ScrollView
          contentContainerStyle={styles.historyList}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          {displayRides.length === 0 ? (
            <Text style={styles.emptyState}>Ni vozenj v izbranem obdobju.</Text>
          ) : (
            displayRides.map((ride) => (
              <Pressable
                key={ride.id}
                style={styles.historyItem}
                onPress={() => go('details', { rideId: ride.id })}
              >
                <View>
                  <Text style={styles.historyDate}>{formatRideDate(ride.startTime)}</Text>
                  <Text style={styles.historyMeta}>
                    {ride.distanceKm.toFixed(1)} km  •  {formatDuration(ride.durationSeconds)}
                  </Text>
                </View>
                <ScoreRing value={ride.score} size={48} stroke={4} small />
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.historyList}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          {rideHistory.map((ride) => (
            <Pressable key={ride.date} style={styles.historyItem} onPress={() => go('details')}>
              <View>
                <Text style={styles.historyDate}>{ride.date}</Text>
                <Text style={styles.historyMeta}>
                  {ride.distance}  •  {ride.time}
                </Text>
              </View>
              <ScoreRing value={ride.score} size={48} stroke={4} small />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <BottomNav active="history" go={go} />
    </PhoneFrame>
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
