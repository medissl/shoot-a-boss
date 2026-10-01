import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { CombatSystem } from "./CombatSystem";
import { Dummy } from "./Dummy";
import { HUD } from "./HUD";
import { LevelArena } from "./LevelArena";
import { MenuOverlay } from "./MenuOverlay";
import { PaintSystem } from "./PaintSystem";
import { PaperGrenadeSystem } from "./PaperGrenadeSystem";
import { PaperworkMonster } from "./PaperworkMonster";
import { PenMonster } from "./PenMonster";
import { PickupSystem } from "./PickupSystem";
import { PlayerController } from "./PlayerController";
import { SurfaceDamageSystem } from "./SurfaceDamageSystem";
import { PaperDustStorm } from "./PaperDustStorm";
import { JungleThorns } from "./JungleThorns";
import { ExtraMonster } from "./ExtraMonsters";
import { CombatAura } from "./CombatAura";
import { MagicSystem } from "./MagicSystem";
import { RoundResult } from "./RoundResult";
import { MobileControls } from "./MobileControls";
import { ControlsPopup } from "./ControlsList";
import { WeaponView } from "./WeaponView";
import {
  getEnemySpawnPool,
  getEnemyTuning,
  getLevelDefinition,
} from "../game/levels";
import { useGameStore } from "../game/store";
import { setAttackPhase } from "../game/attackDirector";
import { useTouchMode } from "../game/touch";

