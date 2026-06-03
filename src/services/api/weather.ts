import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RidePoint, WeatherContext } from '../../types';

const WEATHER_CACHE_KEY = 'vv_weather_cache';
const CACHE_TTL_MS = 60 * 60 * 1000;

type WeatherCache = {
  key: string;
  value: WeatherContext;
};

export async function getWeatherForPoint(point?: RidePoint): Promise<WeatherContext | undefined> {
  if (!point) return undefined;

  const key = `${point.latitude.toFixed(2)},${point.longitude.toFixed(2)}`;
  const cached = await readCache();

  if (cached?.key === key && Date.now() - cached.value.fetchedAt < CACHE_TTL_MS) {
    return {
      ...cached.value,
      source: 'cache',
    };
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${point.latitude}` +
      `&longitude=${point.longitude}&current=temperature_2m,wind_speed_10m,weather_code`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API failed with ${response.status}`);
    }

    const data = await response.json();
    const value: WeatherContext = {
      temperatureC: data.current?.temperature_2m,
      windSpeedKmh: data.current?.wind_speed_10m,
      condition: weatherCodeToText(data.current?.weather_code),
      fetchedAt: Date.now(),
      source: 'open-meteo',
    };

    await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ key, value }));
    return value;
  } catch {
    if (cached?.key === key) {
      return {
        ...cached.value,
        source: 'cache',
      };
    }

    return {
      fetchedAt: Date.now(),
      source: 'fallback',
      condition: 'Vreme ni dosegljivo',
    };
  }
}

async function readCache(): Promise<WeatherCache | null> {
  try {
    const raw = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    return raw ? JSON.parse(raw) as WeatherCache : null;
  } catch {
    return null;
  }
}

function weatherCodeToText(code?: number): string {
  if (code === undefined || code === null) return 'Ni podatka';
  if (code === 0) return 'Jasno';
  if ([1, 2, 3].includes(code)) return 'Delno oblacno';
  if ([45, 48].includes(code)) return 'Megla';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'Dez';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Sneg';
  if ([95, 96, 99].includes(code)) return 'Nevihta';
  return 'Spremenljivo';
}
