import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { getEnemyTuning } from "../game/levels";
import { enemyMotionFactor } from "../game/effects";
import { safeEnemySpawn } from "../game/navigation";
import { hasEnemyLineOfSight } from "../game/navigation";
import { useGameStore } from "../game/store";
import { ScanHalo } from "./ScanHalo";

export function ExtraMonster({ id, spawn, kind }: { id: string; spawn: [number, number, number]; kind: "fly" | "statue" }) {
  const root = useRef<THREE.Group>(null);
  const telegraph = useRef<THREE.Group>(null);
  const lastAttack = useRef(0);
  const warningUntil = useRef(0);
  const attackTarget = useRef<[number, number, number]>([0, 0, 0]);
  const lastRetarget = useRef(0);
  const orbitAngle = useRef(id.length * 0.43 + (Number(id.split("-")[1]) || 0));
  const level = useGameStore((s) => s.currentLevel);
  const cycle = useGameStore((s) => s.ngPlusCycle);
  const screen = useGameStore((s) => s.screen);
  const eliminate = useGameStore((s) => s.eliminate);
  const tuning = getEnemyTuning(level, cycle);
  const maxHp = Math.round((kind === "statue" ? 280 : 125) * (1 + (level + cycle * 10 - 1) * 0.085));
  const hp = useRef(maxHp);
  const [dead, setDead] = useState(false);
  const [health, setHealth] = useState(maxHp);
  const safeSpawn = useMemo(() => safeEnemySpawn(spawn, kind === "statue" ? 1.5 : 1, level), [spawn, kind, level]);

  useEffect(() => {
    const onHit = (event: Event) => {
      const { id: target, damage } = (event as CustomEvent<{ id: string; damage: number }>).detail;
      if (target !== id || hp.current <= 0) return;
      hp.current = Math.max(0, hp.current - damage);
      setHealth(hp.current);
      if (!hp.current) { setDead(true); eliminate(id); }
    };
    window.addEventListener("boss-hit", onHit);
    return () => window.removeEventListener("boss-hit", onHit);
  }, [eliminate, id]);

  useFrame((state, delta) => {
    const mesh = root.current;
    if (!mesh) return;
    if (dead) { mesh.visible = false; return; }
    const live = useGameStore.getState();
    if (screen !== "playing" || live.tutorialOpen) return;
    const motion = enemyMotionFactor(id, live.runId);
    if (motion <= 0) { if (telegraph.current) telegraph.current.visible = false; return; }
    const [px, py, pz] = live.playerPosition;
    const now = state.clock.elapsedTime;
    if (kind === "fly") {
      // Hover near a fixed anchor: a flying target cannot vanish into cave walls or beyond bounds.
      orbitAngle.current += delta * motion * (0.4 + tuning.speed * 0.13);
      const [sx, , sz] = safeSpawn;
      mesh.position.set(sx + Math.sin(orbitAngle.current) * 3.2, 5.7 + Math.sin(now * 2 + orbitAngle.current) * 1.3, sz + Math.cos(orbitAngle.current) * 3.2);
      mesh.rotation.y = Math.atan2(px - mesh.position.x, pz - mesh.position.z);
      if (now - lastRetarget.current > 0.2) {
        lastRetarget.current = now;
        live.setEnemyPosition(id, [mesh.position.x, mesh.position.y, mesh.position.z]);
      }
      if (Math.hypot(px - mesh.position.x, pz - mesh.position.z) < 25 * tuning.vision && hasEnemyLineOfSight(mesh.position, new THREE.Vector3(px, py, pz), level) && now - lastAttack.current > 3.8 / Math.min(1.7, tuning.speed)) {
        lastAttack.current = now;
        warningUntil.current = now + 0.75;
        attackTarget.current = [px, py, pz];
      }
      if (warningUntil.current && now >= warningUntil.current) {
        warningUntil.current = 0;
        if (Math.hypot(px - attackTarget.current[0], pz - attackTarget.current[2]) < 3.2 && py < 7) live.damagePlayer(Math.round(7 * tuning.damage), [mesh.position.x, mesh.position.y, mesh.position.z]);
      }
    } else {
      if (now - lastRetarget.current > 0.8) {
        lastRetarget.current = now;
        live.setEnemyPosition(id, [mesh.position.x, 2.3, mesh.position.z]);
      }
      if (Math.hypot(px - mesh.position.x, pz - mesh.position.z) < 11 * tuning.vision && hasEnemyLineOfSight(mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), new THREE.Vector3(px, py, pz), level) && now - lastAttack.current > 4.4 / Math.min(1.7, tuning.speed)) {
        lastAttack.current = now;
        warningUntil.current = now + 1.25;
      }
      if (warningUntil.current && now >= warningUntil.current) {
        warningUntil.current = 0;
        if (Math.hypot(px - mesh.position.x, pz - mesh.position.z) < 7.5 && py < 5.5) live.damagePlayer(Math.round(14 * tuning.damage), [mesh.position.x, 2.3, mesh.position.z]);
      }
    }
    if (telegraph.current) {
      telegraph.current.visible = warningUntil.current > now;
      if (kind === "fly") {
        telegraph.current.position.set(attackTarget.current[0] - mesh.position.x, -mesh.position.y + 0.1, attackTarget.current[2] - mesh.position.z);
        telegraph.current.scale.set(3.2, 1, 3.2);
      } else {
        telegraph.current.position.set(0, 0.1, 0);
        telegraph.current.scale.set(7.2, 1, 7.2);
      }
    }
  });

  return <group ref={root} position={[safeSpawn[0], kind === "fly" ? 6 : 0, safeSpawn[2]]}>
    {kind === "fly" ? <>
      <mesh userData={{ targetId: id, targetPart: "body" }} castShadow><icosahedronGeometry args={[1.2, 1]} /><meshStandardMaterial color="#8558dc" emissive="#402379" emissiveIntensity={0.35} /></mesh>
      <mesh position={[0, 0.18, 0.88]} userData={{ targetId: id, targetPart: "head" }}><sphereGeometry args={[0.48, 12, 8]} /><meshStandardMaterial color="#ffda6b" emissive="#e4722d" emissiveIntensity={0.5} /></mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 1.25, 0, 0]} rotation={[0, 0, side * 0.35]} userData={{ targetId: id, targetPart: "body" }}><coneGeometry args={[0.7, 2.1, 3]} /><meshStandardMaterial color="#c69cf1" side={THREE.DoubleSide} /></mesh>)}
    </> : <>
      <mesh position={[0, 0.7, 0]} castShadow userData={{ targetId: id, targetPart: "leg" }}><cylinderGeometry args={[1.2, 1.4, 1.4, 7]} /><meshStandardMaterial color="#737884" roughness={0.9} /></mesh>
      <mesh position={[0, 2.1, 0]} castShadow userData={{ targetId: id, targetPart: "body" }}><boxGeometry args={[2.5, 2.2, 1.8]} /><meshStandardMaterial color="#8e94aa" roughness={0.8} /></mesh>
      <mesh position={[0, 3.6, 0]} castShadow userData={{ targetId: id, targetPart: "head" }}><dodecahedronGeometry args={[0.91, 0]} /><meshStandardMaterial color="#d1cad1" roughness={0.7} /></mesh>
      <mesh position={[0, 3.65, 0.7]} userData={{ ignoreProjectile: true }}><boxGeometry args={[0.85, 0.15, 0.22]} /><meshBasicMaterial color="#ff8d3e" /></mesh>
    </>}
    <group ref={telegraph} visible={false} userData={{ ignoreProjectile: true }} position={[0, kind === "fly" ? 1.9 : 4.8, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.65, 1, 18]} /><meshBasicMaterial color="#ff5238" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.15, 0]}><octahedronGeometry args={[0.12, 0]} /><meshBasicMaterial color="#ffcb36" /></mesh>
    </group>
    <group position={[0, kind === "fly" ? 1.65 : 4.7, 0]} userData={{ ignoreProjectile: true }}>
      <mesh scale={[Math.max(0.04, health / maxHp), 1, 1]}><boxGeometry args={[1.8, 0.09, 0.08]} /><meshBasicMaterial color="#fa5964" /></mesh>
    </group>
    <ScanHalo id={id} size={kind === "fly" ? 1.3 : 2.8} />
  </group>;
}
