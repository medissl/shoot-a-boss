import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useGameStore } from "../game/store";

const PAGE_TURN_MS = 720;

export function SceneCurtain() {
  const screen = useGameStore((state) => state.screen);
  const previous = useRef(screen);
  const timer = useRef<number | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const turn = () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      setActive(true);
      timer.current = window.setTimeout(() => {
        setActive(false);
        timer.current = null;
      }, PAGE_TURN_MS);
    };
    window.addEventListener("ui-scene-open", turn);
    return () => {
      window.removeEventListener("ui-scene-open", turn);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (previous.current === screen) return;
    previous.current = screen;
    // The audio manager broadcasts this same event, so local menu panels and
    // full screen changes always use the identical curtain and sound timing.
    window.dispatchEvent(new Event("ui-scene-open"));
  }, [screen]);

  return active ? <div className="scene-curtain" role="status" aria-live="polite">
    <div className="scene-curtain__page"><span>SHOOT A BOSS</span><strong>TURNING<br />THE PAGE ✎</strong><i>///</i></div>
  </div> : null;
}
