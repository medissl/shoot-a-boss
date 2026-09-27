import { RotateCcw, Settings, Undo2 } from "lucide-react";
import { useState } from "react";
import { useGameStore } from "../game/store";

export function MenuOverlay() {
  const screen = useGameStore((state) => state.screen);
  const resume = useGameStore((state) => state.resume);
  const restart = useGameStore((state) => state.restart);
  const returnToMenu = useGameStore((state) => state.returnToMenu);
  const sensitivity = useGameStore((state) => state.sensitivity);
  const setSensitivity = useGameStore((state) => state.setSensitivity);
  const [options, setOptions] = useState(false);

  if (!["paused", "won", "lost"].includes(screen)) return null;

  const title = screen === "won"
    ? "Deadline deleted."
    : screen === "lost"
      ? "The boss bonked you awake."
      : "Dream paused.";

  return (
    <div className="pause-layer">
      <div className="pause-card">
        <p className="kicker">SHOOT A BOSS</p>
        <h2>{title}</h2>

        {options ? (
          <div className="options-panel">
            <button className="text-button" type="button" onClick={() => setOptions(false)}>
              <Undo2 size={16} /> Back
            </button>
            <label>
              Camera sensitivity
              <input
                type="range"
                min="0.25"
                max="1.6"
                step="0.05"
                value={sensitivity}
                onChange={(event) => setSensitivity(Number(event.target.value))}
              />
              <span>{sensitivity.toFixed(2)}×</span>
            </label>

            <div className="controls-grid">
              <span>WASD</span><b>Move</b>
              <span>Shift (hold)</span><b>Run</b>
              <span>C</span><b>Crouch / slide while moving</b>
              <span>C → Space</span><b>Velocity boost jump</b>
              <span>Space</span><b>Jump</b>
              <span>Mouse</span><b>Look</b>
              <span>Right click</span><b>Shoot</b>
              <span>Hold left</span><b>Scope / aim</b>
              <span>1 / 2 / 3</span><b>Weapons</b>
              <span>Wheel</span><b>Cycle weapon</b>
              <span>R</span><b>Reload</b>
              <span>G</span><b>Throw paper grenade</b>
              <span>ESC</span><b>Pause</b>
            </div>
          </div>
        ) : (
          <div className="pause-actions">
            {screen === "paused" && (
              <button className="primary-button" type="button" onClick={resume}>
                Resume dream
              </button>
            )}
            <button type="button" onClick={restart}>
              <RotateCcw size={16} /> Restart dream
            </button>
            <button type="button" onClick={() => setOptions(true)}>
              <Settings size={16} /> Options / controls
            </button>
            <button type="button" onClick={returnToMenu}>
              Return to menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
