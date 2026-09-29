import * as THREE from "three";
import type { WeaponId } from "./config";

/** The drawn weapon is an SVG overlay. Project its transformed muzzle anchor
 * into the world so the Three.js tracer begins at the visible barrel tip. */
export function weaponMuzzleWorldPosition(
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  weapon: Exclude<WeaponId, "knife">,
  scoped: boolean,
): THREE.Vector3 {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const cameraPosition = camera.getWorldPosition(new THREE.Vector3());
  const depth = scoped ? 0.75 : 1.15;
  const anchor = document.querySelector<SVGCircleElement>(
    `.weapon-view--${weapon}.${scoped ? "is-scoped" : "is-hip"} [data-weapon-muzzle]`,
  );
  const matrix = anchor?.getScreenCTM();
  const viewport = canvas.getBoundingClientRect();

  if (anchor && matrix && viewport.width > 0 && viewport.height > 0) {
    const tip = new DOMPoint(
      Number(anchor.getAttribute("cx")),
      Number(anchor.getAttribute("cy")),
    ).matrixTransform(matrix);
    const ndcX = ((tip.x - viewport.left) / viewport.width) * 2 - 1;
    const ndcY = 1 - ((tip.y - viewport.top) / viewport.height) * 2;
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

  // The weapon overlay may be mounting during a stage transition. This stays
  // off the crosshair until its SVG anchor is available on the next frame.
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  return cameraPosition.addScaledVector(forward, depth)
    .addScaledVector(right, scoped ? 0 : .42)
    .addScaledVector(up, scoped ? -.28 : -.34);
}
