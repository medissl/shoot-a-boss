import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { PEN_MONSTER_MAX_HP } from "../game/config";
import { enemyMotionFactor } from "../game/effects";
import { getLevelDefinition } from "../game/levels";
import {
  hasEnemyLineOfSight,
  moveWithAvoidance,
  safeEnemySpawn,
} from "../game/navigation";
import { useGameStore } from "../game/store";

const BLUE = "#2548b8";
const RED = "#ef476f";
const INK = "#191b3f";
const PEN_RADIUS = 0.62;

type Projectile = {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  damage: number;
};

type DamagePop = { id: number; amount: number };

function setBeam(
  mesh: THREE.Mesh,
  from: THREE.Vector3,
  to: THREE.Vector3,
  thickness = 0.02,
) {
  const direction = to.clone().sub(from);
  const length = direction.length();
  const midpoint = from.clone().add(to).multiplyScalar(0.5);
  mesh.position.copy(midpoint);
  mesh.scale.set(thickness, length, thickness);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
}

function InkProjectile({
  projectile,
  onDone,
}: {
  projectile: Projectile;
  onDone: (id: number) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3(...projectile.velocity));
  const bornAt = useRef<number | null>(null);
  const done = useRef(false);

  useFrame((state, delta) => {
    const root = ref.current;
    if (!root || done.current) return;
    if (bornAt.current === null) bornAt.current = state.clock.elapsedTime;

    root.position.addScaledVector(velocity.current, delta);
    root.rotation.x += delta * 8;
    root.rotation.z += delta * 6;

    const player = new THREE.Vector3(...useGameStore.getState().playerPosition);
    if (root.position.distanceTo(player) < 0.78) {
      done.current = true;
      useGameStore.getState().damagePlayer(projectile.damage);
      onDone(projectile.id);
      return;
    }

    if (state.clock.elapsedTime - bornAt.current > 5.2) {
      done.current = true;
      onDone(projectile.id);
    }
  });

  return (
    <group ref={ref} position={projectile.position}>
      <mesh>
        <icosahedronGeometry args={[0.16, 0]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <mesh scale={1.8}>
        <icosahedronGeometry args={[0.12, 0]} />
        <meshBasicMaterial color="#6e65d8" transparent opacity={0.42} />
      </mesh>
    </group>
  );
}

export function PenMonster({
  id,
  spawn,
}: {
  id: string;
  spawn: [number, number, number];
}) {
  const root = useRef<THREE.Group>(null);
  const warning = useRef<THREE.Mesh>(null);
  const maxHp = Math.round(PEN_MONSTER_MAX_HP * (1 + (useGameStore.getState().currentLevel - 1) * 0.085));
  const hpRef = useRef(maxHp);
  const rechargeUntil = useRef(0);
  const shotsLeft = useRef(0);
  const telegraphUntil = useRef(0);
  const nextCycleAt = useRef(0);
  const target = useRef(new THREE.Vector3());
  const projectileId = useRef(1);
  const nextPopId = useRef(1);
  const awarenessUntil = useRef(0);
  const roamTarget = useRef(new THREE.Vector3());
  const [hp, setHp] = useState(maxHp);
  const [dead, setDead] = useState(false);
  const [gone, setGone] = useState(false);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [damagePops, setDamagePops] = useState<DamagePop[]>([]);

  const currentLevel = useGameStore((state) => state.currentLevel);
  const screen = useGameStore((state) => state.screen);
  const eliminate = useGameStore((state) => state.eliminate);
  const eliminated = useGameStore((state) => state.eliminated.includes(id));
  const tuning = getLevelDefinition(currentLevel).enemy;
  const penIndex = Number(id.split("-")[1]) || 0;
  const sideBias = penIndex % 2 === 0 ? 1 : -1;
  const safeSpawn = useMemo(
    () => spawn[1] > 2 ? spawn : safeEnemySpawn(spawn, PEN_RADIUS, currentLevel),
    [currentLevel, spawn],
  );
  const deadAt = useRef(0);

  useEffect(() => {
    roamTarget.current.set(...safeSpawn);
  }, [safeSpawn]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (
        event as CustomEvent<{ id: string; damage: number }>
      ).detail;
      if (detail.id !== id || dead || eliminated) return;

      awarenessUntil.current = performance.now() + 4800;
      const nextHp = Math.max(0, hpRef.current - detail.damage);
      hpRef.current = nextHp;
      setHp(nextHp);

      const popId = nextPopId.current++;
      setDamagePops((current) => [
        ...current.slice(-2),
        { id: popId, amount: Math.round(detail.damage) },
      ]);
      window.setTimeout(
        () =>
          setDamagePops((current) =>
            current.filter((pop) => pop.id !== popId),
          ),
        700,
      );

      if (nextHp <= 0) {
        deadAt.current = performance.now();
        setDead(true);
        eliminate(id);
      }
    };

    window.addEventListener("boss-hit", handler as EventListener);
    return () =>
      window.removeEventListener("boss-hit", handler as EventListener);
  }, [dead, eliminate, eliminated, id]);

  useFrame((state, delta) => {
    const group = root.current;
    const beam = warning.current;
    if (!group || screen !== "playing") return;

    if (dead) {
      if (beam) beam.visible = false;
      const age = (performance.now() - deadAt.current) / 1000;
      group.rotation.z = THREE.MathUtils.lerp(
        group.rotation.z,
        Math.PI * 0.48,
        0.12,
      );
      group.position.y = Math.max(-0.4, group.position.y - delta * 0.45);
      if (age > 4 && !gone) setGone(true);
      return;
    }

    if (enemyMotionFactor(id, useGameStore.getState().runId) === 0) {
      if (beam) beam.visible = false;
      return;
    }

    const player = new THREE.Vector3(...useGameStore.getState().playerPosition);
    const here = group.position;
    const toPlayer = player.clone().sub(here).setY(0);
    const distance = toPlayer.length();
    const direction =
      distance > 0.001 ? toPlayer.clone().normalize() : new THREE.Vector3();

    const forward = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(group.quaternion)
      .setY(0)
      .normalize();

    const seesPlayer =
      distance < 39 * tuning.vision &&
      (distance < 7 ||
        forward.dot(direction) > -0.35) &&
      (safeSpawn[1] > 2 || hasEnemyLineOfSight(here, player, currentLevel, 0.12));

    const nowMs = performance.now();
    if (seesPlayer) awarenessUntil.current = nowMs + 4200;
    const aware = seesPlayer || nowMs < awarenessUntil.current;
    const now = state.clock.elapsedTime;
    const motion = new THREE.Vector3();
    let faceTarget = aware ? player : roamTarget.current;

    if (aware) {
      faceTarget = player;

      if (distance < 10) {
        motion.addScaledVector(
          direction,
          -2.25 * tuning.speed * delta,
        );
      } else if (distance > 19) {
        motion.addScaledVector(
          direction,
          2.0 * tuning.speed * delta,
        );
      } else {
        motion.addScaledVector(
          new THREE.Vector3(-direction.z, 0, direction.x),
          0.75 * sideBias * tuning.speed * delta,
        );
      }

      if (
        seesPlayer &&
        shotsLeft.current === 0 &&
        now >= rechargeUntil.current
      ) {
        shotsLeft.current = 5;
        target.current.copy(player).add(new THREE.Vector3(0, 0.35, 0));
        telegraphUntil.current = now + 0.52;
        nextCycleAt.current = telegraphUntil.current;
      }

      if (shotsLeft.current > 0 && seesPlayer) {
        if (beam) {
          setBeam(
            beam,
            here.clone().add(new THREE.Vector3(0, 1.7, 0)),
            target.current,
            0.018,
          );
          beam.visible = now < telegraphUntil.current;
        }

        if (now >= nextCycleAt.current) {
          const origin = here.clone().add(new THREE.Vector3(0, 1.7, 0));
          const velocity = target.current
            .clone()
            .sub(origin)
            .normalize()
            .multiplyScalar(12.2 + tuning.speed * 1.5);
          const projectile: Projectile = {
            id: projectileId.current++,
            position: [origin.x, origin.y, origin.z],
            velocity: [velocity.x, velocity.y, velocity.z],
            damage: Math.round(8 * tuning.damage),
          };
          setProjectiles((current) => [...current.slice(-18), projectile]);

          shotsLeft.current -= 1;
          if (shotsLeft.current > 0) {
            target.current.copy(player).add(new THREE.Vector3(0, 0.35, 0));
            telegraphUntil.current = now + 0.34;
            nextCycleAt.current = now + 0.36;
          } else {
            rechargeUntil.current = now + 20;
            if (beam) beam.visible = false;
          }
        }
      } else if (beam) {
        beam.visible = false;
      }
    } else {
      if (beam) beam.visible = false;
      shotsLeft.current = 0;
      faceTarget = roamTarget.current;

      if (
        roamTarget.current.lengthSq() === 0 ||
        here.distanceTo(roamTarget.current) < 1 ||
        now >= nextCycleAt.current
      ) {
        const seed = penIndex + 2;
        const angle = seed * 1.7 + now * 0.31;
        const candidate: [number, number, number] = [
          safeSpawn[0] + Math.cos(angle) * 8,
          0,
          safeSpawn[2] + Math.sin(angle) * 8,
        ];
        const next = safeEnemySpawn(candidate, PEN_RADIUS, currentLevel);
        roamTarget.current.set(...next);
        nextCycleAt.current = now + 4.2;
      }

      const roam = roamTarget.current.clone().sub(here).setY(0);
      if (roam.length() > 0.7) {
        roam.normalize();
        motion.addScaledVector(roam, 1.35 * tuning.speed * delta);
      }
    }

    if (safeSpawn[1] <= 2) moveWithAvoidance(
      here,
      motion.multiplyScalar(enemyMotionFactor(id, useGameStore.getState().runId)),
      PEN_RADIUS,
      sideBias,
      currentLevel,
    );
    group.lookAt(faceTarget.x, 1.2, faceTarget.z);
    group.rotation.x = 0;
    group.rotation.z = dead ? group.rotation.z : 0;
  });

  if (gone) return null;

  return (
    <>
      <group ref={root} position={safeSpawn}>
        {/* A flat, broad cartoon silhouette. Every visible piece belongs to
            the target, so whichever part the ray first meets takes damage. */}
        <group userData={dead ? { ignoreProjectile: true } : { targetId: id, targetPart: "body" }}>
          <mesh position={[0, 1.52, 0]} castShadow>
            <planeGeometry args={[0.94, 2.52]} />
            <meshBasicMaterial color={BLUE} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 1.52, 0.012]}>
            <planeGeometry args={[0.76, 2.35]} />
            <meshBasicMaterial color="#f7f0d7" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 2.75, 0.018]}>
            <planeGeometry args={[0.76, 0.22]} />
            <meshBasicMaterial color={RED} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.29, 0.01]} rotation={[0, 0, -Math.PI / 2]}>
            <circleGeometry args={[0.44, 3]} />
            <meshBasicMaterial color={INK} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-0.19, 1.65, 0.025]}>
            <circleGeometry args={[0.07, 12]} />
            <meshBasicMaterial color={INK} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.19, 1.65, 0.025]}>
            <circleGeometry args={[0.07, 12]} />
            <meshBasicMaterial color={INK} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 1.4, 0.026]}>
            <torusGeometry args={[0.13, 0.025, 5, 12, Math.PI]} />
            <meshBasicMaterial color={INK} side={THREE.DoubleSide} />
          </mesh>
          {!dead && <mesh position={[0, 1.5, 0.05]}>
            <planeGeometry args={[1.2, 3]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>}
        </group>

        {!dead && (
          <group position={[0, 3.05, 0.04]} userData={{ ignoreProjectile: true }}>
            <mesh>
              <planeGeometry args={[1.25, 0.06]} />
              <meshBasicMaterial color="#c3cdf2" />
            </mesh>
            <mesh
              position={[
                -0.625 + (hp / maxHp) * 0.625,
                0,
                0.01,
              ]}
              scale={[hp / maxHp, 1, 1]}
            >
              <planeGeometry args={[1.22, 0.045]} />
              <meshBasicMaterial color={RED} />
            </mesh>
          </group>
        )}

        {damagePops.map((pop, index) => (
          <Html
            key={pop.id}
            position={[0, 3.18 + index * 0.1, 0]}
            center
            zIndexRange={[40, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div className="boss-damage-pop boss-damage-pop--body">
              <strong>{pop.amount}</strong>
            </div>
          </Html>
        ))}
      </group>

      <mesh
        ref={warning}
        visible={false}
        userData={{ ignoreProjectile: true }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={RED}
          transparent
          opacity={0.72}
          depthWrite={false}
        />
      </mesh>

      {projectiles.map((projectile) => (
        <InkProjectile
          key={projectile.id}
          projectile={projectile}
          onDone={(id) =>
            setProjectiles((current) =>
              current.filter((item) => item.id !== id),
            )
          }
        />
      ))}
    </>
  );
}
