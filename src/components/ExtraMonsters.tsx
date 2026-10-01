import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { enemyMotionFactor } from "../game/effects";
import { enemyHpScale, getEnemyTuning } from "../game/levels";
import { claimAttack } from "../game/attackDirector";
import { useHitHealthBar } from "./useHitHealthBar";
import { paperBlastDamage, type PaperBlast } from "../game/hazards";
import { hasEnemyLineOfSight, moveWithAvoidance, safeEnemySpawn } from "../game/navigation";
import { useGameStore } from "../game/store";
import { ScanHalo } from "./ScanHalo";
import { EnemyFeedback } from "./EnemyFeedback";
import { EnemyDoodle } from "./EnemyDoodle";

const STATUE_PERIOD = 20;
const STATUE_WARNING = 5;
const STATUE_FIRE_SECONDS = 5;
const STATUE_RADIUS = 5.5;

export function ExtraMonster({ id, spawn, kind }: { id: string; spawn: [number, number, number]; kind: "fly" | "statue" }) {
  const root = useRef<THREE.Group>(null);
  const art = useRef<THREE.Group>(null);
  const telegraph = useRef<THREE.Group>(null);
  const fire = useRef<THREE.Group>(null);
  const debris = useRef<THREE.Group>(null);
  const warningBeam = useRef<THREE.Mesh>(null);
  const attackBeam = useRef<THREE.Mesh>(null);
  const armed = useRef(false);
  const wasActive = useRef(false);
  const awarenessUntil = useRef(0);
  const lastAttack = useRef(0);
  const lastDamage = useRef(0);
  const targetArea = useRef(new THREE.Vector3());
  const wasWarning = useRef(false);
  const hitTimer = useRef<number | null>(null);
  const [hitFlash, setHitFlash] = useState(false);
  const lastPosition = useRef(0);
  const dive = useRef<"cruise" | "dive" | "recover">("cruise");
  const recoveryUntil = useRef(0);
  const lastSeen = useRef(new THREE.Vector3());
  const level = useGameStore((s) => s.currentLevel);
  const cycle = useGameStore((s) => s.ngPlusCycle);
  const screen = useGameStore((s) => s.screen);
  const eliminate = useGameStore((s) => s.eliminate);
  const tuning = getEnemyTuning(level, cycle);
  const effectiveLevel = level + cycle * 12;
  const index = Number(id.split("-")[1]) || 0;
  const maxHp = Math.round((kind === "statue" ? 300 : 120) * enemyHpScale(level, cycle));
  const hp = useRef(maxHp);
  const [dead, setDead] = useState(false);
  const deadAt = useRef(0);
  const deathOriginY = useRef(0);
  const [health, setHealth] = useState(maxHp);
  const { healthBarVisible, revealHealthBar } = useHitHealthBar();
  const [damagePops, setDamagePops] = useState<{id:number; amount:number; part:"head"|"body"|"leg"}[]>([]);
  const nextDamagePopId = useRef(0);
  const safeSpawn = useMemo(() => safeEnemySpawn(spawn, kind === "statue" ? 1.5 : 1.7, level), [spawn, kind, level]);

  useEffect(() => {
    const onHit = (event: Event) => {
      const { id: target, damage, part } = (event as CustomEvent<{ id: string; damage: number; part?:"head"|"body"|"leg" }>).detail;
      if (target !== id || hp.current <= 0) return;
      revealHealthBar();
      const popId = ++nextDamagePopId.current;
      setDamagePops((current) => [...current.slice(-3), {id:popId,amount:Math.round(damage),part:part??"body"}]);
      window.setTimeout(() => setDamagePops((current) => current.filter((pop) => pop.id !== popId)), 750);
      hp.current = Math.max(0, hp.current - damage);
      setHealth(hp.current);
      setHitFlash(true);
      if (hitTimer.current) window.clearTimeout(hitTimer.current);
      hitTimer.current = window.setTimeout(() => setHitFlash(false), 110);
      awarenessUntil.current = performance.now() + 5600;
      lastSeen.current.set(...useGameStore.getState().playerPosition);
      if (!hp.current) {
        deadAt.current = performance.now();
        if (root.current) { root.current.userData.ignoreProjectile = true; deathOriginY.current = root.current.position.y; }
        window.dispatchEvent(new CustomEvent("world-sfx", { detail: { kind: kind === "fly" ? "flyDeath" : "statueDeath", position: root.current ? [root.current.position.x, root.current.position.y, root.current.position.z] : spawn } }));
        setDead(true); eliminate(id);
      }
    };
    window.addEventListener("boss-hit", onHit);
    return () => { window.removeEventListener("boss-hit", onHit); if (hitTimer.current) window.clearTimeout(hitTimer.current); };
  }, [eliminate, id, kind, spawn, revealHealthBar]);

  useEffect(() => {
    const blast = (event: Event) => {
      if (!root.current || dead) return;
      const { x, y, z } = root.current.position;
      const damage = paperBlastDamage((event as CustomEvent<PaperBlast>).detail, [x, y + (kind === "statue" ? 2 : 0), z]);
      if (damage) window.dispatchEvent(new CustomEvent("boss-hit", { detail: { id, damage, part: "body" } }));
    };
    window.addEventListener("paper-grenade-explode", blast);
    return () => window.removeEventListener("paper-grenade-explode", blast);
  }, [dead, id, kind]);

  useFrame((state, delta) => {
    const mesh = root.current;
    if (!mesh) return;
    if (dead) {
      const age = (performance.now() - deadAt.current) / 1000;
      if (warningBeam.current) warningBeam.current.visible = false;
      if (attackBeam.current) attackBeam.current.visible = false;
      if (telegraph.current) telegraph.current.visible = false;
      if (fire.current) fire.current.visible = false;
      mesh.visible = age < 5;
      if (!mesh.visible) return;
      const fall = THREE.MathUtils.smoothstep(age, 0, kind === "fly" ? 1.15 : .85);
      mesh.rotation.z = (kind === "fly" ? -.42 : -.93) * fall;
      mesh.rotation.x = (kind === "fly" ? .27 : -.16) * fall;
      mesh.position.y = kind === "fly" ? THREE.MathUtils.lerp(deathOriginY.current, .95, fall) : -.12 * fall;
      mesh.scale.setScalar(age > 4 ? Math.max(.001, 5 - age) : 1);
      const sprite=art.current?.children[0] as THREE.Mesh | undefined; if(sprite){const material=sprite.material as THREE.MeshBasicMaterial;material.opacity=age>4?Math.max(0,5-age):1;}
      if (debris.current) { debris.current.rotation.y += delta * 2; debris.current.scale.setScalar(1 + Math.min(age, .8) * .35); }
      return;
    }
    const live = useGameStore.getState();
    if (screen !== "playing" || live.tutorialOpen) {
      if (telegraph.current) telegraph.current.visible = false;
      if (fire.current) fire.current.visible = false;
      if (warningBeam.current) warningBeam.current.visible = false;
      if (attackBeam.current) attackBeam.current.visible = false;
      return;
    }
    const now = state.clock.elapsedTime;
    const motion = enemyMotionFactor(id, live.runId);
    const [px, py, pz] = live.playerPosition;
    if (art.current) {art.current.rotation.y = Math.atan2(px-mesh.position.x,pz-mesh.position.z)-mesh.rotation.y;if(kind==="fly")art.current.scale.x=1+.09*Math.sin(now*11);}

    if (kind === "fly") {
      if (motion <= 0) return;
      const player = new THREE.Vector3(px, py, pz);
      const flatDistance = Math.hypot(px - mesh.position.x, pz - mesh.position.z);
      const seesPlayer = flatDistance < 43 * tuning.vision &&
        hasEnemyLineOfSight(mesh.position, player, level, 0.3);
      if (seesPlayer) {
        awarenessUntil.current = performance.now() + 5600;
        lastSeen.current.copy(player);
      }
      const hunting = seesPlayer || performance.now() < awarenessUntil.current;
      const target = seesPlayer ? player : lastSeen.current;
      if (hunting) {
        const direction = new THREE.Vector3(target.x - mesh.position.x, 0, target.z - mesh.position.z);
        const distance = direction.length();
        if (dive.current === "recover" && now >= recoveryUntil.current && mesh.position.y > py + 4.3) dive.current = "cruise";
        if (dive.current === "cruise" && seesPlayer && distance < 8 && now - lastAttack.current > Math.max(2.1, 3.9 - effectiveLevel * 0.09) && claimAttack(id, live.runId, level, 1500)) {dive.current = "dive";window.dispatchEvent(new CustomEvent("world-sfx",{detail:{kind:"flyAttack",position:[mesh.position.x,mesh.position.y,mesh.position.z]}}));}
        const desiredDistance = dive.current === "dive" ? 1.6 : 3.8;
        if (distance > desiredDistance) {
          const stride = direction.normalize().multiplyScalar(Math.min(distance - desiredDistance, (3.4 + effectiveLevel * 0.16) * tuning.speed * motion * delta));
          moveWithAvoidance(mesh.position, stride, 1.7, index % 2 ? -1 : 1, level, true);
        }
        const cruiseHeight = THREE.MathUtils.clamp(target.y + 5.3, 5.3, 22);
        const attackHeight = target.y + 1.5;
        mesh.position.y = THREE.MathUtils.damp(mesh.position.y, dive.current === "dive" ? attackHeight : cruiseHeight + Math.sin(now * 3 + index) * 0.22, (dive.current === "dive" ? 4.2 : 2.5) * motion, delta);
      } else {
        mesh.position.y = THREE.MathUtils.damp(mesh.position.y, 5.2 + Math.sin(now * 2 + index) * 0.5, 1.4, delta);
      }
      mesh.rotation.y = THREE.MathUtils.damp(mesh.rotation.y, Math.atan2(px - mesh.position.x, pz - mesh.position.z), 4, delta);
      if (seesPlayer && Math.floor(now * 2) !== Math.floor((now - delta) * 2)) window.dispatchEvent(new CustomEvent("world-sfx", { detail: { kind: "flyWing", position: [mesh.position.x, mesh.position.y, mesh.position.z] } }));
      if (now - lastPosition.current > 0.14) {
        lastPosition.current = now;
        live.setEnemyPosition(id, [mesh.position.x, mesh.position.y, mesh.position.z]);
      }
      if (dive.current === "dive" && seesPlayer && flatDistance < 2.8 && Math.abs(py + 1.5 - mesh.position.y) < 0.8) {
        lastAttack.current = now;
        dive.current = "recover";
        recoveryUntil.current = now + 1.1;
        live.damagePlayer(Math.round(11 * tuning.damage), [mesh.position.x, mesh.position.y, mesh.position.z]);
        window.dispatchEvent(new CustomEvent("world-sfx", { detail: { kind: "flyAttack", position: [mesh.position.x, mesh.position.y, mesh.position.z] } }));
      }
      return;
    }

    if (now - lastPosition.current > 1) {
      lastPosition.current = now;
      live.setEnemyPosition(id, [mesh.position.x, 2.3, mesh.position.z]);
    }
    const shifted = now + index * 2.4;
    const phase = shifted % STATUE_PERIOD;
    const started = shifted >= STATUE_PERIOD;
    const warning = phase >= STATUE_PERIOD - STATUE_WARNING;
    const active = started && phase < STATUE_FIRE_SECONDS;
    if (warning && !wasWarning.current) {
      armed.current = motion > 0 && Math.hypot(px-mesh.position.x,pz-mesh.position.z) < 72*tuning.vision &&
        hasEnemyLineOfSight(new THREE.Vector3(mesh.position.x,3.6,mesh.position.z),new THREE.Vector3(px,py+1,pz),level,.45) &&
        claimAttack(id,live.runId,level,(STATUE_WARNING+STATUE_FIRE_SECONDS)*1000);
      targetArea.current.set(px - mesh.position.x, Math.max(0,py-1.4), pz - mesh.position.z);
      if(armed.current)window.dispatchEvent(new CustomEvent("world-sfx",{detail:{kind:"statueCharge",position:[mesh.position.x,mesh.position.y,mesh.position.z]}}));
    }
    wasWarning.current = warning;
    const origin = new THREE.Vector3(0,3.5,0);
    const target = new THREE.Vector3(targetArea.current.x,targetArea.current.y+1,targetArea.current.z);
    const direction = target.clone().sub(origin);
    const length = direction.length();
    const unit = direction.clone().normalize();
    for(const beam of [warningBeam.current,attackBeam.current])if(beam){beam.position.copy(origin).addScaledVector(direction,.5);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),unit);beam.scale.y=length;}
    if(warningBeam.current)warningBeam.current.visible=warning&&armed.current&&motion>0;
    if(attackBeam.current)attackBeam.current.visible=active&&armed.current&&motion>0;
    if(active&&!wasActive.current&&armed.current)window.dispatchEvent(new CustomEvent("world-sfx",{detail:{kind:"statueFire",position:[mesh.position.x,mesh.position.y,mesh.position.z]}}));
    wasActive.current=active;
    if (telegraph.current) {
      telegraph.current.position.set(targetArea.current.x, targetArea.current.y+0.08, targetArea.current.z);
      telegraph.current.visible = warning && armed.current && motion > 0;
      const material = (telegraph.current.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      const timeToFire = STATUE_PERIOD - phase;
      const blink = 4 + (1 - timeToFire / STATUE_WARNING) * 25;
      material.opacity = 0.3 + 0.47 * Math.abs(Math.sin(now * blink));
      if(warningBeam.current)(warningBeam.current.material as THREE.MeshBasicMaterial).opacity=material.opacity;
    }
    if (fire.current) {
      fire.current.position.set(targetArea.current.x,targetArea.current.y,targetArea.current.z);
      fire.current.visible = active && armed.current && motion > 0;
      if (active) fire.current.children.slice(2).forEach((flame, i) => {
        flame.scale.y = 0.7 + Math.sin(now * 11 + i * 2.1) * 0.27;
        flame.rotation.y = Math.sin(now * 5 + i) * 0.25;
      });
    }
    if (active && armed.current && motion > 0 && Math.abs(py-(targetArea.current.y+1.4))<2.5 && Math.hypot(px - (mesh.position.x + targetArea.current.x), pz - (mesh.position.z + targetArea.current.z)) < STATUE_RADIUS && now - lastDamage.current >= 0.75) {
      lastDamage.current = now;
      live.damagePlayer(Math.round(8 * tuning.damage), [mesh.position.x, 3.6, mesh.position.z]);
    }
  });

  return <group ref={root} position={[safeSpawn[0], kind === "fly" ? 5.2 : 0, safeSpawn[2]]}>
    {dead && <group ref={debris} userData={{ ignoreProjectile: true }}>{[-1, 1].map(side => <mesh key={side} position={[side * 1.55, kind === "fly" ? .45 : 2.8, .3]} rotation={[side * .4, 0, side * .5]}><tetrahedronGeometry args={[kind === "fly" ? .4 : .55]} /><meshBasicMaterial color={kind === "fly" ? "#d7a7f6" : "#aab0b9"} transparent opacity={.7} /></mesh>)}</group>}
    <EnemyFeedback id={id} root={root} />
    <group ref={art}><EnemyDoodle kind={kind} dead={dead} flash={hitFlash} width={kind === "fly" ? 3.9 : 4} height={kind === "fly" ? 3.5 : 5.1} position={[0,kind === "fly" ? .1 : 2.35,.26]}/></group>
    {!dead && (kind === "fly" ? <>
      <mesh position={[0,0,0]} userData={{targetId:id,targetPart:"body"}}><boxGeometry args={[1.7,1.8,1.1]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>
      <mesh position={[0,.9,0]} userData={{targetId:id,targetPart:"head"}}><boxGeometry args={[1.25,.85,1]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>
      {[-1,1].map(side=><mesh key={side} position={[side*.35,-1.35,0]} userData={{targetId:id,targetPart:"leg"}}><boxGeometry args={[.4,.7,.8]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>)}
    </> : <>
      <mesh position={[0,.75,0]} userData={{targetId:id,targetPart:"leg"}}><boxGeometry args={[2.4,1.3,1.4]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>
      <mesh position={[0,2.15,0]} userData={{targetId:id,targetPart:"body"}}><boxGeometry args={[2.4,1.8,1.5]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>
      <mesh position={[0,4,0]} userData={{targetId:id,targetPart:"head"}}><boxGeometry args={[1.55,1.2,1.3]}/><meshBasicMaterial colorWrite={false} depthWrite={false}/></mesh>
    </>)}
    {kind === "statue" && <>
      <mesh ref={warningBeam} visible={false} userData={{ ignoreProjectile: true }}><cylinderGeometry args={[.09,.09,1,8]}/><meshBasicMaterial color="#ff5062" depthWrite={false} transparent opacity={.6}/></mesh>
      <mesh ref={attackBeam} visible={false} userData={{ ignoreProjectile: true }}><cylinderGeometry args={[.48,.48,1,12]}/><meshBasicMaterial color="#ff213a" toneMapped={false} depthWrite={false} transparent opacity={.88}/></mesh>
      <group ref={telegraph} visible={false} position={[0, 0.08, 0]} userData={{ ignoreProjectile: true }}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[STATUE_RADIUS, 32]} /><meshBasicMaterial color="#f33b4d" side={THREE.DoubleSide} transparent opacity={0.4} depthWrite={false} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[STATUE_RADIUS - 0.3, STATUE_RADIUS, 32]} /><meshBasicMaterial color="#fc5c65" side={THREE.DoubleSide} /></mesh>
      </group>
      <group ref={fire} visible={false} userData={{ ignoreProjectile: true }}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}><circleGeometry args={[STATUE_RADIUS, 32]} /><meshBasicMaterial color="#e84655" side={THREE.DoubleSide} transparent opacity={0.42} depthWrite={false} /></mesh>
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const radius = i % 3 ? 4.7 : 2.8;
          return <mesh key={i} position={[Math.cos(angle) * radius, 0.95, Math.sin(angle) * radius]} rotation={[0, 0, Math.sin(i) * 0.18]}>
            <coneGeometry args={[0.48, 1.9 + (i % 3) * 0.35, 5]} /><meshBasicMaterial color={i % 3 ? "#ff443a" : "#ff9158"} transparent opacity={0.88} depthWrite={false} />
          </mesh>;
        })}
      </group>
    </>}
    {!dead && healthBarVisible && <group position={[0, kind === "fly" ? 1.65 : 4.7, 0]} userData={{ ignoreProjectile: true }}>
      <mesh scale={[Math.max(0.04, health / maxHp), 1, 1]}><boxGeometry args={[1.8, 0.09, 0.08]} /><meshBasicMaterial color="#fa5964" /></mesh>
    </group>}
    {damagePops.map((pop,index)=><Html key={pop.id} position={[0, (kind === "fly" ? 2.25 : 5.15)+index*.14,0]} center zIndexRange={[40,0]} style={{pointerEvents:"none"}}><div className={`boss-damage-pop boss-damage-pop--${pop.part}`}>{pop.part==="head"&&<span>HEADSHOT</span>}<strong>{pop.amount}</strong></div></Html>)}
    {!dead && <ScanHalo id={id} size={kind === "fly" ? 1.3 : 2.8} />}
  </group>;
}
