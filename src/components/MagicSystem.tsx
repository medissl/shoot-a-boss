import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { magicHit, magicSplash, magicTrails, magicVisuals, tickMagic } from "../game/magicEffects";
import { type MagicType, useGameStore } from "../game/store";

const colors: Record<MagicType,string> = {fire:"#fb433b", crystal:"#ae65ff", ice:"#5ce6ff", water:"#3c97ff", thunder:"#ffe63f"};
type Shot = { id:number; kind:MagicType; rank:number; position:THREE.Vector3; direction:THREE.Vector3; born:number };
function Ball({shot,onDone}:{shot:Shot;onDone:(id:number)=>void}) {
  const root = useRef<THREE.Group>(null);
  const lastCheck = useRef(0);
  useFrame((_,delta) => {
    if (!root.current) return;
    const state = useGameStore.getState();
    if (state.screen !== "playing") return;
    const step = shot.direction.clone().multiplyScalar(Math.min(delta,.06)*27);
    root.current.position.add(step); root.current.rotation.y += delta*8;
    if (performance.now()-lastCheck.current < 28) return;
    lastCheck.current = performance.now();
    const pos = root.current.position;
    for (const [id, point] of Object.entries(state.enemyPositions)) {
      if (state.eliminated.includes(id)) continue;
      if (Math.hypot(pos.x-point[0],pos.z-point[2]) < (id.startsWith("target") ? 2.2 : id.startsWith("statue") ? 2.1 : 1.5) && Math.abs(pos.y-(point[1]+(id.startsWith("fly") ? 0 : 1))) < 2.7) {
        magicHit(shot.kind,shot.rank,id,[pos.x,pos.y,pos.z]); onDone(shot.id); return;
      }
    }
    if (pos.y < .08 || Math.max(Math.abs(pos.x),Math.abs(pos.z)) > 82 || performance.now()-shot.born > 3800) {magicSplash(shot.kind,shot.rank,[pos.x,pos.y,pos.z]);onDone(shot.id);}
  });
  return <group ref={root} position={shot.position} userData={{ignoreProjectile:true}}><mesh><icosahedronGeometry args={[.44,shot.kind === "ice" ? 0 : 1]}/><meshBasicMaterial color={colors[shot.kind]}/></mesh><mesh scale={1.8}><sphereGeometry args={[.42,8,8]}/><meshBasicMaterial color={colors[shot.kind]} transparent opacity={.2} depthWrite={false}/></mesh>{Array.from({length:5},(_,i) => <mesh key={i} position={[Math.sin(i*2)*.22,Math.cos(i*3)*.2,-.6-i*.33]}><octahedronGeometry args={[.16,0]}/><meshBasicMaterial color={i%2 && shot.kind === "thunder" ? "white" : colors[shot.kind]} transparent opacity={.75}/></mesh>)}</group>;
}
export function MagicSystem() {
  const {camera} = useThree();
  const [shots,setShots] = useState<Shot[]>([]);
  const [visuals,setVisuals] = useState(magicVisuals);
  const [trails,setTrails] = useState(magicTrails);
  const counter = useRef(0);
  const nextVisual = useRef(0);
  useEffect(() => {
    const cast = (event: Event) => {
      const {kind,rank} = (event as CustomEvent<{kind:MagicType;rank:number}>).detail;
      const direction = new THREE.Vector3();camera.getWorldDirection(direction);
      const position = camera.getWorldPosition(new THREE.Vector3()).addScaledVector(direction,1.5);
      setShots((current) => [...current,{id:++counter.current,kind,rank,position,direction,born:performance.now()}]);
    };
    window.addEventListener("magic-cast",cast);return () => window.removeEventListener("magic-cast",cast);
  },[camera]);
  useFrame(() => {tickMagic(); if (performance.now()>nextVisual.current) {nextVisual.current=performance.now()+180;setVisuals(magicVisuals());setTrails(magicTrails());}});
  const positions = useGameStore((s) => s.enemyPositions);
  return <>{shots.map((shot) => <Ball key={shot.id} shot={shot} onDone={(id) => setShots((current) => current.filter((item) => item.id !== id))}/>)}{trails.map((trail,index) => <mesh key={index} position={[trail.position[0],trail.position[1]+.08,trail.position[2]]} rotation={[-Math.PI/2,0,0]} userData={{ignoreProjectile:true}}><circleGeometry args={[.56,6]}/><meshBasicMaterial color="#b477fb" transparent opacity={.67} depthWrite={false} side={THREE.DoubleSide}/></mesh>)}{visuals.map(({id,kind}) => {const p=positions[id];if(!p) return null; return <group key={id} position={[p[0],p[1]+(id.startsWith("fly") ? 0 : 1),p[2]]} userData={{ignoreProjectile:true}}><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.8,0]}><ringGeometry args={[.5,.78,7]}/><meshBasicMaterial color={colors[kind]} side={THREE.DoubleSide} transparent opacity={.75}/></mesh>{kind === "ice" && <mesh position={[0,-.65,0]}><octahedronGeometry args={[.6,0]}/><meshBasicMaterial color="#6ee3ff" transparent opacity={.6}/></mesh>}{kind !== "water" && <mesh position={[0,.4,0]}><torusGeometry args={[.8,.06,6,12]}/><meshBasicMaterial color={colors[kind]} transparent opacity={.75}/></mesh>}{[0,1,2,3].map((i) => <mesh key={i} position={[Math.cos(i*1.57)*.85, i%2 ? -.2 : .9, Math.sin(i*1.57)*.85]}><octahedronGeometry args={[.1,0]}/><meshBasicMaterial color={colors[kind]}/></mesh>)}</group>;})}</>;
}
