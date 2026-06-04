import { AZURE_FACE_AVAILABLE } from './azureFaceApi';

export type FatigueResult = {
  score: number;       // 0 = alert, 100 = very fatigued
  confidence: number;  // 0–1
};

export type MLCameraFrame = unknown;

let isEnabled = false;
let mockInterval: ReturnType<typeof setInterval> | null = null;
let currentResult: FatigueResult | null = null;
let sessionStartTime = 0;
const listeners = new Set<(result: FatigueResult | null) => void>();

function notify(result: FatigueResult | null): void {
  listeners.forEach((l) => l(result));
}

export function enableFatigueDetection(): void {
  if (isEnabled) return;
  isEnabled = true;

  if (AZURE_FACE_AVAILABLE) {
    // Realni rezultati bodo potisneni prek pushFatigueResult iz useFatigueCamera hooka
    currentResult = null;
    return;
  }

  // Demo fallback: utrujenost se gradi s časom
  sessionStartTime = Date.now();
  currentResult = { score: 8, confidence: 0.72 };
  notify(currentResult);

  mockInterval = setInterval(() => {
    const elapsedMin = (Date.now() - sessionStartTime) / 60000;
    const baseFatigue = Math.min(65, elapsedMin * 8);
    const spike = Math.random() < 0.15 ? 15 + Math.random() * 20 : 0;
    const noise = (Math.random() - 0.5) * 10;
    const score = Math.max(0, Math.min(100, baseFatigue + spike + noise));
    currentResult = { score, confidence: 0.58 + Math.random() * 0.34 };
    notify(currentResult);
  }, 8000);
}

export function disableFatigueDetection(): void {
  isEnabled = false;
  if (mockInterval) {
    clearInterval(mockInterval);
    mockInterval = null;
  }
  currentResult = null;
  notify(null);
}

export function pushFatigueResult(result: FatigueResult): void {
  if (!isEnabled) return;
  currentResult = result;
  notify(result);
}

export function isFatigueDetectionEnabled(): boolean {
  return isEnabled;
}

export function getFatigueResult(): FatigueResult | null {
  return currentResult;
}

export function onFatigueUpdate(listener: (result: FatigueResult | null) => void): () => void {
  listeners.add(listener);
  listener(currentResult);
  return () => listeners.delete(listener);
}

export function processCameraFrame(_frame: MLCameraFrame): FatigueResult | null {
  return null;
}
