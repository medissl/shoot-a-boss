import { Home, RotateCcw } from "lucide-react";
import { useGameStore } from "../game/store";

export function MenuOverlay() {
  const screen = useGameStore((state) => state.screen);
  const resume = useGameStore((state) => state.resume);
  const restart = useGameStore((state) => state.restart);
  const goToMenu = useGameStore((state) => state.goToMenu);
  const sensitivity = useGameStore((state) => state.sensitivity);
  const setSensitivity = useGameStore((state) => state.setSensitivity);

  if (!["paused", "won", "lost"].includes(screen)) return null;

  const title =
    screen === "won"
      ? "deadline cleared."
      : screen === "lost"
        ? "you woke up."
        : "dream paused.";

  return (
    <div className="pause-layer">
      <div className="pause-card">
        <p>SHOOT A BOSS</p>
        <h2>{title}</h2>

        <div className="pause-actions">
          {screen === "paused" && (
            <button type="button" onClick={resume}>
              RESUME
            </button>
          )}

          <button type="button" onClick={restart}>
            <RotateCcw size={15} /> RESTART
          </button>

          {screen !== "paused" && (
            <button type="button" onClick={goToMenu}>
              <Home size={15} /> MAIN MENU
            </button>
          )}

          <label className="sensitivity-control">
            <span>SENSITIVITY</span>
            <input
              type="range"
              min="0.25"
              max="1.6"
              step="0.05"
              value={sensitivity}
              onChange={(event) => setSensitivity(Number(event.target.value))}
            />
            <b>{sensitivity.toFixed(2)}×</b>
          </label>
        </div>
      </div>
    </div>
  );
}
