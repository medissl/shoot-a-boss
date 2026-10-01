import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { magicTint } from "../game/magicEffects";

/** The same feedback works for every enemy model, including the flat drawings. */
export function EnemyFeedback({id,root}:{id:string;root:React.RefObject<THREE.Group | null>}) {
  const redUntil = useRef(0);
  const delegatedUntil = useRef(0);
  const lastTint = useRef<string | null>(null);
  const original = useRef(new Map<THREE.Material, THREE.Color>());
  const flash = useRef<THREE.Mesh>(null);
  const delegated = useRef<THREE.Group>(null);
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
    const onDelegated = (event: Event) => { if ((event as CustomEvent<{id:string}>).detail.id === id) delegatedUntil.current = performance.now()+4000; };
    window.addEventListener("delegation-mark",onDelegated);
    return () => {window.removeEventListener("boss-hit",onHit);window.removeEventListener("boss-impact",onImpact);window.removeEventListener("delegation-mark",onDelegated);for(const [material,color] of colors) {const m=material as THREE.MeshBasicMaterial;if(m.color)m.color.copy(color);}};
  },[id,root]);
  useFrame(() => {
    const tint = performance.now()<redUntil.current ? "#ff343c" : magicTint(id);
    if (flash.current) {flash.current.visible = performance.now()<redUntil.current;flash.current.rotation.z += .13;}
    if (delegated.current) {delegated.current.visible=performance.now()<delegatedUntil.current;delegated.current.position.y=3.8+Math.sin(performance.now()*.008)*.18;}
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
  return <>
    <mesh ref={flash} visible={false} userData={{ignoreProjectile:true}}><icosahedronGeometry args={[.38,0]}/><meshBasicMaterial color="#ff4555" transparent opacity={.75} depthWrite={false}/></mesh>
    <group ref={delegated} visible={false} userData={{ignoreProjectile:true}}><mesh rotation={[0,0,Math.PI]}><coneGeometry args={[.32,.68,4]}/><meshBasicMaterial color="#f4364a" depthTest={false}/></mesh><mesh position={[0,.55,0]}><boxGeometry args={[.16,.45,.16]}/><meshBasicMaterial color="#f4364a" depthTest={false}/></mesh></group>
  </>;
}
