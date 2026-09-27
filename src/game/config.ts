export const TARGET_COUNT = 10;
export const GRENADE_COUNT = 3;
export const ARENA_HALF_SIZE = 28;

export type WeaponId = "sniper" | "rifle" | "shotgun";

export type WeaponConfig = {
  id: WeaponId;
  label: string;
  magazine: number;
  reserve: number;
  damage: number;
  cooldownMs: number;
  pellets: number;
  spread: number;
  scopedFov: number;
};

export const WEAPONS: Record<WeaponId, WeaponConfig> = {
  sniper: {
    id: "sniper",
    label: "PAPER SNIPER",
    magazine: 5,
    reserve: 20,
    damage: 100,
    cooldownMs: 850,
    pellets: 1,
    spread: 0,
    scopedFov: 30,
  },
  rifle: {
    id: "rifle",
    label: "REPORT RIFLE",
    magazine: 30,
    reserve: 120,
    damage: 34,
    cooldownMs: 115,
    pellets: 1,
    spread: 0.008,
    scopedFov: 48,
  },
  shotgun: {
    id: "shotgun",
    label: "STAPLE SHOTGUN",
    magazine: 6,
    reserve: 30,
    damage: 22,
    cooldownMs: 720,
    pellets: 7,
    spread: 0.055,
    scopedFov: 55,
  },
};

export const TARGET_SPAWNS: [number, number, number][] = [
  [-20, 1, -18],
  [-9, 1, -21],
  [7, 1, -18],
  [20, 1, -13],
  [-19, 1, -2],
  [17, 1, 2],
  [-15, 1, 17],
  [-3, 1, 20],
  [11, 1, 18],
  [22, 1, 14],
];
