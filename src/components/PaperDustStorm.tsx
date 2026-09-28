import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../game/store";

const regions = [
  { x: -23, z: -14, w: 30, d: 52 }, { x: 22, z: 16, w: 32, d: 55 },
  { x: 0, z: -26, w: 68, d: 31 }, { x: 2, z: 27, w: 70, d: 33 },
];
export function PaperDustStorm() {
  const marker = useRef<THREE.Group>(null);
  const dust = useRef<THREE.Group>(null);
  const hitAt = useRef(0);
  const noticePhase = useRef("");
  const gameTime = useRef(0);
  const screen = useGameStore((s) => s.screen);
  useFrame((_, delta) => {
    if (screen !== "playing" || useGameStore.getState().tutorialOpen) {
      if (marker.current) marker.current.visible = false;
      if (dust.current) dust.current.visible = false;
      return;
    }
    gameTime.current += Math.min(delta, 0.1);
    const elapsed = gameTime.current;
    const cycle = Math.max(0, Math.floor((elapsed - 15) / 15));
    const phase = elapsed < 15 ? -1 : (elapsed - 15) % 15;
    const region = regions[cycle % regions.length];
    const state = phase < 0 ? "" : phase < 8 ? `PAPER DUST IN ${Math.ceil(8 - phase)}S · MOVE AWAY` : phase < 13 ? "PAPER DUST · SEEK COVER" : "";
    if (state !== noticePhase.current) {
      noticePhase.current = state;
      window.dispatchEvent(new CustomEvent("map-hazard-notice", { detail: { message: state } }));
    }
    if (marker.current) {
      marker.current.visible = screen === "playing" && phase >= 0 && phase < 8;
      marker.current.position.set(region.x, 0.06, region.z);
      marker.current.scale.set(region.w, 1, region.d);
    }
    if (dust.current) {
      dust.current.visible = screen === "playing" && phase >= 8 && phase < 13;
      dust.current.position.set(region.x, 0, region.z);
      dust.current.scale.set(region.w, 1, region.d);
      dust.current.children.forEach((piece, i) => { piece.position.y = 1.4 + Math.sin(elapsed * 8 + i * 3) * 0.9; });
    }
    if (screen !== "playing" || useGameStore.getState().tutorialOpen || phase < 8 || phase >= 13 || elapsed - hitAt.current < 0.8) return;
    const [x, y, z] = useGameStore.getState().playerPosition;
    if (Math.abs(x - region.x) < region.w / 2 && Math.abs(z - region.z) < region.d / 2 && y < 8) {
      useGameStore.getState().damagePlayer(11, [region.x, 0, region.z]);
      hitAt.current = elapsed;
    }
  });
  return <>
    <group ref={marker} visible={false} userData={{ ignoreProjectile: true }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1, 1]} /><meshBasicMaterial color="#ff9d40" transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}><ringGeometry args={[0.4, 0.5, 4]} /><meshBasicMaterial color="#f45443" side={THREE.DoubleSide} /></mesh>
    </group>
    <group ref={dust} visible={false} userData={{ ignoreProjectile: true }}>
      {Array.from({ length: 85 }, (_, i) => <mesh key={i} position={[Math.sin(i * 71) * 0.48, 2, Math.cos(i * 23) * 0.48]} rotation={[i, i * 3, 0]}>
        <planeGeometry args={[0.017, 0.027]} /><meshBasicMaterial color={i % 3 ? "#f5ede0" : "#c5a77d"} side={THREE.DoubleSide} transparent opacity={0.86} />
      </mesh>)}
    </group>
  </>;
}
