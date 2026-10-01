import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { enemyHpScale, getEnemyTuning } from "../game/levels";
import { paperBlastDamage, type PaperBlast } from "../game/hazards";
import { useGameStore } from "../game/store";
import { EnemyFeedback } from "./EnemyFeedback";
import { ScanHalo } from "./ScanHalo";
import { EnemyDoodle } from "./EnemyDoodle";
import type { WorldSound } from "../game/worldSound";
function cue(kind:WorldSound,position:[number,number,number]) {window.dispatchEvent(new CustomEvent("world-sfx",{detail:{kind,position}}));}

const SEALS = ["left","right","chest"] as const;
type Move = "REDLINE BREATH"|"DEADLINE DIVE"|"FORM BARRAGE"|"RED TAPE RING";
const moves: Move[] = ["REDLINE BREATH","FORM BARRAGE","DEADLINE DIVE","RED TAPE RING"];

export function PaperworkDragon({ id = "dragon-final" }: { id?: string }) {
  const level = useGameStore(s=>s.currentLevel);
  const cycle = useGameStore(s=>s.ngPlusCycle);
  const maxHp = Math.round(2800*enemyHpScale(level,cycle)/enemyHpScale(12));
  const startingSeals:[number,number,number]=[230,230,230].map(x=>Math.round(x*maxHp/2800)) as [number,number,number];
  const root = useRef<THREE.Group>(null);
  const art = useRef<THREE.Group>(null);
  const telegraph = useRef<THREE.Mesh>(null);
  const breathWarning = useRef<THREE.Mesh>(null);
  const barrageWarnings = useRef<(THREE.Mesh|null)[]>([]);
  const [health,setHealth] = useState(maxHp);
  const [sealHp,setSealHp] = useState<[number,number,number]>(startingSeals);
  const [dead,setDead] = useState(false);
  const [flash,setFlash] = useState(false);
  const [pop,setPop] = useState("");
  const hp = useRef(maxHp);
  const seals = useRef<[number,number,number]>(startingSeals);
  const deathAt = useRef(0);
  const phase = useRef<"intro"|"idle"|"warn"|"attack"|"recover">("intro");
  const phaseAt = useRef(0);
  const attackCount = useRef(0);
  const move = useRef<Move>("REDLINE BREATH");
  const locked = useRef(new THREE.Vector3());
  const breathDirection = useRef(new THREE.Vector3(0,0,1));
  const lastDamage = useRef(-10);
  const lastPosition = useRef(0);
  const deathTimer = useRef<number | null>(null);
  const flashTimer = useRef<number | null>(null);
  const eliminate = useGameStore(s=>s.eliminate);
  const breathShape = useMemo(()=>{const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(-9,-18);shape.quadraticCurveTo(0,-20,9,-18);shape.lineTo(0,0);return shape;},[]);
  useEffect(()=>{
    const onHit=(event:Event)=>{
      const {id:target,damage,part}=(event as CustomEvent<{id:string;damage:number;part?:string}>).detail;
      if (hp.current<=0) return;
      setFlash(true);if(flashTimer.current)clearTimeout(flashTimer.current);flashTimer.current=window.setTimeout(()=>setFlash(false),110);
      const sealIndex=SEALS.findIndex(name=>target===`${id}-seal-${name}`);
      if (sealIndex>=0) {
        if (seals.current[sealIndex]<=0) return;
        seals.current[sealIndex]=Math.max(0,seals.current[sealIndex]-damage);
        setSealHp([...seals.current]);
        if (!seals.current[sealIndex]) {
          const remaining=seals.current.filter(value=>value>0).length;
          setPop(`SEAL BROKEN · ${remaining} REMAIN`);
          window.setTimeout(()=>setPop(""),1500);
        }
        return;
      }
      if (target!==id) return;
      const sealed=seals.current.some(value=>value>0);
      const dealt=damage*(sealed?.25:part==="head"?1.5:1);
      hp.current=Math.max(0,hp.current-dealt);setHealth(hp.current);
      setPop(`${Math.round(dealt)}`);window.setTimeout(()=>setPop(""),550);
      if (hp.current<=0) {
        deathAt.current=performance.now();phase.current="recover";
        if(root.current)root.current.userData.ignoreProjectile=true;
        setDead(true);
        cue("dragonCrash",[root.current?.position.x??0,3,root.current?.position.z??0]);
        deathTimer.current=window.setTimeout(()=>eliminate(id),2300);
      }
    };
    const onBlast=(event:Event)=>{
      if(!root.current||hp.current<=0)return;
      const p=root.current.position;
      const damage=paperBlastDamage((event as CustomEvent<PaperBlast>).detail,[p.x,p.y+1,p.z]);
      if(damage)window.dispatchEvent(new CustomEvent("boss-hit",{detail:{id,damage,part:"body"}}));
    };
    window.addEventListener("boss-hit",onHit);window.addEventListener("paper-grenade-explode",onBlast);
    return()=>{window.removeEventListener("boss-hit",onHit);window.removeEventListener("paper-grenade-explode",onBlast);if(deathTimer.current)window.clearTimeout(deathTimer.current);if(flashTimer.current)window.clearTimeout(flashTimer.current);};
  },[id,eliminate]);
  useFrame((state,delta)=>{
    const mesh=root.current, marker=telegraph.current;
    if(!mesh)return;
    const now=state.clock.elapsedTime;
    if(dead){
      if(marker)marker.visible=false;
      const age=(performance.now()-deathAt.current)/1000;
      mesh.visible=age<6;
      mesh.position.y=THREE.MathUtils.lerp(mesh.position.y,0,Math.min(1,delta*3));
      mesh.rotation.z=THREE.MathUtils.lerp(mesh.rotation.z,-1,Math.min(1,delta*2));
      mesh.scale.setScalar(age>5?Math.max(.001,6-age):1);
      const sprite=art.current?.children[0] as THREE.Mesh | undefined; if(sprite){const material=sprite.material as THREE.MeshBasicMaterial;material.opacity=age>5?Math.max(0,6-age):1;}
      return;
    }
    const game=useGameStore.getState();
    if(game.screen!=="playing"||game.tutorialOpen){if(marker)marker.visible=false;return;}
    const [px,py,pz]=game.playerPosition;
    if(art.current)art.current.rotation.y=Math.atan2(px-mesh.position.x,pz-mesh.position.z)-mesh.rotation.y;
    if(now-lastPosition.current>.14){lastPosition.current=now;game.setEnemyPosition(id,[mesh.position.x,mesh.position.y+2,mesh.position.z]);}
    if(phase.current==="intro") {phase.current="idle";phaseAt.current=now;}
    const fraction=hp.current/maxHp;
    if(phase.current==="idle"&&now-phaseAt.current>(fraction<.35?2:2.7)) {
      const available=fraction<.65?4:3;
      move.current=moves[attackCount.current++%available];
      phase.current="warn";phaseAt.current=now;locked.current.set(px,0,pz);
      cue("dragonRoar",[mesh.position.x,3,mesh.position.z]);
      breathDirection.current.set(px-mesh.position.x,0,pz-mesh.position.z).normalize();
    }
    if(phase.current==="warn"&&now-phaseAt.current> (move.current==="REDLINE BREATH"?1.2:1)) {phase.current="attack";phaseAt.current=now;cue(move.current==="REDLINE BREATH"?"dragonBreath":"dragonCrash",[mesh.position.x,3,mesh.position.z]);}
    if(phase.current==="attack") {
      const age=now-phaseAt.current;
      const [x,z]=[locked.current.x,locked.current.z];
      const near=Math.hypot(px-x,pz-z);
      const toPlayer=new THREE.Vector3(px-mesh.position.x,0,pz-mesh.position.z);
      const breathHit=toPlayer.length()<18&&toPlayer.normalize().dot(breathDirection.current)>.72;
      const barrageHit=Array.from({length:6},(_,i)=>Math.hypot(px-(x+(i-2.5)*2.4),pz-(z+(i%2?2:-2)))<2.2).some(Boolean);
      const hit=move.current==="REDLINE BREATH"?breathHit:move.current==="FORM BARRAGE"?barrageHit:move.current==="DEADLINE DIVE"?near<5.5:near<5;
      if(hit&&py<4&&now-lastDamage.current>(move.current==="REDLINE BREATH"?.7:move.current==="FORM BARRAGE"?.38:1)){
        lastDamage.current=now;
        game.damagePlayer(Math.round((move.current==="DEADLINE DIVE"?24:move.current==="RED TAPE RING"?17:move.current==="FORM BARRAGE"?7:10)*getEnemyTuning(level,cycle).damage),[mesh.position.x,3,mesh.position.z]);
      }
      if(age>(move.current==="REDLINE BREATH"?1.7:move.current==="FORM BARRAGE"?1.8:.55)){phase.current="recover";phaseAt.current=now;}
    }
    if(phase.current==="recover"&&now-phaseAt.current>(move.current==="DEADLINE DIVE"?2.5:1.2)){phase.current="idle";phaseAt.current=now;}
    const grounded=move.current==="DEADLINE DIVE"&&(phase.current==="attack"||phase.current==="recover");
    if(grounded&&phase.current==="attack"){
      const travel=THREE.MathUtils.smoothstep(now-phaseAt.current,0,.48);
      mesh.position.x=THREE.MathUtils.lerp(mesh.position.x,locked.current.x,travel);
      mesh.position.z=THREE.MathUtils.lerp(mesh.position.z,locked.current.z,travel);
    }else if(!grounded&&phase.current==="idle"){
      mesh.position.x=THREE.MathUtils.damp(mesh.position.x,0,.55,delta);
      mesh.position.z=THREE.MathUtils.damp(mesh.position.z,-28,.55,delta);
    }
    mesh.position.y=THREE.MathUtils.damp(mesh.position.y,grounded?.5:6,grounded?3:1.8,delta);
    if(phase.current==="idle"||phase.current==="warn")mesh.rotation.y=THREE.MathUtils.damp(mesh.rotation.y,Math.atan2(locked.current.x-mesh.position.x,locked.current.z-mesh.position.z),2,delta);
    if(marker){
      marker.visible=(phase.current==="warn"||phase.current==="attack")&&move.current!=="REDLINE BREATH"&&move.current!=="FORM BARRAGE";
      (marker.material as THREE.MeshBasicMaterial).color.set(phase.current==="attack"?"#ffa450":"#f32840");
      mesh.updateWorldMatrix(true,false);
      marker.position.copy(mesh.worldToLocal(new THREE.Vector3(locked.current.x,.08,locked.current.z)));
      marker.scale.setScalar(move.current==="REDLINE BREATH"?7:move.current==="DEADLINE DIVE"?5.5:4.5);
    }
    if(breathWarning.current){breathWarning.current.visible=(phase.current==="warn"||phase.current==="attack")&&move.current==="REDLINE BREATH";breathWarning.current.position.y=-mesh.position.y+.09;(breathWarning.current.material as THREE.MeshBasicMaterial).color.set(phase.current==="attack"?"#ffb460":"#ed263c");}
    barrageWarnings.current.forEach((warning,i)=>{if(!warning)return;warning.visible=(phase.current==="warn"||phase.current==="attack")&&move.current==="FORM BARRAGE";
      (warning.material as THREE.MeshBasicMaterial).color.set(phase.current==="attack"?"#ffad5c":"#ed263c");if(warning.visible){mesh.updateWorldMatrix(true,false);warning.position.copy(mesh.worldToLocal(new THREE.Vector3(locked.current.x+(i-2.5)*2.4,.08,locked.current.z+(i%2?2:-2))));}});
  });
  return <group ref={root} position={[0,13,-28]}>
    <EnemyFeedback id={id} root={root}/>
    <group ref={art}><EnemyDoodle kind="dragon" dead={dead} flash={flash} width={13.5} height={9.2} position={[0,3.5,.15]}/></group>
    {!dead&&<>
      <mesh position={[0,2,0]} userData={{targetId:id,targetPart:"body"}}><boxGeometry args={[5,3.2,2.6]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>
      <mesh position={[0,4.7,.35]} userData={{targetId:id,targetPart:"head"}}><boxGeometry args={[3,1.8,2.2]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>
      {[-1,1].map(side=><group key={side}>
        <mesh position={[side*4.3,2.8,0]} userData={{targetId:id,targetPart:"body"}}><boxGeometry args={[4.2,2.8,1.3]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>
        <mesh position={[side*1.7,.3,0]} userData={{targetId:id,targetPart:"leg"}}><boxGeometry args={[1.1,1.4,1.3]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>
      </group>)}
      {SEALS.map((name,i)=>sealHp[i]>0&&<group key={name} position={i===0?[-3.3,2.2,1.5]:i===1?[3.3,2.2,1.5]:[0,2,1.6]}>
        <mesh userData={{targetId:`${id}-seal-${name}`,targetPart:"body"}}><boxGeometry args={[1.3,1.3,.42]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>
        <mesh position={[0,0,.24]} userData={{ignoreProjectile:true}}><circleGeometry args={[.64,6]}/><meshBasicMaterial color="#efc277" side={THREE.DoubleSide}/></mesh>
        <mesh position={[0,0,.27]} userData={{ignoreProjectile:true}}><ringGeometry args={[.33,.42,6]}/><meshBasicMaterial color="#d55d65" side={THREE.DoubleSide}/></mesh>
      </group>)}
    </>}
    <mesh ref={telegraph} rotation={[-Math.PI/2,0,0]} visible={false} userData={{ignoreProjectile:true}}><circleGeometry args={[1,32]}/><meshBasicMaterial color="#f32840" transparent opacity={.45} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    <mesh ref={breathWarning} rotation={[-Math.PI/2,0,0]} visible={false} userData={{ignoreProjectile:true}}><shapeGeometry args={[breathShape]}/><meshBasicMaterial color="#ed263c" transparent opacity={.45} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    {Array.from({length:6},(_,i)=><mesh key={i} ref={node=>{barrageWarnings.current[i]=node;}} rotation={[-Math.PI/2,0,0]} visible={false} userData={{ignoreProjectile:true}}><circleGeometry args={[2.2,16]}/><meshBasicMaterial color="#ed263c" transparent opacity={.38} depthWrite={false} side={THREE.DoubleSide}/></mesh>)}
    {!dead&&<><ScanHalo id={id} size={5}/><Html position={[0,7,0]} center zIndexRange={[40,0]} style={{pointerEvents:"none"}}><div className="dragon-hp"><b>THE PAPERWORK DRAGON</b><span>PHASE {health/maxHp>.65?1:health/maxHp>.35?2:3} · {sealHp.filter(x=>x>0).length} SEALS</span><i style={{width:`${health/maxHp*100}%`}}/></div></Html></>}
    {pop&&<Html position={[0,8.5,0]} center style={{pointerEvents:"none"}}><div className="dragon-pop">{pop}</div></Html>}
  </group>;
}
