import {
  ENEMY_BLOCKERS,
  LADDER_ZONES,
  PICKUP_SPAWNS,
  type LadderZone,
} from "./config";
import { isEnemyPositionBlocked, isGemGroundSpawnValid } from "./navigation";
export { isGemGroundSpawnValid } from "./navigation";

export const MAX_STAGE = 12;
export type MapTheme = "playground" | "jungle" | "gems" | "hell" | "heaven";

export type EnemyTuning = {
  speed: number;
  vision: number;
  damage: number;
  bosses: number;
  paperwork: number;
  pens: number;
  flying?: number;
  statues?: number;
  sticky?: number;
  stapler?: number;
  highlighter?: number;
  shredder?: number;
  clipboard?: number;
  elite?: number;
  dragon?: number;
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

export const JUNGLE_TOWERS: [number, number, number][] = [
  [-39, 0, -35], [-5, 0, -18], [27, 0, 4], [40, 0, 38],
];
export const ZIPLINES = JUNGLE_TOWERS.slice(0, -1).map((tower, index) => ({
  from: [tower[0], 7.55, tower[2]] as [number, number, number],
  to: [JUNGLE_TOWERS[index + 1][0], 7.55, JUNGLE_TOWERS[index + 1][2]] as [number, number, number],
}));
export const JUNGLE_HUTS: [number, number][] = [[-20, -5], [16, -29], [32, 11], [-19, 22]];
export const JUNGLE_LOGS: { x: number; z: number; length: number; angle: number }[] = [
  { x: -4, z: 18, length: 15, angle: 0 },
  { x: 16, z: -4, length: 14, angle: Math.PI / 2 },
  { x: -36, z: 2, length: 13, angle: 0 },
];
export const JUNGLE_SMALL_TREES: [number, number][] = [
  [-45, -15], [-37, -23], [-24, -38], [-18, -30], [-3, -38], [9, -37],
  [32, -38], [42, -24], [39, -14], [8, -21], [-8, -6], [-42, 18],
  [-35, 34], [-8, 40], [13, 39], [29, 41], [43, 23], [8, 27],
];
export const CAVE_CENTER_Z = -4;
export const CAVE_WALL_RADIUS = 38;
export const CAVE_WALL_SEGMENTS = 48;
export const HELL_MOUNTAIN_RADIUS = 22;

export function getPlayerSpawn(level: number): [number, number, number] {
  const theme = getLevelDefinition(level).theme;
  return theme === "gems" || theme === "hell" ? [0, 1.4, 43] : [0, 1.4, 12];
}

export const LEVELS: LevelDefinition[] = [
  {
    level: 1,
    name: "THE PLAYGROUND",
    subtitle: "warm-up shift",
    theme: "playground",
    difficulty: "VERY EASY",
    enemy: { speed: 0.78, vision: 0.8, damage: 0.70, bosses: 4, paperwork: 0, pens: 0 },
  },
  {
    level: 2,
    name: "THE JUNGLE",
    subtitle: "lost in the green",
    theme: "jungle",
    difficulty: "EASY",
    enemy: { speed: 0.9, vision: 0.9, damage: 0.78, bosses: 5, paperwork: 1, pens: 1 },
  },
  {
    level: 3,
    name: "GEM ISLAND",
    subtitle: "shiny deadlines",
    theme: "gems",
    difficulty: "EASY +",
    enemy: { speed: 0.98, vision: 0.98, damage: 0.86, bosses: 3, paperwork: 1, pens: 1, flying: 1 },
  },
  {
    level: 4,
    name: "OVERTIME YARD",
    subtitle: "back to the office",
    theme: "playground",
    difficulty: "NORMAL",
    enemy: { speed: 1.03, vision: 1.02, damage: 0.94, bosses: 4, paperwork: 1, pens: 1, sticky: 1, elite: 1 },
  },
  {
    level: 5,
    name: "GREEN DEADLINE",
    subtitle: "the jungle noticed you",
    theme: "jungle",
    difficulty: "NORMAL +",
    enemy: { speed: 1.07, vision: 1.05, damage: 1.00, bosses: 4, paperwork: 2, pens: 1, flying: 1, statues: 1, stapler: 1 },
  },
  {
    level: 6,
    name: "CRYSTAL AUDIT",
    subtitle: "nothing stays calm",
    theme: "gems",
    difficulty: "HARD",
    enemy: { speed: 1.10, vision: 1.08, damage: 1.06, bosses: 3, paperwork: 1, pens: 1, flying: 1, statues: 1, highlighter: 1, elite: 1 },
  },
  {
    level: 7,
    name: "PLAYGROUND PANIC",
    subtitle: "the shift fights back",
    theme: "playground",
    difficulty: "HARD +",
    enemy: { speed: 1.13, vision: 1.10, damage: 1.10, bosses: 4, paperwork: 2, pens: 2, flying: 1, statues: 1, sticky: 1, clipboard: 1 },
  },
  {
    level: 8,
    name: "JUNGLE RUSH",
    subtitle: "no quiet path left",
    theme: "jungle",
    difficulty: "VERY HARD",
    enemy: { speed: 1.16, vision: 1.13, damage: 1.15, bosses: 3, paperwork: 1, pens: 1, flying: 1, statues: 1, stapler: 1, clipboard: 1, elite: 1 },
  },
  {
    level: 9,
    name: "GEM SIEGE",
    subtitle: "everything is hunting",
    theme: "gems",
    difficulty: "BRUTAL",
    enemy: { speed: 1.19, vision: 1.16, damage: 1.20, bosses: 3, paperwork: 2, pens: 1, flying: 1, statues: 1, highlighter: 1, clipboard: 1 },
  },
  {
    level: 10,
    name: "THE LAST SHIFT",
    subtitle: "one last office nightmare",
    theme: "playground",
    difficulty: "ALMOST IMPOSSIBLE",
    enemy: { speed: 1.22, vision: 1.19, damage: 1.25, bosses: 4, paperwork: 2, pens: 2, flying: 2, statues: 1, sticky: 1, stapler: 1, clipboard: 1 },
  },
  {
    level: 11, name: "THE HELL", subtitle: "the fire below", theme: "hell", difficulty: "NIGHTMARE",
    enemy: { speed: 1.25, vision: 1.22, damage: 1.31, bosses: 4, paperwork: 2, pens: 2, flying: 2, statues: 1, shredder: 2, clipboard: 1 },
  },
  {
    level: 12, name: "THE HEAVENS", subtitle: "final approval", theme: "heaven", difficulty: "FINAL",
    enemy: { speed: 1.28, vision: 1.25, damage: 1.36, bosses: 3, paperwork: 2, pens: 1, flying: 2, statues: 1, highlighter: 1, clipboard: 1, dragon: 1 },
  },
];

export function getLevelDefinition(level: number) {
  return LEVELS[Math.min(MAX_STAGE, Math.max(1, level)) - 1];
}

export function getEnemyTuning(level: number, cycle = 0): EnemyTuning {
  const enemy = getLevelDefinition(level).enemy;
  if (cycle === 0) return enemy;
  return {
    ...enemy,
    speed: Math.min(1.55, enemy.speed * (1 + cycle * .015)),
    vision: Math.min(1.4, enemy.vision * (1 + cycle * .01)),
    damage: enemy.damage * (1 + cycle * .07),
    bosses: enemy.bosses + (level <= 3 ? Math.min(2, cycle) : 0),
    paperwork: enemy.paperwork + (level >= 4 ? Math.min(2, cycle) : 0),
    pens: enemy.pens + (level >= 7 ? Math.min(1, cycle) : 0),
  };
}

export function getTargetCount(level: number, cycle = 0) {
  const enemy = getEnemyTuning(level, cycle);
  return enemy.bosses + enemy.paperwork + enemy.pens + (enemy.flying ?? 0) + (enemy.statues ?? 0) +
    (enemy.sticky ?? 0) + (enemy.stapler ?? 0) + (enemy.highlighter ?? 0) + (enemy.shredder ?? 0) +
    (enemy.clipboard ?? 0) + (enemy.elite ?? 0) + (enemy.dragon ?? 0) + (getLevelDefinition(level).theme === "gems" ? 3 : 0);
}

const JUNGLE_BLOCKERS: NavBlocker[] = [
  { x: -31, z: -22, w: 3.2, d: 3.2 },
  { x: -8, z: -30, w: 3.6, d: 3.6 },
  { x: 22, z: -28, w: 3.2, d: 3.2 },
  { x: 34, z: -4, w: 3.6, d: 3.6 },
  { x: 2, z: 31, w: 3.6, d: 3.6 },
  { x: 26, z: 26, w: 3.4, d: 3.4 },
  { x: -27, z: 27, w: 3.4, d: 3.4 },
  { x: -38, z: 5, w: 3.2, d: 3.2 },
  ...JUNGLE_TOWERS.map(([x, , z]) => ({ x, z, w: 3.2, d: 3.2 })),
  ...JUNGLE_SMALL_TREES.map(([x, z]) => ({ x, z, w: 1.7, d: 1.7 })),
  ...JUNGLE_HUTS.flatMap(([x, z]): NavBlocker[] => [
    { x: x - 2.9, z, w: 0.36, d: 5 }, { x: x + 2.9, z, w: 0.36, d: 5 },
    { x, z: z - 2.4, w: 6, d: 0.36 },
    { x: x - 2.05, z: z + 2.4, w: 1.9, d: 0.36 },
    { x: x + 2.05, z: z + 2.4, w: 1.9, d: 0.36 },
  ]),
  ...JUNGLE_LOGS.flatMap(({ x, z, length, angle }): NavBlocker[] =>
    angle === 0
      ? [{ x: x - 3.05, z, w: 0.48, d: length }, { x: x + 3.05, z, w: 0.48, d: length }]
      : [{ x, z: z - 3.05, w: length, d: 0.48 }, { x, z: z + 3.05, w: length, d: 0.48 }],
  ),
];

const GEM_BLOCKERS: NavBlocker[] = [];

const HELL_BLOCKERS: NavBlocker[] = [];
const HEAVEN_BLOCKERS: NavBlocker[] = [[-11,-7],[11,-7],[-12,-24],[12,-24]].map(([x,z])=>({x,z,w:2.6,d:2.6}));

export function getLevelBlockers(level: number): NavBlocker[] {
  const theme = getLevelDefinition(level).theme;
  if (theme === "playground") return ENEMY_BLOCKERS;
  if (theme === "jungle") return JUNGLE_BLOCKERS;
  if (theme === "gems") return GEM_BLOCKERS;
  if (theme === "heaven") return HEAVEN_BLOCKERS;
  return HELL_BLOCKERS;
}

const JUNGLE_LADDERS: LadderZone[] = JUNGLE_TOWERS.map(([x, , z]): LadderZone => ({
    x: x + 3.05, z, w: 2.8, d: 3, minY: 0.45, maxY: 7.35,
    snapX: x + 3.05, snapZ: z, exitX: x + 1.05, exitY: 7.35, exitZ: z,
  }));

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

export function getEnemySpawnPool(level: number, runId = 0, cycle = 0): [number, number, number][] {
  // A run gets its own reproducible layout. All candidates stay on the floor,
  // avoid the world's blockers and keep enemies spread across the arena.
  let seed = (Math.imul(level + 29, 838347) ^ Math.imul(runId + 3, 624059) ^ Math.imul(cycle + 11, 149989)) >>> 0;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const selected: [number, number, number][] = [];
  const pool = [...SPAWN_POOL].sort(() => random() - 0.5);
  const valid = (x: number, z: number) =>
    Math.abs(x) < 44 && Math.abs(z) < 44 &&
    Math.hypot(x, z - getPlayerSpawn(level)[2]) > 12 &&
    !isEnemyPositionBlocked(x, z, getLevelDefinition(level).theme === "gems" || getLevelDefinition(level).theme === "hell" ? 2.2 : 1.4, level) &&
    (getLevelDefinition(level).theme !== "gems" || isGemGroundSpawnValid(x, z, .8)) &&
    selected.every(([sx, , sz]) => Math.hypot(x - sx, z - sz) >= (getLevelDefinition(level).theme === "gems" ? 6 : 8));
  for (let attempt = 0; attempt < 5000 && selected.length < 34; attempt++) {
    const candidate = attempt < pool.length ? pool[attempt] : [(random() - 0.5) * 86, 0, (random() - 0.5) * 86];
    const [x, , z] = candidate;
    if (valid(x, z)) selected.push([x, 0, z]);
  }
  return selected;
}

export function enemyHpScale(level: number, cycle = 0) { return 1 + .07 * Math.min(level + cycle * MAX_STAGE - 1, 9) + .045 * Math.max(level + cycle * MAX_STAGE - 10, 0); }
