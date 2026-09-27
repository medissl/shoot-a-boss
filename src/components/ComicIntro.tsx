import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../game/store";

const BEAT_MS = 1180;
const LAST_BEAT = 5;

export function ComicIntro() {
  const startGame = useGameStore((state) => state.startGame);
  const [beat, setBeat] = useState(0);
  const [exiting, setExiting] = useState(false);
  const finishing = useRef(false);

  function finish() {
    if (finishing.current) return;
    finishing.current = true;
    setExiting(true);
    window.setTimeout(() => startGame(), 680);
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBeat((current) => {
        if (current >= LAST_BEAT) {
          window.clearInterval(timer);
          window.setTimeout(finish, 520);
          return current;
        }
        return current + 1;
      });
    }, BEAT_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main
      className={`story-shell story-shell--image ${exiting ? "is-blackout" : ""}`}
      onClick={finish}
    >
      <header className="story-header">
        <span>SHOOT A BOSS / ISSUE 01</span>
        <strong>{String(beat + 1).padStart(2, "0")} / 06</strong>
      </header>

      <section className="story-page-stage" aria-label="Opening comic">
        <div className={`story-page story-page--beat-${beat}`}>
          <img src="/comicopening.png" alt="Six-panel Shoot a Boss opening comic" />
          <div className="story-page__ink-glow" />
        </div>
      </section>

      <footer className="story-footer">
        <span>the page is pulling you into the dream...</span>
        <button type="button" onClick={(event) => { event.stopPropagation(); finish(); }}>
          SKIP → DREAM
        </button>
      </footer>

      <div className="story-blackout" />
    </main>
  );
}
