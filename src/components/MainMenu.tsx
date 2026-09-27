import { useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  Github,
  LockKeyhole,
  Play,
  SlidersHorizontal,
} from "lucide-react";
import { LEVELS } from "../game/levels";
import { useGameStore } from "../game/store";
import { ControlsList } from "./ControlsList";

export function MainMenu() {
  const startLevel = useGameStore((state) => state.startLevel);
  const unlockedLevel = useGameStore((state) => state.unlockedLevel);
  const readComic = useGameStore((state) => state.readComic);
  const sensitivity = useGameStore((state) => state.sensitivity);
  const bgmVolume = useGameStore((state) => state.bgmVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const setSensitivity = useGameStore((state) => state.setSensitivity);
  const setBgmVolume = useGameStore((state) => state.setBgmVolume);
  const setSfxVolume = useGameStore((state) => state.setSfxVolume);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [levelSelectOpen, setLevelSelectOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);

  return (
    <main className="main-menu-shell">
      <div className="main-menu-speed-lines" aria-hidden="true" />
      <section
        className={`main-menu-card ${levelSelectOpen ? "is-level-select" : ""}`}
      >
        {!levelSelectOpen ? (
          <>
            <p className="main-menu-kicker">AFTER HOURS // DREAM TERMINAL</p>
            <h1>SHOOT<br />A BOSS</h1>
            <p className="main-menu-copy">
              The paperwork can wait. The dream is still running.
            </p>

            <div className="main-menu-actions">
              <button
                type="button"
                onClick={() => {
                  setOptionsOpen(false);
                  setLevelSelectOpen(true);
                }}
              >
                <Play size={17} /> PLAY DREAM
              </button>

              <button
                type="button"
                onClick={() => setOptionsOpen((value) => !value)}
              >
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
                <button type="button" className="controls-toggle" onClick={() => setControlsOpen((value) => !value)}>
                  CONTROLS {controlsOpen ? "−" : "+"}
                </button>
                {controlsOpen && <ControlsList />}
                <label className="sensitivity-control">
                  <span>CAMERA SENSITIVITY</span>
                  <b>{sensitivity.toFixed(2)}×</b>
                  <input
                    type="range"
                    min="0.25"
                    max="1.6"
                    step="0.05"
                    value={sensitivity}
                    onChange={(event) =>
                      setSensitivity(Number(event.target.value))
                    }
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
                    onChange={(event) =>
                      setBgmVolume(Number(event.target.value))
                    }
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
                    onChange={(event) =>
                      setSfxVolume(Number(event.target.value))
                    }
                  />
                </label>
              </div>
            )}

            <div className="main-menu-note">
              <span>WASD</span> move · <span>1–4</span> weapons · <span>LMB</span> attack · <span>RMB</span> aim · <span>G</span> paper bomb
            </div>
          </>
        ) : (
          <div className="stage-select">
            <button
              type="button"
              className="stage-select__back"
              onClick={() => setLevelSelectOpen(false)}
            >
              <ChevronLeft size={16} /> BACK
            </button>
            <p className="main-menu-kicker">DREAM MAP // 10 DEADLINES</p>
            <h2>CHOOSE<br />A STAGE</h2>
            <p className="stage-select__copy">
              Clear stages to unlock the next deadline. Upgrades only carry
              forward when you continue a run.
            </p>

            <div className="stage-road">
              {LEVELS.map((level, index) => {
                const unlocked = level.level <= unlockedLevel;
                return (
                  <button
                    key={level.level}
                    type="button"
                    className={`stage-node stage-node--${level.theme} ${unlocked ? "is-unlocked" : "is-locked"}`}
                    style={{ "--stage-index": index } as React.CSSProperties}
                    disabled={!unlocked}
                    onClick={() => startLevel(level.level)}
                  >
                    <span className="stage-node__number">
                      {unlocked ? level.level : <LockKeyhole size={16} />}
                    </span>
                    <span className="stage-node__text">
                      <strong>{level.name}</strong>
                      <small>{level.difficulty}</small>
                    </span>
                  </button>
                );
              })}
              <span className="stage-road__line" aria-hidden="true" />
            </div>
          </div>
        )}
      </section>
      <small className="creator-credit creator-credit--menu">made by medianto susilo</small>
    </main>
  );
}
