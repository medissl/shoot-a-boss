export const TARGET_COUNT = 10;
export const GRENADE_COUNT = 3;
export const BOSS_MAX_HP = 240;
export const ARENA_HALF_SIZE = 38;

export type WeaponId = "sniper" | "rifle" | "shotgun";

export type WeaponConfig = {
  id: WeaponId;
  label: string;
  magazine: number;
  reserve: number;
  damage: number;
  cooldownMs: number;
  aimDelayMs: number;
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
    damage: 160,
    cooldownMs: 1450,
    aimDelayMs: 380,
    pellets: 1,
    hipSpread: 0.24,
    aimedSpread: 0.00025,
    scopedFov: 12,
    maxRange: 135,
  },
  rifle: {
    id: "rifle",
    label: "REPORT RIFLE",
    magazine: 35,
    reserve: 175,
    damage: 32,
    cooldownMs: 98,
    aimDelayMs: 100,
    pellets: 1,
    hipSpread: 0.015,
    aimedSpread: 0.0032,
    scopedFov: 31,
    maxRange: 110,
  },
  shotgun: {
    id: "shotgun",
    label: "STAPLE SHOTGUN",
    magazine: 5,
    reserve: 35,
    damage: 44,
    cooldownMs: 850,
    aimDelayMs: 130,
    pellets: 5,
    hipSpread: 0.16,
    aimedSpread: 0.11,
    scopedFov: 64,
    maxRange: 32,
  },
};

export type ArenaObstacle = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color?: "paper" | "blue";
};

export const ARENA_OBSTACLES: ArenaObstacle[] = [
  { x: -15, z: -15, w: 11, d: 8, h: 5.2, color: "paper" },
  { x: 14, z: -16, w: 10, d: 7, h: 4.2, color: "blue" },
  { x: -21, z: 9, w: 8, d: 10, h: 3.7, color: "paper" },
  { x: 17, z: 12, w: 12, d: 8, h: 5.8, color: "blue" },
  { x: 0, z: 1, w: 8, d: 3.5, h: 1.7, color: "paper" },
  { x: -3, z: -27, w: 9, d: 4, h: 2.3, color: "blue" },
  { x: 27, z: 0, w: 5, d: 12, h: 4.6, color: "paper" },
  { x: -29, z: -4, w: 4.5, d: 11, h: 4.1, color: "blue" },
  { x: 7, z: 27, w: 11, d: 5, h: 3.4, color: "paper" },
  { x: -16, z: 27, w: 7, d: 5, h: 2.8, color: "blue" },
  { x: 3, z: -9, w: 4, d: 7, h: 2.2, color: "paper" },
  { x: 28, z: 24, w: 6, d: 6, h: 3.3, color: "blue" },
  { x: -30, z: 25, w: 5, d: 6, h: 3.0, color: "paper" },
];

export const ENEMY_BLOCKERS = ARENA_OBSTACLES.map(({ x, z, w, d }) => ({
  x,
  z,
  w,
  d,
}));

export const TARGET_SPAWNS: [number, number, number][] = [
  [-32, 0, -31],
  [-9, 0, -31],
  [10, 0, -30],
  [31, 0, -28],
  [-32, 0, 3],
  [32, 0, 7],
  [-28, 0, 30],
  [-5, 0, 32],
  [15, 0, 31],
  [32, 0, 29],
];

export const PICKUP_SPAWNS: [number, number, number][] = [
  [-7, 0.55, -20],
  [23, 0.55, 18],
  [-25, 0.55, 17],
  [7, 0.55, 20],
  [0, 0.55, 33],
  [30, 0.55, -12],
];
