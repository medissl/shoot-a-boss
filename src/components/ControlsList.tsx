import { useState } from "react";
import { useGameStore } from "../game/store";

export function ControlsList() {
  return <div className="controls-list">
    <div><b>W A S D</b><span>Move</span></div>
    <div><b>SHIFT</b><span>Sprint</span></div>
    <div><b>SPACE</b><span>Jump / climb</span></div>
    <div><b>C</b><span>Crouch / slide while moving</span></div>
    <div><b>1–4 / WHEEL</b><span>Change weapon</span></div>
    <div><b>MOUSE</b><span>Look · left shoot · right aim</span></div>
    <div><b>R / G</b><span>Reload / paper bomb</span></div>
    <div><b>E / SHIFT+E</b><span>Jungle zipline forward / back</span></div>
    <div><b>Q</b><span>Mark an enemy with a yellow diamond (30s cooldown)</span></div>
    <div><b>ESC</b><span>Pause / see card inventory</span></div>
  </div>;
}

export function ControlsPopup() {
  const open = useGameStore((s) => s.tutorialOpen);
  const close = useGameStore((s) => s.closeTutorial);
  const [closing, setClosing] = useState(false);
  const dismiss = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(close, 260);
  };
  if (!open) return null;
  return <div className={`controls-popup ${closing ? "is-closing" : ""}`} onClick={dismiss} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === "Escape") dismiss(); }}>
    <div className="controls-popup__card">
      <p>LEVEL 1 · FIRST SHIFT</p><h2>THE CONTROLS</h2><ControlsList />
      <strong>CLICK ANYWHERE TO START</strong>
    </div>
  </div>;
}
