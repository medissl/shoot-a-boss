import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import * as THREE from "three";
import { enemyHpScale } from "../game/levels";
import { BOSS_MAX_HP, PAPER_MONSTER_MAX_HP, PEN_MONSTER_MAX_HP } from "../game/config";
import { getEnemyTuning } from "../game/levels";
import { drawBoss } from "./Dummy";

type Kind = "boss" | "ranged" | "paper" | "pen" | "fly" | "statue";
const entries: { kind: Kind; name: string; slogan: string; description: string; attack: string; hp: number; baseDamage: number }[] = [
  { kind: "boss", name: "Mr. Boss", slogan: "Your work is due yesterday.", description: "The office boss has left the desk to personally collect your soul. He spots you, closes the distance, and throws heavy punches. Keep moving while you aim for that enormous head.", attack: "Close-range punch", hp: BOSS_MAX_HP, baseDamage: 10 },
  { kind: "ranged", name: "The Feedback Manager", slogan: "Just one more revision.", description: "The same boss, but armed with either a handgun or a bow. A red line shows the shot he is lining up. Break his line of sight or sidestep before it fires.", attack: "Telegraphed shot", hp: BOSS_MAX_HP, baseDamage: 12 },
  { kind: "paper", name: "Paper Cutlet", slogan: "Small form. Big attitude.", description: "A living sheet of paperwork that slips through narrow hiding places. It chases at ground level and attacks up close. Watch your feet when a pack gathers.", attack: "Close-range cut", hp: PAPER_MONSTER_MAX_HP, baseDamage: 10 },
  { kind: "pen", name: "The Inktern", slogan: "Five shots, then a coffee break.", description: "This little pen fires five ink shots in a burst. Each shot gives you a red warning line. It needs time to refill, so rush it after the fifth shot.", attack: "Five ink projectiles", hp: PEN_MONSTER_MAX_HP, baseDamage: 8 },
  { kind: "fly", name: "Airmail Menace", slogan: "Special delivery to your face.", description: "A flying courier that cruises above the arena. It dives to face level for one hard bite, then climbs away to recover before attacking again. Track it overhead.", attack: "Single diving strike", hp: 120, baseDamage: 11 },
  { kind: "statue", name: "Burn the Deadline Statue", slogan: "Your deadline follows you.", description: "A monument with long sight. A red line from its head warns you for five seconds before its laser strikes a fixed area for five seconds. Break line of sight or leave the marked circle.", attack: "Targeted red laser", hp: 300, baseDamage: 8 },
];

function BossImage({ ranged }: { ranged: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 560; canvas.height = 660;
    drawBoss(canvas, ranged ? "aim" : "idle", false, ranged ? "ranged" : "melee", ranged ? "handgun" : "bow");
    const image = new THREE.CanvasTexture(canvas);
    image.colorSpace = THREE.SRGBColorSpace;
    return image;
  }, [ranged]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[0, 0.15, 0]}><planeGeometry args={[3.35, 3.85]} /><meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} /></mesh>;
}

function Model({ kind }: { kind: Kind }) {
  if (kind === "boss" || kind === "ranged") return <BossImage ranged={kind === "ranged"} />;
  return <group position={[0, kind === "fly" ? 0 : -0.35, 0]}>
    {kind === "paper" && <>
      <mesh><planeGeometry args={[2.2, 2.85]} /><meshBasicMaterial color="#2548b8" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0, 0.02]}><planeGeometry args={[2.05, 2.7]} /><meshBasicMaterial color="#fbfaf4" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0.7, 1.12, 0.04]} rotation={[0, 0, -0.2]}><planeGeometry args={[0.6, 0.46]} /><meshBasicMaterial color="#dbe3ff" side={THREE.DoubleSide} /></mesh>
      {[-0.45, 0.45].map((x) => <mesh key={x} position={[x, 0.25, 0.06]}><circleGeometry args={[0.12, 12]} /><meshBasicMaterial color="#2548b8" /></mesh>)}
      <mesh position={[0, -0.25, 0.06]}><boxGeometry args={[0.75, 0.09, 0.02]} /><meshBasicMaterial color="#2548b8" /></mesh>
    </>}
    {kind === "pen" && <>
      <mesh><planeGeometry args={[0.95, 3.1]} /><meshBasicMaterial color="#2548b8" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0, 0.015]}><planeGeometry args={[0.77, 2.9]} /><meshBasicMaterial color="#f7f0d7" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1.3, 0.03]}><planeGeometry args={[0.79, 0.27]} /><meshBasicMaterial color="#ed5f61" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -1.57, 0.04]} rotation={[0, 0, Math.PI]}><circleGeometry args={[0.47, 3]} /><meshBasicMaterial color="#293b8b" side={THREE.DoubleSide} /></mesh>
      {[-0.19, 0.19].map((x) => <mesh key={x} position={[x, 0.2, 0.05]}><circleGeometry args={[0.07, 12]} /><meshBasicMaterial color="#293b8b" /></mesh>)}
    </>}
    {kind === "fly" && <>
      <mesh><icosahedronGeometry args={[1.12, 1]} /><meshStandardMaterial color="#8558dc" emissive="#402379" emissiveIntensity={0.35} /></mesh>
      <mesh position={[0, 0.18, 0.88]}><sphereGeometry args={[0.48, 12, 8]} /><meshBasicMaterial color="#f7eaf6" /></mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 1.25, 0, 0]} rotation={[0, 0, side * 0.4]}><coneGeometry args={[0.7, 2.1, 3]} /><meshStandardMaterial color="#c69cf1" side={THREE.DoubleSide} /></mesh>)}
      {[-0.38, 0.38].map((x) => <mesh key={x} position={[x, -1.35, 0.42]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.28, 0.86, 4]} /><meshBasicMaterial color="#e8eefc" /></mesh>)}
    </>}
    {kind === "statue" && <>
      <mesh position={[0, -1.25, 0]}><cylinderGeometry args={[1, 1.18, 1.1, 7]} /><meshStandardMaterial color="#737884" /></mesh>
      <mesh position={[0, 0.15, 0]}><boxGeometry args={[2.1, 1.85, 1.55]} /><meshStandardMaterial color="#8e94aa" /></mesh>
      <mesh position={[0, 1.55, 0]}><dodecahedronGeometry args={[0.82, 0]} /><meshBasicMaterial color="#d1cad1" /></mesh>
      <mesh position={[0, 1.6, 0.67]}><boxGeometry args={[0.75, 0.15, 0.22]} /><meshBasicMaterial color="#ed5f61" /></mesh>
    </>}
  </group>;
}

