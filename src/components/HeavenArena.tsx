import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "../game/store";
import { hazardDamage } from "../game/hazards";
import { Hitbox } from "./Hitbox";
import type { WorldSound } from "../game/worldSound";

const BLUE = "#315fa5";
const raySites: [number,number][] = [[-13,-8],[14,-14],[-15,14],[17,11],[0,-22]];
function cue(kind:WorldSound, position?:[number,number,number]) {
  window.dispatchEvent(new CustomEvent("world-sfx",{detail:{kind,position}}));
}

function JudgementRays() {
  const warning=useRef<(THREE.Mesh|null)[]>([]);
  const beams=useRef<(THREE.Mesh|null)[]>([]);
  const elapsed=useRef(0);
  const lastCycle=useRef(-1);
  const lastRise=useRef(-1);
  const lastStrike=useRef(-1);
  const lastHit=useRef(-Infinity);
  useFrame((_,delta)=>{
    const game=useGameStore.getState();
    const enabled=game.screen==="playing"&&!game.tutorialOpen&&game.currentLevel===12&&
      (game.heavenPhase==="prelude"||game.heavenPhase==="seals")&&performance.now()>=game.hazardSuppressedUntil;
    if(enabled)elapsed.current+=Math.min(delta,.1);
    const period=game.heavenPhase==="seals"?6.5:8.5;
    const time=Math.max(0,elapsed.current-4);
    const cycle=Math.floor(time/period);
    const phase=time%period;
    const index=cycle%raySites.length;
    const warn=elapsed.current>=4&&phase<1;
    const strike=elapsed.current>=4&&phase>=1&&phase<1.8;
    warning.current.forEach((mesh,i)=>{if(mesh)mesh.visible=enabled&&i===index&&warn;});
    beams.current.forEach((mesh,i)=>{if(mesh)mesh.visible=enabled&&i===index&&strike;});
    if(!enabled)return;
    if(warn&&cycle!==lastCycle.current){lastCycle.current=cycle;cue("judgementWarn");}
    if(warn&&phase>=.65&&cycle!==lastRise.current){lastRise.current=cycle;cue("judgementRise");}
    if(strike&&cycle!==lastStrike.current){lastStrike.current=cycle;cue("approvalStamp",[raySites[index][0],1,raySites[index][1]]);}
    if(!strike||performance.now()-lastHit.current<800)return;
    const [x,z]=raySites[index];const [px,py,pz]=game.playerPosition;
    if(Math.hypot(px-x,pz-z)<4.5&&py<4){lastHit.current=performance.now();game.damagePlayer(hazardDamage(12,12,game.ngPlusCycle),[x,2,z],"heavenBeam");}
  });
  return <>{raySites.map(([x,z],i)=><group key={i} userData={{ignoreProjectile:true}}>
    <mesh ref={node=>{warning.current[i]=node;}} position={[x,.07,z]} rotation={[-Math.PI/2,0,0]} visible={false}>
      <circleGeometry args={[4.5,32]}/><meshBasicMaterial color="#df294b" transparent opacity={.44} depthWrite={false} side={THREE.DoubleSide}/>
    </mesh>
    <mesh ref={node=>{beams.current[i]=node;}} position={[x,12,z]} visible={false}>
      <cylinderGeometry args={[2.4,2.4,24,16]}/><meshBasicMaterial color="#ffad80" transparent opacity={.55} depthWrite={false}/>
    </mesh>
  </group>)}</>;
}

