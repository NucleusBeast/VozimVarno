import { Audio } from 'expo-av';

type NoiseCallback = (dbLevel: number) => void;

let activeRecording: Audio.Recording | null = null;
let monitorInterval: ReturnType<typeof setInterval> | null = null;

export async function requestMicrophonePermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

export async function getMicrophonePermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Audio.getPermissionsAsync();
  return status;
}

export async function startNoiseMonitoring(
  onNoiseAlert: NoiseCallback,
  thresholdDb = -20,
  intervalMs = 1000,
): Promise<boolean> {
  if (activeRecording) return true;

  const granted = await requestMicrophonePermission();
  if (!granted) return false;

  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

  activeRecording = new Audio.Recording();
  await activeRecording.prepareToRecordAsync({
    ...Audio.RecordingOptionsPresets.LOW_QUALITY,
    isMeteringEnabled: true,
  });
  await activeRecording.startAsync();

  monitorInterval = setInterval(async () => {
    if (!activeRecording) return;
    try {
      const status = await activeRecording.getStatusAsync();
      if (status.isRecording && status.metering !== undefined) {
        onNoiseAlert(status.metering);
      }
    } catch {
      // ignore status errors during monitoring
    }
  }, intervalMs);

  return true;
}

export async function stopNoiseMonitoring(): Promise<void> {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }

  if (activeRecording) {
    try {
      await activeRecording.stopAndUnloadAsync();
    } catch {
      // already stopped
    }
    activeRecording = null;
  }

  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
}

export function isNoiseMonitoring(): boolean {
  return activeRecording !== null;
}
