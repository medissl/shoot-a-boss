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
import { OfficeEnemy } from "./OfficeEnemies";
import { type OfficeKind } from "../game/officeEnemies";
import { activeThreat, fieldCap, spawnCadence } from "../game/encounter";
import { PaperworkDragon } from "./PaperworkDragon";
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
import { getAttackPressure, setAttackPhase, setApprovalPressure } from "../game/attackDirector";
import type { BossHealth } from "../game/bossHud";
import { useTouchMode } from "../game/touch";

function EncounterDebug({ runId, level, activeCap, pending, activeIds }: { runId: number; level: number; activeCap: number; pending: number; activeIds: string[] }) {
  const [pressure, setPressure] = useState({ active: 0, major: 0, cap: 2, hazard: "ACTIVE" });
  useEffect(() => {
    const refresh = () => setPressure({ ...getAttackPressure(runId, level), hazard: useGameStore.getState().hazardSuppressedUntil > performance.now() ? "SUPPRESSED" : "ACTIVE" });
    const timer = window.setInterval(refresh, 300); refresh();
    return () => window.clearInterval(timer);
  }, [runId, level]);
  return <div className="encounter-debug">FIELD {activeIds.length}/{activeCap} · QUEUED {pending} · THREAT {activeThreat(activeIds)} · ATTACK {pressure.active}/{pressure.cap} · MAJOR {pressure.major} · HAZARD {pressure.hazard}</div>;
}

