import { useEffect, useState } from "react";
import * as THREE from "three";

type FloorSplash = {
  id: number;
  position: [number, number, number];
  size: number;
  rotation: number;
  petals: Array<[number, number, number]>;
};

let splashId = 1;

export function PaintSystem() {
  const [splashes, setSplashes] = useState<FloorSplash[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          position: [number, number, number];
          size?: number;
        }>
      ).detail;

      const id = splashId++;
      const splash: FloorSplash = {
        id,
        position: detail.position,
        size: detail.size ?? 0.36,
        rotation: Math.random() * Math.PI,
        petals: Array.from({ length: 5 }, (_, index) => {
          const angle = (index / 5) * Math.PI * 2 + Math.random() * 0.5;
          const distance = 0.18 + Math.random() * 0.32;
          return [
            Math.cos(angle) * distance,
            0.002 + index * 0.0002,
            Math.sin(angle) * distance,
          ];
        }),
      };

      setSplashes((current) => [...current.slice(-70), splash]);
      window.setTimeout(() => {
        setSplashes((current) => current.filter((item) => item.id !== id));
      }, 12000);
    };

    window.addEventListener("paint-splash", handler as EventListener);
    return () =>
      window.removeEventListener("paint-splash", handler as EventListener);
  }, []);

  return (
    <>
      {splashes.map((splash) => (
        <group
          key={splash.id}
          position={splash.position}
          rotation={[0, splash.rotation, 0]}
          userData={{ ignoreProjectile: true }}
        >
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[splash.size, 10]} />
            <meshBasicMaterial
              color="#ff4f9a"
              transparent
              opacity={0.82}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {splash.petals.map((petal, index) => (
            <mesh
              key={index}
              position={petal}
              rotation={[-Math.PI / 2, 0, index * 0.45]}
            >
              <circleGeometry args={[splash.size * (0.22 + (index % 3) * 0.06), 7]} />
              <meshBasicMaterial
                color={index % 2 ? "#ff75b0" : "#e93682"}
                transparent
                opacity={0.72}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
