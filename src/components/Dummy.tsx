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

type Pose = "idle" | "walk" | "punch";

const BLUE = "#2548b8";
const PAPER = "#fbfaf4";
const SHADE = "#dbe3ff";
const ACCENT = "#d77b16";

function drawBoss(canvas: HTMLCanvasElement, pose: Pose, hit: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, 35);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = BLUE;
  ctx.fillStyle = PAPER;
  ctx.lineWidth = 10;

  if (hit) {
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#fff0c8";
  }

  // head
  ctx.beginPath();
  ctx.ellipse(0, 115, 78, 70, -0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ears
  ctx.beginPath();
  ctx.arc(-78, 118, 16, Math.PI * 0.45, Math.PI * 1.55);
  ctx.arc(78, 118, 16, -Math.PI * 0.55, Math.PI * 0.55);
  ctx.stroke();

  // angry eyebrows + eyes
  ctx.beginPath();
  ctx.moveTo(-46, 87);
  ctx.lineTo(-14, 98);
  ctx.moveTo(14, 98);
  ctx.lineTo(46, 87);
  ctx.stroke();
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.arc(-28, 112, 7, 0, Math.PI * 2);
  ctx.arc(28, 112, 7, 0, Math.PI * 2);
  ctx.fill();

  // mouth
  ctx.strokeStyle = hit ? ACCENT : BLUE;
  ctx.beginPath();
  ctx.moveTo(-34, 148);
  ctx.quadraticCurveTo(0, 125, 34, 148);
  ctx.stroke();
  ctx.strokeStyle = BLUE;

  // torso
  ctx.fillStyle = hit ? "#fff0c8" : PAPER;
  ctx.beginPath();
  ctx.moveTo(-92, 195);
  ctx.quadraticCurveTo(-132, 275, -112, 390);
  ctx.quadraticCurveTo(0, 445, 112, 390);
  ctx.quadraticCurveTo(132, 275, 92, 195);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // cross hatch shadow
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 4;
  for (let i = -92; i < 112; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 355);
    ctx.lineTo(i + 70, 415);
    ctx.stroke();
  }
  ctx.restore();

  // tie
  ctx.fillStyle = SHADE;
  ctx.beginPath();
  ctx.moveTo(0, 202);
  ctx.lineTo(-20, 235);
  ctx.lineTo(-5, 330);
  ctx.lineTo(0, 345);
  ctx.lineTo(6, 330);
  ctx.lineTo(20, 235);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // arms
  const walkOffset = pose === "walk" ? 16 : 0;
  const leftHand = pose === "punch" ? [-150, 210] : [-145, 315 + walkOffset];
  const rightHand = pose === "punch" ? [175, 195] : [145, 315 - walkOffset];

  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(-84, 230);
  ctx.lineTo(leftHand[0], leftHand[1]);
  ctx.moveTo(84, 230);
  ctx.lineTo(rightHand[0], rightHand[1]);
  ctx.stroke();

  // clenched fists
  ctx.fillStyle = PAPER;
  ctx.lineWidth = 8;
  for (const [x, y] of [leftHand, rightHand]) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // legs
  const step = pose === "walk" ? 25 : 0;
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(-44, 405);
  ctx.lineTo(-55 - step, 535);
  ctx.moveTo(44, 405);
  ctx.lineTo(55 + step, 535);
  ctx.stroke();

  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-91 - step, 538);
  ctx.lineTo(-34 - step, 538);
  ctx.moveTo(34 + step, 538);
  ctx.lineTo(91 + step, 538);
  ctx.stroke();

  // motion / punch marks
  if (pose === "punch") {
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(190, 165);
    ctx.lineTo(235, 145);
    ctx.moveTo(192, 190);
    ctx.lineTo(244, 190);
    ctx.moveTo(186, 214);
    ctx.lineTo(230, 235);
    ctx.stroke();
  }

  ctx.restore();
}

