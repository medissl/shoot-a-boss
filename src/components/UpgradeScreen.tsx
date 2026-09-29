import { Home, RefreshCw } from "lucide-react";
import { getLevelDefinition } from "../game/levels";
import { getUpgradeCard, upgradeDescription } from "../game/progression";
import { useGameStore } from "../game/store";
import { enterStageAfterCurtain } from "../game/sceneTransition";
import { useState } from "react";
import { SkillTree } from "./SkillTree";
import { availableEvolutions, EVOLUTIONS } from "../game/evolutions";
import { ProgressStrip } from "./ProgressStrip";

export function UpgradeScreen() {
  const [treeOpen, setTreeOpen] = useState(false);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const hearts = useGameStore((state) => state.hearts);
  const ngPlusCycle = useGameStore((state) => state.ngPlusCycle);
  const upgrades = useGameStore((state) => state.upgrades);
  const choices = useGameStore((state) => state.upgradeChoices);
  const rerolls = useGameStore((state) => state.upgradeRerollsLeft);
  const selected = useGameStore((state) => state.selectedUpgrade);
  const evolutions = useGameStore((state) => state.evolutions);
  const selectedEvolution = useGameStore((state) => state.selectedEvolution);
  const chooseEvolution = useGameStore((state) => state.chooseEvolution);
  const undoEvolution = useGameStore((state) => state.undoEvolution);
  const chooseUpgrade = useGameStore((state) => state.chooseUpgrade);
  const undoUpgrade = useGameStore((state) => state.undoUpgrade);
  const rerollUpgrades = useGameStore((state) => state.rerollUpgrades);
  const nextLevel = useGameStore((state) => state.nextLevel);
  const goToMenu = useGameStore((state) => state.goToMenu);
  const level = getLevelDefinition(currentLevel);
  const next = getLevelDefinition(Math.min(10, currentLevel + 1));
  const playerLevel = useGameStore((s) => s.playerLevel);
  const skillPoints = useGameStore((s) => s.skillPoints);
  const selectedMagic = useGameStore((s) => s.selectedMagic);
  const equippedGear = useGameStore((s) => s.equippedGear);
  const lastXpReward = useGameStore((s) => s.lastXpReward);
  const availableCombos = [5, 9].includes(currentLevel) ? availableEvolutions(upgrades, evolutions) : [];
  if (treeOpen) return <SkillTree onBack={() => setTreeOpen(false)} />;

  return (
    <main className="upgrade-shell">
      <div className="upgrade-speed-lines" aria-hidden="true" />
      <section className="upgrade-card">
        <p className="main-menu-kicker">
          {ngPlusCycle ? `NG+ ${ngPlusCycle} // ` : ""}LEVEL {currentLevel} CLEARED // {level.name}
        </p>
        <p className="campaign-hearts">HEARTS {"♥".repeat(hearts)}{"♡".repeat(5 - hearts)}</p>
        <p className="campaign-hearts">+{lastXpReward} XP · PLAYER LEVEL {playerLevel} · {skillPoints} SKILL POINTS</p>
        <ProgressStrip compact />
        <h1>PICK YOUR<br />DREAM PERK</h1>
        <p className="upgrade-copy">
          Choose one card. Common 50% · rare 30% · epic 15% · legendary 5%.
          Unique cards leave the pool once owned.
        </p>

        <div className="upgrade-grid">
          {availableCombos.map(combo => <button className={`upgrade-option rarity--legendary evolution-option ${selectedEvolution === combo.id ? "is-selected" : ""}`} key={combo.id} disabled={Boolean(selected || selectedEvolution)} onClick={() => chooseEvolution(combo.id)}>
            <span className="upgrade-option__glyph">✳</span><small>EVOLVE · COMBO COMPLETE</small><strong>{combo.name}</strong><p>{combo.detail}</p><small>{combo.cards.join(" + ").toUpperCase()}</small>{selectedEvolution === combo.id && <b>EVOLVED ✓</b>}
          </button>)}
          {choices.length === 0 && <p>Every card is maxed out. Continue with your full deck.</p>}
          {choices.map((id) => {
            const card = getUpgradeCard(id);
            const isSelected = selected === id;
            return (
              <button
                key={id}
                type="button"
                className={`upgrade-option rarity--${card.rarity} ${isSelected ? "is-selected" : ""}`}
                disabled={Boolean(selected || selectedEvolution)}
                onClick={() => chooseUpgrade(id)}
              >
                <span className="upgrade-option__glyph">{card.glyph}</span>
                <small className="upgrade-option__rarity">{card.rarity.toUpperCase()}</small>
                {card.weapon && <small>{card.weapon.toUpperCase()} ONLY</small>}
                <small>{card.weapon ? "WEAPON" : id.startsWith("magic") || ["fireBloom","crystalThorns","iceBarrier","waterHealing","thunderSpark","spellWard"].includes(id) ? "MAGIC" : "GENERAL"} · {card.rarity.toUpperCase()}</small>
                <small>{card.maxStacks === 1 ? "UNIQUE" : `STACK ${upgrades[id] + (isSelected ? 0 : 1)} / ${card.maxStacks}`}</small>
                <strong>{card.name}</strong>
                <p>{upgradeDescription(card, upgrades[id] - (isSelected ? 1 : 0))}</p>
                <small>OWNED {upgrades[id] - (isSelected ? 1 : 0)} → {upgrades[id] + (isSelected ? 0 : 1)}</small>
                {isSelected && <b>TAKEN ✓</b>}
              </button>
            );
          })}
        </div>

        {(selected || selectedEvolution) && <div className="draft-summary"><b>BUILD UPDATED</b><span>{selectedEvolution ? EVOLUTIONS.find(combo => combo.id === selectedEvolution)?.name : selected ? getUpgradeCard(selected).name : ""}</span><span>✦ {skillPoints} SP · ✧ {selectedMagic?.toUpperCase() ?? "NO MAGIC"} · ▤ {equippedGear.length}/4 GEAR</span></div>}

        <div className="upgrade-actions">
          <button type="button" onClick={() => setTreeOpen(true)}>✦ OPEN MAGIC TREE · {skillPoints} POINTS</button>
          {!selected && !selectedEvolution && (choices.length > 0 || availableCombos.length > 0) ? (
            <button
              type="button"
              onClick={rerollUpgrades}
              disabled={rerolls <= 0}
            >
              <RefreshCw size={16} />
              {rerolls > 0 ? "REROLL ONCE" : "REROLL USED"}
            </button>
          ) : (
            <>
              {selected && <button type="button" onClick={undoUpgrade}>↶ CHANGE MY CARD</button>}
              {selectedEvolution && <button type="button" onClick={undoEvolution}>↶ CHANGE EVOLUTION</button>}
              <button type="button" className="is-primary" onClick={() => {
                if (currentLevel === 10) nextLevel();
                else enterStageAfterCurtain(nextLevel);
              }}>{currentLevel === 10 ? "FINISH RUN · NG+ UNLOCKED →" : `NEXT: LEVEL ${next.level} · ${next.name} →`}</button>
            </>
          )}

          <button type="button" onClick={goToMenu}>
            <Home size={15} /> MAIN MENU
          </button>
          {(selected || selectedEvolution) && currentLevel < 10 && <button type="button" onClick={() => { sessionStorage.setItem("sab-menu-scene", "desk"); goToMenu(); }}>PREPARE IN DREAM DESK →</button>}
        </div>
      </section>
    </main>
  );
}
