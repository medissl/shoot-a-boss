import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../game/store";
import { ZIPLINES } from "../game/levels";

const BLUE = "#2548b8";
const HUTS: [number, number, number][] = [
  [-20, -5, 0.18], [16, -29, -0.24], [32, 11, 0.14], [-19, 22, -0.18],
];

export function JungleHuts() {
  return <>{HUTS.map(([x, z, turn], index) => (
    <group key={index} position={[x, 0, z]} rotation={[0, turn, 0]}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[2.8, 1.8, 2.35]} position={[0, 1.8, 0]} />
        <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.6, 3.6, 4.7]} />
          <meshStandardMaterial color={index % 2 ? "#9a663a" : "#ad7747"} roughness={1} />
          <Edges color="#573a2b" threshold={8} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 4.25, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[4.35, 2.45, 4]} />
        <meshStandardMaterial color="#62482e" roughness={1} />
      </mesh>
      <mesh position={[0, 1.05, 2.37]} userData={{ ignoreProjectile: true }}>
        <planeGeometry args={[1.25, 2.1]} />
        <meshBasicMaterial color="#493529" />
      </mesh>
      {[-1.9, 1.9].map((offset) => <mesh key={offset} position={[offset, 2.25, 2.38]} userData={{ ignoreProjectile: true }}>
        <planeGeometry args={[0.7, 0.72]} />
        <meshBasicMaterial color="#f5d388" />
      </mesh>)}
      <mesh position={[0, 3.55, 2.5]} userData={{ ignoreProjectile: true }}>
        <boxGeometry args={[3.8, 0.18, 0.18]} />
        <meshBasicMaterial color="#e0ad55" />
      </mesh>
    </group>
  ))}</>;
}

const TOWERS: [number, number, number][] = [[0, 0, -8], [26, 0, 26], [-27, 0, 27]];
function TreeTower({ position, index }: { position: [number, number, number]; index: number }) {
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
    {[-2, 2].map((offset) => <mesh key={offset} position={[offset, 7.15, 0]}>
      <boxGeometry args={[0.12, 1, 5.6]} />
      <meshStandardMaterial color="#ded09b" />
    </mesh>)}
    <mesh position={[0, 7.15, -2.75]}>
      <boxGeometry args={[5.6, 1, 0.12]} />
      <meshStandardMaterial color="#ded09b" />
    </mesh>
    {[[0, 8.5, 0, 3.5], [-2.4, 8.2, 1, 2.2], [2, 9, -1.1, 2.4]].map(([x, y, z, radius], i) => <mesh key={i} position={[x, y, z]} castShadow userData={{ ignoreProjectile: true }}>
      <icosahedronGeometry args={[radius, 1]} />
      <meshStandardMaterial color={i % 2 ? "#477545" : "#6a9c56"} roughness={1} />
    </mesh>)}
    <group position={[3.05, 0, 0]}>
      {[-0.72, 0.72].map((z) => <mesh key={z} position={[0, 3.6, z]}>
        <boxGeometry args={[0.1, 7.2, 0.1]} />
        <meshBasicMaterial color="#e4b442" />
      </mesh>)}
      {Array.from({ length: 15 }, (_, i) => <mesh key={i} position={[0, 0.5 + i * 0.46, 0]}>
        <boxGeometry args={[0.1, 0.09, 1.5]} />
        <meshBasicMaterial color="#e4b442" />
      </mesh>)}
    </group>
    <mesh position={[0, 7.2, 0]} userData={{ ignoreProjectile: true }}>
      <boxGeometry args={[index === 1 ? 0.3 : 0.2, 0.35, 0.3]} />
      <meshBasicMaterial color="#ffe168" />
    </mesh>
  </group>;
}

