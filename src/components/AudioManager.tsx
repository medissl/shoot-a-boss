import { useCallback, useEffect, useRef } from "react";
import { useGameStore, type GameScreen, type MovementMode } from "../game/store";
import type { WeaponId } from "../game/config";

const A = {
  introBgm: "/audio/IntroMenuBGM.mp3",
  gameBgm: "/audio/ShootingBGM.mp3",
  walk: "/audio/Walking.mp3",
  run: "/audio/Running.mp3",
  slide: "/audio/Slide.mp3",
  land: "/audio/Landing.mp3",
  playerDamage: "/audio/PlayerDamage.mp3",
  pickup: "/audio/PickUpThing.mp3",
  speed: "/audio/SpeedBoost.mp3",
  grenadeCock: "/audio/GrenadeCocking.mp3",
  grenadeExplode: "/audio/GrenadeExplode.mp3",
  rifleCock: "/audio/RifleCocking.mp3",
  rifleReload: "/audio/RifleReload.mp3",
  rifleOne: "/audio/RifleShoot1Time.mp3",
  rifleBurst: "/audio/RifleShoot3Times.mp3",
  shotgunCock: "/audio/ShotgunCocking.mp3",
  shotgunReload: "/audio/ShotgunReload.m4a",
  shotgunShoot: "/audio/ShotgunShoot.mp3",
  sniperCock: "/audio/SniperCocking.mp3",
  sniperReload: "/audio/SniperReload.mp3",
  sniperShoot: "/audio/SniperShoot.mp3",
  kills: [
    "/audio/Kill1.mp3",
    "/audio/Kill2.mp3",
    "/audio/Kill3.mp3",
    "/audio/Kill4.mp3",
    "/audio/Kill5.mp3",
  ],
} as const;

const cocking: Record<WeaponId, string> = {
  sniper: A.sniperCock,
  rifle: A.rifleCock,
  shotgun: A.shotgunCock,
};

const reloads: Record<WeaponId, string> = {
  sniper: A.sniperReload,
  rifle: A.rifleReload,
  shotgun: A.shotgunReload,
};

function bgmFor(screen: GameScreen) {
  return ["playing", "paused"].includes(screen) ? A.gameBgm : A.introBgm;
}

