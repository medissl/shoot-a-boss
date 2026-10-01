import { THREAT_WEIGHTS } from "./balance";

export const FIELD_CAPS = [4, 5, 5, 5, 6, 5, 6, 5, 6, 8, 8, 7] as const;
export type EncounterPhase = "OPENING" | "SURGE" | "FINAL PUSH";
export function fieldCap(level: number, phase: EncounterPhase) {
  return FIELD_CAPS[Math.max(0, Math.min(FIELD_CAPS.length - 1, level - 1))] + (phase === "FINAL PUSH" && ![4, 6, 8, 12].includes(level) ? 1 : 0);
}
export function spawnCadence(phase: EncounterPhase) { return phase === "OPENING" ? 1450 : phase === "SURGE" ? 1120 : 900; }
export function activeThreat(ids: string[]) {
  return +ids.reduce((total, id) => {
    const kind = id.startsWith("target-") ? "bosses" : id.startsWith("paper-") ? "paperwork" : id.startsWith("pen-") ? "pens" : id.startsWith("fly-") ? "flying" : id.startsWith("statue-") ? "statues" : /^(hr|auditor|director)-/.test(id) ? "elite" : id.split("-")[0];
    return total + (THREAT_WEIGHTS[kind as keyof typeof THREAT_WEIGHTS] ?? 0);
  }, 0).toFixed(2);
}
