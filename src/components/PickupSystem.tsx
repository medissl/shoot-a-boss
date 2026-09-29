import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { getPickupSpawns } from "../game/levels";
import { WEAPONS } from "../game/config";
import { equippedGearRank } from "../game/store";
import { useGameStore } from "../game/store";

type PickupKind = "grenade" | "speed" | "health" | "ammo";

function Pickup({
  position,
  kind,
  index,
}: {
  position: [number, number, number];
  kind: PickupKind;
  index: number;
}) {
  const group = useRef<THREE.Group>(null);
  const [available, setAvailable] = useState(true);
  const respawnAt = useRef(0);
  const refillGrenades = useGameStore((state) => state.refillGrenades);
  const grantSpeedBoost = useGameStore((state) => state.grantSpeedBoost);

  useFrame((state, delta) => {
    const root = group.current;
    if (!root) return;

    if (!available) {
      if (performance.now() >= respawnAt.current) setAvailable(true);
      return;
    }

    root.rotation.y += delta * 1.25;
    root.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 2.4 + index) * 0.12;

    const player = new THREE.Vector3(...useGameStore.getState().playerPosition);
    if (root.position.distanceTo(player) < 1.25) {
      const live = useGameStore.getState();
      if (kind === "health" && live.hp >= live.maxHp) return;
      if (kind === "ammo" && live.weapon !== "knife" && live.ammo[live.weapon].reserve >= WEAPONS[live.weapon].reserve) return;
      if (kind === "grenade") refillGrenades(equippedGearRank(live, "satchel") >= 5 && index % 3 === 0 ? 2 : 1);
      else if (kind === "speed") grantSpeedBoost(8000);
      else if (kind === "health") useGameStore.setState({ hp: Math.min(live.maxHp, live.hp + Math.ceil(live.maxHp * .20)) });
      else {
        const weapon = live.weapon === "knife" ? "rifle" : live.weapon;
        useGameStore.setState({ ammo: { ...live.ammo, [weapon]: { ...live.ammo[weapon], reserve: Math.min(WEAPONS[weapon].reserve, live.ammo[weapon].reserve + Math.ceil(WEAPONS[weapon].reserve * .32)) } } });
      }

      window.dispatchEvent(
        new CustomEvent("pickup-collected", {
          detail: { kind },
        }),
      );
      setAvailable(false);
      respawnAt.current = performance.now() + 20000 + index * 900;
    }
  });

  if (!available) return null;

  return (
    <group ref={group} position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.48, 0]}><ringGeometry args={[.42, .51, 24]} /><meshBasicMaterial color={kind === "health" ? "#ed4168" : kind === "ammo" ? "#71d74f" : kind === "grenade" ? "#ffc34b" : "#53dff8"} side={THREE.DoubleSide} transparent opacity={.8} /></mesh>
      {kind === "health" && <group>
        <mesh><boxGeometry args={[.78, .78, .24]} /><meshBasicMaterial color="#e84469" /></mesh>
        <mesh position={[0, 0, .14]}><boxGeometry args={[.52, .16, .06]} /><meshBasicMaterial color="white" /></mesh>
        <mesh position={[0, 0, .14]}><boxGeometry args={[.16, .52, .06]} /><meshBasicMaterial color="white" /></mesh>
      </group>}
      {kind === "ammo" && <group>{[-.22, 0, .22].map(x => <group key={x} position={[x, 0, 0]}>
        <mesh position={[0, -.09, 0]}><boxGeometry args={[.18, .49, .18]} /><meshBasicMaterial color="#55b84b" /></mesh>
        <mesh position={[0, .22, 0]}><coneGeometry args={[.09, .19, 8]} /><meshBasicMaterial color="#d6ef79" /></mesh>
      </group>)}</group>}
      {kind === "grenade" && <group>
        <mesh><dodecahedronGeometry args={[.45, 0]} /><meshBasicMaterial color="#e49a29" /></mesh>
        <mesh position={[0, .48, 0]}><boxGeometry args={[.14, .22, .15]} /><meshBasicMaterial color="#614a36" /></mesh>
        <mesh position={[.15, .58, 0]} rotation={[0, 0, .7]}><torusGeometry args={[.14, .035, 6, 12, Math.PI * 1.5]} /><meshBasicMaterial color="#fff6c4" /></mesh>
      </group>}
      {kind === "speed" && <group>{[-.24, .24].map(x => <group key={x} position={[x, 0, 0]} rotation={[0, 0, -.3]}>
        <mesh><boxGeometry args={[.13, .68, .11]} /><meshBasicMaterial color="#42d6f1" /></mesh>
        <mesh position={[.1, .2, .05]} rotation={[0, 0, -.6]}><boxGeometry args={[.12, .4, .11]} /><meshBasicMaterial color="#d8ffff" /></mesh>
      </group>)}</group>}
    </group>
  );
}

export function PickupSystem() {
  const level = useGameStore((state) => state.currentLevel);
  const spawns = getPickupSpawns(level);

  return (
    <>
      {spawns.slice(0, 6).map((position, index) => (
        <Pickup
          key={index}
          position={position}
          index={index}
          kind={(["health", "ammo", "grenade", "speed"] as PickupKind[])[index % 4]}
        />
      ))}
    </>
  );
}
