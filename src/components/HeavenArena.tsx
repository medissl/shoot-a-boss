import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "../game/store";
import { hazardDamage } from "../game/hazards";

const BLUE = "#315fa5";
const platforms: [number, number][] = [[-27,-26],[27,-26],[-27,24],[27,24]];
const raySites: [number, number][] = [[-14,-12],[16,-14],[-15,16],[17,17],[0,1]];

function JudgementRays() {
  const warning = useRef<(THREE.Mesh | null)[]>([]);
  const beams = useRef<(THREE.Mesh | null)[]>([]);
  const elapsed = useRef(0);
  const lastHit = useRef(-10);
  useFrame((_, delta) => {
    const game = useGameStore.getState();
    const enabled = game.screen === "playing" && !game.tutorialOpen && !Object.keys(game.enemyPositions).some(id => id.startsWith("dragon-") && !game.eliminated.includes(id));
    if (enabled) elapsed.current += Math.min(delta, .1);
    const phase = elapsed.current % 8;
    const activeIndex = Math.floor(elapsed.current / 8) % raySites.length;
    warning.current.forEach((mesh, i) => { if (mesh) mesh.visible = enabled && i === activeIndex && phase >= 4 && phase < 5; });
    beams.current.forEach((mesh, i) => { if (mesh) mesh.visible = enabled && i === activeIndex && phase >= 5 && phase < 6; });
    if (!enabled || phase < 5 || phase >= 6 || elapsed.current - lastHit.current < .8) return;
    const [x, z] = raySites[activeIndex];
    const [px, py, pz] = game.playerPosition;
    if (Math.hypot(px - x, pz - z) < 4.5 && py < 4) {
      lastHit.current = elapsed.current;
      game.damagePlayer(hazardDamage(12, game.currentLevel, game.ngPlusCycle), [x, 2, z], "heavenBeam");
    }
  });
  return <>{raySites.map(([x,z], i) => <group key={i} userData={{ ignoreProjectile: true }}>
    <mesh ref={node => { warning.current[i] = node; }} position={[x,.07,z]} rotation={[-Math.PI/2,0,0]} visible={false}>
      <circleGeometry args={[4.5,32]}/><meshBasicMaterial color="#ef3042" transparent opacity={.48} depthWrite={false} side={THREE.DoubleSide}/>
    </mesh>
    <mesh ref={node => { beams.current[i] = node; }} position={[x,12,z]} visible={false}>
      <cylinderGeometry args={[2.4,2.4,24,16]}/><meshBasicMaterial color="#a7eeff" transparent opacity={.72} depthWrite={false}/>
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
      {[-1,1].map(side=><mesh key={side} position={[side*5,1.65,0]}><boxGeometry args={[.4,2.2,.4]}/><meshStandardMaterial color={BLUE}/></mesh>)}
    </group>)}
    <group position={[0,0,-31]} userData={{ ignoreProjectile:true }}>
      {[-1,1].map(side=><mesh key={side} position={[side*7,6,0]}><boxGeometry args={[1.1,12,1.3]}/><meshStandardMaterial color="#d7eaf8"/><Edges color={BLUE}/></mesh>)}
      <mesh position={[0,11.7,0]}><boxGeometry args={[16,1.2,1.3]}/><meshStandardMaterial color="#f5d894"/><Edges color={BLUE}/></mesh>
      <mesh position={[0,6,0]}><boxGeometry args={[9,9,.5]}/><meshStandardMaterial color="#f9fcff"/><Edges color={BLUE}/></mesh>
    </group>
    {Array.from({length:16},(_,i)=>{const a=i*2.399;return <mesh key={i} position={[Math.sin(a)*65,17+i%5*4,Math.cos(a)*60-10]} rotation={[.18,i,Math.sin(i)*.3]} userData={{ ignoreProjectile:true }}><boxGeometry args={[8+i%3*3,.16,5+i%4*2]}/><meshBasicMaterial color="#ffffff" transparent opacity={.65}/></mesh>;})}
    <CloudLifts/>
    <JudgementRays/>
  </>;
}
