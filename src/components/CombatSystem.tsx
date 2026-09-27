import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { WEAPONS, type WeaponId } from "../game/config";
import { useGameStore } from "../game/store";

type Trace = {
  id: number;
  from: [number, number, number];
  to: [number, number, number];
  hit: boolean;
};

type Impact = {
  id: number;
  position: [number, number, number];
  sparks: [number, number, number][];
};

type HitPart = "head" | "body" | "leg";

type HitSummary = {
  damage: number;
  part: HitPart;
};

const PART_PRIORITY: Record<HitPart, number> = {
  leg: 0,
  body: 1,
  head: 2,
};

function TraceLine({ trace }: { trace: Trace }) {
  const from = useMemo(() => new THREE.Vector3(...trace.from), [trace.from]);
  const to = useMemo(() => new THREE.Vector3(...trace.to), [trace.to]);
  const midpoint = useMemo(() => from.clone().add(to).multiplyScalar(0.5), [from, to]);
  const length = from.distanceTo(to);
  const quaternion = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        to.clone().sub(from).normalize(),
      ),
    [from, to],
  );

  return (
    <group position={midpoint} quaternion={quaternion}>
      <mesh>
        <cylinderGeometry args={[0.005, 0.01, length, 5]} />
        <meshBasicMaterial
          color={trace.hit ? "#ff6ea8" : "#5978e8"}
          transparent
          opacity={trace.hit ? 0.9 : 0.52}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, length / 2, 0]}>
        <octahedronGeometry args={[trace.hit ? 0.05 : 0.03, 0]} />
        <meshBasicMaterial
          color={trace.hit ? "#ff8fbd" : "#eef2ff"}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function ImpactBurst({ impact }: { impact: Impact }) {
  return (
    <group position={impact.position}>
      {impact.sparks.map((offset, index) => (
        <mesh position={offset} key={index}>
          <octahedronGeometry args={[index % 2 ? 0.05 : 0.075, 0]} />
          <meshBasicMaterial
            color={index % 3 === 0 ? "#ffffff" : "#ff5f9d"}
            transparent
            opacity={0.95}
            depthWrite={false}
          />
        </mesh>
      ))}
      <mesh>
        <ringGeometry args={[0.075, 0.125, 9]} />
        <meshBasicMaterial
          color="#ff5f9d"
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function ignoresProjectile(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.userData.ignoreProjectile) return true;
    current = current.parent;
  }
  return false;
}

function firstProjectileIntersection(
  intersections: THREE.Intersection<THREE.Object3D>[],
) {
  return intersections.find(({ object }) => !ignoresProjectile(object));
}

function inheritedUserData(object: THREE.Object3D, key: string) {
  let current: THREE.Object3D | null = object;
  while (current) {
    const value = current.userData[key] as string | undefined;
    if (value) return value;
    current = current.parent;
  }
  return undefined;
}

