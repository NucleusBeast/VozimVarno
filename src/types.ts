import type React from 'react';

export type Screen =
  | 'splash'
  | 'login'
  | 'home'
  | 'prepare'
  | 'active'
  | 'summary'
  | 'history'
  | 'details'
  | 'rating'
  | 'challenges'
  | 'profile'
  | 'settings';

export type GoToScreen = (screen: Screen, params?: NavParams) => void;

export type IconType = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}>;

// --- Domain types (dogovorjeni s celotno ekipo) ---

export type SpeedUnit = 'kmh' | 'mph';
export type AppTheme = 'light' | 'dark';

export type IncidentType =
  | 'hard_acceleration'
  | 'hard_braking'
  | 'sharp_turn'
  | 'speed_exceeded'
  | 'noise_alert';

export type Incident = {
  id: string;
  type: IncidentType;
  timestamp: number;
  intensity: number; // 0–1
  speedKmh?: number;
  latitude?: number;
  longitude?: number;
};

export type RidePoint = {
  latitude: number;
  longitude: number;
  speedKmh: number;
  timestamp: number;
  altitude?: number;
};

export type WeatherContext = {
  temperatureC?: number;
  windSpeedKmh?: number;
  condition?: string;
  fetchedAt: number;
  source: 'open-meteo' | 'cache' | 'fallback';
};

export type Ride = {
  id: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  distanceKm: number;
  score: number;
  incidents: Incident[];
  points: RidePoint[];
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  userRating?: number;   // 1–5 stars, set in RatingScreen
  userComment?: string;
  weather?: WeatherContext;
};

export type RideSummary = {
  id: string;
  startTime: number;
  durationSeconds: number;
  distanceKm: number;
  score: number;
  incidentCount: number;
};

export type IncidentThresholds = {
  hardAccelerationMs2: number;
  hardBrakingMs2: number;
  sharpTurnDegS: number;
  noiseAlertDb: number;
};

export type UserSettings = {
  notificationsEnabled: boolean;
  speedUnit: SpeedUnit;
  theme: AppTheme;
  cameraEnabled: boolean;
  gpsEnabled: boolean;
  microphoneEnabled: boolean;
  incidentThresholds: IncidentThresholds;
};

// --- Navigation params (za prenos podatkov med zasloni) ---

export type NavParams = Partial<{
  rideId: string;
  elapsedSeconds: number;
}>;
