const slots = new Map<string, { runId: number; until: number; major: boolean; elite: boolean }>();
let phase: "OPENING" | "SURGE" | "FINAL PUSH" = "OPENING";
let eliteUntil = 0;
let dragonAttack = false;
let previousRunId = -1;
export function setDragonAttack(active: boolean) { dragonAttack = active; }
export function setAttackPhase(next: typeof phase) { phase = next; }
function cleanSlots(runId: number, now: number) {
  if (previousRunId !== runId) { previousRunId = runId; eliteUntil = 0; slots.clear(); }
  for (const [key, slot] of slots) if (slot.runId !== runId || slot.until <= now) slots.delete(key);
}
function capFor(level: number) { return Math.max(2, (level <= 3 ? 2 : level <= 9 ? 3 : 4) + (phase !== "OPENING" && level >= 4 && level <= 9 ? 1 : 0)); }
export function getAttackPressure(runId: number, level: number) {
  cleanSlots(runId, performance.now());
  return { active: slots.size, major: [...slots.values()].filter(slot => slot.major).length, cap: capFor(level) };
}
export function claimAttack(id: string, runId: number, level: number, durationMs: number) {
  const now = performance.now();
  cleanSlots(runId, now);
  if (dragonAttack) return false;
  if (slots.get(id)?.runId === runId) return true;
  const elite = /^(hr|auditor|director)-/.test(id);
  const major = elite || /^(statue|stapler|highlighter|shredder|clipboard)-/.test(id);
  if (!elite && eliteUntil > now) return false;
  if (elite && (slots.size > 1 || [...slots.values()].some(slot => slot.elite))) return false;
  if (major && [...slots.values()].filter(slot => slot.major).length >= (level >= 10 ? 2 : 1)) return false;
  if (slots.size >= capFor(level)) return false;
  slots.set(id, { runId, until: now + durationMs, major, elite });
  if (elite) eliteUntil = now + durationMs + 550;
  return true;
}
