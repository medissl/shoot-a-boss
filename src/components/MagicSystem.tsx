import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { magicHit, magicSplash, magicAreaPulse, magicTrails, magicPools, magicVisuals, tickMagic } from "../game/magicEffects";
import { equippedGearRank, type MagicType, useGameStore } from "../game/store";

const colors: Record<MagicType,string> = {fire:"#fb433b", crystal:"#ae65ff", ice:"#5ce6ff", water:"#3c97ff", thunder:"#ffe63f"};
type Shot = { id:number; kind:MagicType; rank:number; overtime:boolean; position:THREE.Vector3; direction:THREE.Vector3; born:number };
type Link = {id:number;from:[number,number,number];to:[number,number,number];color:string;until:number};
type Area = {id:number;kind:Exclude<MagicType,"fire">;rank:number;position:[number,number,number];target:string|null;born:number};
function GroundedCrystalTrail({position}:{position:[number,number,number]}) {
  const {scene}=useThree();
  const floorY=useMemo(() => {
    const walkable:THREE.Object3D[]=[];
    scene.traverse((object)=>{if(object instanceof THREE.Mesh && object.receiveShadow && !object.userData.targetId)walkable.push(object);});
    const ray=new THREE.Raycaster(new THREE.Vector3(position[0],Math.max(1,position[1]+.7),position[2]),new THREE.Vector3(0,-1,0),0,65);
    const surface=ray.intersectObjects(walkable,false).find((hit)=>hit.face && hit.face.normal.clone().transformDirection(hit.object.matrixWorld).y>.6);
    return (surface?.point.y ?? 0)+.08;
  },[position,scene]);
  return <mesh position={[position[0],floorY,position[2]]} rotation={[-Math.PI/2,0,0]} userData={{ignoreProjectile:true}}><circleGeometry args={[.56,6]}/><meshBasicMaterial color="#b477fb" transparent opacity={.67} depthWrite={false} side={THREE.DoubleSide}/></mesh>;
}
function Ball({shot,onDone}:{shot:Shot;onDone:(id:number)=>void}) {
  const root = useRef<THREE.Group>(null);
  const lastCheck = useRef(0);
  useFrame((_,delta) => {
    if (!root.current) return;
    const state = useGameStore.getState();
    if (state.screen !== "playing") return;
    const step = shot.direction.clone().multiplyScalar(Math.min(delta,.06)*27*(equippedGearRank(state,"arcana") >= 5 ? 1.11 : 1));
    root.current.position.add(step); root.current.rotation.y += delta*8;
    if (performance.now()-lastCheck.current < 28) return;
    lastCheck.current = performance.now();
    const pos = root.current.position;
    for (const [id, point] of Object.entries(state.enemyPositions)) {
      if (state.eliminated.includes(id)) continue;
      if (Math.hypot(pos.x-point[0],pos.z-point[2]) < (id.startsWith("target") ? 2.2 : id.startsWith("statue") ? 2.1 : 1.5) && Math.abs(pos.y-(point[1]+(id.startsWith("fly") ? 0 : 1))) < 2.7) {
        magicHit(shot.kind,shot.rank,id,[pos.x,pos.y,pos.z],shot.overtime); onDone(shot.id); return;
      }
    }
    if (pos.y < .08 || Math.max(Math.abs(pos.x),Math.abs(pos.z)) > 82 || performance.now()-shot.born > 3800) {magicSplash(shot.kind,shot.rank,[pos.x,pos.y,pos.z]);onDone(shot.id);}
  });
  return <group ref={root} position={shot.position} userData={{ignoreProjectile:true}}><mesh scale={1.8+Math.floor(shot.rank/5)*.18}><icosahedronGeometry args={[.44,1]}/><meshBasicMaterial color="#ff6032" toneMapped={false}/></mesh><mesh scale={2.4+Math.floor(shot.rank/5)*.3}><sphereGeometry args={[.42,8,8]}/><meshBasicMaterial color="#fa9a30" transparent opacity={.32} depthWrite={false}/></mesh>{shot.rank>=5 && <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.56+Math.floor(shot.rank/5)*.07,.07,6,18]}/><meshBasicMaterial color="white" toneMapped={false}/></mesh>}{Array.from({length:7+Math.floor(shot.rank/5)*2},(_,i) => <mesh key={i} position={[Math.sin(i*2)*.38,Math.cos(i*3)*.35,-.6-i*.27]}><octahedronGeometry args={[.2,0]}/><meshBasicMaterial color={i%3?"#ff702c":"#49464d"} transparent opacity={.75}/></mesh>)}</group>;
}
export function MagicSystem() {
  const {camera} = useThree();
  const [shots,setShots] = useState<Shot[]>([]);
  const [visuals,setVisuals] = useState(magicVisuals);
  const [trails,setTrails] = useState(magicTrails);
  const [pools,setPools] = useState(magicPools);
  const [links,setLinks] = useState<Link[]>([]);
  const [areas,setAreas] = useState<Area[]>([]);
  const areaProgress = useRef(new Map<number,{nextTick:number;hits:number}>());
  const [visualNow,setVisualNow] = useState(()=>performance.now());
  const counter = useRef(0);
  const nextVisual = useRef(0);
  useEffect(() => {
    const cast = (event: Event) => {
      const {kind,rank,overtime} = (event as CustomEvent<{kind:MagicType;rank:number;overtime:boolean}>).detail;
      const direction = new THREE.Vector3();camera.getWorldDirection(direction);
      const position = camera.getWorldPosition(new THREE.Vector3()).addScaledVector(direction,1.5);
      if(kind==="fire") {setShots((current) => [...current,{id:++counter.current,kind,rank,overtime,position,direction,born:performance.now()}]);return;}
      const live=useGameStore.getState();
      const origin=camera.getWorldPosition(new THREE.Vector3());
      const aimed=Object.entries(live.enemyPositions).filter(([id])=>!live.eliminated.includes(id)).map(([id,p])=>{
        const point=new THREE.Vector3(...p),forward=point.clone().sub(origin).dot(direction);
        return {id,point,forward,offset:point.clone().sub(origin).addScaledVector(direction,-forward).length()};
      }).filter(entry=>entry.forward>0&&entry.forward<65&&entry.offset<Math.max(2,entry.forward*.065)).sort((a,b)=>a.offset-b.offset)[0];
      const distance=direction.y<-.08?Math.min(55,Math.max(5,(-origin.y)/direction.y)):32;
      const ground=origin.clone().addScaledVector(direction,distance);
      const target=aimed?.point??ground;
      const id=++counter.current,born=performance.now();
      areaProgress.current.set(id,{nextTick:born+200,hits:0});
      setAreas(current=>[...current,{id,kind,rank,target:aimed?.id??null,position:[target.x,.1,target.z],born}]);
    };
    const connect=(event:Event)=>{const detail=(event as CustomEvent<Omit<Link,"id"|"until">>).detail;setLinks((current)=>[...current.slice(-7),{...detail,id:++counter.current,until:performance.now()+420}]);};
    window.addEventListener("magic-cast",cast);window.addEventListener("magic-link",connect);
    return () => {window.removeEventListener("magic-cast",cast);window.removeEventListener("magic-link",connect);};
  },[camera]);
  useFrame(() => {
    tickMagic();const now=performance.now();
    for(const area of areas){
      const progress=areaProgress.current.get(area.id);
      if(!progress)continue;
      if(now-area.born>(area.kind==="water"?4300:area.kind==="thunder"?850:2300)){areaProgress.current.delete(area.id);continue;}
      if(now<progress.nextTick)continue;
      if(area.kind==="thunder"){
        if(!progress.hits&&area.target)magicHit("thunder",area.rank,area.target,area.position);
        progress.hits++;progress.nextTick=Infinity;
      }else if(area.kind==="water"){
        if(progress.hits<6)magicAreaPulse("water",area.rank,area.position,progress.hits===0);
        progress.hits++;progress.nextTick=now+600;
      }else{
        if(!progress.hits)magicAreaPulse(area.kind,area.rank,area.position,true);
        progress.hits++;progress.nextTick=Infinity;
      }
    }
    if(now>nextVisual.current){nextVisual.current=now+180;setVisualNow(now);setVisuals(magicVisuals());setTrails(magicTrails());setPools(magicPools());setLinks(current=>current.filter(link=>link.until>now));setAreas(current=>current.filter(area=>now-area.born<(area.kind==="water"?4300:area.kind==="thunder"?850:2300)));}
  });
  const positions = useGameStore((s) => s.enemyPositions);
  return <>
    {shots.map((shot) => <Ball key={shot.id} shot={shot} onDone={(id) => setShots((current) => current.filter((item) => item.id !== id))}/>)}
    {areas.map(area=>{const age=(visualNow-area.born)/1000;const [x,y,z]=area.position;return <group key={area.id} position={[x,y,z]} userData={{ignoreProjectile:true}}>
      {area.kind==="thunder"?<>{age>.18&&<mesh position={[0,12,0]}><cylinderGeometry args={[.16,.33,24,7]}/><meshBasicMaterial color="#fffbd8" toneMapped={false}/></mesh>}<mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.1,1.5,12]}/><meshBasicMaterial color="#f9e94d" side={THREE.DoubleSide}/></mesh></>:
       area.kind==="water"?<><mesh position={[0,5,0]} scale={[3,1.2,2]}><icosahedronGeometry args={[1,1]}/><meshBasicMaterial color="#eaf8ff"/></mesh>{Array.from({length:12},(_,i)=><mesh key={i} position={[Math.sin(i*2)*2.7,3-(age*4+i*.47)%3.8,Math.cos(i*2)*2]}><boxGeometry args={[.07,.45,.07]}/><meshBasicMaterial color="#479ae9"/></mesh>)}<mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[3.5,4,24]}/><meshBasicMaterial color="#55b9f0" transparent opacity={.5} side={THREE.DoubleSide}/></mesh></>:
       area.kind==="ice"?<>{Array.from({length:9},(_,i)=>{const a=i*Math.PI*2/9;return <mesh key={i} position={[Math.cos(a)*2.4,Math.min(1,age*3)*1.2,Math.sin(a)*2.4]} rotation={[0,a,0]}><coneGeometry args={[.55,2.4+(i%3)*.6,4]}/><meshBasicMaterial color="#91e9ff" transparent opacity={.8}/></mesh>;})}</>:
       <>{Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return <mesh key={i} position={[Math.cos(a)*3,1.3,Math.sin(a)*3]} rotation={[0,a,.2]}><octahedronGeometry args={[.9,0]}/><meshBasicMaterial color="#9c6bea" transparent opacity={.8}/></mesh>;})}</>}
    </group>;})}
    {trails.map((trail,index) => <GroundedCrystalTrail key={`${trail.runId}-${index}-${trail.until}`} position={trail.position}/>)}
    {pools.map((pool,index)=><mesh key={`pool-${index}`} position={[pool.position[0],Math.max(.09,pool.position[1]-1),pool.position[2]]} rotation={[-Math.PI/2,0,0]} userData={{ignoreProjectile:true}}><circleGeometry args={[pool.radius,24]}/><meshBasicMaterial color="#ff581f" toneMapped={false} transparent opacity={.38} depthWrite={false} side={THREE.DoubleSide}/></mesh>)}
    {links.map((link)=>{const start=new THREE.Vector3(...link.from),end=new THREE.Vector3(...link.to),difference=end.clone().sub(start);return <mesh key={`link-${link.id}`} position={start.clone().add(end).multiplyScalar(.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),difference.clone().normalize())} userData={{ignoreProjectile:true}}><cylinderGeometry args={[.08,.08,difference.length(),6]}/><meshBasicMaterial color={link.color} toneMapped={false} depthTest={false} depthWrite={false}/></mesh>;})}
    {visuals.map(({id,kind}) => {const p=positions[id];if(!p) return null; return <group key={id} position={[p[0],p[1]+(id.startsWith("fly") ? 0 : 1),p[2]]} userData={{ignoreProjectile:true}}><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.8,0]}><ringGeometry args={[.5,.78,7]}/><meshBasicMaterial color={colors[kind]} side={THREE.DoubleSide} transparent opacity={.75}/></mesh>{kind === "ice" && <mesh position={[0,-.65,0]}><octahedronGeometry args={[.6,0]}/><meshBasicMaterial color="#6ee3ff" transparent opacity={.6}/></mesh>}{kind !== "water" && <mesh position={[0,.4,0]}><torusGeometry args={[.8,.06,6,12]}/><meshBasicMaterial color={colors[kind]} transparent opacity={.75}/></mesh>}{[0,1,2,3].map((i) => <mesh key={i} position={[Math.cos(i*1.57)*.85, i%2 ? -.2 : .9, Math.sin(i*1.57)*.85]}><octahedronGeometry args={[.1,0]}/><meshBasicMaterial color={colors[kind]}/></mesh>)}</group>;})}
  </>;
}
