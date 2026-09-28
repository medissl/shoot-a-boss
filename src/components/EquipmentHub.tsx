import { ArrowLeft, ShoppingBag, Map, Sparkles } from "lucide-react";
import { WEAPONS, type WeaponId } from "../game/config";
import { MAGIC_TYPES, SKIN_COLORS, type SkinColor, useGameStore } from "../game/store";
import { getUpgradeCard, type UpgradeId } from "../game/progression";

const weapons: WeaponId[] = ["rifle", "sniper", "shotgun", "knife"];
export function EquipmentHub({ onBack, onShop, onStages, onTree }: { onBack: () => void; onShop: () => void; onStages: () => void; onTree: () => void }) {
  const { skins, equippedSkins, equipSkin, magic, selectedMagic, selectMagic, upgrades, coins, playerLevel } = useGameStore();
  return <main className="equipment-scene"><header><button onClick={onBack}><ArrowLeft size={18}/> MENU</button><div><small>DREAM LOADOUT // LEVEL {playerLevel}</small><h1>PLAYER EQUIPMENT</h1></div><b>◉ {coins} COINS</b></header>
    <div className="equipment-layout"><section><h2>YOUR WEAPONS</h2>{weapons.map((weapon) => <article key={weapon}><h3>{WEAPONS[weapon].label}</h3><div className="skin-options">{skins[weapon].map((color) => <button key={color} className={equippedSkins[weapon] === color ? "is-equipped" : ""} onClick={() => equipSkin(weapon, color)} style={{"--skin-preview":color === "default" ? "#2548b8" : color} as React.CSSProperties}>◆ {color.toUpperCase()}</button>)}</div><small>{SKIN_COLORS.filter((color: SkinColor) => skins[weapon].includes(color)).length}/6 CRATE COLORS</small></article>)}</section>
    <div className="equipment-avatar" aria-label="Player stick figure"><div className="equipment-head">PLAYER</div><div className="equipment-body"/><div className="equipment-arm left"/><div className="equipment-arm right"/><div className="equipment-leg left"/><div className="equipment-leg right"/></div>
    <section><h2>ELEMENTAL MAGIC</h2><p>Cast with F or the mobile magic button.</p>{MAGIC_TYPES.map((kind) => <button key={kind} className={selectedMagic === kind ? "is-equipped" : ""} disabled={!magic[kind]} onClick={() => selectMagic(kind)}>✦ {kind.toUpperCase()} {magic[kind] ? `RANK ${magic[kind]}` : "LOCKED"} {selectedMagic === kind ? "✓" : ""}</button>)}<button onClick={onTree}><Sparkles size={16}/> OPEN SKILL TREE</button></section></div>
    <div className="equipment-cards"><h2>YOUR CARDS</h2><div>{(Object.entries(upgrades) as [UpgradeId,number][]).filter(([,amount]) => amount > 0).map(([id,amount]) => <span key={id}>{getUpgradeCard(id).glyph} {getUpgradeCard(id).name} ×{amount}</span>)}{Object.values(upgrades).every((amount) => amount === 0) && <span>No cards yet. Clear a stage.</span>}</div></div>
    <nav><button onClick={onShop}><ShoppingBag size={16}/> SHOP</button><button onClick={onTree}><Sparkles size={16}/> SKILL TREE</button><button onClick={onStages}><Map size={16}/> GO TO STAGES</button></nav>
  </main>;
}
