import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { WEAPONS, type WeaponId } from "../game/config";
import { useGameStore } from "../game/store";

type Trace = {
  id: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  hit: boolean;
};

function TraceLine({ trace }: { trace: Trace }) {
  const midpoint = trace.from.clone().add(trace.to).multiplyScalar(0.5);
  const length = trace.from.distanceTo(trace.to);
  const direction = trace.to.clone().sub(trace.from).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction,
  );

  return (
    <group position={midpoint} quaternion={quaternion}>
      <mesh>
        <cylinderGeometry args={[0.012, 0.018, length, 5]} />
        <meshBasicMaterial color={trace.hit ? "#db7d19" : "#2548b8"} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

export function CombatSystem() {
  const { camera, scene } = useThree();
  const lastShot = useRef(0);
  const autoFire = useRef<number | null>(null);
  const nextTraceId = useRef(1);
  const [traces, setTraces] = useState<Trace[]>([]);
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
    perspective.fov = THREE.MathUtils.lerp(perspective.fov, wanted, scoped ? 0.22 : 0.16);
    perspective.updateProjectionMatrix();
  });

  useEffect(() => {
    function addTrace(from: THREE.Vector3, to: THREE.Vector3, hit: boolean) {
      const id = nextTraceId.current++;
      setTraces((current) => [...current.slice(-22), { id, from, to, hit }]);
      window.setTimeout(() => {
        setTraces((current) => current.filter((trace) => trace.id !== id));
      }, 115);
    }

    function fire(currentWeapon: WeaponId) {
      const config = WEAPONS[currentWeapon];
      const now = performance.now();
      if (now - lastShot.current < config.cooldownMs) return;
      if (!spendRound(currentWeapon)) return;
      lastShot.current = now;

      const aimed = useGameStore.getState().scoped;
      const spread = aimed ? config.aimedSpread : config.hipSpread;
      const hits = new Map<string, number>();

      for (let pellet = 0; pellet < config.pellets; pellet += 1) {
        const raycaster = new THREE.Raycaster();
        const spreadX = (Math.random() - 0.5) * spread;
        const spreadY = (Math.random() - 0.5) * spread;
        raycaster.far = config.maxRange;
        raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera);

        const origin = raycaster.ray.origin.clone().add(
          raycaster.ray.direction.clone().multiplyScalar(0.7),
        );
        const intersections = raycaster.intersectObjects(scene.children, true);
        const first = intersections[0];
        const end = first
          ? first.point.clone()
          : raycaster.ray.origin
              .clone()
              .add(raycaster.ray.direction.clone().multiplyScalar(config.maxRange));

        const targetId = first?.object.userData.targetId as string | undefined;
        addTrace(origin, end, Boolean(targetId));

        if (!first || !targetId) continue;

        const targetPart = first.object.userData.targetPart;
        const headMultiplier = targetPart === "head" ? 1.6 : 1;
        let damage = config.damage * headMultiplier;

        if (currentWeapon === "shotgun") {
          const closeRange = 5;
          const falloffDistance = Math.max(0, first.distance - closeRange);
          const multiplier = THREE.MathUtils.clamp(1 - falloffDistance / 25, 0.24, 1);
          damage *= multiplier;
        }

        hits.set(targetId, (hits.get(targetId) ?? 0) + damage);
      }

      hits.forEach((damage, id) => {
        window.dispatchEvent(
          new CustomEvent("boss-hit", { detail: { id, damage } }),
        );
      });

      window.dispatchEvent(
        new CustomEvent("weapon-fired", { detail: { weapon: currentWeapon } }),
      );
    }

    function stopAutoFire() {
      if (autoFire.current !== null) {
        window.clearInterval(autoFire.current);
        autoFire.current = null;
      }
    }

    const mouseDown = (event: MouseEvent) => {
      if (useGameStore.getState().screen !== "playing") return;

      if (event.button === 2) {
        event.preventDefault();
        setScoped(true);
        return;
      }

      if (event.button !== 0) return;

      const currentWeapon = useGameStore.getState().weapon;
      fire(currentWeapon);

      if (currentWeapon === "rifle" && autoFire.current === null) {
        autoFire.current = window.setInterval(() => {
          if (useGameStore.getState().screen !== "playing") {
            stopAutoFire();
            return;
          }
          if (useGameStore.getState().weapon !== "rifle") {
            stopAutoFire();
            return;
          }
          fire("rifle");
        }, WEAPONS.rifle.cooldownMs);
      }
    };

    const mouseUp = (event: MouseEvent) => {
      if (event.button === 2) setScoped(false);
      if (event.button === 0) stopAutoFire();
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
      stopAutoFire();
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

  return (
    <>
      {traces.map((trace) => (
        <TraceLine key={trace.id} trace={trace} />
      ))}
    </>
  );
}
