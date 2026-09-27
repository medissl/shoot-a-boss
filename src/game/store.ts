import { create } from "zustand";
import {
  GRENADE_COUNT,
  MAX_LEVEL,
  UPGRADE_CARDS,
  WEAPONS,
  blankUpgrades,
  getLevelTargetCount,
  getUpgradeStats,
  type UpgradeCounts,
  type UpgradeId,
  type WeaponId,
} from "./config";

type AmmoState = Record<WeaponId, { mag: number; reserve: number }>;

export type GameScreen =
  | "story"
  | "comic"
  | "menu"
  | "playing"
  | "paused"
  | "reward"
  | "won"
  | "lost";

export type MovementMode = "idle" | "walk" | "run" | "crouch" | "slide";

const BASE_RELOAD_MS: Record<Exclude<WeaponId, "knife">, number> = {
  sniper: 1750,
  rifle: 1500,
  shotgun: 2000,
};

type GameStore = {
  screen: GameScreen;
  runId: number;
  level: number;
  maxUnlockedLevel: number;
  hp: number;
  maxHp: number;
  weapon: WeaponId;
  ammo: AmmoState;
  grenades: number;
  grenadeCapacity: number;
  eliminated: string[];
  upgrades: UpgradeCounts;
  rewardChoices: UpgradeId[];
  rewardRerolled: boolean;
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
  startGame: (level?: number) => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  nextLevel: () => void;
  goToMenu: () => void;
  readComic: () => void;
  chooseUpgrade: (id: UpgradeId) => void;
  rerollRewards: () => void;
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
  const raw = Number(window.localStorage.getItem("shoot-a-boss:unlocked-level"));
  return Number.isFinite(raw)
    ? Math.min(MAX_LEVEL, Math.max(1, Math.floor(raw)))
    : 1;
}

function storeUnlockedLevel(level: number) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      "shoot-a-boss:unlocked-level",
      String(Math.min(MAX_LEVEL, Math.max(1, level))),
    );
  }
}

function magazineCapacity(weapon: WeaponId, upgrades: UpgradeCounts) {
  if (weapon === "knife") return 1;
  const stats = getUpgradeStats(upgrades);
  return Math.max(
    1,
    Math.ceil(WEAPONS[weapon].magazine * stats.magazine),
  );
}

function freshAmmo(upgrades: UpgradeCounts): AmmoState {
  return {
    sniper: {
      mag: magazineCapacity("sniper", upgrades),
      reserve: WEAPONS.sniper.reserve,
    },
    rifle: {
      mag: magazineCapacity("rifle", upgrades),
      reserve: WEAPONS.rifle.reserve,
    },
    shotgun: {
      mag: magazineCapacity("shotgun", upgrades),
      reserve: WEAPONS.shotgun.reserve,
    },
    knife: { mag: 1, reserve: 0 },
  };
}

function freshRun(upgrades: UpgradeCounts) {
  const stats = getUpgradeStats(upgrades);
  return {
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    weapon: "rifle" as WeaponId,
    ammo: freshAmmo(upgrades),
    grenades: stats.grenadeCapacity,
    grenadeCapacity: stats.grenadeCapacity,
    eliminated: [] as string[],
    scoped: false,
    playerPosition: [0, 1.4, 12] as [number, number, number],
    speedBoostUntil: 0,
    speedBoostActive: false,
    movementMode: "idle" as MovementMode,
    reloading: false,
    reloadingWeapon: null as WeaponId | null,
    reloadStartedAt: 0,
    reloadDurationMs: 0,
    reloadToken: 0,
    rewardChoices: [] as UpgradeId[],
    rewardRerolled: false,
  };
}

function pickRewardChoices(): UpgradeId[] {
  const pool = UPGRADE_CARDS.map((card) => card.id);
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapWith]] = [pool[swapWith], pool[index]];
  }
  return pool.slice(0, 3);
}

const weaponOrder: WeaponId[] = ["sniper", "rifle", "shotgun", "knife"];

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

