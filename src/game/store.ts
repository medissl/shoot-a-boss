import { create } from "zustand";
import { GRENADE_COUNT, WEAPONS, type WeaponId } from "./config";
import { stageCoinReward, stageXpReward } from "./balance";
import { getPlayerSpawn, getTargetCount } from "./levels";
import { ELEMENTS, emptyMagicChoices, isMilestone, magicCost, magicStats, type Element, type Branch, type MagicChoices } from "./magicTree";
import { SKIN_IDS, normalizeSkin, rollSkin, type SkinId } from "./skins";
import { availableEvolutions, EVOLUTIONS, type EvolutionId } from "./evolutions";
import { emitCardProc } from "./procFeedback";
import {
  emptyUpgrades,
  getUpgradeStats,
  getUpgradeCard,
  rollUpgradeChoices,
  type UpgradeId,
  type UpgradeLevels,
} from "./progression";

type AmmoState = Record<WeaponId, { mag: number; reserve: number }>;
type Champion = { cycle: number; level: number; hearts: number; upgrades: UpgradeLevels; ready: boolean };
type DreamAnchor = { level: number; cycle: number; upgrades: UpgradeLevels; evolutions: EvolutionId[] };
export type TutorialId = "controls" | "cards" | "xp" | "levelUp" | "skillPoint" | "magic" | "magicAwakened" | "coins" | "gear" | "shop" | "crates" | "hearts" | "anchor" | "scan" | "evolution";
export const SAVE_VERSION = 2;
type TutorialFlags = Record<TutorialId, boolean>;
const freshTutorials = (): TutorialFlags => ({ controls:false, cards:false, xp:false, levelUp:false, skillPoint:false, magic:false, magicAwakened:false, coins:false, gear:false, shop:false, crates:false, hearts:false, anchor:false, scan:false, evolution:false });
export const MAGIC_TYPES = ELEMENTS;
export type MagicType = Element;
export type SkinColor = SkinId;
export const SKIN_COLORS = SKIN_IDS;
export type Skins = Record<WeaponId, SkinId[]>;
export type EquippedSkins = Record<WeaponId, SkinId>;
const emptySkins = (): Skins => ({ sniper: ["default"], rifle: ["default"], shotgun: ["default"], knife: ["default"] });
const defaultSkins = (): EquippedSkins => ({ sniper: "default", rifle: "default", shotgun: "default", knife: "default" });
const emptyMagic = (): Record<MagicType, number> => ({ fire: 0, crystal: 0, ice: 0, water: 0, thunder: 0 });
export const xpToNextLevel = (level: number) => Math.round(170 + 48 * level + 2.4 * level * level);
export type GearId = "vest" | "boots" | "barrel" | "medallion" | "skates" | "aegis" | "lens" | "satchel" | "arcana";
export const GEAR: { id: GearId; name: string; detail: string; cost: number }[] = [
  { id: "vest", name: "IRON VEST", detail: "+8 maximum HP per rank", cost: 100 },
  { id: "boots", name: "QUICK BOOTS", detail: "+2.5% movement per rank", cost: 100 },
  { id: "barrel", name: "INK BARREL", detail: "+3% firearm damage per rank", cost: 120 },
  { id: "medallion", name: "LIFE MEDALLION", detail: "Heal 2 HP on elimination per rank", cost: 140 },
  { id: "skates", name: "INK SKATES", detail: "+5% slide speed per rank", cost: 110 },
  { id: "aegis", name: "PAPER AEGIS", detail: "Start each round with a shield charge (up to 3)", cost: 180 },
  { id: "lens", name: "SCOUT LENS", detail: "+2 seconds of Q mark time per rank", cost: 120 },
  { id: "satchel", name: "EXTRA SATCHEL", detail: "+1 bomb at ranks 1, 3 and 5", cost: 110 },
  { id: "arcana", name: "ARCANE PEN", detail: "+3% magic damage and -1% magic cooldown per rank", cost: 190 },
];
export type GearLevels = Record<GearId, number>;
export const gearCap = (id: GearId) => id === "aegis" ? 3 : 5;
export const MAX_HEARTS = 5;
const CHAMPION_KEY = "shoot-a-boss:champion";
const HEARTS_KEY = "shoot-a-boss:hearts";
const SAVE_KEY = "shoot-a-boss:campaign";
function migrateSave(raw: Record<string, unknown>): Record<string, unknown> {
  const version = Number(raw.saveVersion) || 0;
  if (version >= SAVE_VERSION) return raw;
  const tutorials = { ...freshTutorials(), ...(raw.tutorials && typeof raw.tutorials === "object" ? raw.tutorials as Partial<TutorialFlags> : {}) };
  tutorials.controls = tutorials.controls || raw.tutorialSeen === true;
  const magic = raw.magic as Partial<Record<MagicType, number>> | undefined;
  if (magic && Object.values(magic).some(rank => Number(rank) > 0)) tutorials.magic = true;
  try { if (Object.values(JSON.parse(localStorage.getItem("shoot-a-boss:gear") || "{}") as Record<string, number>).some(rank => rank > 0)) tutorials.gear = true; } catch { /* Preserve the remaining save. */ }
  const skins = raw.skins as Partial<Skins> | undefined;
  if (skins && Object.values(skins).some(items => items?.some(id => id !== "default"))) tutorials.crates = true;
  return { ...raw, saveVersion: SAVE_VERSION, tutorials };
}
const readSave = (): Record<string, unknown> => { try { return migrateSave(JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") ?? {}); } catch { return {}; } };
const saved = typeof window === "undefined" ? {} : readSave();
const allGearIds = GEAR.map(({ id }) => id);
const equippedFromSave = (gear: GearLevels): GearId[] => {
  const raw = saved.equippedGear;
  if (Array.isArray(raw)) return [...new Set(raw.filter((id): id is GearId => allGearIds.includes(id as GearId) && gear[id as GearId] > 0))].slice(0, 4);
  return allGearIds.filter(id => gear[id] > 0).sort((a, b) => gear[b] - gear[a] || allGearIds.indexOf(a) - allGearIds.indexOf(b)).slice(0, 4);
};
const activeGear = (state: Pick<GameStore, "gear" | "equippedGear">): GearLevels =>
  Object.fromEntries(allGearIds.map(id => [id, state.equippedGear.includes(id) ? state.gear[id] : 0])) as GearLevels;
export const equippedGearRank = (state: Pick<GameStore, "gear" | "equippedGear">, id: GearId) => state.equippedGear.includes(id) ? state.gear[id] : 0;
function persist(state: GameStore) {
  if (state.practiceActive) return;
  const postStage = ["stageClear", "levelUp", "reward", "upgrade", "evolution"].includes(state.screen);
  const pendingDraft = postStage && !state.selectedUpgrade && state.upgradeChoices.length > 0;
  const level = postStage ? state.currentLevel : state.currentLevel;
  localStorage.setItem(SAVE_KEY, JSON.stringify({ saveVersion: SAVE_VERSION, level, cycle: state.ngPlusCycle, upgrades: state.upgrades,
    pendingDraft, pendingChoices: pendingDraft ? state.upgradeChoices : [], pendingRerolls: state.upgradeRerollsLeft,
    postStageScreen: postStage ? state.screen : null, selectedUpgrade: state.selectedUpgrade, selectedEvolution: state.selectedEvolution,
    lastReward: state.lastReward, lastPerformanceBonus: state.lastPerformanceBonus, lastXpReward: state.lastXpReward,
    lastLevelGain: state.lastLevelGain, lastSpGain: state.lastSpGain, lastClearMs: state.lastClearMs,
    postStageHp: postStage ? state.hp : null,
    xp: state.xp, playerLevel: state.playerLevel, skillPoints: state.skillPoints, magic: state.magic, magicChoices: state.magicChoices, selectedMagic: state.selectedMagic,
    skins: state.skins, equippedSkins: state.equippedSkins, equippedGear: state.equippedGear,
    anchor: state.anchor, evolutions: state.evolutions, claimedRewards: state.claimedRewards, hearts: state.hearts, coins: state.coins,
    unlockedLevel: state.unlockedLevel, tutorialSeen: state.tutorialSeen, tutorials: state.tutorials,
    tutorialQueue: state.tutorialQueue, activeTutorial: state.activeTutorial, preStage: state.preStage, postStageReturn: state.postStageReturn }));
}
function restoredUpgrades(): UpgradeLevels {
  const upgrades = emptyUpgrades();
  const raw = saved.upgrades as Record<string, number> | undefined;
  for (const id of Object.keys(upgrades) as UpgradeId[]) upgrades[id] = Math.min(getUpgradeCard(id).maxStacks, Math.max(0, Math.floor(Number(raw?.[id]) || 0)));
  return upgrades;
}
function restoredMagic(): Record<MagicType, number> {
  const magic = emptyMagic();
  const raw = saved.magic as Record<string, number> | undefined;
  for (const kind of MAGIC_TYPES) magic[kind] = Math.min(20, Math.max(0, Math.floor(Number(raw?.[kind]) || 0)));
  return magic;
}
function restoredMagicChoices(): MagicChoices {
  const choices = emptyMagicChoices();
  const raw = saved.magicChoices as Record<string, Record<number, unknown>> | undefined;
  for (const kind of MAGIC_TYPES) for (let tier = 2; tier <= 20; tier++) {
    const value = raw?.[kind]?.[tier];
    if (value === "force" || value === "tempo" || value === "craft") choices[kind][tier] = value;
  }
  return choices;
}
function restoredSkins(): Skins {
  const result = emptySkins();
  const raw = saved.skins as Partial<Record<WeaponId, string[]>> | undefined;
  for (const weapon of weaponOrder) result[weapon] = ["default", ...new Set((raw?.[weapon] ?? []).map(normalizeSkin).filter((id): id is SkinId => id !== null && id !== "default"))];
  return result;
}
function restoredEquippedSkins(owned:Skins):EquippedSkins {
  const raw = saved.equippedSkins as Partial<Record<WeaponId,string>> | undefined;
  const result=defaultSkins();
  for(const weapon of weaponOrder){const id=normalizeSkin(raw?.[weapon]);if(id && owned[weapon].includes(id))result[weapon]=id;}
  return result;
}

export type GameScreen =
  | "story"
  | "comic"
  | "menu"
  | "playing"
  | "paused"
  | "upgrade"
  | "evolution"
  | "stageClear"
  | "levelUp"
  | "reward"
  | "practiceResult"
  | "won"
  | "lost"
  | "purged";

export type MovementMode = "idle" | "walk" | "run" | "crouch" | "slide";

const BASE_RELOAD_MS: Partial<Record<WeaponId, number>> = {
  sniper: 1750,
  rifle: 1500,
  shotgun: 2000,
};

type GameStore = {
  screen: GameScreen;
  runId: number;
  currentLevel: number;
  unlockedLevel: number;
  hearts: number;
  ngPlusCycle: number;
  champion: Champion | null;
  coins: number;
  gear: GearLevels;
  equippedGear: GearId[];
  anchor: DreamAnchor;
  evolutions: EvolutionId[];
  selectedEvolution: EvolutionId | null;
  weaponUsage: Record<WeaponId, { shots: number; damage: number; kills: number }>;
  lastHitWeapon: Record<string, WeaponId>;
  preStage: { level: number; practice: boolean } | null;
  postStageReturn: GameScreen | null;
  practiceActive: boolean;
  practiceReturn: { level: number; upgrades: UpgradeLevels; evolutions: EvolutionId[] } | null;
  tutorialQueue: TutorialId[];
  activeTutorial: TutorialId | null;
  crunchUntil: number;
  crunchCooldownUntil: number;
  recentKills: number[];
  paperTrailUntil: number;
  skateBoostUntil: number;
  inboxCooldownUntil: number;
  magicCastCount: number;
  expenseCooldownUntil: number;
  eventTarget: string | null;
  hazardSuppressedUntil: number;
  claimedRewards: string[];
  tutorialSeen: boolean;
  tutorials: TutorialFlags;
  lastReward: number;
  lastPerformanceBonus: number;
  lastXpReward: number;
  lastLevelGain: number;
  lastSpGain: number;
  lastClearMs: number;
  stageStartedAt: number;
  lastDeathCollapsed: boolean;
  xp: number;
  playerLevel: number;
  skillPoints: number;
  magic: Record<MagicType, number>;
  magicChoices: MagicChoices;
  selectedMagic: MagicType | null;
  magicReadyAt: number;
  skins: Skins;
  equippedSkins: EquippedSkins;
  targetCount: number;
  hp: number;
  maxHp: number;
  guardHp: number;
  vestGuardUsed: boolean;
  freshPrintShots: number;
  weapon: WeaponId;
  ammo: AmmoState;
  grenades: number;
  eliminated: string[];
  upgrades: UpgradeLevels;
  upgradeChoices: UpgradeId[];
  upgradeRerollsLeft: number;
  selectedUpgrade: UpgradeId | null;
  tutorialOpen: boolean;
  scanTargets: string[];
  scanUntil: number;
  scanCooldownUntil: number;
  sensitivity: number;
  bgmVolume: number;
  sfxVolume: number;
  scoped: boolean;
  playerPosition: [number, number, number];
  playerYaw: number;
  enemyPositions: Record<string, [number, number, number]>;
  shieldReadyAt: number;
  shieldCharges: number;
  speedBoostUntil: number;
  speedBoostActive: boolean;
  movementMode: MovementMode;
  reloading: boolean;
  reloadingWeapon: WeaponId | null;
  reloadStartedAt: number;
  reloadDurationMs: number;
  reloadToken: number;
  startGame: () => void;
  startLevel: (level: number) => void;
  startNewGamePlus: () => void;
  nextLevel: () => void;
  chooseUpgrade: (id: UpgradeId) => void;
  chooseEvolution: (id: EvolutionId) => void;
  undoEvolution: () => void;
  undoUpgrade: () => void;
  continueAfterVictory: () => void;
  advanceResult: () => void;
  continueDraft: () => void;
  continueEvolution: () => void;
  prepareStage: (level: number, practice?: boolean) => void;
  startPreparedStage: () => void;
  recordWeaponShot: (weapon: WeaponId) => void;
  recordWeaponHit: (id: string, weapon: WeaponId, damage: number) => void;
  openMagicFromResult: () => void;
  returnFromMagic: () => void;
  queueTutorial: (id: TutorialId, replay?: boolean) => void;
  completeTutorial: () => void;
  buyGear: (id: GearId) => void;
  toggleGear: (id: GearId) => void;
  buyHeart: () => void;
  refillHearts: () => void;
  buyCrate: (weapon: WeaponId) => SkinColor | null;
  equipSkin: (weapon: WeaponId, color: SkinColor) => void;
  unlockMagic: (kind: MagicType, branch?: Branch) => void;
  selectMagic: (kind: MagicType) => void;
  castMagic: () => boolean;
  resetData: () => void;
  rerollUpgrades: () => void;
  closeTutorial: () => void;
  markTutorial: (id: TutorialId) => void;
  triggerScan: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  goToMenu: () => void;
  readComic: () => void;
  setWeapon: (weapon: WeaponId) => void;
  cycleWeapon: (direction: 1 | -1) => void;
  spendRound: (weapon: WeaponId) => boolean;
  reload: () => void;
  spendGrenade: () => boolean;
  refillGrenades: (amount?: number) => void;
  grantSpeedBoost: (durationMs?: number) => void;
  grantDreamCache: () => void;
  setEventTarget: (id: string | null) => void;
  suppressHazard: (durationMs: number) => void;
  damagePlayer: (amount: number, source?: [number, number, number], hazard?: boolean) => void;
  eliminate: (id: string) => void;
  setSensitivity: (value: number) => void;
  setBgmVolume: (value: number) => void;
  setSfxVolume: (value: number) => void;
  setScoped: (value: boolean) => void;
  setPlayerPosition: (value: [number, number, number]) => void;
  setPlayerYaw: (value: number) => void;
  setEnemyPosition: (id: string, position: [number, number, number]) => void;
  setMovementMode: (value: MovementMode) => void;
};

function readStoredVolume(key: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : fallback;
}
function readSensitivity() {
  if (typeof window === "undefined") return .85;
  const value = Number(window.localStorage.getItem("shoot-a-boss:sensitivity"));
  return Number.isFinite(value) && value >= .25 && value <= 1.6 ? value : .85;
}

function readUnlockedLevel() {
  if (typeof window === "undefined") return 1;
  const parsed = Number(window.localStorage.getItem("shoot-a-boss:unlocked-level"));
  return Number.isFinite(parsed) ? Math.min(10, Math.max(1, parsed)) : 1;
}

function writeUnlockedLevel(level: number) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      "shoot-a-boss:unlocked-level",
      String(Math.min(10, Math.max(1, level))),
    );
  }
}

