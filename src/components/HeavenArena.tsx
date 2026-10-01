import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "../game/store";
import { isApprovalPressure } from "../game/attackDirector";
import { hazardDamage } from "../game/hazards";

const BLUE = "#315fa5";
const platforms: [number, number][] = [[-27,-26],[27,-26],[-27,24],[27,24]];
const raySites: [number, number][] = [[-14,-12],[16,-14],[-15,16],[17,17],[0,1]];

function JudgementRays() {
  const warning = useRef<(THREE.Mesh | null)[]>([]);
  const beams = useRef<(THREE.Mesh | null)[]>([]);
  const elapsed = useRef(0);
  const lastHit = useRef(-10);
  const sweepAt = useRef(-Infinity);
  useEffect(()=>{const onReject=()=>{sweepAt.current=performance.now();elapsed.current=0;};window.addEventListener("approval-rejected",onReject);return()=>window.removeEventListener("approval-rejected",onReject);},[]);
  useFrame((_, delta) => {
    const game = useGameStore.getState();
    const enabled = game.screen === "playing" && !game.tutorialOpen && performance.now() >= game.hazardSuppressedUntil && !Object.keys(game.enemyPositions).some(id => id.startsWith("dragon-") && !game.eliminated.includes(id));
    const sweepAge = (performance.now()-sweepAt.current)/1000;
    const sweeping = sweepAge >= 0 && sweepAge < 4.8;
    if (enabled && !sweeping) elapsed.current += Math.min(delta, .1);
    const period = isApprovalPressure() ? 6.8 : 8;
    const normalPhase = elapsed.current % period;
    const phase = sweeping ? sweepAge % 1.6 : normalPhase;
    const activeIndex = sweeping ? [0,2,4][Math.floor(sweepAge/1.6)] : Math.floor(elapsed.current / period) % raySites.length;
    const warn = sweeping ? phase < .8 : phase >= period-4 && phase < period-3;
    const strike = sweeping ? phase >= .8 : phase >= period-3 && phase < period-2;
    warning.current.forEach((mesh, i) => { if (mesh) mesh.visible = enabled && i === activeIndex && warn; });
    beams.current.forEach((mesh, i) => { if (mesh) mesh.visible = enabled && i === activeIndex && strike; });
    if (!enabled || !strike || performance.now() - lastHit.current < 800) return;
    const [x, z] = raySites[activeIndex];
    const [px, py, pz] = game.playerPosition;
    if (Math.hypot(px - x, pz - z) < 4.5 && py < 4) {
      lastHit.current = performance.now();
      game.damagePlayer(hazardDamage(12, game.currentLevel, game.ngPlusCycle), [x, 2, z], "heavenBeam");
    }
  });
  return <>{raySites.map(([x,z], i) => <group key={i} userData={{ ignoreProjectile: true }}>
    <mesh ref={node => { warning.current[i] = node; }} position={[x,.07,z]} rotation={[-Math.PI/2,0,0]} visible={false}>
      <circleGeometry args={[4.5,32]}/><meshBasicMaterial color="#ef3042" transparent opacity={.48} depthWrite={false} side={THREE.DoubleSide}/>
    </mesh>
    <mesh ref={node => { beams.current[i] = node; }} position={[x,12,z]} visible={false}>
      <cylinderGeometry args={[2.4,2.4,24,16]}/><meshBasicMaterial color="#ff9c76" transparent opacity={.55} depthWrite={false}/>
    </mesh>
  </group>)}</>;
}

function CloudLifts(){
  const lastLift=useRef(0);
  useFrame(()=>{
    const state=useGameStore.getState();
    if(state.screen!=="playing"||performance.now()-lastLift.current<2200)return;
    const [px,py,pz]=state.playerPosition;
    if(py>2)return;
    const pad=platforms.find(([x,z])=>Math.hypot(px-x,pz-(z<0?z+11:z-11))<2.3);
    if(pad){lastLift.current=performance.now();window.dispatchEvent(new Event("heaven-cloud-lift"));}
  });
  return <>{platforms.map(([x,z],i)=><group key={i} position={[x,.1,z<0?z+11:z-11]} userData={{ignoreProjectile:true}}>
    <mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[2.4,24]}/><meshBasicMaterial color="#a9e9ff" transparent opacity={.75} side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,.1,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.8,2.2,24]}/><meshBasicMaterial color={BLUE} side={THREE.DoubleSide}/></mesh>
  </group>)}</>;
}

