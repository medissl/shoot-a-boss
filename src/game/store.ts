import { create } from "zustand";
import { GRENADE_COUNT, WEAPONS, type WeaponId } from "./config";
import { getLevelDefinition, getPlayerSpawn, getTargetCount } from "./levels";
import {
  emptyUpgrades,
  getUpgradeStats,
  getUpgradeCard,
  rollUpgradeChoices,
  type UpgradeId,
  type UpgradeLevels,
} from "./progression";

type AmmoState = Record<WeaponId, { mag: number; reserve: number }>;

export type GameScreen =
  | "story"
  | "comic"
  | "menu"
  | "playing"
  | "paused"
  | "upgrade"
  | "won"
  | "lost";

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
  nextLevel: () => void;
  chooseUpgrade: (id: UpgradeId) => void;
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
  damagePlayer: (amount: number) => void;
  eliminate: (id: string) => void;
  setSensitivity: (value: number) => void;
  setBgmVolume: (value: number) => void;
  setSfxVolume: (value: number) => void;
  setScoped: (value: boolean) => void;
  setPlayerPosition: (value: [number, number, number]) => void;
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

function freshRun(level: number, upgrades: UpgradeLevels) {
  const stats = getUpgradeStats(upgrades);

  return {
    currentLevel: level,
    targetCount: getTargetCount(level),
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    weapon: "rifle" as WeaponId,
    ammo: freshAmmo(upgrades),
    grenades: stats.grenadeCapacity || GRENADE_COUNT,
    eliminated: [] as string[],
    scanTargets: [] as string[],
    scanUntil: 0,
    scanCooldownUntil: 0,
    scoped: false,
    playerPosition: getPlayerSpawn(level),
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
      set((state) => ({
        screen: "playing",
        runId: state.runId + 1,
        upgrades,
        upgradeChoices: [],
        upgradeRerollsLeft: 1,
        selectedUpgrade: null,
        tutorialOpen: true,
        ...freshRun(1, upgrades),
      }));
      announceRifle();
      window.dispatchEvent(new Event("stage-selected"));
    },

    startLevel: (level) => {
      const safeLevel = Math.min(10, Math.max(1, level));
      const upgrades = emptyUpgrades();
      set((state) => ({
        screen: "playing",
        runId: state.runId + 1,
        upgrades,
        upgradeChoices: [],
        upgradeRerollsLeft: 1,
        selectedUpgrade: null,
        tutorialOpen: safeLevel === 1,
        ...freshRun(safeLevel, upgrades),
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
      set((current) => ({
        screen: "playing",
        runId: current.runId + 1,
        upgradeChoices: [],
        upgradeRerollsLeft: 1,
        selectedUpgrade: null,
        tutorialOpen: false,
        ...freshRun(next, state.upgrades),
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
      const maxHp = getUpgradeStats(newUpgrades).maxHp;

      set({
        upgrades: newUpgrades,
        maxHp,
        hp: Math.min(maxHp, state.hp + (maxHp - state.maxHp > 0 ? maxHp - state.maxHp : 0) + (id === "ironWill" ? 20 : 0)),
        grenades: id === "bombBelt" ? Math.min(getUpgradeStats(newUpgrades).grenadeCapacity, state.grenades + 1) : state.grenades,
        selectedUpgrade: id,
      });
    },

    closeTutorial: () => set({ tutorialOpen: false }),
    triggerScan: () => {
      const state = get();
      const now = performance.now();
      if (state.screen !== "playing" || state.tutorialOpen || now < state.scanCooldownUntil) return;
      const definition = getLevelDefinition(state.currentLevel).enemy;
      const targets = [
        ...Array.from({ length: definition.bosses }, (_, i) => `target-${i}`),
        ...Array.from({ length: definition.paperwork }, (_, i) => `paper-${i}`),
        ...Array.from({ length: definition.pens }, (_, i) => `pen-${i}`),
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
      set((current) => ({
        screen: "playing",
        runId: current.runId + 1,
        tutorialOpen: state.currentLevel === 1,
        ...freshRun(state.currentLevel, state.upgrades),
      }));
      announceRifle();
    },

    goToMenu: () => {
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
      const cost = weapon === "shotgun" && get().upgrades.shotgunDouble ? 2 : 1;
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
        Math.round(baseDuration * getUpgradeStats(state.upgrades).reloadTime *
          (weapon === "sniper" && state.upgrades.sniperFire ? 1.2 : 1) *
          (weapon === "shotgun" && state.upgrades.shotgunDouble ? 1.2 : 1)),
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

    damagePlayer: (amount) => {
      const state = get();
      const next = Math.max(0, state.hp - amount);
      window.dispatchEvent(
        new CustomEvent("player-damaged", { detail: { amount } }),
      );
      set({
        hp: next,
        ...(next === 0
          ? { screen: "lost" as const, scoped: false }
          : {}),
      });
    },

    eliminate: (id) => {
      const state = get();
      if (state.eliminated.includes(id)) return;

      const eliminated = [...state.eliminated, id];
      const killCount = eliminated.length;
      const stats = getUpgradeStats(state.upgrades);
      const nextHp = Math.min(state.maxHp, state.hp + stats.killHeal);

      window.dispatchEvent(
        new CustomEvent("boss-killed", {
          detail: { count: killCount, id },
        }),
      );

      if (killCount >= state.targetCount) {
        const unlockedLevel = Math.min(
          10,
          Math.max(state.unlockedLevel, state.currentLevel + 1),
        );
        writeUnlockedLevel(unlockedLevel);

        if (state.currentLevel >= 10) {
          set({
            eliminated,
            hp: nextHp,
            unlockedLevel,
            screen: "won",
            scoped: false,
            movementMode: "idle",
          });
          return;
        }

        set({
          eliminated,
          hp: nextHp,
          unlockedLevel,
          screen: "upgrade",
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

      set({ eliminated, hp: nextHp, scanTargets: state.scanTargets.filter((target) => target !== id) });
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
    setMovementMode: (movementMode) => {
      if (get().movementMode !== movementMode) set({ movementMode });
    },
  };
});
