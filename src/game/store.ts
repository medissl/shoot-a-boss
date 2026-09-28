import { create } from "zustand";
import { GRENADE_COUNT, WEAPONS, type WeaponId } from "./config";
import { getEnemyTuning, getLevelDefinition, getPlayerSpawn, getTargetCount } from "./levels";
import { ELEMENTS, emptyMagicChoices, isMilestone, magicCost, magicStats, type Element, type Branch, type MagicChoices } from "./magicTree";
import { SKIN_IDS, normalizeSkin, rollSkin, type SkinId } from "./skins";
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
export const MAGIC_TYPES = ELEMENTS;
export type MagicType = Element;
export type SkinColor = SkinId;
export const SKIN_COLORS = SKIN_IDS;
// Temporary cosmetic showroom: all themes are selectable without changing saved ownership.
const COSMETIC_PREVIEW_ALL = true;
export type Skins = Record<WeaponId, SkinId[]>;
export type EquippedSkins = Record<WeaponId, SkinId>;
const emptySkins = (): Skins => ({ sniper: ["default"], rifle: ["default"], shotgun: ["default"], knife: ["default"] });
const previewSkins = (): Skins => ({ sniper: ["default", ...SKIN_IDS], rifle: ["default", ...SKIN_IDS], shotgun: ["default", ...SKIN_IDS], knife: ["default", ...SKIN_IDS] });
const defaultSkins = (): EquippedSkins => ({ sniper: "default", rifle: "default", shotgun: "default", knife: "default" });
const emptyMagic = (): Record<MagicType, number> => ({ fire: 0, crystal: 0, ice: 0, water: 0, thunder: 0 });
export const xpToNextLevel = (level: number) => Math.round((120 + level * 42 + Math.floor(level / 10) * 160) * (1 + level * 0.035));
export type GearId = "vest" | "boots" | "barrel" | "medallion" | "skates" | "aegis" | "lens" | "satchel" | "arcana";
export const GEAR: { id: GearId; name: string; detail: string; cost: number }[] = [
  { id: "vest", name: "IRON VEST", detail: "+15 maximum HP per rank", cost: 100 },
  { id: "boots", name: "QUICK BOOTS", detail: "+5% movement per rank", cost: 100 },
  { id: "barrel", name: "INK BARREL", detail: "+6% weapon damage per rank", cost: 120 },
  { id: "medallion", name: "LIFE MEDALLION", detail: "Heal 4 HP on every elimination per rank", cost: 140 },
  { id: "skates", name: "INK SKATES", detail: "+9% slide speed per rank", cost: 110 },
  { id: "aegis", name: "PAPER AEGIS", detail: "Start each round with a shield charge (up to 3)", cost: 180 },
  { id: "lens", name: "SCOUT LENS", detail: "+2 seconds of Q mark time per rank", cost: 120 },
  { id: "satchel", name: "EXTRA SATCHEL", detail: "+1 paper bomb per rank", cost: 110 },
  { id: "arcana", name: "ARCANE PEN", detail: "+6% magic damage and -2% magic cooldown per rank", cost: 190 },
];
export type GearLevels = Record<GearId, number>;
export const gearCap = (id: GearId) => id === "aegis" ? 3 : 5;
export const MAX_HEARTS = 5;
const CHAMPION_KEY = "shoot-a-boss:champion";
const HEARTS_KEY = "shoot-a-boss:hearts";
const SAVE_KEY = "shoot-a-boss:campaign";
const readSave = (): Record<string, unknown> => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") ?? {}; } catch { return {}; } };
const saved = typeof window === "undefined" ? {} : readSave();
function persist(state: GameStore) {
  const level = ["stageClear", "upgrade"].includes(state.screen) && state.currentLevel < 10 ? state.currentLevel + 1 : state.currentLevel;
  localStorage.setItem(SAVE_KEY, JSON.stringify({ level, cycle: state.ngPlusCycle, upgrades: state.upgrades,
    xp: state.xp, playerLevel: state.playerLevel, skillPoints: state.skillPoints, magic: state.magic, magicChoices: state.magicChoices, selectedMagic: state.selectedMagic,
    skins: COSMETIC_PREVIEW_ALL ? (readSave().skins ?? emptySkins()) : state.skins, equippedSkins: state.equippedSkins }));
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
  if (COSMETIC_PREVIEW_ALL) return previewSkins();
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
  | "stageClear"
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
  lastReward: number;
  lastXpReward: number;
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
  undoUpgrade: () => void;
  continueAfterVictory: () => void;
  buyGear: (id: GearId) => void;
  buyHeart: () => void;
  buyCrate: (weapon: WeaponId) => SkinColor | null;
  equipSkin: (weapon: WeaponId, color: SkinColor) => void;
  unlockMagic: (kind: MagicType, branch?: Branch) => void;
  selectMagic: (kind: MagicType) => void;
  castMagic: () => boolean;
  resetData: () => void;
  rerollUpgrades: () => void;
  closeTutorial: () => void;
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
  damagePlayer: (amount: number, source?: [number, number, number]) => void;
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
  return GEAR.find((item) => item.id === id)!.cost * (rank + 1);
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

function freshRun(level: number, upgrades: UpgradeLevels, cycle = 0, gear: GearLevels = { vest: 0, boots: 0, barrel: 0, medallion: 0, skates: 0, aegis: 0, lens: 0, satchel: 0, arcana: 0 }) {
  const stats = getUpgradeStats(upgrades);

  return {
    currentLevel: level,
    targetCount: getTargetCount(level, cycle),
    hp: stats.maxHp + gear.vest * 15,
    maxHp: stats.maxHp + gear.vest * 15,
    weapon: "rifle" as WeaponId,
    ammo: freshAmmo(upgrades),
    grenades: stats.grenadeCapacity + gear.satchel || GRENADE_COUNT,
    eliminated: [] as string[],
    scanTargets: [] as string[],
    scanUntil: 0,
    scanCooldownUntil: 0,
    scoped: false,
    playerPosition: getPlayerSpawn(level),
    playerYaw: 0,
    enemyPositions: {} as Record<string, [number, number, number]>,
    shieldReadyAt: 0,
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

export const useGameStore = create<GameStore>((set, get) => {
  const initialUpgrades = restoredUpgrades();
  const returningPlayer = typeof window !== "undefined" && (
    window.localStorage.getItem(SAVE_KEY) !== null || readUnlockedLevel() > 1 ||
    readHearts() < MAX_HEARTS || readCoins() > 0 || readChampion() !== null
  );

  return {
    screen: returningPlayer ? "menu" : "story",
    runId: 0,
    unlockedLevel: readUnlockedLevel(),
    hearts: readHearts(),
    ngPlusCycle: Math.max(0, Math.floor(Number(saved.cycle) || 0)),
    champion: readChampion(),
    coins: typeof window === "undefined" ? 0 : readCoins(),
    gear: typeof window === "undefined" ? { vest: 0, boots: 0, barrel: 0, medallion: 0, skates: 0, aegis: 0, lens: 0, satchel: 0, arcana: 0 } : readGear(),
    lastReward: 0,
    lastXpReward: 0,
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
    upgradeChoices: [],
    upgradeRerollsLeft: 1,
    selectedUpgrade: null,
    tutorialOpen: false,
    ...freshRun(Math.min(readUnlockedLevel(), Math.max(1, Number(saved.level) || readUnlockedLevel())), initialUpgrades, Math.max(0, Number(saved.cycle) || 0)),
    sensitivity: 0.85,
    bgmVolume: readStoredVolume("shoot-a-boss:bgm-volume", 0.34),
    sfxVolume: readStoredVolume("shoot-a-boss:sfx-volume", 0.42),

    startGame: () => {
      const upgrades = get().upgrades;
      const hearts = get().hearts || MAX_HEARTS;
      writeHearts(hearts);
      set((state) => ({
        screen: "playing",
        runId: state.runId + 1,
        upgrades,
        hearts,
        ngPlusCycle: state.ngPlusCycle,
        upgradeChoices: [],
        upgradeRerollsLeft: 1,
        selectedUpgrade: null,
        tutorialOpen: state.currentLevel === 1 && state.ngPlusCycle === 0,
        ...freshRun(state.currentLevel, upgrades, state.ngPlusCycle, state.gear),
      }));
      announceRifle();
      window.dispatchEvent(new Event("stage-selected"));
    },

    startLevel: (level) => {
      const safeLevel = Math.min(10, Math.max(1, level));
      const state = get();
      if (safeLevel !== state.currentLevel || state.ngPlusCycle > 0 || safeLevel > state.unlockedLevel) return;
      const upgrades = state.upgrades;
      const hearts = get().hearts || MAX_HEARTS;
      writeHearts(hearts);
      set((state) => ({
        screen: "playing",
        runId: state.runId + 1,
        upgrades,
        hearts,
        ngPlusCycle: state.ngPlusCycle,
        upgradeChoices: [],
        upgradeRerollsLeft: 1,
        selectedUpgrade: null,
        tutorialOpen: safeLevel === 1,
        ...freshRun(safeLevel, upgrades, state.ngPlusCycle, state.gear),
      }));
      announceRifle();
      window.dispatchEvent(new Event("stage-selected"));
    },

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
        selectedUpgrade: null, tutorialOpen: false,
        ...freshRun(level, champion.upgrades, cycle, state.gear),
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
        selectedUpgrade: null,
        tutorialOpen: false,
        ...freshRun(next, state.upgrades, state.ngPlusCycle, current.gear),
      }));
      persist(get());
      announceRifle();
      window.dispatchEvent(new Event("stage-selected"));
    },

    chooseUpgrade: (id) => {
      const state = get();
      if (state.screen !== "upgrade" || state.selectedUpgrade || !state.upgradeChoices.includes(id)) return;
      const card = getUpgradeCard(id);
      if (state.upgrades[id] >= card.maxStacks) return;
      const newUpgrades = { ...state.upgrades, [id]: state.upgrades[id] + 1 };
      const maxHp = getUpgradeStats(newUpgrades).maxHp + state.gear.vest * 15;
      const champion = state.ngPlusCycle > 0 || state.currentLevel === 10 ? {
        cycle: state.ngPlusCycle, level: Math.min(10, state.currentLevel + 1), hearts: state.hearts,
        upgrades: newUpgrades, ready: state.currentLevel === 10,
      } : state.champion;
      if (state.ngPlusCycle > 0 || state.currentLevel === 10) writeChampion(champion);

      set({
        upgrades: newUpgrades,
        champion,
        maxHp,
        hp: Math.min(maxHp, state.hp + (maxHp - state.maxHp > 0 ? maxHp - state.maxHp : 0) + (id === "ironWill" ? 20 : 0)),
        grenades: id === "bombBelt" ? Math.min(getUpgradeStats(newUpgrades).grenadeCapacity + state.gear.satchel, state.grenades + 1) : state.grenades,
        selectedUpgrade: id,
      });
      persist(get());
      window.dispatchEvent(new Event("ui-confirm"));
    },

    undoUpgrade: () => {
      const state = get();
      if (state.screen !== "upgrade" || !state.selectedUpgrade) return;
      const id = state.selectedUpgrade;
      const upgrades = { ...state.upgrades, [id]: state.upgrades[id] - 1 };
      const maxHp = getUpgradeStats(upgrades).maxHp + state.gear.vest * 15;
      const champion = state.ngPlusCycle > 0 || state.currentLevel === 10 ? { cycle: state.ngPlusCycle, level: Math.min(10, state.currentLevel + 1), hearts: state.hearts, upgrades, ready: state.currentLevel === 10 } : state.champion;
      if (state.ngPlusCycle > 0 || state.currentLevel === 10) writeChampion(champion);
      set({ upgrades, champion, maxHp, hp: Math.min(maxHp, state.hp), grenades: Math.min(state.grenades, getUpgradeStats(upgrades).grenadeCapacity + state.gear.satchel), selectedUpgrade: null });
      persist(get());
    },

    continueAfterVictory: () => {
      const state = get();
      if (state.screen === "stageClear") set({ screen: "upgrade" });
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
      window.dispatchEvent(new Event("ui-confirm"));
    },

    buyHeart: () => {
      const state = get();
      if (state.screen !== "menu" || state.hearts >= MAX_HEARTS || state.coins < 1000) return;
      const coins = state.coins - 1000;
      localStorage.setItem("shoot-a-boss:coins", String(coins));
      writeHearts(state.hearts + 1);
      const champion = state.champion ? { ...state.champion, hearts: state.hearts + 1 } : null;
      writeChampion(champion);
      set({ hearts: state.hearts + 1, coins, champion });
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
      set({ magicReadyAt: now + magicStats(kind, state.magic[kind], state.magicChoices).cooldown * (1 - state.gear.arcana * .02) * (1 - state.upgrades.magicTempo * .12) * 1000,
        shieldCharges: state.upgrades.spellWard && state.shieldCharges === 0 ? 1 : state.shieldCharges });
      window.dispatchEvent(new CustomEvent("magic-cast", { detail: { kind, rank: state.magic[kind] } }));
      return true;
    },
    resetData: () => {
      for (const key of [SAVE_KEY, CHAMPION_KEY, HEARTS_KEY, "shoot-a-boss:unlocked-level", "shoot-a-boss:gear", "shoot-a-boss:coins"]) localStorage.removeItem(key);
      const upgrades = emptyUpgrades(); const gear = Object.fromEntries(GEAR.map(({ id }) => [id, 0])) as GearLevels;
      set((state) => ({ screen: "story", runId: state.runId + 1, unlockedLevel: 1, hearts: MAX_HEARTS,
        ngPlusCycle: 0, champion: null, coins: 0, gear, lastReward: 0, lastXpReward: 0, xp: 0, playerLevel: 1, skillPoints: 0,
        magic: emptyMagic(), magicChoices: emptyMagicChoices(), selectedMagic: null, magicReadyAt: 0, skins: COSMETIC_PREVIEW_ALL ? previewSkins() : emptySkins(), equippedSkins: defaultSkins(),
        upgrades, upgradeChoices: [], selectedUpgrade: null, ...freshRun(1, upgrades, 0, gear) }));
    },

    closeTutorial: () => set({ tutorialOpen: false }),
    triggerScan: () => {
      const state = get();
      const now = performance.now();
      if (state.screen !== "playing" || state.tutorialOpen || now < state.scanCooldownUntil) return;
      const definition = getEnemyTuning(state.currentLevel, state.ngPlusCycle);
      const targets = [
        ...Array.from({ length: definition.bosses }, (_, i) => `target-${i}`),
        ...Array.from({ length: definition.paperwork }, (_, i) => `paper-${i}`),
        ...Array.from({ length: definition.pens }, (_, i) => `pen-${i}`),
        ...Array.from({ length: definition.flying ?? 0 }, (_, i) => `fly-${i}`),
        ...Array.from({ length: definition.statues ?? 0 }, (_, i) => `statue-${i}`),
        ...(getLevelDefinition(state.currentLevel).theme === "gems" ? ["paper-inner", "pen-mid", "pen-peak"] : []),
      ].filter((id) => !state.eliminated.includes(id));
      if (!targets.length) return;
      const all = state.upgrades.recon > 0;
      const selected = all ? targets : [targets[Math.floor(Math.random() * targets.length)]];
      const duration = (all ? 10000 : 5000) + state.gear.lens * 2000;
      const until = now + duration;
      set({ scanTargets: selected, scanUntil: until, scanCooldownUntil: now + 30000 });
      window.dispatchEvent(new Event("scan-started"));
      window.setTimeout(() => {
        if (get().scanUntil === until) set({ scanTargets: [] });
      }, duration);
    },

    rerollUpgrades: () => {
      const state = get();
      if (
        state.screen !== "upgrade" ||
        state.selectedUpgrade ||
        state.upgradeRerollsLeft <= 0
      ) {
        return;
      }

      const rerollIndex = 2 - state.upgradeRerollsLeft;
      set({
        upgradeChoices: rollUpgradeChoices(
          state.currentLevel,
          rerollIndex + 1,
          state.upgrades,
        ),
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
        tutorialOpen: state.currentLevel === 1,
        ...freshRun(state.currentLevel, state.upgrades, state.ngPlusCycle, current.gear),
      }));
      announceRifle();
    },

    goToMenu: () => {
      const state = get();
      if (state.screen === "purged") { get().resetData(); set({ screen: "menu" }); return; }
      const checkpointLevel = ["stageClear", "upgrade"].includes(state.screen) && state.currentLevel < 10 ? state.currentLevel + 1 : state.currentLevel;
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
        Math.round(baseDuration * getUpgradeStats(state.upgrades).reloadTime),
      );
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
          getUpgradeStats(state.upgrades).grenadeCapacity + state.gear.satchel,
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

    damagePlayer: (amount, source) => {
      const state = get();
      if (state.screen !== "playing" || amount <= 0) return;
      if (state.shieldCharges > 0) {
        set({ shieldCharges: state.shieldCharges - 1 });
        window.dispatchEvent(new CustomEvent("shield-blocked", { detail: { source, chargesRemaining: state.shieldCharges - 1 } }));
        return;
      }
      if (state.upgrades.shieldOrbit && performance.now() >= state.shieldReadyAt) {
        set({ shieldReadyAt: performance.now() + 12000 });
        window.dispatchEvent(new CustomEvent("shield-blocked", { detail: { source } }));
        return;
      }
      const next = Math.max(0, state.hp - amount);
      window.dispatchEvent(
        new CustomEvent("player-damaged", { detail: { amount, source } }),
      );
      if (next > 0) { set({ hp: next }); return; }
      const hearts = state.hearts - 1;
      writeHearts(hearts);
      if (hearts <= 0) {
        get().resetData();
        set({ screen: "purged", hearts: 0, hp: 0, tutorialOpen: false });
        return;
      }
      const champion = state.ngPlusCycle > 0 ? {
        cycle: state.ngPlusCycle, level: state.currentLevel, hearts,
        upgrades: state.upgrades, ready: false,
      } : state.champion ? { ...state.champion, hearts } : null;
      if (champion) writeChampion(champion);
      set({ hp: 0, hearts, champion, screen: "lost", scoped: false, movementMode: "idle" });
      persist(get());
    },

    eliminate: (id) => {
      const state = get();
      if (state.screen !== "playing" || state.eliminated.includes(id)) return;

      const eliminated = [...state.eliminated, id];
      const killCount = eliminated.length;
      const stats = getUpgradeStats(state.upgrades);
      const nextHp = Math.min(state.maxHp, state.hp + stats.killHeal + state.gear.medallion * 4 + (state.upgrades.vampireInk && killCount % 3 === 0 ? 15 : 0));
      const ammo = state.upgrades.swiftReset && state.weapon !== "knife" ? (() => {
        const current = state.ammo[state.weapon];
        return { ...state.ammo, [state.weapon]: { ...current, mag: Math.min(magazineSize(state.weapon, state.upgrades), current.mag + Math.ceil(magazineSize(state.weapon, state.upgrades) * 0.2)) } };
      })() : state.ammo;
      const enemyPositions = { ...state.enemyPositions };
      delete enemyPositions[id];

      window.dispatchEvent(
        new CustomEvent("boss-killed", {
          detail: { count: killCount, id },
        }),
      );

      if (killCount >= state.targetCount) {
        const effectiveLevel = state.currentLevel + state.ngPlusCycle * 10;
        const lastReward = 55 + effectiveLevel * 22;
        const coins = state.coins + lastReward;
        const lastXpReward = Math.round(95 + effectiveLevel * 37 + state.targetCount * 8);
        let xp = state.xp + lastXpReward;
        let playerLevel = state.playerLevel;
        let skillPoints = state.skillPoints;
        while (xp >= xpToNextLevel(playerLevel)) { xp -= xpToNextLevel(playerLevel++); skillPoints++; }
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
            screen: "stageClear", coins, lastReward, xp, playerLevel, skillPoints, lastXpReward, ammo, enemyPositions,
            scoped: false,
            movementMode: "idle",
            upgradeChoices: rollUpgradeChoices(
              state.currentLevel,
              0,
              state.upgrades,
            ),
            upgradeRerollsLeft: 1,
            selectedUpgrade: null,
          });
          persist(get());
          return;
        }

        set({
          eliminated,
          hp: nextHp,
          unlockedLevel,
          screen: "stageClear", coins, lastReward, xp, playerLevel, skillPoints, lastXpReward, ammo, enemyPositions,
          scoped: false,
          movementMode: "idle",
          upgradeChoices: rollUpgradeChoices(
            state.currentLevel,
            0,
            state.upgrades,
          ),
          upgradeRerollsLeft: 1,
          selectedUpgrade: null,
        });
        persist(get());
        return;
      }

      set({ eliminated, hp: nextHp, ammo, enemyPositions, scanTargets: state.scanTargets.filter((target) => target !== id) });
    },

    setSensitivity: (sensitivity) => set({ sensitivity }),
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
