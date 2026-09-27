import { Edges } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { JUNGLE_HUTS, JUNGLE_LOGS, JUNGLE_TOWERS, ZIPLINES } from "../game/levels";

const BLUE = "#2548b8";

function HutWall({ x, y, z, w, h, d, color }: {
  x: number; y: number; z: number; w: number; h: number; d: number; color: string;
}) {
  return <RigidBody type="fixed" colliders={false}>
    <CuboidCollider args={[w / 2, h / 2, d / 2]} position={[x, y, z]} />
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={1} />
      <Edges color="#513322" threshold={8} />
    </mesh>
  </RigidBody>;
}

export function JungleHuts() {
  return <>{JUNGLE_HUTS.map(([x, z], index) => <group key={index} position={[x, 0, z]}>
    <HutWall x={-2.9} y={1.75} z={0} w={0.36} h={3.5} d={5} color="#9a633a" />
    <HutWall x={2.9} y={1.75} z={0} w={0.36} h={3.5} d={5} color="#a97548" />
    <HutWall x={0} y={1.75} z={-2.4} w={6} h={3.5} d={0.36} color="#8e5938" />
    <HutWall x={-2.05} y={1.75} z={2.4} w={1.9} h={3.5} d={0.36} color="#a36a3e" />
    <HutWall x={2.05} y={1.75} z={2.4} w={1.9} h={3.5} d={0.36} color="#a36a3e" />
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[3.25, 0.16, 2.8]} position={[0, 3.7, 0]} />
      <mesh position={[0, 3.7, 0]} castShadow>
        <boxGeometry args={[6.5, 0.32, 5.6]} />
        <meshStandardMaterial color="#694630" roughness={1} />
      </mesh>
    </RigidBody>
    <mesh position={[0, 4.65, 0]} rotation={[0, Math.PI / 4, 0]} castShadow userData={{ ignoreProjectile: true }}>
      <coneGeometry args={[4.35, 1.95, 4]} />
      <meshStandardMaterial color="#65452e" roughness={1} />
    </mesh>
    <mesh position={[0, 3.12, 2.62]} userData={{ ignoreProjectile: true }}>
      <boxGeometry args={[2.5, 0.25, 0.25]} />
      <meshBasicMaterial color="#f7c96b" />
    </mesh>
    <pointLight position={[0, 2.5, 0]} color="#ffbc67" intensity={index % 2 ? 1.1 : 1.6} distance={8} />
    {[-1.6, 1.6].map((offset) => <mesh key={offset} position={[offset, 1, -2.8]} userData={{ ignoreProjectile: true }}>
      <planeGeometry args={[0.75, 0.85]} />
      <meshBasicMaterial color="#f2bc69" />
    </mesh>)}
  </group>)}</>;
}

function TreeTower({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[1.55, 3.2, 1.55]} position={[0, 3.2, 0]} />
      <mesh position={[0, 3.2, 0]} castShadow>
        <cylinderGeometry args={[1.15, 1.65, 6.4, 9]} />
        <meshStandardMaterial color="#785633" roughness={1} />
        <Edges color={BLUE} threshold={8} />
      </mesh>
    </RigidBody>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[2.8, 0.18, 2.8]} position={[0, 6.55, 0]} />
      <mesh position={[0, 6.55, 0]} receiveShadow castShadow>
        <boxGeometry args={[5.6, 0.36, 5.6]} />
        <meshStandardMaterial color="#9e6f3b" roughness={1} />
        <Edges color={BLUE} threshold={8} />
      </mesh>
    </RigidBody>
    {[-2, 2].map((offset) => <mesh key={offset} position={[offset, 7.15, 0]} userData={{ ignoreProjectile: true }}>
      <boxGeometry args={[0.12, 1, 5.6]} /><meshStandardMaterial color="#ded09b" />
    </mesh>)}
    {[[0, 8.5, 0, 3.6], [-2.4, 8.2, 1, 2.2], [2, 9, -1.1, 2.5]].map(([x, y, z, radius], i) => <mesh key={i} position={[x, y, z]} castShadow userData={{ ignoreProjectile: true }}>
      <icosahedronGeometry args={[radius, 1]} />
      <meshStandardMaterial color={i % 2 ? "#477545" : "#6a9c56"} roughness={1} />
    </mesh>)}
    <group position={[3.05, 0, 0]} userData={{ ignoreProjectile: true }}>
      {[-0.72, 0.72].map((z) => <mesh key={z} position={[0, 3.6, z]}>
        <boxGeometry args={[0.1, 7.2, 0.1]} /><meshBasicMaterial color="#e4b442" />
      </mesh>)}
      {Array.from({ length: 15 }, (_, i) => <mesh key={i} position={[0, 0.5 + i * 0.46, 0]}>
        <boxGeometry args={[0.1, 0.09, 1.5]} /><meshBasicMaterial color="#e4b442" />
      </mesh>)}
    </group>
  </group>;
}

