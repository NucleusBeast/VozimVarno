import type { Incident, IncidentType } from '../../types';

const BASE_DEDUCTION: Record<IncidentType, number> = {
  hard_braking: 8,
  hard_acceleration: 6,
  sharp_turn: 7,
  speed_exceeded: 10,
  noise_alert: 3,
};

// Max incidents per type that count toward deduction.
// Prevents score 0 from aggressive test shaking while still penalizing bad real driving.
const MAX_PER_TYPE = 4;

export function calculateScore(incidents: Incident[]): number {
  if (incidents.length === 0) return 100;

  const countByType: Partial<Record<IncidentType, number>> = {};
  let deduction = 0;

  for (const incident of incidents) {
    const count = (countByType[incident.type] ?? 0) + 1;
    countByType[incident.type] = count;
    if (count > MAX_PER_TYPE) continue;

    const base = BASE_DEDUCTION[incident.type] ?? 5;
    // Intensity 0 = minimum deduction (50 %), intensity 1 = full deduction (100 %)
    deduction += base * (0.5 + incident.intensity * 0.5);
  }

  return Math.max(0, Math.min(100, Math.round(100 - deduction)));
}