export function GameCanvas() {
  const touch = useTouchMode();
  const currentLevel = useGameStore((state) => state.currentLevel);
  const ngPlusCycle = useGameStore((state) => state.ngPlusCycle);
  const targetCount = useGameStore((state) => state.targetCount);
  const runId = useGameStore((state) => state.runId);
  const eliminated = useGameStore((state) => state.eliminated.length);
  const screen = useGameStore((state) => state.screen);
  const enemyPositions = useGameStore((state) => state.enemyPositions);
  const eventKind = currentLevel === 4 ? "PRIORITY DEADLINE" : currentLevel === 8 ? "PAPER JAM" : currentLevel === 9 ? "OVERTIME" : null;
  const [eventSeconds, setEventSeconds] = useState<number | null>(null);
  const [eventResult, setEventResult] = useState<string | null>(null);
  const [seals, setSeals] = useState<string[]>([]);
  const [eventTarget, setEventTarget] = useState<string | null>(null);
  const [killsAtStart, setKillsAtStart] = useState(0);
  const resolved = useRef(false);
  const grantDreamCache = useGameStore((state) => state.grantDreamCache);
  const setMarkedTarget = useGameStore((state) => state.setEventTarget);
  const suppressHazard = useGameStore((state) => state.suppressHazard);
  const resolve = (success: boolean) => {
    if (resolved.current) return;
    resolved.current = true;
    setEventResult(success ? "COMPLETE · DREAM CACHE" : "EVENT EXPIRED");
    setMarkedTarget(null);
    if (success) { grantDreamCache(); if (eventKind === "PAPER JAM") suppressHazard(20000); }
  };
  useEffect(() => {
    if (!eventKind || eliminated < 2 || eventSeconds !== null || resolved.current || screen !== "playing") return;
    const candidate = Object.keys(enemyPositions).find(id => id.startsWith("target-") && !useGameStore.getState().eliminated.includes(id));
    if (eventKind === "PRIORITY DEADLINE" && !candidate) return;
    const timer = window.setTimeout(() => {
      if (eventKind === "PRIORITY DEADLINE" && candidate) { setEventTarget(candidate); setMarkedTarget(candidate); }
      setKillsAtStart(eliminated);
      setEventSeconds(eventKind === "OVERTIME" ? 20 : eventKind === "PAPER JAM" ? 30 : 25);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [eventKind, eliminated, eventSeconds, enemyPositions, screen, setMarkedTarget]);
  const eventStarted = eventSeconds !== null;
  useEffect(() => {
    if (!eventStarted || eventResult) return;
    const timer = window.setInterval(() => {
      if (useGameStore.getState().screen === "playing") setEventSeconds(time => time === null ? null : Math.max(0, time - .25));
    }, 250);
    return () => window.clearInterval(timer);
  }, [eventStarted, eventResult]);
  useEffect(() => {
    if (eventSeconds === null || eventResult) return;
    if (eventKind === "PRIORITY DEADLINE" && eventTarget && useGameStore.getState().eliminated.includes(eventTarget)) resolve(true);
    else if (eventKind === "PAPER JAM" && seals.length >= 3) resolve(true);
    else if (eventKind === "OVERTIME" && (eventSeconds === 0 || eliminated - killsAtStart >= 3)) resolve(true);
    else if (eventSeconds === 0 || screen === "stageClear") resolve(false);
  });
  useEffect(() => {
    if (!eventResult) return;
    const timer = window.setTimeout(() => setEventSeconds(null), 3200);
    return () => window.clearTimeout(timer);
  }, [eventResult]);
  useEffect(() => {
    const onProp = (event: Event) => {
      const id = (event as CustomEvent<{ id: string }>).detail.id;
      if (!id.startsWith("dream-seal-") || eventSeconds === null || resolved.current) return;
      setSeals(ids => ids.includes(id) ? ids : [...ids, id]);
    };
    window.addEventListener("prop-shot", onProp);
    return () => window.removeEventListener("prop-shot", onProp);
  }, [eventSeconds]);
  const definition = getLevelDefinition(currentLevel);
  const enemy = getEnemyTuning(currentLevel, ngPlusCycle);
  const spawnPool = useMemo(() => getEnemySpawnPool(currentLevel, runId, ngPlusCycle), [currentLevel, runId, ngPlusCycle]);
  const bossSpawns = spawnPool.slice(0, enemy.bosses);
  const paperSpawns = spawnPool.slice(
    enemy.bosses,
    enemy.bosses + enemy.paperwork,
  );
  const penSpawns = spawnPool.slice(
    enemy.bosses + enemy.paperwork,
    enemy.bosses + enemy.paperwork + enemy.pens,
  );
  const extraSpawns = spawnPool.slice(enemy.bosses + enemy.paperwork + enemy.pens);
  const roster = [
    ...bossSpawns.map((spawn, index) => ({ kind: "boss" as const, spawn, index })),
    ...paperSpawns.map((spawn, index) => ({ kind: "paper" as const, spawn, index })),
    ...penSpawns.map((spawn, index) => ({ kind: "pen" as const, spawn, index })),
    ...extraSpawns.slice(0, enemy.flying ?? 0).map((spawn, index) => ({ kind: "fly" as const, spawn, index })),
    ...extraSpawns.slice(enemy.flying ?? 0, (enemy.flying ?? 0) + (enemy.statues ?? 0)).map((spawn, index) => ({ kind: "statue" as const, spawn, index })),
  ].sort((a, b) => a.index - b.index || ["boss", "paper", "pen", "fly", "statue"].indexOf(a.kind) - ["boss", "paper", "pen", "fly", "statue"].indexOf(b.kind));
  const gemExtras = definition.theme === "gems" ? 3 : 0;
  const remainingRatio = (targetCount - eliminated) / Math.max(1, targetCount);
  const intensity = remainingRatio > .65 ? "OPENING" : remainingRatio > .30 ? "SURGE" : "FINAL PUSH";
  const activeCap = Math.min(12, Math.max(4, 5 + Math.floor(currentLevel * .7) + (intensity === "FINAL PUSH" ? 2 : intensity === "SURGE" ? 1 : -1)));
  const [spawnedCount, setSpawnedCount] = useState(() => Math.min(roster.length, Math.max(1, activeCap - gemExtras)));
  const [phaseNotice, setPhaseNotice] = useState("");
  const phaseSeen = useRef("OPENING");
  useEffect(() => {
    setAttackPhase(intensity);
    if (intensity === phaseSeen.current || screen !== "playing") return;
    phaseSeen.current = intensity;
    const message = intensity === "SURGE" ? "DEADLINE SURGE!" : "FINAL PUSH!";
    const show = window.setTimeout(() => { setPhaseNotice(message); window.dispatchEvent(new CustomEvent("intensity-phase", { detail: intensity })); }, 0);
    const hide = window.setTimeout(() => setPhaseNotice(""), 1350);
    return () => { window.clearTimeout(show); window.clearTimeout(hide); };
  }, [intensity, screen]);
  useEffect(() => {
    if (screen !== "playing") return;
    const cadence = intensity === "OPENING" ? 1250 : intensity === "SURGE" ? 950 : 690;
    const timer = window.setInterval(() => setSpawnedCount(count => Math.min(roster.length, Math.max(count, Math.min(roster.length, activeCap + eliminated - gemExtras)), count + 1)), cadence);
    return () => window.clearInterval(timer);
  }, [activeCap, eliminated, gemExtras, intensity, roster.length, screen]);

  useEffect(() => {
    document.documentElement.dataset.sabLevel = String(currentLevel);
    return () => {
      delete document.documentElement.dataset.sabLevel;
    };
  }, [currentLevel]);

  return (
    <div className={`game-shell game-shell--${definition.theme}`}>
      <Canvas
        shadows={!touch}
        camera={{ fov: 70, near: 0.05, far: 180, position: [0, 2, 12] }}
        dpr={touch ? [1, 1.2] : [1, 1.6]}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -15, 0]}>
            <LevelArena />
            <PlayerController />
            <CombatSystem />
            <CombatAura />
            <MagicSystem />
            <PaintSystem />
            <SurfaceDamageSystem />
            {definition.theme === "playground" && currentLevel > 1 && <PaperDustStorm />}
            {definition.theme === "jungle" && <JungleThorns />}
            <PaperGrenadeSystem />
            <PickupSystem />
            {eventKind === "PAPER JAM" && eventSeconds !== null && !eventResult && [[-6, 2.3, 5], [8, 2.3, -1], [0, 2.3, -15]].map((position, index) =>
              seals.includes(`dream-seal-${index}`) ? null : <mesh key={index} position={position as [number, number, number]} userData={{ propId: `dream-seal-${index}` }}>
                <octahedronGeometry args={[.85, 0]} /><meshBasicMaterial color="#ffc84a" toneMapped={false} />
              </mesh>)}

            {definition.theme === "gems" && <>
              <PaperworkMonster id="paper-inner" spawn={[-29, 0, 7]} />
              <PenMonster id="pen-mid" spawn={[22, 4.7, -4]} />
              <PenMonster id="pen-peak" spawn={[0, 16.7, 21]} />
            </>}
            {roster.slice(0, spawnedCount).map(({ kind, spawn, index }) => {
              const id = `${kind === "boss" ? "target" : kind}-${index}`;
              if (kind === "paper") return <PaperworkMonster key={id} id={id} spawn={spawn} />;
              if (kind === "pen") return <PenMonster key={id} id={id} spawn={spawn} />;
              if (kind === "fly" || kind === "statue") return <ExtraMonster key={id} id={id} spawn={spawn} kind={kind} />;
              const ranged = index % 3 === 1 || index % 5 === 4;
              return <Dummy key={id} id={id} spawn={spawn} archetype={ranged ? "ranged" : "melee"} rangedWeapon={index % 2 === 0 ? "bow" : "handgun"} />;
            })}
          </Physics>
        </Suspense>
      </Canvas>

      <HUD />
      {phaseNotice && <div className={`intensity-announcement intensity-announcement--${intensity.replace(" ", "-").toLowerCase()}`}>{phaseNotice}</div>}
      {eventKind && eventSeconds !== null && <div className="dream-event" role="status"><b>{eventKind}</b><span>{eventResult ?? (eventKind === "PAPER JAM" ? `${seals.length}/3 SEALS · ${Math.ceil(eventSeconds)}S` : eventKind === "OVERTIME" ? `SURVIVE OR ELIMINATE 3 · ${Math.ceil(eventSeconds)}S` : `ELIMINATE MARKED TARGET · ${Math.ceil(eventSeconds)}S`)}</span></div>}
      <MobileControls />
      <WeaponView />
      <MenuOverlay />
      <RoundResult />
      <ControlsPopup />
      {!touch && <div className="click-hint">click to lock mouse · ESC pause</div>}
      {definition.theme === "jungle" && <div className="map-hint">THORNS SPREAD EVERY 30S · E ZIPLINE FORWARD · SHIFT+E BACK</div>}
      {definition.theme === "gems" && <div className="map-hint">LEAVE THE MARKED GEMS BEFORE THEIR LASERS FIRE · CLIMB THE INNER SPIRAL</div>}
      {definition.theme === "hell" && <div className="map-hint">FIVE STONE BRIDGES CROSS THE LAVA · DODGE THE RED CIRCLES EVERY 10 SECONDS</div>}
      <div className="game-fade-in" />
    </div>
  );
}
