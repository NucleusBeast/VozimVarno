import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

export type Vec3 = { x: number; y: number; z: number };
type AccelCallback = (data: Vec3) => void;

let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
let simInterval: ReturnType<typeof setInterval> | null = null;

export async function startAccelerometer(onData: AccelCallback, intervalMs = 100): Promise<void> {
  stopAccelerometer();

  const available =
    Platform.OS !== 'web' && (await Accelerometer.isAvailableAsync().catch(() => false));

  if (available) {
    Accelerometer.setUpdateInterval(intervalMs);
    subscription = Accelerometer.addListener(onData);
  } else {
    simInterval = runSimulation(onData, intervalMs);
  }
}

export function stopAccelerometer(): void {
  subscription?.remove();
  subscription = null;
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
}

// Fallback for web / simulators — occasional spikes trigger real incident detection logic
function runSimulation(onData: AccelCallback, intervalMs: number): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const r = Math.random();
    if (r < 0.0003) {
      // Hard braking spike: large negative y-axis
      onData({ x: (Math.random() - 0.5) * 0.3, y: -(4.8 + Math.random()), z: 9.4 });
    } else if (r < 0.0006) {
      // Hard acceleration spike: large positive y-axis
      onData({ x: (Math.random() - 0.5) * 0.3, y: 3.9 + Math.random() * 0.8, z: 9.4 });
    } else {
      // Normal driving: small noise around gravity on z-axis
      onData({
        x: (Math.random() - 0.5) * 0.4,
        y: (Math.random() - 0.5) * 0.4,
        z: 9.81 + (Math.random() - 0.5) * 0.2,
      });
    }
  }, intervalMs);
}
