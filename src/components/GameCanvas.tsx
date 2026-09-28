import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect, useMemo } from "react";
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
import { useTouchMode } from "../game/touch";

export function GameCanvas() {
  const touch = useTouchMode();
  const currentLevel = useGameStore((state) => state.currentLevel);
  const ngPlusCycle = useGameStore((state) => state.ngPlusCycle);
  const runId = useGameStore((state) => state.runId);
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
            {definition.theme === "playground" && <PaperDustStorm />}
            {definition.theme === "jungle" && <JungleThorns />}
            <PaperGrenadeSystem />
            <PickupSystem />

            {paperSpawns.map((spawn, index) => (
              <PaperworkMonster
                key={`paper-${index}`}
                id={`paper-${index}`}
                spawn={spawn}
              />
            ))}

            {penSpawns.map((spawn, index) => (
              <PenMonster
                key={`pen-${index}`}
                id={`pen-${index}`}
                spawn={spawn}
              />
            ))}
            {extraSpawns.slice(0, enemy.flying ?? 0).map((spawn, index) => <ExtraMonster key={`fly-${index}`} id={`fly-${index}`} spawn={spawn} kind="fly" />)}
            {extraSpawns.slice(enemy.flying ?? 0, (enemy.flying ?? 0) + (enemy.statues ?? 0)).map((spawn, index) => <ExtraMonster key={`statue-${index}`} id={`statue-${index}`} spawn={spawn} kind="statue" />)}

            {definition.theme === "gems" && <>
              <PaperworkMonster id="paper-inner" spawn={[0, 0, -4]} />
              <PenMonster id="pen-mid" spawn={[22, 4.7, -4]} />
              <PenMonster id="pen-peak" spawn={[0, 16.7, 21]} />
            </>}

            {bossSpawns.map((spawn, index) => {
              const ranged = index % 3 === 1 || index % 5 === 4;
              return (
                <Dummy
                  key={index}
                  id={`target-${index}`}
                  spawn={spawn}
                  archetype={ranged ? "ranged" : "melee"}
                  rangedWeapon={index % 2 === 0 ? "bow" : "handgun"}
                />
              );
            })}
          </Physics>
        </Suspense>
      </Canvas>

      <HUD />
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
