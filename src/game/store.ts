import { create } from "zustand";
import { GRENADE_COUNT, WEAPONS, type WeaponId } from "./config";
import { getEnemyTuning, getLevelDefinition, getPlayerSpawn, getTargetCount } from "./levels";
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
export type GearId = "vest" | "boots" | "barrel" | "medallion";
export const GEAR: { id: GearId; name: string; detail: string; cost: number }[] = [
  { id: "vest", name: "IRON VEST", detail: "+15 maximum HP per rank", cost: 100 },
  { id: "boots", name: "QUICK BOOTS", detail: "+5% movement per rank", cost: 100 },
  { id: "barrel", name: "INK BARREL", detail: "+6% weapon damage per rank", cost: 120 },
  { id: "medallion", name: "LIFE MEDALLION", detail: "Heal 4 HP on every elimination per rank", cost: 140 },
];
export type GearLevels = Record<GearId, number>;
export const MAX_HEARTS = 5;
const CHAMPION_KEY = "shoot-a-boss:champion";
const HEARTS_KEY = "shoot-a-boss:hearts";

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
  return Object.fromEntries(GEAR.map(({ id }) => [id, Number.isInteger(raw[id]) ? Math.min(5, Math.max(0, Number(raw[id]))) : 0])) as GearLevels;
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

