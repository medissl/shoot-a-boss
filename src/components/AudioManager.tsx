import { useCallback, useEffect, useRef } from "react";
import { useGameStore, type GameScreen, type MagicType } from "../game/store";
import type { WeaponId } from "../game/config";
import { getLevelDefinition } from "../game/levels";
import { playWorldSound, resumeWorldSound, type WorldSound } from "../game/worldSound";
import { playSkinSound } from "../game/skinSound";

const A = {
  introBgm: "/audio/IntroMenuBGM.mp3",
  gameBgm: "/audio/ShootingBGM.mp3",
  walk: "/audio/Walking.mp3",
  run: "/audio/Running.mp3",
  slide: "/audio/Slide.mp3",
  land: "/audio/Landing.mp3",
  playerDamage: "/audio/PlayerDamage.mp3",
  uiOpen: "/audio/OpeningStuffSFX.m4a",
  uiSelect: "/audio/SelectingSFX.m4a",
  uiConfirm: "/audio/ConfirmingSFX.m4a",
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
  magic: {fire:"/audio/FireBall.mp3",crystal:"/audio/CrystalBall.mp3",ice:"/audio/IceBall.mp3",water:"/audio/WaterBall.mp3",thunder:"/audio/ThunderBall.mp3"},
  reveal:"/audio/RevealSFX.mp3", crateDrop:"/audio/CaseDrop.mp3",crateUnlock:"/audio/CaseLockOpen.mp3",crateSpin:"/audio/CaseSpinRoulette.mp3",crateReveal:"/audio/CaseRevealItem.mp3",
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
  sniper: 0.9,
  rifle: 0.8,
  shotgun: 0.75,
};

