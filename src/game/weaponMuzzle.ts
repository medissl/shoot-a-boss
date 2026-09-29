import * as THREE from "three";
import type { WeaponId } from "./config";

export const SKIN_MUZZLES: Record<WeaponId, readonly [number, number]> = {
  rifle: [292, 232], shotgun: [286, 229], sniper: [269, 219], knife: [305, 202],
};

/** The drawn weapon is an SVG overlay. Project its transformed muzzle anchor
 * into the world so the Three.js tracer begins at the visible barrel tip. */
export function weaponMuzzleWorldPosition(
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  weapon: Exclude<WeaponId, "knife">,
  scoped: boolean,
): THREE.Vector3 | null {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const cameraPosition = camera.getWorldPosition(new THREE.Vector3());
  const depth = scoped ? 0.75 : 1.15;
  const anchor = document.querySelector<SVGCircleElement>(
    `.weapon-view--${weapon}.${scoped ? "is-scoped" : "is-hip"} [data-weapon-muzzle]`,
  );
  const viewport = canvas.getBoundingClientRect();

  if (anchor && viewport.width > 0 && viewport.height > 0) {
    // getBoundingClientRect includes the SVG viewBox, layout, and animated CSS
    // transforms on every parent. A zero-radius circle yields the exact tip.
    const tip = anchor.getBoundingClientRect();
    const ndcX = ((tip.left + tip.width / 2 - viewport.left) / viewport.width) * 2 - 1;
    const ndcY = 1 - ((tip.top + tip.height / 2 - viewport.top) / viewport.height) * 2;
    if (Number.isFinite(ndcX) && Number.isFinite(ndcY)) {
      // A point on the camera's view plane at a fixed muzzle depth projects
      // back to the exact pixel occupied by the transformed SVG anchor.
      const nearPoint = new THREE.Vector3(ndcX, ndcY, -1).unproject(camera);
      const ray = nearPoint.sub(cameraPosition).normalize();
      const alongForward = ray.dot(forward);
      if (alongForward > 0.01) {
        return cameraPosition.addScaledVector(ray, depth / alongForward);
      }
    }
  }

  // During a weapon or ADS transition, skip this visual rather than create a
  // false origin beside the crosshair. The camera raycast still deals damage.
  return null;
}
