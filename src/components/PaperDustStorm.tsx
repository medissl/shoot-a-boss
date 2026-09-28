import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { hazardDamage } from "../game/hazards";
import { useGameStore } from "../game/store";

const regions = [
  { x: -23, z: -14, w: 30, d: 52 }, { x: 22, z: 16, w: 32, d: 55 },
  { x: 0, z: -26, w: 68, d: 31 }, { x: 2, z: 27, w: 70, d: 33 },
];
const SHREDS = 180;
const paperColors = ["#fffdf2", "#e0eaff", "#fae2eb", "#ffffff"];
const fractional = (value: number) => value - Math.floor(value);

export function PaperDustStorm() {
  const warning = useRef<THREE.Group>(null);
  const warningFill = useRef<THREE.MeshBasicMaterial>(null);
  const storm = useRef<THREE.Group>(null);
  const stormFloor = useRef<THREE.Group>(null);
  const shreds = useRef<THREE.InstancedMesh>(null);
  const streamers = useRef<(THREE.Mesh | null)[]>([]);
  const transform = useRef(new THREE.Object3D());
  const colorsReady = useRef(false);
  const hitAt = useRef(0);
  const noticePhase = useRef("");
  const gameTime = useRef(0);
  const screen = useGameStore((s) => s.screen);

  useFrame((_, delta) => {
    if (screen !== "playing" || useGameStore.getState().tutorialOpen) {
      if (warning.current) warning.current.visible = false;
      if (storm.current) storm.current.visible = false;
      if (stormFloor.current) stormFloor.current.visible = false;
      return;
    }
    gameTime.current += Math.min(delta, 0.1);
    const elapsed = gameTime.current;
    const cycle = Math.max(0, Math.floor((elapsed - 15) / 15));
    const phase = elapsed < 15 ? -1 : (elapsed - 15) % 15;
    const region = regions[cycle % regions.length];
    const warningActive = phase >= 0 && phase < 8;
    const stormActive = phase >= 8 && phase < 13;
    const state = phase < 0 ? `PAPER STORM IN ${Math.ceil(15 - elapsed)}S · WATCH THE RED ZONE`
      : warningActive ? `PAPER STORM IN ${Math.ceil(8 - phase)}S · LEAVE THE RED ZONE`
        : stormActive ? `PAPER STORM ACTIVE · ${Math.ceil(13 - phase)}S LEFT` : "PAPER STORM CLEARED";
    if (state !== noticePhase.current) {
      noticePhase.current = state;
      window.dispatchEvent(new CustomEvent("map-hazard-notice", { detail: { message: state } }));
    }

    if (warning.current) {
      warning.current.visible = warningActive;
      warning.current.position.set(region.x, 0.065, region.z);
      warning.current.scale.set(region.w, 1, region.d);
    }
    if (warningFill.current) {
      const urgency = phase / 8;
      warningFill.current.opacity = 0.31 + urgency * 0.2 + Math.abs(Math.sin(elapsed * (5 + urgency * 13))) * 0.19;
    }
    if (stormFloor.current) {
      stormFloor.current.visible = stormActive;
      stormFloor.current.position.set(region.x, 0.07, region.z);
      stormFloor.current.scale.set(region.w, 1, region.d);
    }
    if (storm.current) {
      storm.current.visible = stormActive;
      storm.current.position.set(region.x, 0, region.z);
    }
    if (!stormActive) return;

    if (shreds.current) {
      if (!colorsReady.current) {
        for (let i = 0; i < SHREDS; i++) shreds.current.setColorAt(i, new THREE.Color(paperColors[i % paperColors.length]));
        if (shreds.current.instanceColor) shreds.current.instanceColor.needsUpdate = true;
        colorsReady.current = true;
      }
      const paper = transform.current;
      for (let i = 0; i < SHREDS; i++) {
        const u = fractional(i * 0.618033 + elapsed * (0.23 + i % 5 * 0.025));
        const v = fractional(i * 0.381966 + elapsed * 0.087);
        paper.position.set(
          (u - 0.5) * region.w,
          0.35 + fractional(i * 0.347 + elapsed * 0.17) * 6.3,
          (v - 0.5) * region.d + Math.sin(elapsed * 3 + i) * 0.85,
        );
        paper.rotation.set(elapsed * 5 + i * 1.3, elapsed * 2.7 + i * 2.1, Math.sin(elapsed * 4 + i) * 0.9);
        paper.scale.setScalar(0.62 + i % 5 * 0.22);
        paper.updateMatrix();
        shreds.current.setMatrixAt(i, paper.matrix);
      }
      shreds.current.instanceMatrix.needsUpdate = true;
    }
    streamers.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.position.set((fractional(elapsed * 0.29 + i / 4) - 0.5) * region.w, 3, (i / 4 - 0.38) * region.d);
      mesh.scale.set(region.w * 0.35, 5.8, 1);
      mesh.rotation.y = 0.65 + Math.sin(elapsed * 2.2 + i) * 0.24;
    });

    if (elapsed - hitAt.current < 0.8) return;
    const live = useGameStore.getState();
    const [x, y, z] = live.playerPosition;
    if (Math.abs(x - region.x) < region.w / 2 && Math.abs(z - region.z) < region.d / 2 && y < 8) {
      live.damagePlayer(hazardDamage(11, live.currentLevel, live.ngPlusCycle), [region.x, 0, region.z]);
      hitAt.current = elapsed;
    }
  });

  return <group userData={{ ignoreProjectile: true }}>
    <group ref={warning} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} /><meshBasicMaterial ref={warningFill} color="#f64464" transparent opacity={0.38} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {[-1, 1].map((side) => <group key={side}>
        <mesh position={[0, 0.004, side * 0.5]}><boxGeometry args={[1, 0.006, 0.012]} /><meshBasicMaterial color="#fff0df" /></mesh>
        <mesh position={[side * 0.5, 0.004, 0]}><boxGeometry args={[0.012, 0.006, 1]} /><meshBasicMaterial color="#fff0df" /></mesh>
      </group>)}
    </group>
    <group ref={stormFloor} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1, 1]} /><meshBasicMaterial color="#dce9ff" transparent opacity={0.48} side={THREE.DoubleSide} depthWrite={false} /></mesh>
    </group>
    <group ref={storm} visible={false}>
      <instancedMesh ref={shreds} args={[undefined, undefined, SHREDS]} frustumCulled={false}>
        <planeGeometry args={[0.46, 0.68]} /><meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.96} depthWrite={false} />
      </instancedMesh>
      {Array.from({ length: 4 }, (_, i) => <mesh key={i} ref={(node) => { streamers.current[i] = node; }}>
        <planeGeometry args={[1, 1]} /><meshBasicMaterial color={i % 2 ? "#e6eeff" : "#ffffff"} side={THREE.DoubleSide} transparent opacity={0.13} depthWrite={false} />
      </mesh>)}
    </group>
  </group>;
}
