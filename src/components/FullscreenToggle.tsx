import { useEffect, useState } from "react";
import { Expand, Minimize } from "lucide-react";

export function FullscreenToggle() {
  const [fullscreen, setFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const [error, setError] = useState(false);

  useEffect(() => {
    const update = () => { setFullscreen(Boolean(document.fullscreenElement)); setError(false); };
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const toggle = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setError(true);
    }
  };

  return <div className="fullscreen-setting">
    <button type="button" onClick={() => { void toggle(); }} disabled={!document.fullscreenEnabled && !fullscreen}>
      {fullscreen ? <Minimize size={16} /> : <Expand size={16} />}
      {fullscreen ? "WINDOWED MODE" : "FULLSCREEN MODE"}
    </button>
    {error && <small>Fullscreen is unavailable in this browser.</small>}
  </div>;
}
