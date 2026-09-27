import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ARENA_HALF_SIZE } from "../game/config";
import { useGameStore } from "../game/store";

type GrenadeDetail = {
  position: [number, number, number];
  radius: number;
  damage: number;
};

export type EnemyArchetype = "melee" | "ranged";
export type RangedWeapon = "handgun" | "bow";
type Pose = "idle" | "walk" | "punch" | "aim";

const BLUE = "#2548b8";
const PAPER = "#fbfaf4";
const SHADE = "#dbe3ff";
const RED = "#ef476f";
const PINK = "#ff91b8";

function drawBoss(
  canvas: HTMLCanvasElement,
  pose: Pose,
  hit: boolean,
  archetype: EnemyArchetype,
  rangedWeapon: RangedWeapon,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, 34);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 10;

  const skin = hit ? "#ff9bad" : "#f7d8bb";
  const shirt = hit ? "#ff6f8d" : PAPER;

  // head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, 114, 80, 71, -0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-80, 118, 16, Math.PI * 0.45, Math.PI * 1.55);
  ctx.arc(80, 118, 16, -Math.PI * 0.55, Math.PI * 0.55);
  ctx.stroke();

  // angry face
  ctx.beginPath();
  ctx.moveTo(-48, 85);
  ctx.lineTo(-13, 98);
  ctx.moveTo(13, 98);
  ctx.lineTo(48, 85);
  ctx.stroke();

  ctx.fillStyle = hit ? "#7a1730" : BLUE;
  ctx.beginPath();
  ctx.arc(-29, 112, 7, 0, Math.PI * 2);
  ctx.arc(29, 112, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-35, 149);
  ctx.quadraticCurveTo(0, 126, 35, 149);
  ctx.stroke();

  // body
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.moveTo(-92, 194);
  ctx.quadraticCurveTo(-137, 278, -112, 393);
  ctx.quadraticCurveTo(0, 447, 112, 393);
  ctx.quadraticCurveTo(137, 278, 92, 194);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // blue hatch/cel shade
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-92, 194);
  ctx.quadraticCurveTo(-137, 278, -112, 393);
  ctx.quadraticCurveTo(0, 447, 112, 393);
  ctx.quadraticCurveTo(137, 278, 92, 194);
  ctx.closePath();
  ctx.clip();
  ctx.globalAlpha = hit ? 0.17 : 0.26;
  ctx.strokeStyle = hit ? "#861f39" : BLUE;
  ctx.lineWidth = 4;
  for (let i = -155; i < 115; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 315);
    ctx.lineTo(i + 100, 430);
    ctx.stroke();
  }
  ctx.restore();

  // tie
  ctx.fillStyle = hit ? "#7a1730" : SHADE;
  ctx.beginPath();
  ctx.moveTo(0, 202);
  ctx.lineTo(-20, 235);
  ctx.lineTo(-6, 330);
  ctx.lineTo(0, 347);
  ctx.lineTo(7, 330);
  ctx.lineTo(20, 235);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const walking = pose === "walk";
  const punching = pose === "punch";
  const aiming = pose === "aim";

  const leftHand: [number, number] = punching
    ? [-154, 211]
    : aiming
      ? [-134, 245]
      : [-145, 315 + (walking ? 15 : 0)];

  const rightHand: [number, number] = punching
    ? [178, 193]
    : aiming
      ? [158, 220]
      : [145, 315 - (walking ? 15 : 0)];

  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(-84, 229);
  ctx.lineTo(leftHand[0], leftHand[1]);
  ctx.moveTo(84, 229);
  ctx.lineTo(rightHand[0], rightHand[1]);
  ctx.stroke();

  ctx.fillStyle = skin;
  ctx.lineWidth = 8;
  for (const [x, y] of [leftHand, rightHand]) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // ranged prop
  if (archetype === "ranged") {
    ctx.strokeStyle = hit ? "#7a1730" : BLUE;
    ctx.fillStyle = PAPER;
    if (rangedWeapon === "handgun") {
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(rightHand[0] - 4, rightHand[1] - 4);
      ctx.lineTo(rightHand[0] + 72, rightHand[1] - 35);
      ctx.lineTo(rightHand[0] + 83, rightHand[1] - 18);
      ctx.lineTo(rightHand[0] + 20, rightHand[1] + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightHand[0] + 14, rightHand[1]);
      ctx.lineTo(rightHand[0] + 28, rightHand[1] + 43);
      ctx.stroke();
    } else {
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(rightHand[0] + 15, rightHand[1], 58, -1.15, 1.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightHand[0] + 39, rightHand[1] - 52);
      ctx.lineTo(rightHand[0] - 15, rightHand[1]);
      ctx.lineTo(rightHand[0] + 39, rightHand[1] + 52);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightHand[0] - 19, rightHand[1]);
      ctx.lineTo(rightHand[0] + 80, rightHand[1]);
      ctx.stroke();
    }
  }

  // legs
  const step = walking ? 24 : 0;
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(-44, 405);
  ctx.lineTo(-55 - step, 536);
  ctx.moveTo(44, 405);
  ctx.lineTo(55 + step, 536);
  ctx.stroke();

  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-91 - step, 539);
  ctx.lineTo(-34 - step, 539);
  ctx.moveTo(34 + step, 539);
  ctx.lineTo(91 + step, 539);
  ctx.stroke();

  if (punching) {
    ctx.strokeStyle = RED;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(192, 163);
    ctx.lineTo(239, 141);
    ctx.moveTo(195, 190);
    ctx.lineTo(250, 190);
    ctx.moveTo(187, 217);
    ctx.lineTo(234, 242);
    ctx.stroke();
  }

  if (hit) {
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-116, 64);
    ctx.lineTo(-145, 39);
    ctx.moveTo(112, 67);
    ctx.lineTo(143, 40);
    ctx.moveTo(-134, 170);
    ctx.lineTo(-170, 181);
    ctx.moveTo(132, 167);
    ctx.lineTo(170, 180);
    ctx.stroke();
  }

  ctx.restore();
}