function EnemyPortrait({ kind }: { kind: Kind }) {
  return <div className="encyclopedia-model"><Canvas frameloop="demand" dpr={[1, 1.4]} camera={{ position: [0, 0, 8.8], fov: 43 }}><ambientLight intensity={2} /><directionalLight position={[4, 5, 6]} intensity={2} /><Model kind={kind} /></Canvas></div>;
}

export function MonsterEncyclopedia({ onBack }: { onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [level, setLevel] = useState(1);
  const entry = entries[index];
  const tuning = getEnemyTuning(level);
  const hp = Math.round(entry.hp * enemyHpScale(level));
  const damage = Math.round(entry.baseDamage * tuning.damage);
  return <main className="encyclopedia-scene">
    <div className="encyclopedia-paper">
      <header><button type="button" onClick={onBack}><ArrowLeft size={17} /> BACK</button><span>SHOOT A BOSS // FIELD NOTES</span><b>BESTIARY 0{index + 1} / 0{entries.length}</b></header>
      <div className="encyclopedia-body">
        <section className="encyclopedia-copy">
          <p className="main-menu-kicker">ENEMY PROFILE · {String(index + 1).padStart(2, "0")}</p>
          <h1>{entry.name}</h1>
          <blockquote>“{entry.slogan}”</blockquote>
          <p>{entry.description}</p>
          <label className="encyclopedia-level">SEE STATS AT LEVEL <strong>{level}</strong><input type="range" min="1" max="10" value={level} onChange={(event) => setLevel(Number(event.target.value))} /></label>
          <div className="encyclopedia-stats"><div><small>HEALTH</small><strong>{hp} HP</strong><span>+8.5% per level</span></div><div><small>ATTACK</small><strong>{entry.attack}</strong><span>{damage} damage at level {level}{entry.kind === "ranged" ? " (handgun)" : ""}</span></div></div>
          <div className="encyclopedia-hitboxes"><small>WHERE TO AIM</small><span><b>HEAD</b> ×1.5</span><span><b>BODY</b> ×1</span><span><b>LEGS</b> ×0.3</span></div>
          <p className="encyclopedia-footnote">Speed, sight and attack power increase with the stage. NG+ keeps scaling beyond level 10.</p>
        </section>
        <section className="encyclopedia-portrait" aria-label={`${entry.name} in-game model`}><span>FIG. {String(index + 1).padStart(2, "0")} // FIELD SKETCH</span><EnemyPortrait kind={entry.kind} /><strong>{entry.name.toUpperCase()}</strong></section>
      </div>
      <nav className="encyclopedia-nav" aria-label="Choose monster"><button type="button" onClick={() => setIndex((index + entries.length - 1) % entries.length)} aria-label="Previous monster"><ChevronLeft size={20} /></button>{entries.map((monster, i) => <button type="button" key={monster.kind} className={i === index ? "is-active" : ""} onClick={() => setIndex(i)}>{monster.name}</button>)}<button type="button" onClick={() => setIndex((index + 1) % entries.length)} aria-label="Next monster"><ChevronRight size={20} /></button></nav>
    </div>
  </main>;
}
