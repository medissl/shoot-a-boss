import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../game/store";

export function CombatAura() {
  const ring = useRef<THREE.Mesh>(null);
  const balls = useRef<(THREE.Group | null)[]>([]);
  const lastBurn = useRef(0);
  const lastNav = useRef(0);
  const { camera } = useThree();
  const scanTargets = useGameStore((s) => s.scanTargets);
  const upgrades = useGameStore((s) => s.upgrades);
  const scanUntil = useGameStore((s) => s.scanUntil);
  const screen = useGameStore((s) => s.screen);
  useFrame(({ clock }) => {
    const live = useGameStore.getState();
    const now = clock.elapsedTime;
    const [x, y, z] = live.playerPosition;
    if (ring.current) {
      ring.current.position.set(x, y, z);
      ring.current.visible = Boolean(upgrades.shieldOrbit && performance.now() >= live.shieldReadyAt && screen === "playing");
      ring.current.rotation.y = now * 0.75;
      ring.current.rotation.z = Math.sin(now * 1.6) * 0.18;
    }
    balls.current.forEach((ball, index) => {
      if (!ball) return;
      ball.visible = Boolean(upgrades.fireOrbit && screen === "playing");
      const angle = now * 2.1 + index * Math.PI * 2 / 3;
      ball.position.set(x + Math.cos(angle) * 2.35, y + 0.12 + Math.sin(now * 3 + index) * 0.35, z + Math.sin(angle) * 2.35);
      ball.rotation.y = now * 4;
    });
    if (upgrades.fireOrbit && screen === "playing" && now - lastBurn.current > 0.7) {
      lastBurn.current = now;
      Object.entries(live.enemyPositions).forEach(([id, pos]) => {
        if (Math.hypot(x - pos[0], z - pos[2]) < 3.7 && Math.abs(y - pos[1]) < 3.5) {
          window.dispatchEvent(new CustomEvent("boss-hit", { detail: { id, damage: 8, part: "body" } }));
        }
      });
    }
    if (now - lastNav.current > 0.13) {
      lastNav.current = now;
      const marks: { id: string; edge: string; offset: number }[] = [];
      if (screen === "playing" && performance.now() < scanUntil) {
        scanTargets.forEach((id) => {
          const pos = live.enemyPositions[id];
          if (!pos) return;
          const target = new THREE.Vector3(...pos).project(camera);
          if (target.z > 0 && Math.abs(target.x) < 0.83 && Math.abs(target.y) < 0.7) return;
          const direction = new THREE.Vector3(...pos).sub(camera.position).applyQuaternion(camera.quaternion.clone().invert());
          const dx = direction.x * (direction.z > 0 ? -1 : 1);
          const dy = direction.y * (direction.z > 0 ? -1 : 1);
          const edge = Math.abs(dx) > Math.abs(dy) ? dx < 0 ? "left" : "right" : dy > 0 ? "top" : "bottom";
          marks.push({ id, edge, offset: Math.max(-38, Math.min(38, (edge === "left" || edge === "right" ? -target.y : target.x) * 35)) });
        });
      }
      window.dispatchEvent(new CustomEvent("scan-directions", { detail: marks.slice(0, 8) }));
    }
  });
  return <group userData={{ ignoreProjectile: true }}>
    <mesh ref={ring} visible={false}><torusGeometry args={[1.25, 0.055, 6, 36]} /><meshBasicMaterial color="#61f4ff" transparent opacity={0.67} depthWrite={false} /></mesh>
    {Array.from({ length: 3 }, (_, i) => <group key={i} ref={(node) => { balls.current[i] = node; }} visible={false}>
      <mesh><icosahedronGeometry args={[0.32, 1]} /><meshBasicMaterial color="#ffbc36" /></mesh>
      <mesh scale={1.45}><icosahedronGeometry args={[0.29, 0]} /><meshBasicMaterial color="#ff581b" transparent opacity={0.38} depthWrite={false} /></mesh>
    </group>)}
  </group>;
}
