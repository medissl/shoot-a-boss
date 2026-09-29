import { useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, Crosshair, Volume2, Sparkles } from 'lucide-react';
import { WEAPONS, type WeaponId } from '../game/config';
import { SKIN_THEMES, getSkin, type SkinId, type SkinRarity } from '../game/skins';
import { playSkinSound } from '../game/skinSound';
import { useGameStore } from '../game/store';
import { SkinScopePreview, SkinWeaponPreview } from './WeaponView';
const weapons:WeaponId[]=['rifle','shotgun','sniper','knife'];
type Filter='all'|SkinRarity;
export function Arsenal({onBack}:{onBack:()=>void}){
 const {skins,equippedSkins,equipSkin}=useGameStore();
 const [weapon,setWeapon]=useState<WeaponId>('rifle');
 const [selected,setSelected]=useState<SkinId>(equippedSkins.rifle);
 const [filter,setFilter]=useState<Filter>('all');
 const [firing,setFiring]=useState(false);
 const [sight,setSight]=useState(false);
 const timer=useRef<number|null>(null);
 const audio=useRef<AudioContext|null>(null);
 const skin=getSkin(selected),owned=skins[weapon].includes(selected);
 const show=(id:WeaponId)=>{setWeapon(id);setSelected(equippedSkins[id]);setSight(false)};
 const sample=(action:'fire'|'equip')=>{if(selected==='default')return;try{audio.current??=new AudioContext();void audio.current.resume();playSkinSound(audio.current,selected,action,.82,weapon)}catch{/* silent browsers still show VFX */}};
 const fire=()=>{setFiring(false);if(timer.current)window.clearTimeout(timer.current);window.requestAnimationFrame(()=>setFiring(true));timer.current=window.setTimeout(()=>setFiring(false),220);sample('fire')};
 const shown=SKIN_THEMES.filter(item=>filter==='all'||item.rarity===filter);
 return <main className="arsenal-scene" style={{'--arsenal-color':skin?.color??'#2548b8','--arsenal-accent':skin?.accent??'#2548b8'} as CSSProperties}>
  <header className="arsenal-header"><button onClick={onBack}><ArrowLeft size={17}/> BACK</button><div><small>DREAM LOADOUT // WEAPON WORKSHOP</small><h1>THE ARSENAL</h1></div><span>PREVIEW ALL THEMES</span></header>
  <nav className="arsenal-weapons" aria-label="Weapon"><>{weapons.map(id=><button key={id} className={weapon===id?'active':''} onClick={()=>show(id)}><small>{id==='knife'?'04':id==='rifle'?'01':id==='shotgun'?'02':'03'}</small>{WEAPONS[id].label.toUpperCase()} <b>{getSkin(equippedSkins[id])?.name??'Default'}</b></button>)}</></nav>
  <div className="arsenal-body">
   <section className="arsenal-stage"><div className="arsenal-stage__top"><span>{weapon.toUpperCase()} / {selected==='default'?'ORIGINAL':skin?.rarity.toUpperCase()}</span><span>{selected==='default'?'BASE MODEL':skin?.tag}</span></div><div className={`arsenal-display ${sight?'is-sight':''}`}>{sight&&weapon!=='knife'?<SkinScopePreview weapon={weapon} skin={selected}/>:<SkinWeaponPreview weapon={weapon} skin={selected} firing={firing}/>}</div><div className="arsenal-stage__identity"><span className={`arsenal-rarity arsenal-rarity--${skin?.rarity??'default'}`}>{skin?.rarity??'default'}</span><h2>{skin?.name??'Original Sketch'}</h2><p>{skin?.tag??'The original drawn weapon.'}</p></div><div className="arsenal-actions"><button onClick={fire}><Sparkles size={16}/> TEST FIRE {weapon==='knife'?'SLASH':''}</button>{weapon!=='knife'&&<button onClick={()=>setSight(!sight)}><Crosshair size={16}/> {sight?'VIEW WEAPON':'VIEW SIGHT'}</button>}<button onClick={()=>sample('equip')}><Volume2 size={16}/> SOUND</button><button className="arsenal-equip" disabled={!owned||equippedSkins[weapon]===selected} onClick={()=>{equipSkin(weapon,selected);sample('equip')}}>{equippedSkins[weapon]===selected?'✓ EQUIPPED':owned?'EQUIP':'LOCKED'}</button></div></section>
   <section className="arsenal-collection"><div className="arsenal-collection__heading"><div><small>COLLECTION / {weapon.toUpperCase()}</small><h2>CHOOSE A BUILD</h2></div><span>{skins[weapon].length-1} / 22</span></div><div className="arsenal-filters" role="group" aria-label="Rarity filter">{(['all','rare','epic','legendary'] as Filter[]).map(id=><button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{id.toUpperCase()} <small>{id==='all'?22:SKIN_THEMES.filter(t=>t.rarity===id).length}</small></button>)}</div><div className="arsenal-grid"><button className={`arsenal-card ${selected==='default'?'selected':''}`} onClick={()=>setSelected('default')}><span>00 / ORIGINAL</span><SkinWeaponPreview weapon={weapon} skin="default"/><b>Original Sketch</b><small>DEFAULT</small></button>{shown.map((item)=><button key={item.id} className={`arsenal-card arsenal-card--${item.rarity} ${selected===item.id?'selected':''}`} style={{'--card-color':item.color} as CSSProperties} onClick={()=>setSelected(item.id)}><span>{String(SKIN_THEMES.indexOf(item)+1).padStart(2,'0')} / {item.rarity.toUpperCase()}</span><SkinWeaponPreview weapon={weapon} skin={item.id}/><b>{item.name}</b><small>{skins[weapon].includes(item.id)?equippedSkins[weapon]===item.id?'✓ EQUIPPED':'READY TO EQUIP':'LOCKED'}</small></button>)}</div></section>
  </div>
 </main>;
}
