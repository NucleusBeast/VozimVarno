import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, SafeAreaView, StyleSheet, View } from 'react-native';
import { X } from 'lucide-react-native';
import MapView, { Marker, Polyline, type LatLng, type Region } from 'react-native-maps';
import Svg, { Circle, Path, Polyline as SvgPolyline } from 'react-native-svg';

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
  const mapRef = useRef<MapView>(null);
  const expandedMapRef = useRef<MapView>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isExpandedMapReady, setIsExpandedMapReady] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const coordinates = useMemo(() => pointsToCoordinates(points), [points]);
  const incidentCoordinates = useMemo(() => pointsToCoordinates(incidents.filter(hasValidCoordinates)), [incidents]);
  const visibleCoordinates = useMemo(
    () => [...coordinates, ...incidentCoordinates],
    [coordinates, incidentCoordinates],
  );

  useEffect(() => {
    if (!isMapReady || visibleCoordinates.length < 2) return;

    mapRef.current?.fitToCoordinates(visibleCoordinates, {
      animated: false,
      edgePadding: { top: 28, right: 28, bottom: 28, left: 28 },
    });
  }, [isMapReady, visibleCoordinates]);

  useEffect(() => {
    if (!isExpanded || !isExpandedMapReady || visibleCoordinates.length < 2) return;

    expandedMapRef.current?.fitToCoordinates(visibleCoordinates, {
      animated: false,
      edgePadding: { top: 72, right: 36, bottom: 48, left: 36 },
    });
  }, [isExpanded, isExpandedMapReady, visibleCoordinates]);

  if (coordinates.length < 2) {
    return <FallbackMapCard />;
  }

  const region = coordinatesToRegion(visibleCoordinates);
  const renderMapContent = () => (
    <>
      <Polyline coordinates={coordinates} strokeColor="#1767b0" strokeWidth={5} />
      {incidentCoordinates.map((coordinate, index) => (
        <Marker key={`${coordinate.latitude}-${coordinate.longitude}-${index}`} coordinate={coordinate} pinColor={YELLOW} />
      ))}
      <Marker coordinate={coordinates[0]} pinColor={GREEN} />
      <Marker coordinate={coordinates[coordinates.length - 1]} pinColor="#ff6a35" />
    </>
  );

  return (
    <>
      <View style={styles.mapCard}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          onMapReady={() => setIsMapReady(true)}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          toolbarEnabled={false}
        >
          {renderMapContent()}
        </MapView>
        <Pressable
          accessibilityLabel="Odpri zemljevid"
          style={localStyles.mapOpenTarget}
          onPress={() => setIsExpanded(true)}
        />
      </View>
      <Modal visible={isExpanded} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setIsExpanded(false)}>
        <SafeAreaView style={localStyles.expandedShell}>
          <MapView
            ref={expandedMapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            onMapReady={() => setIsExpandedMapReady(true)}
            scrollEnabled
            zoomEnabled
            pitchEnabled
            rotateEnabled
            toolbarEnabled={false}
          >
            {renderMapContent()}
          </MapView>
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

function hasValidCoordinates<T extends MaybeMapCoordinate>(point: T): point is T & MapCoordinate {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function pointsToCoordinates(points: MapCoordinate[]): LatLng[] {
  return points.filter(hasValidCoordinates).map((point) => ({
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

const localStyles = StyleSheet.create({
  mapOpenTarget: {
    ...StyleSheet.absoluteFillObject,
  },
  expandedShell: {
    flex: 1,
    backgroundColor: '#ffffff',
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
});
