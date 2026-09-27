export const MAX_LEVEL = 10;
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
  melee?: boolean;
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
  knife: {
    id: "knife",
    label: "LETTER OPENER",
    magazine: 1,
    reserve: 0,
    damage: 88,
    cooldownMs: 430,
    aimDelayMs: 0,
    pellets: 1,
    hipSpread: 0,
    aimedSpread: 0,
    scopedFov: 70,
    maxRange: 2.55,
    melee: true,
  },
};

export type UpgradeId =
  | "damage"
  | "accuracy"
  | "movement"
  | "reload"
  | "magazine"
  | "jump"
  | "maxHp"
  | "grenades"
  | "fireRate"
  | "killHeal"
  | "knife"
  | "focus";

export type UpgradeCard = {
  id: UpgradeId;
  name: string;
  eyebrow: string;
  description: string;
};

export const UPGRADE_CARDS: UpgradeCard[] = [
  { id: "damage", name: "RED INK", eyebrow: "OFFENSE", description: "+15% damage from every weapon." },
  { id: "accuracy", name: "STEADY HAND", eyebrow: "CONTROL", description: "20% tighter bullet spread." },
  { id: "movement", name: "COFFEE RUN", eyebrow: "MOBILITY", description: "+10% movement speed." },
  { id: "reload", name: "QUICK FINGERS", eyebrow: "TEMPO", description: "Reload 15% faster." },
  { id: "magazine", name: "BIGGER CLIP", eyebrow: "CAPACITY", description: "+20% magazine capacity." },
  { id: "jump", name: "SPRING SHOES", eyebrow: "MOBILITY", description: "Jump 12% higher." },
  { id: "maxHp", name: "THICK SKIN", eyebrow: "SURVIVAL", description: "+25 max HP and heal 25 now." },
  { id: "grenades", name: "DEEP POCKETS", eyebrow: "UTILITY", description: "+1 paper bomb capacity and refill one." },
  { id: "fireRate", name: "TRIGGER HAPPY", eyebrow: "TEMPO", description: "Fire non-sniper weapons 10% faster." },
  { id: "killHeal", name: "SECOND WIND", eyebrow: "SURVIVAL", description: "Recover 6 HP whenever an enemy falls." },
  { id: "knife", name: "CLOSE QUARTERS", eyebrow: "MELEE", description: "+25% knife damage and a little more reach." },
  { id: "focus", name: "FOCUS LENS", eyebrow: "PRECISION", description: "+18% damage while scoped." },
];

export type UpgradeCounts = Record<UpgradeId, number>;

export function blankUpgrades(): UpgradeCounts {
  return {
    damage: 0,
    accuracy: 0,
    movement: 0,
    reload: 0,
    magazine: 0,
    jump: 0,
    maxHp: 0,
    grenades: 0,
    fireRate: 0,
    killHeal: 0,
    knife: 0,
    focus: 0,
  };
}

export function getUpgradeStats(upgrades: UpgradeCounts) {
  return {
    damage: 1 + upgrades.damage * 0.15,
    accuracy: Math.pow(0.8, upgrades.accuracy),
    movement: 1 + upgrades.movement * 0.1,
    reload: Math.max(0.48, Math.pow(0.85, upgrades.reload)),
    magazine: 1 + upgrades.magazine * 0.2,
    jump: 1 + upgrades.jump * 0.12,
    maxHp: 100 + upgrades.maxHp * 25,
    grenadeCapacity: GRENADE_COUNT + upgrades.grenades,
    fireRate: Math.max(0.58, Math.pow(0.9, upgrades.fireRate)),
    killHeal: upgrades.killHeal * 6,
    knifeDamage: 1 + upgrades.knife * 0.25,
    knifeRange: WEAPONS.knife.maxRange + upgrades.knife * 0.2,
    scopedDamage: 1 + upgrades.focus * 0.18,
  };
}

export type MapTheme = "playground" | "jungle" | "gem" | "hell";