function freshRun(level: number, upgrades: UpgradeLevels, cycle = 0, gear: GearLevels = { vest: 0, boots: 0, barrel: 0, medallion: 0 }) {
  const stats = getUpgradeStats(upgrades);

  return {
    currentLevel: level,
    targetCount: getTargetCount(level, cycle),
    hp: stats.maxHp + gear.vest * 15,
    maxHp: stats.maxHp + gear.vest * 15,
    weapon: "rifle" as WeaponId,
    ammo: freshAmmo(upgrades),
    grenades: stats.grenadeCapacity || GRENADE_COUNT,
    eliminated: [] as string[],
    scanTargets: [] as string[],
    scanUntil: 0,
    scanCooldownUntil: 0,
    scoped: false,
    playerPosition: getPlayerSpawn(level),
    playerYaw: 0,
    enemyPositions: {} as Record<string, [number, number, number]>,
    shieldReadyAt: 0,
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
  const initialUpgrades = emptyUpgrades();

  return {
    screen: "story",
    runId: 0,
    unlockedLevel: readUnlockedLevel(),
    hearts: readHearts(),
    ngPlusCycle: 0,
    champion: readChampion(),
    coins: typeof window === "undefined" ? 0 : readCoins(),
    gear: typeof window === "undefined" ? { vest: 0, boots: 0, barrel: 0, medallion: 0 } : readGear(),
    lastReward: 0,
    upgrades: initialUpgrades,
    upgradeChoices: [],
    upgradeRerollsLeft: 1,
    selectedUpgrade: null,
    tutorialOpen: false,
    ...freshRun(1, initialUpgrades),
    sensitivity: 0.85,
    bgmVolume: readStoredVolume("shoot-a-boss:bgm-volume", 0.34),
    sfxVolume: readStoredVolume("shoot-a-boss:sfx-volume", 0.42),

    startGame: () => {
      const upgrades = emptyUpgrades();
      const hearts = get().hearts || MAX_HEARTS;
      writeHearts(hearts);
      set((state) => ({
        screen: "playing",
        runId: state.runId + 1,
        upgrades,
        hearts,
        ngPlusCycle: 0,
        upgradeChoices: [],
        upgradeRerollsLeft: 1,
        selectedUpgrade: null,
        tutorialOpen: true,
        ...freshRun(1, upgrades, 0, state.gear),
      }));
      announceRifle();
      window.dispatchEvent(new Event("stage-selected"));
    },

    startLevel: (level) => {
      const safeLevel = Math.min(10, Math.max(1, level));
      const upgrades = emptyUpgrades();
      const hearts = get().hearts || MAX_HEARTS;
      writeHearts(hearts);
      set((state) => ({
        screen: "playing",
        runId: state.runId + 1,
        upgrades,
        hearts,
        ngPlusCycle: 0,
        upgradeChoices: [],
        upgradeRerollsLeft: 1,
        selectedUpgrade: null,
        tutorialOpen: safeLevel === 1,
        ...freshRun(safeLevel, upgrades, 0, state.gear),
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
      announceRifle();
      window.dispatchEvent(new Event("stage-selected"));
    },

    nextLevel: () => {
      const state = get();
      if (state.currentLevel >= 10) {
        set({ screen: "won" });
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
      const champion = state.ngPlusCycle > 0 ? {
        cycle: state.ngPlusCycle, level: Math.min(10, state.currentLevel + 1), hearts: state.hearts,
        upgrades: newUpgrades, ready: false,
      } : state.champion;
      if (state.ngPlusCycle > 0) writeChampion(champion);

      set({
        upgrades: newUpgrades,
        champion,
        maxHp,
        hp: Math.min(maxHp, state.hp + (maxHp - state.maxHp > 0 ? maxHp - state.maxHp : 0) + (id === "ironWill" ? 20 : 0)),
        grenades: id === "bombBelt" ? Math.min(getUpgradeStats(newUpgrades).grenadeCapacity, state.grenades + 1) : state.grenades,
        selectedUpgrade: id,
      });
    },

    undoUpgrade: () => {
      const state = get();
      if (state.screen !== "upgrade" || !state.selectedUpgrade) return;
      const id = state.selectedUpgrade;
      const upgrades = { ...state.upgrades, [id]: state.upgrades[id] - 1 };
      const maxHp = getUpgradeStats(upgrades).maxHp + state.gear.vest * 15;
      const champion = state.ngPlusCycle > 0 ? { cycle: state.ngPlusCycle, level: Math.min(10, state.currentLevel + 1), hearts: state.hearts, upgrades, ready: false } : state.champion;
      if (state.ngPlusCycle > 0) writeChampion(champion);
      set({ upgrades, champion, maxHp, hp: Math.min(maxHp, state.hp), grenades: Math.min(state.grenades, getUpgradeStats(upgrades).grenadeCapacity), selectedUpgrade: null });
    },

    continueAfterVictory: () => {
      const state = get();
      if (state.screen === "stageClear") set({ screen: state.currentLevel === 10 ? "won" : "upgrade" });
    },

    buyGear: (id) => {
      const state = get();
      if (state.screen !== "menu" || state.gear[id] >= 5) return;
      const cost = gearCost(id, state.gear[id]);
      if (state.coins < cost) return;
      const coins = state.coins - cost;
      const gear = { ...state.gear, [id]: state.gear[id] + 1 };
      window.localStorage.setItem("shoot-a-boss:coins", String(coins));
      window.localStorage.setItem("shoot-a-boss:gear", JSON.stringify(gear));
      set({ coins, gear });
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
      const until = now + (all ? 10000 : 5000);
      set({ scanTargets: selected, scanUntil: until, scanCooldownUntil: now + 30000 });
      window.setTimeout(() => {
        if (get().scanUntil === until) set({ scanTargets: [] });
      }, all ? 10000 : 5000);
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
        const upgrades = emptyUpgrades();
        writeHearts(MAX_HEARTS);
        set((current) => ({
          screen: "playing", runId: current.runId + 1,
          hearts: MAX_HEARTS, ngPlusCycle: 0, champion: null,
          upgrades, tutorialOpen: true,
          ...freshRun(1, upgrades, 0, current.gear),
        }));
        announceRifle();
        window.dispatchEvent(new Event("stage-selected"));
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
      if (state.ngPlusCycle > 0 && state.screen !== "purged" && state.screen !== "won" && !(state.screen === "stageClear" && state.currentLevel === 10)) {
        const champion = {
          cycle: state.ngPlusCycle,
          level: state.screen === "upgrade" ? Math.min(10, state.currentLevel + 1) : state.currentLevel,
          hearts: state.hearts,
          upgrades: state.upgrades, ready: false,
        };
        writeChampion(champion);
        set({ champion });
      }
      cancelReload(set, get);
      set({
        screen: "menu",
        scoped: false,
        movementMode: "idle",
        speedBoostActive: false,
        speedBoostUntil: 0,
      });
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
          getUpgradeStats(state.upgrades).grenadeCapacity,
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
        const upgrades = emptyUpgrades();
        writeUnlockedLevel(1);
        writeChampion(null);
        set({
          ...freshRun(1, upgrades, 0, state.gear),
          screen: "purged", runId: state.runId + 1, hp: 0,
          unlockedLevel: 1, hearts: 0, ngPlusCycle: 0, champion: null,
          upgrades, upgradeChoices: [], selectedUpgrade: null, tutorialOpen: false,
        });
        return;
      }
      const champion = state.ngPlusCycle > 0 ? {
        cycle: state.ngPlusCycle, level: state.currentLevel, hearts,
        upgrades: state.upgrades, ready: false,
      } : state.champion ? { ...state.champion, hearts } : null;
      if (champion) writeChampion(champion);
      set({ hp: 0, hearts, champion, screen: "lost", scoped: false, movementMode: "idle" });
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
        const lastReward = 40 + state.currentLevel * 15 + state.ngPlusCycle * 25;
        const coins = state.coins + lastReward;
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
            screen: "stageClear", coins, lastReward, ammo, enemyPositions,
            scoped: false,
            movementMode: "idle",
          });
          return;
        }

        set({
          eliminated,
          hp: nextHp,
          unlockedLevel,
          screen: "stageClear", coins, lastReward, ammo, enemyPositions,
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
