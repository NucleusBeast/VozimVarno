import { View } from 'react-native';
import MapView, { Marker, Polyline, type LatLng, type Region } from 'react-native-maps';
import Svg, { Circle, Path, Polyline as SvgPolyline } from 'react-native-svg';

import { GREEN } from '../constants';
import { useAppStyles } from '../styles';
import type { RidePoint } from '../types';

export function MapCard({ points = [] }: { points?: RidePoint[] }) {
  const styles = useAppStyles();
  if (points.length < 2) {
    return <FallbackMapCard />;
  }

  const coordinates = pointsToCoordinates(points);
  const region = coordinatesToRegion(coordinates);

  return (
    <View style={styles.mapCard}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={region}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
      >
        <Polyline coordinates={coordinates} strokeColor="#1767b0" strokeWidth={5} />
        <Marker coordinate={coordinates[0]} pinColor={GREEN} />
        <Marker coordinate={coordinates[coordinates.length - 1]} pinColor="#ff6a35" />
      </MapView>
    </View>
  );
}

function FallbackMapCard() {
  const styles = useAppStyles();
  return (
    <View style={styles.mapCard}>
      <Svg width="100%" height="100%" viewBox="0 0 260 150">
        <Path d="M0 120 L70 40 L130 95 L260 20" stroke="#dce4df" strokeWidth="28" fill="none" />
        <Path d="M0 40 L72 68 L170 18 L260 92" stroke="#e6ecef" strokeWidth="22" fill="none" />
        <SvgPolyline
          points="22,112 60,78 83,84 103,48 132,61 158,42 176,34 199,16 226,34"
          fill="none"
          stroke="#1767b0"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="22" cy="112" r="10" fill={GREEN} />
        <Circle cx="226" cy="34" r="10" fill="#ff6a35" />
      </Svg>
    </View>
  );
}

function pointsToCoordinates(points: RidePoint[]): LatLng[] {
  return points.map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));
}

function coordinatesToRegion(coordinates: LatLng[]): Region {
  const lats = coordinates.map((point) => point.latitude);
  const lons = coordinates.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latitudeDelta = Math.max((maxLat - minLat) * 1.4, 0.01);
  const longitudeDelta = Math.max((maxLon - minLon) * 1.4, 0.01);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}