function FinalApprovalGate(){
  const texture=useMemo(()=>{const canvas=document.createElement("canvas");canvas.width=768;canvas.height=512;const g=canvas.getContext("2d")!;
    g.fillStyle="#fffdf3";g.strokeStyle="#285395";g.lineWidth=15;g.beginPath();g.roundRect(66,32,636,446,28);g.fill();g.stroke();
    g.strokeStyle="#8aa7d6";g.lineWidth=3;for(let y=195;y<424;y+=43){g.beginPath();g.moveTo(107,y);g.lineTo(657,y);g.stroke();}
    g.textAlign="center";g.fillStyle="#294b86";g.font="bold 48px ui-rounded, sans-serif";g.fillText("FINAL APPROVAL",384,112);
    g.fillStyle="#d65a66";g.font="bold 30px ui-rounded, sans-serif";g.fillText("THE HEAVENS",384,164);
    g.strokeStyle="#e6ba66";g.lineWidth=15;g.beginPath();g.arc(384,341,73,0,Math.PI*2);g.stroke();
    g.fillStyle="#d65a66";g.font="bold 85px sans-serif";g.fillText("✓",384,372);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;},[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <group position={[0,0,-31]} userData={{ignoreProjectile:true}}>
    <mesh position={[0,6,.8]}><planeGeometry args={[12,9]}/><meshBasicMaterial map={texture} transparent side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,12,0]}><torusGeometry args={[9,.18,8,48,Math.PI]}/><meshBasicMaterial color="#dfb969"/></mesh>
    {[-1,1].map(side=><group key={side} position={[side*7,6,.5]}><mesh><cylinderGeometry args={[.6,.78,11,12]}/><meshBasicMaterial color="#f9f7e9"/></mesh><mesh position={[0,5.8,0]}><sphereGeometry args={[.9,12,8]}/><meshBasicMaterial color="#f4d887"/></mesh></group>)}
  </group>;
}

function HeavenAmbience(){
  const next=useRef(0);
  useFrame(({clock})=>{if(clock.elapsedTime<next.current||useGameStore.getState().screen!=="playing")return;next.current=clock.elapsedTime+9;window.dispatchEvent(new CustomEvent("world-sfx",{detail:{kind:"heavenChime",position:[0,6,-31]}}));});
  return null;
}

export function HeavenArena() {
  return <>
    <color attach="background" args={["#d7f0ff"]}/><fog attach="fog" args={["#d7f0ff", 65, 150]}/>
    <hemisphereLight intensity={2} color="#ffffff" groundColor="#bedff1"/>
    <directionalLight position={[19,34,11]} intensity={2.2} color="#fffae6" castShadow/>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[48,.25,48]} position={[0,-.25,0]}/>
      <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[96,96]}/><meshStandardMaterial color="#f7f9fc" roughness={.95}/></mesh>
      <gridHelper args={[96,48,BLUE,BLUE]} position={[0,.02,0]} material-transparent material-opacity={.16}/>
      {[[-48,0,0,.8,9,96],[48,0,0,.8,9,96],[0,0,-48,96,9,.8],[0,0,48,96,9,.8]].map(([x,,z,w,h,d],i)=><group key={i}>
        <CuboidCollider args={[w/2,h/2,d/2]} position={[x,h/2,z]}/>
        <mesh position={[x,h/2,z]}><boxGeometry args={[w,h,d]}/><meshStandardMaterial color="#d7e7f5"/><Edges color={BLUE}/></mesh>
      </group>)}
    </RigidBody>
    <mesh position={[0,.06,0]} rotation={[-Math.PI/2,0,0]} userData={{ ignoreProjectile:true }}><circleGeometry args={[21,64]}/><meshBasicMaterial color="#eaf9ff"/></mesh>
    {platforms.map(([x,z],i)=><group key={i} position={[x,0,z]} userData={{ ignoreProjectile:true }}>
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[9.5,.25,9.5]} position={[0,2.25,0]}/><mesh position={[0,2.25,0]}><boxGeometry args={[19,.5,19]}/><meshStandardMaterial color="#e3f2fa"/><Edges color={BLUE}/></mesh></RigidBody>
      <mesh position={[0,2.56,0]}><boxGeometry args={[10,.1,10]}/><meshBasicMaterial color={i%2?"#eaf7ff":"#fffdfa"}/></mesh>
      {[-5,-2.5,0,2.5,5].map(offset=><mesh key={offset} position={[offset,2.58,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.045,18]}/><meshBasicMaterial color="#9eb7dc"/></mesh>)}
      {[-7,7].map(offset=><mesh key={offset} position={[0,2.59,offset]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[18,.06]}/><meshBasicMaterial color="#9eb7dc"/></mesh>)}
      {[-1,1].map(side=><mesh key={side} position={[side*5,1.65,0]}><boxGeometry args={[.4,2.2,.4]}/><meshStandardMaterial color={BLUE}/></mesh>)}
    </group>)}
    <FinalApprovalGate/>
    {Array.from({length:16},(_,i)=>{const a=i*2.399;return <mesh key={i} position={[Math.sin(a)*65,17+i%5*4,Math.cos(a)*60-10]} rotation={[.18,i,Math.sin(i)*.3]} userData={{ ignoreProjectile:true }}><boxGeometry args={[8+i%3*3,.16,5+i%4*2]}/><meshBasicMaterial color="#ffffff" transparent opacity={.65}/></mesh>;})}
    {Array.from({length:10},(_,i)=>{const a=i*2.4;return <group key={`cloud-${i}`} position={[Math.sin(a)*67,11+i%4*5,Math.cos(a)*65-5]} userData={{ignoreProjectile:true}}>{[-1,0,1].map((side)=><mesh key={side} position={[side*3,Math.abs(side)*-.6,0]}><sphereGeometry args={[side===0?5:3.7,12,8]}/><meshBasicMaterial color="#fffefa" transparent opacity={.46} depthWrite={false}/></mesh>)}</group>;})}
    <HeavenAmbience/>
    <CloudLifts/>
    <JudgementRays/>
  </>;
}
