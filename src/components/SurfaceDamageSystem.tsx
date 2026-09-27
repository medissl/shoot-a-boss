import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type SurfaceHit = {
  id: number;
  point: [number, number, number];
  direction: [number, number, number];
  seed: number;
};

function ChipBurst({ hit }: { hit: SurfaceHit }) {
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const born = useRef(performance.now());

  const chips = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const angle = hit.seed * 8.7 + index * 1.37;
        const speed = 0.7 + ((index * 17) % 5) * 0.18;
        return {
          velocity: new THREE.Vector3(
            Math.cos(angle) * speed + hit.direction[0] * 0.8,
            1.1 + (index % 3) * 0.38,
            Math.sin(angle) * speed + hit.direction[2] * 0.8,
          ),
          spin: new THREE.Vector3(
            1.2 + index * 0.17,
            0.8 + index * 0.11,
            1.0 + index * 0.13,
          ),
        };
      }),
    [hit.direction, hit.seed],
  );

  useFrame((_state, delta) => {
    const age = (performance.now() - born.current) / 1000;
    refs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const chip = chips[index];
      chip.velocity.y -= 5.8 * delta;
      mesh.position.addScaledVector(chip.velocity, delta);
      mesh.rotation.x += chip.spin.x * delta;
      mesh.rotation.y += chip.spin.y * delta;
      mesh.rotation.z += chip.spin.z * delta;
      const scale = age > 1 ? THREE.MathUtils.clamp(1.45 - age, 0, 1) : 1;
      mesh.scale.setScalar(scale);
    });
  });

  return (
    <group position={hit.point} userData={{ ignoreProjectile: true }}>
      {Array.from({ length: 6 }, (_, index) => {
        const angle = index * (Math.PI / 3) + hit.seed;
        return (
          <mesh
            key={`crack-${index}`}
            position={[
              Math.cos(angle) * 0.11,
              Math.sin(angle) * 0.06,
              0,
            ]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.3 + (index % 2) * 0.12, 0.025, 0.025]} />
            <meshBasicMaterial color="#2548b8" transparent opacity={0.72} />
          </mesh>
        );
      })}

      {chips.map((_chip, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            refs.current[index] = mesh;
          }}
          position={[
            (index % 3) * 0.025,
            ((index + 1) % 3) * 0.02,
            (index % 2) * 0.02,
          ]}
        >
          <boxGeometry
            args={[
              0.12 + (index % 2) * 0.05,
              0.09 + (index % 3) * 0.025,
              0.08,
            ]}
          />
          <meshStandardMaterial
            color={index % 3 === 0 ? "#dbe3ff" : "#fbfaf4"}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

export function SurfaceDamageSystem() {
  const nextId = useRef(1);
  const [hits, setHits] = useState<SurfaceHit[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          point: [number, number, number];
          direction: [number, number, number];
        }>
      ).detail;
      const id = nextId.current++;
      const next: SurfaceHit = {
        id,
        point: detail.point,
        direction: detail.direction,
        seed: Math.random() * Math.PI * 2,
      };

      setHits((current) => [...current.slice(-24), next]);
      window.setTimeout(() => {
        setHits((current) => current.filter((hit) => hit.id !== id));
      }, 1450);
    };

    window.addEventListener("surface-hit", handler as EventListener);
    return () =>
      window.removeEventListener("surface-hit", handler as EventListener);
  }, []);

  return (
    <>
      {hits.map((hit) => (
        <ChipBurst key={hit.id} hit={hit} />
      ))}
    </>
  );
}
