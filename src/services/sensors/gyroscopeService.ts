import { Gyroscope } from 'expo-sensors';
import { Platform } from 'react-native';

export type Vec3Gyro = { x: number; y: number; z: number };
type GyroCallback = (data: Vec3Gyro) => void;

let subscription: ReturnType<typeof Gyroscope.addListener> | null = null;
let simInterval: ReturnType<typeof setInterval> | null = null;

export async function startGyroscope(onData: GyroCallback, intervalMs = 100): Promise<void> {
  stopGyroscope();

  const available =
    Platform.OS !== 'web' && (await Gyroscope.isAvailableAsync().catch(() => false));

  if (available) {
    Gyroscope.setUpdateInterval(intervalMs);
    subscription = Gyroscope.addListener(onData);
  } else {
    simInterval = runSimulation(onData, intervalMs);
  }
}

export function stopGyroscope(): void {
  subscription?.remove();
  subscription = null;
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
}

// Fallback for web / simulators — occasional high yaw-rate spikes
function runSimulation(onData: GyroCallback, intervalMs: number): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const r = Math.random();
    if (r < 0.0003) {
      // Sharp turn: z-axis yaw > 0.785 rad/s (45 deg/s threshold)
      const dir = Math.random() > 0.5 ? 1 : -1;
      onData({ x: (Math.random() - 0.5) * 0.1, y: (Math.random() - 0.5) * 0.1, z: dir * (0.9 + Math.random() * 0.4) });
    } else {
      // Tiny rotation noise
      onData({
        x: (Math.random() - 0.5) * 0.05,
        y: (Math.random() - 0.5) * 0.05,
        z: (Math.random() - 0.5) * 0.05,
      });
    }
  }, intervalMs);
}
