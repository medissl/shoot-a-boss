import { Edges, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { PAPER_MONSTER_MAX_HP } from "../game/config";
import {
  hasEnemyLineOfSight,
  moveWithAvoidance,
  safeEnemySpawn,
} from "../game/navigation";
import { useGameStore } from "../game/store";

const BLUE = "#2548b8";
const PAPER = "#fbfaf4";
const PALE = "#e7ecff";
const PINK = "#ef476f";
const MONSTER_RADIUS = 0.66;

type DamagePop = {
  id: number;
  amount: number;
};

export function PaperworkMonster({
  id,
  spawn,
}: {
  id: string;
  spawn: [number, number, number];
}) {
  const root = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const hpRef = useRef(PAPER_MONSTER_MAX_HP);
  const nextAttackAt = useRef(0);
  const deadAt = useRef(0);
  const nextPopId = useRef(1);
  const awarenessUntil = useRef(0);
  const nextRoamAt = useRef(0);
  const [hp, setHp] = useState(PAPER_MONSTER_MAX_HP);
  const [hit, setHit] = useState(false);
  const [dead, setDead] = useState(false);
  const [gone, setGone] = useState(false);
  const [damagePops, setDamagePops] = useState<DamagePop[]>([]);

  const eliminated = useGameStore((state) => state.eliminated.includes(id));
  const eliminate = useGameStore((state) => state.eliminate);
  const damagePlayer = useGameStore((state) => state.damagePlayer);
  const screen = useGameStore((state) => state.screen);
  const sideBias = Number(id.split("-")[1]) % 2 === 0 ? 1 : -1;
  const safeSpawn = useMemo(
    () => safeEnemySpawn(spawn, MONSTER_RADIUS),
    [spawn],
  );
  const roamTarget = useRef(new THREE.Vector3(...safeSpawn));
  const lastSeenPosition = useRef(new THREE.Vector3(...safeSpawn));

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          id: string;
          damage: number;
        }>
      ).detail;
      if (detail.id !== id || dead || eliminated) return;

      awarenessUntil.current = performance.now() + 4200;
      const nextHp = Math.max(0, hpRef.current - detail.damage);
      hpRef.current = nextHp;
      setHp(nextHp);

      const popId = nextPopId.current++;
      setDamagePops((current) => [
        ...current.slice(-2),
        { id: popId, amount: Math.round(detail.damage) },
      ]);

      setHit(true);
      window.setTimeout(() => setHit(false), 120);
      window.setTimeout(() => {
        setDamagePops((current) => current.filter((pop) => pop.id !== popId));
      }, 700);

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
    if (!group || screen !== "playing") return;

    if (dead) {
      const elapsed = (performance.now() - deadAt.current) / 1000;
      group.rotation.z = THREE.MathUtils.lerp(
        group.rotation.z,
        -Math.PI * 0.47,
        0.11,
      );
      group.position.y = Math.max(-0.42, group.position.y - delta * 0.5);
      if (material.current) {
        material.current.opacity =
          elapsed < 3.2
            ? 1
            : THREE.MathUtils.clamp(1 - (elapsed - 3.2) / 0.8, 0, 1);
      }
      if (elapsed >= 4 && !gone) setGone(true);
      return;
    }

    const player = new THREE.Vector3(
      ...useGameStore.getState().playerPosition,
    );
    const here = group.position;
    const toPlayer = player.clone().sub(here).setY(0);
    const playerDistance = toPlayer.length();
    const playerDirection =
      playerDistance > 0.001
        ? toPlayer.clone().normalize()
        : new THREE.Vector3();

    const forwardSight = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(group.quaternion)
      .setY(0);
    if (forwardSight.lengthSq() > 0.001) forwardSight.normalize();

    const seesPlayer =
      playerDistance < 28 &&
      (playerDistance < 6.5 ||
        forwardSight.lengthSq() < 0.001 ||
        forwardSight.dot(playerDirection) > -0.18) &&
      hasEnemyLineOfSight(here, player, 0.1);

    const nowMs = performance.now();
    if (seesPlayer) {
      awarenessUntil.current = nowMs + 3900;
      lastSeenPosition.current.copy(player);
    }

    const aware = seesPlayer || nowMs < awarenessUntil.current;
    const now = state.clock.elapsedTime;
    const motion = new THREE.Vector3();
    let faceTarget = roamTarget.current;

    if (aware) {
      const target = seesPlayer ? player : lastSeenPosition.current;
      const direction = target.clone().sub(here).setY(0);
      const distance = direction.length();

      if (distance > 0.001) {
        direction.normalize();
        motion.copy(direction).multiplyScalar(4.15 * delta);
      }

      faceTarget = target;

      if (
        seesPlayer &&
        playerDistance < 1.45 &&
        now >= nextAttackAt.current
      ) {
        nextAttackAt.current = now + 0.78;
        damagePlayer(10);
      }
    } else {
      if (
        now >= nextRoamAt.current ||
        here.distanceTo(roamTarget.current) < 0.9
      ) {
        const seed = Number(id.split("-")[1]) + 1;
        const angle = seed * 2.15 + now * 0.8;
        const candidate: [number, number, number] = [
          safeSpawn[0] + Math.cos(angle) * 7.5,
          0,
          safeSpawn[2] + Math.sin(angle) * 7.5,
        ];
        const next = safeEnemySpawn(candidate, MONSTER_RADIUS);
        roamTarget.current.set(...next);
        nextRoamAt.current = now + 2.6 + seed * 0.35;
      }

      const direction = roamTarget.current.clone().sub(here).setY(0);
      if (direction.length() > 0.7) {
        direction.normalize();
        motion.copy(direction).multiplyScalar(1.8 * delta);
      }
      faceTarget = roamTarget.current;
    }

    moveWithAvoidance(here, motion, MONSTER_RADIUS, sideBias);

    group.lookAt(faceTarget.x, 1.15, faceTarget.z);
    group.rotation.x = 0;
    group.rotation.z = 0;

    group.position.y = Math.sin(now * 7.4 + sideBias) * 0.08;
  });

  if (gone) return null;

  const hpRatio = hp / PAPER_MONSTER_MAX_HP;

  return (
    <group ref={root} position={safeSpawn}>
      <mesh
        position={[0, 1.05, 0]}
        userData={{ ignoreProjectile: true }}
        castShadow
      >
        <planeGeometry args={[1.55, 1.95]} />
        <meshStandardMaterial
          ref={material}
          color={hit ? "#ff8caf" : PAPER}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
          roughness={1}
        />
        <Edges color={BLUE} threshold={3} />
      </mesh>

      <mesh
        position={[0.42, 1.72, 0.025]}
        rotation={[0, 0, -0.22]}
        userData={{ ignoreProjectile: true }}
      >
        <planeGeometry args={[0.48, 0.36]} />
        <meshBasicMaterial color={PALE} side={THREE.DoubleSide} />
        <Edges color={BLUE} threshold={3} />
      </mesh>

      <mesh position={[-0.29, 1.24, 0.035]} userData={{ ignoreProjectile: true }}>
        <circleGeometry args={[0.09, 8]} />
        <meshBasicMaterial color={BLUE} />
      </mesh>
      <mesh position={[0.29, 1.24, 0.035]} userData={{ ignoreProjectile: true }}>
        <circleGeometry args={[0.09, 8]} />
        <meshBasicMaterial color={BLUE} />
      </mesh>

      <mesh position={[0, 0.93, 0.04]} userData={{ ignoreProjectile: true }}>
        <boxGeometry args={[0.52, 0.07, 0.025]} />
        <meshBasicMaterial color={hit ? PINK : BLUE} />
      </mesh>

      {!dead && (
        <mesh
          position={[0, 1.05, 0.07]}
          userData={{ targetId: id, targetPart: "body" }}
        >
          <planeGeometry args={[1.72, 2.08]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {!dead && (
        <group position={[0, 2.18, 0.04]} userData={{ ignoreProjectile: true }}>
          <mesh>
            <planeGeometry args={[1.3, 0.06]} />
            <meshBasicMaterial color="#b7c6f5" />
          </mesh>
          <mesh
            position={[-0.65 + hpRatio * 0.65, 0, 0.01]}
            scale={[hpRatio, 1, 1]}
          >
            <planeGeometry args={[1.28, 0.045]} />
            <meshBasicMaterial color={hit ? PINK : BLUE} />
          </mesh>
        </group>
      )}

      {damagePops.map((pop, index) => (
        <Html
          key={pop.id}
          position={[0, 2.35 + index * 0.1, 0]}
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
  );
}
