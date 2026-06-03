import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Header, PhoneFrame } from '../components/layout';
import { MetricCard, SpeedGauge } from '../components/metrics';
import { PrimaryButton } from '../components/PrimaryButton';
import { GREEN, RED, YELLOW } from '../constants';
import type { GpsStatus } from '../hooks/useRideSession';
import type { FatigueResult } from '../services/camera';
import { styles } from '../styles';
import type { GoToScreen, Incident } from '../types';
import { formatDuration } from '../utils/formatDuration';

type Props = {
  go: GoToScreen;
  elapsedSeconds: number;
  incidents: Incident[];
  currentSpeedKmh: number;
  gpsStatus: GpsStatus;
  fatigueResult: FatigueResult | null;
  onEndRide: () => void;
};

const GPS_LABEL: Record<GpsStatus, string> = {
  good: 'GPS: Odličen',
  poor: 'GPS: Slab',
  off: 'GPS: Ni signala',
};

const GPS_COLOR: Record<GpsStatus, string> = {
  good: GREEN,
  poor: YELLOW,
  off: RED,
};

function fatigueInfo(result: FatigueResult): { color: string; label: string } {
  if (result.score < 30) return { color: GREEN, label: 'Utrujenost: V redu' };
  if (result.score < 60) return { color: YELLOW, label: 'Utrujenost: Pozor' };
  return { color: RED, label: 'Utrujenost: Opozorilo!' };
}

export function ActiveRideScreen({
  go,
  elapsedSeconds,
  incidents,
  currentSpeedKmh,
  gpsStatus,
  fatigueResult,
  onEndRide,
}: Props) {
  const accelerations = useMemo(
    () => incidents.filter((i) => i.type === 'hard_acceleration').length,
    [incidents],
  );
  const brakings = useMemo(
    () => incidents.filter((i) => i.type === 'hard_braking').length,
    [incidents],
  );
  const turns = useMemo(
    () => incidents.filter((i) => i.type === 'sharp_turn').length,
    [incidents],
  );

  const fatigue = fatigueResult ? fatigueInfo(fatigueResult) : null;

  return (
    <PhoneFrame>
      <Header title="Voznja v teku" go={go} />
      <View style={styles.activeBody}>
        <View style={styles.timerRow}>
          <View style={styles.redDot} />
          <Text style={styles.timerText}>{formatDuration(elapsedSeconds)}</Text>
        </View>

        <SpeedGauge value={Math.round(currentSpeedKmh)} />

        <View style={styles.metricGrid}>
          <MetricCard label="Pospeski" value={String(accelerations)} />
          <MetricCard label="Zaviranja" value={String(brakings)} />
          <MetricCard label="Zavoji" value={String(turns)} />
        </View>

        <View style={[styles.gpsRow, fatigue ? { marginBottom: 8 } : undefined]}>
          <View style={[styles.greenDot, { backgroundColor: GPS_COLOR[gpsStatus] }]} />
          <Text style={styles.gpsText}>{GPS_LABEL[gpsStatus]}</Text>
        </View>

        {fatigue ? (
          <View style={[styles.gpsRow, { marginTop: 0, marginBottom: 28 }]}>
            <View style={[styles.greenDot, { backgroundColor: fatigue.color }]} />
            <Text style={styles.gpsText}>{fatigue.label}</Text>
          </View>
        ) : null}

        <View style={styles.flexSpacer} />
        <PrimaryButton title="Zakljuci voznjo" onPress={onEndRide} outline danger />
      </View>
    </PhoneFrame>
  );
}