function readHearts() {
  if (typeof window === "undefined") return MAX_HEARTS;
  const raw = window.localStorage.getItem(HEARTS_KEY);
  if (raw === null) return MAX_HEARTS;
  const stored = Number(raw);
  if (stored === 0) { window.localStorage.setItem(HEARTS_KEY, String(MAX_HEARTS)); return MAX_HEARTS; }
  return Number.isInteger(stored) && stored >= 0 && stored <= MAX_HEARTS ? stored : MAX_HEARTS;
}

function writeHearts(hearts: number) {
  if (typeof window !== "undefined") window.localStorage.setItem(HEARTS_KEY, String(hearts));
}

function readCoins() {
  const value = Number(window.localStorage.getItem("shoot-a-boss:coins"));
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function readGear(): GearLevels {
  let raw: Record<string, unknown> = {};
  try { raw = JSON.parse(window.localStorage.getItem("shoot-a-boss:gear") ?? "{}") ?? {}; } catch { /* Corrupt saves start clean. */ }
  return Object.fromEntries(GEAR.map(({ id }) => [id, Number.isInteger(raw[id]) ? Math.min(gearCap(id), Math.max(0, Number(raw[id]))) : 0])) as GearLevels;
}

export function gearCost(id: GearId, rank: number) {
  return Math.round(GEAR.find((item) => item.id === id)!.cost * [1, 1.5, 2.1, 2.9, 3.8][rank]);
}

function readChampion(): Champion | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(CHAMPION_KEY) ?? "null") as Partial<Champion> | null;
    if (!value || !Number.isInteger(value.cycle) || !Number.isInteger(value.level) ||
      !Number.isInteger(value.hearts) || !value.upgrades || value.hearts! < 1) return null;
    const clean = emptyUpgrades();
    for (const id of Object.keys(clean) as UpgradeId[]) {
      const amount = value.upgrades[id];
      clean[id] = Number.isFinite(amount) ? Math.min(getUpgradeCard(id).maxStacks, Math.max(0, Math.floor(amount))) : 0;
    }
    return {
      cycle: Math.max(0, Math.floor(value.cycle!)),
      level: Math.min(10, Math.max(1, value.level!)),
      hearts: Math.min(MAX_HEARTS, value.hearts!),
      upgrades: clean,
      ready: value.ready === true,
    };
  } catch { return null; }
}

