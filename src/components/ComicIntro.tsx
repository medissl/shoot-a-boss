import { useState } from "react";
import { ArrowRight, SkipForward } from "lucide-react";
import { useGameStore } from "../game/store";

type Panel = {
  caption: string;
  speech?: string;
  className: string;
  label: string;
};

const PANELS: Panel[] = [
  {
    caption: "9:47 PM. Everyone left hours ago.",
    className: "comic-scene--desk",
    label: "An exhausted office worker sits alone at a desk under a harsh lamp.",
  },
  {
    caption: "Then the footsteps arrive.",
    speech: "WHY IS THIS REPORT STILL NOT DONE?!",
    className: "comic-scene--scold",
    label: "A round, angry cartoon boss points at the exhausted worker.",
  },
  {
    caption: "One more tiny task.",
    speech: "SHOULD ONLY TAKE FIVE MINUTES.",
    className: "comic-scene--paperwork",
    label: "The boss drops an absurd tower of paperwork onto the worker's desk.",
  },
  {
    caption: "Five minutes later.",
    className: "comic-scene--closeup",
    label: "Close-up of the worker staring forward with exhausted eyes.",
  },
  {
    caption: "The spreadsheet wins.",
    className: "comic-scene--sleep",
    label: "The worker falls asleep face-first on the desk while the office fades away.",
  },
  {
    caption: "...and the office follows him into the dream.",
    speech: "TEN COPIES. ZERO DEADLINES.",
    className: "comic-scene--dream",
    label: "The worker appears in a surreal paper arena surrounded by ten boss copies.",
  },
];

function Worker({ close = false }: { close?: boolean }) {
  return (
    <div className={close ? "comic-worker comic-worker--close" : "comic-worker"} aria-hidden="true">
      <div className="comic-worker__hair" />
      <div className="comic-worker__head">
        <span className="comic-eye comic-eye--left" />
        <span className="comic-eye comic-eye--right" />
        <span className="comic-mouth" />
      </div>
      {!close && (
        <>
          <div className="comic-worker__body" />
          <div className="comic-worker__arm" />
        </>
      )}
    </div>
  );
}

function Boss({ small = false }: { small?: boolean }) {
  return (
    <div className={small ? "comic-boss comic-boss--small" : "comic-boss"} aria-hidden="true">
      <div className="comic-boss__head">
        <span className="comic-boss__brow comic-boss__brow--left" />
        <span className="comic-boss__brow comic-boss__brow--right" />
        <span className="comic-boss__eye comic-boss__eye--left" />
        <span className="comic-boss__eye comic-boss__eye--right" />
        <span className="comic-boss__mouth" />
      </div>
      <div className="comic-boss__body">
        <span className="comic-boss__tie" />
      </div>
      <div className="comic-boss__arm" />
    </div>
  );
}

function PaperStack() {
  return (
    <div className="comic-paper-stack" aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} style={{ transform: `translate(${index % 2 ? 4 : -3}px, ${-index * 11}px) rotate(${index % 2 ? 1.2 : -1.5}deg)` }} />
      ))}
    </div>
  );
}

function PanelArt({ panelIndex }: { panelIndex: number }) {
  if (panelIndex === 0) {
    return (
      <>
        <div className="comic-desk" />
        <div className="comic-monitor">Q4_FINAL_v19.xlsx</div>
        <Worker />
        <div className="comic-clock">9:47</div>
      </>
    );
  }

  if (panelIndex === 1) {
    return (
      <>
        <Worker />
        <Boss />
        <div className="comic-action-lines" />
      </>
    );
  }

  if (panelIndex === 2) {
    return (
      <>
        <div className="comic-desk" />
        <Worker />
        <Boss small />
        <PaperStack />
        <div className="comic-sfx">THUD!</div>
      </>
    );
  }

  if (panelIndex === 3) {
    return (
      <>
        <Worker close />
        <div className="comic-eye-bags" />
        <div className="comic-thought">...sure.</div>
      </>
    );
  }

  if (panelIndex === 4) {
    return (
      <>
        <div className="comic-desk" />
        <div className="comic-sleeper"><Worker /></div>
        <div className="comic-zzz">Z Z Z</div>
        <div className="comic-vignette" />
      </>
    );
  }

  return (
    <>
      <div className="comic-dream-grid" />
      <div className="comic-dream-worker"><Worker /></div>
      {Array.from({ length: 5 }, (_, index) => (
        <div className={`comic-dream-boss comic-dream-boss--${index + 1}`} key={index}>
          <Boss small />
        </div>
      ))}
      <div className="comic-sfx comic-sfx--dream">CLICK.</div>
    </>
  );
}

export function ComicIntro() {
  const showMenu = useGameStore((state) => state.showMenu);
  const [visiblePanels, setVisiblePanels] = useState(1);
  const done = visiblePanels >= PANELS.length;
  const progress = `${visiblePanels} / ${PANELS.length}`;

  function next() {
    if (done) {
      showMenu();
      return;
    }
    setVisiblePanels((current) => Math.min(PANELS.length, current + 1));
  }

  return (
    <main className="comic-intro">
      <header className="comic-intro__header">
        <div>
          <p className="kicker">SHOOT A BOSS / ISSUE #01</p>
          <h1>Another normal workday.</h1>
        </div>
        <div className="comic-intro__meta">
          <span>{progress}</span>
          <button type="button" className="text-button" onClick={showMenu}>
            <SkipForward size={16} /> Skip intro
          </button>
        </div>
      </header>

      <section className="comic-grid" aria-label="Opening comic">
        {PANELS.map((panel, index) => (
          <article
            key={panel.className}
            className={`comic-panel ${panel.className} ${index < visiblePanels ? "is-visible" : ""}`}
            aria-hidden={index >= visiblePanels}
          >
            <div className="comic-panel__number">0{index + 1}</div>
            <div className="comic-panel__art" role="img" aria-label={panel.label}>
              <PanelArt panelIndex={index} />
            </div>
            {panel.speech && <div className="comic-speech">{panel.speech}</div>}
            <p>{panel.caption}</p>
          </article>
        ))}
      </section>

      <footer className="comic-intro__footer">
        <p>{done ? "The dream is loaded. Clock out." : "Reveal the next panel."}</p>
        <button type="button" className="primary-button" onClick={next}>
          {done ? "Enter the dream" : "Next panel"} <ArrowRight size={17} />
        </button>
      </footer>
    </main>
  );
}
