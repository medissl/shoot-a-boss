import { useState } from "react";
import { useGameStore } from "../game/store";
import { useTouchMode } from "../game/touch";

export function ControlsList() {
  const touch = useTouchMode();
  if (touch) return <div className="controls-list">
    <div><b>LEFT PAD</b><span>Analog movement and climb</span></div>
    <div><b>RIGHT SIDE</b><span>Swipe to look around</span></div>
    <div><b>FIRE / AIM</b><span>Drag FIRE to aim · tap SCOPE to toggle · sniper fires on release</span></div>
    <div><b>RUN LOCK</b><span>Swipe up past the left pad after holding, tap the pad to stop</span></div>
    <div><b>JUMP / SLIDE</b><span>Circle buttons near fire</span></div>
    <div><b>WEAPON BAR</b><span>Pick sniper, rifle, shotgun, or knife</span></div>
    <div><b>BOMB / RELOAD / MARK / ZIP</b><span>Grenade, reload, Q mark, or jungle zipline</span></div>
    <div><b>MAGIC</b><span>Cast your equipped spell when ready</span></div>
    <div><b>Ⅱ</b><span>Pause and check cards</span></div>
  </div>;
  return <div className="controls-list">
    <div><b>W A S D</b><span>Move</span></div>
    <div><b>SHIFT</b><span>Sprint</span></div>
    <div><b>SPACE</b><span>Jump / climb</span></div>
    <div><b>C</b><span>Crouch / slide while moving</span></div>
    <div><b>1–4 / WHEEL</b><span>Change weapon</span></div>
    <div><b>I</b><span>Inspect your equipped weapon skin</span></div>
    <div><b>MOUSE</b><span>Look · left shoot · right aim</span></div>
    <div><b>R / G</b><span>Reload / paper bomb</span></div>
    <div><b>E / SHIFT+E</b><span>Jungle zipline forward / back</span></div>
    <div><b>Q</b><span>Mark an enemy with a yellow diamond (30s cooldown)</span></div>
    <div><b>F</b><span>Cast your equipped spell</span></div>
    <div><b>ESC / P</b><span>Pause / see cards · P keeps Chrome fullscreen open</span></div>
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
      <p>LEVEL 1 · FIRST SHIFT</p><h2>START YOUR DREAM</h2>
      <div className="controls-list">{touch ? <><div><b>MOVE</b><span>Left pad</span></div><div><b>AIM</b><span>Swipe the right side</span></div><div><b>SHOOT</b><span>Tap FIRE</span></div><div><b>RELOAD</b><span>Tap the reload icon</span></div><div><b>SWITCH</b><span>Tap a weapon in the bar</span></div></> : <><div><b>MOVE</b><span>W A S D</span></div><div><b>AIM</b><span>Mouse / hold right button</span></div><div><b>SHOOT</b><span>Left mouse button</span></div><div><b>RELOAD</b><span>R</span></div><div><b>SWITCH</b><span>1–4 or mouse wheel</span></div></>}</div>
      <strong>{touch ? "TAP ANYWHERE TO START" : "CLICK ANYWHERE TO START"}</strong>
    </div>
  </div>;
}
