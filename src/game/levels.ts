import {
  ENEMY_BLOCKERS,
  LADDER_ZONES,
  PICKUP_SPAWNS,
  type LadderZone,
} from "./config";

export type MapTheme = "playground" | "jungle" | "gems" | "hell";

export type EnemyTuning = {
  speed: number;
  vision: number;
  damage: number;
  bosses: number;
  paperwork: number;
  pens: number;
};

export type LevelDefinition = {
  level: number;
  name: string;
  subtitle: string;
  theme: MapTheme;
  difficulty: string;
  enemy: EnemyTuning;
};

export type NavBlocker = { x: number; z: number; w: number; d: number };

export const ZIPLINES = [
  { from: [0, 7.55, -8] as const, to: [26, 7.55, 26] as const },
  { from: [26, 7.55, 26] as const, to: [-27, 7.55, 27] as const },
  { from: [-27, 7.55, 27] as const, to: [0, 7.55, -8] as const },
];

export const LEVELS: LevelDefinition[] = [
  {
    level: 1,
    name: "THE PLAYGROUND",
    subtitle: "warm-up shift",
    theme: "playground",
    difficulty: "VERY EASY",
    enemy: { speed: 0.68, vision: 0.72, damage: 0.55, bosses: 4, paperwork: 0, pens: 0 },
  },
  {
    level: 2,
    name: "THE JUNGLE",
    subtitle: "lost in the green",
    theme: "jungle",
    difficulty: "EASY",
    enemy: { speed: 0.96, vision: 0.98, damage: 0.82, bosses: 6, paperwork: 1, pens: 0 },
  },
  {
    level: 3,
    name: "GEM ISLAND",
    subtitle: "shiny deadlines",
    theme: "gems",
    difficulty: "EASY +",
    enemy: { speed: 1.06, vision: 1.04, damage: 0.93, bosses: 6, paperwork: 2, pens: 1 },
  },
  {
    level: 4,
    name: "OVERTIME YARD",
    subtitle: "back to the office",
    theme: "playground",
    difficulty: "NORMAL",
    enemy: { speed: 1.15, vision: 1.1, damage: 1.02, bosses: 7, paperwork: 2, pens: 1 },
  },
  {
    level: 5,
    name: "GREEN DEADLINE",
    subtitle: "the jungle noticed you",
    theme: "jungle",
    difficulty: "NORMAL +",
    enemy: { speed: 1.25, vision: 1.16, damage: 1.14, bosses: 7, paperwork: 2, pens: 2 },
  },
  {
    level: 6,
    name: "CRYSTAL AUDIT",
    subtitle: "nothing stays calm",
    theme: "gems",
    difficulty: "HARD",
    enemy: { speed: 1.36, vision: 1.22, damage: 1.26, bosses: 8, paperwork: 2, pens: 2 },
  },
  {
    level: 7,
    name: "PLAYGROUND PANIC",
    subtitle: "the shift fights back",
    theme: "playground",
    difficulty: "HARD +",
    enemy: { speed: 1.47, vision: 1.28, damage: 1.39, bosses: 8, paperwork: 3, pens: 2 },
  },
  {
    level: 8,
    name: "JUNGLE RUSH",
    subtitle: "no quiet path left",
    theme: "jungle",
    difficulty: "VERY HARD",
    enemy: { speed: 1.59, vision: 1.35, damage: 1.52, bosses: 9, paperwork: 3, pens: 2 },
  },
  {
    level: 9,
    name: "GEM SIEGE",
    subtitle: "everything is hunting",
    theme: "gems",
    difficulty: "BRUTAL",
    enemy: { speed: 1.74, vision: 1.42, damage: 1.68, bosses: 9, paperwork: 3, pens: 3 },
  },
  {
    level: 10,
    name: "THE HELL",
    subtitle: "final deadline",
    theme: "hell",
    difficulty: "ALMOST IMPOSSIBLE",
    enemy: { speed: 1.95, vision: 1.55, damage: 1.88, bosses: 10, paperwork: 4, pens: 3 },
  },
];

export function getLevelDefinition(level: number) {
  return LEVELS[Math.min(10, Math.max(1, level)) - 1];
}

