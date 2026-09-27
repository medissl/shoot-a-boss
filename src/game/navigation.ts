import * as THREE from "three";
import { ARENA_HALF_SIZE, ENEMY_BLOCKERS } from "./config";

export function isEnemyPositionBlocked(
  x: number,
  z: number,
  radius: number,
) {
  return ENEMY_BLOCKERS.some((blocker) => {
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
): [number, number, number] {
  if (!isEnemyPositionBlocked(spawn[0], spawn[2], radius)) return spawn;

  for (let ring = 1; ring <= 8; ring += 1) {
    const distance = ring * 2.2;
    for (let step = 0; step < 12; step += 1) {
      const angle = (step / 12) * Math.PI * 2;
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
      if (!isEnemyPositionBlocked(x, z, radius)) return [x, 0, z];
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
  padding = 0.15,
) {
  return !ENEMY_BLOCKERS.some((blocker) =>
    segmentIntersectsBox(start, end, blocker, padding),
  );
}

export function moveWithAvoidance(
  position: THREE.Vector3,
  motion: THREE.Vector3,
  radius: number,
  sideBias = 1,
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
      !isEnemyPositionBlocked(nextX, nextZ, radius) &&
      !isEnemyPositionBlocked(
        lookX,
        lookZ,
        Math.max(0.2, radius * 0.72),
      )
    ) {
      position.x = nextX;
      position.z = nextZ;
      position.y = 0;
      return;
    }
  }

  position.y = 0;
}
