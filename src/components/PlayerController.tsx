import { PointerLockControls } from "@react-three/drei";
import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
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
  const { camera } = useThree();
  const screen = useGameStore((state) => state.screen);
  const sensitivity = useGameStore((state) => state.sensitivity);
  const pause = useGameStore((state) => state.pause);
  const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);

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

    const position = rigid.translation();
    const nearGround = position.y <= 1.52;
    const wantsJump = jumpQueued.current && nearGround;
    if (jumpQueued.current) jumpQueued.current = false;

    let horizontal = input.clone().multiplyScalar(
      crouching ? CROUCH_SPEED : sprinting ? RUN_SPEED : WALK_SPEED,
    );

    if (sliding) {
      const remaining = Math.max(0, (slideUntil.current - now) / SLIDE_MS);
      const slideStrength = THREE.MathUtils.lerp(WALK_SPEED, SLIDE_SPEED, remaining);
      horizontal = slideDirection.current.clone().multiplyScalar(slideStrength);
    }

    let vertical = velocity.y;
    if (wantsJump) {
      const boosted = now - lastCrouchAt.current <= CROUCH_BOOST_WINDOW_MS;
      vertical = boosted ? BOOST_JUMP_SPEED : JUMP_SPEED;
      if (boosted) {
        const launchDirection = input.lengthSq() > 0 ? input : forward;
        horizontal = launchDirection.clone().multiplyScalar(RUN_SPEED * 1.42);
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

    const cameraHeight = sliding ? 0.2 : crouching ? 0.3 : 0.52;
    camera.position.set(position.x, position.y + cameraHeight, position.z);
    setPlayerPosition([position.x, position.y, position.z]);
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
