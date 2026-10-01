import { Hitbox } from "./Hitbox";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { enemyHpScale, getEnemyTuning } from "../game/levels";
import { reportBossHealth } from "../game/bossHud";
import { setDragonAttack } from "../game/attackDirector";
import { paperBlastDamage, type PaperBlast } from "../game/hazards";
import { useGameStore } from "../game/store";
import { EnemyFeedback } from "./EnemyFeedback";
import { ScanHalo } from "./ScanHalo";
import { DragonDoodle } from "./EnemyDoodle";
import type { WorldSound } from "../game/worldSound";
function cue(kind:WorldSound,position?:[number,number,number]) {window.dispatchEvent(new CustomEvent("world-sfx",{detail:{kind,position}}));}

const SEALS = ["left","right","chest"] as const;
type Move = "REDLINE BREATH"|"DEADLINE DIVE"|"FORM BARRAGE"|"RED TAPE RING";

export function PaperworkDragon({ id = "dragon-final" }: { id?: string }) {
  const level = useGameStore(s=>s.currentLevel);
  const cycle = useGameStore(s=>s.ngPlusCycle);
  const maxHp = Math.round(2800*enemyHpScale(level,cycle)/enemyHpScale(12));
  const startingSeals:[number,number,number]=[230,230,230].map(x=>Math.round(x*maxHp/2800)) as [number,number,number];
  const root = useRef<THREE.Group>(null);
  const art = useRef<THREE.Group>(null);
  const telegraph = useRef<THREE.Mesh>(null);
  const tapeRing = useRef<THREE.Mesh>(null);
  const diveLane = useRef<THREE.Mesh>(null);
  const breathWarning = useRef<THREE.Mesh>(null);
  const barrageWarnings = useRef<(THREE.Mesh|null)[]>([]);
  const barrageForms = useRef<(THREE.Mesh|null)[]>([]);
  const headHitbox = useRef<THREE.Mesh>(null);
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
  const diveStart = useRef(new THREE.Vector3());
  const barrageLanded = useRef<number[]>([]);
  const impactDone = useRef(false);
  const lastDamage = useRef(-10);
  const lastPosition = useRef(0);
  const lastWingSound = useRef(-5);
  const deathTimer = useRef<number | null>(null);
  const flashTimer = useRef<number | null>(null);
  const eliminate = useGameStore(s=>s.eliminate);
  const breathShape = useMemo(()=>{const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(-9,-18);shape.quadraticCurveTo(0,-20,9,-18);shape.lineTo(0,0);return shape;},[]);
  useEffect(() => { setDragonAttack(true); return () => setDragonAttack(false); }, []);
  useEffect(() => {
    if (health <= 0) return;
    const timer = window.setTimeout(() => reportBossHealth({ id, name: "THE PAPERWORK DRAGON", health, maxHp, detail: `PHASE ${health/maxHp>.65?1:health/maxHp>.35?2:3} · ${sealHp.filter(x=>x>0).length} SEALS` }), 0);
    return () => window.clearTimeout(timer);
  }, [id, health, maxHp, sealHp]);
  useEffect(() => () => reportBossHealth({ id, clear: true }), [id]);
  useEffect(()=>{
    const onHit=(event:Event)=>{
      const {id:target,damage,part}=(event as CustomEvent<{id:string;damage:number;part?:string}>).detail;
      const sealIndex=SEALS.findIndex(name=>target===`${id}-seal-${name}`);
      if (target!==id&&sealIndex<0) return;
      if (hp.current<=0) return;
      setFlash(true);if(flashTimer.current)clearTimeout(flashTimer.current);flashTimer.current=window.setTimeout(()=>setFlash(false),110);
      if (sealIndex>=0) {
        if (seals.current[sealIndex]<=0) return;
        seals.current[sealIndex]=Math.max(0,seals.current[sealIndex]-damage);
        setSealHp([...seals.current]);
        if (!seals.current[sealIndex]) {
          cue("dragonSeal",[root.current?.position.x??0,3,root.current?.position.z??0]);
          const remaining=seals.current.filter(value=>value>0).length;
          setPop(`SEAL BROKEN · ${remaining} REMAIN`);
          window.setTimeout(()=>setPop(""),1500);
        }
        return;
      }
      if (target!==id) return;
      const sealed=seals.current.some(value=>value>0);
      const exposed=part==="head"&&move.current==="DEADLINE DIVE"&&phase.current==="recover";
      const dealt=damage*(sealed?.25:exposed?1.35:1);
      if (sealed) setPop(`SEALED · ${Math.round(dealt)}`);
      else cue("dragonHurt",[root.current?.position.x??0,3,root.current?.position.z??0]);
      const beforePhase=hp.current/maxHp>.65?1:hp.current/maxHp>.35?2:3;
      hp.current=Math.max(0,hp.current-dealt);setHealth(hp.current);
      const afterPhase=hp.current/maxHp>.65?1:hp.current/maxHp>.35?2:3;
      if(afterPhase>beforePhase&&hp.current>0){setPop(`PHASE ${afterPhase} · FINAL NOTICE`);cue("dragonPhase",[root.current?.position.x??0,3,root.current?.position.z??0]);}
      else setPop(sealed?`SEALED · ${Math.round(dealt)}`:part==="head"?`HEADSHOT · ${Math.round(dealt)}`:`${Math.round(dealt)}`);
      window.setTimeout(()=>setPop(""),afterPhase>beforePhase?1500:550);
      if (hp.current<=0) {
        reportBossHealth({ id, clear: true });
        deathAt.current=performance.now();phase.current="recover";
        if(root.current)root.current.userData.ignoreProjectile=true;
        setDead(true);
        cue("dragonDeath",[root.current?.position.x??0,3,root.current?.position.z??0]);
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
  },[id,eliminate,maxHp]);
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
      art.current?.traverse(object => { if (object instanceof THREE.Mesh) (object.material as THREE.MeshBasicMaterial).opacity = age>5?Math.max(0,6-age):1; });
      return;
    }
    const game=useGameStore.getState();
    if(game.screen!=="playing"||game.tutorialOpen){if(marker)marker.visible=false;return;}
    if(now-lastWingSound.current>2.4){lastWingSound.current=now;cue("dragonWing",[mesh.position.x,mesh.position.y,mesh.position.z]);}
    const [px,py,pz]=game.playerPosition;
    if(art.current){art.current.rotation.y=Math.atan2(px-mesh.position.x,pz-mesh.position.z)-mesh.rotation.y;art.current.scale.x=1+.025*Math.sin(now*3.2);art.current.rotation.z=phase.current==="attack"&&move.current==="DEADLINE DIVE"?-.11:0;}
    if(now-lastPosition.current>.14){lastPosition.current=now;game.setEnemyPosition(id,[mesh.position.x,mesh.position.y+2,mesh.position.z]);}
    if(phase.current==="intro") {phase.current="idle";phaseAt.current=now;}
    const fraction=hp.current/maxHp;
    const sealed=seals.current.some(value=>value>0);
    if(phase.current==="idle"&&now-phaseAt.current>(fraction<.35?1.7:2.4)){
      const options:Move[]=sealed?["REDLINE BREATH","FORM BARRAGE","DEADLINE DIVE"]:["REDLINE BREATH","FORM BARRAGE","DEADLINE DIVE","RED TAPE RING"];
      move.current=options[attackCount.current++%options.length];
      phase.current="warn";phaseAt.current=now;locked.current.set(px,0,pz);
      diveStart.current.copy(mesh.position);barrageLanded.current=[];impactDone.current=false;
      breathDirection.current.set(px-mesh.position.x,0,pz-mesh.position.z).normalize();
      mesh.rotation.y=Math.atan2(breathDirection.current.x,breathDirection.current.z);
      const warningSound:Record<Move,WorldSound>={"REDLINE BREATH":"dragonBreathWarn","DEADLINE DIVE":"dragonDiveWarn","FORM BARRAGE":"dragonBarrageWarn","RED TAPE RING":"dragonTapeWarn"};
      cue(warningSound[move.current]);
    }
    const warningDuration=move.current==="REDLINE BREATH"?1.3:move.current==="DEADLINE DIVE"?1.2:1.15;
    if(phase.current==="warn"&&now-phaseAt.current>=warningDuration){
      phase.current="attack";phaseAt.current=now;
      if(move.current==="REDLINE BREATH")cue("dragonBreath");
    }
    if(phase.current==="attack"){
      const age=now-phaseAt.current;
      let hit=false;let damage=0;let cooldown=1000;
      if(move.current==="REDLINE BREATH"&&age<1.65){
        const dx=px-mesh.position.x,dz=pz-mesh.position.z;
        const forward=dx*breathDirection.current.x+dz*breathDirection.current.z;
        const lateral=Math.abs(dx*breathDirection.current.z-dz*breathDirection.current.x);
        hit=forward>0&&forward<18&&lateral<forward*.5&&py<4;damage=10;cooldown=700;
      }
      if(move.current==="DEADLINE DIVE"){
        const travel=THREE.MathUtils.smoothstep(age,0,.5);
        mesh.position.x=THREE.MathUtils.lerp(diveStart.current.x,locked.current.x,travel);
        mesh.position.z=THREE.MathUtils.lerp(diveStart.current.z,locked.current.z,travel);
        if(age>=.48&&!impactDone.current){impactDone.current=true;cue("dragonCrash",[locked.current.x,1,locked.current.z]);
          hit=Math.hypot(px-locked.current.x,pz-locked.current.z)<5.5&&py<4;damage=24;}
      }
      if(move.current==="FORM BARRAGE"){
        for(let i=0;i<6;i++){
          const landing=.42+i*.23;
          if(age>=landing&&!barrageLanded.current.includes(i)){
            barrageLanded.current.push(i);
            const x=locked.current.x+(i-2.5)*2.4,z=locked.current.z+(i%2?2:-2);
            cue("approvalStamp",[x,.3,z]);
            if(Math.hypot(px-x,pz-z)<2.2&&py<4){hit=true;damage=7;}
          }
        }
      }
      if(move.current==="RED TAPE RING"&&age>=.46&&!impactDone.current){
        impactDone.current=true;cue("dragonCrash",[locked.current.x,1,locked.current.z]);
        const distance=Math.hypot(px-locked.current.x,pz-locked.current.z);
        hit=Math.abs(distance-4.5)<.85&&py<4;damage=17;
      }
      if(hit&&now-lastDamage.current>cooldown/1000){lastDamage.current=now;
        game.damagePlayer(Math.round(damage*getEnemyTuning(level,cycle).damage),[locked.current.x,2,locked.current.z]);}
      const duration=move.current==="REDLINE BREATH"?1.65:move.current==="FORM BARRAGE"?1.75:move.current==="DEADLINE DIVE"?.64:.67;
      if(age>=duration){phase.current="recover";phaseAt.current=now;}
    }
    if(phase.current==="recover"&&now-phaseAt.current>(move.current==="DEADLINE DIVE"?2.5:fraction<.35?1.5:1.9)){
      phase.current="idle";phaseAt.current=now;
    }
    const grounded=move.current==="DEADLINE DIVE"&&(phase.current==="attack"||phase.current==="recover");
    if(!grounded&&phase.current==="idle"){
      mesh.position.x=THREE.MathUtils.damp(mesh.position.x,0,.55,delta);
      mesh.position.z=THREE.MathUtils.damp(mesh.position.z,-25,.55,delta);
    }
    mesh.position.y=grounded&&phase.current==="attack"
      ?THREE.MathUtils.lerp(diveStart.current.y,.5,THREE.MathUtils.smoothstep(now-phaseAt.current,0,.5))
      :THREE.MathUtils.damp(mesh.position.y,grounded?.5:5.6,grounded?3:1.8,delta);
    if(art.current)art.current.position.y=THREE.MathUtils.damp(art.current.position.y,grounded?-2.6:0,4,delta);
    if(headHitbox.current)headHitbox.current.position.y=grounded?2.9:5.5;
    if(marker){
      const ring=move.current==="RED TAPE RING";
      marker.visible=(phase.current==="warn"||phase.current==="attack")&&move.current==="DEADLINE DIVE";
      (marker.material as THREE.MeshBasicMaterial).color.set(phase.current==="attack"?"#ffa450":"#f32840");
      mesh.updateWorldMatrix(true,false);
      marker.position.copy(mesh.worldToLocal(new THREE.Vector3(locked.current.x,.08,locked.current.z)));
      marker.scale.setScalar(5.5);
      if(tapeRing.current){tapeRing.current.visible=(phase.current==="warn"||phase.current==="attack")&&ring;
        tapeRing.current.position.copy(marker.position);
        (tapeRing.current.material as THREE.MeshBasicMaterial).color.set(phase.current==="attack"?"#ffa450":"#ef3042");}
    }
    if(diveLane.current){
      diveLane.current.visible=phase.current==="warn"&&move.current==="DEADLINE DIVE";
      if(diveLane.current.visible){
        const dx=locked.current.x-mesh.position.x,dz=locked.current.z-mesh.position.z;
        diveLane.current.position.copy(mesh.worldToLocal(new THREE.Vector3((locked.current.x+mesh.position.x)/2,.09,(locked.current.z+mesh.position.z)/2)));
        diveLane.current.rotation.set(-Math.PI/2,0,-Math.atan2(dx,dz));
        diveLane.current.scale.set(2.8,Math.hypot(dx,dz),1);
      }
    }
    if(breathWarning.current){
      breathWarning.current.visible=(phase.current==="warn"||phase.current==="attack")&&move.current==="REDLINE BREATH";
      breathWarning.current.position.y=-mesh.position.y+.09;
      (breathWarning.current.material as THREE.MeshBasicMaterial).color.set(phase.current==="attack"?"#ffb460":"#ed263c");
    }
    barrageWarnings.current.forEach((warning,i)=>{
      if(!warning)return;
      const age=now-phaseAt.current;
      warning.visible=move.current==="FORM BARRAGE"&&(phase.current==="warn"||phase.current==="attack"&&age<.42+i*.23);
      if(warning.visible){mesh.updateWorldMatrix(true,false);
        warning.position.copy(mesh.worldToLocal(new THREE.Vector3(locked.current.x+(i-2.5)*2.4,.08,locked.current.z+(i%2?2:-2))));}
    });
    barrageForms.current.forEach((form,i)=>{
      if(!form)return;
      const age=now-phaseAt.current;
      const drop=.42+i*.23;
      form.visible=move.current==="FORM BARRAGE"&&phase.current==="attack"&&age>=drop-.28&&age<drop+.24;
      if(form.visible){mesh.updateWorldMatrix(true,false);
        const height=Math.max(.2,(drop-age)*22);
        form.position.copy(mesh.worldToLocal(new THREE.Vector3(locked.current.x+(i-2.5)*2.4,height,locked.current.z+(i%2?2:-2))));}
    });
  });
  return <group ref={root} position={[0,13,-28]}>
    <EnemyFeedback id={id} root={root}/>
    <group ref={art}><DragonDoodle dead={dead} flash={flash} phase={phase} move={move}/></group>
    {!dead&&<>
      <Hitbox id={id} part="body" position={[0,2,0]} size={[5,3.2,2.6]}/>
      <Hitbox id={id} part="head" position={[0,5.5,.35]} size={[3.8,2.9,2.2]} ref={headHitbox}/>
      {[-1,1].map(side=><group key={side}>
        <Hitbox id={id} part="body" position={[side*4.3,2.8,0]} size={[4.2,2.8,1.3]}/>
        <Hitbox id={id} part="leg" position={[side*1.7,.3,0]} size={[1.1,1.4,1.3]}/>
      </group>)}
      {SEALS.map((name,i)=>sealHp[i]>0&&<group key={name} position={i===0?[-3.3,2.2,1.5]:i===1?[3.3,2.2,1.5]:[0,2,1.6]}>
        <Hitbox id={`${id}-seal-${name}`} part="special" position={[0,0,0]} size={[1.3,1.3,.42]}/>
        <mesh position={[0,0,.24]} userData={{ignoreProjectile:true}}><circleGeometry args={[.64,6]}/><meshBasicMaterial color="#efc277" side={THREE.DoubleSide}/></mesh>
        <mesh position={[0,0,.27]} userData={{ignoreProjectile:true}}><ringGeometry args={[.33,.42,6]}/><meshBasicMaterial color="#d55d65" side={THREE.DoubleSide}/></mesh>
      </group>)}
    </>}
    <mesh ref={telegraph} rotation={[-Math.PI/2,0,0]} visible={false} userData={{ignoreProjectile:true}}><circleGeometry args={[1,32]}/><meshBasicMaterial color="#f32840" transparent opacity={.45} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    <mesh ref={tapeRing} rotation={[-Math.PI/2,0,0]} visible={false} userData={{ignoreProjectile:true}}><ringGeometry args={[3.65,5.35,48]}/><meshBasicMaterial color="#f32840" transparent opacity={.6} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    <mesh ref={diveLane} visible={false} userData={{ignoreProjectile:true}}><planeGeometry args={[1,1]}/><meshBasicMaterial color="#e7364f" transparent opacity={.37} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    <mesh ref={breathWarning} rotation={[-Math.PI/2,0,0]} visible={false} userData={{ignoreProjectile:true}}><shapeGeometry args={[breathShape]}/><meshBasicMaterial color="#ed263c" transparent opacity={.45} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    {Array.from({length:6},(_,i)=><mesh key={i} ref={node=>{barrageWarnings.current[i]=node;}} rotation={[-Math.PI/2,0,0]} visible={false} userData={{ignoreProjectile:true}}><circleGeometry args={[2.2,16]}/><meshBasicMaterial color="#ed263c" transparent opacity={.38} depthWrite={false} side={THREE.DoubleSide}/></mesh>)}
    {Array.from({length:6},(_,i)=><mesh key={`form-${i}`} ref={node=>{barrageForms.current[i]=node;}} visible={false} userData={{ignoreProjectile:true}}><boxGeometry args={[1.5,2,.15]}/><meshBasicMaterial color="#fff4d7" side={THREE.DoubleSide}/></mesh>)}
    {!dead&&<ScanHalo id={id} size={5}/>}
    {pop&&<Html position={[0,8.5,0]} center style={{pointerEvents:"none"}}><div className="dragon-pop">{pop}</div></Html>}
  </group>;
}