function setBeam(
  mesh: THREE.Mesh,
  start: THREE.Vector3,
  end: THREE.Vector3,
  thickness: number,
) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  if (length <= 0.001) return;

  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.scale.set(thickness, length, thickness);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
}

export function Dummy({
  id,
  spawn,
  archetype,
  rangedWeapon,
}: {
  id: string;
  spawn: [number, number, number];
  archetype: EnemyArchetype;
  rangedWeapon: RangedWeapon;
}) {
  const group = useRef<THREE.Group>(null);
  const warningRef = useRef<THREE.Mesh>(null);
  const shotRef = useRef<THREE.Mesh>(null);
  const [hp, setHp] = useState(100);
  const [pose, setPose] = useState<Pose>("idle");
  const [hitFlash, setHitFlash] = useState(false);

  const canvas = useMemo(() => {
    const element = document.createElement("canvas");
    element.width = 512;
    element.height = 640;
    return element;
  }, []);

  const texture = useMemo(() => {
    drawBoss(canvas, pose, hitFlash, archetype, rangedWeapon);
    const next = new THREE.CanvasTexture(canvas);
    next.colorSpace = THREE.SRGBColorSpace;
    next.minFilter = THREE.LinearFilter;
    next.magFilter = THREE.LinearFilter;
    return next;
  }, [archetype, canvas, hitFlash, pose, rangedWeapon]);

  const poseRef = useRef<Pose>("idle");
  const punchUntil = useRef(0);
  const lastPunch = useRef(0);
  const nextRangedShot = useRef(1.2 + Number(id.split("-")[1]) * 0.18);
  const aimingUntil = useRef(0);
  const telegraphTarget = useRef(new THREE.Vector3());
  const shotVisibleUntil = useRef(0);
  const shotTarget = useRef(new THREE.Vector3());
  const eliminated = useGameStore((state) => state.eliminated.includes(id));
  const damagePlayer = useGameStore((state) => state.damagePlayer);
  const eliminate = useGameStore((state) => state.eliminate);
  const screen = useGameStore((state) => state.screen);
  const drift = Number(id.split("-")[1]) % 2 === 0 ? 1 : -1;

  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; damage: number }>).detail;
      if (detail.id !== id || eliminated) return;
      setHp((current) => Math.max(0, current - detail.damage));
      setHitFlash(true);
      window.setTimeout(() => setHitFlash(false), 125);
    };

    const grenadeHandler = (event: Event) => {
      const detail = (event as CustomEvent<GrenadeDetail>).detail;
      const root = group.current;
      if (!root || eliminated) return;
      const blast = new THREE.Vector3(...detail.position);
      const distance = root.position.distanceTo(blast);
      if (distance > detail.radius) return;
      const falloff = 1 - distance / detail.radius;
      const damage = Math.max(22, detail.damage * falloff);
      setHp((current) => Math.max(0, current - damage));
      setHitFlash(true);
      window.setTimeout(() => setHitFlash(false), 140);
    };

    window.addEventListener("boss-hit", handler as EventListener);
    window.addEventListener("paper-grenade-explode", grenadeHandler as EventListener);
    return () => {
      window.removeEventListener("boss-hit", handler as EventListener);
      window.removeEventListener("paper-grenade-explode", grenadeHandler as EventListener);
    };
  }, [eliminated, id]);

  useEffect(() => {
    if (hp <= 0 && !eliminated) eliminate(id);
  }, [eliminate, eliminated, hp, id]);

  useFrame((state, delta) => {
    const root = group.current;
    const warning = warningRef.current;
    const shot = shotRef.current;

    if (!root || eliminated || screen !== "playing") {
      if (warning) warning.visible = false;
      if (shot) shot.visible = false;
      return;
    }

    const player = new THREE.Vector3(...useGameStore.getState().playerPosition);
    const here = root.position;
    const towardPlayer = player.clone().sub(here);
    towardPlayer.y = 0;
    const distance = towardPlayer.length();
    const desired = distance > 0.001 ? towardPlayer.normalize() : new THREE.Vector3();
    const sideways = new THREE.Vector3(-desired.z, 0, desired.x);
    const now = state.clock.elapsedTime;
    const number = Number(id.split("-")[1]);
    let desiredPose: Pose = "idle";

    if (archetype === "melee") {
      if (distance > 1.75) {
        here.addScaledVector(desired, 2.65 * delta);
        here.addScaledVector(
          sideways,
          Math.sin(now * 2 + number) * 0.24 * delta * drift,
        );
        desiredPose = "walk";
      } else if (now - lastPunch.current > 1.05) {
        lastPunch.current = now;
        punchUntil.current = now + 0.34;
        damagePlayer(10);
      }

      if (now < punchUntil.current) desiredPose = "punch";
    } else {
      const currentlyAiming = aimingUntil.current > now;

      if (currentlyAiming) {
        desiredPose = "aim";
        if (warning) {
          const muzzle = here.clone().add(new THREE.Vector3(0, 2.25, 0));
          setBeam(warning, muzzle, telegraphTarget.current, 0.018);
          warning.visible = true;
        }
      } else {
        if (warning) warning.visible = false;

        if (aimingUntil.current > 0 && now >= aimingUntil.current) {
          const muzzle = here.clone().add(new THREE.Vector3(0, 2.25, 0));
          shotTarget.current.copy(telegraphTarget.current);
          shotVisibleUntil.current = now + 0.095;

          if (player.distanceTo(telegraphTarget.current) < 1.65) {
            damagePlayer(rangedWeapon === "bow" ? 14 : 12);
          }

          aimingUntil.current = 0;
          nextRangedShot.current = now + 2.25 + (number % 3) * 0.22;

          if (shot) {
            setBeam(shot, muzzle, shotTarget.current, 0.034);
            shot.visible = true;
          }
        }

        if (distance < 8.5) {
          here.addScaledVector(desired, -3.15 * delta);
          here.addScaledVector(sideways, 0.9 * delta * drift);
          desiredPose = "walk";
        } else if (distance > 18) {
          here.addScaledVector(desired, 2.1 * delta);
          desiredPose = "walk";
        } else {
          here.addScaledVector(
            sideways,
            Math.sin(now * 1.6 + number) * 1.05 * delta * drift,
          );
          desiredPose = "walk";

          if (now >= nextRangedShot.current) {
            telegraphTarget.current.copy(player);
            telegraphTarget.current.y += 0.35;
            aimingUntil.current = now + 0.72;
            desiredPose = "aim";
          }
        }
      }

      if (shot) {
        if (now < shotVisibleUntil.current) {
          const muzzle = here.clone().add(new THREE.Vector3(0, 2.25, 0));
          setBeam(shot, muzzle, shotTarget.current, 0.034);
          shot.visible = true;
        } else {
          shot.visible = false;
        }
      }
    }

    here.y = 0;
    here.x = THREE.MathUtils.clamp(here.x, -ARENA_HALF_SIZE + 1.5, ARENA_HALF_SIZE - 1.5);
    here.z = THREE.MathUtils.clamp(here.z, -ARENA_HALF_SIZE + 1.5, ARENA_HALF_SIZE - 1.5);

    root.lookAt(player.x, 0, player.z);
    root.rotation.x = 0;
    root.rotation.z = 0;

    if (poseRef.current !== desiredPose) {
      poseRef.current = desiredPose;
      setPose(desiredPose);
    }

    const visible = root.children[0] as THREE.Mesh | undefined;
    if (visible) {
      const moving = desiredPose === "walk";
      visible.position.y =
        1.72 + Math.sin(now * 7 + number) * (moving ? 0.045 : 0.012);
    }
  });

  if (eliminated) return null;

  return (
    <>
      <group ref={group} position={spawn}>
        <mesh position={[0, 1.72, 0]} userData={{ targetId: id, targetPart: "body" }}>
          <planeGeometry args={[2.72, 3.4]} />
          <meshBasicMaterial
            map={texture}
            transparent
            alphaTest={0.06}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh position={[0, 1.42, 0.035]} userData={{ targetId: id, targetPart: "body" }}>
          <planeGeometry args={[2.45, 2.25]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>

        <mesh position={[0, 2.75, 0.05]} userData={{ targetId: id, targetPart: "head" }}>
          <planeGeometry args={[1.16, 1.08]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>

        <group position={[0, 3.55, 0.03]}>
          <mesh>
            <planeGeometry args={[1.62, 0.08]} />
            <meshBasicMaterial color="#b7c6f5" />
          </mesh>
          <mesh
            position={[-0.81 + (Math.max(hp, 0) / 100) * 0.81, 0, 0.01]}
            scale={[Math.max(hp, 0) / 100, 1, 1]}
          >
            <planeGeometry args={[1.6, 0.055]} />
            <meshBasicMaterial color={hitFlash ? RED : BLUE} />
          </mesh>
        </group>
      </group>

      <mesh ref={warningRef} visible={false}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshBasicMaterial
          color="#ff315e"
          transparent
          opacity={0.48}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={shotRef} visible={false}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshBasicMaterial
          color={rangedWeapon === "bow" ? "#ff7ca7" : "#ff315e"}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
