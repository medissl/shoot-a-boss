import { GEAR, satchelBonus, useGameStore } from "../game/store";
import { getUpgradeCard, getUpgradeStats, type UpgradeId } from "../game/progression";

export function EquipmentHub() {
  const state = useGameStore();
  const cards = (Object.entries(state.upgrades) as [UpgradeId, number][]).filter(([, count]) => count > 0);
  const effectiveGear = (id: "vest" | "satchel") => state.equippedGear.includes(id) ? state.gear[id] : 0;
  const maxHp = getUpgradeStats(state.upgrades).maxHp + effectiveGear("vest") * 8;
  const bombs = getUpgradeStats(state.upgrades).grenadeCapacity + satchelBonus(effectiveGear("satchel"));
  return <section className="loadout-page">
    <div className="loadout-hero"><div className="equipment-avatar" aria-label="Player stick figure"><div className="equipment-head">PLAYER</div><div className="equipment-body"/><div className="equipment-arm left"/><div className="equipment-arm right"/><div className="equipment-leg left"/><div className="equipment-leg right"/></div>
      <div><small>ACTIVE DREAM // STAGE {state.currentLevel}</small><h2>YOUR LOADOUT</h2><p>Choose up to four permanent gear pieces for the next stage. Your run cards stay with this dream.</p>
        <div className="loadout-stats"><span>♥ {maxHp} HP</span><span>◌ {bombs} BOMBS</span><span>✦ {cards.reduce((n, [, count]) => n + count, 0)} CARDS</span><span>✧ {state.selectedMagic?.toUpperCase() ?? "NO SPELL"}</span></div></div></div>
    <h3>PERMANENT GEAR <small>{state.equippedGear.length}/4 EQUIPPED</small></h3>
    <div className="loadout-gear">{GEAR.map(item => {
      const rank = state.gear[item.id]; const equipped = state.equippedGear.includes(item.id);
      return <button key={item.id} disabled={!rank || (!equipped && state.equippedGear.length >= 4)} className={equipped ? "is-equipped" : ""} onClick={() => state.toggleGear(item.id)}>
        <b>{item.name} · RANK {rank}</b><span>{item.detail}</span><strong>{!rank ? "BUY IN SHOP" : equipped ? "✓ EQUIPPED" : "EQUIP"}</strong>
      </button>;
    })}</div>
    <h3>RUN CARDS <small>{cards.length} TYPES</small></h3>
    <div className="loadout-cards">{cards.length ? cards.map(([id, count]) => <span key={id}><b>{getUpgradeCard(id).glyph} {getUpgradeCard(id).name}</b> ×{count}<small>{getUpgradeCard(id).description}</small></span>) : <p>Clear a stage to draft your first card.</p>}</div>
  </section>;
}
