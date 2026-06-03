import { View } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';

import { GREEN } from '../constants';
import { styles } from '../styles';
import type { RidePoint } from '../types';

export function MapCard({ points = [] }: { points?: RidePoint[] }) {
  const routePoints = normalizeRoutePoints(points);
  const polyline = routePoints.length > 1
    ? routePoints.map((point) => `${point.x},${point.y}`).join(' ')
    : '22,112 60,78 83,84 103,48 132,61 158,42 176,34 199,16 226,34';
  const start = routePoints[0] ?? { x: 22, y: 112 };
  const end = routePoints[routePoints.length - 1] ?? { x: 226, y: 34 };

  return (
    <View style={styles.mapCard}>
      <Svg width="100%" height="100%" viewBox="0 0 260 150">
        <Path d="M0 120 L70 40 L130 95 L260 20" stroke="#dce4df" strokeWidth="28" fill="none" />
        <Path d="M0 40 L72 68 L170 18 L260 92" stroke="#e6ecef" strokeWidth="22" fill="none" />
        <Polyline
          points={polyline}
          fill="none"
          stroke="#1767b0"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={start.x} cy={start.y} r="10" fill={GREEN} />
        <Circle cx={end.x} cy={end.y} r="10" fill="#ff6a35" />
      </Svg>
    </View>
  );
}

function normalizeRoutePoints(points: RidePoint[]): Array<{ x: number; y: number }> {
  if (points.length < 2) return [];

  const sampled = points.length > 24
    ? points.filter((_, index) => index % Math.ceil(points.length / 24) === 0 || index === points.length - 1)
    : points;
  const lats = sampled.map((point) => point.latitude);
  const lons = sampled.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latSpan = maxLat - minLat || 0.0001;
  const lonSpan = maxLon - minLon || 0.0001;

  return sampled.map((point) => ({
    x: Math.round(22 + ((point.longitude - minLon) / lonSpan) * 216),
    y: Math.round(128 - ((point.latitude - minLat) / latSpan) * 106),
  }));
}
