import { RefreshCw } from "lucide-react";
import { useGameStore } from "../game/store";
import { getUpgradeCard, upgradeDescription } from "../game/progression";
import { availableEvolutions, EVOLUTIONS } from "../game/evolutions";

export function UpgradeScreen() {
  const state = useGameStore();
  const evolutionScene = state.screen === "evolution";
  const available = availableEvolutions(state.upgrades, state.evolutions).slice(0, 3);
  const chosenCombo = EVOLUTIONS.find(combo => combo.id === state.selectedEvolution);
  return <main className={`upgrade-shell ${evolutionScene ? "upgrade-shell--evolution" : ""}`}>
    <div className="upgrade-speed-lines" aria-hidden="true" />
    <section className="upgrade-card">
      <p className="main-menu-kicker">LEVEL {state.currentLevel} CLEARED · {evolutionScene ? "A BUILD AWAKENS" : "DREAM CARD"}</p>
      {evolutionScene ? <>
        <h1>{chosenCombo ? "EVOLVED!" : "COMBO READY!"}</h1>
        <p className="upgrade-copy">Two cards become one powerful new effect.</p>
        <div className="evolution-grid">{available.map(combo => <button key={combo.id} className="evolution-choice" onClick={() => state.chooseEvolution(combo.id)}>
          <small>{combo.cards.map(id => getUpgradeCard(id).name).join(" + ")}</small>
          <strong>✳ {combo.name}</strong><p>{combo.detail}</p>
        </button>)}
        {chosenCombo && <div className="evolution-reveal"><small>{chosenCombo.cards.map(id => getUpgradeCard(id).name).join(" + ")}</small><b>↓</b><h2>✳ {chosenCombo.name}</h2><p>{chosenCombo.detail}</p></div>}
        </div>
        <div className="upgrade-actions">{chosenCombo && <><button type="button" onClick={state.undoEvolution}>CHANGE EVOLUTION</button><button type="button" className="is-primary" onClick={state.continueEvolution}>CONTINUE →</button></>}</div>
      </> : <>
        <h1>PICK YOUR<br />DREAM PERK</h1>
        <p className="upgrade-copy">Choose one card for this Dream. Common 50% · rare 30% · epic 15% · legendary 5%.</p>
        <div className="upgrade-grid">
          {state.upgradeChoices.length === 0 && <p>Your card pool is complete. Continue with your full deck.</p>}
          {state.upgradeChoices.map(id => {
            const card = getUpgradeCard(id);
            const selected = state.selectedUpgrade === id;
            const before = state.upgrades[id] - (selected ? 1 : 0);
            return <button key={id} type="button" className={`upgrade-option rarity--${card.rarity} ${selected ? "is-selected" : ""}`}
              disabled={Boolean(state.selectedUpgrade)} onClick={() => state.chooseUpgrade(id)}>
              <span className="upgrade-option__glyph">{card.glyph}</span>
              <small>{card.rarity.toUpperCase()} · {card.weapon ? `${card.weapon.toUpperCase()} WEAPON` : "GENERAL"}</small>
              <strong>{card.name}</strong><p>{upgradeDescription(card, before)}</p>
              <small>OWNED {before} → {before + 1} · MAX {card.maxStacks}</small>
              {selected && <b>TAKEN ✓</b>}
            </button>;
          })}
        </div>
        {state.selectedUpgrade && <div className="draft-summary"><b>BUILD UPDATED</b><span>{getUpgradeCard(state.selectedUpgrade).name}</span></div>}
        <div className="upgrade-actions">
          {!state.selectedUpgrade && state.upgradeChoices.length > 0 && <button type="button" onClick={state.rerollUpgrades} disabled={state.upgradeRerollsLeft <= 0}><RefreshCw size={16} /> {state.upgradeRerollsLeft ? "REROLL ONCE" : "REROLL USED"}</button>}
          {state.selectedUpgrade && <button type="button" onClick={state.undoUpgrade}>CHANGE MY CARD</button>}
          {(state.selectedUpgrade || state.upgradeChoices.length === 0) && <button type="button" className="is-primary" onClick={state.continueDraft}>CONTINUE →</button>}
        </div>
      </>}
    </section>
  </main>;
}
