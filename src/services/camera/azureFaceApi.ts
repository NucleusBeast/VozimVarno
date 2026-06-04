const ENDPOINT = process.env.EXPO_PUBLIC_AZURE_FACE_ENDPOINT ?? '';
const KEY = process.env.EXPO_PUBLIC_AZURE_FACE_KEY ?? '';

export const AZURE_FACE_AVAILABLE = !!(ENDPOINT && KEY);

console.log('[AzureFace] AVAILABLE:', AZURE_FACE_AVAILABLE, '| ENDPOINT:', ENDPOINT ? ENDPOINT.slice(0, 40) : 'MISSING', '| KEY:', KEY ? 'SET' : 'MISSING');

type AzureFaceAttributes = {
  occlusion?: { eyeOccluded: boolean; foreheadOccluded: boolean; mouthOccluded: boolean };
  headPose?: { pitch: number; roll: number; yaw: number };
};

type AzureFaceResponse = Array<{ faceAttributes: AzureFaceAttributes }>;

export type FaceAnalysis = {
  eyeOccluded: boolean;
  headPitchDeg: number; // pozitivno = glava pada naprej (zaspanost)
  headTiltDeg: number;  // absolutni yaw
};

export async function analyzeFrame(photoUri: string): Promise<FaceAnalysis | null> {
  console.log('[AzureFace] analyzeFrame start, uri:', photoUri.slice(0, 60));
  try {
    const blob = await fetch(photoUri).then((r) => r.blob());
    console.log('[AzureFace] blob size:', blob.size);

    const url = `${ENDPOINT}face/v1.0/detect?returnFaceAttributes=headpose,occlusion&detectionModel=detection_01`;
    console.log('[AzureFace] calling API:', url.slice(0, 80));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': KEY,
        'Content-Type': 'application/octet-stream',
      },
      body: blob,
    });

    console.log('[AzureFace] response status:', response.status);
    if (!response.ok) {
      const errText = await response.text();
      console.warn('[AzureFace] API error:', response.status, errText.slice(0, 200));
      return null;
    }

    const faces = (await response.json()) as AzureFaceResponse;
    console.log('[AzureFace] faces detected:', faces.length);
    if (!faces.length) return null;

    const attrs = faces[0].faceAttributes;
    const result = {
      eyeOccluded: attrs.occlusion?.eyeOccluded ?? false,
      headPitchDeg: attrs.headPose?.pitch ?? 0,
      headTiltDeg: Math.abs(attrs.headPose?.yaw ?? 0),
    };
    console.log('[AzureFace] result:', JSON.stringify(result));
    return result;
  } catch (e) {
    console.error('[AzureFace] exception:', e);
    return null;
  }
}

// occludedStreak = koliko zaporednih zaznav so bile oči zakriti/zaprte
export function faceAnalysisToFatigue(
  analysis: FaceAnalysis,
  occludedStreak: number,
): { score: number; confidence: number } {
  // Zakriti/zaprte oči = močan signal utrujenosti
  const eyeScore = analysis.eyeOccluded ? Math.min(80, 40 + occludedStreak * 20) : 0;
  // Glava pada naprej ali nazaj — absolutna vrednost, prag 8°
  // Azure vrača negativne vrednosti za spuščeno glavo (navzdol = zaspanost)
  const pitchScore = Math.max(0, Math.abs(analysis.headPitchDeg) - 8) * 2.5;
  // Nagib glave vstran > 12° = signal utrujenosti
  const tiltScore = Math.max(0, (analysis.headTiltDeg - 12) * 2);
  return {
    score: Math.min(100, eyeScore + pitchScore + tiltScore),
    confidence: 0.8,
  };
}
