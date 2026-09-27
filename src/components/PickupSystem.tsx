import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { PICKUP_SPAWNS } from "../game/config";
import { useGameStore } from "../game/store";

type PickupKind = "grenade" | "speed";

function Pickup({
  position,
  kind,
  index,
}: {
  position: [number, number, number];
  kind: PickupKind;
  index: number;
}) {
  const group = useRef<THREE.Group>(null);
  const [available, setAvailable] = useState(true);
  const respawnAt = useRef(0);
  const refillGrenades = useGameStore((state) => state.refillGrenades);
  const grantSpeedBoost = useGameStore((state) => state.grantSpeedBoost);

  useFrame((state, delta) => {
    const root = group.current;
    if (!root) return;

    if (!available) {
      if (performance.now() >= respawnAt.current) setAvailable(true);
      return;
    }

    root.rotation.y += delta * 1.25;
    root.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 2.4 + index) * 0.12;

    const player = new THREE.Vector3(...useGameStore.getState().playerPosition);
    if (root.position.distanceTo(player) < 1.25) {
      if (kind === "grenade") refillGrenades(2);
      else grantSpeedBoost(7500);

      window.dispatchEvent(
        new CustomEvent("pickup-collected", {
          detail: { kind },
        }),
      );
      setAvailable(false);
      respawnAt.current = performance.now() + 14000 + index * 900;
    }
  });

  if (!available) return null;

  return (
    <group ref={group} position={position}>
      <mesh>
        {kind === "grenade" ? (
          <dodecahedronGeometry args={[0.42, 0]} />
        ) : (
          <octahedronGeometry args={[0.48, 0]} />
        )}
        <meshStandardMaterial color="#fbfaf4" roughness={1} />
        <Edges color={kind === "grenade" ? "#d77b16" : "#2548b8"} threshold={7} />
      </mesh>

      {kind === "grenade" ? (
        <>
          <mesh position={[0.26, 0.28, 0]} rotation={[0, 0, -0.45]}>
            <boxGeometry args={[0.22, 0.08, 0.05]} />
            <meshBasicMaterial color="#d77b16" />
          </mesh>
          <mesh position={[0, -0.72, 0]}>
            <planeGeometry args={[1.25, 0.28]} />
            <meshBasicMaterial color="#fbfaf4" transparent opacity={0.88} />
          </mesh>
        </>
      ) : (
        <group rotation={[0, 0, -0.1]}>
          <mesh position={[-0.16, 0, 0.04]}>
            <boxGeometry args={[0.11, 0.82, 0.04]} />
            <meshBasicMaterial color="#2548b8" />
          </mesh>
          <mesh position={[0.16, 0, 0.04]}>
            <boxGeometry args={[0.11, 0.82, 0.04]} />
            <meshBasicMaterial color="#2548b8" />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function PickupSystem() {
  return (
    <>
      {PICKUP_SPAWNS.map((position, index) => (
        <Pickup
          key={index}
          position={position}
          index={index}
          kind={index % 2 === 0 ? "grenade" : "speed"}
        />
      ))}
    </>
  );
}
