const slots = new Map<string, { runId: number; until: number }>();
export function claimAttack(id: string, runId: number, level: number, durationMs: number) {
  const now = performance.now();
  for (const [key, slot] of slots) if (slot.runId !== runId || slot.until <= now) slots.delete(key);
  if (slots.get(id)?.runId === runId) return true;
  const cap = level <= 3 ? 2 : level <= 6 ? 3 : 4;
  if (slots.size >= cap) return false;
  slots.set(id, { runId, until: now + durationMs });
  return true;
}
