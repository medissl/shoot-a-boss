import { create } from "zustand";
import { GRENADE_COUNT, TARGET_COUNT, WEAPONS, type WeaponId } from "./config";

type AmmoState = Record<WeaponId, { mag: number; reserve: number }>;
export type GameScreen =
  | "story"
  | "comic"
  | "menu"
  | "playing"
  | "paused"
  | "won"
  | "lost";
export type MovementMode = "idle" | "walk" | "run" | "crouch" | "slide";

const RELOAD_MS: Record<WeaponId, number> = {
  sniper: 1750,
  rifle: 1500,
  shotgun: 2000,
};

type GameStore = {
  screen: GameScreen;
  runId: number;
  hp: number;
  weapon: WeaponId;
  ammo: AmmoState;
  grenades: number;
  eliminated: string[];
  sensitivity: number;
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
  setScoped: (value: boolean) => void;
  setPlayerPosition: (value: [number, number, number]) => void;
  setMovementMode: (value: MovementMode) => void;
};

function freshAmmo(): AmmoState {
  return {
    sniper: { mag: WEAPONS.sniper.magazine, reserve: WEAPONS.sniper.reserve },
    rifle: { mag: WEAPONS.rifle.magazine, reserve: WEAPONS.rifle.reserve },
    shotgun: { mag: WEAPONS.shotgun.magazine, reserve: WEAPONS.shotgun.reserve },
  };
}

const weaponOrder: WeaponId[] = ["sniper", "rifle", "shotgun"];

function freshRun() {
  return {
    hp: 100,
    weapon: "rifle" as WeaponId,
    ammo: freshAmmo(),
    grenades: GRENADE_COUNT,
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
  };
}

function cancelReload(set: (state: Partial<GameStore>) => void, get: () => GameStore) {
  set({
    reloading: false,
    reloadingWeapon: null,
    reloadStartedAt: 0,
    reloadDurationMs: 0,
    reloadToken: get().reloadToken + 1,
  });
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: "story",
  runId: 0,
  ...freshRun(),
  sensitivity: 0.85,

  startGame: () => {
    set((state) => ({
      screen: "playing",
      runId: state.runId + 1,
      ...freshRun(),
    }));
    window.dispatchEvent(
      new CustomEvent("weapon-selected", { detail: { weapon: "rifle" as WeaponId } }),
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
    set((state) => ({
      screen: "playing",
      runId: state.runId + 1,
      ...freshRun(),
    }));
    window.dispatchEvent(
      new CustomEvent("weapon-selected", { detail: { weapon: "rifle" as WeaponId } }),
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

  setWeapon: (weapon) => {
    cancelReload(set, get);
    set({ weapon, scoped: false });
    window.dispatchEvent(
      new CustomEvent("weapon-selected", { detail: { weapon } }),
    );
  },

  cycleWeapon: (direction) => {
    const current = weaponOrder.indexOf(get().weapon);
    const next = (current + direction + weaponOrder.length) % weaponOrder.length;
    const weapon = weaponOrder[next];
    cancelReload(set, get);
    set({ weapon, scoped: false });
    window.dispatchEvent(
      new CustomEvent("weapon-selected", { detail: { weapon } }),
    );
  },

  spendRound: (weapon) => {
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
    if (get().reloading || get().screen !== "playing") return;

    const weapon = get().weapon;
    const current = get().ammo[weapon];
    const needed = WEAPONS[weapon].magazine - current.mag;
    const moved = Math.min(needed, current.reserve);
    if (moved <= 0) return;

    const duration = RELOAD_MS[weapon];
    const token = get().reloadToken + 1;

    set({
      reloading: true,
      reloadingWeapon: weapon,
      reloadStartedAt: performance.now(),
      reloadDurationMs: duration,
      reloadToken: token,
      scoped: false,
    });

    window.setTimeout(() => {
      const state = get();
      if (
        state.reloadToken !== token ||
        !state.reloading ||
        state.reloadingWeapon !== weapon ||
        state.screen !== "playing"
      ) {
        return;
      }

      const latest = state.ammo[weapon];
      const latestNeeded = WEAPONS[weapon].magazine - latest.mag;
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
      grenades: Math.min(GRENADE_COUNT, state.grenades + amount),
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
    set({ hp: next, ...(next === 0 ? { screen: "lost", scoped: false } : {}) });
  },

  eliminate: (id) => {
    if (get().eliminated.includes(id)) return;
    const eliminated = [...get().eliminated, id];
    const killCount = eliminated.length;

    window.dispatchEvent(
      new CustomEvent("boss-killed", {
        detail: { count: killCount, id },
      }),
    );

    set({
      eliminated,
      ...(killCount >= TARGET_COUNT
        ? { screen: "won" as const, scoped: false, movementMode: "idle" as const }
        : {}),
    });
  },

  setSensitivity: (sensitivity) => set({ sensitivity }),
  setScoped: (scoped) => {
    if (get().reloading && scoped) return;
    set({ scoped });
  },
  setPlayerPosition: (playerPosition) => set({ playerPosition }),
  setMovementMode: (movementMode) => {
    if (get().movementMode !== movementMode) set({ movementMode });
  },
}));
