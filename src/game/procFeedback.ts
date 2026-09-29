const recent = new Map<string, number>();
export function emitCardProc(label: string, detail = "", cooldownMs = 750) {
  const now = performance.now();
  if (now - (recent.get(label) ?? -Infinity) < cooldownMs) return;
  recent.set(label, now);
  window.dispatchEvent(new CustomEvent("card-proc", { detail: { label, detail } }));
}
