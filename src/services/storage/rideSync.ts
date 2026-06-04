import type { Ride } from '../../types';

export function toRideSyncPayload(ride: Ride) {
  return {
    clientRideId: ride.id,
    startTime: ride.startTime,
    endTime: ride.endTime,
    durationSeconds: ride.durationSeconds,
    distanceKm: ride.distanceKm,
    score: ride.score,
    maxSpeedKmh: ride.maxSpeedKmh,
    avgSpeedKmh: ride.avgSpeedKmh,
    ...(ride.userRating !== undefined ? { userRating: ride.userRating } : {}),
    ...(ride.userComment !== undefined ? { userComment: ride.userComment } : {}),
    ...(ride.weather?.condition !== undefined ? { weatherCondition: ride.weather.condition } : {}),
    ...(ride.weather?.temperatureC !== undefined ? { temperatureC: ride.weather.temperatureC } : {}),
    ...(ride.weather?.windSpeedKmh !== undefined ? { windSpeedKmh: ride.weather.windSpeedKmh } : {}),
    points: ride.points.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
      speedKmh: point.speedKmh,
      timestamp: point.timestamp,
      ...(point.altitude !== undefined ? { altitude: point.altitude } : {}),
    })),
    incidents: ride.incidents.map((incident) => ({
      id: incident.id,
      type: incident.type,
      timestamp: incident.timestamp,
      intensity: incident.intensity,
      ...(incident.speedKmh !== undefined ? { speedKmh: incident.speedKmh } : {}),
      ...(incident.latitude !== undefined ? { latitude: incident.latitude } : {}),
      ...(incident.longitude !== undefined ? { longitude: incident.longitude } : {}),
    })),
  };
}
