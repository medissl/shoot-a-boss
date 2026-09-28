import { useEffect, useRef, useState } from "react";

const PAGE_TURN_MS = 720;

export function SceneCurtain() {
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

  return active ? <div className="scene-curtain" role="status" aria-live="polite">
    <div className="scene-curtain__page"><span>SHOOT A BOSS</span><strong>TURNING<br />THE PAGE ✎</strong><i>///</i></div>
  </div> : null;
}
