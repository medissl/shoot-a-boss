export const ELEMENTS = ["fire", "crystal", "ice", "water", "thunder"] as const;
export type Element = typeof ELEMENTS[number];
export type Branch = "force" | "tempo" | "craft";
export type MagicChoices = Record<Element, Record<number, Branch>>;
export const emptyMagicChoices = (): MagicChoices => ({fire:{},crystal:{},ice:{},water:{},thunder:{}});
export const magicCost = (tier:number) => tier <= 5 ? 1 : tier <= 10 ? 2 : tier <= 15 ? 3 : 4;
export const isMilestone = (tier:number) => tier > 1 && tier % 5 === 0;
export const ELEMENT_DESIGN:Record<Element,{base:number;cooldown:number;perTier:number;identity:string;craft:string;milestones:string[]}> = {
  fire:{base:190,cooldown:30,perTier:10,identity:"Heavy impact, five-second burn.",craft:"Hotter burn and wider fire pools.",milestones:["Impact leaves a burning circle.","Fire circles grow and last longer.","Burn spreads to a nearby enemy.","A wider final firestorm."]},
  crystal:{base:155,cooldown:25,perTier:8,identity:"Footsteps cut through crowds.",craft:"Sharper, longer-lasting crystal trails.",milestones:["Enemies stepping on trails leave another trail.","Trails branch to more enemies.","Shards linger longer and reach farther.","Another trail branch joins the cascade."]},
  ice:{base:90,cooldown:24,perTier:5,identity:"Less damage, reliable freeze.",craft:"Longer freeze and thaw slow.",milestones:["Thawed enemies remain slowed.","Freeze and slow last longer.","Freeze catches a nearby enemy.","Chill spreads to two enemies."]},
  water:{base:145,cooldown:22,perTier:8,identity:"Good impact; weaker area splash.",craft:"Wider splashes hit more enemies.",milestones:["One splash seeks an enemy beyond the radius.","Two seeking splashes.","Seeking splashes travel farther.","A third splash seeks a new enemy."]},
  thunder:{base:165,cooldown:26,perTier:9,identity:"Strong impact and paralysis chance.",craft:"Better paralysis odds and duration.",milestones:["Electricity chains to one enemy.","Chain reaches a second enemy.","Farther and stronger chain.","Chain reaches a third enemy."]},
};
export function magicStats(kind:Element,rank:number,choices:MagicChoices){
  const d=ELEMENT_DESIGN[kind]; let force=0,tempo=0,craft=0;
  for(let tier=2;tier<=rank;tier++){if(isMilestone(tier))continue;const b=choices[kind]?.[tier]??"force";if(b==="force")force++;if(b==="tempo")tempo++;if(b==="craft")craft++;}
  return {damage:Math.round((d.base+(rank-1)*d.perTier)*(1+force*.045)),cooldown:Math.max(({fire:18,crystal:15,ice:16,water:14,thunder:16})[kind],+(d.cooldown-(rank-1)*.55-tempo*1.3).toFixed(1)),craft,milestone:Math.floor(rank/5)};
}
export function magicNodeDetail(kind:Element,tier:number,branch:Branch){
  const d=ELEMENT_DESIGN[kind];
  if(tier===1)return `Learn ${kind} magic. ${d.identity}`;
  if(isMilestone(tier))return d.milestones[tier/5-1];
  return branch==="force"?`+4.5% impact damage and +${d.perTier} base damage.`:branch==="tempo"?"-1.3 seconds of additional cooldown.":d.craft;
}