export function AudioManager() {
  const screen = useGameStore((state) => state.screen);
  const weapon = useGameStore((state) => state.weapon);
  const runId = useGameStore((state) => state.runId);
  const movementMode = useGameStore((state) => state.movementMode);
  const reloading = useGameStore((state) => state.reloading);
  const reloadingWeapon = useGameStore((state) => state.reloadingWeapon);

  const unlocked = useRef(false);
  const bgm = useRef<{ path: string; audio: HTMLAudioElement } | null>(null);
  const bgmFrame = useRef<number | null>(null);
  const stepLoop = useRef<{ path: string; audio: HTMLAudioElement } | null>(null);
  const rifleLoop = useRef<HTMLAudioElement | null>(null);
  const rifleHoldTimer = useRef<number | null>(null);
  const rifleHeld = useRef(false);
  const oneShots = useRef(new Set<HTMLAudioElement>());

  const playOne = useCallback((path: string, volume = 0.72) => {
    if (!unlocked.current) return;
    const audio = new Audio(path);
    audio.volume = volume;
    oneShots.current.add(audio);
    const cleanup = () => oneShots.current.delete(audio);
    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });
    void audio.play().catch(cleanup);
  }, []);

  const stopRifleLoop = useCallback(() => {
    rifleHeld.current = false;
    if (rifleHoldTimer.current !== null) {
      window.clearTimeout(rifleHoldTimer.current);
      rifleHoldTimer.current = null;
    }
    if (rifleLoop.current) {
      rifleLoop.current.pause();
      rifleLoop.current.currentTime = 0;
      rifleLoop.current = null;
    }
  }, []);

  const switchBgm = useCallback((nextPath: string) => {
    if (!unlocked.current) return;
    if (bgm.current?.path === nextPath) return;

    if (bgmFrame.current !== null) {
      cancelAnimationFrame(bgmFrame.current);
      bgmFrame.current = null;
    }

    const old = bgm.current?.audio ?? null;
    const next = new Audio(nextPath);
    next.loop = true;
    next.volume = 0;
    bgm.current = { path: nextPath, audio: next };
    void next.play().catch(() => undefined);

    const duration = 850;
    const started = performance.now();
    const oldStart = old?.volume ?? 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      next.volume = 0.34 * t;
      if (old) old.volume = oldStart * (1 - t);

      if (t < 1) {
        bgmFrame.current = requestAnimationFrame(step);
      } else {
        bgmFrame.current = null;
        if (old) {
          old.pause();
          old.currentTime = 0;
        }
      }
    };

    bgmFrame.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    const unlock = () => {
      if (unlocked.current) return;
      unlocked.current = true;
      switchBgm(bgmFor(useGameStore.getState().screen));
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [switchBgm]);

  useEffect(() => {
    switchBgm(bgmFor(screen));
  }, [screen, switchBgm]);

  useEffect(() => {
    if (screen !== "playing") return;
    playOne(cocking[weapon], 0.58);
  }, [playOne, runId, screen, weapon]);

  useEffect(() => {
    if (!reloading || !reloadingWeapon) return;
    playOne(reloads[reloadingWeapon], 0.7);
  }, [playOne, reloading, reloadingWeapon]);

  useEffect(() => {
    const wanted: string | null =
      screen !== "playing"
        ? null
        : movementMode === "run"
          ? A.run
          : movementMode === "walk"
            ? A.walk
            : null;

    if (stepLoop.current?.path === wanted) return;

    if (stepLoop.current) {
      stepLoop.current.audio.pause();
      stepLoop.current.audio.currentTime = 0;
      stepLoop.current = null;
    }

    if (!wanted || !unlocked.current) return;

    const audio = new Audio(wanted);
    audio.loop = true;
    audio.volume = movementMode === "run" ? 0.35 : 0.28;
    stepLoop.current = { path: wanted, audio };
    void audio.play().catch(() => undefined);
  }, [movementMode, screen]);

  useEffect(() => {
    if (screen === "playing" && movementMode === "slide") {
      playOne(A.slide, 0.58);
    }
  }, [movementMode, playOne, screen]);

  useEffect(() => {
    const weaponFire = (event: Event) => {
      const fired = (event as CustomEvent<{ weapon: WeaponId }>).detail.weapon;
      if (fired === "sniper") playOne(A.sniperShoot, 0.82);
      if (fired === "shotgun") playOne(A.shotgunShoot, 0.82);
    };

    const rifleDown = () => {
      if (!unlocked.current || rifleHeld.current) return;
      rifleHeld.current = true;
      playOne(A.rifleOne, 0.68);

      rifleHoldTimer.current = window.setTimeout(() => {
        if (!rifleHeld.current || !unlocked.current) return;
        const audio = new Audio(A.rifleBurst);
        audio.loop = true;
        audio.volume = 0.7;
        rifleLoop.current = audio;
        void audio.play().catch(() => undefined);
      }, 165);
    };

    const rifleUp = () => stopRifleLoop();
    const grenadeCock = () => playOne(A.grenadeCock, 0.66);
    const grenadeExplode = () => playOne(A.grenadeExplode, 0.78);
    const playerDamage = () => playOne(A.playerDamage, 0.72);
    const landing = () => playOne(A.land, 0.5);

    const pickup = (event: Event) => {
      const kind = (event as CustomEvent<{ kind: "grenade" | "speed" }>).detail.kind;
      playOne(kind === "speed" ? A.speed : A.pickup, kind === "speed" ? 0.72 : 0.6);
    };

    const killed = (event: Event) => {
      const count = (event as CustomEvent<{ count: number }>).detail.count;
      playOne(A.kills[Math.min(count, 5) - 1], 0.78);
    };

    window.addEventListener("weapon-fired", weaponFire as EventListener);
    window.addEventListener("rifle-trigger-down", rifleDown);
    window.addEventListener("rifle-trigger-up", rifleUp);
    window.addEventListener("grenade-cocked", grenadeCock);
    window.addEventListener("paper-grenade-explode", grenadeExplode);
    window.addEventListener("player-damaged", playerDamage);
    window.addEventListener("player-landed", landing);
    window.addEventListener("pickup-collected", pickup as EventListener);
    window.addEventListener("boss-killed", killed as EventListener);

    return () => {
      stopRifleLoop();
      window.removeEventListener("weapon-fired", weaponFire as EventListener);
      window.removeEventListener("rifle-trigger-down", rifleDown);
      window.removeEventListener("rifle-trigger-up", rifleUp);
      window.removeEventListener("grenade-cocked", grenadeCock);
      window.removeEventListener("paper-grenade-explode", grenadeExplode);
      window.removeEventListener("player-damaged", playerDamage);
      window.removeEventListener("player-landed", landing);
      window.removeEventListener("pickup-collected", pickup as EventListener);
      window.removeEventListener("boss-killed", killed as EventListener);
    };
  }, [playOne, stopRifleLoop]);

  useEffect(() => {
    if (screen !== "playing") stopRifleLoop();
  }, [screen, stopRifleLoop]);

  useEffect(
    () => () => {
      if (bgmFrame.current !== null) cancelAnimationFrame(bgmFrame.current);
      bgm.current?.audio.pause();
      stepLoop.current?.audio.pause();
      rifleLoop.current?.pause();
      oneShots.current.forEach((audio) => audio.pause());
    },
    [],
  );

  return null;
}
