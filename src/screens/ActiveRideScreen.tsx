import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { Camera, Mic } from 'lucide-react-native';

import { Header, PhoneFrame } from '../components/layout';
import { MetricCard, SpeedGauge } from '../components/metrics';
import { PrimaryButton } from '../components/PrimaryButton';
import { GREEN, RED, YELLOW } from '../constants';
import { useFatigueCamera } from '../hooks/useFatigueCamera';
import type { GpsStatus } from '../hooks/useRideSession';
import type { FatigueResult } from '../services/camera';
import { loadSettings } from '../services/storage/settingsStorage';
import { useAppStyles } from '../styles';
import type { GoToScreen, Incident } from '../types';
import { formatDuration } from '../utils/formatDuration';

type Props = {
  go: GoToScreen;
  elapsedSeconds: number;
  incidents: Incident[];
  currentSpeedKmh: number;
  gpsStatus: GpsStatus;
  fatigueResult: FatigueResult | null;
  microphoneActive: boolean;
  onEndRide: () => void;
};

const GPS_LABEL: Record<GpsStatus, string> = {
  good: 'GPS: Odlicen',
  poor: 'GPS: Slab signal',
  off: 'GPS: Ni signala',
};

const GPS_COLOR: Record<GpsStatus, string> = {
  good: GREEN,
  poor: YELLOW,
  off: RED,
};

function fatigueInfo(result: FatigueResult): { color: string; label: string } {
  if (result.score < 10) return { color: GREEN, label: 'Utrujenost: V redu' };
  if (result.score < 30) return { color: YELLOW, label: 'Utrujenost: Pozor' };
  return { color: RED, label: 'Utrujenost: Opozorilo!' };
}

export function ActiveRideScreen({
  go,
  elapsedSeconds,
  incidents,
  currentSpeedKmh,
  gpsStatus,
  fatigueResult,
  microphoneActive,
  onEndRide,
}: Props) {
  const styles = useAppStyles();
  const { cameraRef, start, azureEnabled } = useFatigueCamera();
  const [cameraPreviewEnabled, setCameraPreviewEnabled] = useState(true);

  useEffect(() => {
    void start();
  }, [start]);

  useEffect(() => {
    let mounted = true;
    void loadSettings().then((settings) => {
      if (mounted) setCameraPreviewEnabled(settings.cameraEnabled);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const accelerations = useMemo(
    () => incidents.filter((i) => i.type === 'hard_acceleration').length,
    [incidents],
  );
  const brakings = useMemo(
    () => incidents.filter((i) => i.type === 'hard_braking').length,
    [incidents],
  );
  const speedExceeded = useMemo(
    () => incidents.filter((i) => i.type === 'speed_exceeded').length,
    [incidents],
  );
  const noiseAlerts = useMemo(
    () => incidents.filter((i) => i.type === 'noise_alert').length,
    [incidents],
  );

  const fatigue = fatigueResult ? fatigueInfo(fatigueResult) : null;
  const noiseColor = noiseAlerts === 0 ? GREEN : noiseAlerts < 3 ? YELLOW : RED;

  return (
    <PhoneFrame>
      <Header title="Voznja v teku" go={go} />
      <View style={styles.activeBody}>
        <View style={styles.timerRow}>
          <View style={styles.redDot} />
          <Text style={styles.timerText}>{formatDuration(elapsedSeconds)}</Text>
        </View>

        <View style={styles.cameraPreviewCard}>
          {cameraPreviewEnabled ? (
            <CameraView ref={cameraRef} facing="front" style={styles.cameraPreview} />
          ) : (
            <View style={[styles.cameraPreview, styles.cameraPreviewOff]}>
              <Camera color="#ffffff" size={24} />
              <Text style={styles.cameraPreviewOffText}>Kamera izklopljena</Text>
            </View>
          )}
          <View style={styles.cameraPreviewBadge}>
            <View style={styles.redDot} />
            <Text style={styles.cameraPreviewBadgeText}>
              {cameraPreviewEnabled ? (azureEnabled ? 'KAMERA + ML' : 'KAMERA') : 'OFF'}
            </Text>
          </View>
        </View>

        <SpeedGauge value={Math.round(currentSpeedKmh)} />

        <View style={styles.metricGrid}>
          <MetricCard label="Pospeški" value={String(accelerations)} />
          <MetricCard label="Zaviranja" value={String(brakings)} />
          <MetricCard label="Odst. hitrosti" value={String(speedExceeded)} />
        </View>

        <View style={[styles.gpsRow, { marginBottom: 8 }]}>
          <View style={[styles.greenDot, { backgroundColor: GPS_COLOR[gpsStatus] }]} />
          <Text style={styles.gpsText}>{GPS_LABEL[gpsStatus]}</Text>
        </View>

        <View style={[styles.gpsRow, { marginTop: 0, marginBottom: fatigue ? 8 : 28 }]}>
          <Mic color={microphoneActive ? noiseColor : RED} size={16} />
          <Text style={styles.gpsText}>
            {microphoneActive
              ? noiseAlerts === 0
                ? 'Mikrofon snema: Tiho'
                : `Mikrofon snema: ${noiseAlerts} opozorilo${noiseAlerts === 1 ? '' : 'v'}`
              : 'Mikrofon: Ni aktiven'}
          </Text>
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
