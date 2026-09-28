import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { enemyMotionFactor } from "../game/effects";
import { getEnemyTuning } from "../game/levels";
import { paperBlastDamage, type PaperBlast } from "../game/hazards";
import { hasEnemyLineOfSight, moveWithAvoidance, safeEnemySpawn } from "../game/navigation";
import { useGameStore } from "../game/store";
import { ScanHalo } from "./ScanHalo";

const STATUE_PERIOD = 15;
const STATUE_WARNING = 3;
const STATUE_FIRE_SECONDS = 5;
const STATUE_RADIUS = 6.4;

export function ExtraMonster({ id, spawn, kind }: { id: string; spawn: [number, number, number]; kind: "fly" | "statue" }) {
  const root = useRef<THREE.Group>(null);
  const telegraph = useRef<THREE.Group>(null);
  const fire = useRef<THREE.Group>(null);
  const wings = useRef<(THREE.Mesh | null)[]>([]);
  const awarenessUntil = useRef(0);
  const lastAttack = useRef(0);
  const lastDamage = useRef(0);
  const lastPosition = useRef(0);
  const dive = useRef<"cruise" | "dive" | "recover">("cruise");
  const recoveryUntil = useRef(0);
  const lastSeen = useRef(new THREE.Vector3());
  const level = useGameStore((s) => s.currentLevel);
  const cycle = useGameStore((s) => s.ngPlusCycle);
  const screen = useGameStore((s) => s.screen);
  const eliminate = useGameStore((s) => s.eliminate);
  const tuning = getEnemyTuning(level, cycle);
  const effectiveLevel = level + cycle * 10;
  const index = Number(id.split("-")[1]) || 0;
  const maxHp = Math.round((kind === "statue" ? 280 : 125) * (1 + (effectiveLevel - 1) * 0.085));
  const hp = useRef(maxHp);
  const [dead, setDead] = useState(false);
  const [health, setHealth] = useState(maxHp);
  const safeSpawn = useMemo(() => safeEnemySpawn(spawn, kind === "statue" ? 1.5 : 1.7, level), [spawn, kind, level]);

  useEffect(() => {
    const onHit = (event: Event) => {
      const { id: target, damage } = (event as CustomEvent<{ id: string; damage: number }>).detail;
      if (target !== id || hp.current <= 0) return;
      hp.current = Math.max(0, hp.current - damage);
      setHealth(hp.current);
      awarenessUntil.current = performance.now() + 5600;
      lastSeen.current.set(...useGameStore.getState().playerPosition);
      if (!hp.current) { setDead(true); eliminate(id); }
    };
    window.addEventListener("boss-hit", onHit);
    return () => window.removeEventListener("boss-hit", onHit);
  }, [eliminate, id]);

  useEffect(() => {
    const blast = (event: Event) => {
      if (!root.current || dead) return;
      const { x, y, z } = root.current.position;
      const damage = paperBlastDamage((event as CustomEvent<PaperBlast>).detail, [x, y + (kind === "statue" ? 2 : 0), z]);
      if (damage) window.dispatchEvent(new CustomEvent("boss-hit", { detail: { id, damage, part: "body" } }));
    };
    window.addEventListener("paper-grenade-explode", blast);
    return () => window.removeEventListener("paper-grenade-explode", blast);
  }, [dead, id, kind]);

  useFrame((state, delta) => {
    const mesh = root.current;
    if (!mesh) return;
    if (dead) { mesh.visible = false; return; }
    const live = useGameStore.getState();
    if (screen !== "playing" || live.tutorialOpen) {
      if (telegraph.current) telegraph.current.visible = false;
      if (fire.current) fire.current.visible = false;
      return;
    }
    const now = state.clock.elapsedTime;
    const motion = enemyMotionFactor(id, live.runId);
    const [px, py, pz] = live.playerPosition;

    if (kind === "fly") {
      if (motion <= 0) return;
      const player = new THREE.Vector3(px, py, pz);
      const flatDistance = Math.hypot(px - mesh.position.x, pz - mesh.position.z);
      const seesPlayer = flatDistance < 43 * tuning.vision &&
        hasEnemyLineOfSight(mesh.position, player, level, 0.3);
      if (seesPlayer) {
        awarenessUntil.current = performance.now() + 5600;
        lastSeen.current.copy(player);
      }
      const hunting = seesPlayer || performance.now() < awarenessUntil.current;
      const target = seesPlayer ? player : lastSeen.current;
      if (hunting) {
        const direction = new THREE.Vector3(target.x - mesh.position.x, 0, target.z - mesh.position.z);
        const distance = direction.length();
        if (dive.current === "recover" && now >= recoveryUntil.current && mesh.position.y > py + 4.3) dive.current = "cruise";
        if (dive.current === "cruise" && seesPlayer && distance < 8 && now - lastAttack.current > Math.max(2.1, 3.9 - effectiveLevel * 0.09)) dive.current = "dive";
        const desiredDistance = dive.current === "dive" ? 1.6 : 3.8;
        if (distance > desiredDistance) {
          const stride = direction.normalize().multiplyScalar(Math.min(distance - desiredDistance, (3.4 + effectiveLevel * 0.16) * tuning.speed * motion * delta));
          moveWithAvoidance(mesh.position, stride, 1.7, index % 2 ? -1 : 1, level, true);
        }
        const cruiseHeight = THREE.MathUtils.clamp(target.y + 5.3, 5.3, 22);
        const attackHeight = target.y + 1.5;
        mesh.position.y = THREE.MathUtils.damp(mesh.position.y, dive.current === "dive" ? attackHeight : cruiseHeight + Math.sin(now * 3 + index) * 0.22, (dive.current === "dive" ? 4.2 : 2.5) * motion, delta);
      } else {
        mesh.position.y = THREE.MathUtils.damp(mesh.position.y, 5.2 + Math.sin(now * 2 + index) * 0.5, 1.4, delta);
      }
      mesh.rotation.y = THREE.MathUtils.damp(mesh.rotation.y, Math.atan2(px - mesh.position.x, pz - mesh.position.z), 4, delta);
      wings.current.forEach((wing, side) => { if (wing) wing.rotation.z = (side ? 1 : -1) * (0.35 + Math.sin(now * 12) * 0.32); });
      if (now - lastPosition.current > 0.14) {
        lastPosition.current = now;
        live.setEnemyPosition(id, [mesh.position.x, mesh.position.y, mesh.position.z]);
      }
      if (dive.current === "dive" && seesPlayer && flatDistance < 2.8 && Math.abs(py + 1.5 - mesh.position.y) < 0.8) {
        lastAttack.current = now;
        dive.current = "recover";
        recoveryUntil.current = now + 1.1;
        live.damagePlayer(Math.round(11 * tuning.damage), [mesh.position.x, mesh.position.y, mesh.position.z]);
      }
      return;
    }

    if (now - lastPosition.current > 1) {
      lastPosition.current = now;
      live.setEnemyPosition(id, [mesh.position.x, 2.3, mesh.position.z]);
    }
    const shifted = now + index * 2.4;
    const phase = shifted % STATUE_PERIOD;
    const started = shifted >= STATUE_PERIOD;
    const warning = phase >= STATUE_PERIOD - STATUE_WARNING;
    const active = started && phase < STATUE_FIRE_SECONDS;
    if (telegraph.current) {
      telegraph.current.visible = warning && motion > 0;
      const material = (telegraph.current.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      const timeToFire = STATUE_PERIOD - phase;
      const blink = 4 + (1 - timeToFire / STATUE_WARNING) * 25;
      material.opacity = 0.3 + 0.47 * Math.abs(Math.sin(now * blink));
    }
    if (fire.current) {
      fire.current.visible = active && motion > 0;
      if (active) fire.current.children.slice(1).forEach((flame, i) => {
        flame.scale.y = 0.7 + Math.sin(now * 11 + i * 2.1) * 0.27;
        flame.rotation.y = Math.sin(now * 5 + i) * 0.25;
      });
    }
    if (active && motion > 0 && py < 5.2 && Math.hypot(px - mesh.position.x, pz - mesh.position.z) < STATUE_RADIUS && now - lastDamage.current >= 0.75) {
      lastDamage.current = now;
      live.damagePlayer(Math.round(7 * tuning.damage), [mesh.position.x, 1, mesh.position.z]);
    }
  });

  return <group ref={root} position={[safeSpawn[0], kind === "fly" ? 5.2 : 0, safeSpawn[2]]}>
    {kind === "fly" ? <>
      <mesh userData={{ targetId: id, targetPart: "body" }} castShadow><icosahedronGeometry args={[1.2, 1]} /><meshStandardMaterial color="#8558dc" emissive="#402379" emissiveIntensity={0.35} /></mesh>
      <mesh position={[0, 0.18, 0.88]} userData={{ targetId: id, targetPart: "head" }}><sphereGeometry args={[0.48, 12, 8]} /><meshBasicMaterial color="#f7eaf6" /></mesh>
      {[-1, 1].map((side, i) => <mesh key={side} ref={(node) => { wings.current[i] = node; }} position={[side * 1.25, 0, 0]} userData={{ targetId: id, targetPart: "body" }}><coneGeometry args={[0.7, 2.1, 3]} /><meshStandardMaterial color="#c69cf1" side={THREE.DoubleSide} /></mesh>)}
      {[-0.38, 0.38].map((x) => <mesh key={x} position={[x, -1.35, 0.42]} rotation={[Math.PI, 0, 0]} userData={{ targetId: id, targetPart: "leg" }}>
        <coneGeometry args={[0.28, 0.86, 4]} /><meshBasicMaterial color="#e8eefc" />
      </mesh>)}
    </> : <>
      <mesh position={[0, 0.7, 0]} castShadow userData={{ targetId: id, targetPart: "leg" }}><cylinderGeometry args={[1.2, 1.4, 1.4, 7]} /><meshStandardMaterial color="#737884" roughness={0.9} /></mesh>
      <mesh position={[0, 2.1, 0]} castShadow userData={{ targetId: id, targetPart: "body" }}><boxGeometry args={[2.5, 2.2, 1.8]} /><meshStandardMaterial color="#8e94aa" roughness={0.8} /></mesh>
      <mesh position={[0, 3.6, 0]} castShadow userData={{ targetId: id, targetPart: "head" }}><dodecahedronGeometry args={[0.91, 0]} /><meshBasicMaterial color="#d1cad1" /></mesh>
      <mesh position={[0, 3.65, 0.7]} userData={{ ignoreProjectile: true }}><boxGeometry args={[0.85, 0.15, 0.22]} /><meshBasicMaterial color="#ed5f61" /></mesh>
    </>}
    {kind === "statue" && <>
      <group ref={telegraph} visible={false} position={[0, 0.08, 0]} userData={{ ignoreProjectile: true }}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[STATUE_RADIUS, 32]} /><meshBasicMaterial color="#f33b4d" side={THREE.DoubleSide} transparent opacity={0.4} depthWrite={false} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[STATUE_RADIUS - 0.3, STATUE_RADIUS, 32]} /><meshBasicMaterial color="#fc5c65" side={THREE.DoubleSide} /></mesh>
      </group>
      <group ref={fire} visible={false} userData={{ ignoreProjectile: true }}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}><circleGeometry args={[STATUE_RADIUS, 32]} /><meshBasicMaterial color="#e84655" side={THREE.DoubleSide} transparent opacity={0.42} depthWrite={false} /></mesh>
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const radius = i % 3 ? 4.7 : 2.8;
          return <mesh key={i} position={[Math.cos(angle) * radius, 0.95, Math.sin(angle) * radius]} rotation={[0, 0, Math.sin(i) * 0.18]}>
            <coneGeometry args={[0.48, 1.9 + (i % 3) * 0.35, 5]} /><meshBasicMaterial color={i % 3 ? "#ff443a" : "#ff9158"} transparent opacity={0.88} depthWrite={false} />
          </mesh>;
        })}
      </group>
    </>}
    <group position={[0, kind === "fly" ? 1.65 : 4.7, 0]} userData={{ ignoreProjectile: true }}>
      <mesh scale={[Math.max(0.04, health / maxHp), 1, 1]}><boxGeometry args={[1.8, 0.09, 0.08]} /><meshBasicMaterial color="#fa5964" /></mesh>
    </group>
    <ScanHalo id={id} size={kind === "fly" ? 1.3 : 2.8} />
  </group>;
}
