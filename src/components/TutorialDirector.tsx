import { useEffect, useState } from "react";
import { useGameStore, type TutorialId } from "../game/store";
import { setFullscreenPreference } from "../game/fullscreen";

type Lesson={title:string;body:string};
const lessons:Record<TutorialId,Lesson>={
  controls:{title:"START YOUR DREAM",body:"WASD move · LMB fire · RMB aim · R reload · 1–4 weapons."},
  xp:{title:"PLAYER XP",body:"Clear a deadline to earn XP."},
  levelUp:{title:"LEVEL UP",body:"Earn Skill Points as you level up."},
  skillPoint:{title:"✦ SKILL POINTS",body:"Spend points on Magic."},
  magic:{title:"MAGIC",body:"Each spell plays differently. Press F to cast."},
  magicAwakened:{title:"MAGIC AWAKENED",body:"Equip a spell, then press F in combat."},
  cards:{title:"DREAM CARDS",body:"Choose a Card after each stage. Combos can evolve."},
  coins:{title:"COINS",body:"Spend stage rewards on Gear, Hearts, and Crates."},
  anchor:{title:"DREAM ANCHOR",body:"Your run resumes here after a collapse."},
  gear:{title:"PERMANENT GEAR",body:"Buy Gear once, then equip up to four pieces."},
  shop:{title:"THE SHOP",body:"Gear grants power. Skin Crates are cosmetic."},
  crates:{title:"SKIN CRATES",body:"A crate unlocks a cosmetic theme for one weapon."},
  hearts:{title:"ONE HEART LOST",body:"At zero Hearts, return to your latest Anchor."},
  scan:{title:"FIND YOUR TARGET",body:"Q marks the nearest living enemies."},
  evolution:{title:"CARD COMBO",body:"Choose an Evolution for your run."},
};
type GuideStep={target:string;title:string;body:string;tab?:string};
const guides:Partial<Record<TutorialId,GuideStep[]>>={
  magic:[
    {target:"desk-magic-tab",title:"SPEND SKILL POINTS HERE",body:"Open Magic.",tab:"magic"},
    {target:"magic-element-picker",title:"CHOOSE AN ELEMENT",body:"Each spell plays differently.",tab:"magic"},
    {target:"magic-next-tier",title:"AWAKEN OR UPGRADE",body:"Pick the next tier.",tab:"magic"},
    {target:"magic-learn-button",title:"LEARN THE SPELL",body:"Spend Skill Points here.",tab:"magic"},
    {target:"magic-equip",title:"EQUIP IT",body:"Use it in the next stage.",tab:"magic"},
  ],
  gear:[
    {target:"desk-shop-tab",title:"YOU CAN AFFORD GEAR",body:"Open the Shop.",tab:"shop"},
    {target:"shop-gear-card",title:"GEAR IS PERMANENT",body:"Choose a piece.",tab:"shop"},
    {target:"shop-buy-equip",title:"BUY & EQUIP",body:"Use it immediately.",tab:"shop"},
  ],
  crates:[
    {target:"desk-shop-tab",title:"SKIN CRATES",body:"Open the Shop.",tab:"crates"},
    {target:"crate-tab",title:"CHOOSE A CRATE",body:"Select a weapon.",tab:"crates"},
  ],
};
let fullscreenPromptShown=false;
export function TutorialDirector(){
  const active=useGameStore(s=>s.activeTutorial),screen=useGameStore(s=>s.screen),complete=useGameStore(s=>s.completeTutorial);
  const openMagic=useGameStore(s=>s.openMagicFromResult);
  const [fullscreenPrompt,setFullscreenPrompt]=useState(()=>!document.fullscreenElement&&!fullscreenPromptShown);
  const [stepState,setStepState]=useState<{id:TutorialId|null;index:number}>({id:null,index:0});
  const step=stepState.id===active?stepState.index:0;
  const [rect,setRect]=useState<DOMRect|null>(null);
  useEffect(()=>{if(fullscreenPrompt)fullscreenPromptShown=true;},[fullscreenPrompt]);
  const guide=active?guides[active]:undefined;
  useEffect(()=>{
    if(!active||!guide||screen==="playing"||screen==="paused"||fullscreenPrompt)return;
    if(active==="magic"&&screen!=="menu"){openMagic();return;}
    if(screen==="menu")window.dispatchEvent(new CustomEvent("tutorial-desk-tab",{detail:guide[step]?.tab??"shop"}));
  },[active,guide,screen,step,fullscreenPrompt,openMagic]);
  useEffect(()=>{
    if(!guide||!active||screen!=="menu"||fullscreenPrompt)return;
    const update=()=>{
      const target=document.querySelector<HTMLElement>(`[data-tutorial="${guide[step]?.target}"]`);
      if(!target){setRect(null);return;}
      const bounds=target.getBoundingClientRect();
      if(bounds.top<0||bounds.bottom>innerHeight)target.scrollIntoView({behavior:"smooth",block:"center"});
      setRect(target.getBoundingClientRect());
    };
    update();const observer=new MutationObserver(update);observer.observe(document.body,{subtree:true,childList:true});
    window.addEventListener("resize",update);window.addEventListener("scroll",update,true);
    return()=>{observer.disconnect();window.removeEventListener("resize",update);window.removeEventListener("scroll",update,true);};
  },[guide,active,step,screen,fullscreenPrompt]);
  useEffect(()=>{
    if(!active)return;
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.stopPropagation();complete();}};
    window.addEventListener("keydown",escape,true);
    return()=>window.removeEventListener("keydown",escape,true);
  },[active,complete]);
  if(fullscreenPrompt&&screen!=="playing"&&screen!=="paused")return <div className="tutorial-shade"><section className="tutorial-card"><small>SESSION SUGGESTION</small><h2>BEST PLAYED FULLSCREEN</h2><p>Give your first-person dream more room.</p><div><button onClick={()=>{void document.documentElement.requestFullscreen().then(()=>setFullscreenPreference(true)).catch(()=>undefined);setFullscreenPrompt(false);}}>GO FULLSCREEN</button><button onClick={()=>setFullscreenPrompt(false)}>NOT NOW</button></div></section></div>;
  if(!active||screen==="playing"||screen==="paused")return null;
  const lesson=lessons[active];
  if(guide&&screen==="menu"){
    const current=guide[Math.min(step,guide.length-1)];
    const width=Math.min(310,innerWidth-24),left=rect?Math.min(innerWidth-width-12,Math.max(12,rect.left+rect.width/2-width/2)):innerWidth/2-width/2;
    const top=rect?rect.bottom+170<innerHeight?rect.bottom+16:Math.max(12,rect.top-155):innerHeight/2-70;
    return <div className="guide-overlay" role="dialog" aria-label={current.title}>
      {rect&&<div className="guide-ring" style={{left:rect.left-6,top:rect.top-6,width:rect.width+12,height:rect.height+12}}/>}
      <section className="guide-card" style={{left,top,width}}><small>STEP {step+1}/{guide.length}</small><h2>{current.title}</h2><p>{current.body}</p><div><button onClick={()=>{if(step+1<guide.length)setStepState({id:active,index:step+1});else complete();}}>{step+1<guide.length?"NEXT":"DONE"} →</button><button onClick={complete}>SKIP</button></div></section>
    </div>;
  }
  return <div className="tutorial-shade"><section className="tutorial-card" role="dialog" aria-modal="true" aria-label={lesson.title}><small>NEW DISCOVERY</small><h2>{lesson.title}</h2><p>{lesson.body}</p><div>{guide&&<button onClick={()=>{if(active==="magic")openMagic();else window.dispatchEvent(new CustomEvent("tutorial-desk-tab",{detail:active==="crates"?"crates":"shop"}));}}>SHOW ME →</button>}<button onClick={complete}>{guide?"LATER":"CONTINUE"} →</button></div></section></div>;
}
