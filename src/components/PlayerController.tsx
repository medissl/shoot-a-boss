import {
  CapsuleCollider,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getLevelDefinition, getLevelLadders, getPlayerSpawn, ZIPLINES } from "../game/levels";
import { getUpgradeStats } from "../game/progression";
import { equippedGearRank, useGameStore } from "../game/store";
import { isTouchMode, touchInput } from "../game/touch";
import { prefersFullscreen, restorePreferredFullscreen } from "../game/fullscreen";

const WALK_SPEED = 6.6;
const RUN_SPEED = 10.4;
const CROUCH_SPEED = 3.7;
const JUMP_SPEED = 6.15;
const BOOST_JUMP_SPEED = 7.15;
const SLIDE_SPEED = 15.25;
const SLIDE_MS = 690;
const CROUCH_BOOST_WINDOW_MS = 420;
const CLIMB_SPEED = 4.55;
const LOOK_RADIANS_PER_PIXEL = 0.00215;

export function PlayerController() {
  const body = useRef<RapierRigidBody>(null);
  const keys = useRef<Record<string, boolean>>({});
  const jumpQueued = useRef(false);
  const slideUntil = useRef(0);
  const slideStartedAt = useRef(0);
  const wasSliding = useRef(false);
  const sprintStartedAt = useRef(0);
  const slideDirection = useRef(new THREE.Vector3());
  const lastCrouchAt = useRef(-Infinity);
  const wasGrounded = useRef(true);
  const wentAirborne = useRef(false);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const pointerLocked = useRef(false);
  const cameraTarget = useRef(new THREE.Vector3());
  const climbingActive = useRef(false);
  const ziplineRoute = useRef<(typeof ZIPLINES)[number] | null>(null);
  const ziplineProgress = useRef(0);
  const stickySlowUntil = useRef(0);
  const lastRecovery = useRef(-Infinity);

  const { camera, gl } = useThree();
  const cameraRef = useRef(camera);
  const screen = useGameStore((state) => state.screen);
  const level = useGameStore((state) => state.currentLevel);
  const weapon = useGameStore((state) => state.weapon);
  const upgrades = useGameStore((state) => state.upgrades);
  const pause = useGameStore((state) => state.pause);
  const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);
  const setMovementMode = useGameStore((state) => state.setMovementMode);

  useEffect(() => {
    const slow = (event: Event) => { stickySlowUntil.current = Math.max(stickySlowUntil.current, (event as CustomEvent<{until:number}>).detail.until); };
    const lift = () => {const rigid=body.current;if(rigid){const velocity=rigid.linvel();rigid.setLinvel({x:velocity.x,y:8.7,z:velocity.z},true);}};
    window.addEventListener("sticky-slow", slow);
    window.addEventListener("heaven-cloud-lift", lift);
    return () => {window.removeEventListener("sticky-slow", slow);window.removeEventListener("heaven-cloud-lift", lift);};
  }, []);

  useEffect(() => {
    const activeCamera = cameraRef.current;
    activeCamera.rotation.order = "YXZ";
    yaw.current = activeCamera.rotation.y;
    pitch.current = THREE.MathUtils.clamp(
      activeCamera.rotation.x,
      -1.42,
      1.42,
    );

    const canvas = gl.domElement;

    const requestLock = () => {
      if (
        !isTouchMode() &&
        useGameStore.getState().screen === "playing" &&
        !useGameStore.getState().tutorialOpen &&
        document.pointerLockElement !== canvas
      ) {
        void canvas.requestPointerLock();
      }
    };

    const pointerChange = () => {
      const locked = document.pointerLockElement === canvas;
      pointerLocked.current = locked;

      if (!locked && !isTouchMode() && useGameStore.getState().screen === "playing") {
        pause();
      }
    };

    const rotateView = (dx: number, dy: number, multiplier = 1) => {
      const speed = LOOK_RADIANS_PER_PIXEL * useGameStore.getState().sensitivity * multiplier;
      yaw.current -= THREE.MathUtils.clamp(dx, -44, 44) * speed;
      pitch.current = THREE.MathUtils.clamp(pitch.current - THREE.MathUtils.clamp(dy, -44, 44) * speed, -1.42, 1.42);
      activeCamera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
      useGameStore.getState().setPlayerYaw(yaw.current);
    };

    const mouseMove = (event: MouseEvent) => {
      if (
        !pointerLocked.current ||
        useGameStore.getState().screen !== "playing"
      ) {
        return;
      }

      // Browsers can occasionally report huge movement deltas when pointer lock
      // engages/disengages. Capping a single event prevents instant 180°/sky snaps.
      rotateView(event.movementX, event.movementY);
    };

    const touchLook = (event: Event) => {
      if (useGameStore.getState().screen !== "playing") return;
      const { dx, dy } = (event as CustomEvent<{ dx: number; dy: number }>).detail;
      rotateView(dx, dy, 1.35);
    };

    const preventMenu = (event: Event) => event.preventDefault();

    canvas.addEventListener("pointerdown", requestLock);
    canvas.addEventListener("contextmenu", preventMenu);
    document.addEventListener("pointerlockchange", pointerChange);
    document.addEventListener("mousemove", mouseMove);
    window.addEventListener("touch-look", touchLook);

    return () => {
      canvas.removeEventListener("pointerdown", requestLock);
      canvas.removeEventListener("contextmenu", preventMenu);
      document.removeEventListener("pointerlockchange", pointerChange);
      document.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("touch-look", touchLook);
    };
  }, [gl, pause]);

  useEffect(() => {
    if (
      screen !== "playing" &&
      document.pointerLockElement === gl.domElement
    ) {
      document.exitPointerLock();
    }
  }, [gl, screen]);

  useEffect(() => {
    function movementVector() {
      const forward = new THREE.Vector3();
      cameraRef.current.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() > 0.0001) forward.normalize();

      const right = new THREE.Vector3()
        .crossVectors(forward, cameraRef.current.up)
        .normalize();
      const input = new THREE.Vector3();

      if (keys.current.KeyW) input.add(forward);
      if (keys.current.KeyS) input.sub(forward);
      if (keys.current.KeyD) input.add(right);
      if (keys.current.KeyA) input.sub(right);
      if (isTouchMode()) input.addScaledVector(forward, -touchInput.y).addScaledVector(right, touchInput.x);
      if (input.lengthSq() > 1) input.normalize();
      return input;
    }

    const down = (event: KeyboardEvent) => {
      if (event.code === "Escape" || event.code === "KeyP") {
        if (event.repeat) return;
        const state = useGameStore.getState();
        if (state.tutorialOpen) return;
        if (state.screen === "playing") {
          if (document.pointerLockElement) document.exitPointerLock();
          state.pause();
        } else if (state.screen === "paused") {
          if (prefersFullscreen() && !document.fullscreenElement) {
            void restorePreferredFullscreen().then((restored) => {
              if (restored) useGameStore.getState().resume();
            });
          } else state.resume();
        }
        return;
      }
      if (event.repeat && ["Space", "KeyC"].includes(event.code)) return;
      keys.current[event.code] = true;

      if (event.code === "Space") {
        event.preventDefault();
        jumpQueued.current = true;
      }

      if (event.code === "KeyE" && !ziplineRoute.current &&
        useGameStore.getState().screen === "playing" &&
        getLevelDefinition(useGameStore.getState().currentLevel).theme === "jungle") {
        const position = body.current?.translation();
        if (position) {
          const near = (point: [number, number, number]) =>
            Math.hypot(position.x - point[0], position.z - point[2]) < 3.7 &&
            position.y > 5.5 && position.y < 9;
          const forward = ZIPLINES.find(({ from }) => near(from));
          const backward = ZIPLINES.find(({ to }) => near(to));
          const route = event.shiftKey && backward
            ? { from: backward.to, to: backward.from }
            : forward ?? (backward ? { from: backward.to, to: backward.from } : null);
          if (route) {
            ziplineRoute.current = route;
            ziplineProgress.current = 0;
          }
        }
      }

      if (event.code === "KeyC") {
        lastCrouchAt.current = performance.now();
        const direction = movementVector();
        const rigid = body.current;
        const nearGround = rigid ? rigid.translation().y <= 1.52 : false;

        if (nearGround && direction.lengthSq() > 0) {
          slideDirection.current.copy(direction);
          slideUntil.current = performance.now() + SLIDE_MS;
          slideStartedAt.current = performance.now();
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
  }, []);

  useFrame((_state, delta) => {
    const rigid = body.current;
    if (!rigid || screen !== "playing" || useGameStore.getState().tutorialOpen) return;

    const velocity = rigid.linvel();

    const forward = new THREE.Vector3();
    cameraRef.current.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0.0001) forward.normalize();

    const right = new THREE.Vector3()
      .crossVectors(forward, cameraRef.current.up)
      .normalize();

    const input = new THREE.Vector3();
    if (keys.current.KeyW) input.add(forward);
    if (keys.current.KeyS) input.sub(forward);
    if (keys.current.KeyD) input.add(right);
    if (keys.current.KeyA) input.sub(right);
    if (isTouchMode()) input.addScaledVector(forward, -touchInput.y).addScaledVector(right, touchInput.x);
    if (input.lengthSq() > 1) input.normalize();

    const now = performance.now();
    const position = rigid.translation();
    if ((position.y < -12 || Math.abs(position.x) > 125 || Math.abs(position.z) > 125) && now - lastRecovery.current > 2500) {
      lastRecovery.current = now;
      ziplineRoute.current = null;
      rigid.setGravityScale(1, true);
      const safe = getPlayerSpawn(level);
      rigid.setTranslation({ x: safe[0], y: safe[1], z: safe[2] }, true);
      rigid.setLinvel({ x: 0, y: 0, z: 0 }, true);
      setPlayerPosition(safe);
      useGameStore.getState().damagePlayer(8, [position.x, position.y, position.z], true);
      window.dispatchEvent(new CustomEvent("map-hazard-notice", { detail: { message: level === 12 ? "THE CLOUDS CATCH YOU" : "BACK INSIDE THE DREAM" } }));
      return;
    }

    const riding = ziplineRoute.current !== null;
    if (riding) {
      const route = ziplineRoute.current!;
      const length = Math.hypot(route.to[0] - route.from[0], route.to[2] - route.from[2]);
      ziplineProgress.current = Math.min(1, ziplineProgress.current + delta * 21 / length);
      const t = ziplineProgress.current;
      rigid.setGravityScale(0, true);
      rigid.setTranslation({
        x: THREE.MathUtils.lerp(route.from[0], route.to[0], t),
        y: route.from[1],
        z: THREE.MathUtils.lerp(route.from[2], route.to[2], t),
      }, true);
      rigid.setLinvel({ x: 0, y: 0, z: 0 }, true);
      if (t >= 1) {
        ziplineRoute.current = null;
        rigid.setGravityScale(1, true);
      }
    }

    const ladder = !riding && getLevelLadders(level).find(
      (zone) =>
        Math.abs(position.x - zone.x) <= zone.w / 2 &&
        Math.abs(position.z - zone.z) <= zone.d / 2 &&
        position.y >= zone.minY &&
        position.y <= zone.maxY + 0.35,
    );

    const climbingUp = Boolean(
      ladder && (keys.current.KeyW || keys.current.Space || (isTouchMode() && touchInput.y < -0.35)),
    );
    const climbingDown = Boolean(ladder && (keys.current.KeyS || (isTouchMode() && touchInput.y > 0.35)));
    const climbing = Boolean(ladder && (climbingUp || climbingDown));

    const sliding = !climbing && now < slideUntil.current;
    if (wasSliding.current && !sliding && now - slideStartedAt.current >= SLIDE_MS - 30 && equippedGearRank(useGameStore.getState(), "skates") >= 5)
      useGameStore.setState({ skateBoostUntil: now + 1500 });
    wasSliding.current = sliding;
    const crouching = Boolean(keys.current.KeyC) && !sliding && !climbing;
    const sprinting =
      Boolean(keys.current.ShiftLeft || keys.current.ShiftRight || (isTouchMode() && touchInput.sprint)) &&
      !crouching &&
      !sliding &&
      !climbing;
    if (sprinting && input.lengthSq() > .1) { if (!sprintStartedAt.current) sprintStartedAt.current = now; }
    else sprintStartedAt.current = 0;

    const upgradeStats = getUpgradeStats(upgrades);
    const pickupSpeed =
      now < useGameStore.getState().speedBoostUntil ? 1.25 : 1;
    const knifeSpeed = weapon === "knife" ? 1.2 * (1 + upgrades.knifeFoot * .08) * (now < useGameStore.getState().knifeRushUntil ? 1.12 : 1) : 1;
    const speedMultiplier = Math.min(1.8,
      pickupSpeed * upgradeStats.movement * knifeSpeed * (now < stickySlowUntil.current ? .8 : 1) * (now < useGameStore.getState().paperTrailUntil ? 1.2 : 1) *
      (1 + equippedGearRank(useGameStore.getState(), "boots") * 0.025 + (equippedGearRank(useGameStore.getState(), "boots") >= 5 && sprintStartedAt.current && now - sprintStartedAt.current >= 2000 ? .05 : 0) +
      (now < useGameStore.getState().skateBoostUntil ? .08 : 0)));

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
        THREE.MathUtils.lerp(WALK_SPEED, SLIDE_SPEED * (1 + equippedGearRank(useGameStore.getState(), "skates") * 0.05), remaining) *
        speedMultiplier;

      horizontal = slideDirection.current
        .clone()
        .multiplyScalar(slideStrength);
    }

    let vertical = velocity.y;
    let exitedLadder = false;

    if (climbing && ladder) {
      slideUntil.current = 0;
      horizontal.set(0, 0, 0);

      if (!climbingActive.current) {
        climbingActive.current = true;
        rigid.setGravityScale(0, true);
        rigid.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigid.setTranslation(
          {
            x: ladder.snapX,
            y: position.y,
            z: ladder.snapZ,
          },
          true,
        );
      }

      if (climbingUp && position.y >= ladder.maxY - 0.18) {
        rigid.setGravityScale(1, true);
        rigid.setTranslation(
          {
            x: ladder.exitX,
            y: ladder.exitY,
            z: ladder.exitZ,
          },
          true,
        );
        rigid.setLinvel({ x: 0, y: 0, z: 0 }, true);
        climbingActive.current = false;
        vertical = 0;
        exitedLadder = true;
      } else {
        vertical = climbingDown
          ? -CLIMB_SPEED * 0.82
          : CLIMB_SPEED;
      }
    } else if (climbingActive.current) {
      climbingActive.current = false;
      rigid.setGravityScale(1, true);
    }

    if (wantsJump) {
      const boosted =
        now - lastCrouchAt.current <= CROUCH_BOOST_WINDOW_MS;
      vertical =
        (boosted ? BOOST_JUMP_SPEED : JUMP_SPEED) * upgradeStats.jump;

      if (boosted) {
        const launchDirection = input.lengthSq() > 0 ? input : forward;
        horizontal = launchDirection
          .clone()
          .multiplyScalar(RUN_SPEED * 1.42 * speedMultiplier);
      }

      slideUntil.current = 0;
    }

    if (!exitedLadder && !riding) {
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
      ? 0.48
      : sliding
        ? 0.2
        : crouching
          ? 0.3
          : 0.52;

    cameraTarget.current.set(
      translated.x,
      translated.y + cameraHeight,
      translated.z,
    );

    const activeCamera = cameraRef.current;
    const targetDistance = activeCamera.position.distanceTo(cameraTarget.current);

    if (targetDistance > 2.2) {
      activeCamera.position.copy(cameraTarget.current);
    } else {
      const damping = climbing ? 18 : 30;
      const alpha = 1 - Math.exp(-damping * Math.min(delta, 0.05));
      activeCamera.position.lerp(cameraTarget.current, alpha);
    }

    setPlayerPosition([translated.x, translated.y, translated.z]);
    setMovementMode(movementMode);
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      enabledRotations={[false, false, false]}
      position={getPlayerSpawn(level)}
      mass={1}
      friction={0.18}
      linearDamping={0.12}
      ccd
    >
      <CapsuleCollider args={[0.55, 0.36]} />
    </RigidBody>
  );
}