export const useGameStore = create<GameStore>((set, get) => {
  const initialUpgrades = blankUpgrades();

  return {
    screen: "story",
    runId: 0,
    level: 1,
    maxUnlockedLevel: readUnlockedLevel(),
    upgrades: initialUpgrades,
    ...freshRun(initialUpgrades),
    sensitivity: 0.85,
    bgmVolume: readStoredVolume("shoot-a-boss:bgm-volume", 0.34),
    sfxVolume: readStoredVolume("shoot-a-boss:sfx-volume", 0.42),

    startGame: (requestedLevel = 1) => {
      const level = Math.min(
        get().maxUnlockedLevel,
        Math.max(1, Math.floor(requestedLevel)),
      );
      const upgrades = blankUpgrades();

      set((state) => ({
        screen: "playing",
        runId: state.runId + 1,
        level,
        upgrades,
        ...freshRun(upgrades),
      }));

      window.dispatchEvent(
        new CustomEvent("weapon-selected", {
          detail: { weapon: "rifle" as WeaponId },
        }),
      );
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
      const upgrades = get().upgrades;
      set((state) => ({
        screen: "playing",
        runId: state.runId + 1,
        ...freshRun(upgrades),
        upgrades,
      }));

      window.dispatchEvent(
        new CustomEvent("weapon-selected", {
          detail: { weapon: "rifle" as WeaponId },
        }),
      );
    },

    nextLevel: () => {
      const current = get().level;
      if (current >= MAX_LEVEL) {
        get().goToMenu();
        return;
      }

      const level = current + 1;
      const upgrades = get().upgrades;
      set((state) => ({
        screen: "playing",
        level,
        runId: state.runId + 1,
        ...freshRun(upgrades),
        upgrades,
      }));

      window.dispatchEvent(
        new CustomEvent("weapon-selected", {
          detail: { weapon: "rifle" as WeaponId },
        }),
      );
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

    chooseUpgrade: (id) => {
      if (get().screen !== "reward") return;

      const upgrades = {
        ...get().upgrades,
        [id]: get().upgrades[id] + 1,
      };
      const stats = getUpgradeStats(upgrades);
      const patch: Partial<GameStore> = {
        upgrades,
        maxHp: stats.maxHp,
        grenadeCapacity: stats.grenadeCapacity,
        screen: "won",
      };

      if (id === "maxHp") {
        patch.hp = Math.min(stats.maxHp, get().hp + 25);
      }
      if (id === "grenades") {
        patch.grenades = Math.min(stats.grenadeCapacity, get().grenades + 1);
      }

      set(patch);
    },

    rerollRewards: () => {
      if (get().screen !== "reward" || get().rewardRerolled) return;
      set({
        rewardChoices: pickRewardChoices(),
        rewardRerolled: true,
      });
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
      if (current.mag <= 0) return false;

      set((state) => ({
        ammo: {
          ...state.ammo,
          [weapon]: { ...current, mag: current.mag - 1 },
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
      const capacity = magazineCapacity(weapon, state.upgrades);
      const needed = capacity - current.mag;
      const moved = Math.min(needed, current.reserve);
      if (moved <= 0) return;

      const stats = getUpgradeStats(state.upgrades);
      const duration = Math.round(
        BASE_RELOAD_MS[weapon as Exclude<WeaponId, "knife">] * stats.reload,
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
        const latestState = get();
        if (
          latestState.reloadToken !== token ||
          !latestState.reloading ||
          latestState.reloadingWeapon !== weapon ||
          latestState.screen !== "playing"
        ) {
          return;
        }

        const latest = latestState.ammo[weapon];
        const latestCapacity = magazineCapacity(
          weapon,
          latestState.upgrades,
        );
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
          state.grenadeCapacity,
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
      const next = Math.max(0, get().hp - amount);
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
      const healedHp =
        stats.killHeal > 0
          ? Math.min(state.maxHp, state.hp + stats.killHeal)
          : state.hp;

      window.dispatchEvent(
        new CustomEvent("boss-killed", {
          detail: { count: killCount, id },
        }),
      );

      const cleared = killCount >= getLevelTargetCount(state.level);

      if (cleared) {
        const nextUnlocked = Math.min(
          MAX_LEVEL,
          Math.max(state.maxUnlockedLevel, state.level + 1),
        );
        storeUnlockedLevel(nextUnlocked);

        set({
          eliminated,
          hp: healedHp,
          maxUnlockedLevel: nextUnlocked,
          screen: "reward",
          scoped: false,
          movementMode: "idle",
          rewardChoices: pickRewardChoices(),
          rewardRerolled: false,
        });
      } else {
        set({ eliminated, hp: healedHp });
      }
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
