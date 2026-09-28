import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, CylinderCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { HELL_MOUNTAIN_RADIUS } from "../game/levels";
import { useGameStore } from "../game/store";

const bridgeZ = [-36, -18, 0, 18, 36];
const bridgeX = [-24, 23, -24, 23, -24];
const lavaX = [-24, 23];

type Impact = { x: number; z: number; radius: number };
function impactsFor(cycle: number): Impact[] {
  return Array.from({ length: 5 }, (_, i) => {
    let x = Math.sin(cycle * 91.3 + i * 7.9) * 41;
    let z = Math.cos(cycle * 37.7 + i * 8.3) * 41;
    if (Math.hypot(x, z + 4) < 28) { x = x < 0 ? x - 24 : x + 24; z += z < -4 ? -12 : 12; }
    return { x: THREE.MathUtils.clamp(x, -43, 43), z: THREE.MathUtils.clamp(z, -43, 43), radius: 5.2 + (i % 3) };
  });
}

export function HellMountain() {
  return <>
    <RigidBody type="fixed" colliders={false}>
      <CylinderCollider args={[11, HELL_MOUNTAIN_RADIUS]} position={[0, 11, -4]} />
      <mesh position={[0, 11, -4]} castShadow receiveShadow>
        <cylinderGeometry args={[HELL_MOUNTAIN_RADIUS + 0.3, HELL_MOUNTAIN_RADIUS + 0.3, 22, 18]} />
        <meshStandardMaterial color="#702023" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 22.1, -4]} userData={{ ignoreProjectile: true }}>
        <torusGeometry args={[16, 2.2, 5, 18]} />
        <meshStandardMaterial color="#a23427" emissive="#841807" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 22.25, -4]} rotation={[-Math.PI / 2, 0, 0]} userData={{ ignoreProjectile: true }}>
        <circleGeometry args={[16, 18]} /><meshBasicMaterial color="#ff6324" side={THREE.DoubleSide} />
      </mesh>
    </RigidBody>
    {Array.from({ length: 22 }, (_, i) => {
      const angle = i * 2.399;
      const radius = 28 + (i % 4) * 5;
      const x = Math.cos(angle) * radius;
      const z = -4 + Math.sin(angle) * radius;
      if (Math.abs(x) > 45 || Math.abs(z) > 45 || lavaX.some((river) => Math.abs(x - river) < 5)) return null;
      return <group key={i} position={[x, 0, z]} userData={{ ignoreProjectile: true }}>
        <mesh position={[0, 2.2, 0]} castShadow><cylinderGeometry args={[0.45, 0.8, 4.4, 6]} /><meshStandardMaterial color="#571b20" /></mesh>
        {[[-1, 4.1, 0], [1, 4.7, 0], [0, 5.4, 0]].map(([a, b, c], k) => <mesh key={k} position={[a, b, c]} castShadow><icosahedronGeometry args={[1.5 + k * 0.2, 0]} /><meshStandardMaterial color={k % 2 ? "#af292a" : "#e1422d"} /></mesh>)}
      </group>;
    })}
  </>;
}

