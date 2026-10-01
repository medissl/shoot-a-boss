export const ELEMENTS = ["fire", "crystal", "ice", "water", "thunder"] as const;
export type Element = typeof ELEMENTS[number];
export type Branch = "force" | "tempo" | "craft";
export type MagicChoices = Record<Element, Record<number, Branch>>;
export const emptyMagicChoices = (): MagicChoices => ({fire:{},crystal:{},ice:{},water:{},thunder:{}});
export const magicCost = (tier:number) => tier <= 5 ? 1 : tier <= 10 ? 2 : tier <= 15 ? 3 : 4;
export const isMilestone = (tier:number) => tier > 1 && tier % 5 === 0;
export const ELEMENT_DESIGN:Record<Element,{base:number;cooldown:number;perTier:number;identity:string;craft:string;milestones:string[]}> = {
  fire:{base:190,cooldown:30,perTier:10,identity:"Inferno Orb: impact, burn, and a fire zone.",craft:"Hotter burn and wider fire zones.",milestones:["SCORCHED GROUND · Impact leaves a longer burning zone.","FIREBURST · Impact splashes nearby enemies.","INFERNO TRAIL · Orb paints a short burning path.","FINAL INFERNO · Fire zone flares once as it expires."]},
  crystal:{base:155,cooldown:25,perTier:8,identity:"Crystal Prison: ground shards restrict an area.",craft:"Stronger prison slow and sharper shards.",milestones:["SHARD PRISON · Enemies stay slowed longer.","FRACTURE · Prison shatters for a small delayed burst.","BRANCHING FORMATION · Secondary clusters grow nearby.","CRYSTAL DOMAIN · Wider prison pulses with shard damage."]},
  ice:{base:90,cooldown:24,perTier:5,identity:"Glacial Eruption: ground spikes freeze and slow.",craft:"Longer freeze and thaw slow.",milestones:["DEEP FREEZE · Freeze lasts slightly longer.","FROST RING · Outer ice spikes nick nearby enemies.","PERMAFROST · A short-lived slow field remains.","GLACIAL FAULT · A second smaller eruption moves forward."]},
  water:{base:145,cooldown:22,perTier:8,identity:"Rain Cloud: sustained rainfall over an area.",craft:"Wider rain and slightly stronger splashes.",milestones:["HEAVY RAIN · Cloud lasts longer with denser rain.","SPLASH ZONE · Rain hits splash near their targets.","MOVING FRONT · Cloud drifts a short way toward its target.","MONSOON · Wider cloud releases one final rain burst."]},
  thunder:{base:165,cooldown:26,perTier:9,identity:"Judgement Bolt: vertical strike and chain lightning.",craft:"Better paralysis odds and duration.",milestones:["CHAIN REACTION · Bolt chains to one more enemy.","AFTERSHOCK · Strike releases a smaller delayed pulse.","STORM NETWORK · Chains reach farther and retain power.","JUDGEMENT STORM · Two nearby targets take smaller bolts."]},
};
export function magicStats(kind:Element,rank:number,choices:MagicChoices){
  const d=ELEMENT_DESIGN[kind]; let force=0,tempo=0,craft=0;
  for(let tier=2;tier<=rank;tier++){if(isMilestone(tier))continue;const b=choices[kind]?.[tier]??"force";if(b==="force")force++;if(b==="tempo")tempo++;if(b==="craft")craft++;}
  return {damage:Math.round((d.base+(rank-1)*d.perTier)*(1+force*.045)),cooldown:Math.max(({fire:18,crystal:15,ice:16,water:14,thunder:16})[kind],+(d.cooldown-(rank-1)*.55-tempo*1.3).toFixed(1)),craft,milestone:Math.floor(rank/5)};
}
export function adjustedMagicCooldown(kind: Element, rank: number, choices: MagicChoices, reduction: number) {
  return Math.max(ELEMENT_DESIGN[kind].cooldown * .45, magicStats(kind,rank,choices).cooldown * (1 - Math.min(.35,Math.max(0,reduction))));
}
export function magicNodeDetail(kind:Element,tier:number,branch:Branch){
  const d=ELEMENT_DESIGN[kind];
  if(tier===1)return `Learn ${kind} magic. ${d.identity}`;
  if(isMilestone(tier))return d.milestones[tier/5-1];
  return branch==="force"?`+4.5% impact damage and +${d.perTier} base damage.`:branch==="tempo"?"-1.3 seconds of additional cooldown.":d.craft;
}
