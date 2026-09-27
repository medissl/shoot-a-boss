import { useCallback, useEffect, useRef } from "react";
import { useGameStore, type GameScreen } from "../game/store";
import type { WeaponId } from "../game/config";
import { getLevelDefinition } from "../game/levels";

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

const cocking: Partial<Record<WeaponId, string>> = {
  sniper: A.sniperCock,
  rifle: A.rifleCock,
  shotgun: A.shotgunCock,
};

const reloads: Partial<Record<WeaponId, string>> = {
  sniper: A.sniperReload,
  rifle: A.rifleReload,
  shotgun: A.shotgunReload,
};

const reloadGain: Partial<Record<WeaponId, number>> = {
  sniper: 0.34,
  rifle: 0.24,
  shotgun: 0.17,
};

function bgmFor(screen: GameScreen, level: number) {
  if (!["playing", "paused", "reward", "won", "upgrade", "lost"].includes(screen)) return A.introBgm;
  const theme = getLevelDefinition(level).theme;
  return {
    playground: "/audio/ThePlaygroundBGM.mp3",
    jungle: "/audio/JungleIsleBGM.mp3",
    gems: "/audio/GemstoneIslandBGM.mp3",
    hell: "/audio/TheHellBGM.mp3",
  }[theme];
}

export function AudioManager() {
  const screen = useGameStore((state) => state.screen);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const movementMode = useGameStore((state) => state.movementMode);
  const reloading = useGameStore((state) => state.reloading);
  const reloadingWeapon = useGameStore((state) => state.reloadingWeapon);
  const bgmVolume = useGameStore((state) => state.bgmVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);

  const unlocked = useRef(false);

  // One persistent music player only. Keeping a single HTMLAudioElement means
  // IntroMenuBGM and ShootingBGM can never overlap, even during rapid state changes.
  const bgmAudio = useRef<HTMLAudioElement | null>(null);
  const bgmPath = useRef<string | null>(null);
  const bgmFrame = useRef<number | null>(null);
  const bgmTransition = useRef(0);

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

  const ensureBgmAudio = useCallback(() => {
    if (!bgmAudio.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0;
      bgmAudio.current = audio;
    }
    return bgmAudio.current;
  }, []);

  const cancelBgmFrame = useCallback(() => {
    if (bgmFrame.current !== null) {
      cancelAnimationFrame(bgmFrame.current);
      bgmFrame.current = null;
    }
  }, []);

  const rampVolume = useCallback(
    (
      audio: HTMLAudioElement,
      from: number,
      to: number,
      duration: number,
      token: number,
      done?: () => void,
    ) => {
      cancelBgmFrame();
      const started = performance.now();

      const step = (now: number) => {
        if (token !== bgmTransition.current) return;

        const t = Math.min(1, (now - started) / duration);
        audio.volume = from + (to - from) * t;

        if (t < 1) {
          bgmFrame.current = requestAnimationFrame(step);
        } else {
          bgmFrame.current = null;
          done?.();
        }
      };

      bgmFrame.current = requestAnimationFrame(step);
    },
    [cancelBgmFrame],
  );

  const requestBgm = useCallback(
    (nextPath: string) => {
      const audio = ensureBgmAudio();
      const token = ++bgmTransition.current;
      const target = bgmLevel();

      if (bgmPath.current === nextPath) {
        cancelBgmFrame();

        const startCurrent = () => {
          if (token !== bgmTransition.current) return;
          rampVolume(audio, audio.volume, target, 320, token);
        };

        if (audio.paused) {
          void audio.play().then(startCurrent).catch(() => undefined);
        } else {
          startCurrent();
        }
        return;
      }

      const switchTrack = () => {
        if (token !== bgmTransition.current) return;

        audio.pause();
        audio.currentTime = 0;
        audio.src = nextPath;
        audio.load();
        bgmPath.current = nextPath;
        audio.volume = 0;

        const startNew = () => {
          if (token !== bgmTransition.current) return;
          rampVolume(audio, 0, target, 520, token);
        };

        // We still attempt playback during the opening comic. Browsers that
        // block autoplay leave the track loaded; first user input retries it.
        void audio.play().then(startNew).catch(() => undefined);
      };

      // Change src and call play immediately. Deferring the call behind a fade
      // loses the browser's user gesture when a stage is selected.
      switchTrack();
    },
    [bgmLevel, cancelBgmFrame, ensureBgmAudio, rampVolume],
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
      audio.volume = sfxLevel(0.2);
      rifleBursts.current.add(audio);

      const scheduleNext = () => {
        if (!rifleHeld.current) return;
        const durationMs = Number.isFinite(audio.duration)
          ? audio.duration * 1000
          : 300;

        // Small overlap hides the encoded silence at the clip boundary.
        rifleBurstTimer.current = window.setTimeout(
          spawnBurst,
          Math.max(110, durationMs - 90),
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
      requestBgm(bgmFor(state.screen, state.currentLevel));

      if (state.screen === "playing") {
        const path = cocking[state.weapon];
        if (path) playOne(path, 0.3);
      }
    };

    // Load/attempt the comic/menu track immediately. If autoplay is blocked,
    // the first pointer/key input restarts this exact one-player state machine.
    requestBgm(bgmFor(useGameStore.getState().screen, useGameStore.getState().currentLevel));

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [playOne, requestBgm]);

  useEffect(() => {
    requestBgm(bgmFor(screen, currentLevel));
  }, [requestBgm, screen, currentLevel]);

  useEffect(() => {
    const retry = () => {
      const audio = bgmAudio.current;
      if (audio?.paused && bgmPath.current) void audio.play().catch(() => undefined);
    };
    window.addEventListener("pointerdown", retry);
    window.addEventListener("keydown", retry);
    const stageSelected = () => {
      const state = useGameStore.getState();
      requestBgm(bgmFor(state.screen, state.currentLevel));
    };
    window.addEventListener("stage-selected", stageSelected);
    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      window.removeEventListener("stage-selected", stageSelected);
    };
  }, [requestBgm]);

  useEffect(() => {
    const audio = bgmAudio.current;
    if (!audio || audio.paused) return;
    audio.volume = bgmLevel();
  }, [bgmLevel, bgmVolume]);

  useEffect(() => {
    if (!reloading || !reloadingWeapon) return;
    const path = reloads[reloadingWeapon];
    if (!path) return;
    playOne(path, reloadGain[reloadingWeapon] ?? 0.25);
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
      stepLoop.current.audio.volume = sfxLevel(
        movementMode === "run" ? 0.24 : 0.2,
      );
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
        const path = cocking[selected];
        if (path) playOne(path, 0.3);
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
      playOne(
        kind === "speed" ? A.speed : A.pickup,
        kind === "speed" ? 0.38 : 0.32,
      );
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
      cancelBgmFrame();
      bgmTransition.current += 1;
      if (bgmAudio.current) {
        bgmAudio.current.pause();
        bgmAudio.current.src = "";
      }
      stepLoop.current?.audio.pause();
      stopRifleBurst();
      oneShots.current.forEach((audio) => audio.pause());
    },
    [cancelBgmFrame, stopRifleBurst],
  );

  return null;
}