export function GameCanvas() {
  const touch = useTouchMode();
  const currentLevel = useGameStore((state) => state.currentLevel);
  const ngPlusCycle = useGameStore((state) => state.ngPlusCycle);
  const targetCount = useGameStore((state) => state.targetCount);
  const runId = useGameStore((state) => state.runId);
  const eliminated = useGameStore((state) => state.eliminated.length);
  const screen = useGameStore((state) => state.screen);
  const enemyPositions = useGameStore((state) => state.enemyPositions);
  const eventKind = currentLevel === 4 ? "PRIORITY DEADLINE" : currentLevel === 8 ? "PAPER JAM" : currentLevel === 9 ? "OVERTIME" : currentLevel === 12 ? "FINAL APPROVAL" : null;
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
    setEventResult(eventKind === "FINAL APPROVAL" ? success ? "ACCEPTED ✓ · DREAM CACHE" : "REJECTED · JUDGEMENT SWEEP" : success ? "COMPLETE · DREAM CACHE" : "EVENT EXPIRED");
    if (!success && eventKind === "FINAL APPROVAL") window.dispatchEvent(new Event("approval-rejected"));
    window.dispatchEvent(new CustomEvent("world-sfx",{detail:{kind:success?"approvalSuccess":"approvalReject"}}));
    setMarkedTarget(null);
    if (success) { grantDreamCache(); if (eventKind === "PAPER JAM" || eventKind === "FINAL APPROVAL") suppressHazard(18000); }
  };
  useEffect(() => {
    if (!eventKind || eliminated < (eventKind === "FINAL APPROVAL" ? Math.ceil((targetCount-1)*.5) : 2) || eventSeconds !== null || resolved.current || screen !== "playing") return;
    const candidate = Object.keys(enemyPositions).find(id => id.startsWith("target-") && !useGameStore.getState().eliminated.includes(id));
    if (eventKind === "PRIORITY DEADLINE" && !candidate) return;
    const timer = window.setTimeout(() => {
      if (eventKind === "PRIORITY DEADLINE" && candidate) { setEventTarget(candidate); setMarkedTarget(candidate); }
      setKillsAtStart(eliminated);
      setEventSeconds(eventKind === "OVERTIME" ? 20 : eventKind === "FINAL APPROVAL" ? 35 : eventKind === "PAPER JAM" ? 30 : 25);
      if (eventKind === "FINAL APPROVAL") window.dispatchEvent(new CustomEvent("world-sfx",{detail:{kind:"approvalStart"}}));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [eventKind, eliminated, eventSeconds, enemyPositions, screen, setMarkedTarget, targetCount]);
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
    else if ((eventKind === "PAPER JAM" || eventKind === "FINAL APPROVAL") && seals.length >= 3) resolve(true);
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
      if ((!id.startsWith("dream-seal-") && !id.startsWith("approval-seal-")) || eventSeconds === null || resolved.current) return;
      if (id.startsWith("approval-seal-")) window.dispatchEvent(new CustomEvent("world-sfx",{detail:{kind:"approvalStamp"}}));
      setSeals(ids => ids.includes(id) ? ids : [...ids, id]);
    };
    window.addEventListener("prop-shot", onProp);
    return () => window.removeEventListener("prop-shot", onProp);
  }, [eventSeconds]);
  useEffect(() => { setApprovalPressure(eventKind === "FINAL APPROVAL" && eventSeconds !== null && !eventResult); return () => setApprovalPressure(false); },[eventKind,eventSeconds,eventResult]);
  const definition = getLevelDefinition(currentLevel);
  const enemy = getEnemyTuning(currentLevel, ngPlusCycle);
  // Spawn coordinates must stay fixed while the event timer updates the UI.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
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
  let extraOffset = (enemy.flying ?? 0) + (enemy.statues ?? 0);
  const officeRoster = (["sticky", "stapler", "highlighter", "shredder", "clipboard"] as const).flatMap(kind => {
    const count = enemy[kind] ?? 0;
    const entries = extraSpawns.slice(extraOffset, extraOffset + count).map((spawn, index) => ({ kind, spawn, index }));
    extraOffset += count;
    return entries;
  });
  const eliteKind: OfficeKind = currentLevel === 4 ? "hr" : currentLevel === 6 ? "auditor" : "director";
  const eliteRoster = extraSpawns.slice(extraOffset, extraOffset + (enemy.elite ?? 0)).map((spawn, index) => ({ kind: eliteKind, spawn, index }));
  const roster = [
    ...bossSpawns.map((spawn, index) => ({ kind: "boss" as const, spawn, index })),
    ...paperSpawns.map((spawn, index) => ({ kind: "paper" as const, spawn, index })),
    ...penSpawns.map((spawn, index) => ({ kind: "pen" as const, spawn, index })),
    ...extraSpawns.slice(0, enemy.flying ?? 0).map((spawn, index) => ({ kind: "fly" as const, spawn, index })),
    ...extraSpawns.slice(enemy.flying ?? 0, (enemy.flying ?? 0) + (enemy.statues ?? 0)).map((spawn, index) => ({ kind: "statue" as const, spawn, index })),
    ...officeRoster,
    ...eliteRoster,
  ].sort((a, b) => ["hr", "auditor", "director", "boss", "paper", "stapler", "shredder", "pen", "fly", "sticky", "statue", "clipboard", "highlighter"].indexOf(a.kind) - ["hr", "auditor", "director", "boss", "paper", "stapler", "shredder", "pen", "fly", "sticky", "statue", "clipboard", "highlighter"].indexOf(b.kind) || a.index - b.index);
  const gemExtras = definition.theme === "gems" ? 3 : 0;
  const remainingRatio = (targetCount - eliminated) / Math.max(1, targetCount);
  const intensity = remainingRatio > .65 ? "OPENING" : remainingRatio > .30 ? "SURGE" : "FINAL PUSH";
  const activeCap = fieldCap(currentLevel, intensity);
  const [spawnedCount, setSpawnedCount] = useState(() => Math.min(roster.length, Math.max(1, activeCap - gemExtras)));
  const [phaseNotice, setPhaseNotice] = useState("");
  const [dragonArrived, setDragonArrived] = useState(false);
  const [bossHealth, setBossHealth] = useState<BossHealth | null>(null);
  useEffect(() => {
    const onHealth = (event: Event) => {
      const data = (event as CustomEvent<BossHealth | { id: string; clear: true }>).detail;
      setBossHealth(previous => "clear" in data ? previous?.id === data.id ? null : previous : data);
    };
    window.addEventListener("boss-health", onHealth);
    return () => window.removeEventListener("boss-health", onHealth);
  }, []);
  useEffect(() => {
    if (currentLevel !== 12 || eliminated < roster.length || !resolved.current || screen !== "playing" || dragonArrived) return;
    const announce = window.setTimeout(() => setPhaseNotice("FINAL DEADLINE · THE PAPERWORK DRAGON"), 0);
    const arrive = window.setTimeout(() => setDragonArrived(true), 3000);
    return () => { window.clearTimeout(announce); window.clearTimeout(arrive); };
  }, [currentLevel, eliminated, roster.length, screen, dragonArrived, eventResult]);
  useEffect(() => {
    if (!dragonArrived) return;
    const clear = window.setTimeout(() => setPhaseNotice(""), 1400);
    return () => window.clearTimeout(clear);
  }, [dragonArrived]);
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
    const cadence = spawnCadence(intensity);
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

            {eventKind === "FINAL APPROVAL" && eventSeconds !== null && !eventResult && [[-14,3.4,-13],[14,3.4,8],[0,4.2,-22]].map((position,index) => seals.includes(`approval-seal-${index}`) ? null : <group key={index} position={position as [number,number,number]} userData={{propId:`approval-seal-${index}`}}>
              <mesh><planeGeometry args={[2.8,3.4]}/><meshBasicMaterial color="#284a87" side={2}/></mesh>
              <mesh position={[0,0,.035]}><planeGeometry args={[2.56,3.16]}/><meshBasicMaterial color="#fffaf0" side={2}/></mesh>
              <mesh position={[0,.68,.08]}><circleGeometry args={[.65,32]}/><meshBasicMaterial color="#db5465" side={2}/></mesh>
              <mesh position={[0,1.57,.11]}><boxGeometry args={[.8,.24,.05]}/><meshBasicMaterial color="#e4b861"/></mesh>
              <mesh position={[0,-.54,.09]}><planeGeometry args={[1.9,.08]}/><meshBasicMaterial color="#81a0cd" side={2}/></mesh>
            </group>)}
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
              if (kind !== "boss") return <OfficeEnemy key={id} id={id} spawn={spawn} kind={kind} />;
              const ranged = index % 3 === 1 || index % 5 === 4;
              return <Dummy key={id} id={id} spawn={spawn} archetype={ranged ? "ranged" : "melee"} rangedWeapon={index % 2 === 0 ? "bow" : "handgun"} />;
            })}
            {dragonArrived && currentLevel === 12 && <PaperworkDragon />}
          </Physics>
        </Suspense>
      </Canvas>

      <HUD />
      {new URLSearchParams(window.location.search).has("debugBalance") && <EncounterDebug runId={runId} level={currentLevel} activeCap={activeCap} pending={Math.max(0, roster.length - spawnedCount)} activeIds={Object.keys(enemyPositions)} />}
      {bossHealth && <div className="encounter-health" role="status"><b>{bossHealth.name}</b>{bossHealth.detail && <span>{bossHealth.detail}</span>}<div><i style={{ width: `${Math.max(0, bossHealth.health / bossHealth.maxHp * 100)}%` }} /></div></div>}
      {phaseNotice && <div className={`intensity-announcement intensity-announcement--${intensity.replace(" ", "-").toLowerCase()}`}>{phaseNotice}</div>}
      {eventKind && eventSeconds !== null && <div className="dream-event" role="status"><b>{eventKind}</b><span>{eventResult ?? (eventKind === "FINAL APPROVAL" ? `${3-seals.length} APPROVALS REMAIN · ${Math.ceil(eventSeconds)}S` : eventKind === "PAPER JAM" ? `${seals.length}/3 SEALS · ${Math.ceil(eventSeconds)}S` : eventKind === "OVERTIME" ? `SURVIVE OR ELIMINATE 3 · ${Math.ceil(eventSeconds)}S` : `ELIMINATE MARKED TARGET · ${Math.ceil(eventSeconds)}S`)}</span></div>}
      <MobileControls />
      <WeaponView />
      <MenuOverlay />
      <RoundResult />
      <ControlsPopup />
      {!touch && <div className="click-hint">click to lock mouse · ESC pause</div>}
      {definition.theme === "jungle" && <div className="map-hint">THORNS SPREAD EVERY 30S · E ZIPLINE FORWARD · SHIFT+E BACK</div>}
      {definition.theme === "gems" && <div className="map-hint">LEAVE THE MARKED GEMS BEFORE THEIR LASERS FIRE · CLIMB THE INNER SPIRAL</div>}
      {definition.theme === "hell" && <div className="map-hint">FIVE STONE BRIDGES CROSS THE LAVA · DODGE THE RED CIRCLES EVERY 10 SECONDS</div>}
      {definition.theme === "heaven" && <div className="map-hint">RED CIRCLES WARN OF JUDGEMENT RAYS · CLEAR THE PRELUDE TO FACE THE DRAGON</div>}
      <div className="game-fade-in" />
    </div>
  );
}
