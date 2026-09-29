const slots = new Map<string, { runId: number; until: number }>();
let phase: "OPENING" | "SURGE" | "FINAL PUSH" = "OPENING";
export function setAttackPhase(next: typeof phase) { phase = next; }
export function claimAttack(id: string, runId: number, level: number, durationMs: number) {
  const now = performance.now();
  for (const [key, slot] of slots) if (slot.runId !== runId || slot.until <= now) slots.delete(key);
  if (slots.get(id)?.runId === runId) return true;
  const cap = (level <= 3 ? 2 : level <= 6 ? 3 : 4) + (phase !== "OPENING" && level >= 4 ? 1 : 0);
  if (slots.size >= cap) return false;
  slots.set(id, { runId, until: now + durationMs * (phase === "FINAL PUSH" ? .86 : 1) });
  return true;
}
