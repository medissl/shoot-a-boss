import { xpToNextLevel, useGameStore } from "../game/store";

export function ProgressStrip({ compact = false }: { compact?: boolean }) {
  const level = useGameStore((s) => s.playerLevel);
  const xp = useGameStore((s) => s.xp);
  const points = useGameStore((s) => s.skillPoints);
  const coins = useGameStore((s) => s.coins);
  const hearts = useGameStore((s) => s.hearts);
  const needed = xpToNextLevel(level);
  return <div className={`progress-strip ${compact ? "is-compact" : ""}`} aria-label={`Player level ${level}, ${xp} of ${needed} XP, ${points} skill points, ${coins} coins, ${hearts} hearts`}>
    <span><b>LV {level}</b><span className="progress-strip__bar"><i style={{ width: `${Math.min(100, xp / needed * 100)}%` }} /></span><small>{xp} / {needed} XP</small></span>
    <span className={points ? "has-points" : ""}>✦ {points} SP</span>
    <span>◉ {coins}</span>
    <span>{"♥".repeat(hearts)}{"♡".repeat(Math.max(0, 5 - hearts))}</span>
  </div>;
}
