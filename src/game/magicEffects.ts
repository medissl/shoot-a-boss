import { applyEnemyStatus } from "./effects";
import { magicDamage, type MagicType, useGameStore } from "./store";

type Effect = { kind: MagicType; id: string; runId: number; rank: number; until: number; nextTick: number; lastPosition: [number,number,number] | null };
const effects = new Map<string, Effect>();
const trails: {position:[number,number,number];until:number;runId:number;damage:number}[] = [];
const hit = (id: string, damage: number) => window.dispatchEvent(new CustomEvent("boss-hit", { detail: {id,damage,part:"body",magic:true} }));
export function magicHit(kind: MagicType, rank: number, id: string, position: [number,number,number]) {
  const state = useGameStore.getState();
  if (state.eliminated.includes(id)) return;
  hit(id, magicDamage(rank));
  const now = performance.now();
  if (kind === "water") {
    for (const [other, point] of Object.entries(state.enemyPositions)) {
      if (other !== id && !state.eliminated.includes(other) && Math.hypot(point[0]-position[0], point[1]-position[1],point[2]-position[2]) < 5 + rank * .12) hit(other, Math.round(magicDamage(rank) * .55));
    }
    return;
  }
  if (kind === "ice") applyEnemyStatus(id, state.runId, 3000 + rank * 180);
  if (kind === "thunder" && Math.random() < Math.min(.9, .35 + rank * .025)) applyEnemyStatus(id, state.runId, 1500 + rank * 120);
  effects.set(id, {kind,id,rank,runId:state.runId, until:now+(kind === "ice" ? 3000+rank*180 : kind === "crystal" ? 5000+rank*180 : kind === "thunder" ? 1800+rank*120 : 5000+rank*80),nextTick:now+500,lastPosition:null});
}
export function magicSplash(kind: MagicType, rank: number, position: [number,number,number]) {
  if (kind !== "water") return;
  const state = useGameStore.getState();
  for (const [id, point] of Object.entries(state.enemyPositions)) if (!state.eliminated.includes(id) && Math.hypot(point[0]-position[0],point[1]-position[1],point[2]-position[2]) < 5 + rank*.12) hit(id, Math.round(magicDamage(rank)*.65));
}
export function tickMagic() {
  const state = useGameStore.getState(); const now = performance.now();
  if (state.screen !== "playing") return;
  for (let i=trails.length-1;i>=0;i--) if (trails[i].until < now || trails[i].runId !== state.runId) trails.splice(i,1);
  for (const [id, effect] of effects) {
    if (effect.runId !== state.runId || now >= effect.until || state.eliminated.includes(id)) {effects.delete(id); continue;}
    if (now < effect.nextTick) continue;
    effect.nextTick = now + 500;
    const point = state.enemyPositions[id];
    if (!point) continue;
    if (effect.kind === "fire") hit(id, 10 + effect.rank * 4);
    if (effect.kind === "thunder") hit(id, 7 + effect.rank * 3);
    if (effect.kind === "crystal") {
      const trail = effect.lastPosition ?? point;
      if (Math.hypot(trail[0]-point[0],trail[2]-point[2]) > .55 || !effect.lastPosition) trails.push({position:[point[0],point[1],point[2]],until:effect.until,runId:state.runId,damage:7+effect.rank*3});
      for (const crystal of trails) for (const [other, otherPoint] of Object.entries(state.enemyPositions)) if (!state.eliminated.includes(other) && Math.hypot(otherPoint[0]-crystal.position[0], otherPoint[2]-crystal.position[2]) < 1.5) hit(other, crystal.damage);
      effect.lastPosition = point;
    }
  }
}
export function magicVisuals() {return [...effects.values()].filter((e) => e.runId === useGameStore.getState().runId).map(({id,kind,rank}) => ({id,kind,rank}));}
export function magicTrails() {return trails.filter((trail) => trail.runId === useGameStore.getState().runId);}
export function magicTint(id: string): string | null {
  const effect = effects.get(id);
  if (!effect || effect.runId !== useGameStore.getState().runId || performance.now() >= effect.until) return null;
  return {fire:"#fa4a32",crystal:"#a55cea",ice:"#61c8ef",water:"#458fff",thunder:"#ffe443"}[effect.kind];
}
