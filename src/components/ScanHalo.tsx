import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../game/store";

export function ScanHalo({ id, size = 2 }: { id: string; size?: number }) {
  const marked = useGameStore((state) => state.scanTargets.includes(id));
  const diamond = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!diamond.current) return;
    diamond.current.rotation.y += 0.035;
    diamond.current.position.y = size * 1.7 + Math.sin(clock.getElapsedTime() * 5) * 0.2;
  });
  if (!marked) return null;
  return <mesh ref={diamond} position={[0, size * 1.7, 0]} renderOrder={1000} userData={{ ignoreProjectile: true }}>
    <octahedronGeometry args={[0.48, 0]} />
    <meshBasicMaterial color="#ffe850" depthTest={false} depthWrite={false} transparent opacity={0.94} />
  </mesh>;
}
