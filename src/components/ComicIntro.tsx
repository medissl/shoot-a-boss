import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "../game/store";

type StoryScene =
  | { kind: "panel"; panel: 1 | 2 | 3 | 4 | 5 | 6; duration: number }
  | { kind: "later"; duration: number }
  | { kind: "shock"; duration: number };

const SCENES: StoryScene[] = [
  { kind: "panel", panel: 1, duration: 3600 },
  { kind: "panel", panel: 2, duration: 3600 },
  { kind: "panel", panel: 3, duration: 3600 },
  { kind: "panel", panel: 4, duration: 3800 },
  { kind: "later", duration: 2400 },
  { kind: "panel", panel: 5, duration: 3800 },
  { kind: "shock", duration: 850 },
  { kind: "panel", panel: 6, duration: 3600 },
];

function panelNumber(scene: StoryScene) {
  if (scene.kind === "panel") return scene.panel;
  if (scene.kind === "later") return 4;
  return 6;
}

export function ComicIntro({ mode }: { mode: "launch" | "reader" }) {
  const startGame = useGameStore((state) => state.startGame);
  const goToMenu = useGameStore((state) => state.goToMenu);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  const finishing = useRef(false);
  const scene = SCENES[sceneIndex];

  const panel = useMemo(
    () => (scene.kind === "panel" ? scene.panel : null),
    [scene],
  );

  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    setExiting(true);
    window.setTimeout(() => {
      if (mode === "reader") goToMenu();
      else startGame();
    }, 720);
  }, [goToMenu, mode, startGame]);

  function advance() {
    if (finishing.current) return;
    if (sceneIndex >= SCENES.length - 1) {
      finish();
      return;
    }
    setSceneIndex((current) => current + 1);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (sceneIndex >= SCENES.length - 1) {
        finish();
      } else {
        setSceneIndex((current) => current + 1);
      }
    }, scene.duration);

    return () => window.clearTimeout(timer);
  }, [finish, scene.duration, sceneIndex]);

  return (
    <main
      className={`story-shell ${exiting ? "is-blackout" : ""} story-scene--${scene.kind}`}
    >
      <header className="story-header">
        <span>SHOOT A BOSS / ISSUE 01</span>
        <strong>{String(panelNumber(scene)).padStart(2, "0")} / 06</strong>
      </header>

      <button
        type="button"
        className="story-stage"
        onClick={advance}
        aria-label="Advance opening comic"
      >
        {panel && (
          <div className={`story-panel-card story-panel-card--${panel}`}>
            <img
              src={`/comicopening${panel}.png`}
              alt={`Shoot a Boss opening comic panel ${panel}`}
            />
            <span className="story-panel-card__paper" />
          </div>
        )}

        {scene.kind === "later" && (
          <div className="story-later" aria-label="30 minutes later">
            <div className="story-clock" aria-hidden="true">
              <span className="story-clock__hand story-clock__hand--hour" />
              <span className="story-clock__hand story-clock__hand--minute" />
              <span className="story-clock__center" />
              <strong className="story-clock__twelve">12</strong>
              {Array.from({ length: 12 }, (_, index) => (
                <i
                  key={index}
                  style={{ "--tick": index } as React.CSSProperties}
                />
              ))}
            </div>
            <p>30 minutes later...</p>
          </div>
        )}

        {scene.kind === "shock" && (
          <div className="story-shock" aria-label="A sudden dream shock">
            <div className="story-shock__burst" />
            <div className="story-shock__kanji">!</div>
            <span>WAKE UP.</span>
          </div>
        )}
      </button>

      <footer className="story-footer">
        <span>
          {scene.kind === "later"
            ? "time keeps crawling..."
            : scene.kind === "shock"
              ? "something is wrong."
              : mode === "reader"
                ? "click anywhere to continue reading"
                : "click anywhere to continue"}
        </span>
        <button type="button" onClick={finish}>
          {mode === "reader" ? "BACK TO MENU" : "SKIP → DREAM"}
        </button>
      </footer>

      <div className="story-blackout" />
    </main>
  );
}
