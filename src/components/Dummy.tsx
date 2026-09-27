import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ARENA_HALF_SIZE } from "../game/config";
import { useGameStore } from "../game/store";

type GrenadeDetail = {
  position: [number, number, number];
  radius: number;
  damage: number;
};

export function Dummy({
  id,
  spawn,
  aggressive,
}: {
  id: string;
  spawn: [number, number, number];
  aggressive: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const [hp, setHp] = useState(100);
  const [lastPunch, setLastPunch] = useState(0);
  const [hitFlash, setHitFlash] = useState(false);
  const eliminated = useGameStore((state) => state.eliminated.includes(id));
  const damagePlayer = useGameStore((state) => state.damagePlayer);
  const eliminate = useGameStore((state) => state.eliminate);
  const screen = useGameStore((state) => state.screen);
  const drift = Number(id.split("-")[1]) % 2 === 0 ? 1 : -1;

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; damage: number }>).detail;
      if (detail.id !== id || eliminated) return;
      setHp((current) => Math.max(0, current - detail.damage));
      setHitFlash(true);
      window.setTimeout(() => setHitFlash(false), 90);
    };

    const grenadeHandler = (event: Event) => {
      const detail = (event as CustomEvent<GrenadeDetail>).detail;
      const root = group.current;
      if (!root || eliminated) return;
      const blast = new THREE.Vector3(...detail.position);
      const distance = root.position.distanceTo(blast);
      if (distance > detail.radius) return;
      const falloff = 1 - distance / detail.radius;
      const damage = Math.max(22, detail.damage * falloff);
      setHp((current) => Math.max(0, current - damage));
      setHitFlash(true);
      window.setTimeout(() => setHitFlash(false), 100);
    };

    window.addEventListener("boss-hit", handler as EventListener);
    window.addEventListener("paper-grenade-explode", grenadeHandler as EventListener);
    return () => {
      window.removeEventListener("boss-hit", handler as EventListener);
      window.removeEventListener("paper-grenade-explode", grenadeHandler as EventListener);
    };
  }, [eliminated, id]);

  useEffect(() => {
    if (hp <= 0 && !eliminated) eliminate(id);
  }, [eliminate, eliminated, hp, id]);

  useFrame((state, delta) => {
    const root = group.current;
    if (!root || eliminated || screen !== "playing") return;

    const player = new THREE.Vector3(...useGameStore.getState().playerPosition);
    const here = root.position;
    const towardPlayer = player.clone().sub(here);
    towardPlayer.y = 0;
    const distance = towardPlayer.length();
    const desired = distance > 0.001 ? towardPlayer.normalize() : new THREE.Vector3();
    const speed = aggressive ? 2.35 : 2.85;

    if (aggressive && distance < 12.5) {
      here.addScaledVector(desired, speed * delta);
      here.x += Math.sin(state.clock.elapsedTime * 1.9 + Number(id.split("-")[1])) * 0.2 * delta;
      if (distance < 1.75 && state.clock.elapsedTime - lastPunch > 1.05) {
        setLastPunch(state.clock.elapsedTime);
        damagePlayer(9);
      }
    } else if (distance < 14) {
      here.addScaledVector(desired, -speed * delta);
      here.x += Math.sin(state.clock.elapsedTime + Number(id.split("-")[1])) * 0.65 * delta * drift;
    }

    here.x = THREE.MathUtils.clamp(here.x, -ARENA_HALF_SIZE + 1.7, ARENA_HALF_SIZE - 1.7);
    here.z = THREE.MathUtils.clamp(here.z, -ARENA_HALF_SIZE + 1.7, ARENA_HALF_SIZE - 1.7);

    root.lookAt(player.x, here.y, player.z);
    root.rotation.z = Math.sin(state.clock.elapsedTime * 3 + Number(id.split("-")[1])) * 0.018;
  });

  if (eliminated) return null;

  const suitColor = hitFlash ? "#fff1a8" : "#f8f7f1";

  return (
    <group ref={group} position={spawn} userData={{ targetId: id }}>
      <mesh position={[0, 1.48, 0]} scale={[1.35, 1.05, 0.82]} castShadow userData={{ targetId: id, targetPart: "body" }}>
        <sphereGeometry args={[0.64, 14, 10]} />
        <meshStandardMaterial color={suitColor} roughness={0.95} />
        <Edges color="#171716" threshold={12} />
      </mesh>

      <mesh position={[0, 2.55, 0]} scale={[1.05, 1, 0.92]} castShadow userData={{ targetId: id, targetPart: "head" }}>
        <sphereGeometry args={[0.48, 14, 10]} />
        <meshStandardMaterial color={hitFlash ? "#ffe5a1" : "#f5d6b3"} roughness={0.95} />
        <Edges color="#171716" threshold={12} />
      </mesh>

      <mesh position={[-0.17, 2.63, 0.43]} userData={{ targetId: id, targetPart: "head" }}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color="#171716" />
      </mesh>
      <mesh position={[0.17, 2.63, 0.43]} userData={{ targetId: id, targetPart: "head" }}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color="#171716" />
      </mesh>
      <mesh position={[-0.17, 2.73, 0.44]} rotation={[0, 0, -0.3]} userData={{ targetId: id, targetPart: "head" }}>
        <boxGeometry args={[0.2, 0.035, 0.035]} />
        <meshBasicMaterial color="#171716" />
      </mesh>
      <mesh position={[0.17, 2.73, 0.44]} rotation={[0, 0, 0.3]} userData={{ targetId: id, targetPart: "head" }}>
        <boxGeometry args={[0.2, 0.035, 0.035]} />
        <meshBasicMaterial color="#171716" />
      </mesh>
      <mesh position={[0, 2.43, 0.45]} userData={{ targetId: id, targetPart: "head" }}>
        <boxGeometry args={[0.24, 0.04, 0.035]} />
        <meshBasicMaterial color="#a7473d" />
      </mesh>

      <mesh position={[0, 1.7, 0.68]} rotation={[0.06, 0, 0]} userData={{ targetId: id, targetPart: "body" }}>
        <coneGeometry args={[0.12, 0.62, 4]} />
        <meshStandardMaterial color="#ef5350" />
        <Edges color="#171716" threshold={5} />
      </mesh>

      <mesh position={[-0.82, 1.55, 0]} rotation={[0, 0, -0.18]} castShadow userData={{ targetId: id, targetPart: "body" }}>
        <capsuleGeometry args={[0.18, 0.74, 6, 8]} />
        <meshStandardMaterial color={suitColor} />
        <Edges color="#171716" threshold={10} />
      </mesh>
      <mesh position={[0.82, 1.55, 0]} rotation={[0, 0, 0.18]} castShadow userData={{ targetId: id, targetPart: "body" }}>
        <capsuleGeometry args={[0.18, 0.74, 6, 8]} />
        <meshStandardMaterial color={suitColor} />
        <Edges color="#171716" threshold={10} />
      </mesh>

      <mesh position={[-0.32, 0.47, 0]} castShadow userData={{ targetId: id, targetPart: "body" }}>
        <capsuleGeometry args={[0.2, 0.7, 6, 8]} />
        <meshStandardMaterial color="#42464d" />
        <Edges color="#171716" threshold={10} />
      </mesh>
      <mesh position={[0.32, 0.47, 0]} castShadow userData={{ targetId: id, targetPart: "body" }}>
        <capsuleGeometry args={[0.2, 0.7, 6, 8]} />
        <meshStandardMaterial color="#42464d" />
        <Edges color="#171716" threshold={10} />
      </mesh>

      <mesh position={[0, 3.28, 0]}>
        <planeGeometry args={[1.55, 0.12]} />
        <meshBasicMaterial color="#171716" />
      </mesh>
      <mesh
        position={[-0.775 + (Math.max(hp, 0) / 100) * 0.775, 3.28, 0.01]}
        scale={[Math.max(hp, 0) / 100, 1, 1]}
      >
        <planeGeometry args={[1.5, 0.075]} />
        <meshBasicMaterial color="#ef5350" />
      </mesh>
    </group>
  );
}
