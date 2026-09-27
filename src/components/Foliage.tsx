import { Edges } from "@react-three/drei";
import {
  CuboidCollider,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { REACTIVE_PLANTS } from "../game/config";

const BLUE = "#2548b8";
const GREEN = "#5f9c5a";
const GREEN_DARK = "#397447";
const GREEN_LIGHT = "#a5cc76";
const PINK = "#ef6f9d";
const YELLOW = "#f2b441";
const PAPER = "#fbfaf4";

type PlantKind = "weed" | "flower" | "sapling";

function PlantDrawing({
  id,
  kind,
}: {
  id: string;
  kind: PlantKind;
}) {
  if (kind === "weed") {
    return (
      <group>
        {[-0.28, 0, 0.28].map((x, index) => (
          <mesh
            key={x}
            userData={{ propId: id }}
            position={[x, 0.05, 0]}
            rotation={[0, 0, (index - 1) * 0.26]}
          >
            <boxGeometry args={[0.11, 1.15 - index * 0.12, 0.08]} />
            <meshStandardMaterial color={index % 2 ? GREEN_LIGHT : GREEN} roughness={1} />
            <Edges color={BLUE} threshold={10} />
          </mesh>
        ))}
      </group>
    );
  }

  if (kind === "flower") {
    return (
      <group>
        <mesh userData={{ propId: id }}>
          <cylinderGeometry args={[0.06, 0.08, 1.3, 6]} />
          <meshStandardMaterial color={GREEN_DARK} roughness={1} />
          <Edges color={BLUE} threshold={8} />
        </mesh>
        <group position={[0, 0.68, 0]}>
          {Array.from({ length: 6 }, (_, index) => {
            const angle = (index / 6) * Math.PI * 2;
            return (
              <mesh
                key={index}
                userData={{ propId: id }}
                position={[Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0]}
              >
                <circleGeometry args={[0.19, 7]} />
                <meshBasicMaterial color={PINK} side={THREE.DoubleSide} />
                <Edges color={BLUE} threshold={4} />
              </mesh>
            );
          })}
          <mesh userData={{ propId: id }} position={[0, 0, 0.03]}>
            <circleGeometry args={[0.14, 8]} />
            <meshBasicMaterial color={YELLOW} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
    );
  }

  return (
    <group>
      <mesh userData={{ propId: id }} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.13, 0.18, 1.9, 7]} />
        <meshStandardMaterial color="#8b714d" roughness={1} />
        <Edges color={BLUE} threshold={10} />
      </mesh>
      {[[-0.48, 0.82, 0], [0.45, 1.02, 0.12], [0, 1.35, -0.08]].map(
        (position, index) => (
          <mesh
            key={index}
            userData={{ propId: id }}
            position={position as [number, number, number]}
            rotation={[0.1 * index, 0.35 * index, 0.1]}
          >
            <coneGeometry args={[0.52 - index * 0.04, 0.9, 6]} />
            <meshStandardMaterial color={index % 2 ? GREEN : GREEN_LIGHT} roughness={1} />
            <Edges color={BLUE} threshold={8} />
          </mesh>
        ),
      )}
    </group>
  );
}

function ReactivePlant({
  id,
  kind,
  position,
}: {
  id: string;
  kind: PlantKind;
  position: readonly [number, number, number];
}) {
  const body = useRef<RapierRigidBody>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          id: string;
          direction: [number, number, number];
          force: number;
        }>
      ).detail;
      if (detail.id !== id || !body.current) return;

      const direction = new THREE.Vector3(...detail.direction).normalize();
      body.current.applyImpulse(
        {
          x: direction.x * detail.force,
          y: Math.max(0.25, direction.y * detail.force + 0.45),
          z: direction.z * detail.force,
        },
        true,
      );
      body.current.applyTorqueImpulse(
        {
          x: (Math.random() - 0.5) * detail.force * 0.32,
          y: (Math.random() - 0.5) * detail.force * 0.18,
          z: (Math.random() - 0.5) * detail.force * 0.32,
        },
        true,
      );
    };

    window.addEventListener("prop-shot", handler as EventListener);
    return () =>
      window.removeEventListener("prop-shot", handler as EventListener);
  }, [id]);

  const scale = kind === "sapling" ? 1 : kind === "flower" ? 0.8 : 0.72;

  return (
    <RigidBody
      ref={body}
      position={[position[0], position[1], position[2]]}
      colliders={false}
      mass={kind === "sapling" ? 0.7 : 0.18}
      linearDamping={1.8}
      angularDamping={2.2}
      friction={0.72}
      restitution={0.12}
      ccd
    >
      <CuboidCollider
        args={
          kind === "sapling"
            ? [0.28, 0.95, 0.28]
            : kind === "flower"
              ? [0.16, 0.7, 0.16]
              : [0.28, 0.56, 0.18]
        }
      />
      <group scale={scale}>
        <PlantDrawing id={id} kind={kind} />
      </group>
    </RigidBody>
  );
}

export function ReactiveFoliage() {
  return (
    <>
      {REACTIVE_PLANTS.map((plant) => (
        <ReactivePlant
          key={plant.id}
          id={plant.id}
          kind={plant.kind as PlantKind}
          position={plant.position}
        />
      ))}
    </>
  );
}