export function getTargetCount(level: number) {
  const enemy = getLevelDefinition(level).enemy;
  return enemy.bosses + enemy.paperwork + enemy.pens + (getLevelDefinition(level).theme === "gems" ? 1 : 0);
}

const JUNGLE_BLOCKERS: NavBlocker[] = [
  { x: -31, z: -22, w: 3.2, d: 3.2 },
  { x: -8, z: -30, w: 3.6, d: 3.6 },
  { x: 22, z: -28, w: 3.2, d: 3.2 },
  { x: 34, z: -4, w: 3.6, d: 3.6 },
  { x: 26, z: 26, w: 3.4, d: 3.4 },
  { x: 2, z: 31, w: 3.6, d: 3.6 },
  { x: -27, z: 27, w: 3.4, d: 3.4 },
  { x: -38, z: 5, w: 3.2, d: 3.2 },
  { x: 0, z: -8, w: 5.2, d: 5.2 },
  { x: -20, z: -5, w: 6, d: 5 },
  { x: 16, z: -29, w: 6, d: 5 },
  { x: 32, z: 11, w: 6, d: 5 },
  { x: -19, z: 22, w: 6, d: 5 },
];

const GEM_BLOCKERS: NavBlocker[] = [
  { x: -28, z: -22, w: 9, d: 9 },
  { x: 21, z: -27, w: 8, d: 8 },
  { x: 31, z: 14, w: 9, d: 9 },
  { x: 3, z: 28, w: 10, d: 10 },
  { x: -29, z: 22, w: 8, d: 8 },
  { x: 0, z: -4, w: 26, d: 26 },
];

const HELL_BLOCKERS: NavBlocker[] = [
  { x: 0, z: -4, w: 26, d: 26 },
];

export function getLevelBlockers(level: number): NavBlocker[] {
  const theme = getLevelDefinition(level).theme;
  if (theme === "playground") return ENEMY_BLOCKERS;
  if (theme === "jungle") return JUNGLE_BLOCKERS;
  if (theme === "gems") return GEM_BLOCKERS;
  return HELL_BLOCKERS;
}

const JUNGLE_LADDERS: LadderZone[] = [
  {
    x: 2.15,
    z: -8,
    w: 2.8,
    d: 3,
    minY: 0.45,
    maxY: 7.35,
    snapX: 3.05,
    snapZ: -8,
    exitX: 1.05,
    exitY: 7.35,
    exitZ: -8,
  },
  ...([ [26, 26], [-27, 27] ] as [number, number][]).map(([x, z]): LadderZone => ({
    x: x + 3.05, z, w: 2.8, d: 3, minY: 0.45, maxY: 7.35,
    snapX: x + 3.05, snapZ: z, exitX: x + 1.05, exitY: 7.35, exitZ: z,
  })),
];

export function getLevelLadders(level: number): LadderZone[] {
  const theme = getLevelDefinition(level).theme;
  if (theme === "playground") return LADDER_ZONES;
  if (theme === "jungle") return JUNGLE_LADDERS;
  return [];
}

const GROUND_PICKUPS: [number, number, number][] = [
  [-32, 0.55, -18],
  [28, 0.55, -18],
  [-21, 0.55, 20],
  [22, 0.55, 24],
  [0, 0.55, -33],
  [37, 0.55, 8],
];

export function getPickupSpawns(level: number) {
  return getLevelDefinition(level).theme === "playground"
    ? PICKUP_SPAWNS
    : GROUND_PICKUPS;
}

const SPAWN_POOL: [number, number, number][] = [
  [-44, 0, -43],
  [-19, 0, -44],
  [9, 0, -43],
  [43, 0, -41],
  [-44, 0, -9],
  [43, 0, -7],
  [-43, 0, 22],
  [44, 0, 24],
  [-35, 0, 43],
  [-9, 0, 44],
  [20, 0, 43],
  [43, 0, 42],
  [-22, 0, 7],
  [20, 0, 8],
  [-12, 0, -24],
  [13, 0, 27],
  [31, 0, 2],
  [-31, 0, 3],
];

export function getEnemySpawnPool(level: number) {
  const shift = ((level * 7) % SPAWN_POOL.length);
  return [...SPAWN_POOL.slice(shift), ...SPAWN_POOL.slice(0, shift)];
}
