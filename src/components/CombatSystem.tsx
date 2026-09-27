import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { WEAPONS, type WeaponId } from "../game/config";
import { useGameStore } from "../game/store";

export function CombatSystem() {
  const { camera, scene } = useThree();
  const lastShot = useRef(0);
  const screen = useGameStore((state) => state.screen);
  const weapon = useGameStore((state) => state.weapon);
  const scoped = useGameStore((state) => state.scoped);
  const setScoped = useGameStore((state) => state.setScoped);
  const spendRound = useGameStore((state) => state.spendRound);
  const reload = useGameStore((state) => state.reload);
  const setWeapon = useGameStore((state) => state.setWeapon);
  const cycleWeapon = useGameStore((state) => state.cycleWeapon);

  useFrame((state) => {
    const perspective = state.camera as THREE.PerspectiveCamera;
    const wanted = scoped ? WEAPONS[weapon].scopedFov : 70;
    perspective.fov = THREE.MathUtils.lerp(perspective.fov, wanted, 0.18);
    perspective.updateProjectionMatrix();
  });

  useEffect(() => {
    function fire(currentWeapon: WeaponId) {
      const config = WEAPONS[currentWeapon];
      const now = performance.now();
      if (now - lastShot.current < config.cooldownMs) return;
      if (!spendRound(currentWeapon)) return;
      lastShot.current = now;

      const hits = new Map<string, number>();

      for (let pellet = 0; pellet < config.pellets; pellet += 1) {
        const raycaster = new THREE.Raycaster();
        const spreadX = (Math.random() - 0.5) * config.spread;
        const spreadY = (Math.random() - 0.5) * config.spread;
        raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera);

        const intersections = raycaster.intersectObjects(scene.children, true);
        const hit = intersections.find((item) => item.object.userData.targetId);
        if (!hit) continue;

        const id = String(hit.object.userData.targetId);
        const multiplier = hit.object.userData.targetPart === "head" ? 1.5 : 1;
        hits.set(id, (hits.get(id) ?? 0) + config.damage * multiplier);
      }

      hits.forEach((damage, id) => {
        window.dispatchEvent(
          new CustomEvent("boss-hit", { detail: { id, damage } }),
        );
      });
    }

    const mouseDown = (event: MouseEvent) => {
      if (useGameStore.getState().screen !== "playing") return;

      if (event.button === 0) {
        setScoped(true);
      }

      if (event.button === 2) {
        event.preventDefault();
        fire(useGameStore.getState().weapon);
      }
    };

    const mouseUp = (event: MouseEvent) => {
      if (event.button === 0) setScoped(false);
    };

    const keyDown = (event: KeyboardEvent) => {
      if (useGameStore.getState().screen !== "playing") return;
      if (event.code === "Digit1") setWeapon("sniper");
      if (event.code === "Digit2") setWeapon("rifle");
      if (event.code === "Digit3") setWeapon("shotgun");
      if (event.code === "KeyR") reload();
    };

    const wheel = (event: WheelEvent) => {
      if (useGameStore.getState().screen !== "playing") return;
      cycleWeapon(event.deltaY > 0 ? 1 : -1);
    };

    const contextMenu = (event: MouseEvent) => event.preventDefault();

    window.addEventListener("mousedown", mouseDown);
    window.addEventListener("mouseup", mouseUp);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("contextmenu", contextMenu);

    return () => {
      window.removeEventListener("mousedown", mouseDown);
      window.removeEventListener("mouseup", mouseUp);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("contextmenu", contextMenu);
    };
  }, [camera, cycleWeapon, reload, scene, setScoped, setWeapon, spendRound]);

  useEffect(() => {
    if (screen !== "playing") setScoped(false);
  }, [screen, setScoped]);

  return null;
}
