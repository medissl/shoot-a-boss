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
  | "bombBelt";

export type UpgradeLevels = Record<UpgradeId, number>;

export type UpgradeCard = {
  id: UpgradeId;
  name: string;
  description: string;
  glyph: string;
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

  return pool.slice(0, 3).map((card) => card.id);
}

export function getUpgradeCard(id: UpgradeId) {
  return UPGRADE_CARDS.find((card) => card.id === id)!;
}
