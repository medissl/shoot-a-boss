import { Edges } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { ARENA_HALF_SIZE, ARENA_OBSTACLES } from "../game/config";

const BLUE = "#2548b8";
const PAPER = "#fbfaf4";
const PALE_BLUE = "#e7ecff";
const ORANGE = "#d77b16";

function DoodleBox({
  position,
  scale,
  color = PAPER,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color?: string;
}) {
  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CuboidCollider args={[scale[0] / 2, scale[1] / 2, scale[2] / 2]} />
      <mesh scale={scale} castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color={color} roughness={1} />
        <Edges color={BLUE} threshold={10} />
      </mesh>
    </RigidBody>
  );
}

function PaperTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 2.1, 7]} />
        <meshStandardMaterial color={PAPER} />
        <Edges color={BLUE} threshold={12} />
      </mesh>
      <mesh position={[0, 2.55, 0]} castShadow>
        <coneGeometry args={[1.2, 2.7, 5]} />
        <meshStandardMaterial color={PALE_BLUE} />
        <Edges color={BLUE} threshold={12} />
      </mesh>
      <mesh position={[0.2, 3.05, 0.2]} rotation={[0.4, 0.2, 0.2]}>
        <planeGeometry args={[0.72, 0.45]} />
        <meshBasicMaterial color={PAPER} side={THREE.DoubleSide} />
        <Edges color={BLUE} threshold={4} />
      </mesh>
    </group>
  );
}

function FilingCabinet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <DoodleBox position={[0, 1.3, 0]} scale={[2.2, 2.6, 1.45]} color={PAPER} />
      {[0.65, 1.3, 1.95].map((y, index) => (
        <group key={y}>
          <mesh position={[0, y, 0.735]}>
            <planeGeometry args={[1.72, 0.48]} />
            <meshBasicMaterial color={index % 2 ? PALE_BLUE : PAPER} />
            <Edges color={BLUE} threshold={4} />
          </mesh>
          <mesh position={[0, y, 0.75]}>
            <boxGeometry args={[0.34, 0.06, 0.03]} />
            <meshBasicMaterial color={BLUE} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GiantCoffee({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="hull" position={position}>
      <group>
        <mesh position={[0, 1.15, 0]} castShadow>
          <cylinderGeometry args={[1.4, 1.15, 2.3, 16]} />
          <meshStandardMaterial color={PAPER} roughness={1} />
          <Edges color={BLUE} threshold={8} />
        </mesh>
        <mesh position={[1.42, 1.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.65, 0.16, 8, 18]} />
          <meshStandardMaterial color={PAPER} />
          <Edges color={BLUE} threshold={8} />
        </mesh>
        <mesh position={[0, 2.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.15, 24]} />
          <meshBasicMaterial color={ORANGE} />
        </mesh>
      </group>
    </RigidBody>
  );
}

function DeskCluster({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <DoodleBox position={[0, 0.72, 0]} scale={[4.2, 0.18, 1.6]} color={PAPER} />
      <DoodleBox position={[-1.55, 0.35, 0]} scale={[0.18, 0.7, 1.35]} color={PALE_BLUE} />
      <DoodleBox position={[1.55, 0.35, 0]} scale={[0.18, 0.7, 1.35]} color={PALE_BLUE} />
      <mesh position={[0, 1.34, -0.15]} rotation={[0, 0, -0.03]}>
        <planeGeometry args={[1.45, 0.9]} />
        <meshBasicMaterial color={PALE_BLUE} />
        <Edges color={BLUE} threshold={4} />
      </mesh>
    </group>
  );
}

function PaperStack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {Array.from({ length: 6 }, (_, index) => (
        <mesh
          key={index}
          position={[index % 2 ? 0.07 : -0.05, index * 0.085, 0]}
          rotation={[0, index % 2 ? 0.04 : -0.03, index % 3 ? 0.015 : -0.02]}
        >
          <boxGeometry args={[1.25, 0.08, 0.9]} />
          <meshBasicMaterial color={index % 2 ? PALE_BLUE : PAPER} />
          <Edges color={BLUE} threshold={3} />
        </mesh>
      ))}
    </group>
  );
}

function DreamDome() {
  return (
    <group position={[0, -4.5, 0]}>
      <mesh>
        <sphereGeometry args={[57, 22, 11, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color={BLUE}
          wireframe
          transparent
          opacity={0.13}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function Arena() {
  const size = ARENA_HALF_SIZE * 2;

  return (
    <>
      <color attach="background" args={[PAPER]} />
      <fog attach="fog" args={[PAPER, 58, 122]} />
      <hemisphereLight intensity={1.65} color="#ffffff" groundColor="#dce2f4" />
      <directionalLight
        castShadow
        position={[18, 27, 12]}
        intensity={1.75}
        color="#ffffff"
        shadow-mapSize={[1024, 1024]}
      />

      <DreamDome />

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[ARENA_HALF_SIZE, 0.2, ARENA_HALF_SIZE]} position={[0, -0.2, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[size, size, 26, 26]} />
          <meshStandardMaterial color={PAPER} roughness={1} />
        </mesh>
        <gridHelper args={[size, 38, BLUE, "#9daee9"]} position={[0, 0.012, 0]} />
      </RigidBody>

      <DoodleBox position={[0, 2.5, -ARENA_HALF_SIZE]} scale={[size, 5, 0.7]} />
      <DoodleBox position={[0, 2.5, ARENA_HALF_SIZE]} scale={[size, 5, 0.7]} />
      <DoodleBox position={[-ARENA_HALF_SIZE, 2.5, 0]} scale={[0.7, 5, size]} />
      <DoodleBox position={[ARENA_HALF_SIZE, 2.5, 0]} scale={[0.7, 5, size]} />

      {ARENA_OBSTACLES.map((obstacle, index) => (
        <DoodleBox
          key={index}
          position={[obstacle.x, obstacle.h / 2, obstacle.z]}
          scale={[obstacle.w, obstacle.h, obstacle.d]}
          color={obstacle.color === "blue" ? PALE_BLUE : PAPER}
        />
      ))}

      <FilingCabinet position={[-34, 0, 13]} />
      <FilingCabinet position={[32, 0, -18]} />
      <FilingCabinet position={[18, 0, 31]} />
      <GiantCoffee position={[3, 0, -34]} />

      <DeskCluster position={[-4, 0, 12]} rotation={0.12} />
      <DeskCluster position={[10, 0, 4]} rotation={-0.3} />
      <DeskCluster position={[-24, 0, -22]} rotation={0.46} />
      <DeskCluster position={[25, 0, -27]} rotation={-0.4} />

      <PaperStack position={[-8, 0.08, 7]} />
      <PaperStack position={[19, 0.08, 21]} />
      <PaperStack position={[-26, 0.08, 29]} />

      <PaperTree position={[-34, 0, -18]} />
      <PaperTree position={[-9, 0, 20]} />
      <PaperTree position={[8, 0, 34]} />
      <PaperTree position={[34, 0, 13]} />
      <PaperTree position={[26, 0, 32]} />
      <PaperTree position={[-33, 0, 33]} />
      <PaperTree position={[33, 0, -34]} />
    </>
  );
}
