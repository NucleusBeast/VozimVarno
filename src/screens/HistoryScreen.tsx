import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BottomNav, Header, PhoneFrame } from '../components/layout';
import { ScoreRing } from '../components/metrics';
import { getRideSummaries } from '../services/storage/rideStorage';
import { rideHistory } from '../data';
import { useAppStyles } from '../styles';
import type { GoToScreen, RideSummary } from '../types';
import { formatDuration } from '../utils/formatDuration';

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
  const [storedRides, setStoredRides] = useState<RideSummary[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('vse');
  const styles = useAppStyles();

  useEffect(() => {
    getRideSummaries().then(setStoredRides);
  }, []);

  const filterRides = useCallback(
    (rides: RideSummary[]) => {
      const now = Date.now();
      if (activeTab === 'teden') return rides.filter((r) => now - r.startTime < ONE_WEEK_MS);
      if (activeTab === 'mesec') return rides.filter((r) => now - r.startTime < ONE_MONTH_MS);
      return rides;
    },
    [activeTab],
  );

  const hasRealData = storedRides.length > 0;
  const displayRides = filterRides(storedRides);

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
        <ScrollView contentContainerStyle={styles.historyList} showsVerticalScrollIndicator={false}>
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
        <ScrollView contentContainerStyle={styles.historyList} showsVerticalScrollIndicator={false}>
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
