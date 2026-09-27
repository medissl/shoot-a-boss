type Status = { runId: number; freezeUntil: number; slowUntil: number; freezeImmuneUntil: number };
const statuses = new Map<string, Status>();

export function applyEnemyStatus(id: string, runId: number, freezeMs = 0, slowMs = 0) {
  const previous = statuses.get(id);
  const now = performance.now();
  const sameRun = previous?.runId === runId;
  const canFreeze = freezeMs > 0 && (!sameRun || now >= (previous?.freezeImmuneUntil ?? 0));
  statuses.set(id, {
    runId,
    freezeUntil: canFreeze ? now + freezeMs : sameRun ? previous?.freezeUntil ?? 0 : 0,
    freezeImmuneUntil: canFreeze ? now + 2700 : sameRun ? previous?.freezeImmuneUntil ?? 0 : 0,
    slowUntil: Math.max(sameRun ? previous?.slowUntil ?? 0 : 0, now + slowMs),
  });
}

export function enemyMotionFactor(id: string, runId: number) {
  const status = statuses.get(id);
  if (!status || status.runId !== runId) return 1;
  const now = performance.now();
  if (now < status.freezeUntil) return 0;
  if (now < status.slowUntil) return 0.48;
  if (now >= status.freezeImmuneUntil) statuses.delete(id);
  return 1;
}
