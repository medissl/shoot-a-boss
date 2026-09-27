import { useGameStore } from "../game/store";

export function ScanHalo({ id, size = 2 }: { id: string; size?: number }) {
  const marked = useGameStore((state) => state.scanTargets.includes(id));
  if (!marked) return null;
  return <group userData={{ ignoreProjectile: true }}>
    <mesh position={[0, size * 0.6, 0]} renderOrder={1000}>
      <sphereGeometry args={[size, 12, 8]} />
      <meshBasicMaterial color="#fff06c" wireframe depthTest={false} depthWrite={false} transparent opacity={0.85} />
    </mesh>
    <mesh position={[0, size * 1.6, 0]} renderOrder={1001}>
      <octahedronGeometry args={[0.38, 0]} /><meshBasicMaterial color="#ffffff" depthTest={false} depthWrite={false} />
    </mesh>
  </group>;
}
