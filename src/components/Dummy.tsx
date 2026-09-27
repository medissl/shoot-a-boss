import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BOSS_MAX_HP } from "../game/config";
import { enemyMotionFactor } from "../game/effects";
import { getLevelDefinition } from "../game/levels";
import {
  hasEnemyLineOfSight,
  moveWithAvoidance,
  safeEnemySpawn,
} from "../game/navigation";
import { useGameStore } from "../game/store";

type GrenadeDetail = {
  position: [number, number, number];
  radius: number;
  damage: number;
};

export type EnemyArchetype = "melee" | "ranged";
export type RangedWeapon = "handgun" | "bow";
type Pose = "idle" | "walk" | "punch" | "aim";
type HitPart = "head" | "body" | "leg";
type DamagePop = {
  id: number;
  amount: number;
  part: HitPart;
};

type BodySplat = {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
};

const BLUE = "#2548b8";
const PAPER = "#fbfaf4";
const SHADE = "#dbe3ff";
const RED = "#ef476f";
const PINK = "#ff91b8";
const ENEMY_RADIUS = 1.05;

function drawBoss(
  canvas: HTMLCanvasElement,
  pose: Pose,
  hit: boolean,
  archetype: EnemyArchetype,
  rangedWeapon: RangedWeapon,
  dead = false,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, 28);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 10;

  const skin = hit ? "#ff9bad" : "#f7d8bb";
  const shirt = hit ? "#ff6f8d" : PAPER;

  // Big round head.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, 112, 86, 73, -0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-86, 117, 17, Math.PI * 0.45, Math.PI * 1.55);
  ctx.arc(86, 117, 17, -Math.PI * 0.55, Math.PI * 0.55);
  ctx.stroke();

  // Angry eyebrows + eyes.
  ctx.beginPath();
  ctx.moveTo(-52, 84);
  ctx.lineTo(-15, 97);
  ctx.moveTo(15, 97);
  ctx.lineTo(52, 84);
  ctx.stroke();

  ctx.fillStyle = hit ? "#7a1730" : BLUE;
  if (dead) {
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 9;
    for (const x of [-31, 31]) {
      ctx.beginPath();
      ctx.moveTo(x - 10, 101);
      ctx.lineTo(x + 10, 121);
      ctx.moveTo(x + 10, 101);
      ctx.lineTo(x - 10, 121);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.arc(-31, 111, 7, 0, Math.PI * 2);
    ctx.arc(31, 111, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nose.
  ctx.beginPath();
  ctx.moveTo(0, 113);
  ctx.lineTo(-6, 130);
  ctx.lineTo(6, 130);
  ctx.stroke();

  // Big boss mustache.
  ctx.fillStyle = hit ? "#7a1730" : BLUE;
  ctx.beginPath();
  ctx.moveTo(0, 136);
  ctx.bezierCurveTo(-12, 122, -35, 124, -51, 139);
  ctx.bezierCurveTo(-33, 135, -19, 153, 0, 145);
  ctx.bezierCurveTo(19, 153, 33, 135, 51, 139);
  ctx.bezierCurveTo(35, 124, 12, 122, 0, 136);
  ctx.closePath();
  ctx.fill();

  // Grumpy mouth below mustache.
  ctx.strokeStyle = BLUE;
  ctx.beginPath();
  ctx.moveTo(-26, 159);
  ctx.quadraticCurveTo(0, 145, 26, 159);
  ctx.stroke();

  // Wider / fatter torso.
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.moveTo(-116, 194);
  ctx.quadraticCurveTo(-174, 270, -151, 397);
  ctx.quadraticCurveTo(-86, 447, 0, 452);
  ctx.quadraticCurveTo(86, 447, 151, 397);
  ctx.quadraticCurveTo(174, 270, 116, 194);
  ctx.quadraticCurveTo(58, 174, 0, 187);
  ctx.quadraticCurveTo(-58, 174, -116, 194);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Blue hatch / cel shade.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-116, 194);
  ctx.quadraticCurveTo(-174, 270, -151, 397);
  ctx.quadraticCurveTo(-86, 447, 0, 452);
  ctx.quadraticCurveTo(86, 447, 151, 397);
  ctx.quadraticCurveTo(174, 270, 116, 194);
  ctx.closePath();
  ctx.clip();
  ctx.globalAlpha = hit ? 0.17 : 0.25;
  ctx.strokeStyle = hit ? "#861f39" : BLUE;
  ctx.lineWidth = 4;
  for (let i = -190; i < 145; i += 21) {
    ctx.beginPath();
    ctx.moveTo(i, 308);
    ctx.lineTo(i + 118, 445);
    ctx.stroke();
  }
  ctx.restore();

  // Tie.
  ctx.fillStyle = hit ? "#7a1730" : SHADE;
  ctx.beginPath();
  ctx.moveTo(0, 198);
  ctx.lineTo(-22, 234);
  ctx.lineTo(-7, 332);
  ctx.lineTo(0, 350);
  ctx.lineTo(8, 332);
  ctx.lineTo(22, 234);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const walking = pose === "walk";
  const punching = pose === "punch";
  const aiming = pose === "aim";

  const leftHand: [number, number] = punching
    ? [-177, 216]
    : aiming
      ? [-153, 249]
      : [-167, 320 + (walking ? 13 : 0)];

  const rightHand: [number, number] = punching
    ? [194, 196]
    : aiming
      ? [177, 222]
      : [167, 320 - (walking ? 13 : 0)];

  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 19;
  ctx.beginPath();
  ctx.moveTo(-108, 231);
  ctx.lineTo(leftHand[0], leftHand[1]);
  ctx.moveTo(108, 231);
  ctx.lineTo(rightHand[0], rightHand[1]);
  ctx.stroke();

  ctx.fillStyle = skin;
  ctx.lineWidth = 8;
  for (const [x, y] of [leftHand, rightHand]) {
    ctx.beginPath();
    ctx.arc(x, y, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

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

  // Shorter legs under the larger torso.
  const step = walking ? 20 : 0;
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 23;
  ctx.beginPath();
  ctx.moveTo(-52, 424);
  ctx.lineTo(-61 - step, 545);
  ctx.moveTo(52, 424);
  ctx.lineTo(61 + step, 545);
  ctx.stroke();

  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-99 - step, 548);
  ctx.lineTo(-40 - step, 548);
  ctx.moveTo(40 + step, 548);
  ctx.lineTo(99 + step, 548);
  ctx.stroke();

  if (punching) {
    ctx.strokeStyle = RED;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(205, 164);
    ctx.lineTo(252, 142);
    ctx.moveTo(207, 192);
    ctx.lineTo(263, 192);
    ctx.moveTo(198, 219);
    ctx.lineTo(246, 245);
    ctx.stroke();
  }

  if (hit) {
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-128, 62);
    ctx.lineTo(-158, 36);
    ctx.moveTo(125, 65);
    ctx.lineTo(157, 38);
    ctx.moveTo(-151, 173);
    ctx.lineTo(-189, 184);
    ctx.moveTo(149, 171);
    ctx.lineTo(188, 185);
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
  const maxHp = Math.round(BOSS_MAX_HP * (1 + (useGameStore.getState().currentLevel - 1) * 0.085));
  const [hp, setHp] = useState(maxHp);
  const hpRef = useRef(maxHp);
  const [pose, setPose] = useState<Pose>("idle");
  const [hitFlash, setHitFlash] = useState(false);
  const [damagePops, setDamagePops] = useState<DamagePop[]>([]);
  const [bodySplats, setBodySplats] = useState<BodySplat[]>([]);
  const [dead, setDead] = useState(false);
  const [corpseGone, setCorpseGone] = useState(false);
  const nextDamagePopId = useRef(1);
  const nextBodySplatId = useRef(1);
  const deadAt = useRef(0);
  const spriteMaterial = useRef<THREE.MeshBasicMaterial>(null);

  const canvas = useMemo(() => {
    const element = document.createElement("canvas");
    element.width = 560;
    element.height = 660;
    return element;
  }, []);

  const texture = useMemo(() => {
    drawBoss(canvas, pose, hitFlash, archetype, rangedWeapon, dead);
    const next = new THREE.CanvasTexture(canvas);
    next.colorSpace = THREE.SRGBColorSpace;
    next.minFilter = THREE.LinearFilter;
    next.magFilter = THREE.LinearFilter;
    return next;
  }, [archetype, canvas, dead, hitFlash, pose, rangedWeapon]);

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
  const currentLevel = useGameStore((state) => state.currentLevel);
  const tuning = getLevelDefinition(currentLevel).enemy;
  const safeSpawn = useMemo(
    () => safeEnemySpawn(spawn, ENEMY_RADIUS, currentLevel),
    [currentLevel, spawn],
  );
  const roamTarget = useRef(new THREE.Vector3(...safeSpawn));
  const nextRoamAt = useRef(0);
  const awarenessUntil = useRef(0);
  const lastSeenPosition = useRef(new THREE.Vector3(...safeSpawn));
  const previousPlayerPosition = useRef<THREE.Vector3 | null>(null);

  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          id: string;
          damage: number;
          part?: HitPart;
        }>
      ).detail;
      if (detail.id !== id || eliminated) return;

      const part: HitPart =
        detail.part === "head" || detail.part === "leg"
          ? detail.part
          : "body";
      const popId = nextDamagePopId.current++;

      awarenessUntil.current = performance.now() + 5000;
      const nextHp = Math.max(0, hpRef.current - detail.damage);
      hpRef.current = nextHp;
      setHp(nextHp);
      if (nextHp <= 0 && !dead) {
        deadAt.current = performance.now();
        setDead(true);
        if (!eliminated) eliminate(id);
      }

      setDamagePops((current) => [
        ...current.slice(-3),
        { id: popId, amount: Math.round(detail.damage), part },
      ]);
      setHitFlash(true);

      window.setTimeout(() => setHitFlash(false), 135);
      window.setTimeout(() => {
        setDamagePops((current) => current.filter((pop) => pop.id !== popId));
      }, 760);
    };

    const impactHandler = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          id: string;
          point: [number, number, number];
        }>
      ).detail;
      const root = group.current;
      if (!root || detail.id !== id || dead) return;

      root.updateMatrixWorld();
      const local = root.worldToLocal(new THREE.Vector3(...detail.point));
      const splatId = nextBodySplatId.current++;
      setBodySplats((current) => [
        ...current.slice(-17),
        {
          id: splatId,
          x: local.x,
          y: local.y,
          size: 0.16 + Math.random() * 0.16,
          rotation: Math.random() * Math.PI,
        },
      ]);
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
      const nextHp = Math.max(0, hpRef.current - damage);
      hpRef.current = nextHp;
      setHp(nextHp);
      if (nextHp <= 0 && !dead) {
        deadAt.current = performance.now();
        setDead(true);
        if (!eliminated) eliminate(id);
      }
      setHitFlash(true);
      window.setTimeout(() => setHitFlash(false), 145);
    };

    window.addEventListener("boss-hit", handler as EventListener);
    window.addEventListener("boss-impact", impactHandler as EventListener);
    window.addEventListener("paper-grenade-explode", grenadeHandler as EventListener);
    return () => {
      window.removeEventListener("boss-hit", handler as EventListener);
      window.removeEventListener("boss-impact", impactHandler as EventListener);
      window.removeEventListener("paper-grenade-explode", grenadeHandler as EventListener);
    };
  }, [dead, eliminate, eliminated, id]);

  useFrame((state, delta) => {
    const root = group.current;
    const warning = warningRef.current;
    const shot = shotRef.current;

    if (!root || screen !== "playing") {
      if (warning) warning.visible = false;
      if (shot) shot.visible = false;
      return;
    }

    if (dead) {
      if (warning) warning.visible = false;
      if (shot) shot.visible = false;

      const elapsed = (performance.now() - deadAt.current) / 1000;
      const fall = THREE.MathUtils.smoothstep(elapsed, 0, 0.72);
      root.rotation.x = -Math.PI * 0.5 * fall;
      root.rotation.z = -0.08 * fall;

      if (spriteMaterial.current) {
        spriteMaterial.current.opacity =
          elapsed <= 7.1
            ? 1
            : THREE.MathUtils.clamp(1 - (elapsed - 7.1) / 0.9, 0, 1);
      }

      if (elapsed >= 8 && !corpseGone) setCorpseGone(true);
      return;
    }

    if (eliminated) return;
    if (enemyMotionFactor(id, useGameStore.getState().runId) === 0) {
      if (warning) warning.visible = false;
      return;
    }

    const player = new THREE.Vector3(...useGameStore.getState().playerPosition);
    const playerVelocity = previousPlayerPosition.current
      ? player.clone().sub(previousPlayerPosition.current).divideScalar(Math.max(delta, 0.016)).clampLength(0, 16)
      : new THREE.Vector3();
    previousPlayerPosition.current = player.clone();
    const here = root.position;
    const toPlayer = player.clone().sub(here);
    toPlayer.y = 0;
    const playerDistance = toPlayer.length();
    const playerDirection =
      playerDistance > 0.001 ? toPlayer.clone().normalize() : new THREE.Vector3();

    const forwardSight = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(root.quaternion)
      .setY(0);
    if (forwardSight.lengthSq() > 0.001) forwardSight.normalize();

    const inVisionCone =
      playerDistance < 9.5 * Math.min(1.2, tuning.vision) ||
      forwardSight.lengthSq() < 0.001 ||
      forwardSight.dot(playerDirection) > -0.55;

    const seesPlayer =
      playerDistance < 43 * tuning.vision &&
      inVisionCone &&
      hasEnemyLineOfSight(here, player, currentLevel, 0.18);

    const nowMs = performance.now();
    if (seesPlayer) {
      awarenessUntil.current = nowMs + 5600;
      lastSeenPosition.current.copy(player);
    }

    const aware = seesPlayer || nowMs < awarenessUntil.current;
    const motion = new THREE.Vector3();
    const now = state.clock.elapsedTime;
    const number = Number(id.split("-")[1]);
    let desiredPose: Pose = "idle";
    let faceTarget = roamTarget.current;

    if (!aware) {
      aimingUntil.current = 0;
      if (warning) warning.visible = false;
      if (shot) shot.visible = false;

      if (
        now >= nextRoamAt.current ||
        here.distanceTo(roamTarget.current) < 1.35
      ) {
        const angle = number * 1.91 + now * 0.73;
        const radius = 5.2 + (number % 3) * 2.1;
        const candidate: [number, number, number] = [
          safeSpawn[0] + Math.cos(angle) * radius,
          0,
          safeSpawn[2] + Math.sin(angle) * radius,
        ];
        const next = safeEnemySpawn(candidate, ENEMY_RADIUS, currentLevel);
        roamTarget.current.set(...next);
        nextRoamAt.current = now + 3.6 + (number % 3) * 0.7;
      }

      const roamDirection = roamTarget.current.clone().sub(here).setY(0);
      const roamDistance = roamDirection.length();
      if (roamDistance > 0.8) {
        roamDirection.normalize();
        motion.addScaledVector(roamDirection, 1.35 * delta);
        desiredPose = "walk";
        faceTarget = roamTarget.current;
      }
    } else {
      const target = seesPlayer ? player : lastSeenPosition.current;
      const towardTarget = target.clone().sub(here).setY(0);
      const targetDistance = towardTarget.length();
      const desired =
        targetDistance > 0.001
          ? towardTarget.clone().normalize()
          : new THREE.Vector3();
      const sideways = new THREE.Vector3(-desired.z, 0, desired.x);
      faceTarget = target;

      if (archetype === "melee") {
        if (targetDistance > 1.9) {
          motion.addScaledVector(desired, 2.7 * tuning.speed * delta);
          motion.addScaledVector(
            sideways,
            Math.sin(now * 2 + number) * 0.24 * delta * drift,
          );
          desiredPose = "walk";
        } else if (
          seesPlayer &&
          playerDistance < 2.0 &&
          now - lastPunch.current > Math.max(0.73, 1.08 - (currentLevel - 1) * 0.04)
        ) {
          lastPunch.current = now;
          punchUntil.current = now + 0.36;
          damagePlayer(Math.round(10 * tuning.damage));
        }

        if (now < punchUntil.current) desiredPose = "punch";
      } else {
        const currentlyAiming = aimingUntil.current > now;

        if (currentlyAiming && seesPlayer) {
          desiredPose = "aim";
          if (warning) {
            const muzzle = here.clone().add(new THREE.Vector3(0, 2.25, 0));
            setBeam(warning, muzzle, telegraphTarget.current, 0.018);
            warning.visible = true;
          }
        } else {
          if (warning) warning.visible = false;

          if (
            aimingUntil.current > 0 &&
            now >= aimingUntil.current &&
            seesPlayer
          ) {
            const muzzle = here.clone().add(new THREE.Vector3(0, 2.25, 0));
            shotTarget.current.copy(telegraphTarget.current);
            shotVisibleUntil.current = now + 0.095;

            if (player.distanceTo(telegraphTarget.current) < 1.65) {
              damagePlayer(
                Math.round((rangedWeapon === "bow" ? 14 : 12) * tuning.damage),
              );
            }

            aimingUntil.current = 0;
            nextRangedShot.current = now + Math.max(1.45, 2.35 - (currentLevel - 1) * 0.1) + (number % 3) * 0.18;

            if (shot) {
              setBeam(shot, muzzle, shotTarget.current, 0.034);
              shot.visible = true;
            }
          } else if (!seesPlayer) {
            aimingUntil.current = 0;
          }

          if (targetDistance < 9 && seesPlayer) {
            motion.addScaledVector(desired, -2.8 * tuning.speed * delta);
            motion.addScaledVector(sideways, 0.9 * tuning.speed * delta * drift);
            desiredPose = "walk";
          } else if (targetDistance > 18 || !seesPlayer) {
            motion.addScaledVector(desired, 1.9 * tuning.speed * delta);
            desiredPose = "walk";
          } else {
            motion.addScaledVector(
              sideways,
              Math.sin(now * 1.6 + number) * 0.95 * delta * drift,
            );
            desiredPose = "walk";

            if (seesPlayer && now >= nextRangedShot.current) {
              telegraphTarget.current.copy(player).addScaledVector(
                playerVelocity, Math.min(0.32, playerDistance / 75) * (currentLevel - 1) / 9,
              );
              telegraphTarget.current.y += 0.35;
              aimingUntil.current = now + Math.max(0.55, 0.78 - (currentLevel - 1) * 0.026);
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
    }

    const motionFactor = enemyMotionFactor(id, useGameStore.getState().runId);
    if (motionFactor === 0 && warning) warning.visible = false;
    moveWithAvoidance(here, motion.multiplyScalar(motionFactor), ENEMY_RADIUS, drift, currentLevel);

    root.lookAt(faceTarget.x, 0, faceTarget.z);
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
        1.8 + Math.sin(now * 5.2 + number) * (moving ? 0.035 : 0.01);
    }
  });

  if (corpseGone) return null;

  const hpRatio = Math.max(hp, 0) / maxHp;

  return (
    <>
      <group ref={group} position={safeSpawn}>
        <mesh
          position={[0, 1.8, 0]}
          userData={{ ignoreProjectile: true }}
        >
          <planeGeometry args={[3.35, 3.65]} />
          <meshBasicMaterial
            ref={spriteMaterial}
            map={texture}
            transparent
            alphaTest={0.06}
            side={THREE.DoubleSide}
          />
        </mesh>

        {!dead && (
          <mesh position={[0, 3.02, 0.08]} userData={{ targetId: id, targetPart: "head" }}>
          <planeGeometry args={[1.42, 1.22]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}

        {!dead && (
          <mesh position={[0, 1.84, 0.07]} userData={{ targetId: id, targetPart: "body" }}>
          <planeGeometry args={[3.15, 2.28]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}

        {!dead && (
          <mesh position={[0, 0.55, 0.09]} userData={{ targetId: id, targetPart: "leg" }}>
          <planeGeometry args={[2.18, 1.15]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}

        {!dead && (
          <group position={[0, 3.82, 0.04]} userData={{ ignoreProjectile: true }}>
          <mesh>
            <planeGeometry args={[1.82, 0.085]} />
            <meshBasicMaterial color="#b7c6f5" />
          </mesh>
          <mesh
            position={[-0.91 + hpRatio * 0.91, 0, 0.01]}
            scale={[hpRatio, 1, 1]}
          >
            <planeGeometry args={[1.8, 0.06]} />
            <meshBasicMaterial color={hitFlash ? RED : BLUE} />
          </mesh>
          </group>
        )}

        {bodySplats.map((splat) => (
          <group
            key={splat.id}
            position={[splat.x, splat.y, 0.13]}
            rotation={[0, 0, splat.rotation]}
            userData={{ ignoreProjectile: true }}
          >
            <mesh>
              <circleGeometry args={[splat.size, 9]} />
              <meshBasicMaterial
                color="#ff4f9a"
                transparent
                opacity={0.9}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            {[0, 1, 2, 3].map((petal) => (
              <mesh
                key={petal}
                position={[
                  Math.cos(petal * 1.57) * splat.size * 1.25,
                  Math.sin(petal * 1.57) * splat.size * 1.25,
                  0.001,
                ]}
              >
                <circleGeometry args={[splat.size * 0.34, 7]} />
                <meshBasicMaterial
                  color={petal % 2 ? "#ff83b9" : "#e93682"}
                  transparent
                  opacity={0.78}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        ))}

        {damagePops.map((pop, index) => (
          <Html
            key={pop.id}
            position={[0, 3.35 + index * 0.15, 0]}
            center
            zIndexRange={[40, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div className={`boss-damage-pop boss-damage-pop--${pop.part}`}>
              {pop.part === "head" && <span>HEADSHOT</span>}
              <strong>{pop.amount}</strong>
            </div>
          </Html>
        ))}
      </group>

      <mesh
        ref={warningRef}
        visible={false}
        userData={{ ignoreProjectile: true }}
      >
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshBasicMaterial
          color="#ff315e"
          transparent
          opacity={0.48}
          depthWrite={false}
        />
      </mesh>

      <mesh
        ref={shotRef}
        visible={false}
        userData={{ ignoreProjectile: true }}
      >
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