export function Dummy({
  id,
  spawn,
  aggressive,
}: {
  id: string;
  spawn: [number, number, number];
  aggressive: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const canvas = useMemo(() => {
    const element = document.createElement("canvas");
    element.width = 512;
    element.height = 640;
    return element;
  }, []);
  const texture = useMemo(() => {
    drawBoss(canvas, pose, hitFlash);
    const next = new THREE.CanvasTexture(canvas);
    next.colorSpace = THREE.SRGBColorSpace;
    next.minFilter = THREE.LinearFilter;
    next.magFilter = THREE.LinearFilter;
    return next;
  }, [canvas, hitFlash, pose]);

  const [hp, setHp] = useState(100);
  const [pose, setPose] = useState<Pose>("idle");
  const [hitFlash, setHitFlash] = useState(false);
  const poseRef = useRef<Pose>("idle");
  const punchUntil = useRef(0);
  const lastPunch = useRef(0);
  const eliminated = useGameStore((state) => state.eliminated.includes(id));
  const damagePlayer = useGameStore((state) => state.damagePlayer);
  const eliminate = useGameStore((state) => state.eliminate);
  const screen = useGameStore((state) => state.screen);
  const drift = Number(id.split("-")[1]) % 2 === 0 ? 1 : -1;

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; damage: number }>).detail;
      if (detail.id !== id || eliminated) return;
      setHp((current) => Math.max(0, current - detail.damage));
      setHitFlash(true);
      window.setTimeout(() => setHitFlash(false), 95);
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
      window.setTimeout(() => setHitFlash(false), 110);
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
    if (!root || eliminated || screen !== "playing") return;

    const player = new THREE.Vector3(...useGameStore.getState().playerPosition);
    const here = root.position;
    const towardPlayer = player.clone().sub(here);
    towardPlayer.y = 0;
    const distance = towardPlayer.length();
    const desired = distance > 0.001 ? towardPlayer.normalize() : new THREE.Vector3();
    const speed = aggressive ? 2.2 : 2.7;
    const now = state.clock.elapsedTime;

    if (aggressive && distance < 13) {
      here.addScaledVector(desired, speed * delta);
      here.x += Math.sin(now * 2.4 + Number(id.split("-")[1])) * 0.32 * delta;

      if (distance < 1.9 && now - lastPunch.current > 1.12) {
        lastPunch.current = now;
        punchUntil.current = now + 0.34;
        damagePlayer(9);
      }
    } else if (distance < 15) {
      here.addScaledVector(desired, -speed * delta);
      const sideways = new THREE.Vector3(-desired.z, 0, desired.x);
      here.addScaledVector(sideways, Math.sin(now * 1.3 + Number(id.split("-")[1])) * 0.62 * delta * drift);
    }

    here.y = 0;
    here.x = THREE.MathUtils.clamp(here.x, -ARENA_HALF_SIZE + 1.5, ARENA_HALF_SIZE - 1.5);
    here.z = THREE.MathUtils.clamp(here.z, -ARENA_HALF_SIZE + 1.5, ARENA_HALF_SIZE - 1.5);
    root.lookAt(player.x, 0, player.z);
    root.rotation.x = 0;
    root.rotation.z = 0;

    const desiredPose: Pose =
      now < punchUntil.current
        ? "punch"
        : distance < 15
          ? "walk"
          : "idle";

    if (poseRef.current !== desiredPose) {
      poseRef.current = desiredPose;
      setPose(desiredPose);
    }

    const visible = root.children[0] as THREE.Mesh | undefined;
    if (visible) {
      visible.position.y = 1.72 + Math.sin(now * 7 + Number(id.split("-")[1])) * (desiredPose === "walk" ? 0.045 : 0.012);
    }
  });

  if (eliminated) return null;

  return (
    <group ref={group} position={spawn}>
      <mesh position={[0, 1.72, 0]} userData={{ targetId: id, targetPart: "body" }}>
        <planeGeometry args={[2.72, 3.4]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.06} side={THREE.DoubleSide} />
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
          <meshBasicMaterial color={BLUE} />
        </mesh>
      </group>
    </group>
  );
}