export function JungleTowers() {
  return <>
    {JUNGLE_TOWERS.map((position, index) => <TreeTower key={index} position={position} />)}
    {ZIPLINES.map(({ from, to }, index) => {
      const a = new THREE.Vector3(...from).add(new THREE.Vector3(0, 1.3, 0));
      const b = new THREE.Vector3(...to).add(new THREE.Vector3(0, 1.3, 0));
      const delta = b.clone().sub(a);
      return <group key={index} position={a.clone().add(b).multiplyScalar(0.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize())} userData={{ ignoreProjectile: true }}>
        <mesh><cylinderGeometry args={[0.08, 0.08, delta.length(), 7]} /><meshBasicMaterial color="#ffd33d" /></mesh>
        <mesh position={[0, delta.length() * 0.35, 0]}><boxGeometry args={[0.34, 0.45, 0.34]} /><meshBasicMaterial color="#fff2a6" /></mesh>
      </group>;
    })}
  </>;
}

export function JungleLogs() {
  return <>{JUNGLE_LOGS.map((log, index) => <group key={index} position={[log.x, 0, log.z]} rotation={[0, log.angle, 0]}>
    {/* Segmented hollow bark. Both ends are open and the floor is the arena floor. */}
    {Array.from({ length: 13 }, (_, segment) => {
      const angle = Math.PI * segment / 12;
      const x = 3.05 * Math.cos(angle);
      const y = 3.05 * Math.sin(angle);
      return <RigidBody key={segment} type="fixed" colliders={false}>
        <CuboidCollider args={[0.24, 0.42, log.length / 2]} position={[x, y, 0]} rotation={[0, 0, angle]} />
        <mesh position={[x, y, 0]} rotation={[0, 0, angle]} castShadow receiveShadow>
          <boxGeometry args={[0.48, 0.84, log.length]} />
          <meshStandardMaterial color={segment % 3 ? "#765038" : "#936342"} roughness={1} />
          <Edges color="#503727" threshold={9} />
        </mesh>
      </RigidBody>;
    })}
    <mesh position={[0, 1.9, 0]} rotation={[Math.PI / 2, 0, 0]} userData={{ ignoreProjectile: true }}>
      <cylinderGeometry args={[2.25, 2.25, log.length - 0.3, 10, 1, true]} />
      <meshBasicMaterial color="#302c2c" side={THREE.BackSide} transparent opacity={0.35} />
    </mesh>
    {[-1, 1].map((side) => <group key={side} position={[0, 0, side * log.length / 2]} userData={{ ignoreProjectile: true }}>
      <mesh position={[0, 0.05, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[3.05, 0.15, 5, 18, Math.PI]} />
        <meshStandardMaterial color="#bd8a53" />
      </mesh>
    </group>)}
  </group>)}</>;
}

export function JungleUndergrowth() {
  return <>{Array.from({ length: 135 }, (_, i) => {
    const x = Math.sin(i * 17.17) * 46;
    const z = Math.cos(i * 11.83) * 46;
    if (Math.hypot(x, z - 12) < 5 || JUNGLE_HUTS.some(([hx, hz]) => Math.hypot(x - hx, z - hz) < 5)) return null;
    return <group key={i} position={[x, 0, z]} userData={{ ignoreProjectile: true }}>
      {[0, 1, 2].map((blade) => <mesh key={blade} position={[0, 0.52, 0]} rotation={[0, blade * Math.PI / 3, (blade - 1) * 0.28]}>
        <coneGeometry args={[0.24, 1.15 + (i % 3) * 0.18, 3]} />
        <meshStandardMaterial color={i % 3 ? "#4b8450" : "#81a64d"} side={THREE.DoubleSide} />
      </mesh>)}
    </group>;
  })}</>;
}
