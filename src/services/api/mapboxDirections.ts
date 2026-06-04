import type { RidePoint } from '../../types';

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_TOKEN ?? '';
const MAX_DIRECTIONS_COORDINATES = 25;

type MaybeCoordinate = {
  latitude?: number;
  longitude?: number;
};

type MapboxDirectionsResponse = {
  routes?: Array<{
    geometry?: {
      coordinates?: Array<[number, number]>;
      type?: string;
    };
  }>;
};

export async function getRoadRouteForPoints(points: RidePoint[]): Promise<RouteCoordinate[] | null> {
  if (!MAPBOX_TOKEN) return null;

  const coordinates = sampleDirectionsCoordinates(points.filter(hasValidCoordinates));
  if (coordinates.length < 2) return null;

  try {
    const waypointText = coordinates
      .map((point) => `${point.longitude},${point.latitude}`)
      .join(';');
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/${waypointText}` +
      `?geometries=geojson&overview=full&access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json() as MapboxDirectionsResponse;
    const routeCoordinates = data.routes?.[0]?.geometry?.coordinates;
    if (!routeCoordinates || routeCoordinates.length < 2) return null;

    return routeCoordinates.map(([longitude, latitude]) => ({
      latitude,
      longitude,
    }));
  } catch {
    return null;
  }
}

function hasValidCoordinates<T extends MaybeCoordinate>(point: T): point is T & RouteCoordinate {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function sampleDirectionsCoordinates(points: RouteCoordinate[]): RouteCoordinate[] {
  if (points.length <= MAX_DIRECTIONS_COORDINATES) return points;

  const lastIndex = points.length - 1;
  return Array.from({ length: MAX_DIRECTIONS_COORDINATES }, (_, index) => {
    const sourceIndex = Math.round((index / (MAX_DIRECTIONS_COORDINATES - 1)) * lastIndex);
    return points[sourceIndex];
  });
}
