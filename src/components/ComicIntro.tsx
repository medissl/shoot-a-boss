import { useState } from "react";
import { useGameStore } from "../game/store";

const BLUE = "#2548b8";
const PALE = "#eef1ff";
const PAPER = "#fbfaf4";

function DoodleDefs() {
  return (
    <defs>
      <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
        <line x1="0" y1="0" x2="0" y2="10" stroke={BLUE} strokeWidth="2" opacity=".34" />
      </pattern>
      <filter id="rough">
        <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="1" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" />
      </filter>
    </defs>
  );
}

function StickWorker({ x = 270, y = 140, asleep = false }: { x?: number; y?: number; asleep?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) ${asleep ? "rotate(72)" : ""}`} filter="url(#rough)">
      <circle cx="0" cy="0" r="34" fill={PAPER} stroke={BLUE} strokeWidth="6" />
      <path d="M-18 -10 Q0 -28 20 -8" fill="none" stroke={BLUE} strokeWidth="6" strokeLinecap="round" />
      <line x1="-12" y1="5" x2="-2" y2="5" stroke={BLUE} strokeWidth="5" strokeLinecap="round" />
      <line x1="10" y1="5" x2="20" y2="5" stroke={BLUE} strokeWidth="5" strokeLinecap="round" />
      <path d="M-9 20 Q3 13 14 20" fill="none" stroke={BLUE} strokeWidth="4" />
      <line x1="0" y1="35" x2="0" y2="125" stroke={BLUE} strokeWidth="8" strokeLinecap="round" />
      <line x1="0" y1="62" x2="-48" y2="92" stroke={BLUE} strokeWidth="7" strokeLinecap="round" />
      <line x1="0" y1="62" x2="50" y2="88" stroke={BLUE} strokeWidth="7" strokeLinecap="round" />
      <line x1="0" y1="124" x2="-34" y2="178" stroke={BLUE} strokeWidth="8" strokeLinecap="round" />
      <line x1="0" y1="124" x2="37" y2="178" stroke={BLUE} strokeWidth="8" strokeLinecap="round" />
    </g>
  );
}

function FatBoss({ x = 560, y = 120, pointing = false }: { x?: number; y?: number; pointing?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} filter="url(#rough)">
      <circle cx="0" cy="0" r="46" fill={PAPER} stroke={BLUE} strokeWidth="7" />
      <path d="M-27 -17 L-7 -9 M8 -9 L28 -17" stroke={BLUE} strokeWidth="6" strokeLinecap="round" />
      <circle cx="-15" cy="0" r="4.5" fill={BLUE} />
      <circle cx="15" cy="0" r="4.5" fill={BLUE} />
      <path d="M-17 24 Q0 10 18 24" fill="none" stroke={BLUE} strokeWidth="5" />
      <ellipse cx="0" cy="112" rx="78" ry="85" fill={PALE} stroke={BLUE} strokeWidth="7" />
      <path d="M0 52 L-14 78 L0 128 L14 78 Z" fill="url(#hatch)" stroke={BLUE} strokeWidth="5" />
      <line x1="-55" y1="78" x2={pointing ? -125 : -92} y2={pointing ? 42 : 124} stroke={BLUE} strokeWidth="12" strokeLinecap="round" />
      <line x1="55" y1="78" x2={pointing ? 128 : 92} y2={pointing ? 46 : 124} stroke={BLUE} strokeWidth="12" strokeLinecap="round" />
      <line x1="-28" y1="186" x2="-35" y2="240" stroke={BLUE} strokeWidth="13" strokeLinecap="round" />
      <line x1="28" y1="186" x2="35" y2="240" stroke={BLUE} strokeWidth="13" strokeLinecap="round" />
    </g>
  );
}

function Desk() {
  return (
    <g stroke={BLUE} strokeWidth="6" fill="none" filter="url(#rough)">
      <path d="M95 325 H690" />
      <path d="M135 325 V430 M650 325 V430" />
      <rect x="130" y="205" width="210" height="112" fill={PAPER} />
      <line x1="235" y1="317" x2="235" y2="337" />
      <line x1="190" y1="337" x2="280" y2="337" />
    </g>
  );
}

function PaperPile() {
  return (
    <g transform="translate(350 140)" filter="url(#rough)">
      {Array.from({ length: 10 }, (_, i) => (
        <rect
          key={i}
          x={i % 2 ? 8 : 0}
          y={170 - i * 15}
          width="170"
          height="54"
          fill={PAPER}
          stroke={BLUE}
          strokeWidth="5"
          transform={`rotate(${i % 2 ? 1.5 : -1.3} 80 ${170 - i * 15})`}
        />
      ))}
    </g>
  );
}

function PanelArt({ index }: { index: number }) {
  return (
    <svg viewBox="0 0 800 500" className="story-panel__svg" role="img" aria-label={`Story panel ${index + 1}`}>
      <DoodleDefs />
      <rect width="800" height="500" fill={PAPER} />
      <g opacity=".2" stroke={BLUE} strokeWidth="2">
        {Array.from({ length: 10 }, (_, i) => (
          <line key={i} x1="0" y1={45 + i * 45} x2="800" y2={45 + i * 45} />
        ))}
      </g>

      {index === 0 && (
        <>
          <Desk />
          <StickWorker x={470} y={155} />
          <text x="70" y="74" fill={BLUE} fontSize="34" fontWeight="800">9:47 PM</text>
          <text x="76" y="115" fill={BLUE} fontSize="22">still working.</text>
          <path d="M560 85 Q610 45 670 78" fill="none" stroke={BLUE} strokeWidth="4" strokeDasharray="8 8" />
        </>
      )}

      {index === 1 && (
        <>
          <StickWorker x={210} y={170} />
          <FatBoss x={580} y={125} pointing />
          <path d="M390 88 Q480 20 665 52 Q731 68 704 135 Q666 166 604 146" fill={PAPER} stroke={BLUE} strokeWidth="6" />
          <text x="430" y="78" fill={BLUE} fontSize="24" fontWeight="900">WHY IS THIS</text>
          <text x="430" y="108" fill={BLUE} fontSize="24" fontWeight="900">STILL NOT DONE?!</text>
        </>
      )}

      {index === 2 && (
        <>
          <Desk />
          <StickWorker x={205} y={170} />
          <FatBoss x={650} y={115} />
          <PaperPile />
          <text x="365" y="90" fill={BLUE} fontSize="54" fontWeight="1000" transform="rotate(-7 365 90)">THUD!</text>
        </>
      )}

      {index === 3 && (
        <>
          <g transform="translate(400 250) scale(2.2)">
            <StickWorker x={0} y={-20} />
          </g>
          <path d="M255 316 Q400 355 545 315" fill="url(#hatch)" stroke={BLUE} strokeWidth="6" />
          <text x="610" y="420" fill={BLUE} fontSize="30" fontWeight="800">...sure.</text>
        </>
      )}

      {index === 4 && (
        <>
          <Desk />
          <g transform="translate(385 300) rotate(76)">
            <StickWorker x={0} y={0} asleep />
          </g>
          <text x="570" y="120" fill={BLUE} fontSize="58" fontWeight="900" transform="rotate(-8 570 120)">Z Z Z</text>
          <path d="M0 0 L800 500 M800 0 L0 500" stroke={BLUE} strokeWidth="3" opacity=".12" />
        </>
      )}

      {index === 5 && (
        <>
          <g stroke={BLUE} fill="none" opacity=".35">
            {Array.from({ length: 9 }, (_, i) => (
              <path key={i} d={`M400 270 L${70 + i * 86} 500`} strokeWidth="3" />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <ellipse key={i} cx="400" cy="270" rx={100 + i * 82} ry={35 + i * 35} strokeWidth="3" />
            ))}
          </g>
          <StickWorker x={400} y={245} />
          <g transform="translate(-60 90) scale(.62)"><FatBoss x={250} y={130} pointing /></g>
          <g transform="translate(420 60) scale(.7)"><FatBoss x={250} y={130} /></g>
          <g transform="translate(110 -20) scale(.48)"><FatBoss x={580} y={125} /></g>
          <text x="70" y="78" fill={BLUE} fontSize="34" fontWeight="1000">THE DREAM CLOCKS IN.</text>
        </>
      )}
    </svg>
  );
}

const CAPTIONS = [
  "Everyone left hours ago. You didn't.",
  "Then the boss comes back.",
  "One more 'five minute' task.",
  "You have no thoughts left.",
  "The spreadsheet finally wins.",
  "The office follows you into the dream.",
];

export function ComicIntro() {
  const startGame = useGameStore((state) => state.startGame);
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  function finishStory() {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(() => startGame(), 620);
  }

  function advance() {
    if (index >= CAPTIONS.length - 1) {
      finishStory();
      return;
    }
    setIndex((current) => current + 1);
  }

  return (
    <main className={`story-shell ${exiting ? "is-blackout" : ""}`}>
      <div className="story-rule story-rule--top" />
      <div className="story-rule story-rule--bottom" />

      <header className="story-header">
        <span>SHOOT A BOSS / ISSUE 01</span>
        <strong>{String(index + 1).padStart(2, "0")} / 06</strong>
      </header>

      <section className="story-carousel" onClick={advance} aria-label="Opening comic story">
        {CAPTIONS.map((caption, panelIndex) => {
          const offset = panelIndex - index;
          const stateClass = offset === 0 ? "is-active" : offset < 0 ? "is-before" : "is-after";
          return (
            <article
              className={`story-panel ${stateClass}`}
              style={{ "--offset": offset } as React.CSSProperties}
              key={caption}
              aria-hidden={offset !== 0}
            >
              <div className="story-panel__frame">
                <PanelArt index={panelIndex} />
              </div>
              <div className="story-panel__caption">
                <span>{String(panelIndex + 1).padStart(2, "0")}</span>
                <p>{caption}</p>
              </div>
            </article>
          );
        })}
      </section>

      <footer className="story-footer">
        <span>click panel / press next</span>
        <button type="button" onClick={advance}>
          {index === CAPTIONS.length - 1 ? "ENTER DREAM →" : "NEXT →"}
        </button>
      </footer>

      <div className="story-blackout" />
    </main>
  );
}
