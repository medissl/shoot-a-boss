import { useState } from "react";
import { Home, RotateCcw } from "lucide-react";
import { ControlsList } from "./ControlsList";
import { FullscreenToggle } from "./FullscreenToggle";
import { getUpgradeCard, type UpgradeId } from "../game/progression";
import { useGameStore } from "../game/store";

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
  const [panel, setPanel] = useState<"settings" | "cards" | "controls">("settings");
  const [selectedCard, setSelectedCard] = useState<UpgradeId | null>(null);

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
            <button type="button" onClick={resume}>
              RESUME
            </button>
          )}

          <button type="button" onClick={restart}>
            <RotateCcw size={15} /> {screen === "purged" ? "START AGAIN · LEVEL 1" : screen === "lost" ? "RETRY · ONE HEART SPENT" : "RESTART"}
          </button>

          {screen === "won" && champion && <button type="button" onClick={startNewGamePlus}>
            NG+ · CONTINUE WITH YOUR CARDS →
          </button>}

          <button type="button" onClick={goToMenu}>
            <Home size={15} /> MAIN MENU
          </button>
          <div className="pause-tabs">
            <button type="button" onClick={() => setPanel("cards")}>CARD INVENTORY</button>
            <button type="button" onClick={() => setPanel("controls")}>CONTROLS</button>
            <button type="button" onClick={() => setPanel("settings")}>OPTIONS</button>
          </div>

          {panel === "settings" && <>
          <FullscreenToggle />
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
          </div>}
        </div>
        <small className="creator-credit creator-credit--pause">Made by Medianto Susilo</small>
      </div>
    </div>
  );
}
