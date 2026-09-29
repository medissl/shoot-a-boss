/** One authored material and motion identity per family. Each is rendered on four part maps. */
export const SKIN_THEMES = [
  {id:'inkspill',name:'Inkspill',rarity:'rare',color:'#3479bc',accent:'#0c2446',base:'#f0ead9',motif:'nib',sound:'ink',tag:'PRESSURE / INK'},
  {id:'classroom',name:'Classroom Chaos',rarity:'rare',color:'#f06656',accent:'#ebbd41',base:'#fff3c8',motif:'ruler',sound:'chalk',tag:'CHAOS / CHALK'},
  {id:'caution',name:'Hazard Workshop',rarity:'rare',color:'#f6c93b',accent:'#1c2531',base:'#bac2bd',motif:'hazard',sound:'metal',tag:'DANGER / STEEL'},
  {id:'papercraft',name:'Papercraft',rarity:'rare',color:'#b9e8f4',accent:'#4c6eb9',base:'#fffdf0',motif:'fold',sound:'paper',tag:'FOLDED / AIR'},
  {id:'arcade',name:'Arcade 1999',rarity:'rare',color:'#31dfdd',accent:'#eb58cd',base:'#263351',motif:'pixel',sound:'arcade',tag:'INSERT / COIN'},
  {id:'office',name:'Office Supply',rarity:'rare',color:'#f2a665',accent:'#3969a6',base:'#f3e7ce',motif:'clip',sound:'staple',tag:'FILE / STAMP'},
  {id:'graffiti',name:'Graffiti Notebook',rarity:'rare',color:'#df72e3',accent:'#f35d6d',base:'#f8eacb',motif:'graffiti',sound:'spray',tag:'SPRAY / TAG'},
  {id:'comic',name:'Comic Impact',rarity:'rare',color:'#f76d52',accent:'#2f58a9',base:'#fff2cd',motif:'comic',sound:'comic',tag:'POW / POP'},
  {id:'blueprint',name:'Blueprint Engineer',rarity:'rare',color:'#7bd6f8',accent:'#eafaff',base:'#18407f',motif:'blueprint',sound:'blueprint',tag:'DRAFT / MEASURE'},
  {id:'cassette',name:'Cassette Punk',rarity:'rare',color:'#f59e49',accent:'#59ded1',base:'#322b46',motif:'cassette',sound:'cassette',tag:'REWIND / RIOT'},
  {id:'circuit',name:'Neon Circuit',rarity:'epic',color:'#24f4ee',accent:'#d35df0',base:'#12283c',motif:'circuit',sound:'circuit',tag:'CHARGE / DATA'},
  {id:'frostbite',name:'Frostbite',rarity:'epic',color:'#b5f6ff',accent:'#549bd9',base:'#355b8c',motif:'ice',sound:'ice',tag:'CRYSTAL / VAPOR'},
  {id:'hellfire',name:'Hellfire Doodle',rarity:'epic',color:'#ff9a3e',accent:'#d43b35',base:'#302631',motif:'flame',sound:'fire',tag:'EMBER / ASH'},
  {id:'toxic',name:'Toxic Lab',rarity:'epic',color:'#a7fa53',accent:'#438b79',base:'#284d53',motif:'vial',sound:'toxic',tag:'VIAL / ACID'},
  {id:'stormbound',name:'Stormbound',rarity:'epic',color:'#d6e3ff',accent:'#8170e8',base:'#34446d',motif:'storm',sound:'storm',tag:'STATIC / THUNDER'},
  {id:'clockwork',name:'Clockwork Paradox',rarity:'epic',color:'#e9c783',accent:'#75d9db',base:'#544435',motif:'clock',sound:'clock',tag:'GEAR / TIME'},
  {id:'abyssal',name:'Abyssal Biolumen',rarity:'epic',color:'#5ff8d2',accent:'#7793ed',base:'#132b48',motif:'abyss',sound:'abyss',tag:'DEPTH / GLOW'},
  {id:'living',name:'The Living Sketch',rarity:'legendary',color:'#f2f5f0',accent:'#1e3658',base:'#e2edf2',motif:'eye',sound:'living',tag:'ALIVE / UNFINISHED'},
  {id:'void',name:'Void Constellation',rarity:'legendary',color:'#c1a5ff',accent:'#f4db9b',base:'#171433',motif:'stars',sound:'void',tag:'ORBIT / GRAVITY'},
  {id:'redacted',name:'The Redacted File',rarity:'legendary',color:'#ee5257',accent:'#1b202b',base:'#f0eee5',motif:'redaction',sound:'redacted',tag:'CLASSIFIED / ERASED'},
  {id:'prismatic',name:'Prismatic Fracture',rarity:'legendary',color:'#f1adf7',accent:'#85f9e4',base:'#33446c',motif:'prism',sound:'prism',tag:'REFRACT / SPLIT'},
  {id:'dragon',name:'Ink Dragon',rarity:'legendary',color:'#ef6872',accent:'#151d3a',base:'#eee3d2',motif:'dragon',sound:'dragon',tag:'SCALE / BREATH'},
] as const;
export type SkinTheme=typeof SKIN_THEMES[number];
export type SkinThemeId=SkinTheme['id'];
export type SkinId='default'|SkinThemeId;
export type SkinRarity=SkinTheme['rarity'];
export const SKIN_IDS:SkinThemeId[]=SKIN_THEMES.map(theme=>theme.id);
const savedAliases:Record<string,SkinThemeId>={blue:'inkspill',yellow:'classroom',green:'caution',pink:'papercraft',red:'arcade',orange:'office'};
export function normalizeSkin(value:unknown):SkinId|null{
  if(value==='default')return 'default';
  if(typeof value!=='string')return null;
  return savedAliases[value]??(SKIN_IDS.includes(value as SkinThemeId)?value as SkinThemeId:null);
}
export function getSkin(id:SkinId){return id==='default'?null:SKIN_THEMES.find(theme=>theme.id===id)??null;}
export function skinColor(id:SkinId){return getSkin(id)?.color??'#2548b8';}
export function rollSkin(pool:SkinThemeId[],random=Math.random):SkinThemeId{
  const weight:Record<SkinRarity,number>={rare:70,epic:24,legendary:6};
  const entries=pool.map(id=>({id,weight:weight[getSkin(id)!.rarity]/SKIN_THEMES.filter(theme=>theme.rarity===getSkin(id)!.rarity).length}));
  const sum=entries.reduce((n,entry)=>n+entry.weight,0);let draw=random()*sum;
  for(const entry of entries){draw-=entry.weight;if(draw<0)return entry.id;}
  return entries[entries.length-1].id;
}
