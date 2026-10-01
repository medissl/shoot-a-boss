import { useState } from "react";
import { ArrowLeft, Flame, Gem, Snowflake, Droplets, Zap, Swords, Timer, Sparkles } from "lucide-react";
import { MAGIC_TYPES, xpToNextLevel, useGameStore, type MagicType } from "../game/store";
import { ELEMENT_DESIGN, isMilestone, magicCost, magicNodeDetail, magicStats, type Branch } from "../game/magicTree";

const icons = { fire: Flame, crystal: Gem, ice: Snowflake, water: Droplets, thunder: Zap };
const branchIcons = { force:Swords, tempo:Timer, craft:Sparkles };
const spellNames:Record<MagicType,string> = {fire:"INFERNO ORB",crystal:"CRYSTAL PRISON",ice:"GLACIAL ERUPTION",water:"RAIN CLOUD",thunder:"JUDGEMENT BOLT"};
export function SkillTree({onBack}:{onBack:()=>void}) {
  const {playerLevel,xp,skillPoints,magic,magicChoices,selectedMagic,unlockMagic,selectMagic}=useGameStore();
  const [kind,setKind]=useState<MagicType>(selectedMagic??"fire");
  const [branch,setBranch]=useState<Branch>("force");
  const [history,setHistory]=useState(false);
  const Icon=icons[kind];const rank=magic[kind];const tier=Math.min(20,rank+1);
  const milestone=isMilestone(tier),cost=magicCost(tier);
  const choices={...magicChoices,[kind]:{...magicChoices[kind],[tier]:branch}};
  const preview=magicStats(kind,tier,choices);
  const current=magicStats(kind,Math.max(1,rank),magicChoices);
  return <main className={`skill-scene skill-scene--focused skill-scene--${kind}`}>
    <header><button onClick={onBack}><ArrowLeft size={18}/> BACK</button><div><span>THE DOODLE GRIMOIRE</span><h1>MAGIC</h1><p>LEVEL {playerLevel} · {xp}/{xpToNextLevel(playerLevel)} XP</p></div><strong className="magic-sp">✦ {skillPoints} SP</strong></header>
    <nav className="magic-element-picker" data-tutorial="magic-element-picker" aria-label="Choose element">{MAGIC_TYPES.map(element=>{const ElementIcon=icons[element];return <button key={element} className={kind===element?"is-active":""} onClick={()=>{setKind(element);setBranch("force");setHistory(false);}}><ElementIcon size={24}/><b>{element.toUpperCase()}</b><small>T{magic[element]} {selectedMagic===element?"✓":magic[element]?"":"LOCKED"}</small></button>;})}</nav>
    <section className="magic-hero"><div className={`magic-preview magic-preview--${kind}`}><Icon size={64}/><span aria-hidden="true">✦</span></div><div><small>{rank?`TIER ${rank}`:"NOT AWAKENED"}</small><h2>{kind.toUpperCase()} · {spellNames[kind]}</h2><p>{ELEMENT_DESIGN[kind].identity}</p><div className="magic-hero-stats"><span>IMPACT {current.damage}</span><span>COOLDOWN {current.cooldown}S</span></div></div><button data-tutorial="magic-equip" disabled={!rank||selectedMagic===kind} onClick={()=>selectMagic(kind)}>{selectedMagic===kind?"✓ EQUIPPED":rank?`EQUIP ${kind.toUpperCase()}`:"LOCKED"}</button></section>
    <section className="magic-path" data-tutorial="magic-next-tier"><div className="magic-path-head"><small>NEXT UPGRADE</small><h3>{rank>=20?"PATH COMPLETE":tier===1?"AWAKEN THE SPELL":`TIER ${tier} · ${milestone?"SIGNATURE SPELL":"CHOOSE A PATH"}`}</h3><span>{rank>=20?"MAXED":`${cost} SP`}</span></div>
      {rank<20&&<><div className="magic-path-options">{(tier===1||milestone?["force"] as Branch[]:["force","tempo","craft"] as Branch[]).map(path=>{const PathIcon=tier===1||milestone?Icon:branchIcons[path];return <button key={path} className={branch===path?"is-selected":""} aria-pressed={branch===path} onClick={()=>setBranch(path)}><PathIcon size={23}/><b>{tier===1?"AWAKEN":milestone?spellNames[kind]:path.toUpperCase()}</b><small>{magicNodeDetail(kind,tier,path)}</small></button>;})}</div><div className="magic-path-detail"><b>TIER {tier} · {milestone?"SIGNATURE":tier===1?"AWAKEN":branch.toUpperCase()}</b><span>{magicNodeDetail(kind,tier,branch)}</span><small>IMPACT {preview.damage} · COOLDOWN {preview.cooldown}S</small></div></>}
      <div className="magic-path-chapters">{[1,6,11,16].map(start=>{const end=start+4;const active=rank>=start-1&&rank<end;return <button key={start} className={active?"is-active":""} onClick={()=>setHistory(!history)}>{rank>=end?"✓ ":rank<start-1?"🔒 ":"→ "}TIERS {start}–{end}{rank>=end?" COMPLETE":rank<start-1?" LOCKED":" CURRENT"}</button>;})}</div>
      {history&&<div className="magic-history">{Array.from({length:rank},(_,i)=><span key={i}>T{i+1} · {isMilestone(i+1)?"SIGNATURE":i===0?"AWAKEN":magicChoices[kind][i+1]?.toUpperCase()??"FORCE"}</span>)}</div>}
    </section>
    {rank<20&&<footer className="magic-learn-bar" data-tutorial="magic-learn-button"><div><b>TIER {tier} · {tier===1?"AWAKEN":milestone?"SIGNATURE":branch.toUpperCase()}</b><span>{magicNodeDetail(kind,tier,branch)}</span></div><button disabled={skillPoints<cost} onClick={()=>unlockMagic(kind,branch)}>{skillPoints>=cost?`LEARN · ${cost} SP`:`NEED ${cost-skillPoints} SP`}</button></footer>}
  </main>;
}
