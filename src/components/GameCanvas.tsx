import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect } from "react";
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
import { ControlsPopup } from "./ControlsList";
import { WeaponView } from "./WeaponView";
import {
  getEnemySpawnPool,
  getLevelDefinition,
} from "../game/levels";
import { useGameStore } from "../game/store";

export function GameCanvas() {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const definition = getLevelDefinition(currentLevel);
  const spawnPool = getEnemySpawnPool(currentLevel);
  const bossSpawns = spawnPool.slice(0, definition.enemy.bosses);
  const paperSpawns = spawnPool.slice(
    definition.enemy.bosses,
    definition.enemy.bosses + definition.enemy.paperwork,
  );
  const penSpawns = spawnPool.slice(
    definition.enemy.bosses + definition.enemy.paperwork,
    definition.enemy.bosses +
      definition.enemy.paperwork +
      definition.enemy.pens,
  );

  useEffect(() => {
    document.documentElement.dataset.sabLevel = String(currentLevel);
    return () => {
      delete document.documentElement.dataset.sabLevel;
    };
  }, [currentLevel]);

  return (
    <div className={`game-shell game-shell--${definition.theme}`}>
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.05, far: 180, position: [0, 2, 12] }}
        dpr={[1, 1.6]}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -15, 0]}>
            <LevelArena />
            <PlayerController />
            <CombatSystem />
            <PaintSystem />
            <SurfaceDamageSystem />
            {definition.theme === "playground" && <PaperDustStorm />}
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
      <WeaponView />
      <MenuOverlay />
      {currentLevel === 1 && <ControlsPopup />}
      <div className="click-hint">click to lock mouse · ESC pause</div>
      {definition.theme === "jungle" && <div className="map-hint">YELLOW LADDERS · E ZIPLINE FORWARD · SHIFT+E ZIPLINE BACK</div>}
      {definition.theme === "gems" && <div className="map-hint">SHOOT THE MARKED GEMS TO LIGHT THE CAVE · FOLLOW THE INNER SPIRAL TO THE PEAK</div>}
      {definition.theme === "hell" && <div className="map-hint">FIVE STONE BRIDGES CROSS THE LAVA · DODGE THE RED CIRCLES EVERY 10 SECONDS</div>}
      <div className="game-fade-in" />
    </div>
  );
}
