import { useLayoutEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { JUNGLE_TOWERS } from "../game/levels";
import { hazardDamage } from "../game/hazards";
import { useGameStore } from "../game/store";

type Patch = { x: number; z: number; expires: number };

function distanceToSegment(x: number, z: number, a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = THREE.MathUtils.clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1);
  return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
}

function isThornSafe(x: number, z: number, player: [number, number, number]) {
    if (Math.hypot(x - player[0], z - player[2]) < 13) return true;
    if (Math.hypot(x, z - 12) < 7) return true;
    if (JUNGLE_TOWERS.some(([tx, , tz]) => Math.hypot(x - tx, z - tz) < 12)) return true;
    const nearest = JUNGLE_TOWERS.reduce((best, tower) =>
      Math.hypot(player[0] - tower[0], player[2] - tower[2]) <
      Math.hypot(player[0] - best[0], player[2] - best[2]) ? tower : best,
    JUNGLE_TOWERS[0]);
    return distanceToSegment(x, z, [player[0], player[2]], [nearest[0], nearest[2]]) < 9.8;
}

function thornPatches(wave: number, player: [number, number, number]): Patch[] {
  const patches: Patch[] = [];
  for (let x = -42; x <= 42; x += 12) for (let z = -42; z <= 42; z += 12) {
    // Each wave leaves a pocket and a clear corridor to the nearest ladder.
    if (isThornSafe(x, z, player)) continue;
    if ((Math.sin(x * 7.7 + z * 11.3 + wave * 17.9) + 1) * 0.5 < 0.04) continue;
    patches.push({ x, z, expires: wave * 30 + 60 });
  }
  return patches;
}

export function JungleThorns() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [warnedPatches, setWarnedPatches] = useState<Patch[]>([]);
  const patchesRef = useRef<Patch[]>([]);
  const warnedRef = useRef<Patch[]>([]);
  const warnedWave = useRef(0);
  const ground = useRef<THREE.InstancedMesh>(null);
  const spikes = useRef<THREE.InstancedMesh>(null);
  const warningGround = useRef<THREE.InstancedMesh>(null);
  const warningMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const elapsed = useRef(0);
  const lastWave = useRef(0);
  const lastDamage = useRef(0);
  const lastNotice = useRef("");
  const screen = useGameStore((state) => state.screen);

  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    patches.forEach((patch, index) => {
      object.position.set(patch.x, 0.045, patch.z);
      object.scale.set(1, 1, 1);
      object.updateMatrix();
      ground.current?.setMatrixAt(index, object.matrix);
      [[-2.9, -2.6], [2.5, -0.6], [-0.3, 2.9]].forEach(([dx, dz], offset) => {
        object.position.set(patch.x + dx, 0.52, patch.z + dz);
        object.rotation.y = index * 0.8 + offset;
        object.updateMatrix();
        spikes.current?.setMatrixAt(index * 3 + offset, object.matrix);
      });
    });
    if (ground.current) ground.current.instanceMatrix.needsUpdate = true;
    if (spikes.current) spikes.current.instanceMatrix.needsUpdate = true;
  }, [patches]);

  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    warnedPatches.forEach(({ x, z }, index) => {
      object.position.set(x, 0.065, z);
      object.updateMatrix();
      warningGround.current?.setMatrixAt(index, object.matrix);
    });
    if (warningGround.current) warningGround.current.instanceMatrix.needsUpdate = true;
  }, [warnedPatches]);

  useFrame((_, delta) => {
    if (screen !== "playing" || useGameStore.getState().tutorialOpen) {
      if (warningGround.current) warningGround.current.visible = false;
      return;
    }
    elapsed.current += Math.min(delta, 0.1);
    const time = elapsed.current;
    const wave = Math.floor(time / 30);
    const upcomingWave = wave + 1;
    const untilWave = 30 - time % 30;
    if (untilWave <= 6 && warnedWave.current !== upcomingWave) {
      warnedWave.current = upcomingWave;
      warnedRef.current = thornPatches(upcomingWave, useGameStore.getState().playerPosition);
      setWarnedPatches(warnedRef.current);
    }
    if (wave > lastWave.current) {
      window.dispatchEvent(new CustomEvent("world-sfx", { detail: { kind: "thornGrow", position: useGameStore.getState().playerPosition } }));
      const player = useGameStore.getState().playerPosition;
      const active = patchesRef.current.filter((patch) => patch.expires > time && !isThornSafe(patch.x, patch.z, player));
      const combined = new Map(active.map((patch) => [`${patch.x},${patch.z}`, patch]));
      // The red zones show every new patch; moving during the warning may
      // remove patches to keep a safe corridor, but never adds an unwarned one.
      warnedRef.current.filter((patch) => !isThornSafe(patch.x, patch.z, player)).forEach((patch) => combined.set(`${patch.x},${patch.z}`, patch));
      patchesRef.current = [...combined.values()];
      setPatches(patchesRef.current);
      warnedRef.current = [];
      setWarnedPatches([]);
      lastWave.current = wave;
    }
    if (warningGround.current) warningGround.current.visible = untilWave <= 6 && warnedPatches.length > 0;
    if (warningMaterial.current) {
      const urgency = 1 - untilWave / 6;
      warningMaterial.current.opacity = 0.47 + (0.18 + urgency * 0.22) * Math.abs(Math.sin(time * (4 + urgency * 16)));
    }
    const next = Math.ceil(30 - time % 30);
    const message = next <= 6 ? `THORNS SPREAD IN ${next}S · CLIMB A TREE`
      : patchesRef.current.length > 0 ? `THORNS ACTIVE · NEXT WAVE IN ${next}S · ZIPLINES ARE SAFE`
        : `THORNS IN ${next}S · TREE PLATFORMS ARE SAFE`;
    if (message !== lastNotice.current) {
      lastNotice.current = message;
      window.dispatchEvent(new CustomEvent("map-hazard-notice", { detail: { message } }));
    }
    if (time - lastDamage.current < 0.8) return;
    const [px, py, pz] = useGameStore.getState().playerPosition;
    const patch = patchesRef.current.find(({ x, z }) => Math.abs(x - px) < 5.8 && Math.abs(z - pz) < 5.8);
    if (py < 2.1 && patch) {
      const live = useGameStore.getState();
      live.damagePlayer(hazardDamage(2.5, live.currentLevel, live.ngPlusCycle), [patch.x, 0, patch.z]);
      lastDamage.current = time;
    }
  });

  return <group userData={{ ignoreProjectile: true }}>
    <instancedMesh ref={warningGround} args={[undefined, undefined, warnedPatches.length]} visible={false}>
      <boxGeometry args={[11.7, 0.03, 11.7]} />
      <meshBasicMaterial ref={warningMaterial} color="#f7455a" side={THREE.DoubleSide} transparent opacity={0.38} depthWrite={false} />
    </instancedMesh>
    <instancedMesh ref={ground} args={[undefined, undefined, patches.length]}>
      <boxGeometry args={[11.7, 0.08, 11.7]} />
      <meshBasicMaterial color="#488e43" transparent opacity={0.72} depthWrite={false} />
    </instancedMesh>
    <instancedMesh ref={spikes} args={[undefined, undefined, patches.length * 3]}>
      <coneGeometry args={[2.15, 0.9, 4]} />
      <meshStandardMaterial color="#8bdc62" emissive="#2d7d26" emissiveIntensity={0.6} roughness={0.75} />
    </instancedMesh>
  </group>;
}