export function JungleTowers() {
  return <>
    {TOWERS.map((position, index) => <TreeTower key={index} position={position} index={index} />)}
    {ZIPLINES.map(({ from, to }, index) => {
      const a = new THREE.Vector3(...from).add(new THREE.Vector3(0, 1.25, 0));
      const b = new THREE.Vector3(...to).add(new THREE.Vector3(0, 1.25, 0));
      const delta = b.clone().sub(a);
      return <group key={index} position={a.clone().add(b).multiplyScalar(0.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize())} userData={{ ignoreProjectile: true }}>
        <mesh><cylinderGeometry args={[0.065, 0.065, delta.length(), 7]} /><meshBasicMaterial color="#ffd33d" /></mesh>
        <mesh position={[0, delta.length() * 0.32, 0]}><boxGeometry args={[0.35, 0.55, 0.35]} /><meshBasicMaterial color="#fff2a6" /></mesh>
      </group>;
    })}
    {Array.from({ length: 56 }, (_, i) => {
      const x = Math.sin(i * 17.17) * 42;
      const z = Math.cos(i * 11.83) * 42;
      if (Math.hypot(x, z - 12) < 5 || HUTS.some(([hx, hz]) => Math.hypot(x - hx, z - hz) < 5)) return null;
      return <group key={i} position={[x, 0, z]} userData={{ ignoreProjectile: true }}>
        {[0, 1, 2].map((blade) => <mesh key={blade} position={[0, 0.52, 0]} rotation={[0, blade * Math.PI / 3, (blade - 1) * 0.28]}>
          <coneGeometry args={[0.24, 1.15 + (i % 3) * 0.18, 3]} />
          <meshStandardMaterial color={i % 3 ? "#4b8450" : "#81a64d"} side={THREE.DoubleSide} />
        </mesh>)}
      </group>;
    })}
  </>;
}

