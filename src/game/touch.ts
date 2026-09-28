import { useEffect, useState } from "react";

export const touchInput = { x: 0, y: 0, sprint: false };

export function isTouchMode() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

export function useTouchMode() {
  const [touch, setTouch] = useState(isTouchMode);
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const update = () => setTouch(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return touch;
}