function writeChampion(champion: Champion | null) {
  if (typeof window === "undefined") return;
  if (champion) window.localStorage.setItem(CHAMPION_KEY, JSON.stringify(champion));
  else window.localStorage.removeItem(CHAMPION_KEY);
}

function magazineSize(weapon: WeaponId, upgrades: UpgradeLevels) {
  if (weapon === "knife") return 0;
  return Math.max(
    1,
    Math.round(WEAPONS[weapon].magazine * getUpgradeStats(upgrades).magazine),
  );
}

function freshAmmo(upgrades: UpgradeLevels): AmmoState {
  return {
    sniper: {
      mag: magazineSize("sniper", upgrades),
      reserve: WEAPONS.sniper.reserve,
    },
    rifle: {
      mag: magazineSize("rifle", upgrades),
      reserve: WEAPONS.rifle.reserve,
    },
    shotgun: {
      mag: magazineSize("shotgun", upgrades),
      reserve: WEAPONS.shotgun.reserve,
    },
    knife: { mag: 0, reserve: 0 },
  };
}

const weaponOrder: WeaponId[] = ["sniper", "rifle", "shotgun", "knife"];

export const satchelBonus = (rank: number) => rank >= 5 ? 3 : rank >= 3 ? 2 : rank >= 1 ? 1 : 0;
function freshRun(level: number, upgrades: UpgradeLevels, cycle = 0, gear: GearLevels = { vest: 0, boots: 0, barrel: 0, medallion: 0, skates: 0, aegis: 0, lens: 0, satchel: 0, arcana: 0 }) {
  const stats = getUpgradeStats(upgrades);

  return {
    currentLevel: level,
    stageStartedAt: performance.now(),
    targetCount: getTargetCount(level, cycle),
    hp: stats.maxHp + gear.vest * 8,
    maxHp: stats.maxHp + gear.vest * 8,
    guardHp: 0,
    vestGuardUsed: false,
    freshPrintShots: 0,
    weapon: "rifle" as WeaponId,
    ammo: freshAmmo(upgrades),
    grenades: stats.grenadeCapacity + satchelBonus(gear.satchel) || GRENADE_COUNT,
    eliminated: [] as string[],
    weaponUsage: Object.fromEntries(weaponOrder.map(id => [id, { shots: 0, damage: 0, kills: 0 }])) as Record<WeaponId, { shots: number; damage: number; kills: number }>,
    lastHitWeapon: {} as Record<string, WeaponId>,
    scanTargets: [] as string[],
    scanUntil: 0,
    scanCooldownUntil: 0,
    scoped: false,
    playerPosition: getPlayerSpawn(level),
    playerYaw: 0,
    enemyPositions: {} as Record<string, [number, number, number]>,
    shieldReadyAt: 0,
    crunchUntil: 0,
    crunchCooldownUntil: 0,
    recentKills: [] as number[],
    paperTrailUntil: 0,
    skateBoostUntil: 0,
    inboxCooldownUntil: 0,
    magicCastCount: 0,
    expenseCooldownUntil: 0,
    eventTarget: null as string | null,
    hazardSuppressedUntil: 0,
    shieldCharges: Math.min(5, gear.aegis + upgrades.shieldReserve),
    speedBoostUntil: 0,
    speedBoostActive: false,
    movementMode: "idle" as MovementMode,
    reloading: false,
    reloadingWeapon: null as WeaponId | null,
    reloadStartedAt: 0,
    reloadDurationMs: 0,
    reloadToken: 0,
  };
}

function cancelReload(
  set: (state: Partial<GameStore>) => void,
  get: () => GameStore,
) {
  set({
    reloading: false,
    reloadingWeapon: null,
    reloadStartedAt: 0,
    reloadDurationMs: 0,
    reloadToken: get().reloadToken + 1,
  });
}

function announceRifle() {
  window.dispatchEvent(
    new CustomEvent("weapon-selected", {
      detail: { weapon: "rifle" as WeaponId },
    }),
  );
}
let lastDirectHitAt = -Infinity;

