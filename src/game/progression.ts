export type UpgradeId =
  | "damage"
  | "accuracy"
  | "movement"
  | "reload"
  | "magazine"
  | "jump"
  | "maxHp"
  | "fireRate"
  | "grenadePower"
  | "knifeDamage"
  | "secondWind"
  | "bombBelt"
  | "sniperFire"
  | "sniperFocus"
  | "sniperPierce"
  | "sniperBolt"
  | "rifleFreeze"
  | "riflePrecision"
  | "rifleOverclock"
  | "riflePower"
  | "shotgunPellets"
  | "shotgunChoke"
  | "shotgunSlow"
  | "shotgunClose";

export type UpgradeLevels = Record<UpgradeId, number>;

export type UpgradeCard = {
  id: UpgradeId;
  name: string;
  description: string;
  glyph: string;
  weapon?: "sniper" | "rifle" | "shotgun";
};

export const UPGRADE_CARDS: UpgradeCard[] = [
  { id: "damage", name: "RED INK", description: "+12% weapon damage", glyph: "✦" },
  { id: "accuracy", name: "STEADY HAND", description: "13% tighter bullet spread", glyph: "◎" },
  { id: "movement", name: "RUNNING LATE", description: "+8% movement speed", glyph: "➜" },
  { id: "reload", name: "QUICK HANDS", description: "12% faster reloads", glyph: "↻" },
  { id: "magazine", name: "DEEP POCKETS", description: "+15% magazine capacity", glyph: "▤" },
  { id: "jump", name: "SPRING SHOES", description: "+10% jump power", glyph: "↑" },
  { id: "maxHp", name: "THICK SKIN", description: "+15 maximum HP", glyph: "♥" },
  { id: "fireRate", name: "TRIGGER FINGER", description: "8% shorter firing cooldown", glyph: "⚡" },
  { id: "grenadePower", name: "BIGGER MESS", description: "+15% paper-bomb damage and radius", glyph: "◉" },
  { id: "knifeDamage", name: "PAPER CUT", description: "+20% knife damage", glyph: "╱" },
  { id: "secondWind", name: "SECOND WIND", description: "heal 6 HP after every kill", glyph: "+" },
  { id: "bombBelt", name: "BOMB BELT", description: "+1 maximum paper bomb", glyph: "○" },
  { id: "sniperFire", name: "BURNING INK", description: "Sniper hits burn for 4 seconds", glyph: "♨", weapon: "sniper" },
  { id: "sniperFocus", name: "DEADLINE FOCUS", description: "+30% aimed sniper damage", glyph: "⌖", weapon: "sniper" },
  { id: "sniperPierce", name: "THROUGH THE PAGE", description: "Sniper rounds pierce one more enemy", glyph: "⇥", weapon: "sniper" },
  { id: "sniperBolt", name: "FAST BOLT", description: "18% faster sniper follow-up shots", glyph: "↻", weapon: "sniper" },
  { id: "rifleFreeze", name: "COLD CALL", description: "Rifle hits briefly freeze enemies", glyph: "❄", weapon: "rifle" },
  { id: "riflePrecision", name: "FINE PRINT", description: "Rifle spread 22% tighter", glyph: "◎", weapon: "rifle" },
  { id: "rifleOverclock", name: "OVERTIME", description: "Rifle fires 12% faster", glyph: "⚡", weapon: "rifle" },
  { id: "riflePower", name: "RED STAPLES", description: "+16% rifle damage", glyph: "✦", weapon: "rifle" },
  { id: "shotgunPellets", name: "EXTRA STAPLES", description: "+2 pellets per shotgun blast", glyph: "⁙", weapon: "shotgun" },
  { id: "shotgunChoke", name: "TIGHT BINDING", description: "Shotgun spread 18% tighter", glyph: "⌾", weapon: "shotgun" },
  { id: "shotgunSlow", name: "HEAVY PAGES", description: "Shotgun hits slow enemies for 2 seconds", glyph: "◆", weapon: "shotgun" },
  { id: "shotgunClose", name: "POINT BLANK", description: "+25% shotgun damage within 6 meters", glyph: "✹", weapon: "shotgun" },
];

export function emptyUpgrades(): UpgradeLevels {
  return {
    damage: 0,
    accuracy: 0,
    movement: 0,
    reload: 0,
    magazine: 0,
    jump: 0,
    maxHp: 0,
    fireRate: 0,
    grenadePower: 0,
    knifeDamage: 0,
    secondWind: 0,
    bombBelt: 0,
    sniperFire: 0, sniperFocus: 0, sniperPierce: 0, sniperBolt: 0,
    rifleFreeze: 0, riflePrecision: 0, rifleOverclock: 0, riflePower: 0,
    shotgunPellets: 0, shotgunChoke: 0, shotgunSlow: 0, shotgunClose: 0,
  };
}

export function getUpgradeStats(upgrades: UpgradeLevels) {
  return {
    damage: 1 + upgrades.damage * 0.12,
    spread: Math.pow(0.87, upgrades.accuracy),
    movement: 1 + upgrades.movement * 0.08,
    reloadTime: Math.pow(0.88, upgrades.reload),
    magazine: 1 + upgrades.magazine * 0.15,
    jump: 1 + upgrades.jump * 0.1,
    maxHp: 100 + upgrades.maxHp * 15,
    fireCooldown: Math.pow(0.92, upgrades.fireRate),
    grenadePower: 1 + upgrades.grenadePower * 0.15,
    knifeDamage: 1 + upgrades.knifeDamage * 0.2,
    killHeal: upgrades.secondWind * 6,
    grenadeCapacity: 3 + upgrades.bombBelt,
  };
}

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0xffffffff;
  };
}

export function rollUpgradeChoices(
  level: number,
  rerollIndex: number,
  upgrades: UpgradeLevels,
): UpgradeId[] {
  const stackScore = Object.values(upgrades).reduce((sum, value) => sum + value, 0);
  const random = seeded(level * 92821 + rerollIndex * 19391 + stackScore * 7919 + 17);
  const pool = [...UPGRADE_CARDS];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [pool[index], pool[target]] = [pool[target], pool[index]];
  }

  // Two different weapon paths and one flexible choice each time.
  const specialists = pool.filter((card) => card.weapon);
  const first = specialists[0];
  const second = specialists.find((card) => card.weapon !== first.weapon)!;
  const flexible = pool.find((card) => !card.weapon)!;
  return [first, second, flexible].map((card) => card.id);
}

export function getUpgradeCard(id: UpgradeId) {
  return UPGRADE_CARDS.find((card) => card.id === id)!;
}
