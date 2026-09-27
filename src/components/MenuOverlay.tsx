import { Home, RotateCcw } from "lucide-react";
import { useGameStore } from "../game/store";

export function MenuOverlay() {
  const screen = useGameStore((state) => state.screen);
  const resume = useGameStore((state) => state.resume);
  const restart = useGameStore((state) => state.restart);
  const goToMenu = useGameStore((state) => state.goToMenu);
  const sensitivity = useGameStore((state) => state.sensitivity);
  const bgmVolume = useGameStore((state) => state.bgmVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const setSensitivity = useGameStore((state) => state.setSensitivity);
  const setBgmVolume = useGameStore((state) => state.setBgmVolume);
  const setSfxVolume = useGameStore((state) => state.setSfxVolume);

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

          <button type="button" onClick={goToMenu}>
            <Home size={15} /> MAIN MENU
          </button>

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
        </div>
      </div>
    </div>
  );
}
