import * as SecureStore from 'expo-secure-store';

import type { UserSettings } from '../../types';

const SETTINGS_KEY = 'vv_user_settings';

export const defaultSettings: UserSettings = {
  notificationsEnabled: true,
  speedUnit: 'kmh',
  theme: 'light',
  cameraEnabled: true,
  gpsEnabled: true,
  microphoneEnabled: true,
  incidentThresholds: {
    hardAccelerationMs2: 3.5,
    hardBrakingMs2: 4.0,
    sharpTurnDegS: 45,
    noiseAlertDb: -20,
    speedLimitKmh: 130,
  },
};

export async function loadSettings(): Promise<UserSettings> {
  try {
    const raw = await SecureStore.getItemAsync(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      ...defaultSettings,
      ...parsed,
      incidentThresholds: {
        ...defaultSettings.incidentThresholds,
        ...(parsed.incidentThresholds ?? {}),
      },
    };
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(patch: Partial<UserSettings>): Promise<void> {
  try {
    const current = await loadSettings();
    const updated: UserSettings = {
      ...current,
      ...patch,
      incidentThresholds: {
        ...current.incidentThresholds,
        ...(patch.incidentThresholds ?? {}),
      },
    };
    await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    // silently fail — Convex is the primary source
  }
}
