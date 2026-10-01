import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ARENA_HALF_SIZE } from "../game/config";
import { claimAttack } from "../game/attackDirector";
import { reportBossHealth } from "../game/bossHud";
import { useHitHealthBar } from "./useHitHealthBar";
import { delegateEnemy, enemyMotionFactor } from "../game/effects";
import { enemyHpScale, getEnemyTuning } from "../game/levels";
import { paperBlastDamage, type PaperBlast } from "../game/hazards";
import { isEnemyPositionBlocked, moveWithAvoidance, safeEnemySpawn } from "../game/navigation";
import { useGameStore } from "../game/store";
import { EnemyFeedback } from "./EnemyFeedback";
import { ScanHalo } from "./ScanHalo";
import { EnemyDoodle } from "./EnemyDoodle";
import type { WorldSound } from "../game/worldSound";

import { OFFICE_ENEMIES, type OfficeKind } from "../game/officeEnemies";
const eliteKinds: OfficeKind[] = ["hr","auditor","director"];
const isElite = (kind: OfficeKind) => eliteKinds.includes(kind);
const aim = new THREE.Vector3();
function cue(kind:WorldSound,position:[number,number,number]) {window.dispatchEvent(new CustomEvent("world-sfx",{detail:{kind,position}}));}

export function OfficeEnemy({ id, spawn, kind }: { id: string; spawn: [number,number,number]; kind: OfficeKind }) {
  const profile = OFFICE_ENEMIES[kind];
  const root = useRef<THREE.Group>(null);
  const art = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Mesh>(null);
  const corridor = useRef<THREE.Mesh>(null);
  const projectile = useRef<THREE.Mesh>(null);
  const formWarnings = useRef<(THREE.Mesh | null)[]>([]);
  const formDrops = useRef<(THREE.Mesh | null)[]>([]);
  const level = useGameStore(s => s.currentLevel);
  const cycle = useGameStore(s => s.ngPlusCycle);
  const eliminate = useGameStore(s => s.eliminate);
  const maxHp = Math.round(profile.hp * enemyHpScale(level,cycle) / enemyHpScale(profile.stage));
  const hp = useRef(maxHp);
  const [health,setHealth] = useState(maxHp);
  const { healthBarVisible, revealHealthBar } = useHitHealthBar();
  const [dead,setDead] = useState(false);
  const [flash,setFlash] = useState(false);
  const [pop,setPop] = useState(0);

  const deadAt = useRef(0);
  const phase = useRef<"idle"|"warn"|"strike"|"recover">("idle");
  const phaseTime = useRef(0);
  const lastAttack = useRef(-4);
  const lastDamage = useRef(-10);
  const lastPosition = useRef(0);
  const locked = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3(0,0,1));
  const attackNumber = useRef(0);
  const signature = useRef(0);
  const lastFormBeat = useRef(-1);
  const openUntil = useRef(0);
  const flashTimer = useRef<number | null>(null);
  const popTimer = useRef<number | null>(null);
  const exposeTimer = useRef<number | null>(null);
  const safeSpawn = useMemo(() => safeEnemySpawn(spawn,isElite(kind)?2.2:1.4,level),[spawn,kind,level]);
  useEffect(() => {
    if (!isElite(kind)) return;
    if (health <= 0) return;
    const timer = window.setTimeout(() => reportBossHealth({ id, name: profile.name, health, maxHp }), 0);
    return () => window.clearTimeout(timer);
  }, [id, kind, profile.name, health, maxHp]);
  useEffect(() => () => { if (isElite(kind)) reportBossHealth({ id, clear: true }); }, [id, kind]);
  useEffect(() => {
    const hit = (event: Event) => {
      const data = (event as CustomEvent<{id:string;damage:number;part?:string}>).detail;
      if (data.id !== id || hp.current <= 0) return;
      revealHealthBar();
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
      flashTimer.current = window.setTimeout(() => setFlash(false),110);
      if (hp.current <= 0) {
        if (isElite(kind)) reportBossHealth({ id, clear: true });
        deadAt.current = performance.now();
        if (root.current) root.current.userData.ignoreProjectile = true;
        setDead(true); eliminate(id);
        cue(kind === "stapler" ? "staplerDeath" : kind === "shredder" ? "shredderDeath" : kind === "hr" ? "hrDeath" : kind === "auditor" ? "auditorDeath" : kind === "director" ? "directorDeath" : "paperDeath",[root.current?.position.x ?? 0,1,root.current?.position.z ?? 0]);
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
  },[id,kind,eliminate,revealHealthBar]);
  useFrame((state,delta) => {
    const mesh=root.current, telegraph=marker.current, lane=corridor.current, shot=projectile.current;
    if (!mesh) return;
    const now=state.clock.elapsedTime;
    if (dead) {
      if (telegraph) telegraph.visible=false;
      if (lane) lane.visible=false;
      if (shot) shot.visible=false;
      formWarnings.current.forEach(form => { if (form) form.visible=false; });
      formDrops.current.forEach(form => { if (form) form.visible=false; });
      const age=(performance.now()-deadAt.current)/1000;
      mesh.visible=age<5.7;
      mesh.rotation.z=THREE.MathUtils.lerp(0,-.8,THREE.MathUtils.smoothstep(age,0,.8));
      mesh.position.y=kind==="highlighter"?THREE.MathUtils.lerp(3,0,Math.min(1,age)):0;
      mesh.scale.setScalar(age>4.7?Math.max(.001,5.7-age):1);
      const sprite=art.current?.children[0] as THREE.Mesh | undefined; if(sprite){const material=sprite.material as THREE.MeshBasicMaterial;material.opacity=age>4.7?Math.max(0,5.7-age):1;}
      return;
    }
    const game=useGameStore.getState();
    if (game.screen!=="playing" || game.tutorialOpen) { if (telegraph) telegraph.visible=false;if(lane)lane.visible=false;if(shot)shot.visible=false; return; }
    const [px,py,pz]=game.playerPosition;
    if(art.current){
      art.current.rotation.y=Math.atan2(px-mesh.position.x,pz-mesh.position.z)-mesh.rotation.y;
      art.current.position.y=(phase.current==="idle"?.04:phase.current==="warn"?-.09:phase.current==="strike"?.15:-.04)*Math.sin(now*2.4+id.length);
      art.current.rotation.z=kind==="clipboard"&&performance.now()<openUntil.current?-.17:phase.current==="warn"?(kind==="stapler"?-.1:kind==="hr"?.12:kind==="auditor"?-.08:.06):phase.current==="strike"?.1:0;
      art.current.rotation.x=phase.current==="warn"?-.08:phase.current==="strike"?.13:phase.current==="recover"?-.06:0;
      art.current.scale.y=phase.current==="warn"?.93:phase.current==="strike"?1.09:1+.013*Math.sin(now*2.5);
      art.current.scale.x=kind==="sticky"?1+.035*Math.sin(now*9):1+.012*Math.sin(now*2.3);
    }
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
        phase.current="warn";phaseTime.current=now;lastAttack.current=now;signature.current=attackNumber.current++%3;lastFormBeat.current=-1;
        cue(kind === "highlighter" ? "markerCharge" : kind === "stapler" ? "staplerClick" : kind === "shredder" ? "shredderMotor" : kind === "sticky" ? "stickyPeel" : kind === "hr" ? signature.current===0?"hrTape":signature.current===1?"hrReview":"hrStamp" : kind === "auditor" ? signature.current===1?"auditorBalance":"auditorPage" : kind === "director" ? signature.current===1?"directorRing":signature.current===2?"directorDelegate":"directorGavel" : "paperWarning",[mesh.position.x,1.6,mesh.position.z]);
        locked.current.set(px,0,pz);
        direction.current.set(px-mesh.position.x,0,pz-mesh.position.z).normalize();
        if(kind==="director"&&signature.current===2){
          Object.keys(game.enemyPositions).filter(other=>other!==id&&!game.eliminated.includes(other)&&!other.startsWith("dragon-")).slice(0,2).forEach(other=>{
            delegateEnemy(other,game.runId);
            window.dispatchEvent(new CustomEvent("delegation-mark", { detail: { id: other, source: [mesh.position.x,mesh.position.y+2,mesh.position.z] } }));
          });
          phase.current="recover";
        }
      }
    } else if (phase.current==="warn" && now-phaseTime.current>=profile.warning) {
      phase.current="strike";phaseTime.current=now;
      cue(kind === "stapler" ? "staplerSnap" : kind === "shredder" ? "shredderMotor" : kind === "highlighter" ? "markerSweep" : kind === "sticky" ? "stickySlap" : kind === "clipboard" ? "clipboardThud" : kind === "hr" ? signature.current===0?"hrTape":"hrStamp" : kind === "auditor" ? signature.current===1?"auditorBalance":"auditorPage" : kind === "director" ? signature.current===1?"directorRing":"directorGavel" : "officeAttack",[mesh.position.x,1.6,mesh.position.z]);
      if (kind==="stapler" || kind==="shredder" || (kind==="hr"&&signature.current===0)) {
        // The launch direction stays fixed once the red lane has appeared.
        locked.current.copy(mesh.position).addScaledVector(direction.current,Math.min(profile.range,18));
      }
    } else if (phase.current==="strike") {
      const age=now-phaseTime.current;
      if (kind==="stapler" || kind==="shredder" || (kind==="hr"&&signature.current===0)) {
        const stride=direction.current.clone().multiplyScalar((kind==="stapler"?22:kind==="shredder"?18:16)*motion*delta);
        if(Math.abs(mesh.position.x+stride.x)<ARENA_HALF_SIZE-2&&Math.abs(mesh.position.z+stride.z)<ARENA_HALF_SIZE-2&&!isEnemyPositionBlocked(mesh.position.x+stride.x,mesh.position.z+stride.z,isElite(kind)?2.2:1.4,level))mesh.position.add(stride);
        else {phase.current="recover";phaseTime.current=now;}
      }
      const [x,z]=[locked.current.x,locked.current.z];
      const forms=((kind==="hr"||kind==="auditor")&&signature.current===1)||(kind==="director"&&signature.current===0);
      const formIndex=Math.min(2,Math.floor(age/.4));
      if(forms&&formIndex!==lastFormBeat.current){lastFormBeat.current=formIndex;cue(kind==="hr"?"hrStamp":kind==="auditor"?"auditorPage":"directorGavel",[mesh.position.x,1.6,mesh.position.z]);}
      const formHit=Math.hypot(px-(x+(formIndex-1)*3),pz-(z+(formIndex%2?2:-2)))<3;
      const ringHit=kind==="director"&&signature.current===1&&dist<3+age*10&&dist>Math.max(0,age*10-1);
      const hit=forms?formHit:kind==="director"&&signature.current===1?ringHit:kind==="stapler"||kind==="shredder"||(kind==="hr"&&signature.current===0) ? dist<profile.radius :
        kind==="highlighter"||kind==="auditor" ? Math.abs(px-x)<profile.radius && Math.abs(pz-z)<8 :
        Math.hypot(px-x,pz-z)<profile.radius;
      if (hit && (kind!=="sticky"||age>.22) && now-lastDamage.current>(forms?.34:.65) && Math.abs(py-mesh.position.y)<4) {
        lastDamage.current=now;
        game.damagePlayer(Math.round(profile.damage*getEnemyTuning(level,cycle).damage),[mesh.position.x,1.7,mesh.position.z]);
        if (kind==="sticky") window.dispatchEvent(new CustomEvent("sticky-slow",{detail:{until:performance.now()+1500}}));
      }
      if (age>(forms?1.2:kind==="highlighter"||kind==="auditor"||(kind==="director"&&signature.current===1)?.7:.4)) {
        phase.current="recover";phaseTime.current=now;
        if (kind==="clipboard"||kind==="auditor") {
          openUntil.current=performance.now()+(kind==="auditor"?2000:1400);
          if(kind==="auditor")cue("auditorOpen",[mesh.position.x,1.6,mesh.position.z]);

          if(exposeTimer.current)clearTimeout(exposeTimer.current);
          exposeTimer.current=window.setTimeout(()=>{},kind==="auditor"?2000:1400);
        }
      }
    } else if (phase.current==="recover" && now-phaseTime.current>(kind==="stapler"?.9:kind==="shredder"?1.5:isElite(kind)?1.5:1)) phase.current="idle";
    if (telegraph) {
      const charge=kind==="stapler"||kind==="shredder"||(kind==="hr"&&signature.current===0);
      telegraph.visible=(phase.current==="warn" || phase.current==="strike") && motion>0 && !charge;
      if (telegraph.visible) {
        mesh.updateWorldMatrix(true,false);
        telegraph.position.copy(mesh.worldToLocal(kind==="director"&&signature.current===1?new THREE.Vector3(mesh.position.x,.06,mesh.position.z):new THREE.Vector3(locked.current.x,.06,locked.current.z)));
        telegraph.scale.set(profile.radius*2,kind==="highlighter"||kind==="auditor"&&signature.current===0?16:profile.radius*2,1);
        (telegraph.material as THREE.MeshBasicMaterial).opacity=phase.current==="strike"?.7:.32+.15*Math.sin(now*22);
        (telegraph.material as THREE.MeshBasicMaterial).color.set(phase.current==="strike"?"#ffa24f":"#f1283b");
      }
    }
    if(lane){
      lane.visible=phase.current==="warn"&&motion>0&&(kind!=="hr"||signature.current===0);
      if(lane.visible){
        const length=Math.min(profile.range,Math.hypot(locked.current.x-mesh.position.x,locked.current.z-mesh.position.z));
        lane.position.set(0,-mesh.position.y+.07,length/2);
        lane.scale.set(kind==="sticky"?.14:profile.radius*2,length,1);
      }
    }
    if(shot){
      shot.visible=kind==="sticky"&&phase.current==="strike";
      if(shot.visible){mesh.updateWorldMatrix(true,false);const target=mesh.worldToLocal(new THREE.Vector3(locked.current.x,1.7,locked.current.z));shot.position.copy(target.multiplyScalar(Math.min(1,(now-phaseTime.current)/.32)));shot.position.y+=1.5;}
    }
    formWarnings.current.forEach((form,i)=>{if(!form)return;
      form.visible=(((kind==="hr"||kind==="auditor")&&signature.current===1)||(kind==="director"&&signature.current===0))&&(phase.current==="warn"||phase.current==="strike")&&motion>0;
      if(form.visible){mesh.updateWorldMatrix(true,false);form.position.copy(mesh.worldToLocal(new THREE.Vector3(locked.current.x+(i-1)*3,.08,locked.current.z+(i%2?2:-2))));form.scale.setScalar(3);(form.material as THREE.MeshBasicMaterial).opacity=phase.current==="warn"?.35:i===Math.min(2,Math.floor((now-phaseTime.current)/.4))?.75:.15;}
    });
    formDrops.current.forEach((form,i)=>{if(!form)return;
      const forms=(((kind==="hr"||kind==="auditor")&&signature.current===1)||(kind==="director"&&signature.current===0));
      const age=now-phaseTime.current;
      form.visible=forms&&phase.current==="strike"&&age>=i*.4&&age<i*.4+.35;
      if(form.visible){mesh.updateWorldMatrix(true,false);form.position.copy(mesh.worldToLocal(new THREE.Vector3(locked.current.x+(i-1)*3,Math.max(.7,4-(age-i*.4)*10),locked.current.z+(i%2?2:-2))));form.rotation.z=.22*Math.sin(age*12+i);}
    });
  });
  const heavy=kind==="shredder"||kind==="clipboard"||isElite(kind);
  const height=heavy?3.4:kind==="stapler"?1.45:kind==="sticky"?2:2.65;
  return <group ref={root} position={[safeSpawn[0],kind==="highlighter"?3:0,safeSpawn[2]]}>
    <EnemyFeedback id={id} root={root}/>
    <group ref={art}><EnemyDoodle kind={kind} dead={dead} flash={flash} width={heavy?4.4:kind==="stapler"?3.5:3.1} height={heavy?4.1:kind==="stapler"?2.4:3.15} position={[0,heavy?1.75:kind==="stapler"?1.05:height*.49,.18]}/></group>
    {!dead&&<>
      <mesh position={[0,height*.5,0]} userData={{targetId:id,targetPart:"body"}}><boxGeometry args={[heavy?2.35:kind==="stapler"?2:1.3,height*.58,.9]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>
      <mesh position={[0,kind==="highlighter"?1.48:kind==="clipboard"?2.26:height*.86,0]} userData={{targetId:id,targetPart:"head"}}><boxGeometry args={[heavy?1.4:kind==="stapler"?.85:1,height*.22,.85]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>
      {[-1,1].map(side=><mesh key={side} position={[side*(heavy?.67:.38),.28,0]} userData={{targetId:id,targetPart:"leg"}}><boxGeometry args={[.36,.55,.8]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>)}
      {kind==="clipboard"&&<mesh position={[0,1.7,.38]} userData={{targetId:id,targetPart:"body"}}><boxGeometry args={[2.45,2.5,.2]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>}
    </>}
    <mesh ref={marker} rotation={[-Math.PI/2,0,0]} visible={false} userData={{ignoreProjectile:true}}>{kind==="highlighter"||kind==="auditor"?<planeGeometry args={[1,1]}/>:<circleGeometry args={[.5,32]}/>}<meshBasicMaterial color="#f1283b" transparent opacity={.4} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    {(kind==="stapler"||kind==="shredder"||kind==="hr"||kind==="sticky")&&<mesh ref={corridor} rotation={[-Math.PI/2,0,0]} visible={false} userData={{ignoreProjectile:true}}><planeGeometry args={[1,1]}/><meshBasicMaterial color="#ed283c" transparent opacity={.45} depthWrite={false} side={THREE.DoubleSide}/></mesh>}
    {kind==="sticky"&&<mesh ref={projectile} visible={false} userData={{ignoreProjectile:true}}><planeGeometry args={[.65,.65]}/><meshBasicMaterial color="#ffe262" side={THREE.DoubleSide}/></mesh>}
    {isElite(kind)&&[0,1,2].map(i=><mesh key={`form-${i}`} ref={node=>{formWarnings.current[i]=node;}} rotation={[-Math.PI/2,0,0]} visible={false} userData={{ignoreProjectile:true}}><circleGeometry args={[1,28]}/><meshBasicMaterial color="#ed283c" transparent opacity={.35} depthWrite={false} side={THREE.DoubleSide}/></mesh>)}
    {isElite(kind)&&[0,1,2].map(i=><mesh key={`drop-${i}`} ref={node=>{formDrops.current[i]=node;}} visible={false} userData={{ignoreProjectile:true}}><planeGeometry args={[1.3,1.7]}/><meshBasicMaterial color={kind==="auditor"?"#c5f6fb":"#fff8e1"} side={THREE.DoubleSide} depthWrite={false}/></mesh>)}
    {!dead&&<><ScanHalo id={id} size={heavy?2.7:1.5}/>{!isElite(kind)&&healthBarVisible&&<Html position={[0,height+1,0]} center zIndexRange={[40,0]} style={{pointerEvents:"none"}}><div className="office-enemy-label"><b>{profile.name}</b><i style={{width:`${health/maxHp*100}%`}}/></div></Html>}</>}
    {pop>0&&<Html position={[0,height+.5,0]} center zIndexRange={[40,0]} style={{pointerEvents:"none"}}><div className="boss-damage-pop"><strong>{pop}</strong></div></Html>}
  </group>;
}