function bgmFor(screen: GameScreen, level: number) {
  if (!["playing", "paused", "stageClear", "won", "upgrade", "lost"].includes(screen)) return A.introBgm;
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
  const menuAudio = useRef<{ open: HTMLAudioElement; select: HTMLAudioElement; confirm: HTMLAudioElement } | null>(null);
  const lastConfirmAt = useRef(-Infinity);
  const openTimer = useRef<number | null>(null);

  // One persistent music player only. Keeping a single HTMLAudioElement means
  // IntroMenuBGM and ShootingBGM can never overlap, even during rapid state changes.
  const bgmAudio = useRef<HTMLAudioElement | null>(null);
  const bgmPath = useRef<string | null>(null);

  const stepLoop = useRef<{ path: string; audio: HTMLAudioElement } | null>(null);
  const rifleBurstTimer = useRef<number | null>(null);
  const rifleHoldTimer = useRef<number | null>(null);
  const rifleHeld = useRef(false);
  const rifleBursts = useRef(new Set<HTMLAudioElement>());
  const oneShots = useRef(new Set<HTMLAudioElement>());
  const boostedContext = useRef<AudioContext | null>(null);

  const sfxLevel = useCallback(
    (gain: number) => Math.min(1, Math.max(0, sfxVolume * gain)),
    [sfxVolume],
  );

  const bgmLevel = useCallback(
    () => Math.min(1, Math.max(0, bgmVolume * 0.56)),
    [bgmVolume],
  );

  const playOne = useCallback(
    (path: string, gain = 0.5, boost = 1) => {
      if (!unlocked.current) return;
      const audio = new Audio(path);
      audio.volume = sfxLevel(gain);
      let disconnect: (() => void) | undefined;
      if (boost > 1 && typeof AudioContext !== "undefined") {
        try {
          const context = boostedContext.current ?? new AudioContext();
          boostedContext.current = context;
          const source = context.createMediaElementSource(audio);
          const amplifier = context.createGain();
          const limiter = context.createDynamicsCompressor();
          amplifier.gain.value = boost;
          limiter.threshold.value = -7;
          limiter.ratio.value = 6;
          limiter.attack.value = 0.003;
          source.connect(amplifier).connect(limiter).connect(context.destination);
          disconnect = () => { source.disconnect(); amplifier.disconnect(); limiter.disconnect(); };
          void context.resume().catch(() => undefined);
        } catch { /* Media audio still works if Web Audio is unavailable. */ }
      }
      oneShots.current.add(audio);
      const cleanup = () => { oneShots.current.delete(audio); disconnect?.(); };
      audio.addEventListener("ended", cleanup, { once: true });
      audio.addEventListener("error", cleanup, { once: true });
      void audio.play().catch(cleanup);
    },
    [sfxLevel],
  );

  const skinAccent = useCallback((weapon:WeaponId,action:"fire"|"equip"|"reload") => {
    if (!unlocked.current || useGameStore.getState().screen!=="playing" || typeof AudioContext==="undefined")return;
    const skin=useGameStore.getState().equippedSkins[weapon];
    if(skin==="default")return;
    const context=boostedContext.current??new AudioContext();boostedContext.current=context;
    void context.resume().catch(()=>undefined);
    playSkinSound(context,skin,action,sfxLevel(.85));
  },[sfxLevel]);

  const playMenuSound = useCallback((kind: "open" | "select" | "confirm") => {
    if (!unlocked.current || !menuAudio.current) return;
    const audio = menuAudio.current[kind];
    audio.pause();
    audio.volume = sfxLevel(kind === "select" ? 0.66 : kind === "confirm" ? 0.9 : 0.58);
    audio.playbackRate = kind === "confirm" ? 1.12 : 1;
    // The supplied recordings begin with a short silent lead-in.
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) audio.currentTime = kind === "open" ? 0.11 : 0.045;
    else audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [sfxLevel]);

  useEffect(() => {
    const audio = {
      open: new Audio(A.uiOpen),
      select: new Audio(A.uiSelect),
      confirm: new Audio(A.uiConfirm),
    };
    Object.values(audio).forEach((clip) => { clip.preload = "auto"; clip.load(); });
    menuAudio.current = audio;
    return () => {
      Object.values(audio).forEach((clip) => clip.pause());
      menuAudio.current = null;
    };
  }, []);

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

  const requestBgm = useCallback((nextPath: string) => {
    const audio = ensureBgmAudio();
    // Switch the source inside the selecting click handler, while the browser
    // still considers playback to be initiated by the player's gesture.
    if (bgmPath.current !== nextPath) {
      audio.pause();
      audio.src = nextPath;
      bgmPath.current = nextPath;
    }
    audio.volume = bgmLevel();
    if (audio.paused) void audio.play().catch(() => undefined);
  }, [bgmLevel, ensureBgmAudio]);

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
      audio.volume = sfxLevel(0.8);
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
      resumeWorldSound();

      const state = useGameStore.getState();
      requestBgm(bgmFor(state.screen, state.currentLevel));

      if (state.screen === "playing") {
        const path = cocking[state.weapon];
        if (path) playOne(path, 0.72);
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
    let hovered: Element | null = null;
    const recentHover = new WeakMap<Element, number>();
    const sceneOpen = () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
      const delay = Math.max(0, 550 - (performance.now() - lastConfirmAt.current));
      openTimer.current = window.setTimeout(() => {
        playMenuSound("open");
        openTimer.current = null;
      }, delay);
    };
    const confirm = () => {
      const now = performance.now();
      if (now - lastConfirmAt.current < 110) return;
      lastConfirmAt.current = now;
      menuAudio.current?.select.pause();
      playMenuSound("confirm");
    };
    const click = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const choice = target.closest("button, a, [role='button']");
      if (!choice || choice.matches(":disabled") || !choice.closest(".main-menu-shell, .gear-scene, .encyclopedia-scene, .upgrade-shell, .pause-layer, .round-result, .story-shell")) return;
      confirm();
    };
    const hover = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const choice = target.closest("button, a, [role='button']");
      if (!choice || choice === hovered || choice.matches(":disabled")) return;
      hovered = choice;
      const now = performance.now();
      if (now - (recentHover.get(choice) ?? -Infinity) < 170) return;
      recentHover.set(choice, now);
      playMenuSound("select");
    };
    const leave = (event: PointerEvent) => {
      if (hovered && !hovered.contains(event.relatedTarget as Node | null)) hovered = null;
    };
    window.addEventListener("ui-scene-open", sceneOpen);
    window.addEventListener("ui-confirm", confirm);
    document.addEventListener("click", click, true);
    document.addEventListener("pointerover", hover);
    document.addEventListener("pointerout", leave);
    return () => {
      window.removeEventListener("ui-scene-open", sceneOpen);
      window.removeEventListener("ui-confirm", confirm);
      document.removeEventListener("click", click, true);
      document.removeEventListener("pointerover", hover);
      document.removeEventListener("pointerout", leave);
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    };
  }, [playMenuSound]);

  useEffect(() => {
    const retry = () => {
      const audio = bgmAudio.current;
      if (audio?.paused && bgmPath.current) void audio.play().catch(() => undefined);
    };
    window.addEventListener("pointerdown", retry);
    window.addEventListener("keydown", retry);
    window.addEventListener("focus", retry);
    document.addEventListener("visibilitychange", retry);
    const stageSelected = () => {
      const state = useGameStore.getState();
      requestBgm(bgmFor(state.screen, state.currentLevel));
    };
    window.addEventListener("stage-selected", stageSelected);
    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      window.removeEventListener("focus", retry);
      document.removeEventListener("visibilitychange", retry);
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
    skinAccent(reloadingWeapon,"reload");
  }, [playOne, reloading, reloadingWeapon, skinAccent]);

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
        if (path) playOne(path, 0.72);
        skinAccent(selected,"equip");
      }
    };

    const weaponFire = (event: Event) => {
      const fired = (event as CustomEvent<{ weapon: WeaponId }>).detail.weapon;
      if (fired === "sniper") playOne(A.sniperShoot, 0.95, 1.6);
      if (fired === "shotgun") playOne(A.shotgunShoot, 0.85);
      skinAccent(fired,"fire");
    };

    const rifleDown = () => {
      if (!unlocked.current || rifleHeld.current) return;
      rifleHeld.current = true;
      playOne(A.rifleOne, 0.75);

      rifleHoldTimer.current = window.setTimeout(() => {
        if (!rifleHeld.current || !unlocked.current) return;
        startSmoothRifleBurst();
      }, 185);
    };

    const rifleUp = () => stopRifleBurst();
    const grenadeCock = () => playOne(A.grenadeCock, 0.75);
    const grenadeExplode = () => playOne(A.grenadeExplode, 1.35);
    const magicCast = (event: Event) => playOne(A.magic[(event as CustomEvent<{kind:MagicType}>).detail.kind], 1);
    const reveal = () => playOne(A.reveal, .85);
    const crateDrop = () => playOne(A.crateDrop, .9, 3.0);
    const crateUnlock = () => playOne(A.crateUnlock, .9, 3.0);
    const crateSpin = () => playOne(A.crateSpin, .85, 2.7);
    const crateReveal = () => playOne(A.crateReveal, 1, 3.2);
    const worldSound = (event: Event) => {
      if (useGameStore.getState().screen !== "playing" || !unlocked.current) return;
      const detail = (event as CustomEvent<{ kind: WorldSound; position?: [number, number, number] }>).detail;
      if (detail?.kind) playWorldSound(detail.kind, useGameStore.getState().sfxVolume, detail.position, useGameStore.getState().playerPosition);
    };
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
    window.addEventListener("magic-cast", magicCast);
    window.addEventListener("scan-started", reveal);
    window.addEventListener("crate-drop", crateDrop);
    window.addEventListener("crate-unlock", crateUnlock);
    window.addEventListener("crate-spin", crateSpin);
    window.addEventListener("crate-reveal", crateReveal);
    window.addEventListener("world-sfx", worldSound);
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
      window.removeEventListener("magic-cast", magicCast);
      window.removeEventListener("scan-started", reveal);
      window.removeEventListener("crate-drop", crateDrop);
      window.removeEventListener("crate-unlock", crateUnlock);
      window.removeEventListener("crate-spin", crateSpin);
      window.removeEventListener("crate-reveal", crateReveal);
      window.removeEventListener("world-sfx", worldSound);
      window.removeEventListener("paper-grenade-explode", grenadeExplode);
      window.removeEventListener("player-damaged", playerDamage);
      window.removeEventListener("player-landed", landing);
      window.removeEventListener("pickup-collected", pickup as EventListener);
      window.removeEventListener("boss-killed", killed as EventListener);
    };
  }, [playOne, skinAccent, startSmoothRifleBurst, stopRifleBurst]);

  useEffect(() => {
    if (screen !== "playing") stopRifleBurst();
  }, [screen, stopRifleBurst]);

  useEffect(
    () => () => {
      if (bgmAudio.current) {
        bgmAudio.current.pause();
        bgmAudio.current.src = "";
      }
      stepLoop.current?.audio.pause();
      stopRifleBurst();
      oneShots.current.forEach((audio) => audio.pause());
    },
    [stopRifleBurst],
  );

  return null;
}
