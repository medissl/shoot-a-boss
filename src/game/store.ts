import { create } from "zustand";
import { GRENADE_COUNT, TARGET_COUNT, WEAPONS, type WeaponId } from "./config";

type AmmoState = Record<WeaponId, { mag: number; reserve: number }>;

type GameScreen = "story" | "menu" | "playing" | "paused" | "won" | "lost";

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
  showMenu: () => void;
  startGame: () => void;
  pause: () => void;
  resume: () => void;
  returnToMenu: () => void;
  restart: () => void;
  setWeapon: (weapon: WeaponId) => void;
  cycleWeapon: (direction: 1 | -1) => void;
  spendRound: (weapon: WeaponId) => boolean;
  reload: () => void;
  spendGrenade: () => boolean;
  damagePlayer: (amount: number) => void;
  eliminate: (id: string) => void;
  setSensitivity: (value: number) => void;
  setScoped: (value: boolean) => void;
  setPlayerPosition: (value: [number, number, number]) => void;
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
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: "story",
  runId: 0,
  ...freshRun(),
  sensitivity: 0.85,

  showMenu: () => set({ screen: "menu", scoped: false }),

  startGame: () =>
    set((state) => ({
      screen: "playing",
      runId: state.runId + 1,
      ...freshRun(),
    })),

  pause: () => {
    if (get().screen === "playing") set({ screen: "paused", scoped: false });
  },

  resume: () => {
    if (get().screen === "paused") set({ screen: "playing" });
  },

  returnToMenu: () => set({ screen: "menu", scoped: false }),

  restart: () =>
    set((state) => ({
      screen: "playing",
      runId: state.runId + 1,
      ...freshRun(),
    })),

  setWeapon: (weapon) => set({ weapon, scoped: false }),

  cycleWeapon: (direction) => {
    const current = weaponOrder.indexOf(get().weapon);
    const next = (current + direction + weaponOrder.length) % weaponOrder.length;
    set({ weapon: weaponOrder[next], scoped: false });
  },

  spendRound: (weapon) => {
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
    const weapon = get().weapon;
    const current = get().ammo[weapon];
    const needed = WEAPONS[weapon].magazine - current.mag;
    const moved = Math.min(needed, current.reserve);
    if (moved <= 0) return;

    set((state) => ({
      ammo: {
        ...state.ammo,
        [weapon]: {
          mag: current.mag + moved,
          reserve: current.reserve - moved,
        },
      },
    }));
  },

  spendGrenade: () => {
    if (get().grenades <= 0) return false;
    set((state) => ({ grenades: state.grenades - 1 }));
    return true;
  },

  damagePlayer: (amount) => {
    const next = Math.max(0, get().hp - amount);
    set({ hp: next, ...(next === 0 ? { screen: "lost", scoped: false } : {}) });
  },

  eliminate: (id) => {
    if (get().eliminated.includes(id)) return;
    const eliminated = [...get().eliminated, id];
    set({
      eliminated,
      ...(eliminated.length >= TARGET_COUNT
        ? { screen: "won" as const, scoped: false }
        : {}),
    });
  },

  setSensitivity: (sensitivity) => set({ sensitivity }),
  setScoped: (scoped) => set({ scoped }),
  setPlayerPosition: (playerPosition) => set({ playerPosition }),
}));
