import { WEAPONS, type WeaponId } from "./config";
import { enemyHpScale, getEnemyTuning, getLevelDefinition, getTargetCount } from "./levels";

function enemyRewards(level: number, cycle: number) {
  const e = getEnemyTuning(level, cycle);
  const gems = getLevelDefinition(level).theme === "gems";
  return {
    coins: e.bosses * 3 + e.paperwork * 2 + e.pens * 3 + (e.flying ?? 0) * 3 + (e.statues ?? 0) * 4 + (gems ? 8 : 0),
    xp: e.bosses * 6 + e.paperwork * 3 + e.pens * 4 + (e.flying ?? 0) * 4 + (e.statues ?? 0) * 6 + (gems ? 11 : 0),
  };
}

export function stageCoinReward(level: number, cycle: number) {
  const effective = level + cycle * 10;
  return Math.round((90 + effective * 20 + enemyRewards(level, cycle).coins) * (1 + cycle * .15));
}
export function stageXpReward(level: number, cycle: number) {
  const effective = level + cycle * 10;
  return Math.round((90 + effective * 30 + getTargetCount(level, cycle) * 6 + enemyRewards(level, cycle).xp) * (1 + cycle * .12));
}
export function weaponBalance(id: WeaponId, level: number, cycle = 0) {
  const weapon = WEAPONS[id];
  const managerHp = Math.round(250 * enemyHpScale(level, cycle));
  const burst = weapon.damage * weapon.pellets;
  const shots = Math.ceil(managerHp / burst);
  const emptyMagazineSeconds = weapon.magazine ? weapon.magazine * weapon.cooldownMs / 1000 : 0;
  const reloadMs = id === "rifle" ? 1550 : id === "sniper" ? 1800 : id === "shotgun" ? 1900 : 0;
  const sustainedDps = id === "knife" ? weapon.damage * 1000 / weapon.cooldownMs :
    weapon.magazine * burst / (emptyMagazineSeconds + reloadMs / 1000);
  return { managerHp, burst, idealHits: shots, sustainedDps: Math.round(sustainedDps), idealTtkSeconds: +((shots - 1) * weapon.cooldownMs / 1000).toFixed(2) };
}
export function campaignCoinBudget() { return Array.from({ length: 10 }, (_, index) => stageCoinReward(index + 1, 0)).reduce((a, b) => a + b, 0); }