export type LevelConfig = {
  level: number;
  name: string;
  theme: MapTheme;
  bosses: number;
  paperwork: number;
  pens: number;
  enemySpeed: number;
  enemyVision: number;
  enemyDamage: number;
};

export const LEVELS: LevelConfig[] = [
  { level: 1, name: "THE PLAYGROUND", theme: "playground", bosses: 3, paperwork: 0, pens: 0, enemySpeed: 0.72, enemyVision: 0.68, enemyDamage: 0.55 },
  { level: 2, name: "THE JUNGLE", theme: "jungle", bosses: 4, paperwork: 1, pens: 0, enemySpeed: 0.78, enemyVision: 0.76, enemyDamage: 0.65 },
  { level: 3, name: "GEM ISLAND", theme: "gem", bosses: 4, paperwork: 1, pens: 1, enemySpeed: 0.85, enemyVision: 0.84, enemyDamage: 0.75 },
  { level: 4, name: "PLAYGROUND // LATE SHIFT", theme: "playground", bosses: 5, paperwork: 1, pens: 1, enemySpeed: 0.93, enemyVision: 0.92, enemyDamage: 0.86 },
  { level: 5, name: "JUNGLE // OVERGROWN", theme: "jungle", bosses: 5, paperwork: 2, pens: 1, enemySpeed: 1.0, enemyVision: 1.0, enemyDamage: 0.96 },
  { level: 6, name: "GEM ISLAND // DEEP CUT", theme: "gem", bosses: 6, paperwork: 2, pens: 1, enemySpeed: 1.08, enemyVision: 1.08, enemyDamage: 1.08 },
  { level: 7, name: "PLAYGROUND // OVERTIME", theme: "playground", bosses: 6, paperwork: 2, pens: 2, enemySpeed: 1.17, enemyVision: 1.16, enemyDamage: 1.2 },
  { level: 8, name: "JUNGLE // NIGHT RUN", theme: "jungle", bosses: 7, paperwork: 3, pens: 2, enemySpeed: 1.26, enemyVision: 1.25, enemyDamage: 1.34 },
  { level: 9, name: "GEM ISLAND // FRACTURE", theme: "gem", bosses: 8, paperwork: 3, pens: 2, enemySpeed: 1.36, enemyVision: 1.36, enemyDamage: 1.52 },
  { level: 10, name: "THE HELL", theme: "hell", bosses: 9, paperwork: 4, pens: 3, enemySpeed: 1.52, enemyVision: 1.5, enemyDamage: 1.78 },
];

export function getLevelConfig(level: number) {
  return LEVELS[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];
}

export function getLevelTargetCount(level: number) {
  const config = getLevelConfig(level);
  return config.bosses + config.paperwork + config.pens;
}

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

const JUNGLE_BLOCKERS = [
  [-38, -34, 3.2, 3.2], [-19, -26, 2.8, 2.8], [4, -35, 3.2, 3.2],
  [28, -29, 3.0, 3.0], [41, -8, 3.4, 3.4], [-41, 3, 3.2, 3.2],
  [-25, 20, 3.0, 3.0], [0, 15, 4.0, 4.0], [25, 18, 3.2, 3.2],
  [40, 36, 3.3, 3.3], [-38, 39, 3.4, 3.4], [9, 39, 3.5, 3.5],
].map(([x,z,w,d]) => ({ x, z, w, d }));

const GEM_BLOCKERS = [
  [-35, -30, 9, 9], [-8, -34, 7, 7], [24, -31, 10, 10],
  [39, -4, 8, 8], [-39, 4, 8, 8], [-20, 27, 10, 10],
  [10, 22, 8, 8], [36, 35, 10, 10],
].map(([x,z,w,d]) => ({ x, z, w, d }));

export function getEnemyBlockers(level: number) {
  const theme = getLevelConfig(level).theme;
  if (theme === "playground") return ENEMY_BLOCKERS;
  if (theme === "jungle") return JUNGLE_BLOCKERS;
  return GEM_BLOCKERS;
}

