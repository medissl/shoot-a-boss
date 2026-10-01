import { useState } from "react";
import { GEAR, satchelBonus, type GearId, useGameStore } from "../game/store";
import { getUpgradeCard, getUpgradeStats, type UpgradeId } from "../game/progression";

export function EquipmentHub({ openShop }: { openShop?: () => void }) {
  const state = useGameStore();
  const [slot,setSlot] = useState<number|null>(null);
  const cards = (Object.entries(state.upgrades) as [UpgradeId,number][]).filter(([,count])=>count>0);
  const owned = GEAR.filter(item=>state.gear[item.id]>0);
  const equipped = state.equippedGear;
  const stats = getUpgradeStats(state.upgrades);
  const rank = (id:GearId)=>equipped.includes(id)?state.gear[id]:0;
  const equipIntoSlot = (id:GearId) => {
    if(slot!==null && equipped[slot])state.toggleGear(equipped[slot]);
    if(!useGameStore.getState().equippedGear.includes(id))state.toggleGear(id);
    setSlot(null);
  };
  return <section className="loadout-page loadout-page--focused">
    <div className="loadout-hero"><div className="equipment-avatar" aria-label="Player stick figure"><div className="equipment-head">PLAYER</div><div className="equipment-body"/><div className="equipment-arm left"/><div className="equipment-arm right"/><div className="equipment-leg left"/><div className="equipment-leg right"/></div>
      <div className="loadout-build"><small>ACTIVE DREAM // STAGE {state.currentLevel}</small><h2>YOUR LOADOUT</h2>
        <div className="loadout-slots" data-tutorial="loadout-slots">{Array.from({length:4},(_,i)=>{
          const item=GEAR.find(entry=>entry.id===equipped[i]);
          return <button key={i} onClick={()=>setSlot(slot===i?null:i)} className={slot===i?"is-selected":""}>{item?<><b>{item.name}</b><small>RANK {state.gear[item.id]}</small></>:<b>+ EMPTY SLOT</b>}</button>;
        })}</div>
      </div>
      <div className="loadout-stats"><span>♥ {stats.maxHp+rank("vest")*8} HP</span><span>↝ +{(rank("boots")*2.5).toFixed(1)}% MOVE</span><span>◌ {stats.grenadeCapacity+satchelBonus(rank("satchel"))} BOMBS</span><span>✧ {state.selectedMagic?.toUpperCase()??"NO SPELL"} T{state.selectedMagic?state.magic[state.selectedMagic]:0}</span></div>
    </div>
    {slot!==null&&<div className="loadout-slot-picker"><b>{equipped[slot]?"REPLACE OR REMOVE":"CHOOSE OWNED GEAR"}</b>
      {owned.filter(item=>!equipped.includes(item.id)).map(item=><button key={item.id} onClick={()=>equipIntoSlot(item.id)}>{item.name} · R{state.gear[item.id]}</button>)}
      {equipped[slot]&&<button onClick={()=>{state.toggleGear(equipped[slot]);setSlot(null);}}>REMOVE</button>}
      {!owned.some(item=>!equipped.includes(item.id))&&<span>All owned gear is equipped.</span>}
    </div>}
    <h3>OWNED GEAR <small>{equipped.length}/4 EQUIPPED</small></h3>
    <div className="loadout-gear">{owned.map(item=><button key={item.id} className={equipped.includes(item.id)?"is-equipped":""} onClick={()=>state.toggleGear(item.id)} disabled={!equipped.includes(item.id)&&equipped.length>=4}>
      <b>{item.name} · RANK {state.gear[item.id]}</b><span>{item.detail}</span><strong>{equipped.includes(item.id)?"✓ EQUIPPED":"EQUIP"}</strong>
    </button>)}{!owned.length&&<p>No gear yet. Earn coins and visit the shop.</p>}</div>
    <button className="loadout-shop-link" onClick={openShop}>+ GET MORE GEAR →</button>
    <div className="loadout-run-summary"><h3>RUN BUILD</h3><span>CARDS <b>{cards.reduce((sum,[,count])=>sum+count,0)}</b></span><span>EVOLUTIONS <b>{state.evolutions.length}</b></span><span>{state.weapon.toUpperCase()} · {state.selectedMagic?.toUpperCase()??"NO MAGIC"}</span><div>{cards.slice(0,5).map(([id,count])=><small key={id} title={getUpgradeCard(id).name}>{getUpgradeCard(id).glyph} ×{count}</small>)}</div></div>
  </section>;
}
