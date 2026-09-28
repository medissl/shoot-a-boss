/** One visual and audio kit per theme, shared by all four weapon silhouettes. */
export const SKIN_THEMES = [
  {id:"inkspill",name:"Inkspill",rarity:"rare",color:"#203c87",accent:"#101a3d",motif:"nib",sound:"scratch"},
  {id:"classroom",name:"Classroom Chaos",rarity:"rare",color:"#ec6665",accent:"#f2c34b",motif:"ruler",sound:"paper"},
  {id:"caution",name:"Caution Tape",rarity:"rare",color:"#e3ad16",accent:"#242b40",motif:"hazard",sound:"metal"},
  {id:"papercraft",name:"Papercraft",rarity:"rare",color:"#b3daff",accent:"#2548b8",motif:"fold",sound:"paper"},
  {id:"arcade",name:"Arcade 1999",rarity:"rare",color:"#42d7ee",accent:"#e15ed2",motif:"pixel",sound:"digital"},
  {id:"office",name:"Office Supply",rarity:"rare",color:"#ee9350",accent:"#2548b8",motif:"clip",sound:"metal"},
  {id:"graffiti",name:"Graffiti Notebook",rarity:"rare",color:"#b368e7",accent:"#f35368",motif:"graffiti",sound:"scratch"},
  {id:"circuit",name:"Neon Circuit",rarity:"epic",color:"#23e3f1",accent:"#3557bd",motif:"circuit",sound:"electric"},
  {id:"frostbite",name:"Frostbite",rarity:"epic",color:"#8fecff",accent:"#417edc",motif:"ice",sound:"glass"},
  {id:"hellfire",name:"Hellfire Doodle",rarity:"epic",color:"#ff6736",accent:"#bb2f43",motif:"flame",sound:"fire"},
  {id:"toxic",name:"Toxic Lab",rarity:"epic",color:"#92f259",accent:"#367e77",motif:"vial",sound:"bubble"},
  {id:"stormbound",name:"Stormbound",rarity:"epic",color:"#96acff",accent:"#6747cf",motif:"storm",sound:"electric"},
  {id:"living",name:"The Living Sketch",rarity:"legendary",color:"#32bbeb",accent:"#2548b8",motif:"eye",sound:"scratch"},
  {id:"void",name:"Void Constellation",rarity:"legendary",color:"#a797ff",accent:"#172344",motif:"stars",sound:"space"},
  {id:"redacted",name:"The Redacted File",rarity:"legendary",color:"#ed5364",accent:"#171d35",motif:"redaction",sound:"glitch"},
] as const;
export type SkinTheme = typeof SKIN_THEMES[number];
export type SkinThemeId = SkinTheme["id"];
export type SkinId = "default" | SkinThemeId;
export type SkinRarity = SkinTheme["rarity"];
export const SKIN_IDS:SkinThemeId[] = SKIN_THEMES.map((theme)=>theme.id);
export const LEGACY_SKINS:Record<string,SkinThemeId>={blue:"inkspill",yellow:"classroom",green:"caution",pink:"papercraft",red:"arcade",orange:"office"};
export function normalizeSkin(value:unknown):SkinId|null{
  if(value==="default")return "default";
  if(typeof value!=="string")return null;
  if(value in LEGACY_SKINS)return LEGACY_SKINS[value];
  return SKIN_IDS.includes(value as SkinThemeId)?value as SkinThemeId:null;
}
export function getSkin(id:SkinId){return id==="default"?null:SKIN_THEMES.find((theme)=>theme.id===id)??null;}
export function skinColor(id:SkinId){return getSkin(id)?.color??"#2548b8";}
export function rollSkin(pool:SkinThemeId[],random=Math.random):SkinThemeId{
  const weights:Record<SkinRarity,number>={rare:70,epic:24,legendary:6};
  const weighted=pool.map((id)=>({id,weight:weights[getSkin(id)!.rarity]/SKIN_THEMES.filter((theme)=>theme.rarity===getSkin(id)!.rarity).length}));
  const total=weighted.reduce((sum,item)=>sum+item.weight,0);
  let draw=random()*total;
  for(const entry of weighted){draw-=entry.weight;if(draw<0)return entry.id;}
  return weighted[weighted.length-1].id;
}
