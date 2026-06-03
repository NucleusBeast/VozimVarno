export type FatigueResult = {
  score: number;       // 0 = alert, 100 = very fatigued
  confidence: number;  // 0–1
};

// Placeholder type for future ML camera frame input
export type MLCameraFrame = unknown;

let isEnabled = false;
let mockInterval: ReturnType<typeof setInterval> | null = null;
let currentResult: FatigueResult | null = null;
const listeners = new Set<(result: FatigueResult | null) => void>();

function notify(result: FatigueResult | null): void {
  listeners.forEach((l) => l(result));
}

export function enableFatigueDetection(): void {
  if (isEnabled) return;
  isEnabled = true;
  currentResult = { score: 12, confidence: 0.65 };
  notify(currentResult);
  // Mock: simulate ML inference updates every 8 seconds
  mockInterval = setInterval(() => {
    const score = Math.max(0, Math.min(100, 10 + Math.random() * 40));
    currentResult = { score, confidence: 0.55 + Math.random() * 0.35 };
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

export function isFatigueDetectionEnabled(): boolean {
  return isEnabled;
}

export function getFatigueResult(): FatigueResult | null {
  return currentResult;
}

export function onFatigueUpdate(listener: (result: FatigueResult | null) => void): () => void {
  listeners.add(listener);
  listener(currentResult); // deliver current value immediately
  return () => listeners.delete(listener);
}

// Replace body with actual TensorFlow Lite / MediaPipe inference when model is ready
export function processCameraFrame(_frame: MLCameraFrame): FatigueResult | null {
  return null;
}
