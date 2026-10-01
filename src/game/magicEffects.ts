import { applyEnemyStatus } from "./effects";
import { magicStats, type Element } from "./magicTree";
import { equippedGearRank, useGameStore } from "./store";

type Effect={kind:Element;id:string;runId:number;rank:number;until:number;nextTick:number;lastPosition:[number,number,number]|null;spreadLeft:number};
type Trail={position:[number,number,number];until:number;runId:number;damage:number;radius:number;owner:string;lastHit:Record<string,number>};
type Pool={position:[number,number,number];until:number;runId:number;radius:number;damage:number;nextTick:number;finalFlare:boolean};
const effects=new Map<string,Effect>();
const trails:Trail[]=[];const pools:Pool[]=[];let lastTick=0;
const state=()=>useGameStore.getState();
const distance=(a:[number,number,number],b:[number,number,number])=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function hit(id:string,damage:number){const live=state();window.dispatchEvent(new CustomEvent("boss-hit",{detail:{id,damage:Math.round(damage*(1+equippedGearRank(live,"arcana")*.03+live.upgrades.magicPower*.10)),part:"body",magic:true}}));}
const link=(from:[number,number,number],to:[number,number,number],color:string)=>window.dispatchEvent(new CustomEvent("magic-link",{detail:{from,to,color}}));
function near(position:[number,number,number],radius:number){const live=state();return Object.entries(live.enemyPositions).filter(([id,p])=>!live.eliminated.includes(id)&&Math.hypot(p[0]-position[0],p[2]-position[2])<radius&&Math.abs(p[1]-position[1])<5);}
function fireZone(rank:number,position:[number,number,number],scale=1){const live=state(),stats=magicStats("fire",rank,live.magicChoices),now=performance.now();pools.push({position:[position[0],0,position[2]],runId:live.runId,until:now+(stats.milestone>=1?4100:3500)+(live.upgrades.fireBloom?1500:0),radius:(2.4+stats.craft*.23+(stats.milestone>=1?.35:0))*scale,damage:Math.round((8+rank*.75+stats.craft*1.4)*(live.upgrades.fireBloom?1.15:1)*scale),nextTick:now+500,finalFlare:stats.milestone>=4&&scale===1});if(pools.length>24)pools.shift();}
export function magicFireTrail(rank:number,position:[number,number,number]){if(rank<15)return;const live=state(),now=performance.now();pools.push({position:[position[0],0,position[2]],runId:live.runId,until:now+1600,radius:1.1,damage:Math.round(3+rank*.25),nextTick:now+500,finalFlare:false});if(pools.length>24)pools.shift();}
export function magicHit(kind:Element,rank:number,id:string,position:[number,number,number],overtime=false){
  const live=state();if(live.eliminated.includes(id))return;
  const stats=magicStats(kind,rank,live.magicChoices),now=performance.now();
  hit(id,stats.damage);if(live.upgrades.magicEcho)hit(id,stats.damage*.25);
  if(kind==="water"){
    if(live.upgrades.waterHealing)useGameStore.setState((s)=>({hp:Math.min(s.maxHp,s.hp+6)}));
    if(overtime)for(const [other] of near(position,4.4))if(other!==id)hit(other,stats.damage*.18);
    return;
  }
  if(kind==="ice"){
    const freeze=1100+stats.craft*100+(rank>=5?200:0);
    applyEnemyStatus(id,live.runId,freeze,rank>=15?2200+stats.craft*250:0);
    const nearby=Object.entries(live.enemyPositions).filter(([other,p])=>other!==id&&!live.eliminated.includes(other)&&distance(p,position)<7);
    if(live.upgrades.iceBarrier||overtime){
      for(const [other,p] of nearby.slice(0,overtime?2:1)){applyEnemyStatus(other,live.runId,overtime?freeze*.55:0,live.upgrades.iceBarrier?2500:0);link(position,p,"#83ebff");}
    }
  }
  if(kind==="thunder"){
    const shock=(target:string,bonus:number)=>{if(Math.random()<Math.min(.92,.62+stats.craft*.07+stats.milestone*.04))applyEnemyStatus(target,live.runId,1450+stats.craft*250+stats.milestone*200);if(target!==id)hit(target,stats.damage*bonus);};
    shock(id,1);
    if(stats.milestone||live.upgrades.thunderSpark||overtime){
      let origin=position;const used=new Set([id]);const count=(rank>=5?1:0)+(overtime?1:0)+(rank<5&&live.upgrades.thunderSpark?1:0);
      for(let i=0;i<count;i++){const next=Object.entries(live.enemyPositions).filter(([other,p])=>!used.has(other)&&!live.eliminated.includes(other)&&distance(p,origin)<(rank>=15?9:6.5)).sort((a,b)=>distance(a[1],origin)-distance(b[1],origin))[0];if(!next)break;shock(next[0],rank>=15?.55:.42);link(origin,next[1],"#ffe850");used.add(next[0]);origin=next[1];}
      if(rank>=20)for(const [other,p] of near(position,8).filter(([other])=>!used.has(other)).slice(0,2)){shock(other,.24);link(position,p,"#fff59e");used.add(other);}
    }
  }
  if(kind==="fire"){
    fireZone(rank,position);
    if(rank>=10)for(const [other,p] of near(position,3.5).filter(([other])=>other!==id)){hit(other,stats.damage*.18);link(position,p,"#ff7135");}
  }
  if(kind==="fire"||kind==="crystal")effects.set(id,{kind,id,rank,runId:live.runId,until:now+(kind==="crystal"?5000+stats.craft*350:5000+stats.craft*180),nextTick:now+500,lastPosition:null,spreadLeft:kind==="crystal"?(overtime?1:0):0});
}
export function magicSplash(kind:Element,rank:number,position:[number,number,number]){
  if(kind==="fire"){
    const live=state(),stats=magicStats(kind,rank,live.magicChoices);
    fireZone(rank,position);
    if(rank>=10)for(const [id,p] of near(position,3.5)){hit(id,stats.damage*.18);link(position,p,"#ff7135");}
  }
}
export function magicAreaPulse(kind:Exclude<Element,"fire"|"thunder">,rank:number,position:[number,number,number],first:boolean){
  const live=state(),stats=magicStats(kind,rank,live.magicChoices);
  const radius=kind==="water"?4.5+(rank>=20?.8:0):kind==="ice"?5.2:4.8+(rank>=20?.7:0);
  const nearby=near(position,radius);
  for(const [id,p] of nearby){
    hit(id,stats.damage*(kind==="water"?.17:kind==="crystal"&&!first?.08:1));
    if(kind==="water"&&rank>=10)for(const [other] of near(p,1.6).filter(([other])=>other!==id))hit(other,stats.damage*.035);
    if(first&&kind==="ice")applyEnemyStatus(id,live.runId,1100+stats.craft*100+(rank>=5?200:0),rank>=15?2300:0);
    if(first&&kind==="crystal")applyEnemyStatus(id,live.runId,1750+stats.craft*90,rank>=5?1800:1100);
    if(!first&&kind==="crystal")applyEnemyStatus(id,live.runId,0,500,.7);
  }
  if(kind==="ice"&&first&&rank>=10)for(const [id,p] of near(position,7).filter(([,p])=>Math.hypot(p[0]-position[0],p[2]-position[2])>radius)){hit(id,stats.damage*.2);link(position,p,"#9ceaff");}
  if(kind==="crystal"&&first) for(let i=0;i<(rank>=15?10:7);i++){
    const a=i*Math.PI*2/(rank>=15?10:7),ring=i>=7?4.1:2.8;
    trails.push({position:[position[0]+Math.cos(a)*ring,.08,position[2]+Math.sin(a)*ring],until:performance.now()+3500,runId:live.runId,damage:Math.round(6+rank*.7),radius:1.2,owner:"prison",lastHit:{}});
  }
  if(kind==="water"&&first&&live.upgrades.waterHealing)useGameStore.setState(s=>({hp:Math.min(s.maxHp,s.hp+6)}));
}
export function magicMilestonePulse(kind:Element,rank:number,position:[number,number,number]){
  const live=state(),stats=magicStats(kind,rank,live.magicChoices);
  if(kind==="thunder"&&rank>=10)for(const [id,p] of near(position,3.4)){hit(id,stats.damage*.22);link(position,p,"#fff59e");}
  if(kind==="water"&&rank>=20)for(const [id,p] of near(position,5.3)){hit(id,stats.damage*.32);link(position,p,"#7dd8ff");}
  if(kind==="ice"&&rank>=20)for(const [id,p] of near(position,3.1)){hit(id,stats.damage*.36);applyEnemyStatus(id,live.runId,450,1500);link(position,p,"#a4efff");}
  if(kind==="crystal"&&rank>=10)for(const [id,p] of near(position,5)){hit(id,stats.damage*.23);link(position,p,"#d4a6ff");}
}
export function magicSlowField(position:[number,number,number],runId:number){const live=state();if(live.runId!==runId)return;for(const [id] of near(position,5.2))applyEnemyStatus(id,runId,0,900,.7);}
export function tickMagic(){
  const live=state(),now=performance.now();if(live.screen!=="playing"||now-lastTick<140)return;lastTick=now;
  for(let i=trails.length-1;i>=0;i--)if(trails[i].until<now||trails[i].runId!==live.runId)trails.splice(i,1);
  for(let i=pools.length-1;i>=0;i--){const p=pools[i];if(p.until<now||p.runId!==live.runId){if(p.runId===live.runId&&p.finalFlare)for(const [id,q] of near(p.position,p.radius+1)){hit(id,p.damage*2);link(p.position,q,"#ff9139");}pools.splice(i,1);continue;}if(now<p.nextTick)continue;p.nextTick=now+550;for(const [id,q] of Object.entries(live.enemyPositions))if(!live.eliminated.includes(id)&&Math.hypot(q[0]-p.position[0],q[2]-p.position[2])<p.radius)hit(id,p.damage);}
  for(const [id,e] of effects){if(e.runId!==live.runId||now>=e.until||live.eliminated.includes(id)){effects.delete(id);continue;}if(now<e.nextTick)continue;e.nextTick=now+550;const point=live.enemyPositions[id];if(!point)continue;const stats=magicStats(e.kind,e.rank,live.magicChoices);
    if(e.kind==="fire")hit(id,9+e.rank*1.2+stats.craft*2);
    if(e.kind==="thunder")hit(id,5+e.rank*.5+stats.craft);
    if(e.kind==="crystal"&&(!e.lastPosition||Math.hypot(e.lastPosition[0]-point[0],e.lastPosition[2]-point[2])>.75)){trails.push({position:[...point],until:e.until,runId:live.runId,damage:Math.round((6+e.rank*.7+stats.craft*1.7)*(live.upgrades.crystalThorns?1.2:1)),radius:1.3,owner:id,lastHit:{}});if(trails.length>65)trails.shift();e.lastPosition=[...point];}
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
