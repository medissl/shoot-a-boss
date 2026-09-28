import { Edges } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getUpgradeStats } from "../game/progression";
import { useGameStore } from "../game/store";

type GrenadeData = {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
};

type BurstData = {
  id: number;
  position: [number, number, number];
  radius: number;
};

const FUSE_MS = 1150;
const BURST_MS = 500;

function PaperGrenade({
  grenade,
  onExplode,
}: {
  grenade: GrenadeData;
  onExplode: (id: number, position: [number, number, number]) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3(...grenade.velocity));
  const bornAt = useRef<number | null>(null);
  const exploded = useRef(false);

  useFrame((_, delta) => {
    const root = group.current;
    if (!root || exploded.current) return;

    if (bornAt.current === null) bornAt.current = performance.now();

    velocity.current.y -= 14.5 * delta;
    root.position.addScaledVector(velocity.current, delta);
    root.rotation.x += 4.4 * delta;
    root.rotation.z += 3.2 * delta;

    if (root.position.y < 0.24) {
      root.position.y = 0.24;
      velocity.current.y = Math.abs(velocity.current.y) * 0.34;
      velocity.current.x *= 0.78;
      velocity.current.z *= 0.78;
    }

    if (performance.now() - bornAt.current >= FUSE_MS) {
      exploded.current = true;
      onExplode(grenade.id, [root.position.x, root.position.y, root.position.z]);
    }
  });

  return (
    <group ref={group} position={grenade.position}>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.23, 0]} />
        <meshStandardMaterial color="#fffdf4" roughness={1} />
        <Edges color="#161616" threshold={8} />
      </mesh>
      <mesh position={[0.14, 0.18, 0]} rotation={[0.1, 0.4, -0.4]}>
        <planeGeometry args={[0.24, 0.1]} />
        <meshBasicMaterial color="#ffdc5d" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function PaperBurst({ burst, onDone }: { burst: BurstData; onDone: (id: number) => void }) {
  const ring = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const bornAt = useRef<number | null>(null);

  useFrame(() => {
    if (bornAt.current === null) bornAt.current = performance.now();
    const age = (performance.now() - bornAt.current) / BURST_MS;
    if (age >= 1) {
      onDone(burst.id);
      return;
    }

    const scale = 0.75 + age * (burst.radius - 0.75);
    if (ring.current) {
      ring.current.scale.setScalar(scale);
      const material = ring.current.material as THREE.MeshBasicMaterial;
      material.opacity = 1 - age;
    }
    if (shell.current) {
      shell.current.scale.setScalar(0.75 + age * burst.radius * 0.45);
      shell.current.rotation.y += 0.08;
      const material = shell.current.material as THREE.MeshBasicMaterial;
      material.opacity = (1 - age) * 0.75;
    }
  });

  return (
    <group position={burst.position}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.94, 1, 40]} />
        <meshBasicMaterial color="#171716" transparent opacity={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshBasicMaterial color="#fff5b5" wireframe transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

export function PaperGrenadeSystem() {
  const { camera } = useThree();
  const [grenades, setGrenades] = useState<GrenadeData[]>([]);
  const [bursts, setBursts] = useState<BurstData[]>([]);
  const nextId = useRef(1);
  const spendGrenade = useGameStore((state) => state.spendGrenade);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "KeyG" || event.repeat) return;
      if (useGameStore.getState().screen !== "playing") return;
      if (!spendGrenade()) return;

      window.dispatchEvent(new Event("grenade-cocked"));

      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const origin = camera.position.clone().add(direction.clone().multiplyScalar(0.75));
      const velocity = direction.multiplyScalar(11.5);
      velocity.y += 5.8;

      setGrenades((current) => [
        ...current,
        {
          id: nextId.current++,
          position: [origin.x, origin.y, origin.z],
          velocity: [velocity.x, velocity.y, velocity.z],
        },
      ]);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [camera, spendGrenade]);

  function explode(id: number, position: [number, number, number]) {
    const state = useGameStore.getState();
    const stats = getUpgradeStats(state.upgrades);
    const effectiveLevel = state.currentLevel + state.ngPlusCycle * 10;
    const radius = 8.2 * stats.grenadePower;
    window.dispatchEvent(
      new CustomEvent("paper-grenade-explode", {
        detail: {
          position,
          radius,
          damage: 205 * (1 + (effectiveLevel - 1) * 0.05) * stats.grenadePower,
        },
      }),
    );
    setGrenades((current) => current.filter((grenade) => grenade.id !== id));
    setBursts((current) => [...current, { id, position, radius }]);
  }

  return (
    <>
      {grenades.map((grenade) => (
        <PaperGrenade key={grenade.id} grenade={grenade} onExplode={explode} />
      ))}
      {bursts.map((burst) => (
        <PaperBurst
          key={burst.id}
          burst={burst}
          onDone={(id) => setBursts((current) => current.filter((item) => item.id !== id))}
        />
      ))}
    </>
  );
}
