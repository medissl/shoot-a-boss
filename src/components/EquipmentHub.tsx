import { ArrowLeft, ShoppingBag, Map, Sparkles } from "lucide-react";
import { useState } from "react";
import { WEAPONS, type WeaponId } from "../game/config";
import { MAGIC_TYPES, useGameStore } from "../game/store";
import { SKIN_THEMES, getSkin, skinColor, type SkinId } from "../game/skins";
import { getUpgradeCard, type UpgradeId } from "../game/progression";
import { SkinWeaponPreview } from "./WeaponView";

const weapons: WeaponId[] = ["rifle", "sniper", "shotgun", "knife"];
export function EquipmentHub({ onBack, onShop, onStages, onTree }: { onBack: () => void; onShop: () => void; onStages: () => void; onTree: () => void }) {
  const { skins, equippedSkins, equipSkin, magic, selectedMagic, selectMagic, upgrades, coins, playerLevel } = useGameStore();
  const [preview,setPreview]=useState<Record<WeaponId,SkinId>>(()=>({...equippedSkins}));
  return <main className="equipment-scene"><header><button onClick={onBack}><ArrowLeft size={18}/> MENU</button><div><small>DREAM LOADOUT // LEVEL {playerLevel}</small><h1>PLAYER EQUIPMENT</h1></div><b>◉ {coins} COINS</b></header>
    <div className="equipment-layout"><section><h2>YOUR WEAPONS</h2>{weapons.map((weapon) => {const selected=preview[weapon];const skin=getSkin(selected);const owned=skins[weapon].includes(selected);return <article key={weapon} className="skin-loadout"><h3>{WEAPONS[weapon].label} <small>{skins[weapon].length-1}/15 THEMES</small></h3><div className="skin-selection"><SkinWeaponPreview weapon={weapon} skin={selected}/><div><strong style={{color:skinColor(selected)}}>{skin?.name??"Original Sketch"}</strong><small>{skin?.rarity.toUpperCase()??"DEFAULT"} · {owned?"OWNED":"LOCKED"}</small><button type="button" disabled={!owned||equippedSkins[weapon]===selected} onClick={()=>equipSkin(weapon,selected)}>{equippedSkins[weapon]===selected?"✓ EQUIPPED":owned?"EQUIP THIS SKIN":"OPEN A CRATE TO UNLOCK"}</button></div></div><div className="skin-options" role="group" aria-label={`${weapon} cosmetic skins`}>{(["default",...SKIN_THEMES.map((item)=>item.id)] as SkinId[]).map((id)=><button type="button" key={id} className={`${selected===id?"is-previewed":""} ${equippedSkins[weapon]===id?"is-equipped":""} ${skins[weapon].includes(id)?"":"is-locked"} skin-option--${getSkin(id)?.rarity??"default"}`} onClick={()=>setPreview((current)=>({...current,[weapon]:id}))} style={{"--skin-preview":skinColor(id)} as React.CSSProperties}><i aria-hidden="true"/> {getSkin(id)?.name??"Default"}{skins[weapon].includes(id)?"":" · LOCKED"}</button>)}</div></article>;})}</section>
    <div className="equipment-avatar" aria-label="Player stick figure"><div className="equipment-head">PLAYER</div><div className="equipment-body"/><div className="equipment-arm left"/><div className="equipment-arm right"/><div className="equipment-leg left"/><div className="equipment-leg right"/></div>
    <section><h2>ELEMENTAL MAGIC</h2><p>Cast with F or the mobile magic button.</p>{MAGIC_TYPES.map((kind) => <button key={kind} className={selectedMagic === kind ? "is-equipped" : ""} disabled={!magic[kind]} onClick={() => selectMagic(kind)}>✦ {kind.toUpperCase()} {magic[kind] ? `RANK ${magic[kind]}` : "LOCKED"} {selectedMagic === kind ? "✓" : ""}</button>)}<button onClick={onTree}><Sparkles size={16}/> OPEN SKILL TREE</button></section></div>
    <div className="equipment-cards"><h2>YOUR CARDS</h2><div>{(Object.entries(upgrades) as [UpgradeId,number][]).filter(([,amount]) => amount > 0).map(([id,amount]) => <span key={id}>{getUpgradeCard(id).glyph} {getUpgradeCard(id).name} ×{amount}</span>)}{Object.values(upgrades).every((amount) => amount === 0) && <span>No cards yet. Clear a stage.</span>}</div></div>
    <nav><button onClick={onShop}><ShoppingBag size={16}/> SHOP</button><button onClick={onTree}><Sparkles size={16}/> SKILL TREE</button><button onClick={onStages}><Map size={16}/> GO TO STAGES</button></nav>
  </main>;
}
