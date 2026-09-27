import { useEffect, useMemo, useState } from "react";
import { CuboidCollider, RigidBody, TrimeshCollider } from "@react-three/rapier";
import * as THREE from "three";
import { CAVE_CENTER_Z, CAVE_WALL_RADIUS, CAVE_WALL_SEGMENTS } from "../game/levels";

const colors = ["#00f9ee", "#ea3aff", "#ffe254", "#55ff8e", "#528bff"];
const gems: [number, number, number][] = [
  [-42, 1, 5], [43, 1, -18], [-12, 1, 38], [18, 1, 37], [-38, 1, -30],
  [-23, 1, -5], [-13, 1, -15], [8, 1, -6], [18, 1, 11], [2, 1, -28],
  [25, 4, -16], [-24, 11, -12], [21, 4, 4], [-18, 13, 13], [4, 17, 18],
  [31, 4, -20], [-8, 15, 20], [12, 7, -26], [-36, 1, 24], [37, 1, 24],
];

function Crystal({ id, position }: { id: number; position: [number, number, number] }) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const handler = (event: Event) => {
      if ((event as CustomEvent<{ id: number }>).detail.id === id) setLit(true);
    };
    window.addEventListener("gem-lit", handler);
    return () => window.removeEventListener("gem-lit", handler);
  }, [id]);
  const color = colors[id % colors.length];
  return <group position={position} userData={{ gemId: id }}>
    {[0, 1, 2, 3].map((i) => <RigidBody key={i} type="fixed" colliders="hull">
      <mesh castShadow position={[(i - 1.4) * 0.8, 0.85 + (i % 2) * 0.5, (i % 2) * 0.6]} rotation={[0.15, i * 0.7, 0.15]}>
        <octahedronGeometry args={[i === 1 ? 1.35 : 0.8, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={lit ? 2.3 : 0.42} metalness={0.3} roughness={0.22} />
      </mesh>
    </RigidBody>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} userData={{ gemId: id }}>
      <ringGeometry args={[1.55, 1.82, 16]} />
      <meshBasicMaterial color={lit ? "#ffffff" : "#ffed66"} side={THREE.DoubleSide} transparent opacity={lit ? 0.25 : 0.92} />
    </mesh>
    {lit && <pointLight position={[0, 2, 0]} color={color} intensity={8} distance={19} decay={1.4} />}
  </group>;
}

function SpiralRamp() {
  return <>{Array.from({ length: CAVE_WALL_SEGMENTS }, (_, index) => {
    const a = index * Math.PI * 2 / CAVE_WALL_SEGMENTS;
    const b = (index + 1) * Math.PI * 2 / CAVE_WALL_SEGMENTS;
    const y0 = 0.28 + index * 15.8 / CAVE_WALL_SEGMENTS;
    const y1 = 0.28 + (index + 1) * 15.8 / CAVE_WALL_SEGMENTS;
    const point = (radius: number, angle: number, height: number) => [Math.sin(angle) * radius, height, CAVE_CENTER_Z + Math.cos(angle) * radius];
    const vertices = new Float32Array([
      ...point(20.5, a, y0), ...point(27, a, y0), ...point(20.5, b, y1), ...point(27, b, y1),
    ]);
    // Upward-facing triangles match the rendered walkable slope.
    const indices = new Uint32Array([0, 1, 2, 1, 3, 2]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(Array.from(indices));
    geometry.computeVertexNormals();
    return <RigidBody type="fixed" colliders={false} key={index}>
      <TrimeshCollider args={[vertices, indices]} />
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color={index % 3 === 0 ? "#70618c" : "#534663"} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      <mesh position={[Math.sin((a + b) / 2) * 23.8, (y0 + y1) / 2 - 0.12, CAVE_CENTER_Z + Math.cos((a + b) / 2) * 23.8]} userData={{ ignoreProjectile: true }}>
        <sphereGeometry args={[0.13, 5, 5]} /><meshBasicMaterial color={colors[index % colors.length]} />
      </mesh>
    </RigidBody>;
  })}
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[5, 0.2, 4.5]} position={[0, 15.95, 21]} />
      <mesh position={[0, 15.95, 21]} receiveShadow castShadow>
        <boxGeometry args={[10, 0.4, 9]} /><meshStandardMaterial color="#70618c" />
      </mesh>
    </RigidBody>
  </>;
}

function Minecart({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return <group position={[x, 0, z]} rotation={[0, rotation, 0]} userData={{ ignoreProjectile: true }}>
    {[-1, 1].map((side) => <mesh key={side} position={[side * 0.65, 0.03, 0]}><boxGeometry args={[0.08, 0.08, 8]} /><meshStandardMaterial color="#bfa98a" metalness={0.7} /></mesh>)}
    {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[0, 0, -3.5 + i]}><boxGeometry args={[1.8, 0.1, 0.24]} /><meshStandardMaterial color="#775a43" /></mesh>)}
    <mesh position={[0, 0.8, 0]}><boxGeometry args={[1.8, 0.9, 2.4]} /><meshStandardMaterial color="#82788b" metalness={0.8} roughness={0.32} /></mesh>
    {[-0.9, 0.9].map((zOffset) => [-0.92, 0.92].map((xOffset) => <mesh key={`${zOffset}-${xOffset}`} position={[xOffset, 0.31, zOffset]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.29, 0.29, 0.18, 9]} /><meshStandardMaterial color="#292532" /></mesh>))}
    <mesh position={[0, 1.3, 0]}><octahedronGeometry args={[0.7, 0]} /><meshStandardMaterial color="#00f9ee" emissive="#00f9ee" emissiveIntensity={0.45} /></mesh>
  </group>;
}

