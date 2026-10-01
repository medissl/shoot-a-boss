import { Edges, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { claimAttack } from "../game/attackDirector";
import { delegateEnemy, enemyMotionFactor } from "../game/effects";
import { enemyHpScale, getEnemyTuning } from "../game/levels";
import { paperBlastDamage, type PaperBlast } from "../game/hazards";
import { isEnemyPositionBlocked, moveWithAvoidance, safeEnemySpawn } from "../game/navigation";
import { useGameStore } from "../game/store";
import { EnemyFeedback } from "./EnemyFeedback";
import { ScanHalo } from "./ScanHalo";

import { OFFICE_ENEMIES, type OfficeKind } from "../game/officeEnemies";
const eliteKinds: OfficeKind[] = ["hr","auditor","director"];
const isElite = (kind: OfficeKind) => eliteKinds.includes(kind);
const aim = new THREE.Vector3();

export function OfficeEnemy({ id, spawn, kind }: { id: string; spawn: [number,number,number]; kind: OfficeKind }) {
  const profile = OFFICE_ENEMIES[kind];
  const root = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Mesh>(null);
  const corridor = useRef<THREE.Mesh>(null);
  const projectile = useRef<THREE.Mesh>(null);
  const level = useGameStore(s => s.currentLevel);
  const cycle = useGameStore(s => s.ngPlusCycle);
  const eliminate = useGameStore(s => s.eliminate);
  const maxHp = Math.round(profile.hp * enemyHpScale(level,cycle) / enemyHpScale(profile.stage));
  const hp = useRef(maxHp);
  const [health,setHealth] = useState(maxHp);
  const [dead,setDead] = useState(false);
  const [flash,setFlash] = useState(false);
  const [pop,setPop] = useState(0);
  const [exposed,setExposed] = useState(false);
  const deadAt = useRef(0);
  const phase = useRef<"idle"|"warn"|"strike"|"recover">("idle");
  const phaseTime = useRef(0);
  const lastAttack = useRef(-4);
  const lastDamage = useRef(-10);
  const lastPosition = useRef(0);
  const locked = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3(0,0,1));
  const attackNumber = useRef(0);
  const openUntil = useRef(0);
  const flashTimer = useRef<number | null>(null);
  const popTimer = useRef<number | null>(null);
  const exposeTimer = useRef<number | null>(null);
  const safeSpawn = useMemo(() => safeEnemySpawn(spawn,isElite(kind)?2.2:1.4,level),[spawn,kind,level]);
  useEffect(() => {
    const hit = (event: Event) => {
      const data = (event as CustomEvent<{id:string;damage:number;part?:string}>).detail;
      if (data.id !== id || hp.current <= 0) return;
      let damage = data.damage;
      if (kind === "clipboard" && data.part === "body" && root.current && performance.now() > openUntil.current) {
        const [px,,pz] = useGameStore.getState().playerPosition;
        const toPlayer = new THREE.Vector3(px-root.current.position.x,0,pz-root.current.position.z).normalize();
        const front = new THREE.Vector3(0,0,1).applyQuaternion(root.current.quaternion);
        if (front.dot(toPlayer) > .45) damage *= .3;
      }
      if (kind === "auditor" && performance.now() < openUntil.current) damage *= 1.5;
      hp.current = Math.max(0,hp.current-damage);
      setHealth(hp.current); setPop(Math.round(damage)); setFlash(true);
      if(popTimer.current)clearTimeout(popTimer.current);
      popTimer.current=window.setTimeout(()=>setPop(0),650);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(false),220);
      if (hp.current <= 0) {
        deadAt.current = performance.now();
        if (root.current) root.current.userData.ignoreProjectile = true;
        setDead(true); eliminate(id);
      }
    };
    const blast = (event: Event) => {
      if (!root.current || hp.current <= 0) return;
      const p = root.current.position;
      const damage = paperBlastDamage((event as CustomEvent<PaperBlast>).detail,[p.x,p.y+1.5,p.z]);
      if (damage) window.dispatchEvent(new CustomEvent("boss-hit",{detail:{id,damage,part:"body"}}));
    };
    window.addEventListener("boss-hit",hit); window.addEventListener("paper-grenade-explode",blast);
    return () => { window.removeEventListener("boss-hit",hit); window.removeEventListener("paper-grenade-explode",blast); if (flashTimer.current) clearTimeout(flashTimer.current);if(popTimer.current)clearTimeout(popTimer.current);if(exposeTimer.current)clearTimeout(exposeTimer.current); };
  },[id,kind,eliminate]);
  useFrame((state,delta) => {
    const mesh=root.current, telegraph=marker.current, lane=corridor.current, shot=projectile.current;
    if (!mesh) return;
    const now=state.clock.elapsedTime;
    if (dead) {
      if (telegraph) telegraph.visible=false;
      if (lane) lane.visible=false;
      if (shot) shot.visible=false;
      const age=(performance.now()-deadAt.current)/1000;
      mesh.visible=age<5.7;
      mesh.rotation.z=THREE.MathUtils.lerp(0,-.8,THREE.MathUtils.smoothstep(age,0,.8));
      mesh.position.y=kind==="highlighter"?THREE.MathUtils.lerp(3,0,Math.min(1,age)):0;
      mesh.scale.setScalar(age>4.7?Math.max(.001,5.7-age):1);
      return;
    }
    const game=useGameStore.getState();
    if (game.screen!=="playing" || game.tutorialOpen) { if (telegraph) telegraph.visible=false;if(lane)lane.visible=false;if(shot)shot.visible=false; return; }
    const [px,py,pz]=game.playerPosition;
    const dist=Math.hypot(px-mesh.position.x,pz-mesh.position.z);
    const motion=enemyMotionFactor(id,game.runId);
    if (now-lastPosition.current>.15) {
      lastPosition.current=now;
      game.setEnemyPosition(id,[mesh.position.x,mesh.position.y+1.6,mesh.position.z]);
    }
    if (kind==="highlighter" && phase.current!=="strike") mesh.position.y=3+Math.sin(now*2)*.2;
    if (phase.current==="idle") {
      if (motion>0 && dist>Math.min(profile.range*.55,10) && dist<52) {
        aim.set(px-mesh.position.x,0,pz-mesh.position.z).normalize().multiplyScalar((isElite(kind)?1.8:kind==="shredder"?2.1:2.8)*getEnemyTuning(level,cycle).speed*motion*delta);
        moveWithAvoidance(mesh.position,aim,isElite(kind)?2.2:1.4,id.length%2?1:-1,level,kind==="highlighter");
      } else if (kind==="sticky" && dist<5 && motion>0) {
        aim.set(mesh.position.x-px,0,mesh.position.z-pz).normalize().multiplyScalar(2.7*motion*delta);
        moveWithAvoidance(mesh.position,aim,1.4,1,level);
      }
      mesh.rotation.y=THREE.MathUtils.damp(mesh.rotation.y,Math.atan2(px-mesh.position.x,pz-mesh.position.z),6,delta);
      if (dist<profile.range && now-lastAttack.current>profile.cooldown && claimAttack(id,game.runId,level,Math.ceil((profile.warning+1)*1000))) {
        phase.current="warn";phaseTime.current=now;lastAttack.current=now;attackNumber.current++;
        locked.current.set(px,0,pz);
        direction.current.set(px-mesh.position.x,0,pz-mesh.position.z).normalize();
        if(kind==="director"&&attackNumber.current%3===0){
          Object.keys(game.enemyPositions).filter(other=>other!==id&&!game.eliminated.includes(other)&&!other.startsWith("dragon-")).slice(0,2).forEach(other=>delegateEnemy(other,game.runId));
          phase.current="recover";
        }
      }
    } else if (phase.current==="warn" && now-phaseTime.current>=profile.warning) {
      phase.current="strike";phaseTime.current=now;
      if (kind==="stapler" || kind==="shredder" || kind==="hr") {
        // The launch direction stays fixed once the red lane has appeared.
        locked.current.copy(mesh.position).addScaledVector(direction.current,Math.min(profile.range,18));
      }
    } else if (phase.current==="strike") {
      const age=now-phaseTime.current;
      if (kind==="stapler" || kind==="shredder" || kind==="hr") {
        const stride=direction.current.clone().multiplyScalar((kind==="stapler"?22:kind==="shredder"?18:16)*motion*delta);
        if(!isEnemyPositionBlocked(mesh.position.x+stride.x,mesh.position.z+stride.z,isElite(kind)?2.2:1.4,level))mesh.position.add(stride);
        else {phase.current="recover";phaseTime.current=now;}
      }
      const [x,z]=[locked.current.x,locked.current.z];
      const hit=kind==="stapler"||kind==="shredder"||kind==="hr" ? dist<profile.radius :
        kind==="highlighter"||kind==="auditor" ? Math.abs(px-x)<profile.radius && Math.abs(pz-z)<8 :
        Math.hypot(px-x,pz-z)<profile.radius;
      if (hit && (kind!=="sticky"||age>.22) && now-lastDamage.current>.65 && Math.abs(py-mesh.position.y)<4) {
        lastDamage.current=now;
        game.damagePlayer(Math.round(profile.damage*getEnemyTuning(level,cycle).damage),[mesh.position.x,1.7,mesh.position.z]);
        if (kind==="sticky") window.dispatchEvent(new CustomEvent("sticky-slow",{detail:{until:performance.now()+1500}}));
      }
      if (age>(kind==="highlighter"||kind==="auditor"? .7:.4)) {
        phase.current="recover";phaseTime.current=now;
        if (kind==="clipboard"||kind==="auditor") {
          openUntil.current=performance.now()+(kind==="auditor"?2000:1000);
          setExposed(true);
          if(exposeTimer.current)clearTimeout(exposeTimer.current);
          exposeTimer.current=window.setTimeout(()=>setExposed(false),kind==="auditor"?2000:1000);
        }
      }
    } else if (phase.current==="recover" && now-phaseTime.current>(kind==="stapler"?.9:kind==="shredder"?1.2:isElite(kind)?1.5:1)) phase.current="idle";
    if (telegraph) {
      const charge=kind==="stapler"||kind==="shredder"||kind==="hr";
      telegraph.visible=phase.current==="warn" && motion>0 && !charge;
      if (telegraph.visible) {
        mesh.updateWorldMatrix(true,false);
        telegraph.position.copy(mesh.worldToLocal(new THREE.Vector3(locked.current.x,.06,locked.current.z)));
        telegraph.scale.set(profile.radius*2,kind==="highlighter"||kind==="auditor"?16:profile.radius*2,1);
        (telegraph.material as THREE.MeshBasicMaterial).opacity=.32+.15*Math.sin(now*22);
      }
    }
    if(lane){
      lane.visible=phase.current==="warn"&&motion>0;
      if(lane.visible){
        const length=Math.min(profile.range,Math.hypot(locked.current.x-mesh.position.x,locked.current.z-mesh.position.z));
        lane.position.set(0,-mesh.position.y+.07,length/2);
        lane.scale.set(profile.radius*2,length,1);
      }
    }
    if(shot){
      shot.visible=kind==="sticky"&&phase.current==="strike";
      if(shot.visible){mesh.updateWorldMatrix(true,false);const target=mesh.worldToLocal(new THREE.Vector3(locked.current.x,1.7,locked.current.z));shot.position.copy(target.multiplyScalar(Math.min(1,(now-phaseTime.current)/.32)));shot.position.y+=1.5;}
    }
  });
  const heavy=kind==="shredder"||kind==="clipboard"||isElite(kind);
  const height=heavy?3.4:kind==="stapler"?1.45:kind==="sticky"?2:2.65;
  return <group ref={root} position={[safeSpawn[0],kind==="highlighter"?3:0,safeSpawn[2]]}>
    <EnemyFeedback id={id} root={root}/>
    <mesh position={[0,height*.46,0]} castShadow userData={{targetId:id,targetPart:"body"}}>
      {kind==="stapler"?<boxGeometry args={[2,1.1,2.6]}/>:kind==="highlighter"?<cylinderGeometry args={[.65,.65,2.1,8]}/>:<boxGeometry args={[heavy?2.4:1.35,height*.65,heavy?1.3:.6]}/>}
      <meshStandardMaterial color={flash?"#ff4455":profile.color} roughness={.8}/>
      <Edges color="#2548b8"/>
    </mesh>
    <mesh position={[0,height*.86,.3]} userData={{targetId:id,targetPart:"head"}}>
      <boxGeometry args={[heavy?1.45:.95,.65,.55]}/><meshStandardMaterial color={flash?"#ff4455":"#f9f8ef"}/><Edges color="#2548b8"/>
    </mesh>
    {[-1,1].map(side=><group key={side}>
      <mesh position={[side*(heavy?.78:.45),.24,0]} userData={{targetId:id,targetPart:"leg"}}><boxGeometry args={[.34,.52,.54]}/><meshStandardMaterial color="#546b9a"/><Edges color="#2548b8"/></mesh>
      <mesh position={[side*.27,height*.9,.59]} userData={{ignoreProjectile:true}}><boxGeometry args={[.12,.12,.07]}/><meshBasicMaterial color={dead?"#293d73":"#ed4853"}/></mesh>
    </group>)}
    {kind==="clipboard"&&<mesh position={[0,1.7,.78]} userData={{targetId:id,targetPart:"body"}}><boxGeometry args={[2.45,2.5,.18]}/><meshStandardMaterial color="#826449"/><Edges color="#2548b8"/></mesh>}
    {(kind==="sticky"||kind==="director")&&Array.from({length:3},(_,i)=><mesh key={i} position={[(i-1)*.5,height*.5,.42+i*.04]} rotation={[0,0,(i-1)*.14]} userData={{targetId:id,targetPart:"body"}}><planeGeometry args={[.75,.9]}/><meshBasicMaterial color={kind==="sticky"?"#ffe679":"#f7f3dc"} side={THREE.DoubleSide}/></mesh>)}
    {kind==="hr"&&<mesh position={[0,2.8,.72]} userData={{ignoreProjectile:true}}><boxGeometry args={[.25,1.2,.08]}/><meshBasicMaterial color="#d74654"/></mesh>}
    {kind==="auditor"&&<mesh position={[0,1.7,.84]} userData={{ignoreProjectile:true}}><boxGeometry args={[1.6,1.9,.18]}/><meshStandardMaterial color={exposed?"#fff4a5":"#7dd9e7"}/><Edges color="#2548b8"/></mesh>}
    <mesh ref={marker} rotation={[-Math.PI/2,0,0]} visible={false} userData={{ignoreProjectile:true}}>{kind==="highlighter"||kind==="auditor"?<planeGeometry args={[1,1]}/>:<circleGeometry args={[.5,32]}/>}<meshBasicMaterial color="#f1283b" transparent opacity={.4} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    {(kind==="stapler"||kind==="shredder"||kind==="hr")&&<mesh ref={corridor} rotation={[-Math.PI/2,0,0]} visible={false} userData={{ignoreProjectile:true}}><planeGeometry args={[1,1]}/><meshBasicMaterial color="#ed283c" transparent opacity={.45} depthWrite={false} side={THREE.DoubleSide}/></mesh>}
    {kind==="sticky"&&<mesh ref={projectile} visible={false} userData={{ignoreProjectile:true}}><boxGeometry args={[.7,.6,.08]}/><meshBasicMaterial color="#ffe262"/></mesh>}
    {!dead&&<><ScanHalo id={id} size={heavy?2.7:1.5}/><Html position={[0,height+1,0]} center zIndexRange={[40,0]} style={{pointerEvents:"none"}}><div className="office-enemy-label"><b>{profile.name}</b><i style={{width:`${health/maxHp*100}%`}}/></div></Html></>}
    {pop>0&&<Html position={[0,height+.5,0]} center zIndexRange={[40,0]} style={{pointerEvents:"none"}}><div className="boss-damage-pop"><strong>{pop}</strong></div></Html>}
    {dead&&<mesh position={[0,height*.8,.65]} userData={{ignoreProjectile:true}}><planeGeometry args={[.7,.3]}/><meshBasicMaterial color="#263c70" side={THREE.DoubleSide}/></mesh>}
  </group>;
}
