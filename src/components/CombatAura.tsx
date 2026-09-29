import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../game/store";
import { enemyHpScale } from "../game/levels";

export function CombatAura() {
  const ring = useRef<THREE.Mesh>(null);
  const fragments = useRef<(THREE.Mesh | null)[]>([]);
  const shieldBrokeAt = useRef(-Infinity);
  const balls = useRef<(THREE.Group | null)[]>([]);
  const lastBurn = useRef(0);
  const lastNav = useRef(0);
  const lastVisibleAt = useRef(0);
  const { camera } = useThree();
  const scanTargets = useGameStore((s) => s.scanTargets);
  const upgrades = useGameStore((s) => s.upgrades);
  const scanUntil = useGameStore((s) => s.scanUntil);
  const screen = useGameStore((s) => s.screen);
  useEffect(() => {
    const shatter = () => {
      shieldBrokeAt.current = performance.now();
      const state = useGameStore.getState();
      if (!state.upgrades.shieldShatter) return;
      const [px, py, pz] = state.playerPosition;
      Object.entries(state.enemyPositions).forEach(([id, [x, y, z]]) => {
        if (Math.hypot(px - x, pz - z) < 5 && Math.abs(py - y) < 4.5) {
          const baseHp = id.startsWith("target") ? 250 : id.startsWith("paper") ? 105 : id.startsWith("pen") ? 145 : id.startsWith("statue") ? 300 : 120;
          const damage = state.evolutions.includes("returnToSender") ? Math.min(65, 25 + baseHp * enemyHpScale(state.currentLevel, state.ngPlusCycle) * .05) : 20;
          window.dispatchEvent(new CustomEvent("boss-hit", { detail: { id, damage, part: "body" } }));
        }
      });
    };
    window.addEventListener("shield-blocked", shatter);
    return () => window.removeEventListener("shield-blocked", shatter);
  }, []);
  useFrame(({ clock }) => {
    const live = useGameStore.getState();
    const now = clock.elapsedTime;
    const [x, y, z] = live.playerPosition;
    const breakAge = (performance.now() - shieldBrokeAt.current) / 1000;
    if (ring.current) {
      ring.current.position.set(x, y, z);
      ring.current.visible = Boolean((live.shieldCharges > 0 || upgrades.shieldOrbit && performance.now() >= live.shieldReadyAt) && breakAge > 0.85 && screen === "playing");
      ring.current.rotation.y = now * 0.75;
      ring.current.rotation.z = Math.sin(now * 1.6) * 0.18;
    }
    fragments.current.forEach((piece, index) => {
      if (!piece) return;
      piece.visible = screen === "playing" && breakAge >= 0 && breakAge < 0.85;
      if (!piece.visible) return;
      const side = index ? 1 : -1;
      piece.position.set(x + side * breakAge * 2.5, y + breakAge * 1.2, z);
      piece.rotation.set(0, side * breakAge * 2.3, index ? Math.PI + side * breakAge : -side * breakAge);
      (piece.material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - breakAge / 0.85);
    });
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
      const marks: { id: string; edge: string; offset: number; distance: number; vertical: string; scan: boolean }[] = [];
      const liveTargets = Object.keys(live.enemyPositions).filter(id => !live.eliminated.includes(id));
      const hasVisible = liveTargets.some(id => {
        const point = new THREE.Vector3(...live.enemyPositions[id]);
        const direction = point.clone().sub(camera.position);
        return direction.dot(camera.getWorldDirection(new THREE.Vector3())) > 0 && Math.abs(point.project(camera).x) < .83 && Math.abs(point.y) < .7;
      });
      if (hasVisible) lastVisibleAt.current = performance.now();
      const passive = liveTargets.length <= 3 || performance.now() - lastVisibleAt.current > 3000;
      if (screen === "playing" && (performance.now() < scanUntil || passive)) {
        const scanning = performance.now() < scanUntil;
        const displayed = scanning ? scanTargets : liveTargets.sort((a, b) =>
          new THREE.Vector3(...live.enemyPositions[a]).distanceTo(camera.position) - new THREE.Vector3(...live.enemyPositions[b]).distanceTo(camera.position)).slice(0, 1);
        displayed.forEach((id) => {
          const pos = live.enemyPositions[id];
          if (!pos) return;
          const direction = new THREE.Vector3(...pos).sub(camera.position).applyQuaternion(camera.quaternion.clone().invert());
          const behind = direction.z > 0;
          const target = new THREE.Vector3(...pos).project(camera);
          if (!behind && Math.abs(target.x) < .83 && Math.abs(target.y) < .7) return;
          const dx = direction.x * (behind ? -1 : 1);
          const dy = direction.y * (behind ? -1 : 1);
          const edge = Math.abs(dx) > Math.abs(dy) ? dx < 0 ? "left" : "right" : dy > 0 ? "top" : "bottom";
          marks.push({ id, edge, offset: Math.max(-38, Math.min(38, (edge === "left" || edge === "right" ? -target.y : target.x) * 35)),
            distance: Math.round(new THREE.Vector3(...pos).distanceTo(camera.position)), vertical: pos[1] - camera.position.y > 3 ? "↑" : pos[1] - camera.position.y < -3 ? "↓" : "", scan: scanning });
        });
      }
      window.dispatchEvent(new CustomEvent("scan-directions", { detail: marks.slice(0, 8) }));
    }
  });
  return <group userData={{ ignoreProjectile: true }}>
    <mesh ref={ring} visible={false}><torusGeometry args={[1.25, 0.075, 6, 36]} /><meshBasicMaterial color="#8bd6ff" transparent opacity={0.83} depthWrite={false} /></mesh>
    {[0, 1].map((index) => <mesh key={index} ref={(node) => { fragments.current[index] = node; }} visible={false}>
      <torusGeometry args={[1.25, 0.085, 6, 24, Math.PI]} /><meshBasicMaterial color="#d7f8ff" transparent opacity={0.95} depthWrite={false} />
    </mesh>)}
    {Array.from({ length: 3 }, (_, i) => <group key={i} ref={(node) => { balls.current[i] = node; }} visible={false}>
      <mesh><icosahedronGeometry args={[0.32, 1]} /><meshBasicMaterial color="#ffbc36" /></mesh>
      <mesh scale={1.45}><icosahedronGeometry args={[0.29, 0]} /><meshBasicMaterial color="#ff581b" transparent opacity={0.38} depthWrite={false} /></mesh>
    </group>)}
  </group>;
}