export function CombatSystem() {
  const { camera, scene } = useThree();
  const lastShot = useRef(0);
  const aimReadyAt = useRef(0);
  const emptyAlertAt = useRef(0);
  const autoFire = useRef<number | null>(null);
  const nextTraceId = useRef(1);
  const nextImpactId = useRef(1);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const screen = useGameStore((state) => state.screen);
  const weapon = useGameStore((state) => state.weapon);
  const scoped = useGameStore((state) => state.scoped);
  const reloading = useGameStore((state) => state.reloading);
  const setScoped = useGameStore((state) => state.setScoped);
  const spendRound = useGameStore((state) => state.spendRound);
  const reload = useGameStore((state) => state.reload);
  const setWeapon = useGameStore((state) => state.setWeapon);
  const cycleWeapon = useGameStore((state) => state.cycleWeapon);

  useFrame((state) => {
    const perspective = state.camera as THREE.PerspectiveCamera;
    const wanted = scoped ? WEAPONS[weapon].scopedFov : 70;
    const speed =
      weapon === "sniper"
        ? scoped
          ? 0.075
          : 0.1
        : scoped
          ? 0.17
          : 0.15;
    perspective.fov = THREE.MathUtils.lerp(perspective.fov, wanted, speed);
    perspective.updateProjectionMatrix();
  });

  useEffect(() => {
    function addTrace(from: THREE.Vector3, to: THREE.Vector3, hit: boolean) {
      const id = nextTraceId.current++;
      setTraces((current) => [
        ...current.slice(-10),
        {
          id,
          from: [from.x, from.y, from.z],
          to: [to.x, to.y, to.z],
          hit,
        },
      ]);
      window.setTimeout(() => {
        setTraces((current) => current.filter((trace) => trace.id !== id));
      }, hit ? 74 : 48);
    }

    function addImpact(position: THREE.Vector3) {
      const id = nextImpactId.current++;
      const sparks: [number, number, number][] = Array.from({ length: 8 }, () => [
        (Math.random() - 0.5) * 0.42,
        (Math.random() - 0.5) * 0.42,
        (Math.random() - 0.5) * 0.26,
      ]);

      setImpacts((current) => [
        ...current.slice(-14),
        {
          id,
          position: [position.x, position.y, position.z],
          sparks,
        },
      ]);

      window.setTimeout(() => {
        setImpacts((current) => current.filter((impact) => impact.id !== id));
      }, 100);
    }

    function emptyMagazine(currentWeapon: WeaponId) {
      const now = performance.now();
      if (now - emptyAlertAt.current < 800) return;
      emptyAlertAt.current = now;
      window.dispatchEvent(
        new CustomEvent("empty-mag", { detail: { weapon: currentWeapon } }),
      );
    }

    function fire(currentWeapon: WeaponId) {
      const state = useGameStore.getState();
      if (state.reloading) return;

      const config = WEAPONS[currentWeapon];
      const now = performance.now();
      const currentAmmo = state.ammo[currentWeapon];

      if (currentAmmo.mag <= 0) {
        emptyMagazine(currentWeapon);
        return;
      }

      if (now - lastShot.current < config.cooldownMs) return;

      const aimed = state.scoped;
      if (aimed && now < aimReadyAt.current) return;

      if (!spendRound(currentWeapon)) {
        emptyMagazine(currentWeapon);
        return;
      }

      lastShot.current = now;

      const spread = aimed ? config.aimedSpread : config.hipSpread;
      const hits = new Map<string, HitSummary>();

      for (let pellet = 0; pellet < config.pellets; pellet += 1) {
        const raycaster = new THREE.Raycaster();
        const spreadX = (Math.random() - 0.5) * spread;
        const spreadY = (Math.random() - 0.5) * spread;
        raycaster.far = config.maxRange;
        raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera);

        const origin = raycaster.ray.origin.clone().add(
          raycaster.ray.direction.clone().multiplyScalar(0.9),
        );
        const intersections = raycaster.intersectObjects(scene.children, true);
        const first = firstProjectileIntersection(intersections);
        const end = first
          ? first.point.clone()
          : raycaster.ray.origin
              .clone()
              .add(raycaster.ray.direction.clone().multiplyScalar(config.maxRange));

        const targetId = first
          ? inheritedUserData(first.object, "targetId")
          : undefined;
        const propId = first
          ? inheritedUserData(first.object, "propId")
          : undefined;
        const destructibleId = first
          ? inheritedUserData(first.object, "destructibleId")
          : undefined;

        addTrace(origin, end, Boolean(targetId || propId || destructibleId));

        if (!first) continue;

        if (propId && !targetId) {
          addImpact(first.point);
          window.dispatchEvent(
            new CustomEvent("prop-shot", {
              detail: {
                id: propId,
                direction: [
                  raycaster.ray.direction.x,
                  raycaster.ray.direction.y,
                  raycaster.ray.direction.z,
                ],
                force:
                  currentWeapon === "sniper"
                    ? 3.4
                    : currentWeapon === "shotgun"
                      ? 2.35
                      : 1.15,
              },
            }),
          );
          continue;
        }

        if (destructibleId && !targetId && !propId) {
          addImpact(first.point);
          window.dispatchEvent(
            new CustomEvent("surface-hit", {
              detail: {
                id: destructibleId,
                point: [first.point.x, first.point.y, first.point.z],
                direction: [
                  raycaster.ray.direction.x,
                  raycaster.ray.direction.y,
                  raycaster.ray.direction.z,
                ],
              },
            }),
          );
          continue;
        }

        if (!targetId) continue;

        addImpact(first.point);

        const rawPart = first.object.userData.targetPart as HitPart | undefined;
        const targetPart: HitPart =
          rawPart === "head" || rawPart === "leg" ? rawPart : "body";

        window.dispatchEvent(
          new CustomEvent("boss-impact", {
            detail: {
              id: targetId,
              part: targetPart,
              point: [first.point.x, first.point.y, first.point.z],
            },
          }),
        );
        window.dispatchEvent(
          new CustomEvent("paint-splash", {
            detail: {
              position: [first.point.x, 0.025, first.point.z],
              size: currentWeapon === "shotgun" ? 0.5 : 0.34,
            },
          }),
        );

        const partMultiplier =
          targetPart === "head" ? 1.5 : targetPart === "leg" ? 0.3 : 1;

        let damage = config.damage * partMultiplier;

        if (currentWeapon === "shotgun") {
          const fullDamageDistance = 4.5;
          const falloffDistance = Math.max(0, first.distance - fullDamageDistance);
          const falloff = THREE.MathUtils.clamp(
            1 - falloffDistance / 12,
            0.06,
            1,
          );
          damage *= falloff;
        }

        const previous = hits.get(targetId);
        if (!previous) {
          hits.set(targetId, { damage, part: targetPart });
        } else {
          hits.set(targetId, {
            damage: previous.damage + damage,
            part:
              PART_PRIORITY[targetPart] > PART_PRIORITY[previous.part]
                ? targetPart
                : previous.part,
          });
        }
      }

      hits.forEach((summary, id) => {
        window.dispatchEvent(
          new CustomEvent("boss-hit", {
            detail: {
              id,
              damage: summary.damage,
              part: summary.part,
            },
          }),
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
      window.dispatchEvent(new Event("rifle-trigger-up"));
    }

    const mouseDown = (event: MouseEvent) => {
      const state = useGameStore.getState();
      if (state.screen !== "playing") return;

      if (event.button === 2) {
        event.preventDefault();
        if (state.reloading) return;
        const currentWeapon = state.weapon;
        setScoped(true);
        aimReadyAt.current =
          performance.now() + WEAPONS[currentWeapon].aimDelayMs;
        return;
      }

      if (event.button !== 0 || state.reloading) return;

      const currentWeapon = state.weapon;
      if (currentWeapon === "rifle" && state.ammo.rifle.mag > 0) {
        window.dispatchEvent(new Event("rifle-trigger-down"));
      }
      fire(currentWeapon);

      if (currentWeapon === "rifle" && autoFire.current === null) {
        autoFire.current = window.setInterval(() => {
          const liveState = useGameStore.getState();
          if (
            liveState.screen !== "playing" ||
            liveState.weapon !== "rifle" ||
            liveState.reloading ||
            liveState.ammo.rifle.mag <= 0
          ) {
            stopAutoFire();
            return;
          }
          fire("rifle");
        }, WEAPONS.rifle.cooldownMs);
      }
    };

    const mouseUp = (event: MouseEvent) => {
      if (event.button === 2) {
        setScoped(false);
        aimReadyAt.current = 0;
      }
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
    if (screen !== "playing" || reloading) {
      setScoped(false);
      aimReadyAt.current = 0;
    }
  }, [reloading, screen, setScoped]);

  return (
    <>
      {traces.map((trace) => (
        <TraceLine key={trace.id} trace={trace} />
      ))}
      {impacts.map((impact) => (
        <ImpactBurst key={impact.id} impact={impact} />
      ))}
    </>
  );
}