function stampTexture(label:string,color:string){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=512;
  const g=canvas.getContext("2d")!;
  g.fillStyle="#fffdf3";g.fillRect(0,0,512,512);
  g.strokeStyle=BLUE;g.lineWidth=22;g.strokeRect(14,14,484,484);
  g.strokeStyle="#dfbd74";g.lineWidth=16;g.beginPath();g.arc(256,235,155,0,Math.PI*2);g.stroke();
  g.fillStyle=color;g.textAlign="center";g.font="bold 51px Arial";g.fillText(label,256,250);
  g.font="bold 27px Arial";g.fillText("FINAL APPROVAL",256,415);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function bannerTexture(label:string,color:string){
  const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=192;
  const g=canvas.getContext("2d")!;g.fillStyle="#fffdf3";g.fillRect(0,0,1024,192);
  g.strokeStyle="#dfbd74";g.lineWidth=12;g.strokeRect(6,6,1012,180);
  g.fillStyle=color;g.textAlign="center";g.font="bold 82px Arial";g.fillText(label,512,125);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function GateSeal({index,position}:{index:number;position:[number,number,number]}){
  const phase=useGameStore(s=>s.heavenPhase);
  const broken=useGameStore(s=>s.approvalSeals.includes(index));
  const breakSeal=useGameStore(s=>s.breakApprovalSeal);
  const hp=useRef(190);
  const [remaining,setRemaining]=useState(190);
  const [showDamage,setShowDamage]=useState(false);
  const active=phase==="seals"&&!broken;
  const textures=useMemo(()=>({rejected:stampTexture("REJECTED","#c7354b"),approved:stampTexture("APPROVED ✓","#378c68")}),[]);
  useEffect(()=>()=>{textures.rejected.dispose();textures.approved.dispose();},[textures]);
  useEffect(()=>{
    const listener=(event:Event)=>{
      const detail=(event as CustomEvent<{id:string;damage:number}>).detail;
      if(detail.id!==`approval-seal-${index}`||useGameStore.getState().heavenPhase!=="seals"||useGameStore.getState().approvalSeals.includes(index))return;
      hp.current=Math.max(0,hp.current-detail.damage);setRemaining(hp.current);setShowDamage(true);
      cue("approvalStamp",[position[0],position[1],position[2]-31]);
      if(hp.current===0){breakSeal(index);cue("dragonSeal",[position[0],position[1],position[2]-31]);
        if(useGameStore.getState().approvalSeals.length===3){cue("approvalSuccess");cue("approvalStamp");}}
    };
    window.addEventListener("boss-hit",listener);return()=>window.removeEventListener("boss-hit",listener);
  },[breakSeal,index,position]);
  return <group position={position}>
    <mesh userData={{ignoreProjectile:true}}><boxGeometry args={[3.15,3.3,.38]}/><meshStandardMaterial color="#d8b571"/><Edges color={BLUE}/></mesh>
    <mesh position={[0,0,.26]} userData={{ignoreProjectile:true}}><planeGeometry args={[2.96,3.08]}/><meshBasicMaterial map={broken?textures.approved:textures.rejected} side={THREE.DoubleSide}/></mesh>
    {active&&<Hitbox id={`approval-seal-${index}`} part="special" position={[0,0,.48]} size={[2.8,2.95,.56]}/>}
    {showDamage&&active&&<mesh position={[0,-1.88,.4]} userData={{ignoreProjectile:true}}><boxGeometry args={[2.9*remaining/190,.14,.08]}/><meshBasicMaterial color="#df455b"/></mesh>}
    <mesh position={[0,1.9,0]} userData={{ignoreProjectile:true}}><cylinderGeometry args={[.34,.34,.7,10]}/><meshStandardMaterial color="#e9bf70"/></mesh>
  </group>;
}

function FinalApprovalGate(){
  const phase=useGameStore(s=>s.heavenPhase);
  const left=useRef<THREE.Mesh>(null),right=useRef<THREE.Mesh>(null);
  const textures=useMemo(()=>({approval:bannerTexture("FINAL APPROVAL",BLUE),review:bannerTexture("FINAL REVIEW","#c7354b")}),[]);
  useEffect(()=>()=>{textures.approval.dispose();textures.review.dispose();},[textures]);
  const open=phase==="dragonIntro"||phase==="dragon"||phase==="complete";
  useFrame((_,delta)=>{for(const [mesh,side] of [[left.current,-1],[right.current,1]] as [THREE.Mesh|null,number][]){
    if(!mesh)continue;mesh.position.x=THREE.MathUtils.damp(mesh.position.x,side*(open?6.9:3.75),2.4,delta);
    mesh.rotation.y=THREE.MathUtils.damp(mesh.rotation.y,open?side*.24:0,2.4,delta);
  }});
  return <group position={[0,0,-31]}>
    <group userData={{ignoreProjectile:true}}>
      <mesh position={[0,5,0]}><planeGeometry args={[15,10]}/><meshBasicMaterial color="#203653" side={THREE.DoubleSide}/></mesh>
      <mesh ref={left} position={[-3.75,5,.1]}><boxGeometry args={[7.5,10,.6]}/><meshStandardMaterial color="#f9f9ed"/><Edges color={BLUE}/></mesh>
      <mesh ref={right} position={[3.75,5,.1]}><boxGeometry args={[7.5,10,.6]}/><meshStandardMaterial color="#f9f9ed"/><Edges color={BLUE}/></mesh>
      <mesh position={[0,8.8,.49]}><planeGeometry args={[10,1.6]}/><meshBasicMaterial map={open?textures.review:textures.approval} side={THREE.DoubleSide}/></mesh>
      {[-1,1].map(side=><mesh key={side} position={[side*8,5,.2]}><boxGeometry args={[1.1,12,1.3]}/><meshStandardMaterial color="#e6d392"/><Edges color={BLUE}/></mesh>)}
      <mesh position={[0,11,.3]}><boxGeometry args={[18,1,.8]}/><meshStandardMaterial color="#dfc583"/></mesh>
      {phase==="dragonIntro"&&<mesh position={[0,4,.6]} rotation={[0,0,-.24]}><boxGeometry args={[14,.18,.1]}/><meshBasicMaterial color="#d83c52"/></mesh>}
    </group>
    {([[-4.9,4.2,.8],[4.9,4.2,.8],[0,4.5,.8]] as [number,number,number][]).map((position,i)=><GateSeal key={i} index={i} position={position}/>)}
  </group>;
}

function HeavenAmbience(){
  const next=useRef(0);
  useFrame(({clock})=>{if(clock.elapsedTime<next.current||useGameStore.getState().screen!=="playing")return;
    next.current=clock.elapsedTime+10;cue("heavenChime",[0,6,-31]);cue("paperWind",[0,3,-23]);});
  return null;
}

export function HeavenArena(){
  return <>
    <color attach="background" args={["#d7f0ff"]}/><fog attach="fog" args={["#d7f0ff",65,150]}/>
    <hemisphereLight intensity={2} color="#ffffff" groundColor="#bedff1"/>
    <directionalLight position={[19,34,11]} intensity={2.2} color="#fffae6" castShadow/>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[48,.25,48]} position={[0,-.25,0]}/>
      <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[96,96]}/><meshStandardMaterial color="#f7f9fc" roughness={.95}/></mesh>
      <gridHelper args={[96,48,BLUE,BLUE]} position={[0,.02,0]} material-transparent material-opacity={.12}/>
      {[[-48,0,.8,96],[48,0,.8,96],[0,-48,96,.8],[0,48,96,.8]].map(([x,z,w,d],i)=><group key={i}>
        <CuboidCollider args={[w/2,4.5,d/2]} position={[x,4.5,z]}/>
        <mesh position={[x,4.5,z]}><boxGeometry args={[w,9,d]}/><meshStandardMaterial color="#d7e7f5"/></mesh>
      </group>)}
      {([[-11,2,-7],[11,2,-7],[-12,2,-24],[12,2,-24]] as [number,number,number][]).map(([x,y,z],i)=><group key={i}>
        <CuboidCollider args={[1.3,y,1.3]} position={[x,y,z]}/>
        <mesh position={[x,y,z]}><boxGeometry args={[2.6,y*2,2.6]}/><meshStandardMaterial color="#f0f0e8"/><Edges color={BLUE}/></mesh>
      </group>)}
    </RigidBody>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.035,14]} userData={{ignoreProjectile:true}}><circleGeometry args={[13,48]}/><meshBasicMaterial color="#e8f6fe"/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.038,-6]} userData={{ignoreProjectile:true}}><circleGeometry args={[23,48]}/><meshBasicMaterial color="#f8f9ef"/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.04,-26]} userData={{ignoreProjectile:true}}><circleGeometry args={[20,48]}/><meshBasicMaterial color="#eaf7ff"/></mesh>
    <FinalApprovalGate/>
    {Array.from({length:7},(_,i)=>{const a=i*2.399;return <mesh key={i} position={[Math.sin(a)*68,19+i%3*4,Math.cos(a)*66-10]} rotation={[.18,i,Math.sin(i)*.3]} userData={{ignoreProjectile:true}}><boxGeometry args={[9,.16,6]}/><meshBasicMaterial color="#ffffff" transparent opacity={.46}/></mesh>;})}
    <HeavenAmbience/><JudgementRays/>
  </>;
}
