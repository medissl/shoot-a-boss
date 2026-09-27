import { Crosshair, FileText, MousePointer2, Wind } from "lucide-react";
import { useGameStore } from "../game/store";

export function StartScreen() {
  const startGame = useGameStore((state) => state.startGame);

  return (
    <main className="menu-screen">
      <section className="menu-card">
        <p className="kicker">DREAM FPS / PROTOTYPE 01</p>
        <h1>Shoot a Boss</h1>
        <p className="menu-copy">
          You fell asleep at your desk. Now ten copies of your fictional cartoon
          boss are loose inside a paper-built office nightmare. Clear the dream
          before they punch your HP to zero.
        </p>

        <div className="mission-strip">
          <div><Crosshair size={20} /><span>10 boss copies</span></div>
          <div><FileText size={20} /><span>3 paper weapons</span></div>
          <div><Wind size={20} /><span>slide + boost movement</span></div>
        </div>

        <div className="menu-controls-preview">
          <span><b>WASD</b> move</span>
          <span><b>SHIFT</b> run</span>
          <span><b>C</b> crouch / slide</span>
          <span><b>SPACE</b> jump</span>
          <span><b>G</b> paper grenade</span>
          <span><b>1 2 3</b> weapons</span>
        </div>

        <div className="menu-actions">
          <button className="primary-button" type="button" onClick={startGame}>
            <MousePointer2 size={17} /> Enter the dream
          </button>
          <span>Desktop keyboard + mouse recommended. Click the arena to capture your mouse.</span>
        </div>
      </section>

      <aside className="menu-doodle" aria-hidden="true">
        <div className="scribble scribble--one" />
        <div className="scribble scribble--two" />
        <div className="dream-boss-preview">
          <div className="dream-boss-preview__head">!</div>
          <div className="dream-boss-preview__body"><span /></div>
        </div>
        <div className="paper-cloud paper-cloud--one">TPS REPORT</div>
        <div className="paper-cloud paper-cloud--two">URGENT</div>
      </aside>
    </main>
  );
}
