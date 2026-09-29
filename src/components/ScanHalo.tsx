import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../game/store";

export function ScanHalo({ id, size = 2 }: { id: string; size?: number }) {
  const marked = useGameStore((state) => state.scanTargets.includes(id) || state.eventTarget === id);
  const elite = useGameStore((state) => state.eventTarget === id);
  const diamond = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!diamond.current) return;
    diamond.current.rotation.y += 0.028;
    diamond.current.position.y = size * 1.7 + Math.sin(clock.getElapsedTime() * 5) * 0.27;
    diamond.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 5) * .13);
  });
  if (!marked) return null;
  return <group ref={diamond} position={[0, size * 1.7, 0]} renderOrder={1000} userData={{ ignoreProjectile: true }}>
    <mesh renderOrder={1001}><octahedronGeometry args={[0.78, 0]} /><meshBasicMaterial color={elite ? "#ff6360" : "#fff137"} toneMapped={false} depthTest={false} depthWrite={false} /></mesh>
    <mesh scale={1.7} renderOrder={1000}><octahedronGeometry args={[.78, 0]} /><meshBasicMaterial color="#ffdd00" toneMapped={false} depthTest={false} depthWrite={false} transparent opacity={.27} /></mesh>
    <mesh rotation={[Math.PI/2,0,0]} renderOrder={1000}><torusGeometry args={[1.05,.095,6,32]}/><meshBasicMaterial color="#fff847" toneMapped={false} depthTest={false} depthWrite={false} /></mesh>
    <mesh rotation={[0,Math.PI/2,0]} renderOrder={1000}><torusGeometry args={[1.12,.06,6,32]}/><meshBasicMaterial color="#ffe900" toneMapped={false} depthTest={false} depthWrite={false} /></mesh>
  </group>;
}
