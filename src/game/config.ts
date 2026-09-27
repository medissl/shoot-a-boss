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
  hipSpread: number;
  aimedSpread: number;
  scopedFov: number;
  maxRange: number;
};

export const WEAPONS: Record<WeaponId, WeaponConfig> = {
  sniper: {
    id: "sniper",
    label: "PAPER SNIPER",
    magazine: 5,
    reserve: 25,
    damage: 118,
    cooldownMs: 900,
    pellets: 1,
    hipSpread: 0.052,
    aimedSpread: 0.0004,
    scopedFov: 12,
    maxRange: 110,
  },
  rifle: {
    id: "rifle",
    label: "REPORT RIFLE",
    magazine: 35,
    reserve: 175,
    damage: 29,
    cooldownMs: 92,
    pellets: 1,
    hipSpread: 0.012,
    aimedSpread: 0.0035,
    scopedFov: 31,
    maxRange: 92,
  },
  shotgun: {
    id: "shotgun",
    label: "STAPLE SHOTGUN",
    magazine: 6,
    reserve: 36,
    damage: 28,
    cooldownMs: 690,
    pellets: 5,
    hipSpread: 0.085,
    aimedSpread: 0.067,
    scopedFov: 64,
    maxRange: 52,
  },
};

export const TARGET_SPAWNS: [number, number, number][] = [
  [-20, 0, -18],
  [-9, 0, -21],
  [7, 0, -18],
  [20, 0, -13],
  [-19, 0, -2],
  [17, 0, 2],
  [-15, 0, 17],
  [-3, 0, 20],
  [11, 0, 18],
  [22, 0, 14],
];

export const PICKUP_SPAWNS: [number, number, number][] = [
  [-5, 0.55, -13],
  [18, 0.55, 8],
  [-18, 0.55, 12],
  [6, 0.55, 16],
];
