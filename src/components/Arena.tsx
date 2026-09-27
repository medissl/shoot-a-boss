import { Edges } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { ARENA_HALF_SIZE } from "../game/config";

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

function DreamDome() {
  return (
    <group position={[0, -3.8, 0]}>
      <mesh>
        <sphereGeometry args={[43, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color={BLUE}
          wireframe
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function Arena() {
  return (
    <>
      <color attach="background" args={[PAPER]} />
      <fog attach="fog" args={[PAPER, 42, 88]} />
      <hemisphereLight intensity={1.65} color="#ffffff" groundColor="#dce2f4" />
      <directionalLight
        castShadow
        position={[12, 22, 8]}
        intensity={1.75}
        color="#ffffff"
        shadow-mapSize={[1024, 1024]}
      />

      <DreamDome />

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[ARENA_HALF_SIZE, 0.2, ARENA_HALF_SIZE]} position={[0, -0.2, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[ARENA_HALF_SIZE * 2, ARENA_HALF_SIZE * 2, 20, 20]} />
          <meshStandardMaterial color={PAPER} roughness={1} />
        </mesh>
        <gridHelper
          args={[ARENA_HALF_SIZE * 2, 28, BLUE, "#9daee9"]}
          position={[0, 0.012, 0]}
        />
      </RigidBody>

      <DoodleBox position={[0, 2.2, -ARENA_HALF_SIZE]} scale={[56, 4.4, 0.7]} />
      <DoodleBox position={[0, 2.2, ARENA_HALF_SIZE]} scale={[56, 4.4, 0.7]} />
      <DoodleBox position={[-ARENA_HALF_SIZE, 2.2, 0]} scale={[0.7, 4.4, 56]} />
      <DoodleBox position={[ARENA_HALF_SIZE, 2.2, 0]} scale={[0.7, 4.4, 56]} />

      <DoodleBox position={[-10, 2.3, -8]} scale={[8, 4.6, 6]} color={PAPER} />
      <DoodleBox position={[10, 1.65, -6]} scale={[7, 3.3, 5]} color={PALE_BLUE} />
      <DoodleBox position={[-15, 1.35, 8]} scale={[5, 2.7, 7]} color={PAPER} />
      <DoodleBox position={[12, 2.75, 11]} scale={[9, 5.5, 6]} color={PALE_BLUE} />
      <DoodleBox position={[0, 0.8, 2]} scale={[5, 1.6, 3]} color={PAPER} />

      <FilingCabinet position={[-22, 0, 7]} />
      <FilingCabinet position={[19, 0, -18]} />
      <GiantCoffee position={[2, 0, -18]} />

      <PaperTree position={[-21, 0, -10]} />
      <PaperTree position={[-6, 0, 14]} />
      <PaperTree position={[5, 0, 21]} />
      <PaperTree position={[21, 0, -2]} />
      <PaperTree position={[17, 0, 20]} />
    </>
  );
}
