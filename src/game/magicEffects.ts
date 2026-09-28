import { applyEnemyStatus } from "./effects";
import { magicStats, type Element } from "./magicTree";
import { useGameStore } from "./store";

type Effect={kind:Element;id:string;runId:number;rank:number;until:number;nextTick:number;lastPosition:[number,number,number]|null;spreadLeft:number};
type Trail={position:[number,number,number];until:number;runId:number;damage:number;radius:number;owner:string;lastHit:Record<string,number>};
type Pool={position:[number,number,number];until:number;runId:number;radius:number;damage:number;nextTick:number};
const effects=new Map<string,Effect>();
const trails:Trail[]=[];const pools:Pool[]=[];let lastTick=0;
const state=()=>useGameStore.getState();
const distance=(a:[number,number,number],b:[number,number,number])=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function hit(id:string,damage:number){const live=state();window.dispatchEvent(new CustomEvent("boss-hit",{detail:{id,damage:Math.round(damage*(1+live.gear.arcana*.06+live.upgrades.magicPower*.15)),part:"body",magic:true}}));}
const link=(from:[number,number,number],to:[number,number,number],color:string)=>window.dispatchEvent(new CustomEvent("magic-link",{detail:{from,to,color}}));
function splash(rank:number,position:[number,number,number],exclude:string|null,power:number){
  const live=state(),stats=magicStats("water",rank,live.magicChoices),radius=4.4+stats.craft*.42+stats.milestone*.35;
  const nearby:string[]=[];
  for(const [id,point] of Object.entries(live.enemyPositions)) if(id!==exclude&&!live.eliminated.includes(id)&&distance(point,position)<radius){hit(id,stats.damage*power);nearby.push(id);}
  if(stats.milestone){
    const far=Object.entries(live.enemyPositions).filter(([id,p])=>id!==exclude&&!nearby.includes(id)&&!live.eliminated.includes(id)&&distance(p,position)<radius+5+stats.milestone)
      .sort((a,b)=>distance(a[1],position)-distance(b[1],position)).slice(0,stats.milestone>=4?3:stats.milestone>=2?2:1);
    for(const [id,p] of far){hit(id,stats.damage*.34);link(position,p,"#72dfff");}
  }
}
export function magicHit(kind:Element,rank:number,id:string,position:[number,number,number]){
  const live=state();if(live.eliminated.includes(id))return;
  const stats=magicStats(kind,rank,live.magicChoices),now=performance.now();
  hit(id,stats.damage);if(live.upgrades.magicEcho)hit(id,stats.damage*.3);
  if(kind==="water"){
    if(live.upgrades.waterHealing)useGameStore.setState((s)=>({hp:Math.min(s.maxHp,s.hp+8)}));
    splash(rank,position,id,.42);return;
  }
  if(kind==="ice"){
    const freeze=2400+stats.craft*260+stats.milestone*280;
    applyEnemyStatus(id,live.runId,freeze,stats.milestone?3000+stats.milestone*450+stats.craft*250:0);
    const nearby=Object.entries(live.enemyPositions).filter(([other,p])=>other!==id&&!live.eliminated.includes(other)&&distance(p,position)<7);
    if(stats.milestone>=3||live.upgrades.iceBarrier){
      for(const [other,p] of nearby.slice(0,stats.milestone>=4?2:1)){applyEnemyStatus(other,live.runId,stats.milestone>=3?freeze*.55:0,live.upgrades.iceBarrier?2500:0);link(position,p,"#83ebff");}
    }
  }
  if(kind==="thunder"){
    const shock=(target:string,bonus:number)=>{if(Math.random()<Math.min(.92,.62+stats.craft*.07+stats.milestone*.04))applyEnemyStatus(target,live.runId,1450+stats.craft*250+stats.milestone*200);if(target!==id)hit(target,stats.damage*bonus);};
    shock(id,1);
    if(stats.milestone||live.upgrades.thunderSpark){
      let origin=position;const used=new Set([id]);const count=stats.milestone>=4?3:stats.milestone>=2?2:1;
      for(let i=0;i<count;i++){const next=Object.entries(live.enemyPositions).filter(([other,p])=>!used.has(other)&&!live.eliminated.includes(other)&&distance(p,origin)<6.5+stats.milestone).sort((a,b)=>distance(a[1],origin)-distance(b[1],origin))[0];if(!next)break;shock(next[0],.42+stats.milestone*.06);link(origin,next[1],"#ffe850");used.add(next[0]);origin=next[1];}
    }
  }
  if(kind==="fire"&&stats.milestone)pools.push({position,runId:live.runId,until:now+4000+(stats.milestone-1)*500+(live.upgrades.fireBloom?2000:0),radius:2.7+stats.craft*.23+stats.milestone*.28,damage:Math.round((8+rank*.75+stats.craft*1.4)*(live.upgrades.fireBloom?1.2:1)),nextTick:now+500});
  effects.set(id,{kind,id,rank,runId:live.runId,until:now+(kind==="ice"?2400+stats.craft*260+stats.milestone*280:kind==="crystal"?5000+stats.craft*350+(stats.milestone>=3?1800:0):kind==="thunder"?2000+stats.craft*200:5000+stats.craft*180),
    nextTick:now+500,lastPosition:null,spreadLeft:kind==="crystal"?stats.milestone>=4?3:stats.milestone>=2?2:stats.milestone?1:0:kind==="fire"&&stats.milestone>=3?1:0});
}
export function magicSplash(kind:Element,rank:number,position:[number,number,number]){if(kind==="water")splash(rank,position,null,.52);}
export function tickMagic(){
  const live=state(),now=performance.now();if(live.screen!=="playing"||now-lastTick<140)return;lastTick=now;
  for(let i=trails.length-1;i>=0;i--)if(trails[i].until<now||trails[i].runId!==live.runId)trails.splice(i,1);
  for(let i=pools.length-1;i>=0;i--){const p=pools[i];if(p.until<now||p.runId!==live.runId){pools.splice(i,1);continue;}if(now<p.nextTick)continue;p.nextTick=now+550;for(const [id,q] of Object.entries(live.enemyPositions))if(!live.eliminated.includes(id)&&Math.hypot(q[0]-p.position[0],q[2]-p.position[2])<p.radius)hit(id,p.damage);}
  for(const [id,e] of effects){if(e.runId!==live.runId||now>=e.until||live.eliminated.includes(id)){effects.delete(id);continue;}if(now<e.nextTick)continue;e.nextTick=now+550;const point=live.enemyPositions[id];if(!point)continue;const stats=magicStats(e.kind,e.rank,live.magicChoices);
    if(e.kind==="fire"){hit(id,9+e.rank*1.2+stats.craft*2);if(e.spreadLeft>0){const next=Object.entries(live.enemyPositions).find(([other,p])=>other!==id&&!live.eliminated.includes(other)&&!effects.has(other)&&distance(point,p)<3.3);if(next){e.spreadLeft--;effects.set(next[0],{...e,id:next[0],until:now+2500,spreadLeft:0,lastPosition:null});link(point,next[1],"#ff602a");}}}
    if(e.kind==="thunder")hit(id,5+e.rank*.5+stats.craft);
    if(e.kind==="crystal"&&(!e.lastPosition||Math.hypot(e.lastPosition[0]-point[0],e.lastPosition[2]-point[2])>.75)){trails.push({position:[...point],until:e.until,runId:live.runId,damage:Math.round((6+e.rank*.7+stats.craft*1.7)*(1+stats.milestone*.1)*(live.upgrades.crystalThorns?1.25:1)),radius:1.3+stats.milestone*.17,owner:id,lastHit:{}});if(trails.length>65)trails.shift();e.lastPosition=[...point];}
  }
  for(const t of trails)for(const [id,p] of Object.entries(live.enemyPositions)){
    if(live.eliminated.includes(id)||Math.hypot(p[0]-t.position[0],p[2]-t.position[2])>t.radius||now-(t.lastHit[id]??0)<750)continue;
    t.lastHit[id]=now;hit(id,t.damage);const owner=effects.get(t.owner);
    if(owner?.kind==="crystal"&&id!==t.owner&&owner.spreadLeft>0&&!effects.has(id)){owner.spreadLeft--;effects.set(id,{...owner,id,spreadLeft:owner.spreadLeft>0?1:0,until:Math.min(owner.until,now+4300),nextTick:now+450,lastPosition:null});link(t.position,p,"#b87bff");}
  }
}
export const magicVisuals=()=>[...effects.values()].filter(e=>e.runId===state().runId).map(({id,kind,rank})=>({id,kind,rank}));
export const magicTrails=()=>trails.filter(t=>t.runId===state().runId);
export const magicPools=()=>pools.filter(p=>p.runId===state().runId);
export function magicTint(id:string):string|null{const e=effects.get(id);if(!e||e.runId!==state().runId||performance.now()>=e.until)return null;return {fire:"#fa4a32",crystal:"#a55cea",ice:"#61c8ef",water:"#458fff",thunder:"#ffe443"}[e.kind];}
