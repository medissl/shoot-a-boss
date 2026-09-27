export type UpgradeId =
  | "damage" | "accuracy" | "movement" | "reload" | "magazine" | "jump"
  | "maxHp" | "fireRate" | "grenadePower" | "knifeDamage" | "secondWind" | "bombBelt"
  | "sniperFire" | "sniperFocus" | "sniperPierce" | "sniperBolt"
  | "rifleFreeze" | "riflePrecision" | "rifleOverclock" | "riflePower"
  | "shotgunPellets" | "shotgunChoke" | "shotgunSlow" | "shotgunClose"
  | "recon" | "sniperTwin" | "rifleSurge" | "shotgunDouble" | "ironWill";
export type UpgradeLevels = Record<UpgradeId, number>;
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type UpgradeCard = {
  id: UpgradeId; name: string; description: string; glyph: string;
  rarity: Rarity; maxStacks: number; weapon?: "sniper" | "rifle" | "shotgun";
};

export const UPGRADE_CARDS: UpgradeCard[] = [
  { id:"damage", name:"RED INK", description:"+10% weapon damage. −3% movement speed per stack.", glyph:"✦", rarity:"common", maxStacks:3 },
  { id:"accuracy", name:"STEADY HAND", description:"14% tighter spread per stack.", glyph:"◎", rarity:"common", maxStacks:3 },
  { id:"movement", name:"RUNNING LATE", description:"+9% movement speed, −5 maximum HP per stack.", glyph:"➜", rarity:"common", maxStacks:3 },
  { id:"reload", name:"QUICK HANDS", description:"13% faster reloads per stack.", glyph:"↻", rarity:"common", maxStacks:3 },
  { id:"magazine", name:"DEEP POCKETS", description:"+16% magazine capacity, 5% slower reloads per stack.", glyph:"▤", rarity:"common", maxStacks:3 },
  { id:"jump", name:"SPRING SHOES", description:"+15% jump power per stack.", glyph:"↑", rarity:"common", maxStacks:3 },
  { id:"maxHp", name:"THICK SKIN", description:"+18 maximum HP, −3% movement speed per stack.", glyph:"♥", rarity:"common", maxStacks:3 },
  { id:"fireRate", name:"TRIGGER FINGER", description:"8% shorter firing cooldown, −4% damage per stack.", glyph:"⚡", rarity:"rare", maxStacks:2 },
  { id:"grenadePower", name:"BIGGER MESS", description:"+22% paper bomb damage and radius per stack.", glyph:"◉", rarity:"rare", maxStacks:2 },
  { id:"knifeDamage", name:"PAPER CUT", description:"+35% knife damage per stack.", glyph:"╱", rarity:"common", maxStacks:3 },
  { id:"secondWind", name:"SECOND WIND", description:"Heal 8 HP after a kill, −10 maximum HP.", glyph:"+", rarity:"rare", maxStacks:1 },
  { id:"bombBelt", name:"BOMB BELT", description:"+1 maximum paper bomb and refill immediately.", glyph:"○", rarity:"rare", maxStacks:2 },
  { id:"sniperFire", name:"BURNING INK", description:"Sniper hits burn for 4 seconds; sniper reloads 20% slower.", glyph:"♨", rarity:"epic", maxStacks:1, weapon:"sniper" },
  { id:"sniperFocus", name:"DEADLINE FOCUS", description:"+20% aimed sniper damage; −12% movement while holding sniper.", glyph:"⌖", rarity:"rare", maxStacks:1, weapon:"sniper" },
  { id:"sniperPierce", name:"THROUGH THE PAGE", description:"Sniper pierces one additional enemy at 65% damage.", glyph:"⇥", rarity:"epic", maxStacks:1, weapon:"sniper" },
  { id:"sniperBolt", name:"FAST BOLT", description:"18% faster sniper follow-up; −10% sniper damage.", glyph:"↻", rarity:"rare", maxStacks:1, weapon:"sniper" },
  { id:"rifleFreeze", name:"COLD CALL", description:"Rifle hits briefly freeze enemies; −10% rifle damage.", glyph:"❄", rarity:"epic", maxStacks:1, weapon:"rifle" },
  { id:"riflePrecision", name:"FINE PRINT", description:"22% tighter rifle spread per stack.", glyph:"◎", rarity:"common", maxStacks:2, weapon:"rifle" },
  { id:"rifleOverclock", name:"OVERTIME", description:"12% faster rifle fire; −9% rifle damage.", glyph:"⚡", rarity:"rare", maxStacks:1, weapon:"rifle" },
  { id:"riflePower", name:"RED STAPLES", description:"+18% rifle damage; +12% rifle spread.", glyph:"✦", rarity:"rare", maxStacks:1, weapon:"rifle" },
  { id:"shotgunPellets", name:"EXTRA STAPLES", description:"+2 pellets per shotgun blast; +12% spread.", glyph:"⁙", rarity:"rare", maxStacks:1, weapon:"shotgun" },
  { id:"shotgunChoke", name:"TIGHT BINDING", description:"25% tighter shotgun spread; −12% shotgun damage.", glyph:"⌾", rarity:"common", maxStacks:1, weapon:"shotgun" },
  { id:"shotgunSlow", name:"HEAVY PAGES", description:"Shotgun hits slow enemies for 2 seconds; −10% shotgun damage.", glyph:"◆", rarity:"epic", maxStacks:1, weapon:"shotgun" },
  { id:"shotgunClose", name:"POINT BLANK", description:"+25% shotgun damage within 6 meters; −10% beyond.", glyph:"✹", rarity:"rare", maxStacks:1, weapon:"shotgun" },
  { id:"recon", name:"ALL HANDS REPORT", description:"Q reveals ALL surviving enemies for 10 seconds, once every 30 seconds.", glyph:"◈", rarity:"epic", maxStacks:1 },
  { id:"sniperTwin", name:"TWIN SIGNATURE", description:"Sniper fires a second round at the same target for 65% damage. −20% sniper fire rate.", glyph:"✧", rarity:"legendary", maxStacks:1, weapon:"sniper" },
  { id:"rifleSurge", name:"FULL AUTO AUDIT", description:"Every fifth rifle shot fires a bonus 75% damage hit at its target.", glyph:"⚑", rarity:"legendary", maxStacks:1, weapon:"rifle" },
  { id:"shotgunDouble", name:"DOUBLE ENTRY", description:"Shotgun blasts fire 75% more pellets; cost two shells and reload 20% slower.", glyph:"❖", rarity:"legendary", maxStacks:1, weapon:"shotgun" },
  { id:"ironWill", name:"FINAL NOTICE", description:"Gain 35 maximum HP and heal 20 HP immediately; −10% movement speed.", glyph:"✺", rarity:"legendary", maxStacks:1 },
];
export function emptyUpgrades(): UpgradeLevels {
  return Object.fromEntries(UPGRADE_CARDS.map((c) => [c.id, 0])) as UpgradeLevels;
}
export function getUpgradeStats(u: UpgradeLevels) {
  return {
    damage: (1 + u.damage * 0.1) * Math.pow(0.96, u.fireRate),
    spread: Math.pow(0.86, u.accuracy),
    movement: (1 + u.movement * 0.09) * Math.pow(0.97, u.damage + u.maxHp) * (u.ironWill ? 0.9 : 1),
    reloadTime: Math.pow(0.87, u.reload) * Math.pow(1.05, u.magazine),
    magazine: 1 + u.magazine * 0.16,
    jump: 1 + u.jump * 0.15,
    maxHp: 100 + u.maxHp * 18 - u.movement * 5 - u.secondWind * 10 + u.ironWill * 35,
    fireCooldown: Math.pow(0.92, u.fireRate),
    grenadePower: 1 + u.grenadePower * 0.22,
    knifeDamage: 1 + u.knifeDamage * 0.35,
    killHeal: u.secondWind * 8,
    grenadeCapacity: 3 + u.bombBelt,
  };
}
function seeded(seed: number) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 0x100000000; };
}
const rarityWeights: [Rarity, number][] = [["common", 0.5], ["rare", 0.3], ["epic", 0.15], ["legendary", 0.05]];
export function rollUpgradeChoices(level: number, rerollIndex: number, upgrades: UpgradeLevels): UpgradeId[] {
  const stackScore = Object.values(upgrades).reduce((sum, value) => sum + value, 0);
  const random = seeded(level * 92821 + rerollIndex * 19391 + stackScore * 7919 + 17);
  const available = UPGRADE_CARDS.filter((card) => upgrades[card.id] < card.maxStacks);
  const choices: UpgradeId[] = [];
  for (let slot = 0; slot < 3; slot++) {
    const pool = available.filter((card) => !choices.includes(card.id) && (slot === 0 ? Boolean(card.weapon) : slot === 1 ? !card.weapon : true));
    const candidates = pool.length ? pool : available.filter((card) => !choices.includes(card.id));
    if (!candidates.length) break;
    const roll = random(); let cumulative = 0; let rarity: Rarity = "common";
    for (const [candidate, weight] of rarityWeights) { cumulative += weight; if (roll < cumulative) { rarity = candidate; break; } }
    const matching = candidates.filter((c) => c.rarity === rarity);
    // A depleted rarity falls back to other available cards.
    const chosen = (matching.length ? matching : candidates)[Math.floor(random() * (matching.length || candidates.length))];
    choices.push(chosen.id);
  }
  return choices;
}
export function getUpgradeCard(id: UpgradeId) { return UPGRADE_CARDS.find((card) => card.id === id)!; }
export function upgradeDescription(card: UpgradeCard, owned: number) {
  if (owned === 0 || card.maxStacks === 1) return card.description;
  const next = owned + 1;
  const values: Partial<Record<UpgradeId, string>> = {
    damage: `+${owned * 10}% → +${next * 10}% damage; −${owned * 3}% → −${next * 3}% speed.`,
    accuracy: `${owned * 14}% → ${next * 14}% tighter spread.`,
    movement: `+${owned * 9}% → +${next * 9}% speed; −${owned * 5} → −${next * 5} HP.`,
    magazine: `+${owned * 16}% → +${next * 16}% capacity; ${owned * 5}% → ${next * 5}% slower reload.`,
    maxHp: `+${owned * 18} → +${next * 18} HP; −${owned * 3}% → −${next * 3}% speed.`,
    bombBelt: `+${owned} → +${next} maximum paper bombs.`,
    grenadePower: `+${owned * 22}% → +${next * 22}% damage and radius.`,
    knifeDamage: `+${owned * 35}% → +${next * 35}% knife damage.`,
    jump: `+${owned * 15}% → +${next * 15}% jump power.`,
    reload: `${owned * 13}% → ${next * 13}% faster reloads.`,
    fireRate: `${owned * 8}% → ${next * 8}% shorter cooldown; −${owned * 4}% → −${next * 4}% damage.`,
    riflePrecision: `${owned * 22}% → ${next * 22}% tighter rifle spread.`,
  };
  return values[card.id] ?? card.description;
}
