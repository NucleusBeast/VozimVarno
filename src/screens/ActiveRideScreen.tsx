import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

import { Header, PhoneFrame } from '../components/layout';
import { MetricCard, SpeedGauge } from '../components/metrics';
import { PrimaryButton } from '../components/PrimaryButton';
import { formatDuration } from '../utils/formatDuration';
import { styles } from '../styles';
import type { GoToScreen } from '../types';

export function ActiveRideScreen({
  go,
  elapsedSeconds,
  setElapsedSeconds,
}: {
  go: GoToScreen;
  elapsedSeconds: number;
  setElapsedSeconds: React.Dispatch<React.SetStateAction<number>>;
}) {
  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [setElapsedSeconds]);

  return (
    <PhoneFrame>
      <Header title="Voznja v teku" go={go} />
      <View style={styles.activeBody}>
        <View style={styles.timerRow}>
          <View style={styles.redDot} />
          <Text style={styles.timerText}>{formatDuration(elapsedSeconds)}</Text>
        </View>
        <SpeedGauge value={72} />
        <View style={styles.metricGrid}>
          <MetricCard label="Pospeski" value="3" />
          <MetricCard label="Zaviranja" value="1" />
          <MetricCard label="Odst. telefona" value="0" />
        </View>
        <View style={styles.gpsRow}>
          <View style={styles.greenDot} />
          <Text style={styles.gpsText}>GPS: Odlicen</Text>
        </View>
        <PrimaryButton title="Zakljuci voznjo" onPress={() => go('summary')} outline danger />
      </View>
    </PhoneFrame>
  );
}
