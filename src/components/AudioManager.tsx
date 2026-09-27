import { useCallback, useEffect, useRef } from "react";
import { useGameStore, type GameScreen } from "../game/store";
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

const reloadGain: Record<WeaponId, number> = {
  sniper: 0.34,
  rifle: 0.24,
  shotgun: 0.17,
};

function bgmFor(screen: GameScreen) {
  return ["playing", "paused"].includes(screen) ? A.gameBgm : A.introBgm;
}

export function AudioManager() {
  const screen = useGameStore((state) => state.screen);
  const movementMode = useGameStore((state) => state.movementMode);
  const reloading = useGameStore((state) => state.reloading);
  const reloadingWeapon = useGameStore((state) => state.reloadingWeapon);
  const bgmVolume = useGameStore((state) => state.bgmVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);

  const unlocked = useRef(false);
  const bgm = useRef<{ path: string; audio: HTMLAudioElement } | null>(null);
  const bgmFrame = useRef<number | null>(null);
  const stepLoop = useRef<{ path: string; audio: HTMLAudioElement } | null>(null);
  const rifleBurstTimer = useRef<number | null>(null);
  const rifleHoldTimer = useRef<number | null>(null);
  const rifleHeld = useRef(false);
  const rifleBursts = useRef(new Set<HTMLAudioElement>());
  const oneShots = useRef(new Set<HTMLAudioElement>());

  const sfxLevel = useCallback(
    (gain: number) => Math.min(1, Math.max(0, sfxVolume * gain)),
    [sfxVolume],
  );

  const bgmLevel = useCallback(
    () => Math.min(1, Math.max(0, bgmVolume * 0.56)),
    [bgmVolume],
  );

  const playOne = useCallback(
    (path: string, gain = 0.5) => {
      if (!unlocked.current) return;
      const audio = new Audio(path);
      audio.volume = sfxLevel(gain);
      oneShots.current.add(audio);
      const cleanup = () => oneShots.current.delete(audio);
      audio.addEventListener("ended", cleanup, { once: true });
      audio.addEventListener("error", cleanup, { once: true });
      void audio.play().catch(cleanup);
    },
    [sfxLevel],
  );

  const fadeCurrentBgmIn = useCallback(() => {
    const current = bgm.current?.audio;
    if (!current) return;

    if (bgmFrame.current !== null) cancelAnimationFrame(bgmFrame.current);
    const started = performance.now();
    const target = bgmLevel();
    current.volume = Math.min(current.volume, target);

    const step = (now: number) => {
      const t = Math.min(1, (now - started) / 650);
      current.volume = target * t;
      if (t < 1) bgmFrame.current = requestAnimationFrame(step);
      else bgmFrame.current = null;
    };

    bgmFrame.current = requestAnimationFrame(step);
  }, [bgmLevel]);

  const switchBgm = useCallback(
    (nextPath: string) => {
      if (bgm.current?.path === nextPath) {
        const current = bgm.current.audio;
        current.volume = bgmLevel();
        if (current.paused) {
          void current.play().then(fadeCurrentBgmIn).catch(() => undefined);
        }
        return;
      }

      if (bgmFrame.current !== null) {
        cancelAnimationFrame(bgmFrame.current);
        bgmFrame.current = null;
      }

      const old = bgm.current?.audio ?? null;
      const next = new Audio(nextPath);
      next.loop = true;
      next.preload = "auto";
      next.volume = 0;
      bgm.current = { path: nextPath, audio: next };

      const startFade = () => {
        const duration = 850;
        const started = performance.now();
        const oldStart = old?.volume ?? 0;
        const target = bgmLevel();

        const step = (now: number) => {
          const t = Math.min(1, (now - started) / duration);
          next.volume = target * t;
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
      };

      // Best-effort autoplay for the opening comic. Browsers that allow it start
      // immediately; browsers that block audible autoplay retry on first input.
      void next.play().then(startFade).catch(() => undefined);
    },
    [bgmLevel, fadeCurrentBgmIn],
  );

  const stopRifleBurst = useCallback(() => {
    rifleHeld.current = false;

    if (rifleHoldTimer.current !== null) {
      window.clearTimeout(rifleHoldTimer.current);
      rifleHoldTimer.current = null;
    }

    if (rifleBurstTimer.current !== null) {
      window.clearTimeout(rifleBurstTimer.current);
      rifleBurstTimer.current = null;
    }

    rifleBursts.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    rifleBursts.current.clear();
  }, []);

  const startSmoothRifleBurst = useCallback(() => {
    const spawnBurst = () => {
      if (!rifleHeld.current || !unlocked.current) return;

      const audio = new Audio(A.rifleBurst);
      audio.preload = "auto";
      audio.volume = sfxLevel(0.22);
      rifleBursts.current.add(audio);

      const scheduleNext = () => {
        if (!rifleHeld.current) return;
        const durationMs = Number.isFinite(audio.duration)
          ? audio.duration * 1000
          : 300;
        rifleBurstTimer.current = window.setTimeout(
          spawnBurst,
          Math.max(130, durationMs - 55),
        );
      };

      if (audio.readyState >= 1) scheduleNext();
      else audio.addEventListener("loadedmetadata", scheduleNext, { once: true });

      const cleanup = () => rifleBursts.current.delete(audio);
      audio.addEventListener("ended", cleanup, { once: true });
      audio.addEventListener("error", cleanup, { once: true });
      void audio.play().catch(cleanup);
    };

    spawnBurst();
  }, [sfxLevel]);

  useEffect(() => {
    const unlock = () => {
      if (unlocked.current) return;
      unlocked.current = true;

      const state = useGameStore.getState();
      const wanted = bgmFor(state.screen);

      if (!bgm.current || bgm.current.path !== wanted) {
        switchBgm(wanted);
      } else {
        const current = bgm.current.audio;
        current.volume = 0;
        void current.play().then(fadeCurrentBgmIn).catch(() => undefined);
      }

      if (state.screen === "playing") {
        playOne(cocking[state.weapon], 0.3);
      }
    };

    // Attempt the menu/comic BGM immediately. If autoplay is blocked the first
    // pointer/key event above resumes the exact same track.
    switchBgm(bgmFor(useGameStore.getState().screen));

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [fadeCurrentBgmIn, playOne, switchBgm]);

  useEffect(() => {
    switchBgm(bgmFor(screen));
  }, [screen, switchBgm]);

  useEffect(() => {
    if (bgm.current) bgm.current.audio.volume = bgmLevel();
  }, [bgmLevel, bgmVolume]);

  useEffect(() => {
    if (!reloading || !reloadingWeapon) return;
    playOne(reloads[reloadingWeapon], reloadGain[reloadingWeapon]);
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

    if (stepLoop.current?.path === wanted) {
      if (stepLoop.current) {
        stepLoop.current.audio.volume = sfxLevel(
          movementMode === "run" ? 0.24 : 0.2,
        );
      }
      return;
    }

    if (stepLoop.current) {
      stepLoop.current.audio.pause();
      stepLoop.current.audio.currentTime = 0;
      stepLoop.current = null;
    }

    if (!wanted || !unlocked.current) return;

    const audio = new Audio(wanted);
    audio.loop = true;
    audio.volume = sfxLevel(movementMode === "run" ? 0.24 : 0.2);
    stepLoop.current = { path: wanted, audio };
    void audio.play().catch(() => undefined);
  }, [movementMode, screen, sfxLevel, sfxVolume]);

  useEffect(() => {
    if (screen === "playing" && movementMode === "slide") {
      playOne(A.slide, 0.36);
    }
  }, [movementMode, playOne, screen]);

  useEffect(() => {
    const weaponSelected = (event: Event) => {
      const selected = (event as CustomEvent<{ weapon: WeaponId }>).detail.weapon;
      if (useGameStore.getState().screen === "playing") {
        playOne(cocking[selected], 0.3);
      }
    };

    const weaponFire = (event: Event) => {
      const fired = (event as CustomEvent<{ weapon: WeaponId }>).detail.weapon;
      if (fired === "sniper") playOne(A.sniperShoot, 0.42);
      if (fired === "shotgun") playOne(A.shotgunShoot, 0.2);
    };

    const rifleDown = () => {
      if (!unlocked.current || rifleHeld.current) return;
      rifleHeld.current = true;
      playOne(A.rifleOne, 0.18);

      rifleHoldTimer.current = window.setTimeout(() => {
        if (!rifleHeld.current || !unlocked.current) return;
        startSmoothRifleBurst();
      }, 185);
    };

    const rifleUp = () => stopRifleBurst();
    const grenadeCock = () => playOne(A.grenadeCock, 0.34);
    const grenadeExplode = () => playOne(A.grenadeExplode, 0.4);
    const playerDamage = () => playOne(A.playerDamage, 0.24);
    const landing = () => playOne(A.land, 0.3);

    const pickup = (event: Event) => {
      const kind = (event as CustomEvent<{ kind: "grenade" | "speed" }>).detail.kind;
      playOne(kind === "speed" ? A.speed : A.pickup, kind === "speed" ? 0.38 : 0.32);
    };

    const killed = (event: Event) => {
      const count = (event as CustomEvent<{ count: number }>).detail.count;
      playOne(A.kills[Math.min(count, 5) - 1], 0.4);
    };

    window.addEventListener("weapon-selected", weaponSelected as EventListener);
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
      stopRifleBurst();
      window.removeEventListener("weapon-selected", weaponSelected as EventListener);
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
  }, [playOne, startSmoothRifleBurst, stopRifleBurst]);

  useEffect(() => {
    if (screen !== "playing") stopRifleBurst();
  }, [screen, stopRifleBurst]);

  useEffect(
    () => () => {
      if (bgmFrame.current !== null) cancelAnimationFrame(bgmFrame.current);
      bgm.current?.audio.pause();
      stepLoop.current?.audio.pause();
      stopRifleBurst();
      oneShots.current.forEach((audio) => audio.pause());
    },
    [stopRifleBurst],
  );

  return null;
}
