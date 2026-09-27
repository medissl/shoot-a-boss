import { PointerLockControls } from "@react-three/drei";
import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
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
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
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
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

    const input = new THREE.Vector3();
    if (keys.current.KeyW) input.add(forward);
    if (keys.current.KeyS) input.sub(forward);
    if (keys.current.KeyD) input.add(right);
    if (keys.current.KeyA) input.sub(right);
    if (input.lengthSq() > 0) input.normalize();

    const now = performance.now();
    const sliding = now < slideUntil.current;
    const crouching = Boolean(keys.current.KeyC) && !sliding;
    const sprinting = Boolean(keys.current.ShiftLeft || keys.current.ShiftRight) && !crouching && !sliding;
    const speedMultiplier =
      now < useGameStore.getState().speedBoostUntil ? 1.62 : 1;

    const position = rigid.translation();
    const ladder = LADDER_ZONES.find(
      (zone) =>
        Math.abs(position.x - zone.x) <= zone.w / 2 &&
        Math.abs(position.z - zone.z) <= zone.d / 2 &&
        position.y >= zone.minY &&
        position.y <= zone.maxY,
    );
    const climbing = Boolean(ladder && (keys.current.KeyW || keys.current.Space || keys.current.KeyS));
    const nearGround =
      position.y <= 1.52 ||
      (!climbing && Math.abs(velocity.y) < 0.12);

    if (!nearGround) wentAirborne.current = true;
    if (nearGround && !wasGrounded.current && wentAirborne.current) {
      window.dispatchEvent(new Event("player-landed"));
      wentAirborne.current = false;
    }
    wasGrounded.current = nearGround;

    const wantsJump = jumpQueued.current && nearGround;
    if (jumpQueued.current) jumpQueued.current = false;

    let horizontal = input.clone().multiplyScalar(
      (crouching ? CROUCH_SPEED : sprinting ? RUN_SPEED : WALK_SPEED) *
        speedMultiplier,
    );

    if (sliding) {
      const remaining = Math.max(0, (slideUntil.current - now) / SLIDE_MS);
      const slideStrength =
        THREE.MathUtils.lerp(WALK_SPEED, SLIDE_SPEED, remaining) * speedMultiplier;
      horizontal = slideDirection.current.clone().multiplyScalar(slideStrength);
    }

    let vertical = velocity.y;

    if (climbing && ladder) {
      vertical = keys.current.KeyS ? -4.2 : 4.8;
      horizontal.multiplyScalar(0.12);

      const snapX = THREE.MathUtils.lerp(position.x, ladder.x, 0.15);
      const snapZ = THREE.MathUtils.lerp(position.z, ladder.z, 0.15);
      rigid.setTranslation({ x: snapX, y: position.y, z: snapZ }, true);
    }

    if (wantsJump && !climbing) {
      const boosted = now - lastCrouchAt.current <= CROUCH_BOOST_WINDOW_MS;
      vertical = boosted ? BOOST_JUMP_SPEED : JUMP_SPEED;
      if (boosted) {
        const launchDirection = input.lengthSq() > 0 ? input : forward;
        horizontal = launchDirection
          .clone()
          .multiplyScalar(RUN_SPEED * 1.42 * speedMultiplier);
      }
      slideUntil.current = 0;
    }

    rigid.setLinvel(
      {
        x: horizontal.x,
        y: vertical,
        z: horizontal.z,
      },
      true,
    );

    const moving = input.lengthSq() > 0.001;
    const movementMode = sliding
      ? "slide"
      : crouching
        ? "crouch"
        : sprinting && moving
          ? "run"
          : moving
            ? "walk"
            : "idle";

    const cameraHeight = sliding ? 0.2 : crouching ? 0.3 : 0.52;
    camera.position.set(position.x, position.y + cameraHeight, position.z);
    setPlayerPosition([position.x, position.y, position.z]);
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
