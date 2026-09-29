import { ArrowLeft, ShoppingBag, Map, Sparkles, Crosshair } from "lucide-react";
import { MAGIC_TYPES, useGameStore } from "../game/store";
import { getUpgradeCard, type UpgradeId } from "../game/progression";

export function EquipmentHub({ onBack, onShop, onStages, onTree, onArsenal }: { onBack: () => void; onShop: () => void; onStages: () => void; onTree: () => void; onArsenal: () => void }) {
  const { magic, selectedMagic, selectMagic, upgrades, coins, playerLevel } = useGameStore();
  return <main className="equipment-scene"><header><button onClick={onBack}><ArrowLeft size={18}/> MENU</button><div><small>DREAM LOADOUT // LEVEL {playerLevel}</small><h1>PLAYER EQUIPMENT</h1></div><b>◉ {coins} COINS</b></header>
    <div className="equipment-layout"><section className="equipment-arsenal-link"><h2>YOUR WEAPONS</h2><p>Explore 22 theme families across rifle, shotgun, sniper and knife. Each build has its own body, sight, effects and sound.</p><button onClick={onArsenal}><Crosshair size={18}/> OPEN THE ARSENAL →</button></section>
    <div className="equipment-avatar" aria-label="Player stick figure"><div className="equipment-head">PLAYER</div><div className="equipment-body"/><div className="equipment-arm left"/><div className="equipment-arm right"/><div className="equipment-leg left"/><div className="equipment-leg right"/></div>
    <section><h2>ELEMENTAL MAGIC</h2><p>Cast with F or the mobile magic button.</p>{MAGIC_TYPES.map((kind) => <button key={kind} className={selectedMagic === kind ? "is-equipped" : ""} disabled={!magic[kind]} onClick={() => selectMagic(kind)}>✦ {kind.toUpperCase()} {magic[kind] ? `RANK ${magic[kind]}` : "LOCKED"} {selectedMagic === kind ? "✓" : ""}</button>)}<button onClick={onTree}><Sparkles size={16}/> OPEN SKILL TREE</button></section></div>
    <div className="equipment-cards"><h2>YOUR CARDS</h2><div>{(Object.entries(upgrades) as [UpgradeId,number][]).filter(([,amount]) => amount > 0).map(([id,amount]) => <span key={id}>{getUpgradeCard(id).glyph} {getUpgradeCard(id).name} ×{amount}</span>)}{Object.values(upgrades).every((amount) => amount === 0) && <span>No cards yet. Clear a stage.</span>}</div></div>
    <nav><button onClick={onShop}><ShoppingBag size={16}/> SHOP</button><button onClick={onTree}><Sparkles size={16}/> SKILL TREE</button><button onClick={onStages}><Map size={16}/> GO TO STAGES</button></nav>
  </main>;
}
