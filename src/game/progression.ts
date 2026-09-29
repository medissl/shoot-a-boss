export type UpgradeId =
  | "damage" | "accuracy" | "movement" | "reload" | "magazine" | "jump"
  | "maxHp" | "fireRate" | "grenadePower" | "knifeDamage" | "secondWind" | "bombBelt"
  | "sniperFire" | "sniperFocus" | "sniperPierce" | "sniperBolt"
  | "rifleFreeze" | "riflePrecision" | "rifleOverclock" | "riflePower"
  | "shotgunPellets" | "shotgunChoke" | "shotgunSlow" | "shotgunClose"
  | "recon" | "sniperTwin" | "rifleSurge" | "shotgunDouble" | "ironWill"
  | "shieldOrbit" | "shieldReserve" | "shieldShatter" | "fireOrbit" | "vampireInk" | "swiftReset"
  | "magicPower" | "magicTempo" | "magicEcho" | "spellWard" | "fireBloom" | "crystalThorns" | "iceBarrier" | "waterHealing" | "thunderSpark";
export type UpgradeLevels = Record<UpgradeId, number>;
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type UpgradeCard = {
  id: UpgradeId; name: string; description: string; glyph: string;
  rarity: Rarity; maxStacks: number; weapon?: "sniper" | "rifle" | "shotgun";
};