const SPAWN_POOL: Record<MapTheme, [number, number, number][]> = {
  playground: [
    [-46,0,-42],[-17,0,-44],[8,0,-39],[46,0,-42],[-46,0,7],[46,0,13],
    [-39,0,40],[22,0,43],[-31,0,-7],[-4,0,34],[34,0,25],[9,0,9],
    [-22,0,32],[31,0,-5],[-8,0,-18],[41,0,42],[-43,0,-22],[18,0,31],
  ],
  jungle: [
    [-45,0,-44],[-28,0,-40],[-5,0,-45],[18,0,-43],[44,0,-39],[-47,0,-16],
    [-30,0,-6],[-7,0,-12],[16,0,-10],[39,0,3],[-45,0,28],[-17,0,39],
    [6,0,34],[28,0,42],[46,0,24],[-4,0,5],[18,0,8],[34,0,-18],
  ],
  gem: [
    [-45,0,-43],[-23,0,-43],[7,0,-44],[39,0,-41],[-45,0,-14],[-22,0,-9],
    [9,0,-12],[44,0,11],[-43,0,30],[-8,0,39],[17,0,40],[45,0,44],
    [4,0,7],[29,0,10],[-30,0,14],[17,0,-25],[-3,0,29],[43,0,-20],
  ],
  hell: [
    [-45,0,-43],[-23,0,-43],[7,0,-44],[39,0,-41],[-45,0,-14],[-22,0,-9],
    [9,0,-12],[44,0,11],[-43,0,30],[-8,0,39],[17,0,40],[45,0,44],
    [4,0,7],[29,0,10],[-30,0,14],[17,0,-25],[-3,0,29],[43,0,-20],
  ],
};

function rotatePool(pool: [number, number, number][], level: number) {
  const shift = (level * 3) % pool.length;
  return [...pool.slice(shift), ...pool.slice(0, shift)];
}

export function getLevelSpawns(level: number) {
  const cfg = getLevelConfig(level);
  const pool = rotatePool(SPAWN_POOL[cfg.theme], level);
  const bosses = pool.slice(0, cfg.bosses);
  const paperwork = pool.slice(cfg.bosses, cfg.bosses + cfg.paperwork);
  const pens = pool.slice(
    cfg.bosses + cfg.paperwork,
    cfg.bosses + cfg.paperwork + cfg.pens,
  );
  return { bosses, paperwork, pens };
}

const PICKUPS: Record<MapTheme, [number, number, number][]> = {
  playground: [[-7,.55,-20],[23,.55,18],[-25,.55,17],[7,.55,31],[-3,.55,35],[41,.55,-8],[-43,.55,31],[34,9.05,-34]],
  jungle: [[-12,.55,-22],[22,.55,-18],[-35,.55,13],[5,.55,27],[34,.55,31],[-42,.55,-30]],
  gem: [[-16,.55,-18],[20,.55,-17],[-35,.55,18],[6,.55,31],[35,.55,23],[-2,.55,-40]],
  hell: [[-16,.55,-18],[20,.55,-17],[-35,.55,18],[6,.55,31],[35,.55,23],[-2,.55,-40]],
};

export function getPickupSpawns(level: number) {
  return PICKUPS[getLevelConfig(level).theme];
}

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
    x: 44.35, z: -34, w: 2.7, d: 3.3, minY: 0.45, maxY: 9.35,
    snapX: 45.72, snapZ: -34, exitX: 42.0, exitY: 9.48, exitZ: -34,
  },
  {
    x: -29.85, z: 35, w: 2.8, d: 3.0, minY: 0.45, maxY: 7.35,
    snapX: -28.95, snapZ: 35, exitX: -30.95, exitY: 7.35, exitZ: 35,
  },
];

export function getLadderZones(level: number) {
  return getLevelConfig(level).theme === "playground" ? LADDER_ZONES : [];
}

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
