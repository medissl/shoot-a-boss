import { useCallback, useEffect, useRef, useState } from "react";

/** Normal enemies reveal their health for two seconds after each hit. */
export function useHitHealthBar() {
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);
  const reveal = useCallback(() => {
    setVisible(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { setVisible(false); timer.current = null; }, 2000);
  }, []);
  return { healthBarVisible: visible, revealHealthBar: reveal };
}