export const useGameStore = create<GameStore>((set, get) => {
  const initialUpgrades = restoredUpgrades();
  const returningPlayer = typeof window !== "undefined" && (
    window.localStorage.getItem(SAVE_KEY) !== null || readUnlockedLevel() > 1 ||
    readHearts() < MAX_HEARTS || readCoins() > 0 || readChampion() !== null
  );
  const initialRun = freshRun(Math.min(readUnlockedLevel(), Math.max(1, Number(saved.level) || readUnlockedLevel())), initialUpgrades, Math.max(0, Number(saved.cycle) || 0),
    activeGear({ gear: typeof window === "undefined" ? Object.fromEntries(allGearIds.map(id => [id, 0])) as GearLevels : readGear(), equippedGear: typeof window === "undefined" ? [] : equippedFromSave(readGear()) }));

  return {
    screen: ["stageClear", "levelUp", "reward", "upgrade", "evolution"].includes(String(saved.postStageScreen))
      ? saved.postStageScreen as GameScreen : saved.pendingDraft === true ? "upgrade" : returningPlayer ? "menu" : "story",
    runId: 0,
    unlockedLevel: readUnlockedLevel(),
    hearts: readHearts(),
    ngPlusCycle: Math.max(0, Math.floor(Number(saved.cycle) || 0)),
    champion: readChampion(),
    coins: typeof window === "undefined" ? 0 : readCoins(),
    gear: typeof window === "undefined" ? { vest: 0, boots: 0, barrel: 0, medallion: 0, skates: 0, aegis: 0, lens: 0, satchel: 0, arcana: 0 } : readGear(),
    equippedGear: typeof window === "undefined" ? [] : equippedFromSave(readGear()),
    anchor: saved.anchor && typeof saved.anchor === "object" && Number.isInteger((saved.anchor as DreamAnchor).level)
      ? { ...saved.anchor as DreamAnchor, evolutions: Array.isArray((saved.anchor as DreamAnchor).evolutions) ? (saved.anchor as DreamAnchor).evolutions : [] }
      : { level: 1, cycle: 0, upgrades: emptyUpgrades(), evolutions: [] },
    evolutions: Array.isArray(saved.evolutions) ? saved.evolutions.filter((id): id is EvolutionId => typeof id === "string" && EVOLUTIONS.some(item => item.id === id)) : [],
    claimedRewards: Array.isArray(saved.claimedRewards) ? saved.claimedRewards.filter((entry): entry is string => typeof entry === "string") : [],
    preStage: saved.preStage && typeof saved.preStage === "object" && Number.isInteger((saved.preStage as { level: number }).level)
      ? saved.preStage as { level: number; practice: boolean } : null,
    postStageReturn: typeof saved.postStageReturn === "string" ? saved.postStageReturn as GameScreen : null,
    practiceActive: false,
    practiceReturn: null,
    tutorialQueue: Array.isArray(saved.tutorialQueue) ? saved.tutorialQueue.filter((id): id is TutorialId => typeof id === "string" && id in freshTutorials()) : [],
    activeTutorial: typeof saved.activeTutorial === "string" && saved.activeTutorial in freshTutorials() ? saved.activeTutorial as TutorialId : null,
    tutorialSeen: saved.tutorialSeen === true || (saved.tutorials as Partial<TutorialFlags> | undefined)?.controls === true,
    tutorials: { ...freshTutorials(), ...saved.tutorials as Partial<TutorialFlags>, controls: saved.tutorialSeen === true || (saved.tutorials as Partial<TutorialFlags> | undefined)?.controls === true },
    lastReward: Number(saved.lastReward) || 0,
    lastPerformanceBonus: Number(saved.lastPerformanceBonus) || 0,
    lastXpReward: Number(saved.lastXpReward) || 0,
    lastLevelGain: Number(saved.lastLevelGain) || 0,
    lastSpGain: Number(saved.lastSpGain) || 0,
    lastClearMs: Number(saved.lastClearMs) || 0,
    lastDeathCollapsed: false,
    xp: Math.max(0, Number(saved.xp) || 0),
    playerLevel: Math.max(1, Math.floor(Number(saved.playerLevel) || 1)),
    skillPoints: Math.max(0, Math.floor(Number(saved.skillPoints) || 0)),
    magic: restoredMagic(),
    magicChoices: restoredMagicChoices(),
    selectedMagic: MAGIC_TYPES.includes(saved.selectedMagic as MagicType) ? saved.selectedMagic as MagicType : null,
    magicReadyAt: 0,
    skins: restoredSkins(),
    equippedSkins: restoredEquippedSkins(restoredSkins()),
    upgrades: initialUpgrades,
    upgradeChoices: saved.pendingDraft === true && Array.isArray(saved.pendingChoices) ? saved.pendingChoices.filter((id): id is UpgradeId => typeof id === "string" && Boolean(getUpgradeCard(id as UpgradeId))) : [],
    upgradeRerollsLeft: Math.max(0, Math.min(1, Number(saved.pendingRerolls) || 0)),
    selectedUpgrade: typeof saved.selectedUpgrade === "string" && Boolean(getUpgradeCard(saved.selectedUpgrade as UpgradeId)) ? saved.selectedUpgrade as UpgradeId : null,
    selectedEvolution: typeof saved.selectedEvolution === "string" && EVOLUTIONS.some(item => item.id === saved.selectedEvolution) ? saved.selectedEvolution as EvolutionId : null,
    tutorialOpen: false,
    ...initialRun,
    hp: saved.postStageScreen && Number.isFinite(saved.postStageHp) ? Number(saved.postStageHp) : initialRun.hp,
    sensitivity: readSensitivity(),
    bgmVolume: readStoredVolume("shoot-a-boss:bgm-volume", 0.34),
    sfxVolume: readStoredVolume("shoot-a-boss:sfx-volume", 0.42),

    startGame: () => {
      const upgrades = get().upgrades;
      const hearts = get().hearts;
      if (hearts <= 0) return;
      writeHearts(hearts);
      set((state) => ({
        screen: "playing",
        runId: state.runId + 1,
        upgrades,
        hearts,
        ngPlusCycle: state.ngPlusCycle,
        upgradeChoices: [],
        upgradeRerollsLeft: 1,
        selectedUpgrade: null, selectedEvolution: null,
        tutorialOpen: state.currentLevel === 1 && state.ngPlusCycle === 0 && !state.tutorialSeen,
        ...freshRun(state.currentLevel, upgrades, state.ngPlusCycle, activeGear(state)),
      }));
      announceRifle();
      window.dispatchEvent(new Event("stage-selected"));
    },

    startLevel: (level) => {
      const safeLevel = Math.min(10, Math.max(1, level));
      const state = get();
      if (safeLevel !== state.currentLevel || state.ngPlusCycle > 0 || safeLevel > state.unlockedLevel) return;
      const upgrades = state.upgrades;
      const hearts = get().hearts;
      if (hearts <= 0) return;
      writeHearts(hearts);
      set((state) => ({
        screen: "playing",
        runId: state.runId + 1,
        upgrades,
        hearts,
        ngPlusCycle: state.ngPlusCycle,
        upgradeChoices: [],
        upgradeRerollsLeft: 1,
        selectedUpgrade: null, selectedEvolution: null,
        tutorialOpen: safeLevel === 1 && !state.tutorialSeen,
        ...freshRun(safeLevel, upgrades, state.ngPlusCycle, activeGear(state)),
      }));
      announceRifle();
      window.dispatchEvent(new Event("stage-selected"));
    },

    prepareStage: (level, practice = false) => {
      const state = get();
      if (level < 1 || level > 10 || (practice ? level > (state.champion?.ready ? 10 : state.currentLevel - 1) : level !== state.currentLevel && !(level === 1 && state.champion?.ready))) return;
      set({ preStage: { level, practice }, screen: "menu" });
      persist(get());
    },
    startPreparedStage: () => {
      const state = get();
      const choice = state.preStage;
      if (!choice) return;
      if (choice.practice) {
        const practiceReturn = { level: state.currentLevel, upgrades: { ...state.upgrades }, evolutions: [...state.evolutions] };
        set({ practiceReturn, practiceActive: true, preStage: null,
          screen: "playing", runId: state.runId + 1, tutorialOpen: false,
          ...freshRun(choice.level, state.upgrades, state.ngPlusCycle, activeGear(state)) });
        announceRifle();
        return;
      }
      set({ preStage: null });
      if (state.ngPlusCycle > 0 || state.champion?.ready) get().startNewGamePlus();
      else get().startLevel(choice.level);
    },
    openMagicFromResult: () => {
      const state = get();
      if (!["levelUp", "reward"].includes(state.screen)) return;
      set({ postStageReturn: state.screen, screen: "menu", preStage: null });
      persist(get());
    },
    returnFromMagic: () => {
      const screen = get().postStageReturn;
      if (!screen) return;
      set({ screen, postStageReturn: null }); persist(get());
    },
    recordWeaponShot: (weapon) => set(state => ({ weaponUsage: { ...state.weaponUsage,
      [weapon]: { ...state.weaponUsage[weapon], shots: state.weaponUsage[weapon].shots + 1 } } })),
    recordWeaponHit: (id, weapon, damage) => set(state => ({ weaponUsage: { ...state.weaponUsage,
      [weapon]: { ...state.weaponUsage[weapon], damage: state.weaponUsage[weapon].damage + damage } },
      lastHitWeapon: { ...state.lastHitWeapon, [id]: weapon } })),

    startNewGamePlus: () => {
      const { champion, unlockedLevel } = get();
      if (!champion || unlockedLevel < 10 || champion.hearts <= 0 || get().hearts <= 0) return;
      const hearts = Math.min(champion.hearts, get().hearts);
      const cycle = champion.ready ? champion.cycle + 1 : champion.cycle;
      const level = champion.ready ? 1 : champion.level;
      const nextChampion = { ...champion, cycle, level, hearts, ready: false };
      writeChampion(nextChampion);
      set((state) => ({
        screen: "playing", runId: state.runId + 1,
        hearts, ngPlusCycle: cycle, champion: nextChampion,
        upgrades: champion.upgrades, upgradeChoices: [], upgradeRerollsLeft: 1,
        selectedUpgrade: null, selectedEvolution: null, tutorialOpen: false,
        claimedRewards: champion.ready ? [] : state.claimedRewards,
        anchor: champion.ready ? { level: 1, cycle, upgrades: { ...champion.upgrades }, evolutions: state.evolutions } : state.anchor,
        ...freshRun(level, champion.upgrades, cycle, activeGear(state)),
      }));
      persist(get());
      announceRifle();
      window.dispatchEvent(new Event("stage-selected"));
    },

    nextLevel: () => {
      const state = get();
      if (state.currentLevel >= 10) {
        const champion: Champion = { cycle: state.ngPlusCycle, level: 10, hearts: state.hearts, upgrades: state.upgrades, ready: true };
        writeChampion(champion);
        set({ screen: "won", champion });
        return;
      }

      const next = state.currentLevel + 1;
      const champion = state.ngPlusCycle > 0 ? {
        cycle: state.ngPlusCycle, level: next, hearts: state.hearts,
        upgrades: state.upgrades, ready: false,
      } : state.champion;
      if (state.ngPlusCycle > 0) writeChampion(champion);
      set((current) => ({
        screen: "playing",
        runId: current.runId + 1,
        champion,
        upgradeChoices: [],
        upgradeRerollsLeft: 1,
        selectedUpgrade: null, selectedEvolution: null,
        tutorialOpen: false,
        ...freshRun(next, state.upgrades, state.ngPlusCycle, activeGear(current)),
      }));
      persist(get());
      announceRifle();
      window.dispatchEvent(new Event("stage-selected"));
    },

    chooseUpgrade: (id) => {
      const state = get();
      if (state.screen !== "upgrade" || (state.selectedUpgrade || state.selectedEvolution) || !state.upgradeChoices.includes(id)) return;
      const card = getUpgradeCard(id);
      if (state.upgrades[id] >= card.maxStacks) return;
      const newUpgrades = { ...state.upgrades, [id]: state.upgrades[id] + 1 };
      const maxHp = getUpgradeStats(newUpgrades).maxHp + activeGear(state).vest * 8;
      const champion = state.ngPlusCycle > 0 || state.currentLevel === 10 ? {
        cycle: state.ngPlusCycle, level: Math.min(10, state.currentLevel + 1), hearts: state.hearts,
        upgrades: newUpgrades, ready: state.currentLevel === 10,
      } : state.champion;
      if (state.ngPlusCycle > 0 || state.currentLevel === 10) writeChampion(champion);

      set({
        upgrades: newUpgrades,
        anchor: state.anchor.level === state.currentLevel + 1 && state.anchor.cycle === state.ngPlusCycle
          ? { ...state.anchor, upgrades: { ...newUpgrades } } : state.anchor,
        champion,
        maxHp,
        hp: Math.min(maxHp, state.hp + (maxHp - state.maxHp > 0 ? maxHp - state.maxHp : 0) + (id === "ironWill" ? 25 : 0)),
        grenades: id === "bombBelt" ? Math.min(getUpgradeStats(newUpgrades).grenadeCapacity + satchelBonus(activeGear(state).satchel), state.grenades + 1) : state.grenades,
        selectedUpgrade: id,
      });
      persist(get());
      window.dispatchEvent(new Event("ui-confirm"));
    },

    chooseEvolution: (id) => {
      const state = get();
      if (state.screen !== "evolution" || state.selectedEvolution || ![5, 9].includes(state.currentLevel) ||
        !availableEvolutions(state.upgrades, state.evolutions).some(item => item.id === id)) return;
      const evolutions = [...state.evolutions, id];
      set({ evolutions, selectedEvolution: id }); persist(get());
      emitCardProc("EVOLUTION AWAKENED", EVOLUTIONS.find(item => item.id === id)?.name ?? "", 0);
      window.dispatchEvent(new Event("ui-confirm"));
    },
    undoEvolution: () => {
      const state = get();
      if (state.screen !== "evolution" || !state.selectedEvolution) return;
      set({ evolutions: state.evolutions.filter(id => id !== state.selectedEvolution), selectedEvolution: null }); persist(get());
    },

    undoUpgrade: () => {
      const state = get();
      if (state.screen !== "upgrade" || !state.selectedUpgrade) return;
      const id = state.selectedUpgrade;
      const upgrades = { ...state.upgrades, [id]: state.upgrades[id] - 1 };
      const maxHp = getUpgradeStats(upgrades).maxHp + activeGear(state).vest * 8;
      const champion = state.ngPlusCycle > 0 || state.currentLevel === 10 ? { cycle: state.ngPlusCycle, level: Math.min(10, state.currentLevel + 1), hearts: state.hearts, upgrades, ready: state.currentLevel === 10 } : state.champion;
      if (state.ngPlusCycle > 0 || state.currentLevel === 10) writeChampion(champion);
      set({ upgrades, champion, maxHp, hp: Math.min(maxHp, state.hp), grenades: Math.min(state.grenades, getUpgradeStats(upgrades).grenadeCapacity + satchelBonus(activeGear(state).satchel)), selectedUpgrade: null });
      if (state.anchor.level === state.currentLevel + 1 && state.anchor.cycle === state.ngPlusCycle) set({ anchor: { ...state.anchor, upgrades } });
      persist(get());
    },

    continueAfterVictory: () => get().advanceResult(),
    advanceResult: () => {
      const state = get();
      const screen = state.screen === "stageClear" ? (state.lastLevelGain > 0 ? "levelUp" : "reward")
        : state.screen === "levelUp" ? "reward" : state.screen === "reward" ? "upgrade" : null;
      if (!screen) return;
      set({ screen }); persist(get());
      if (screen === "levelUp" && state.lastSpGain > 0) { get().queueTutorial("skillPoint"); get().queueTutorial("magic"); }
      if (screen === "reward") get().queueTutorial("coins");
      if (screen === "upgrade") get().queueTutorial("cards");
    },
    continueDraft: () => {
      const state = get();
      if (state.screen !== "upgrade" || (!state.selectedUpgrade && state.upgradeChoices.length)) return;
      const available = [5, 9].includes(state.currentLevel) ? availableEvolutions(state.upgrades, state.evolutions) : [];
      if (available.length) { set({ screen: "evolution" }); persist(get()); get().queueTutorial("evolution"); return; }
      get().continueEvolution();
    },
    continueEvolution: () => {
      const state = get();
      if (state.screen === "evolution" && !state.selectedEvolution) return;
      if (state.currentLevel >= 10) { set({ screen: "won", preStage: null }); persist(get()); return; }
      const next = state.currentLevel + 1;
      const champion = state.ngPlusCycle > 0 ? { cycle: state.ngPlusCycle, level: next, hearts: state.hearts, upgrades: state.upgrades, ready: false } : state.champion;
      if (state.ngPlusCycle > 0) writeChampion(champion);
      set({ screen: "menu", currentLevel: next, champion, preStage: { level: next, practice: false }, upgradeChoices: [], selectedUpgrade: null, selectedEvolution: null });
      persist(get());
      if (state.coins >= Math.min(...GEAR.map(item => item.cost))) get().queueTutorial("gear");
      if (state.coins >= 300) get().queueTutorial("crates");
      if (state.anchor.level === next && next > 1) get().queueTutorial("anchor");
    },

    buyGear: (id) => {
      const state = get();
      if (state.screen !== "menu" || state.gear[id] >= gearCap(id)) return;
      const cost = gearCost(id, state.gear[id]);
      if (state.coins < cost) return;
      const coins = state.coins - cost;
      const gear = { ...state.gear, [id]: state.gear[id] + 1 };
      window.localStorage.setItem("shoot-a-boss:coins", String(coins));
      window.localStorage.setItem("shoot-a-boss:gear", JSON.stringify(gear));
      set({ coins, gear });
      persist(get());
      get().queueTutorial("gear");
      window.dispatchEvent(new Event("ui-confirm"));
    },
    toggleGear: (id) => {
      const state = get();
      if (!state.gear[id] || state.screen !== "menu") return;
      const equippedGear = state.equippedGear.includes(id) ? state.equippedGear.filter(entry => entry !== id)
        : state.equippedGear.length < 4 ? [...state.equippedGear, id] : state.equippedGear;
      set({ equippedGear }); persist(get());
    },

    buyHeart: () => {
      const state = get();
      if (state.screen !== "menu" || state.hearts >= MAX_HEARTS || state.coins < 275) return;
      const coins = state.coins - 275;
      localStorage.setItem("shoot-a-boss:coins", String(coins));
      writeHearts(state.hearts + 1);
      const champion = state.champion ? { ...state.champion, hearts: state.hearts + 1 } : null;
      writeChampion(champion);
      set({ hearts: state.hearts + 1, coins, champion }); persist(get());
      window.dispatchEvent(new Event("ui-confirm"));
    },
    refillHearts: () => {
      const state = get();
      if (state.screen !== "menu" || state.hearts >= MAX_HEARTS || state.coins < 700) return;
      const coins = state.coins - 700;
      localStorage.setItem("shoot-a-boss:coins", String(coins)); writeHearts(MAX_HEARTS);
      const champion = state.champion ? { ...state.champion, hearts: MAX_HEARTS } : null;
      writeChampion(champion);
      set({ hearts: MAX_HEARTS, coins, champion }); persist(get());
      window.dispatchEvent(new Event("ui-confirm"));
    },
    buyCrate: (weapon) => {
      const state = get();
      if (state.screen !== "menu" || state.coins < 300) return null;
      const unowned = SKIN_IDS.filter((color) => !state.skins[weapon].includes(color));
      if(!unowned.length)return null;
      const color = rollSkin(unowned);
      const coins = state.coins - 300;
      const skins = { ...state.skins, [weapon]: [...new Set([...state.skins[weapon], color])] };
      localStorage.setItem("shoot-a-boss:coins", String(coins));
      set({ coins, skins }); persist(get());
      get().queueTutorial("crates");
      window.dispatchEvent(new Event("ui-confirm"));
      return color;
    },
    equipSkin: (weapon, color) => {
      if (!get().skins[weapon].includes(color)) return;
      set({ equippedSkins: { ...get().equippedSkins, [weapon]: color } }); persist(get());
    },
    unlockMagic: (kind, branch = "force") => {
      const state = get();
      const tier = state.magic[kind] + 1;
      if (tier > 20 || state.skillPoints < magicCost(tier) || !["force", "tempo", "craft"].includes(branch)) return;
      const magic = { ...state.magic, [kind]: tier };
      const magicChoices = tier > 1 && !isMilestone(tier) ? { ...state.magicChoices, [kind]: { ...state.magicChoices[kind], [tier]: branch } } : state.magicChoices;
      set({ magic, magicChoices, skillPoints: state.skillPoints - magicCost(tier), selectedMagic: state.selectedMagic ?? kind }); persist(get());
      if (tier === 1) get().queueTutorial("magicAwakened");
      window.dispatchEvent(new Event("ui-confirm"));
    },
    selectMagic: (kind) => {
      if (!get().magic[kind]) return;
      set({ selectedMagic: kind }); persist(get());
    },
    castMagic: () => {
      const state = get();
      const kind = state.selectedMagic;
      const now = performance.now();
      if (state.screen !== "playing" || state.tutorialOpen || !kind || !state.magic[kind] || now < state.magicReadyAt) return false;
      const overtime = state.evolutions.includes("overtimeArcana") && (state.magicCastCount + 1) % 3 === 0;
      set({ magicReadyAt: now + magicStats(kind, state.magic[kind], state.magicChoices).cooldown * (1 - Math.min(.35, activeGear(state).arcana * .01 + state.upgrades.magicTempo * .10)) * 1000,
        magicCastCount: state.magicCastCount + 1,
        shieldCharges: state.upgrades.spellWard && state.shieldCharges === 0 ? 1 : state.shieldCharges });
      window.dispatchEvent(new CustomEvent("magic-cast", { detail: { kind, rank: state.magic[kind], overtime } }));
      return true;
    },
    resetData: () => {
      for (const key of [SAVE_KEY, CHAMPION_KEY, HEARTS_KEY, "shoot-a-boss:unlocked-level", "shoot-a-boss:gear", "shoot-a-boss:coins", "shoot-a-boss:sensitivity", "shoot-a-boss:bgm-volume", "shoot-a-boss:sfx-volume"]) localStorage.removeItem(key);
      const upgrades = emptyUpgrades(); const gear = Object.fromEntries(GEAR.map(({ id }) => [id, 0])) as GearLevels;
      set((state) => ({ screen: "story", runId: state.runId + 1, unlockedLevel: 1, hearts: MAX_HEARTS,
        ngPlusCycle: 0, champion: null, coins: 0, gear, equippedGear: [], anchor: { level: 1, cycle: 0, upgrades, evolutions: [] }, evolutions: [], claimedRewards: [], tutorialSeen: false, tutorials: freshTutorials(), tutorialQueue: [], activeTutorial: null, preStage: null, postStageReturn: null, practiceActive: false, practiceReturn: null,
        lastReward: 0, lastPerformanceBonus: 0, lastXpReward: 0, xp: 0, playerLevel: 1, skillPoints: 0,
        magic: emptyMagic(), magicChoices: emptyMagicChoices(), selectedMagic: null, magicReadyAt: 0, skins: emptySkins(), equippedSkins: defaultSkins(),
        upgrades, upgradeChoices: [], selectedUpgrade: null, selectedEvolution: null, sensitivity: .85, bgmVolume: .34, sfxVolume: .42,
        ...freshRun(1, upgrades, 0, gear) }));
    },

    closeTutorial: () => { set({ tutorialOpen: false, tutorialSeen: true, tutorials: { ...get().tutorials, controls: true } }); persist(get()); },
    queueTutorial: (id, replay = false) => {
      const state = get();
      if ((!replay && state.tutorials[id]) || state.activeTutorial === id || state.tutorialQueue.includes(id)) return;
      set({ activeTutorial: state.activeTutorial ?? id,
        tutorialQueue: state.activeTutorial ? [...state.tutorialQueue, id] : state.tutorialQueue });
      persist(get());
    },
    completeTutorial: () => {
      const state = get();
      const id = state.activeTutorial;
      if (!id) return;
      const [activeTutorial, ...tutorialQueue] = state.tutorialQueue;
      set({ tutorials: { ...state.tutorials, [id]: true }, activeTutorial: activeTutorial ?? null, tutorialQueue });
      persist(get());
    },
    markTutorial: (id) => get().queueTutorial(id),
    triggerScan: () => {
      const state = get();
      const now = performance.now();
      if (state.screen !== "playing" || state.tutorialOpen || now < state.scanCooldownUntil) return;
      const spawnedTargets = Object.keys(state.enemyPositions).filter(id => !state.eliminated.includes(id));
      if (!spawnedTargets.length) return;
      const all = state.upgrades.recon > 0;
      const selected = all ? spawnedTargets : spawnedTargets.sort((a, b) => {
        const pa = state.enemyPositions[a] ?? [999, 0, 999]; const pb = state.enemyPositions[b] ?? [999, 0, 999];
        return Math.hypot(pa[0] - state.playerPosition[0], pa[2] - state.playerPosition[2]) - Math.hypot(pb[0] - state.playerPosition[0], pb[2] - state.playerPosition[2]);
      }).slice(0, 3);
      const duration = (all ? 7500 : 4500) + activeGear(state).lens * 1000;
      const until = now + duration;
      set({ scanTargets: selected, scanUntil: until, scanCooldownUntil: now + Math.max(18000, 28000 - activeGear(state).lens * 1000) });
      window.dispatchEvent(new Event("scan-started"));
      window.setTimeout(() => {
        if (get().scanUntil === until) set({ scanTargets: [] });
      }, duration);
    },

    rerollUpgrades: () => {
      const state = get();
      if (
        state.screen !== "upgrade" ||
        (state.selectedUpgrade || state.selectedEvolution) ||
        state.upgradeRerollsLeft <= 0
      ) {
        return;
      }

      const rerollIndex = 2 - state.upgradeRerollsLeft;
      set({
        upgradeChoices: rollUpgradeChoices(state.currentLevel, rerollIndex + 1, state.upgrades,
          Object.values(state.magic).some(Boolean), state.upgradeChoices,
          weaponOrder.reduce((best, weapon) => state.weaponUsage[weapon].damage > state.weaponUsage[best].damage ? weapon : best, "rifle" as WeaponId)),
        upgradeRerollsLeft: state.upgradeRerollsLeft - 1,
      });
    },

    pause: () => {
      if (get().screen === "playing") {
        cancelReload(set, get);
        set({ screen: "paused", scoped: false, movementMode: "idle" });
      }
    },

    resume: () => {
      if (get().screen === "paused") set({ screen: "playing" });
    },

    restart: () => {
      const state = get();
      if (state.screen === "purged") {
        get().resetData();
        return;
      }
      set((current) => ({
        screen: "playing",
        runId: current.runId + 1,
        tutorialOpen: state.currentLevel === 1 && !state.tutorialSeen,
        ...freshRun(state.currentLevel, state.upgrades, state.ngPlusCycle, activeGear(current)),
      }));
      announceRifle();
    },

    goToMenu: () => {
      const state = get();
      if (state.practiceActive) {
        const original = state.practiceReturn;
        set({ screen: "menu", practiceActive: false, practiceReturn: null,
          currentLevel: original?.level ?? state.unlockedLevel,
          upgrades: original?.upgrades ?? state.upgrades, evolutions: original?.evolutions ?? state.evolutions,
          preStage: null, scoped: false });
        persist(get());
        return;
      }
      if (state.screen === "purged") { get().resetData(); set({ screen: "menu" }); return; }
      const checkpointLevel = ["stageClear", "levelUp", "reward", "upgrade", "evolution"].includes(state.screen) && state.currentLevel < 10 ? state.currentLevel + 1 : state.currentLevel;
      if (state.ngPlusCycle > 0 && state.screen !== "won" && !(state.screen === "stageClear" && state.currentLevel === 10)) {
        const champion = {
          cycle: state.ngPlusCycle,
          level: state.screen === "upgrade" ? Math.min(10, state.currentLevel + 1) : state.currentLevel,
          hearts: state.hearts,
          upgrades: state.upgrades, ready: state.screen === "upgrade" && state.currentLevel === 10,
        };
        writeChampion(champion);
        set({ champion });
      }
      cancelReload(set, get);
      set({
        screen: "menu",
        currentLevel: checkpointLevel,
        preStage: null,
        scoped: false,
        movementMode: "idle",
        speedBoostActive: false,
        speedBoostUntil: 0,
      });
      persist(get());
    },

    readComic: () => {
      cancelReload(set, get);
      set({ screen: "comic", scoped: false, movementMode: "idle" });
    },

    setWeapon: (weapon) => {
      cancelReload(set, get);
      set({ weapon, scoped: false });
      window.dispatchEvent(
        new CustomEvent("weapon-selected", { detail: { weapon } }),
      );
    },

    cycleWeapon: (direction) => {
      const current = weaponOrder.indexOf(get().weapon);
      const next =
        (current + direction + weaponOrder.length) % weaponOrder.length;
      const weapon = weaponOrder[next];
      cancelReload(set, get);
      set({ weapon, scoped: false });
      window.dispatchEvent(
        new CustomEvent("weapon-selected", { detail: { weapon } }),
      );
    },

    spendRound: (weapon) => {
      if (weapon === "knife") return true;
      if (get().reloading) return false;

      const current = get().ammo[weapon];
      const cost = 1;
      if (current.mag < cost) return false;

      set((state) => ({
        ammo: {
          ...state.ammo,
          [weapon]: { ...current, mag: current.mag - cost },
        },
        freshPrintShots: Math.max(0, state.freshPrintShots - 1),
      }));
      return true;
    },

    reload: () => {
      const state = get();
      if (
        state.reloading ||
        state.screen !== "playing" ||
        state.weapon === "knife"
      ) {
        return;
      }

      const weapon = state.weapon;
      const current = state.ammo[weapon];
      const capacity = magazineSize(weapon, state.upgrades);
      const needed = capacity - current.mag;
      const moved = Math.min(needed, current.reserve);
      if (moved <= 0) return;

      const baseDuration = BASE_RELOAD_MS[weapon] ?? 1500;
      const duration = Math.max(
        550,
        Math.round(baseDuration * getUpgradeStats(state.upgrades).reloadTime * (state.evolutions.includes("bottomlessInbox") && !current.mag && performance.now() >= state.inboxCooldownUntil ? .7 : 1)),
      );
      if (state.evolutions.includes("bottomlessInbox") && !current.mag && performance.now() >= state.inboxCooldownUntil) {
        const transfer = Math.min(current.reserve, Math.ceil(capacity * .25));
        set({ ammo: { ...state.ammo, [weapon]: { mag: transfer, reserve: current.reserve - transfer } }, inboxCooldownUntil: performance.now() + 8000 });
      }
      const token = state.reloadToken + 1;

      set({
        reloading: true,
        reloadingWeapon: weapon,
        reloadStartedAt: performance.now(),
        reloadDurationMs: duration,
        reloadToken: token,
        scoped: false,
      });

      window.setTimeout(() => {
        const live = get();
        if (
          live.reloadToken !== token ||
          !live.reloading ||
          live.reloadingWeapon !== weapon ||
          live.screen !== "playing"
        ) {
          return;
        }

        const latest = live.ammo[weapon];
        const latestCapacity = magazineSize(weapon, live.upgrades);
        const latestNeeded = latestCapacity - latest.mag;
        const latestMoved = Math.min(latestNeeded, latest.reserve);

        set((currentState) => ({
          ammo: {
            ...currentState.ammo,
            [weapon]: {
              mag: latest.mag + latestMoved,
              reserve: latest.reserve - latestMoved,
            },
          },
          reloading: false,
          freshPrintShots: equippedGearRank(currentState, "barrel") >= 5 ? 5 : 0,
          reloadingWeapon: null,
          reloadStartedAt: 0,
          reloadDurationMs: 0,
        }));
      }, duration);
    },

    spendGrenade: () => {
      if (get().grenades <= 0) return false;
      set((state) => ({ grenades: state.grenades - 1 }));
      return true;
    },

    refillGrenades: (amount = 1) =>
      set((state) => ({
        grenades: Math.min(
          getUpgradeStats(state.upgrades).grenadeCapacity + satchelBonus(activeGear(state).satchel),
          state.grenades + amount,
        ),
      })),

    grantSpeedBoost: (durationMs = 12000) => {
      const speedBoostUntil = performance.now() + durationMs;
      set({ speedBoostUntil, speedBoostActive: true });
      window.setTimeout(() => {
        if (get().speedBoostUntil <= performance.now()) {
          set({ speedBoostActive: false });
        }
      }, durationMs + 60);
    },
    setEventTarget: (eventTarget) => set({ eventTarget }),
    suppressHazard: (durationMs) => set({ hazardSuppressedUntil: performance.now() + durationMs }),
    grantDreamCache: () => {
      const state = get();
      if (state.hp < state.maxHp * .45) set({ hp: Math.min(state.maxHp, state.hp + 30) });
      else if (state.weapon !== "knife" && state.ammo[state.weapon].reserve < WEAPONS[state.weapon].reserve * .35) {
        const weapon = state.weapon;
        set({ ammo: { ...state.ammo, [weapon]: { ...state.ammo[weapon], reserve: Math.min(WEAPONS[weapon].reserve, state.ammo[weapon].reserve + WEAPONS[weapon].magazine * 2) } } });
      } else if (!state.grenades) get().refillGrenades(1);
      else if (!state.shieldCharges) set({ shieldCharges: 1 });
      else if (state.magicReadyAt > performance.now() + 8000) set({ magicReadyAt: performance.now() });
      else get().grantSpeedBoost(10000);
      window.dispatchEvent(new CustomEvent("map-hazard-notice", { detail: { message: "DREAM CACHE CLAIMED" } }));
    },

    damagePlayer: (amount, source, hazard = false) => {
      const state = get();
      if (state.screen !== "playing" || amount <= 0) return;
      const now = performance.now();
      if (!hazard) {
        if (now - lastDirectHitAt < 200) return;
        lastDirectHitAt = now;
      }
      if (state.shieldCharges > 0) {
        set({ shieldCharges: state.shieldCharges - 1, guardHp: equippedGearRank(state, "aegis") >= 3 ? Math.max(state.guardHp, 5) : state.guardHp });
        window.dispatchEvent(new CustomEvent("shield-blocked", { detail: { source, chargesRemaining: state.shieldCharges - 1 } }));
        emitCardProc("PAPER ARMOR", "BLOCKED", 300);
        return;
      }
      if (state.upgrades.shieldOrbit && performance.now() >= state.shieldReadyAt) {
        set({ shieldReadyAt: performance.now() + (state.evolutions.includes("returnToSender") ? 10400 : 16000),
          guardHp: equippedGearRank(state, "aegis") >= 3 ? Math.max(state.guardHp, 5) : state.guardHp });
        window.dispatchEvent(new CustomEvent("shield-blocked", { detail: { source } }));
        emitCardProc("ORBITAL GUARD", "BLOCKED", 300);
        return;
      }
      const guardHp = Math.max(0, state.guardHp - amount);
      const next = Math.max(0, state.hp - Math.max(0, amount - state.guardHp));
      const firstAid = equippedGearRank(state, "vest") >= 5 && !state.vestGuardUsed && next > 0 && next < state.maxHp * .3;
      window.dispatchEvent(
        new CustomEvent("player-damaged", { detail: { amount, source } }),
      );
      if (next > 0) { set({ hp: next, guardHp: firstAid ? 10 : guardHp, vestGuardUsed: state.vestGuardUsed || firstAid }); return; }
      if (state.practiceActive) { set({ hp: 0, screen: "practiceResult", scoped: false }); return; }
      const hearts = state.hearts - 1;
      writeHearts(hearts);
      if (hearts <= 0) {
        const anchor = state.anchor.cycle === state.ngPlusCycle ? state.anchor : { level: 1, cycle: state.ngPlusCycle, upgrades: emptyUpgrades(), evolutions: [] };
        const champion = state.ngPlusCycle > 0 ? { cycle: state.ngPlusCycle, level: anchor.level, hearts: MAX_HEARTS, upgrades: anchor.upgrades, ready: false } : null;
        writeHearts(MAX_HEARTS);
        writeChampion(champion);
        set({ screen: "lost", hearts: MAX_HEARTS, lastDeathCollapsed: true, hp: 0, currentLevel: anchor.level, upgrades: anchor.upgrades, evolutions: anchor.evolutions,
          tutorialOpen: false, scoped: false, champion });
        persist(get());
        get().queueTutorial("hearts");
        return;
      }
      const champion = state.ngPlusCycle > 0 ? {
        cycle: state.ngPlusCycle, level: state.currentLevel, hearts,
        upgrades: state.upgrades, ready: false,
      } : state.champion ? { ...state.champion, hearts } : null;
      if (champion) writeChampion(champion);
      set({ hp: 0, hearts, champion, screen: "lost", lastDeathCollapsed: false, scoped: false, movementMode: "idle" });
      persist(get());
      get().queueTutorial("hearts");
    },

    eliminate: (id) => {
      const state = get();
      if (state.screen !== "playing" || state.eliminated.includes(id)) return;

      const eliminated = [...state.eliminated, id];
      const killingWeapon = state.lastHitWeapon[id];
      if (killingWeapon) set({ weaponUsage: { ...state.weaponUsage, [killingWeapon]: { ...state.weaponUsage[killingWeapon], kills: state.weaponUsage[killingWeapon].kills + 1 } } });
      const killCount = eliminated.length;
      const now = performance.now();
      const recentKills = [...state.recentKills.filter(time => now - time <= 4000), now];
      const crunchActive = state.evolutions.includes("crunchTime") && recentKills.length >= 3 && now >= state.crunchCooldownUntil;
      if (crunchActive) emitCardProc("CRUNCH TIME", "FIRING FRENZY", 1000);
      if (state.evolutions.includes("paperTrail") && state.weapon === "knife") emitCardProc("PAPER TRAIL", "SPEED BURST", 1000);
      const stats = getUpgradeStats(state.upgrades);
      const heal = stats.killHeal + activeGear(state).medallion * 2 + (activeGear(state).medallion >= 5 && killCount % 5 === 0 ? 4 : 0) + (state.upgrades.vampireInk && killCount % 4 === 0 ? 10 : 0);
      const nextHp = Math.min(state.maxHp, state.hp + Math.min(20, heal));
      const ammo = state.upgrades.swiftReset && state.weapon !== "knife" ? (() => {
        const current = state.ammo[state.weapon];
        const moved = Math.min(current.reserve, Math.ceil(magazineSize(state.weapon, state.upgrades) * .15), magazineSize(state.weapon, state.upgrades) - current.mag);
        return { ...state.ammo, [state.weapon]: { mag: current.mag + moved, reserve: current.reserve - moved } };
      })() : state.ammo;
      const enemyPositions = { ...state.enemyPositions };
      delete enemyPositions[id];

      window.dispatchEvent(
        new CustomEvent("boss-killed", {
          detail: { count: killCount, id },
        }),
      );

      if (killCount >= state.targetCount) {
        if (state.practiceActive) {
          set({ eliminated, enemyPositions, screen: "practiceResult", hp: nextHp, lastClearMs: performance.now() - state.stageStartedAt });
          return;
        }
        const claimKey = `${state.ngPlusCycle}:${state.currentLevel}`;
        const firstClear = !state.claimedRewards.includes(claimKey);
        const lastClearMs = performance.now() - state.stageStartedAt;
        const baseReward = stageCoinReward(state.currentLevel, state.ngPlusCycle);
        const performanceFactor = Math.min(.2, Math.max(0, nextHp / state.maxHp * .1) + Math.max(0, 1 - lastClearMs / ((60 + state.currentLevel * 15) * 1000)) * .1);
        const lastPerformanceBonus = firstClear ? Math.round(baseReward * performanceFactor) : 0;
        const lastReward = firstClear ? baseReward + lastPerformanceBonus : 0;
        const coins = state.coins + lastReward;
        const baseXp = stageXpReward(state.currentLevel, state.ngPlusCycle);
        const lastXpReward = firstClear ? (state.currentLevel === 1 && state.playerLevel === 1 ? Math.max(baseXp, xpToNextLevel(1) - state.xp) : baseXp) : 0;
        let xp = state.xp + lastXpReward;
        let playerLevel = state.playerLevel;
        let skillPoints = state.skillPoints;
        while (xp >= xpToNextLevel(playerLevel)) { xp -= xpToNextLevel(playerLevel++); skillPoints += 1 + (playerLevel % 5 === 0 ? 1 : 0); }
        const lastLevelGain = playerLevel - state.playerLevel;
        const lastSpGain = skillPoints - state.skillPoints;
        const claimedRewards = firstClear ? [...state.claimedRewards, claimKey] : state.claimedRewards;
        const anchor = firstClear && (state.currentLevel === 3 || state.currentLevel === 6)
          ? { level: state.currentLevel + 1, cycle: state.ngPlusCycle, upgrades: { ...state.upgrades }, evolutions: [...state.evolutions] } : state.anchor;
        window.localStorage.setItem("shoot-a-boss:coins", String(coins));
        const unlockedLevel = Math.min(
          10,
          Math.max(state.unlockedLevel, state.currentLevel + 1),
        );
        writeUnlockedLevel(unlockedLevel);

        if (state.currentLevel >= 10) {
          const champion: Champion = {
            cycle: state.ngPlusCycle, level: 10, hearts: state.hearts,
            upgrades: state.upgrades, ready: true,
          };
          writeChampion(champion);
          set({
            eliminated,
            hp: nextHp,
            unlockedLevel,
            champion,
            screen: "stageClear", coins, lastReward, lastPerformanceBonus, xp, playerLevel, skillPoints, lastXpReward, lastLevelGain, lastSpGain, lastClearMs, ammo, enemyPositions, claimedRewards, anchor,
            scoped: false,
            movementMode: "idle",
            upgradeChoices: rollUpgradeChoices(state.currentLevel, 0, state.upgrades, Object.values(state.magic).some(Boolean), [], weaponOrder.reduce((best, weapon) => state.weaponUsage[weapon].damage > state.weaponUsage[best].damage ? weapon : best, "rifle" as WeaponId)),
            upgradeRerollsLeft: 1,
            selectedUpgrade: null, selectedEvolution: null,
          });
          persist(get());
          get().queueTutorial("xp");
          return;
        }

        set({
          eliminated,
          hp: nextHp,
          unlockedLevel,
          screen: "stageClear", coins, lastReward, lastPerformanceBonus, xp, playerLevel, skillPoints, lastXpReward, lastLevelGain, lastSpGain, lastClearMs, ammo, enemyPositions, claimedRewards, anchor,
          scoped: false,
          movementMode: "idle",
          upgradeChoices: rollUpgradeChoices(state.currentLevel, 0, state.upgrades, Object.values(state.magic).some(Boolean), [], weaponOrder.reduce((best, weapon) => state.weaponUsage[weapon].damage > state.weaponUsage[best].damage ? weapon : best, "rifle" as WeaponId)),
          upgradeRerollsLeft: 1,
          selectedUpgrade: null, selectedEvolution: null,
        });
        persist(get());
        get().queueTutorial("xp");
        return;
      }

      set({ eliminated, hp: nextHp, ammo, enemyPositions, scanTargets: state.scanTargets.filter((target) => target !== id),
        recentKills, crunchUntil: crunchActive ? now + 5000 : state.crunchUntil,
        crunchCooldownUntil: crunchActive ? now + 10000 : state.crunchCooldownUntil,
        paperTrailUntil: state.evolutions.includes("paperTrail") && state.weapon === "knife" ? now + 3500 : state.paperTrailUntil });
    },

    setSensitivity: (sensitivity) => {
      const value = Math.min(1.6, Math.max(.25, sensitivity));
      localStorage.setItem("shoot-a-boss:sensitivity", String(value)); set({ sensitivity: value });
    },
    setBgmVolume: (bgmVolume) => {
      const value = Math.min(1, Math.max(0, bgmVolume));
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "shoot-a-boss:bgm-volume",
          String(value),
        );
      }
      set({ bgmVolume: value });
    },
    setSfxVolume: (sfxVolume) => {
      const value = Math.min(1, Math.max(0, sfxVolume));
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "shoot-a-boss:sfx-volume",
          String(value),
        );
      }
      set({ sfxVolume: value });
    },
    setScoped: (scoped) => {
      if (get().reloading && scoped) return;
      if (get().weapon === "knife" && scoped) return;
      set({ scoped });
    },
    setPlayerPosition: (playerPosition) => set({ playerPosition }),
    setPlayerYaw: (playerYaw) => set({ playerYaw }),
    setEnemyPosition: (id, position) => {
      const state = get();
      if (state.screen !== "playing" || state.eliminated.includes(id)) return;
      const old = state.enemyPositions[id];
      if (old && Math.hypot(old[0] - position[0], old[1] - position[1], old[2] - position[2]) < 1.1) return;
      set({ enemyPositions: { ...state.enemyPositions, [id]: position } });
    },
    setMovementMode: (movementMode) => {
      if (get().movementMode !== movementMode) set({ movementMode });
    },
  };
});
