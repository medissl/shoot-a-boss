import { useMemo } from "react";
import { WEAPONS } from "../game/config";
import { campaignCoinBudget, weaponBalance } from "../game/balance";
import { enemyHpScale, getEnemyTuning, getTargetCount } from "../game/levels";
import { emptyUpgrades, getUpgradeCard, rollUpgradeChoices } from "../game/progression";
import { xpToNextLevel, useGameStore } from "../game/store";

export function BalanceDebug() {
  const state = useGameStore();
  const odds = useMemo(() => {
    const counts = { common: 0, rare: 0, epic: 0, legendary: 0 };
    for (let i = 0; i < 10000; i++) for (const id of rollUpgradeChoices(i + 1, i, emptyUpgrades())) counts[getUpgradeCard(id).rarity]++;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([rarity, count]) => `${rarity} ${(count / total * 100).toFixed(1)}%`).join(" · ");
  }, []);
  const tuning = getEnemyTuning(state.currentLevel, state.ngPlusCycle);
  const hp = Math.round(250 * enemyHpScale(state.currentLevel, state.ngPlusCycle));
  return <aside className="balance-debug"><b>BALANCE DEBUG · READ ONLY</b><p>Stage {state.currentLevel} · Cycle {state.ngPlusCycle} · {getTargetCount(state.currentLevel, state.ngPlusCycle)} targets · {state.eliminated.length} eliminated</p>
    <p>Speed {tuning.speed.toFixed(2)} · Vision {tuning.vision.toFixed(2)} · Damage {tuning.damage.toFixed(2)} · Manager HP {hp}</p>
    <p>LV {state.playerLevel} · XP {state.xp}/{xpToNextLevel(state.playerLevel)} · SP {state.skillPoints} · ◉ {state.coins} · ♥ {state.hearts}</p>
    <p>Claims {state.claimedRewards.length} · Anchor Stage {state.anchor.level} · Gear {state.equippedGear.length}/4 · Evolutions {state.evolutions.join(", ") || "none"} · Campaign coins {campaignCoinBudget()}</p>
    <p>10k drafts: {odds}</p>
    <p>{Object.values(WEAPONS).map(w => { const b = weaponBalance(w.id, state.currentLevel, state.ngPlusCycle); return `${w.id} ${b.sustainedDps} sustained DPS / ${b.idealHits} ideal hits / ${b.idealTtkSeconds}s TTK`; }).join(" · ")}</p>
  </aside>;
}
