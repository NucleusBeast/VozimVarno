import { useCallback, useEffect, useRef } from 'react';
import type { CameraView } from 'expo-camera';

import { AZURE_FACE_AVAILABLE, analyzeFrame, faceAnalysisToFatigue } from '../services/camera/azureFaceApi';
import { pushFatigueResult } from '../services/camera';
import { loadSettings } from '../services/storage/settingsStorage';

const CAPTURE_INTERVAL_MS = 10000;

export function useFatigueCamera() {
  const cameraRef = useRef<CameraView>(null);
  const closedEyeStreakRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);

  const capture = useCallback(async () => {
    console.log('[FatigueCamera] capture called, active:', activeRef.current, 'hasRef:', !!cameraRef.current);
    if (!activeRef.current || !cameraRef.current) return;

    try {
      console.log('[FatigueCamera] taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        skipProcessing: true,
      });
      console.log('[FatigueCamera] photo taken:', photo ? photo.uri.slice(0, 60) : 'null');
      if (!photo) return;

      const analysis = await analyzeFrame(photo.uri);
      if (!analysis) {
        console.log('[FatigueCamera] no analysis result');
        return;
      }

      closedEyeStreakRef.current = analysis.eyeOccluded
        ? closedEyeStreakRef.current + 1
        : Math.max(0, closedEyeStreakRef.current - 1);

      const fatigue = faceAnalysisToFatigue(analysis, closedEyeStreakRef.current);
      console.log('[FatigueCamera] fatigue result:', JSON.stringify(fatigue));
      pushFatigueResult(fatigue);
    } catch (e) {
      console.error('[FatigueCamera] capture error:', e);
    }
  }, []);

  const start = useCallback(async () => {
    const settings = await loadSettings();
    console.log('[FatigueCamera] start called, cameraEnabled:', settings.cameraEnabled, 'azureAvailable:', AZURE_FACE_AVAILABLE);
    if (!settings.cameraEnabled || !AZURE_FACE_AVAILABLE) return;

    activeRef.current = true;
    closedEyeStreakRef.current = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    console.log('[FatigueCamera] starting interval, first capture in 3s');
    // Damo 3s zamude da se CameraView inicializira
    setTimeout(() => { void capture(); }, 3000);
    intervalRef.current = setInterval(capture, CAPTURE_INTERVAL_MS);
  }, [capture]);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    closedEyeStreakRef.current = 0;
  }, []);

  useEffect(() => {
    return stop;
  }, [stop]);

  return { cameraRef, start, stop, azureEnabled: AZURE_FACE_AVAILABLE };
}
