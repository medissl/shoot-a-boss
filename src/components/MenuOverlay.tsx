import { useState } from "react";
import { Home, RotateCcw } from "lucide-react";
import { ControlsList } from "./ControlsList";
import { FullscreenToggle } from "./FullscreenToggle";
import { getUpgradeCard, type UpgradeId } from "../game/progression";
import { GEAR, useGameStore } from "../game/store";
import { restorePreferredFullscreen } from "../game/fullscreen";
import { EVOLUTIONS, type EvolutionId } from "../game/evolutions";

export function MenuOverlay() {
  const screen = useGameStore((state) => state.screen);
  const resume = useGameStore((state) => state.resume);
  const restart = useGameStore((state) => state.restart);
  const hearts = useGameStore((state) => state.hearts);
  const champion = useGameStore((state) => state.champion);
  const startNewGamePlus = useGameStore((state) => state.startNewGamePlus);
  const goToMenu = useGameStore((state) => state.goToMenu);
  const sensitivity = useGameStore((state) => state.sensitivity);
  const bgmVolume = useGameStore((state) => state.bgmVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const setSensitivity = useGameStore((state) => state.setSensitivity);
  const setBgmVolume = useGameStore((state) => state.setBgmVolume);
  const setSfxVolume = useGameStore((state) => state.setSfxVolume);
  const upgrades = useGameStore((state) => state.upgrades);
  const equippedGear = useGameStore((state) => state.equippedGear);
  const gear = useGameStore((state) => state.gear);
  const selectedMagic = useGameStore((state) => state.selectedMagic);
  const magic = useGameStore((state) => state.magic);
  const evolutions = useGameStore((state) => state.evolutions);
  const [panel, setPanel] = useState<"settings" | "cards" | "controls">("cards");
  const [selectedCard, setSelectedCard] = useState<UpgradeId | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<EvolutionId | null>(null);

  if (!["paused", "purged"].includes(screen)) return null;

  const title =
    screen === "purged"
      ? "the dream was purged."
      : screen === "won"
      ? "deadline cleared."
      : screen === "lost"
        ? "you woke up."
        : "dream paused.";

  return (
    <div className="pause-layer">
      <div className={`pause-card ${panel === "cards" ? "pause-card--inventory" : ""}`}>
        <p>SHOOT A BOSS</p>
        <h2>{title}</h2>
        <p className="campaign-hearts">{screen === "purged" ? "NO HEARTS LEFT · BACK TO LEVEL 1" : `HEARTS ${"♥".repeat(hearts)}${"♡".repeat(5 - hearts)}`}</p>

        <div className="pause-actions">
          {screen === "paused" && (
            <button type="button" onClick={() => { void restorePreferredFullscreen().then(resume); }}>
              RESUME
            </button>
          )}

          <button type="button" onClick={restart}>
            <RotateCcw size={15} /> RESTART STAGE
          </button>

          {screen === "won" && champion && <button type="button" onClick={startNewGamePlus}>
            NG+ · CONTINUE WITH YOUR CARDS →
          </button>}

          <button type="button" onClick={() => { sessionStorage.setItem("sab-menu-scene", "stages"); goToMenu(); }}>
            <Home size={15} /> RETURN TO DREAM MAP
          </button>
          <FullscreenToggle />
          <div className="pause-tabs">
            <button type="button" onClick={() => setPanel("cards")}>RUN SHEET</button>
            <button type="button" onClick={() => setPanel("controls")}>CONTROLS</button>
            <button type="button" onClick={() => setPanel("settings")}>OPTIONS</button>
          </div>

          {panel === "settings" && <>
          <label className="sensitivity-control">
            <span>SENSITIVITY</span>
            <b>{sensitivity.toFixed(2)}×</b>
            <input
              type="range"
              min="0.25"
              max="1.6"
              step="0.05"
              value={sensitivity}
              onChange={(event) => setSensitivity(Number(event.target.value))}
            />
          </label>

          <label className="sensitivity-control audio-control">
            <span>BGM VOLUME</span>
            <b>{Math.round(bgmVolume * 100)}%</b>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bgmVolume}
              onChange={(event) => setBgmVolume(Number(event.target.value))}
            />
          </label>

          <label className="sensitivity-control audio-control">
            <span>SFX VOLUME</span>
            <b>{Math.round(sfxVolume * 100)}%</b>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(event) => setSfxVolume(Number(event.target.value))}
            />
          </label>
          </>}
          {panel === "controls" && <ControlsList />}
          {panel === "cards" && <div className="inventory-panel">
            <p>MAGIC: {selectedMagic ? `${selectedMagic.toUpperCase()} · TIER ${magic[selectedMagic]}` : "NOT EQUIPPED"}</p>
            <p>GEAR: {equippedGear.length ? equippedGear.map(id => `${GEAR.find(item => item.id === id)?.name} R${gear[id]}`).join(" · ") : "NONE EQUIPPED"}</p>
            <h3>DREAM CARDS · {Object.values(upgrades).reduce((sum, amount) => sum + amount, 0)}</h3>
            {Object.entries(upgrades).filter(([, count]) => count > 0).length === 0 && <p>No cards yet. Clear a stage to pick one.</p>}
            <div className="inventory-grid">
              {(Object.entries(upgrades) as [UpgradeId, number][]).filter(([, count]) => count > 0).map(([id, count]) => {
                const card = getUpgradeCard(id);
                return <button className={`inventory-card rarity--${card.rarity} ${selectedCard === id ? "is-selected" : ""}`} type="button" key={id} onClick={() => setSelectedCard(id)}>
                  <strong>{card.glyph}</strong><span>{card.name}</span><small>×{count}</small>
                </button>;
              })}
            </div>
            {selectedCard && upgrades[selectedCard] > 0 && <div className={`inventory-detail rarity--${getUpgradeCard(selectedCard).rarity}`}>
              <small>{getUpgradeCard(selectedCard).rarity.toUpperCase()} · OWNED ×{upgrades[selectedCard]}</small>
              <h3>{getUpgradeCard(selectedCard).glyph} {getUpgradeCard(selectedCard).name}</h3>
              <p>{getUpgradeCard(selectedCard).description}</p>
              <p>Stack limit {getUpgradeCard(selectedCard).maxStacks} · {getUpgradeCard(selectedCard).weapon?.toUpperCase() ?? "ALL WEAPONS"}</p>
            </div>}
            <h3>EVOLUTIONS · {evolutions.length}</h3>
            <div className="inventory-grid">{evolutions.map(id => {
              const combo = EVOLUTIONS.find(item => item.id === id);
              return <button type="button" className={`inventory-card evolution-option ${selectedCombo === id ? "is-selected" : ""}`} key={id} onClick={() => setSelectedCombo(id)}>✳ {combo?.name}</button>;
            })}</div>
            {!evolutions.length && <p>Combine compatible Dream Cards to awaken an Evolution.</p>}
            {selectedCombo && evolutions.includes(selectedCombo) && <div className="inventory-detail evolution-option"><h3>✳ {EVOLUTIONS.find(item => item.id === selectedCombo)?.name}</h3>
              <p>Requires {EVOLUTIONS.find(item => item.id === selectedCombo)?.cards.map(id => getUpgradeCard(id).name).join(" + ")}</p>
              <p>{EVOLUTIONS.find(item => item.id === selectedCombo)?.detail}</p>
            </div>}
          </div>}
        </div>
        <small className="creator-credit creator-credit--pause">Made by Medianto Susilo</small>
      </div>
    </div>
  );
}
