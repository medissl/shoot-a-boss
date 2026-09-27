import * as THREE from "three";
import { ARENA_HALF_SIZE, ENEMY_BLOCKERS } from "./config";

function blocked(x: number, z: number, radius: number) {
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
    sideBias * Math.PI * 0.24,
    -sideBias * Math.PI * 0.24,
    sideBias * Math.PI * 0.48,
    -sideBias * Math.PI * 0.48,
    sideBias * Math.PI * 0.72,
    -sideBias * Math.PI * 0.72,
    Math.PI,
  ];

  for (const angle of angles) {
    const direction = base
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
      .normalize();

    const nextX = THREE.MathUtils.clamp(position.x + direction.x * length, min, max);
    const nextZ = THREE.MathUtils.clamp(position.z + direction.z * length, min, max);
    const lookX = THREE.MathUtils.clamp(
      position.x + direction.x * (radius + 1.15),
      min,
      max,
    );
    const lookZ = THREE.MathUtils.clamp(
      position.z + direction.z * (radius + 1.15),
      min,
      max,
    );

    if (
      !blocked(nextX, nextZ, radius) &&
      !blocked(lookX, lookZ, Math.max(0.2, radius * 0.72))
    ) {
      position.x = nextX;
      position.z = nextZ;
      position.y = 0;
      return;
    }
  }

  position.y = 0;
}