export const UPGRADE_CARDS: UpgradeCard[] = [
  { id:"damage", name:"RED INK", description:"+8% weapon damage per stack.", glyph:"✦", rarity:"common", maxStacks:3 },
  { id:"accuracy", name:"STEADY HAND", description:"12% tighter spread per stack.", glyph:"◎", rarity:"common", maxStacks:3 },
  { id:"movement", name:"RUNNING LATE", description:"+5% movement speed per stack.", glyph:"➜", rarity:"common", maxStacks:3 },
  { id:"reload", name:"QUICK HANDS", description:"10% shorter reload time per stack.", glyph:"↻", rarity:"common", maxStacks:3 },
  { id:"magazine", name:"DEEP POCKETS", description:"+12% magazine capacity per stack.", glyph:"▤", rarity:"common", maxStacks:3 },
  { id:"jump", name:"SPRING SHOES", description:"+12% jump power per stack.", glyph:"↑", rarity:"common", maxStacks:3 },
  { id:"maxHp", name:"THICK SKIN", description:"+12 maximum HP per stack.", glyph:"♥", rarity:"common", maxStacks:3 },
  { id:"fireRate", name:"TRIGGER FINGER", description:"7% shorter firing cooldown per stack.", glyph:"⚡", rarity:"rare", maxStacks:2 },
  { id:"grenadePower", name:"BIGGER MESS", description:"+18% bomb damage and +8% radius per stack.", glyph:"◉", rarity:"rare", maxStacks:2 },
  { id:"knifeDamage", name:"PAPER CUT", description:"+25% knife damage per stack.", glyph:"╱", rarity:"rare", maxStacks:2 },
  { id:"secondWind", name:"SECOND WIND", description:"Heal 6 HP on elimination.", glyph:"+", rarity:"rare", maxStacks:1 },
  { id:"bombBelt", name:"BOMB BELT", description:"+1 maximum paper bomb and refill immediately.", glyph:"○", rarity:"rare", maxStacks:2 },
  { id:"sniperFire", name:"BURNING INK", description:"Sniper hits burn enemies for 4 seconds.", glyph:"♨", rarity:"epic", maxStacks:1, weapon:"sniper" },
  { id:"sniperFocus", name:"DEADLINE FOCUS", description:"+15% aimed sniper damage.", glyph:"⌖", rarity:"rare", maxStacks:1, weapon:"sniper" },
  { id:"sniperPierce", name:"THROUGH THE PAGE", description:"Sniper pierces one additional enemy at 55% damage.", glyph:"⇥", rarity:"epic", maxStacks:1, weapon:"sniper" },
  { id:"sniperBolt", name:"FAST BOLT", description:"15% faster sniper follow-up.", glyph:"↻", rarity:"rare", maxStacks:1, weapon:"sniper" },
  { id:"rifleFreeze", name:"COLD CALL", description:"Rifle hits briefly freeze enemies.", glyph:"❄", rarity:"epic", maxStacks:1, weapon:"rifle" },
  { id:"riflePrecision", name:"FINE PRINT", description:"18% tighter rifle spread per stack.", glyph:"◎", rarity:"common", maxStacks:2, weapon:"rifle" },
  { id:"rifleOverclock", name:"OVERTIME", description:"10% faster rifle fire.", glyph:"⚡", rarity:"rare", maxStacks:1, weapon:"rifle" },
  { id:"riflePower", name:"RED STAPLES", description:"+12% rifle damage.", glyph:"✦", rarity:"rare", maxStacks:1, weapon:"rifle" },
  { id:"shotgunPellets", name:"EXTRA STAPLES", description:"+1 pellet per shotgun blast.", glyph:"⁙", rarity:"rare", maxStacks:1, weapon:"shotgun" },
  { id:"shotgunChoke", name:"TIGHT BINDING", description:"20% tighter shotgun spread.", glyph:"⌾", rarity:"common", maxStacks:1, weapon:"shotgun" },
  { id:"shotgunSlow", name:"HEAVY PAGES", description:"Shotgun hits slow enemies for 1.5 seconds.", glyph:"◆", rarity:"epic", maxStacks:1, weapon:"shotgun" },
  { id:"shotgunClose", name:"POINT BLANK", description:"+20% shotgun damage within 6 meters.", glyph:"✹", rarity:"rare", maxStacks:1, weapon:"shotgun" },
  { id:"recon", name:"ALL HANDS REPORT", description:"Q marks all surviving enemies for 7.5 seconds.", glyph:"◈", rarity:"epic", maxStacks:1 },
  { id:"sniperTwin", name:"TWIN SIGNATURE", description:"Sniper fires a second round for 45% damage.", glyph:"✧", rarity:"legendary", maxStacks:1, weapon:"sniper" },
  { id:"rifleSurge", name:"FULL AUTO AUDIT", description:"Every sixth rifle shot gains 65% damage.", glyph:"⚑", rarity:"legendary", maxStacks:1, weapon:"rifle" },
  { id:"shotgunDouble", name:"DOUBLE ENTRY", description:"+2 shotgun pellets.", glyph:"❖", rarity:"legendary", maxStacks:1, weapon:"shotgun" },
  { id:"ironWill", name:"FINAL NOTICE", description:"Gain 25 maximum HP and heal 25 immediately.", glyph:"✺", rarity:"legendary", maxStacks:1 },
  { id:"shieldOrbit", name:"ORBITAL GUARD", description:"Absorb one hit every 16 seconds.", glyph:"⬡", rarity:"legendary", maxStacks:1 },
  { id:"shieldReserve", name:"PAPER ARMOR", description:"Begin each stage with one extra shield charge per stack.", glyph:"▱", rarity:"epic", maxStacks:2 },
  { id:"shieldShatter", name:"SHATTERED INK", description:"When a shield breaks, nearby monsters take 20 damage.", glyph:"✳", rarity:"epic", maxStacks:1 },
  { id:"fireOrbit", name:"FIRE WALTZ", description:"Three fireballs orbit you and singe nearby monsters.", glyph:"☄", rarity:"legendary", maxStacks:1 },
  { id:"vampireInk", name:"LIFE IN INK", description:"Every fourth elimination heals 10 HP.", glyph:"❣", rarity:"epic", maxStacks:1 },
  { id:"swiftReset", name:"FRESH PAGE", description:"Each elimination transfers 15% magazine capacity from reserve.", glyph:"↶", rarity:"epic", maxStacks:1 },
  { id:"magicPower", name:"ARCANE INK", description:"+10% magic damage per stack.", glyph:"✧", rarity:"rare", maxStacks:2 },
  { id:"magicTempo", name:"SHORTCUT SPELL", description:"Magic cooldown is 10% shorter.", glyph:"⌛", rarity:"rare", maxStacks:1 },
  { id:"magicEcho", name:"SECOND DRAFT", description:"A magic hit repeats 25% of impact damage.", glyph:"◈", rarity:"epic", maxStacks:1 },
  { id:"spellWard", name:"SPELL SHIELD", description:"Casting magic restores one shield charge if you have none.", glyph:"⬡", rarity:"legendary", maxStacks:1 },
  { id:"fireBloom", name:"WILDFIRE MEMO", description:"Fire circles last 1.5 seconds longer and burn 15% harder.", glyph:"♨", rarity:"epic", maxStacks:1 },
  { id:"crystalThorns", name:"SHARP REMARKS", description:"Crystal trails deal 20% more damage.", glyph:"◆", rarity:"rare", maxStacks:1 },
  { id:"iceBarrier", name:"COLD SHOULDER", description:"Freezing an enemy slows another nearby enemy.", glyph:"❄", rarity:"epic", maxStacks:1 },
  { id:"waterHealing", name:"FRESH INK", description:"Water magic heals 6 HP on the first hit.", glyph:"◌", rarity:"rare", maxStacks:1 },
  { id:"thunderSpark", name:"CARBON COPY", description:"Thunder chains to a nearby enemy even before tier 5.", glyph:"⚡", rarity:"epic", maxStacks:1 },
];
export function emptyUpgrades(): UpgradeLevels {
  return Object.fromEntries(UPGRADE_CARDS.map((c) => [c.id, 0])) as UpgradeLevels;
}
export function getUpgradeStats(u: UpgradeLevels) {
  return {
    damage: 1 + u.damage * 0.08,
    spread: Math.pow(0.88, u.accuracy),
    movement: 1 + u.movement * 0.05,
    reloadTime: Math.pow(0.90, u.reload),
    magazine: 1 + u.magazine * 0.12,
    jump: 1 + u.jump * 0.12,
    maxHp: 100 + u.maxHp * 12 + u.ironWill * 25,
    fireCooldown: Math.pow(0.93, u.fireRate),
    grenadePower: 1 + u.grenadePower * 0.18,
    knifeDamage: 1 + u.knifeDamage * 0.25,
    killHeal: u.secondWind * 6,
    grenadeCapacity: 3 + u.bombBelt,
  };
}
function seeded(seed: number) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 0x100000000; };
}
const rarityWeights: [Rarity, number][] = [["common", 0.5], ["rare", 0.3], ["epic", 0.15], ["legendary", 0.05]];
export function rollUpgradeChoices(level: number, rerollIndex: number, upgrades: UpgradeLevels, magicUnlocked = false, excluded: UpgradeId[] = [], preferredWeapon?: "sniper" | "rifle" | "shotgun" | "knife"): UpgradeId[] {
  const stackScore = Object.values(upgrades).reduce((sum, value) => sum + value, 0);
  const random = seeded(level * 92821 + rerollIndex * 19391 + stackScore * 7919 + 17);
  const available = UPGRADE_CARDS.filter((card) => upgrades[card.id] < card.maxStacks && !excluded.includes(card.id) && (magicUnlocked || !["magicPower","magicTempo","magicEcho","spellWard","fireBloom","crystalThorns","iceBarrier","waterHealing","thunderSpark"].includes(card.id)) && (card.id !== "shieldShatter" || upgrades.shieldOrbit || upgrades.shieldReserve));
  const choices: UpgradeId[] = [];
  for (let slot = 0; slot < 3; slot++) {
    const preferred = slot === 0 && preferredWeapon && random() < .7;
    const pool = available.filter((card) => !choices.includes(card.id) && (preferred ? card.weapon === preferredWeapon : slot === 0 ? Boolean(card.weapon) : slot === 1 ? !card.weapon : true));
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
    damage: `+${owned * 8}% → +${next * 8}% damage.`,
    accuracy: `${Math.round((1 - Math.pow(.88, owned)) * 100)}% → ${Math.round((1 - Math.pow(.88, next)) * 100)}% tighter spread.`,
    movement: `+${owned * 5}% → +${next * 5}% speed.`,
    magazine: `+${owned * 12}% → +${next * 12}% capacity.`,
    maxHp: `+${owned * 12} → +${next * 12} HP.`,
    bombBelt: `+${owned} → +${next} maximum paper bombs.`,
    grenadePower: `+${owned * 18}% → +${next * 18}% damage; +${owned * 8}% → +${next * 8}% radius.`,
    knifeDamage: `+${owned * 25}% → +${next * 25}% knife damage.`,
    jump: `+${owned * 12}% → +${next * 12}% jump power.`,
    reload: `${Math.round((1 - Math.pow(.90, owned)) * 100)}% → ${Math.round((1 - Math.pow(.90, next)) * 100)}% shorter reload time.`,
    fireRate: `${Math.round((1 - Math.pow(.93, owned)) * 100)}% → ${Math.round((1 - Math.pow(.93, next)) * 100)}% shorter cooldown.`,
    riflePrecision: `${Math.round((1 - Math.pow(.82, owned)) * 100)}% → ${Math.round((1 - Math.pow(.82, next)) * 100)}% tighter rifle spread.`,
    shieldReserve: `${owned} → ${next} extra shield charges at stage start.`,
    magicPower: `+${owned * 10}% → +${next * 10}% magic damage.`,
  };
  return values[card.id] ?? card.description;
}
