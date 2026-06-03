import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ChevronRight } from 'lucide-react-native';

import { GREEN, YELLOW } from '../constants';
import { useAppStyles } from '../styles';
import { useTheme } from '../theme/ThemeContext';
import type { IconType } from '../types';
export { MapCard } from './MapCard';

export function MetricCard({ label, value }: { label: string; value: string }) {
  const styles = useAppStyles();
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export function InfoRows({ rows, compact = false }: { rows: Array<[string, string]>; compact?: boolean }) {
  const styles = useAppStyles();
  return (
    <View style={[styles.infoRows, compact && styles.infoRowsCompact]}>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.infoRow}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  const styles = useAppStyles();
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function SettingsRow({
  title,
  subtitle,
  Icon,
  trailing,
  onPress,
}: {
  title: string;
  subtitle?: string;
  Icon: IconType;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  const styles = useAppStyles();
  const { colors } = useTheme();
  return (
    <Pressable style={styles.settingsRow} onPress={onPress}>
      <Icon size={20} color={colors.text} />
      <View style={styles.settingsRowText}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle ? <Text style={styles.settingsSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.settingsTrailing}>
        {trailing ?? <ChevronRight size={18} color={colors.textMuted} />}
      </View>
    </Pressable>
  );
}

export function ScoreRing({
  value,
  size,
  stroke,
  small = false,
}: {
  value: number;
  size: number;
  stroke: number;
  small?: boolean;
}) {
  const styles = useAppStyles();
  const { colors } = useTheme();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  const color = value >= 80 ? GREEN : value >= 75 ? YELLOW : '#e0ba00';

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.svgTrack} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringLabel}>
        <Text style={[styles.ringValue, small && styles.ringValueSmall]}>{value}</Text>
        {!small ? <Text style={styles.ringTotal}>/100</Text> : null}
      </View>
    </View>
  );
}

export function SpeedGauge({ value }: { value: number }) {
  const styles = useAppStyles();
  const { colors } = useTheme();
  const progress = Math.min(Math.max(value / 100, 0), 1);
  const radius = 84;
  const stroke = 13;
  const arcLength = Math.PI * radius;
  const arcPath = 'M 36 126 A 84 84 0 0 1 204 126';

  return (
    <View style={styles.speedWrap}>
      <Svg width={240} height={154} viewBox="0 0 240 154">
        <Path d={arcPath} stroke={colors.svgTrack} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        <Path
          d={arcPath}
          stroke="#1268b9"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arcLength * progress} ${arcLength}`}
        />
      </Svg>
      <View style={styles.speedTextBlock}>
        <Text style={styles.speedValue}>{value}</Text>
        <Text style={styles.speedUnit}>km/h</Text>
      </View>
    </View>
  );
}
