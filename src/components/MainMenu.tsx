import { useState } from "react";
import {
  BookOpen,
  Crosshair,
  ChevronLeft,
  Github,
  LockKeyhole,
  Play,
  SlidersHorizontal,
  ShoppingBag,
} from "lucide-react";
import { LEVELS } from "../game/levels";
import { useGameStore } from "../game/store";
import { ControlsList } from "./ControlsList";
import { GearShopScene } from "./GearShopScene";
import { FullscreenToggle } from "./FullscreenToggle";
import { MonsterEncyclopedia } from "./MonsterEncyclopedia";
import { EquipmentHub } from "./EquipmentHub";
import { Arsenal } from "./Arsenal";
import { SkillTree } from "./SkillTree";
import { ResetDataButton } from "./ResetDataButton";
import { enterStageAfterCurtain } from "../game/sceneTransition";

export function MainMenu() {
  const startLevel = useGameStore((state) => state.startLevel);
  const unlockedLevel = useGameStore((state) => state.unlockedLevel);
  const hearts = useGameStore((state) => state.hearts);
  const champion = useGameStore((state) => state.champion);
  const ngPlusCycle = useGameStore((state) => state.ngPlusCycle);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const startNewGamePlus = useGameStore((state) => state.startNewGamePlus);
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
  const [shopOpen, setShopOpen] = useState(false);
  const [encyclopediaOpen, setEncyclopediaOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [arsenalOpen, setArsenalOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const coins = useGameStore((state) => state.coins);

  if (shopOpen) return <GearShopScene onBack={() => { setShopOpen(false); window.dispatchEvent(new Event("ui-scene-open")); }} />;
  if (treeOpen) return <SkillTree onBack={() => setTreeOpen(false)} />;
  if (arsenalOpen) return <Arsenal onBack={() => setArsenalOpen(false)} />;
  if (equipmentOpen) return <EquipmentHub onBack={() => setEquipmentOpen(false)} onShop={() => setShopOpen(true)} onStages={() => {setEquipmentOpen(false);setLevelSelectOpen(true);}} onTree={() => setTreeOpen(true)} onArsenal={() => setArsenalOpen(true)} />;
  if (encyclopediaOpen) return <MonsterEncyclopedia onBack={() => setEncyclopediaOpen(false)} />;

  return (
    <main className="main-menu-shell">
      <div className="main-menu-speed-lines" aria-hidden="true" />
      {!levelSelectOpen && <div className="github-comic-bubble"><a href="https://github.com/medissl" target="_blank" rel="noreferrer">Checkout my github for more games!</a></div>}
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
                  setShopOpen(false);
                  setLevelSelectOpen(true);
                }}
              >
                <Play size={17} /> PLAY DREAM
              </button>

              {unlockedLevel >= 10 && champion && <button className="ng-plus-button" type="button" onClick={() => enterStageAfterCurtain(startNewGamePlus)}>
                NG+ (surprised u made it this far) · {champion.ready ? `LOOP ${champion.cycle + 1}` : `CONTINUE LOOP ${champion.cycle}`}
              </button>}

              <button
                type="button"
                onClick={() => setOptionsOpen((value) => !value)}
              >
                <SlidersHorizontal size={17} /> OPTIONS
              </button>

              <button type="button" onClick={readComic}>
                <BookOpen size={17} /> READ COMIC AGAIN
              </button>

              <button type="button" onClick={() => setEncyclopediaOpen(true)}>
                <BookOpen size={17} /> MONSTER ENCYCLOPEDIA
              </button>
              <button type="button" onClick={() => setArsenalOpen(true)}><Crosshair size={17}/> THE ARSENAL</button>
              <button type="button" onClick={() => setEquipmentOpen(true)}>✦ PLAYER EQUIPMENT</button>

              <a href="https://github.com/medissl" target="_blank" rel="noreferrer">
                <Github size={17} /> CREATOR ↗
              </a>
            </div>

            {optionsOpen && (
              <div className="main-menu-options">
                <FullscreenToggle />
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
                <ResetDataButton />
              </div>
            )}

            <div className="main-menu-note">
              <span>WASD</span> move · <span>1–4</span> weapons · <span>LMB</span> attack · <span>RMB</span> aim · <span>G</span> paper bomb · <span>F</span> magic
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
            <div className="stage-select__wallet">
              <span>HEARTS {"♥".repeat(hearts)}{"♡".repeat(5 - hearts)}</span>
              <span><b className="doodle-coin" aria-hidden="true">◉</b> {coins} COINS</span>
              <button type="button" onClick={() => { setShopOpen(true); window.dispatchEvent(new Event("ui-scene-open")); }}><ShoppingBag size={17} /> SHOP →</button>
            </div>
            <h2>CHOOSE<br />A STAGE</h2>
            <p className="stage-select__copy">
              Clear stages in order. Your cards and checkpoint carry forward when you return to the menu. A lost round spends a heart;
              losing all five resets the dream to Level 1.
            </p>

            <div className="stage-road">
              {LEVELS.map((level, index) => {
                const unlocked = ngPlusCycle === 0 && level.level === currentLevel && level.level <= unlockedLevel && !champion?.ready;
                const completed = level.level < currentLevel || (champion?.ready && level.level <= 10);
                return (
                  <button
                    key={level.level}
                    type="button"
                    className={`stage-node stage-node--${level.theme} ${unlocked ? "is-unlocked" : completed ? "is-completed" : "is-locked"}`}
                    style={{ "--stage-index": index } as React.CSSProperties}
                    disabled={!unlocked}
                    onClick={() => enterStageAfterCurtain(() => startLevel(level.level))}
                  >
                    <span className="stage-node__number">
                      {completed ? "✓" : unlocked ? level.level : <LockKeyhole size={16} />}
                    </span>
                    <span className="stage-node__text">
                      <strong>{level.name}</strong>
                      <small>{completed ? "COMPLETED" : level.difficulty}</small>
                    </span>
                  </button>
                );
              })}
              <span className="stage-road__line" aria-hidden="true" />
            </div>
          </div>
        )}
      </section>
      <small className="creator-credit creator-credit--menu">Made by Medianto Susilo</small>
    </main>
  );
}
