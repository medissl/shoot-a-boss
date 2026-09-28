import { getEnemyTuning } from "./levels";

// Keep each map's timing and footprint unchanged while later stages and NG+
// make its damage grow with the same curve as enemy attacks.
export function hazardDamage(base: number, level: number, cycle: number) {
  return Math.round(base * Math.max(0.75, getEnemyTuning(level, cycle).damage) * 10) / 10;
}

export type PaperBlast = {
  position: [number, number, number];
  radius: number;
  damage: number;
};

export function paperBlastDamage(blast: PaperBlast, enemy: [number, number, number]) {
  const distance = Math.hypot(
    blast.position[0] - enemy[0],
    blast.position[1] - enemy[1],
    blast.position[2] - enemy[2],
  );
  if (distance > blast.radius) return 0;
  return blast.damage * (1 - 0.65 * distance / blast.radius);
}