export function HellHazards() {
  const markerRefs = useRef<(THREE.Group | null)[]>([]);
  const burstRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lastDamage = useRef(0);
  const notice = useRef("");
  const gameTime = useRef(0);
  const playerPosition = useGameStore((state) => state.playerPosition);
  const screen = useGameStore((state) => state.screen);
  const impacts = useMemo(() => Array.from({ length: 5 }, () => ({ x: 0, z: 0, radius: 0 } as Impact)), []);
  useFrame((_, delta) => {
    if (screen !== "playing" || useGameStore.getState().tutorialOpen) {
      markerRefs.current.forEach((marker) => { if (marker) marker.visible = false; });
      burstRefs.current.forEach((mesh) => { if (mesh) mesh.visible = false; });
      return;
    }
    gameTime.current += Math.min(delta, 0.1);
    const t = gameTime.current;
    const cycle = Math.max(0, Math.floor((t - 10) / 10));
    const phase = t < 10 ? -1 : (t - 10) % 10;
    const message = phase < 0 ? `VOLCANO WARNING IN ${Math.ceil(10 - t)}S · USE STONE BRIDGES`
      : phase < 4 ? `LAVA STRIKES IN ${Math.ceil(4 - phase)}S · DODGE RED CIRCLES`
        : phase < 7.1 ? `LAVA STRIKES ACTIVE · ${Math.ceil(7.1 - phase)}S LEFT`
          : `NEXT ERUPTION IN ${Math.ceil(10 - phase)}S · RIVERS BURN`;
    if (message !== notice.current) {
      notice.current = message;
      window.dispatchEvent(new CustomEvent("map-hazard-notice", { detail: { message } }));
    }
    const positions = impactsFor(cycle);
    for (let i = 0; i < 5; i++) {
      const marker = markerRefs.current[i];
      if (marker) {
        marker.position.set(positions[i].x, 0.08, positions[i].z);
        marker.scale.setScalar(positions[i].radius);
        marker.visible = phase >= 0 && phase < 7.1;
        ((marker.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = phase < 4 ? 0.35 + Math.sin(t * 12) * 0.14 : 0.85;
      }
      for (let j = 0; j < 9; j++) {
        const mesh = burstRefs.current[i * 9 + j];
        if (!mesh) continue;
        mesh.visible = phase >= 4 && phase < 7.1;
        const travel = Math.min(1, Math.max(0, (phase - 4) / 1.35));
        const spread = (j - 4) * 0.43;
        mesh.position.set(positions[i].x * travel + Math.sin(j * 13) * spread, 22 + Math.sin(travel * Math.PI) * 16 - travel * 21, -4 + (positions[i].z + 4) * travel + Math.cos(j * 7) * spread);
        mesh.scale.setScalar(0.55 + (j % 3) * 0.2);
      }
    }
    if (t - lastDamage.current < 0.65) return;
    const [px, py, pz] = playerPosition;
    const inRiver = lavaX.some((x) => Math.abs(px - (x + Math.sin(pz * 0.11) * 0.65)) < 2.45 && py < 1.9 && !bridgeZ.some((z, i) => bridgeX[i] === x && Math.abs(pz - z) < 2.65));
    const inImpact = phase >= 4 && phase < 7.1 && positions.some(({ x, z, radius }) => Math.hypot(px - x, pz - z) < radius && py < 4);
    if (inRiver || inImpact) {
      const source = inImpact ? positions.find(({ x, z, radius }) => Math.hypot(px - x, pz - z) < radius) : null;
      useGameStore.getState().damagePlayer(inImpact ? 14 : 7, [source?.x ?? lavaX.reduce((a, b) => Math.abs(px - a) < Math.abs(px - b) ? a : b), 0, source?.z ?? pz]);
      lastDamage.current = t;
    }
  });
  return <>
    {lavaX.map((x) => <group key={x} userData={{ ignoreProjectile: true }}>
      <mesh position={[x, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 98]} /><meshBasicMaterial color="#ff5615" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[x, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 98]} /><meshBasicMaterial color="#ffc037" transparent opacity={0.38} />
      </mesh>
    </group>)}
    {bridgeZ.map((z, i) => <RigidBody type="fixed" colliders={false} key={i}>
      <CuboidCollider args={[5.8, 0.2, 2.5]} position={[bridgeX[i], 0.24, z]} />
      <mesh position={[bridgeX[i], 0.24, z]} castShadow receiveShadow>
        <boxGeometry args={[11.6, 0.4, 5]} /><meshStandardMaterial color="#92867c" roughness={1} />
      </mesh>
      {[-4, 0, 4].map((offset) => <mesh key={offset} position={[bridgeX[i] + offset, 0.46, z]} userData={{ ignoreProjectile: true }}>
        <boxGeometry args={[0.13, 0.08, 5]} /><meshStandardMaterial color="#554b46" />
      </mesh>)}
    </RigidBody>)}
    {impacts.slice(0, 5).map((_, i) => <group key={i} ref={(node) => { markerRefs.current[i] = node; }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1, 24]} /><meshBasicMaterial color="#ff3615" transparent opacity={0.4} depthWrite={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}><ringGeometry args={[0.8, 1, 24]} /><meshBasicMaterial color="#ffdf40" side={THREE.DoubleSide} /></mesh>
    </group>)}
    {Array.from({ length: 45 }, (_, i) => <mesh key={i} ref={(node) => { burstRefs.current[i] = node; }} userData={{ ignoreProjectile: true }}>
      <icosahedronGeometry args={[1.15, 0]} /><meshBasicMaterial color={i % 3 ? "#ff781f" : "#ffdd4a"} />
    </mesh>)}
    <pointLight position={[0, 24, -4]} color="#ff5c22" intensity={11} distance={55} />
  </>;
}
