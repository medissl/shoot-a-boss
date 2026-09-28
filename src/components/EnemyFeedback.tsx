import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { magicTint } from "../game/magicEffects";

/** The same feedback works for every enemy model, including the flat drawings. */
export function EnemyFeedback({id,root}:{id:string;root:React.RefObject<THREE.Group | null>}) {
  const redUntil = useRef(0);
  const lastTint = useRef<string | null>(null);
  const original = useRef(new Map<THREE.Material, THREE.Color>());
  const flash = useRef<THREE.Mesh>(null);
  useEffect(() => {
    const colors = original.current;
    const onHit = (event: Event) => {
      const detail = (event as CustomEvent<{id:string;magic?:boolean}>).detail;
      if (detail.id === id) redUntil.current = performance.now()+(detail.magic ? 650 : 300);
    };
    const onImpact = (event: Event) => {
      const detail = (event as CustomEvent<{id:string;point:[number,number,number]}>).detail;
      if (detail.id !== id || !flash.current || !root.current) return;
      flash.current.position.copy(root.current.worldToLocal(new THREE.Vector3(...detail.point)));
      flash.current.visible = true;
      redUntil.current = performance.now()+300;
    };
    window.addEventListener("boss-hit",onHit);window.addEventListener("boss-impact",onImpact);
    return () => {window.removeEventListener("boss-hit",onHit);window.removeEventListener("boss-impact",onImpact);for(const [material,color] of colors) {const m=material as THREE.MeshBasicMaterial;if(m.color)m.color.copy(color);}};
  },[id,root]);
  useFrame(() => {
    const tint = performance.now()<redUntil.current ? "#ff343c" : magicTint(id);
    if (flash.current) {flash.current.visible = performance.now()<redUntil.current;flash.current.rotation.z += .13;}
    if (tint === lastTint.current || !root.current) return;
    lastTint.current = tint;
    root.current.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || object === flash.current || object.userData.ignoreProjectile) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        const m=material as THREE.MeshBasicMaterial;
        if (!m.color || m.transparent && m.opacity === 0) continue;
        if (!original.current.has(m)) original.current.set(m,m.color.clone());
        m.color.copy(tint ? new THREE.Color(tint) : original.current.get(m)!);
      }
    });
  });
  return <mesh ref={flash} visible={false} userData={{ignoreProjectile:true}}><icosahedronGeometry args={[.38,0]}/><meshBasicMaterial color="#ff4555" transparent opacity={.75} depthWrite={false}/></mesh>;
}
