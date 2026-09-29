import { useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, Crosshair, LockKeyhole, Volume2, Sparkles } from 'lucide-react';
import { WEAPONS, type WeaponId } from '../game/config';
import { SKIN_THEMES, getSkin, type SkinId, type SkinRarity } from '../game/skins';
import { playSkinSound } from '../game/skinSound';
import { useGameStore } from '../game/store';
import { SkinScopePreview, SkinWeaponPreview } from './WeaponView';

const weapons:WeaponId[]=['rifle','shotgun','sniper','knife'];
type Filter='all'|SkinRarity;
type PreviewAction='fire'|'equip';

const previewAudio:Record<WeaponId,Record<PreviewAction,string>>={
 rifle:{fire:'/audio/RifleShoot1Time.mp3',equip:'/audio/RifleCocking.mp3'},
 shotgun:{fire:'/audio/ShotgunShoot.mp3',equip:'/audio/ShotgunCocking.mp3'},
 sniper:{fire:'/audio/SniperShoot.mp3',equip:'/audio/SniperCocking.mp3'},
 knife:{fire:'/audio/KnifeStab.mp3',equip:'/audio/TakeOutKnife.mp3'},
};

function LockedWeapon({weapon}:{weapon:WeaponId}){
 return <div className="arsenal-locked-preview" aria-label="Locked skin preview">
  <div className="arsenal-locked-model"><SkinWeaponPreview weapon={weapon} skin="default"/></div>
  <span className="arsenal-locked-badge"><LockKeyhole size={28}/> LOCKED</span>
 </div>;
}

