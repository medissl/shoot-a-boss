import type { UpgradeId, UpgradeLevels } from "./progression";
export const EVOLUTIONS = [
  { id: "crunchTime", name: "CRUNCH TIME", cards: ["damage", "fireRate"], detail: "Three quick eliminations trigger +10% damage and +15% firing speed for 5s." },
  { id: "bottomlessInbox", name: "BOTTOMLESS INBOX", cards: ["reload", "magazine"], detail: "Empty reloads transfer 25% of a magazine from reserve instantly, then finish 30% faster." },
  { id: "paperTrail", name: "PAPER TRAIL", cards: ["movement", "knifeDamage"], detail: "Knife eliminations grant +20% movement and extended reach for 3.5s." },
  { id: "returnToSender", name: "RETURN TO SENDER", cards: ["shieldOrbit", "shieldShatter"], detail: "Shield breaks strike nearby enemies and Orbital Guard recharges 35% faster." },
  { id: "overtimeArcana", name: "OVERTIME ARCANA", cards: ["magicPower", "magicTempo"], detail: "Every third spell adds an element-specific secondary effect." },
  { id: "expenseReport", name: "EXPENSE REPORT", cards: ["bombBelt", "grenadePower"], detail: "A bomb that eliminates three enemies refunds one bomb, with a 20s cooldown." },
] as const satisfies readonly { id: string; name: string; cards: readonly UpgradeId[]; detail: string }[];
export type EvolutionId = typeof EVOLUTIONS[number]["id"];
export function availableEvolutions(upgrades: UpgradeLevels, owned: EvolutionId[]) {
  return EVOLUTIONS.filter(item => !owned.includes(item.id) && item.cards.every(id => upgrades[id] > 0));
}
