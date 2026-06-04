import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { Camera, Mic, X } from 'lucide-react-native';

import { Header, PhoneFrame } from '../components/layout';
import { MetricCard, SpeedGauge } from '../components/metrics';
import { PrimaryButton } from '../components/PrimaryButton';
import { GREEN, RED, YELLOW } from '../constants';
import { useFatigueCamera } from '../hooks/useFatigueCamera';
import type { GpsStatus } from '../hooks/useRideSession';
import type { FaceBox, FatigueResult } from '../services/camera';
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
  const [isCameraExpanded, setIsCameraExpanded] = useState(false);

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
  const faceBox = fatigueResult?.faceBox;

  const renderCameraContent = (expanded = false) => (
    <>
      {cameraPreviewEnabled ? (
        <CameraView
          ref={cameraRef}
          facing="front"
          style={expanded ? localStyles.expandedCamera : styles.cameraPreview}
        />
      ) : (
        <View style={[expanded ? localStyles.expandedCamera : styles.cameraPreview, styles.cameraPreviewOff]}>
          <Camera color="#ffffff" size={expanded ? 34 : 24} />
          <Text style={styles.cameraPreviewOffText}>Kamera izklopljena</Text>
        </View>
      )}
      {cameraPreviewEnabled ? <FaceBoxOverlay faceBox={faceBox} /> : null}
      <View style={styles.cameraPreviewBadge}>
        <View style={styles.redDot} />
        <Text style={styles.cameraPreviewBadgeText}>
          {cameraPreviewEnabled ? (azureEnabled ? 'KAMERA + ML' : 'KAMERA') : 'OFF'}
        </Text>
      </View>
    </>
  );

  return (
    <PhoneFrame>
      <Header title="Voznja v teku" go={go} />
      <View style={styles.activeBody}>
        <View style={styles.timerRow}>
          <View style={styles.redDot} />
          <Text style={styles.timerText}>{formatDuration(elapsedSeconds)}</Text>
        </View>

        <View style={styles.cameraPreviewCard}>
          {!isCameraExpanded ? renderCameraContent() : null}
          <Pressable
            accessibilityLabel="Odpri kamero"
            style={localStyles.cameraOpenTarget}
            onPress={() => setIsCameraExpanded(true)}
          />
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
      <Modal
        visible={isCameraExpanded}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsCameraExpanded(false)}
      >
        <SafeAreaView style={localStyles.expandedShell}>
          <View style={localStyles.expandedCameraSurface}>{renderCameraContent(true)}</View>
          <Pressable
            accessibilityLabel="Zapri kamero"
            style={localStyles.closeButton}
            onPress={() => setIsCameraExpanded(false)}
          >
            <X size={22} color="#07122f" strokeWidth={2.5} />
          </Pressable>
        </SafeAreaView>
      </Modal>
    </PhoneFrame>
  );
}

function FaceBoxOverlay({ faceBox }: { faceBox?: FaceBox }) {
  if (!faceBox) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        localStyles.faceBox,
        {
          left: `${faceBox.x * 100}%`,
          top: `${faceBox.y * 100}%`,
          width: `${faceBox.width * 100}%`,
          height: `${faceBox.height * 100}%`,
        },
      ]}
    />
  );
}

const localStyles = StyleSheet.create({
  cameraOpenTarget: {
    ...StyleSheet.absoluteFillObject,
  },
  expandedShell: {
    flex: 1,
    backgroundColor: '#07122f',
  },
  expandedCameraSurface: {
    flex: 1,
    backgroundColor: '#111827',
    overflow: 'hidden',
  },
  expandedCamera: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dce3ee',
  },
  faceBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#23b54b',
    borderRadius: 6,
    backgroundColor: 'rgba(35, 181, 75, 0.12)',
  },
});
