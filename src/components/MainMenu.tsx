import { useState } from "react";
import { Github, Play, SlidersHorizontal, BookOpen } from "lucide-react";
import { useGameStore } from "../game/store";

export function MainMenu() {
  const startGame = useGameStore((state) => state.startGame);
  const readComic = useGameStore((state) => state.readComic);
  const sensitivity = useGameStore((state) => state.sensitivity);
  const bgmVolume = useGameStore((state) => state.bgmVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const setSensitivity = useGameStore((state) => state.setSensitivity);
  const setBgmVolume = useGameStore((state) => state.setBgmVolume);
  const setSfxVolume = useGameStore((state) => state.setSfxVolume);
  const [optionsOpen, setOptionsOpen] = useState(false);

  return (
    <main className="main-menu-shell">
      <div className="main-menu-speed-lines" aria-hidden="true" />
      <section className="main-menu-card">
        <p className="main-menu-kicker">AFTER HOURS // DREAM TERMINAL</p>
        <h1>SHOOT<br />A BOSS</h1>
        <p className="main-menu-copy">
          The paperwork can wait. The dream is still running.
        </p>

        <div className="main-menu-actions">
          <button type="button" onClick={startGame}>
            <Play size={17} /> PLAY DREAM
          </button>

          <button type="button" onClick={() => setOptionsOpen((value) => !value)}>
            <SlidersHorizontal size={17} /> OPTIONS
          </button>

          <button type="button" onClick={readComic}>
            <BookOpen size={17} /> READ COMIC AGAIN
          </button>

          <a href="https://github.com/medissl" target="_blank" rel="noreferrer">
            <Github size={17} /> CREATOR ↗
          </a>
        </div>

        {optionsOpen && (
          <div className="main-menu-options">
            <label className="sensitivity-control">
              <span>CAMERA SENSITIVITY</span>
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
        )}

        <div className="main-menu-note">
          <span>WASD</span> move · <span>LMB</span> fire · <span>RMB</span> aim · <span>G</span> paper bomb
        </div>
      </section>
    </main>
  );
}
