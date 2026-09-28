import * as THREE from "three";
import { ARENA_HALF_SIZE } from "./config";
import { CAVE_CENTER_Z, CAVE_WALL_RADIUS, getLevelBlockers, getLevelDefinition, HELL_MOUNTAIN_RADIUS, JUNGLE_LOGS } from "./levels";

function caveWall(x: number, z: number, padding: number) {
  const dz = z - CAVE_CENTER_Z;
  const radius = Math.hypot(x, dz);
  const angle = Math.atan2(x, dz);
  return Math.abs(angle) >= 0.185 &&
    radius > CAVE_WALL_RADIUS - 1.8 - padding &&
    radius < CAVE_WALL_RADIUS + 1.8 + padding;
}

export function isEnemyPositionBlocked(
  x: number,
  z: number,
  radius: number,
  level: number,
) {
  const theme = getLevelDefinition(level).theme;
  if (theme === "gems" && caveWall(x, z, radius)) return true;
  if (theme === "hell" && Math.hypot(x, z - CAVE_CENTER_Z) < HELL_MOUNTAIN_RADIUS + radius) return true;
  if (theme === "jungle" && radius > 0.9 && JUNGLE_LOGS.some((log) => {
    const dx = x - log.x;
    const dz = z - log.z;
    const across = log.angle === 0 ? dx : dz;
    const along = log.angle === 0 ? dz : dx;
    return Math.abs(across) < 3.05 + radius && Math.abs(along) < log.length / 2 + radius;
  })) return true;
  return getLevelBlockers(level).some((blocker) => {
    const halfW = blocker.w / 2 + radius;
    const halfD = blocker.d / 2 + radius;
    return (
      x > blocker.x - halfW &&
      x < blocker.x + halfW &&
      z > blocker.z - halfD &&
      z < blocker.z + halfD
    );
  });
}

export function safeEnemySpawn(
  spawn: [number, number, number],
  radius: number,
  level: number,
): [number, number, number] {
  if (!isEnemyPositionBlocked(spawn[0], spawn[2], radius, level)) return spawn;

  for (let ring = 1; ring <= 9; ring += 1) {
    const distance = ring * 2.25;
    for (let step = 0; step < 16; step += 1) {
      const angle = (step / 16) * Math.PI * 2;
      const x = THREE.MathUtils.clamp(
        spawn[0] + Math.cos(angle) * distance,
        -ARENA_HALF_SIZE + radius + 1,
        ARENA_HALF_SIZE - radius - 1,
      );
      const z = THREE.MathUtils.clamp(
        spawn[2] + Math.sin(angle) * distance,
        -ARENA_HALF_SIZE + radius + 1,
        ARENA_HALF_SIZE - radius - 1,
      );
      if (!isEnemyPositionBlocked(x, z, radius, level)) return [x, 0, z];
    }
  }

  return [0, 0, 0];
}

function segmentIntersectsBox(
  start: THREE.Vector3,
  end: THREE.Vector3,
  blocker: { x: number; z: number; w: number; d: number },
  padding: number,
) {
  const minX = blocker.x - blocker.w / 2 - padding;
  const maxX = blocker.x + blocker.w / 2 + padding;
  const minZ = blocker.z - blocker.d / 2 - padding;
  const maxZ = blocker.z + blocker.d / 2 + padding;

  const dx = end.x - start.x;
  const dz = end.z - start.z;
  let tMin = 0;
  let tMax = 1;

  const axes: Array<[number, number, number, number]> = [
    [start.x, dx, minX, maxX],
    [start.z, dz, minZ, maxZ],
  ];

  for (const [origin, delta, min, max] of axes) {
    if (Math.abs(delta) < 0.00001) {
      if (origin < min || origin > max) return false;
      continue;
    }

    const inv = 1 / delta;
    let t1 = (min - origin) * inv;
    let t2 = (max - origin) * inv;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }

  return tMax > 0.035 && tMin < 0.965;
}

export function hasEnemyLineOfSight(
  start: THREE.Vector3,
  end: THREE.Vector3,
  level: number,
  padding = 0.15,
) {
  const theme = getLevelDefinition(level).theme;
  const length = start.distanceTo(end);
  if (theme === "gems" || theme === "hell") {
    const samples = Math.ceil(length / 0.75);
    for (let step = 1; step < samples; step += 1) {
      const t = step / samples;
      const x = THREE.MathUtils.lerp(start.x, end.x, t);
      const y = THREE.MathUtils.lerp(start.y, end.y, t);
      const z = THREE.MathUtils.lerp(start.z, end.z, t);
      if (theme === "gems" && y < 18 && caveWall(x, z, padding)) return false;
      if (theme === "hell" && y < 23 && Math.hypot(x, z - CAVE_CENTER_Z) < HELL_MOUNTAIN_RADIUS + padding) return false;
    }
  }
  return !getLevelBlockers(level).some((blocker) =>
    segmentIntersectsBox(start, end, blocker, padding),
  );
}

export function moveWithAvoidance(
  position: THREE.Vector3,
  motion: THREE.Vector3,
  radius: number,
  sideBias: number,
  level: number,
  preserveHeight = false,
) {
  if (motion.lengthSq() <= 0.0000001) return;

  const min = -ARENA_HALF_SIZE + radius + 0.7;
  const max = ARENA_HALF_SIZE - radius - 0.7;
  const length = motion.length();
  const base = motion.clone().normalize();

  const angles = [
    0,
    sideBias * Math.PI * 0.2,
    -sideBias * Math.PI * 0.2,
    sideBias * Math.PI * 0.4,
    -sideBias * Math.PI * 0.4,
    sideBias * Math.PI * 0.62,
    -sideBias * Math.PI * 0.62,
    sideBias * Math.PI * 0.82,
    -sideBias * Math.PI * 0.82,
    Math.PI,
  ];

  for (const angle of angles) {
    const direction = base
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
      .normalize();

    const nextX = THREE.MathUtils.clamp(
      position.x + direction.x * length,
      min,
      max,
    );
    const nextZ = THREE.MathUtils.clamp(
      position.z + direction.z * length,
      min,
      max,
    );
    const lookX = THREE.MathUtils.clamp(
      position.x + direction.x * (radius + 1.45),
      min,
      max,
    );
    const lookZ = THREE.MathUtils.clamp(
      position.z + direction.z * (radius + 1.45),
      min,
      max,
    );

    if (
      !isEnemyPositionBlocked(nextX, nextZ, radius, level) &&
      !isEnemyPositionBlocked(
        lookX,
        lookZ,
        Math.max(0.2, radius * 0.72),
        level,
      )
    ) {
      position.x = nextX;
      position.z = nextZ;
      if (!preserveHeight) position.y = 0;
      return;
    }
  }

  if (!preserveHeight) position.y = 0;
}
