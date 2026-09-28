export const GRENADE_COUNT = 3;
export const BOSS_MAX_HP = 240;
export const PAPER_MONSTER_MAX_HP = BOSS_MAX_HP / 2;
export const PEN_MONSTER_MAX_HP = 150;
export const ARENA_HALF_SIZE = 52;

export type WeaponId = "sniper" | "rifle" | "shotgun" | "knife";

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
    aimedSpread: 0,
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
  knife: {
    id: "knife",
    label: "PAPER KNIFE",
    magazine: 0,
    reserve: 0,
    damage: 88,
    cooldownMs: 520,
    aimDelayMs: 0,
    pellets: 1,
    hipSpread: 0,
    aimedSpread: 0,
    scopedFov: 70,
    maxRange: 2.75,
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
  { x: -43, z: 4, w: 6, d: 13, h: 4.2, color: "paper" },
  { x: 43, z: 7, w: 7, d: 12, h: 5.0, color: "blue" },
  { x: -11, z: 42, w: 12, d: 6, h: 3.6, color: "blue" },
  { x: 16, z: 43, w: 10, d: 5, h: 4.0, color: "paper" },
  { x: -7, z: -43, w: 8, d: 6, h: 4.6, color: "paper" },
];

export const ENEMY_BLOCKERS = [
  ...ARENA_OBSTACLES.map(({ x, z, w, d }) => ({ x, z, w, d })),
  { x: -39, z: -34, w: 18, d: 16 },
  { x: 35, z: -34, w: 18, d: 18 },
  { x: -32, z: 35, w: 5.0, d: 5.0 },
  { x: -33, z: 24, w: 1.7, d: 1.7 },
  { x: 31, z: 40, w: 1.7, d: 1.7 },
  { x: -47, z: -18, w: 1.1, d: 1.1 },
  { x: 46, z: -12, w: 1.1, d: 1.1 },
  { x: -19, z: 45, w: 1.2, d: 1.2 },
  { x: 7, z: 47, w: 1.1, d: 1.1 },
  { x: 3, z: 31, w: 1.0, d: 1.0 },
  { x: -12, z: 20, w: 1.0, d: 1.0 },
];

export const PICKUP_SPAWNS: [number, number, number][] = [
  [-7, 0.55, -20],
  [23, 0.55, 18],
  [-25, 0.55, 17],
  [7, 0.55, 31],
  [-3, 0.55, 35],
  [41, 0.55, -8],
  [-43, 0.55, 31],
  [34, 9.05, -34],
];

export type LadderZone = {
  x: number;
  z: number;
  w: number;
  d: number;
  minY: number;
  maxY: number;
  snapX: number;
  snapZ: number;
  exitX: number;
  exitY: number;
  exitZ: number;
};

export const LADDER_ZONES: LadderZone[] = [
  {
    x: 44.35,
    z: -34,
    w: 2.7,
    d: 3.3,
    minY: 0.45,
    maxY: 9.35,
    snapX: 45.72,
    snapZ: -34,
    exitX: 42.0,
    exitY: 9.48,
    exitZ: -34,
  },
  {
    x: -29.85,
    z: 35,
    w: 2.8,
    d: 3.0,
    minY: 0.45,
    maxY: 7.35,
    snapX: -28.95,
    snapZ: 35,
    exitX: -30.95,
    exitY: 7.35,
    exitZ: 35,
  },
];

export const REACTIVE_PLANTS = [
  { id: "weed-a", kind: "weed", position: [-19, 0.65, 18] },
  { id: "weed-b", kind: "weed", position: [12, 0.65, 20] },
  { id: "weed-c", kind: "weed", position: [36, 0.65, 17] },
  { id: "weed-d", kind: "weed", position: [-37, 0.65, -8] },
  { id: "weed-e", kind: "weed", position: [8, 0.65, -35] },
  { id: "weed-f", kind: "weed", position: [31, 0.65, -23] },
  { id: "weed-g", kind: "weed", position: [-31, 0.65, 16] },
  { id: "weed-h", kind: "weed", position: [3, 0.65, 24] },
  { id: "flower-a", kind: "flower", position: [-25, 0.75, 36] },
  { id: "flower-b", kind: "flower", position: [28, 0.75, 39] },
  { id: "flower-c", kind: "flower", position: [41, 0.75, -20] },
  { id: "flower-d", kind: "flower", position: [-14, 0.75, -33] },
  { id: "flower-e", kind: "flower", position: [16, 0.75, 34] },
  { id: "flower-f", kind: "flower", position: [-42, 0.75, 31] },
  { id: "sapling-a", kind: "sapling", position: [-45, 1.15, 23] },
  { id: "sapling-b", kind: "sapling", position: [44, 1.15, 23] },
  { id: "sapling-c", kind: "sapling", position: [3, 1.15, 37] },
  { id: "sapling-d", kind: "sapling", position: [-28, 1.15, -39] },
  { id: "sapling-e", kind: "sapling", position: [23, 1.15, -44] },
] as const;
