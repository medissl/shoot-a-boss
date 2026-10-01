type Status = { runId: number; freezeUntil: number; slowUntil: number; freezeImmuneUntil: number; slowImmuneUntil: number; slowFactor: number };
const statuses = new Map<string, Status>();
const delegated = new Map<string,{runId:number;until:number}>();
export function delegateEnemy(id:string,runId:number,durationMs=4000){delegated.set(id,{runId,until:performance.now()+durationMs});}

export function applyEnemyStatus(id: string, runId: number, freezeMs = 0, slowMs = 0, slowFactor = .48, slowImmunityMs = 0) {
  const previous = statuses.get(id);
  const now = performance.now();
  const sameRun = previous?.runId === runId;
  const canFreeze = freezeMs > 0 && (!sameRun || now >= (previous?.freezeImmuneUntil ?? 0));
  const canSlow = slowMs > 0 && (!sameRun || now >= (previous?.slowImmuneUntil ?? 0));
  statuses.set(id, {
    runId,
    freezeUntil: canFreeze ? now + freezeMs : sameRun ? previous?.freezeUntil ?? 0 : 0,
    freezeImmuneUntil: canFreeze ? now + 2700 : sameRun ? previous?.freezeImmuneUntil ?? 0 : 0,
    slowUntil: canSlow ? now + (canFreeze ? freezeMs : 0) + slowMs : sameRun ? previous?.slowUntil ?? 0 : 0,
    slowImmuneUntil: canSlow ? now + slowImmunityMs : sameRun ? previous?.slowImmuneUntil ?? 0 : 0,
    slowFactor: canSlow ? slowFactor : sameRun ? previous?.slowFactor ?? .48 : .48,
  });
}

export function enemyMotionFactor(id: string, runId: number) {
  const buff=delegated.get(id);
  const boost=buff?.runId===runId&&performance.now()<buff.until?1.15:1;
  const status = statuses.get(id);
  if (!status || status.runId !== runId) return boost;
  const now = performance.now();
  if (now < status.freezeUntil) return 0;
  if (now < status.slowUntil) return status.slowFactor*boost;
  if (now >= status.freezeImmuneUntil) statuses.delete(id);
  return boost;
}