const CRYSTAL_COLORS = ["#5aeaff", "#a770ff", "#ff93d4", "#ffe37a", "#74ffbf"];
export function CrystalField() {
  return <>
    {Array.from({ length: 72 }, (_, i) => {
      const angle = i * 2.39996;
      const radius = 20 + (i % 11) * 2.7;
      const x = Math.cos(angle) * radius;
      const z = -4 + Math.sin(angle) * radius;
      if (Math.abs(x) > 46 || Math.abs(z) > 46 || Math.hypot(x, z - 12) < 4) return null;
      const color = CRYSTAL_COLORS[i % CRYSTAL_COLORS.length];
      return <group key={i} position={[x, 0, z]} rotation={[0, i * 1.13, 0]} userData={{ ignoreProjectile: true }}>
        <mesh position={[0, 0.62 + (i % 4) * 0.2, 0]} rotation={[0.12, 0, 0.18]}>
          <octahedronGeometry args={[0.6 + (i % 4) * 0.2, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} roughness={0.25} />
        </mesh>
        <mesh position={[0.55, 0.35, 0.3]} rotation={[0.35, 0, -0.15]}>
          <octahedronGeometry args={[0.42, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
        </mesh>
        {i % 9 === 0 && <pointLight color={color} intensity={2.5} distance={9} decay={2} position={[0, 2.2, 0]} />}
      </group>;
    })}
  </>;
}

export function TieredMountain({ hell = false }: { hell?: boolean }) {
  const rock = hell ? "#642120" : "#383b59";
  const edge = hell ? "#ff7340" : "#789be1";
  return <group position={[0, 0, -4]}>
    {[{ radius: 15, top: 1.5 }, { radius: 12, top: 3.2 }, { radius: 9, top: 4.9 }].map(({ radius, top }, index) => <RigidBody type="fixed" colliders={false} key={index}>
      <CuboidCollider args={[radius * 0.73, top / 2, radius * 0.73]} position={[0, top / 2, 0]} />
      <mesh position={[0, top / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius - 0.6, radius, top, 10]} />
        <meshStandardMaterial color={index % 2 ? (hell ? "#822c27" : "#484b69") : rock} roughness={1} />
        <Edges color={edge} threshold={8} />
      </mesh>
    </RigidBody>)}
    {/* Overlapping low steps make an actual walkable spiral to the upper tier. */}
    {Array.from({ length: 18 }, (_, i) => {
      const angle = -1.2 + i * 0.14;
      const radius = 21 - i * 0.72;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const top = 0.36 + i * 0.29;
      return <RigidBody type="fixed" colliders={false} key={`step-${i}`}>
        <CuboidCollider args={[2.05, top / 2, 2.05]} position={[x, top / 2, z]} />
        <mesh position={[x, top / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[4.1, top, 4.1]} />
          <meshStandardMaterial color={hell ? "#913933" : "#575e80"} roughness={1} />
          <Edges color={edge} threshold={8} />
        </mesh>
      </RigidBody>;
    })}
    {!hell && Array.from({ length: 22 }, (_, i) => {
      const angle = i * 2.4;
      const radius = 7.5 + (i % 5) * 1.3;
      const color = CRYSTAL_COLORS[i % CRYSTAL_COLORS.length];
      return <mesh key={`mountain-gem-${i}`} position={[Math.cos(angle) * radius, 1.8 + (i % 4) * 0.7, Math.sin(angle) * radius]} rotation={[0.25, angle, 0.1]} userData={{ ignoreProjectile: true }}>
        <octahedronGeometry args={[0.65 + (i % 3) * 0.2, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.3} />
      </mesh>;
    })}
    {hell && <mesh position={[0, 5.1, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ ignoreProjectile: true }}>
      <circleGeometry args={[6.5, 12]} />
      <meshBasicMaterial color="#ff5a1f" />
    </mesh>}
  </group>;
}

const RIVERS = [-24, 23];
export function HellHazards() {
  const lastLava = useRef(0);
  const lastEruption = useRef(0);
  const eruption = useRef<THREE.Group>(null);
  const crater = new THREE.Vector3(0, 5.5, -4);
  useFrame((state) => {
    if (useGameStore.getState().screen !== "playing") return;
    const time = state.clock.elapsedTime;
    const player = new THREE.Vector3(...useGameStore.getState().playerPosition);
    const inRiver = RIVERS.some((base) => Math.abs(player.x - (base + Math.sin(player.z * 0.11) * 3)) < 2.35);
    if (inRiver && time - lastLava.current > 0.55) {
      lastLava.current = time;
      useGameStore.getState().damagePlayer(9);
    }
    // First warning starts after 26s, then one eruption per 30s.
    const phase = time % 30;
    const firing = time > 22 && phase >= 26;
    const warning = time > 22 && phase >= 22 && phase < 26;
    if (eruption.current) {
      eruption.current.visible = firing || warning;
      eruption.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        if (i === 0) {
          mesh.visible = warning;
          mesh.scale.setScalar(1 + Math.sin(time * 10) * 0.09);
        } else {
          mesh.visible = firing;
          const t = ((phase - 26) * 0.48 + i * 0.19) % 1;
          const angle = i * 2.39996;
          mesh.position.set(Math.cos(angle) * t * 23, 5.5 + Math.sin(t * Math.PI) * 11, -4 + Math.sin(angle) * t * 23);
        }
      });
    }
    if (firing && time - lastEruption.current > 0.7) {
      lastEruption.current = time;
      if (Math.hypot(player.x - crater.x, player.z - crater.z) < 23 && player.y < 12) useGameStore.getState().damagePlayer(15);
    }
  });
  return <>
    {RIVERS.flatMap((base, river) => Array.from({ length: 28 }, (_, i) => {
      const z = -50 + i * 3.65;
      const x = base + Math.sin(z * 0.11) * 3;
      return <group key={`${river}-${i}`} position={[x, 0.027, z]} userData={{ ignoreProjectile: true }}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.4, 3.85]} />
          <meshBasicMaterial color={i % 3 ? "#ff6122" : "#ffbf3d"} />
        </mesh>
        {i % 3 === 0 && <pointLight color="#ff6c26" intensity={1.4} distance={8} position={[0, 1, 0]} />}
      </group>;
    }))}
    <group ref={eruption} visible={false} userData={{ ignoreProjectile: true }}>
      <mesh position={[0, 0.07, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[18, 23, 32]} />
        <meshBasicMaterial color="#ff2d24" transparent opacity={0.78} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 22 }, (_, i) => <mesh key={i}>
        <icosahedronGeometry args={[0.45 + (i % 3) * 0.23, 0]} />
        <meshBasicMaterial color={i % 2 ? "#ffb128" : "#ff3920"} />
      </mesh>)}
    </group>
    {Array.from({ length: 16 }, (_, i) => {
      const x = Math.sin(i * 11) * 44;
      const z = Math.cos(i * 13) * 43;
      return <group key={i} position={[x, 0, z]} userData={{ ignoreProjectile: true }}>
        <mesh position={[0, 2, 0]}><cylinderGeometry args={[0.28, 0.5, 4, 5]} /><meshStandardMaterial color="#401c22" /></mesh>
        <mesh position={[0, 4.3, 0]}><icosahedronGeometry args={[1.9, 0]} /><meshStandardMaterial color="#bc262e" emissive="#871620" emissiveIntensity={0.6} /></mesh>
      </group>;
    })}
  </>;
}
