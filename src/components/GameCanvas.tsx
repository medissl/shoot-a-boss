import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense } from "react";
import { Arena } from "./Arena";
import { CombatSystem } from "./CombatSystem";
import { Dummy } from "./Dummy";
import { HUD } from "./HUD";
import { MenuOverlay } from "./MenuOverlay";
import { PaperGrenadeSystem } from "./PaperGrenadeSystem";
import { PickupSystem } from "./PickupSystem";
import { PlayerController } from "./PlayerController";
import { WeaponView } from "./WeaponView";
import { TARGET_SPAWNS } from "../game/config";

export function GameCanvas() {
  return (
    <div className="game-shell">
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.05, far: 150, position: [0, 2, 12] }}
        dpr={[1, 1.6]}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -15, 0]}>
            <Arena />
            <PlayerController />
            <CombatSystem />
            <PaperGrenadeSystem />
            <PickupSystem />
            {TARGET_SPAWNS.map((spawn, index) => (
              <Dummy
                key={index}
                id={`target-${index}`}
                spawn={spawn}
                aggressive={index % 3 === 0}
              />
            ))}
          </Physics>
        </Suspense>
      </Canvas>

      <HUD />
      <WeaponView />
      <MenuOverlay />
      <div className="click-hint">click to lock mouse · ESC pause</div>
      <div className="game-fade-in" />
    </div>
  );
}
