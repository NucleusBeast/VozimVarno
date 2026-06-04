import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { X } from 'lucide-react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { useState } from 'react';

import { GREEN, YELLOW } from '../constants';
import { useAppStyles } from '../styles';
import type { Incident, RidePoint } from '../types';

type MapCoordinate = Pick<RidePoint, 'latitude' | 'longitude'>;
type MaybeMapCoordinate = {
  latitude?: number;
  longitude?: number;
};

export function MapCard({ points = [], incidents = [] }: { points?: RidePoint[]; incidents?: Incident[] }) {
  const styles = useAppStyles();
  const [isExpanded, setIsExpanded] = useState(false);
  const validPoints = points.filter(hasValidCoordinates);
  const incidentCoordinates = incidents.filter(hasValidCoordinates);
  const project = createProjector([...validPoints, ...incidentCoordinates]);
  const routePoints = project ? validPoints.map(project) : [];
  const incidentPoints = project ? incidentCoordinates.map(project) : [];
  const polyline = routePoints.length > 1
    ? routePoints.map((point) => `${point.x},${point.y}`).join(' ')
    : '22,112 60,78 83,84 103,48 132,61 158,42 176,34 199,16 226,34';
  const start = routePoints[0] ?? { x: 22, y: 112 };
  const end = routePoints[routePoints.length - 1] ?? { x: 226, y: 34 };

  const renderSvgMap = (width: number | string, height: number | string) => (
    <Svg width={width} height={height} viewBox="0 0 260 150">
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
        {incidentPoints.map((point, index) => (
          <Circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r="6" fill={YELLOW} stroke="#ffffff" strokeWidth="2" />
        ))}
        <Circle cx={start.x} cy={start.y} r="10" fill={GREEN} />
        <Circle cx={end.x} cy={end.y} r="10" fill="#ff6a35" />
      </Svg>
  );

  return (
    <>
      <View style={styles.mapCard}>
        {renderSvgMap('100%', '100%')}
        <Pressable
          accessibilityLabel="Odpri zemljevid"
          style={localStyles.mapOpenTarget}
          onPress={() => setIsExpanded(true)}
        />
      </View>
      <Modal visible={isExpanded} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setIsExpanded(false)}>
        <SafeAreaView style={localStyles.expandedShell}>
          <ScrollView contentContainerStyle={localStyles.verticalPan} maximumZoomScale={3} minimumZoomScale={1}>
            <ScrollView horizontal contentContainerStyle={localStyles.horizontalPan}>
              <View style={localStyles.expandedMapSurface}>
                {renderSvgMap(620, 360)}
              </View>
            </ScrollView>
          </ScrollView>
          <Pressable
            accessibilityLabel="Zapri zemljevid"
            style={localStyles.closeButton}
            onPress={() => setIsExpanded(false)}
          >
            <X size={22} color="#07122f" strokeWidth={2.5} />
          </Pressable>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function hasValidCoordinates<T extends MaybeMapCoordinate>(point: T): point is T & MapCoordinate {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function createProjector(points: MapCoordinate[]): null | ((point: MapCoordinate) => { x: number; y: number }) {
  if (points.length < 2) return null;

  const lats = points.map((point) => point.latitude);
  const lons = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latSpan = maxLat - minLat || 0.0001;
  const lonSpan = maxLon - minLon || 0.0001;

  return (point: MapCoordinate) => ({
    x: Math.round(22 + ((point.longitude - minLon) / lonSpan) * 216),
    y: Math.round(128 - ((point.latitude - minLat) / latSpan) * 106),
  });
}

const localStyles = StyleSheet.create({
  mapOpenTarget: {
    ...StyleSheet.absoluteFillObject,
  },
  expandedShell: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  verticalPan: {
    minHeight: '100%',
    padding: 24,
    paddingTop: 76,
  },
  horizontalPan: {
    minWidth: '100%',
  },
  expandedMapSurface: {
    width: 620,
    height: 360,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eff3ed',
    borderWidth: 1,
    borderColor: '#dce3ee',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
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
});
