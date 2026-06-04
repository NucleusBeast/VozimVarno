import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { BottomNav, Header, PhoneFrame } from '../components/layout';
import { BLUE, GREEN, RED, YELLOW } from '../constants';
import { getRideSummaries } from '../services/storage/rideStorage';
import { useAppStyles } from '../styles';
import { useTheme } from '../theme/ThemeContext';
import type { GoToScreen, RideSummary } from '../types';

const CHART_WIDTH = 300;
const CHART_HEIGHT = 150;
const PAD_X = 24;
const PAD_TOP = 18;
const PAD_BOTTOM = 28;

function isThisMonth(timestamp: number): boolean {
  const rideDate = new Date(timestamp);
  const now = new Date();
  return rideDate.getFullYear() === now.getFullYear() && rideDate.getMonth() === now.getMonth();
}

function shortDate(timestamp: number): string {
  return new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'short' }).format(new Date(timestamp));
}

function formatMonth(): string {
  return new Intl.DateTimeFormat('sl-SI', { month: 'long', year: 'numeric' }).format(new Date());
}

function clampScore(score: number): number {
  return Math.min(Math.max(score, 0), 100);
}

function ChartFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const styles = useAppStyles();
  return (
    <View style={styles.resultChartCard}>
      <View style={styles.resultChartHeader}>
        <Text style={styles.resultChartTitle}>{title}</Text>
        <Text style={styles.resultChartSubtitle}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

function ScoreTrendChart({ rides }: { rides: RideSummary[] }) {
  const { colors } = useTheme();
  const plotWidth = CHART_WIDTH - PAD_X * 2;
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const points = rides.map((ride, index) => {
    const x = rides.length === 1 ? CHART_WIDTH / 2 : PAD_X + (index / (rides.length - 1)) * plotWidth;
    const y = PAD_TOP + (1 - clampScore(ride.score) / 100) * plotHeight;
    return { x, y, ride };
  });
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
      {[50, 75, 100].map((value) => {
        const y = PAD_TOP + (1 - value / 100) * plotHeight;
        return (
          <Line
            key={value}
            x1={PAD_X}
            x2={CHART_WIDTH - PAD_X}
            y1={y}
            y2={y}
            stroke={colors.svgTrack}
            strokeWidth={1}
          />
        );
      })}
      {points.length > 1 ? <Polyline points={polyline} fill="none" stroke={BLUE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {points.map(({ x, y, ride }) => (
        <Circle key={ride.id} cx={x} cy={y} r={5} fill={ride.score >= 80 ? GREEN : ride.score >= 70 ? YELLOW : RED} />
      ))}
      <SvgText x={PAD_X} y={CHART_HEIGHT - 7} fill={colors.textMuted} fontSize={10}>
        {rides[0] ? shortDate(rides[0].startTime) : ''}
      </SvgText>
      <SvgText x={CHART_WIDTH - PAD_X} y={CHART_HEIGHT - 7} fill={colors.textMuted} fontSize={10} textAnchor="end">
        {rides.length > 0 ? shortDate(rides[rides.length - 1].startTime) : ''}
      </SvgText>
    </Svg>
  );
}

function IncidentBarChart({ rides }: { rides: RideSummary[] }) {
  const { colors } = useTheme();
  const plotWidth = CHART_WIDTH - PAD_X * 2;
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const maxIncidents = Math.max(1, ...rides.map((ride) => ride.incidentCount));
  const barGap = 8;
  const barWidth = Math.max(12, (plotWidth - barGap * Math.max(rides.length - 1, 0)) / Math.max(rides.length, 1));

  return (
    <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
      <Line
        x1={PAD_X}
        x2={CHART_WIDTH - PAD_X}
        y1={PAD_TOP + plotHeight}
        y2={PAD_TOP + plotHeight}
        stroke={colors.svgTrack}
        strokeWidth={1}
      />
      {rides.map((ride, index) => {
        const height = (ride.incidentCount / maxIncidents) * plotHeight;
        const x = rides.length === 1 ? CHART_WIDTH / 2 - barWidth / 2 : PAD_X + index * (barWidth + barGap);
        const y = PAD_TOP + plotHeight - height;
        return (
          <Rect
            key={ride.id}
            x={x}
            y={y}
            width={barWidth}
            height={Math.max(height, 3)}
            rx={4}
            fill={ride.incidentCount <= 1 ? GREEN : ride.incidentCount <= 3 ? YELLOW : RED}
          />
        );
      })}
      <SvgText x={PAD_X} y={CHART_HEIGHT - 7} fill={colors.textMuted} fontSize={10}>
        {rides[0] ? shortDate(rides[0].startTime) : ''}
      </SvgText>
      <SvgText x={CHART_WIDTH - PAD_X} y={CHART_HEIGHT - 7} fill={colors.textMuted} fontSize={10} textAnchor="end">
        {rides.length > 0 ? shortDate(rides[rides.length - 1].startTime) : ''}
      </SvgText>
    </Svg>
  );
}

export function ResultsScreen({ go }: { go: GoToScreen }) {
  const [rides, setRides] = useState<RideSummary[]>([]);
  const styles = useAppStyles();

  useEffect(() => {
    getRideSummaries().then(setRides);
  }, []);

  const monthRides = useMemo(
    () => rides.filter((ride) => isThisMonth(ride.startTime)).sort((a, b) => a.startTime - b.startTime),
    [rides],
  );

  const avgScore =
    monthRides.length > 0
      ? Math.round(monthRides.reduce((sum, ride) => sum + ride.score, 0) / monthRides.length)
      : 0;
  const totalDistance = Math.round(monthRides.reduce((sum, ride) => sum + ride.distanceKm, 0) * 10) / 10;
  const totalIncidents = monthRides.reduce((sum, ride) => sum + ride.incidentCount, 0);

  return (
    <PhoneFrame>
      <Header title="Rezultati" back="home" go={go} />
      <ScrollView contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsHero}>
          <Text style={styles.resultsMonth}>{formatMonth()}</Text>
          <Text style={styles.resultsScore}>{monthRides.length > 0 ? avgScore : '-'}</Text>
          <Text style={styles.resultsScoreLabel}>povprecna ocena varnosti</Text>
        </View>

        <View style={styles.resultStatsRow}>
          <View style={styles.resultStatTile}>
            <Text style={styles.resultStatValue}>{monthRides.length}</Text>
            <Text style={styles.resultStatLabel}>vozenj</Text>
          </View>
          <View style={styles.resultStatTile}>
            <Text style={styles.resultStatValue}>{totalDistance.toFixed(1)}</Text>
            <Text style={styles.resultStatLabel}>km</Text>
          </View>
          <View style={styles.resultStatTile}>
            <Text style={styles.resultStatValue}>{totalIncidents}</Text>
            <Text style={styles.resultStatLabel}>dogodkov</Text>
          </View>
        </View>

        {monthRides.length === 0 ? (
          <Text style={styles.emptyState}>Ta mesec se ni shranjenih rezultatov.</Text>
        ) : (
          <>
            <ChartFrame title="Ocena po voznjah" subtitle="Trend varne voznje">
              <ScoreTrendChart rides={monthRides} />
            </ChartFrame>
            <ChartFrame title="Dogodki po voznjah" subtitle="Manj je bolje">
              <IncidentBarChart rides={monthRides} />
            </ChartFrame>
          </>
        )}
      </ScrollView>
      <BottomNav active="home" go={go} />
    </PhoneFrame>
  );
}
