import { useState } from "react";
import { useGameStore } from "../game/store";
import { useTouchMode } from "../game/touch";

export function ControlsList() {
  const touch = useTouchMode();
  if (touch) return <div className="controls-list">
    <div><b>LEFT PAD</b><span>Analog movement and climb</span></div>
    <div><b>RIGHT SIDE</b><span>Swipe to look around</span></div>
    <div><b>FIRE / AIM</b><span>Hold to shoot / use scope</span></div>
    <div><b>JUMP / SLIDE / RUN</b><span>Movement actions</span></div>
    <div><b>WEAPON BAR</b><span>Pick sniper, rifle, shotgun, or knife</span></div>
    <div><b>BOMB / RELOAD / MARK / ZIP</b><span>Grenade, reload, Q mark, or jungle zipline</span></div>
    <div><b>Ⅱ</b><span>Pause and check cards</span></div>
  </div>;
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
  const touch = useTouchMode();
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
      <strong>{touch ? "TAP ANYWHERE TO START" : "CLICK ANYWHERE TO START"}</strong>
    </div>
  </div>;
}