export function Arsenal({onBack}:{onBack:()=>void}){
 const {skins,equippedSkins,equipSkin,sfxVolume}=useGameStore();
 const [weapon,setWeapon]=useState<WeaponId>('rifle');
 const [selected,setSelected]=useState<SkinId>(equippedSkins.rifle);
 const [filter,setFilter]=useState<Filter>('all');
 const [firing,setFiring]=useState(false);
 const [sight,setSight]=useState(false);
 const timer=useRef<number|null>(null);
 const audio=useRef<AudioContext|null>(null);
 const skin=getSkin(selected);
 const owned=selected==='default'||skins[weapon].includes(selected);
 const show=(id:WeaponId)=>{setWeapon(id);setSelected(equippedSkins[id]);setSight(false)};

 const sample=(action:PreviewAction)=>{
  if(!owned)return;
  const base=new Audio(previewAudio[weapon][action]);
  base.volume=Math.min(1,Math.max(0,sfxVolume*(action==='fire'?.82:.68)));
  void base.play().catch(()=>undefined);
  if(selected==='default')return;
  try{
   audio.current??=new AudioContext();
   void audio.current.resume();
   playSkinSound(audio.current,selected,action,.72*sfxVolume,weapon);
  }catch{/* preview still works with the recorded base sound */}
 };
 const fire=()=>{
  if(!owned)return;
  setFiring(false);
  if(timer.current)window.clearTimeout(timer.current);
  window.requestAnimationFrame(()=>setFiring(true));
  timer.current=window.setTimeout(()=>setFiring(false),220);
  sample('fire');
 };
 const shown=SKIN_THEMES.filter(item=>filter==='all'||item.rarity===filter);
 const arsenalColor=owned?(skin?.color??'#2548b8'):'#2548b8';
 const arsenalAccent=owned?(skin?.accent??'#2548b8'):'#2548b8';

 return <main className="arsenal-scene" style={{'--arsenal-color':arsenalColor,'--arsenal-accent':arsenalAccent} as CSSProperties}>
  <header className="arsenal-header"><button onClick={onBack}><ArrowLeft size={17}/> BACK</button><div><small>DREAM LOADOUT // WEAPON WORKSHOP</small><h1>THE ARSENAL</h1></div><span>UNLOCK THEMES IN CRATES</span></header>
  <nav className="arsenal-weapons" aria-label="Weapon">{weapons.map(id=><button key={id} className={weapon===id?'active':''} onClick={()=>show(id)}><small>{id==='knife'?'04':id==='rifle'?'01':id==='shotgun'?'02':'03'}</small>{WEAPONS[id].label.toUpperCase()} <b>{getSkin(equippedSkins[id])?.name??'Default'}</b></button>)}</nav>
  <div className="arsenal-body">
   <section className="arsenal-stage">
    <div className="arsenal-stage__top"><span>{weapon.toUpperCase()} / {selected==='default'?'ORIGINAL':skin?.rarity.toUpperCase()}</span><span>{owned?(selected==='default'?'BASE MODEL':skin?.tag):'LOCKED THEME'}</span></div>
    <div className={`arsenal-display ${sight?'is-sight':''} ${owned?'':'is-locked'}`}>
     {!owned?<LockedWeapon weapon={weapon}/>:sight&&weapon!=='knife'?<SkinScopePreview weapon={weapon} skin={selected}/>:<SkinWeaponPreview weapon={weapon} skin={selected} firing={firing}/>}
    </div>
    <div className="arsenal-stage__identity"><span className={`arsenal-rarity arsenal-rarity--${skin?.rarity??'default'}`}>{skin?.rarity??'default'}</span><h2>{skin?.name??'Original Sketch'}</h2><p>{owned?(skin?.tag??'The original drawn weapon.'):'Unlock this theme from Skin Crates to reveal its model, effects, scope and sound.'}</p></div>
    <div className="arsenal-actions">
     <button onClick={fire} disabled={!owned}><Sparkles size={16}/> TEST FIRE {weapon==='knife'?'SLASH':''}</button>
     {weapon!=='knife'&&<button onClick={()=>setSight(!sight)} disabled={!owned}><Crosshair size={16}/> {sight?'VIEW WEAPON':'VIEW SIGHT'}</button>}
     <button onClick={()=>sample('equip')} disabled={!owned}><Volume2 size={16}/> SOUND</button>
     <button className="arsenal-equip" disabled={!owned||equippedSkins[weapon]===selected} onClick={()=>{equipSkin(weapon,selected);sample('equip')}}>{equippedSkins[weapon]===selected?'✓ EQUIPPED':owned?'EQUIP':'🔒 LOCKED'}</button>
    </div>
   </section>
   <section className="arsenal-collection">
    <div className="arsenal-collection__heading"><div><small>COLLECTION / {weapon.toUpperCase()}</small><h2>CHOOSE A BUILD</h2></div><span>{skins[weapon].length-1} / 22</span></div>
    <div className="arsenal-filters" role="group" aria-label="Rarity filter">{(['all','rare','epic','legendary'] as Filter[]).map(id=><button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{id.toUpperCase()} <small>{id==='all'?22:SKIN_THEMES.filter(t=>t.rarity===id).length}</small></button>)}</div>
    <div className="arsenal-grid">
     <button className={`arsenal-card ${selected==='default'?'selected':''}`} onClick={()=>{setSelected('default');setSight(false)}}><span>00 / ORIGINAL</span><SkinWeaponPreview weapon={weapon} skin="default"/><b>Original Sketch</b><small>DEFAULT</small></button>
     {shown.map((item)=>{
      const itemOwned=skins[weapon].includes(item.id);
      return <button key={item.id} className={`arsenal-card arsenal-card--${item.rarity} ${selected===item.id?'selected':''} ${itemOwned?'':'is-locked'}`} style={{'--card-color':itemOwned?item.color:'#111725'} as CSSProperties} onClick={()=>{setSelected(item.id);setSight(false)}}>
       <span>{String(SKIN_THEMES.indexOf(item)+1).padStart(2,'0')} / {item.rarity.toUpperCase()}</span>
       {itemOwned?<SkinWeaponPreview weapon={weapon} skin={item.id}/>:<div className="arsenal-card-silhouette"><SkinWeaponPreview weapon={weapon} skin="default"/><LockKeyhole size={22}/></div>}
       <b>{item.name}</b>
       <small>{itemOwned?equippedSkins[weapon]===item.id?'✓ EQUIPPED':'READY TO EQUIP':'LOCKED'}</small>
      </button>;
     })}
    </div>
   </section>
  </div>
 </main>;
}