export function GemCavern() {
  const walls = useMemo(() => Array.from({ length: CAVE_WALL_SEGMENTS }, (_, i) => {
    const angle = i * Math.PI * 2 / CAVE_WALL_SEGMENTS;
    return { i, angle, x: Math.sin(angle) * CAVE_WALL_RADIUS, z: CAVE_CENTER_Z + Math.cos(angle) * CAVE_WALL_RADIUS };
  }).filter(({ i }) => i !== 0 && i !== 1 && i !== CAVE_WALL_SEGMENTS - 1), []);
  return <>
    {walls.map(({ i, angle, x, z }) => <RigidBody key={i} type="fixed" colliders={false}>
      <CuboidCollider args={[2.9, 9, 1.8]} position={[x, 9, z]} rotation={[0, angle, 0]} />
      <mesh position={[x, 9, z]} rotation={[0, angle, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.8, 18, 3.6]} />
        <meshStandardMaterial color={i % 5 === 0 ? "#493759" : "#30283f"} roughness={0.9} />
      </mesh>
      {[0, 1].map((n) => <mesh key={n} position={[x + Math.sin(angle) * 1.15, 2 + (i * 7 + n * 5) % 14, z + Math.cos(angle) * 1.15]} userData={{ ignoreProjectile: true }}>
        <octahedronGeometry args={[0.8 + n * 0.4, 0]} />
        <meshStandardMaterial color={colors[(i + n) % colors.length]} emissive={colors[(i + n) % colors.length]} emissiveIntensity={0.38} />
      </mesh>)}
    </RigidBody>)}
    <SpiralRamp />
    {gems.map((position, id) => <Crystal key={id} id={id} position={position} />)}
    <Minecart x={-12} z={-7} rotation={0.45} />
    <Minecart x={38} z={25} rotation={-0.3} />
    <Minecart x={-37} z={-31} rotation={1.2} />
    <mesh position={[0, 18, CAVE_CENTER_Z]} userData={{ ignoreProjectile: true }}>
      <torusGeometry args={[30, 1.6, 6, 36]} /><meshStandardMaterial color="#7a4b8c" emissive="#591c79" emissiveIntensity={0.4} />
    </mesh>
  </>;
}
