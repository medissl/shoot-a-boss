import { PointerLockControls } from "@react-three/drei";
import {
  CapsuleCollider,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { LADDER_ZONES } from "../game/config";
import { useGameStore } from "../game/store";

const WALK_SPEED = 6.6;
const RUN_SPEED = 10.4;
const CROUCH_SPEED = 3.7;
const JUMP_SPEED = 5.4;
const BOOST_JUMP_SPEED = 6.4;
const SLIDE_SPEED = 13.2;
const SLIDE_MS = 620;
const CROUCH_BOOST_WINDOW_MS = 420;
const CLIMB_SPEED = 4.65;

export function PlayerController() {
  const body = useRef<RapierRigidBody>(null);
  const keys = useRef<Record<string, boolean>>({});
  const jumpQueued = useRef(false);
  const slideUntil = useRef(0);
  const slideDirection = useRef(new THREE.Vector3());
  const lastCrouchAt = useRef(-Infinity);
  const wasGrounded = useRef(true);
  const wentAirborne = useRef(false);
  const { camera } = useThree();
  const screen = useGameStore((state) => state.screen);
  const sensitivity = useGameStore((state) => state.sensitivity);
  const pause = useGameStore((state) => state.pause);
  const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);
  const setMovementMode = useGameStore((state) => state.setMovementMode);

  useEffect(() => {
    function movementVector() {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3()
        .crossVectors(forward, camera.up)
        .normalize();
      const input = new THREE.Vector3();
      if (keys.current.KeyW) input.add(forward);
      if (keys.current.KeyS) input.sub(forward);
      if (keys.current.KeyD) input.add(right);
      if (keys.current.KeyA) input.sub(right);
      return input.lengthSq() > 0 ? input.normalize() : input;
    }

    const down = (event: KeyboardEvent) => {
      if (event.repeat && ["Space", "KeyC"].includes(event.code)) return;
      keys.current[event.code] = true;

      if (event.code === "Space") {
        event.preventDefault();
        jumpQueued.current = true;
      }

      if (event.code === "KeyC") {
        lastCrouchAt.current = performance.now();
        const direction = movementVector();
        const rigid = body.current;
        const nearGround = rigid ? rigid.translation().y <= 1.52 : false;
        if (nearGround && direction.lengthSq() > 0) {
          slideDirection.current.copy(direction);
          slideUntil.current = performance.now() + SLIDE_MS;
        }
      }
    };

    const up = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [camera]);

  useFrame(() => {
    const rigid = body.current;
    if (!rigid || screen !== "playing") return;

    const velocity = rigid.linvel();
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3()
      .crossVectors(forward, camera.up)
      .normalize();

    const input = new THREE.Vector3();
    if (keys.current.KeyW) input.add(forward);
    if (keys.current.KeyS) input.sub(forward);
    if (keys.current.KeyD) input.add(right);
    if (keys.current.KeyA) input.sub(right);
    if (input.lengthSq() > 0) input.normalize();

    const now = performance.now();
    const position = rigid.translation();
    const ladder = LADDER_ZONES.find(
      (zone) =>
        Math.abs(position.x - zone.x) <= zone.w / 2 &&
        Math.abs(position.z - zone.z) <= zone.d / 2 &&
        position.y >= zone.minY &&
        position.y <= zone.maxY + 0.35,
    );

    const climbingUp = Boolean(
      ladder && (keys.current.KeyW || keys.current.Space),
    );
    const climbingDown = Boolean(ladder && keys.current.KeyS);
    const climbing = Boolean(ladder && (climbingUp || climbingDown));

    const sliding = !climbing && now < slideUntil.current;
    const crouching = Boolean(keys.current.KeyC) && !sliding && !climbing;
    const sprinting =
      Boolean(keys.current.ShiftLeft || keys.current.ShiftRight) &&
      !crouching &&
      !sliding &&
      !climbing;

    const speedMultiplier =
      now < useGameStore.getState().speedBoostUntil ? 1.62 : 1;

    const nearGround =
      position.y <= 1.52 ||
      (!climbing && Math.abs(velocity.y) < 0.12);

    if (!nearGround && !climbing) wentAirborne.current = true;
    if (nearGround && !wasGrounded.current && wentAirborne.current) {
      window.dispatchEvent(new Event("player-landed"));
      wentAirborne.current = false;
    }
    wasGrounded.current = nearGround || climbing;

    const wantsJump = jumpQueued.current && nearGround && !climbing;
    if (jumpQueued.current) jumpQueued.current = false;

    let horizontal = input.clone().multiplyScalar(
      (crouching ? CROUCH_SPEED : sprinting ? RUN_SPEED : WALK_SPEED) *
        speedMultiplier,
    );

    if (sliding) {
      const remaining = Math.max(0, (slideUntil.current - now) / SLIDE_MS);
      const slideStrength =
        THREE.MathUtils.lerp(WALK_SPEED, SLIDE_SPEED, remaining) *
        speedMultiplier;
      horizontal = slideDirection.current.clone().multiplyScalar(slideStrength);
    }

    let vertical = velocity.y;

    if (climbing && ladder) {
      slideUntil.current = 0;
      horizontal.set(0, 0, 0);

      if (climbingUp && position.y >= ladder.maxY - 0.25) {
        rigid.setTranslation(
          {
            x: ladder.exitX,
            y: ladder.exitY,
            z: ladder.exitZ,
          },
          true,
        );
        rigid.setLinvel({ x: 0, y: 0, z: 0 }, true);
        vertical = 0;
      } else {
        const snapX = THREE.MathUtils.lerp(position.x, ladder.snapX, 0.24);
        const snapZ = THREE.MathUtils.lerp(position.z, ladder.snapZ, 0.24);
        rigid.setTranslation(
          {
            x: snapX,
            y: position.y,
            z: snapZ,
          },
          true,
        );
        vertical = climbingDown ? -CLIMB_SPEED * 0.9 : CLIMB_SPEED;
      }
    }

    if (wantsJump) {
      const boosted =
        now - lastCrouchAt.current <= CROUCH_BOOST_WINDOW_MS;
      vertical = boosted ? BOOST_JUMP_SPEED : JUMP_SPEED;
      if (boosted) {
        const launchDirection = input.lengthSq() > 0 ? input : forward;
        horizontal = launchDirection
          .clone()
          .multiplyScalar(RUN_SPEED * 1.42 * speedMultiplier);
      }
      slideUntil.current = 0;
    }

    if (!climbing || (ladder && position.y < ladder.maxY - 0.25)) {
      rigid.setLinvel(
        {
          x: horizontal.x,
          y: vertical,
          z: horizontal.z,
        },
        true,
      );
    }

    const moving = input.lengthSq() > 0.001;
    const movementMode = climbing
      ? "walk"
      : sliding
        ? "slide"
        : crouching
          ? "crouch"
          : sprinting && moving
            ? "run"
            : moving
              ? "walk"
              : "idle";

    const translated = rigid.translation();
    const cameraHeight = climbing
      ? 0.46
      : sliding
        ? 0.2
        : crouching
          ? 0.3
          : 0.52;

    camera.position.set(
      translated.x,
      translated.y + cameraHeight,
      translated.z,
    );
    setPlayerPosition([translated.x, translated.y, translated.z]);
    setMovementMode(movementMode);
  });

  return (
    <>
      <RigidBody
        ref={body}
        colliders={false}
        enabledRotations={[false, false, false]}
        position={[0, 1.4, 12]}
        mass={1}
        friction={0.2}
        linearDamping={0.1}
      >
        <CapsuleCollider args={[0.55, 0.36]} />
      </RigidBody>

      <PointerLockControls
        enabled={screen === "playing"}
        pointerSpeed={sensitivity}
        onUnlock={() => {
          if (useGameStore.getState().screen === "playing") pause();
        }}
      />
    </>
  );
}
