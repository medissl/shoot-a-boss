import { useEffect, useState } from "react";
import { useGameStore } from "../game/store";

export function RoundResult() {
  const screen = useGameStore((s) => s.screen);
  if (!["stageClear", "won", "lost"].includes(screen)) return null;
  return <RoundResultScreen key={screen} />;
}

function RoundResultScreen() {
  const screen = useGameStore((s) => s.screen);
  const level = useGameStore((s) => s.currentLevel);
  const cycle = useGameStore((s) => s.ngPlusCycle);
  const hearts = useGameStore((s) => s.hearts);
  const reward = useGameStore((s) => s.lastReward);
  const performanceBonus = useGameStore((s) => s.lastPerformanceBonus);
  const xpReward = useGameStore((s) => s.lastXpReward);
  const playerLevel = useGameStore((s) => s.playerLevel);
  const skillPoints = useGameStore((s) => s.skillPoints);
  const levelGain = useGameStore((s) => s.lastLevelGain);
  const spGain = useGameStore((s) => s.lastSpGain);
  const clearMs = useGameStore((s) => s.lastClearMs);
  const targetCount = useGameStore((s) => s.targetCount);
  const hp = useGameStore((s) => s.hp);
  const maxHp = useGameStore((s) => s.maxHp);
  const collapsed = useGameStore((s) => s.lastDeathCollapsed);
  const anchor = useGameStore((s) => s.anchor);
  const coins = useGameStore((s) => s.coins);
  const continueAfterVictory = useGameStore((s) => s.continueAfterVictory);
  const startNewGamePlus = useGameStore((s) => s.startNewGamePlus);
  const restart = useGameStore((s) => s.restart);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const markTutorial = useGameStore((s) => s.markTutorial);
  const tutorials = useGameStore((s) => s.tutorials);
  const [ready, setReady] = useState(false);
  const [reveal, setReveal] = useState(0);
  useEffect(() => {
    const started = performance.now();
    let frame = 0;
    const animate = () => { setReveal(Math.min(1, (performance.now() - started) / 950)); if (performance.now() - started < 950) frame = window.requestAnimationFrame(animate); };
    frame = window.requestAnimationFrame(animate);
    const timeout = window.setTimeout(() => setReady(true), 1150);
    return () => { window.clearTimeout(timeout); window.cancelAnimationFrame(frame); };
  }, [screen]);
  if (!["stageClear", "won", "lost"].includes(screen)) return null;
  const win = screen !== "lost";
  const advance = () => {
    if (!ready || !win) return;
    if (screen === "stageClear") { markTutorial("xp"); markTutorial("coins"); if (levelGain) markTutorial("levelUp"); continueAfterVictory(); }
    else startNewGamePlus();
  };
  return <div className={`round-result ${win ? "round-result--win" : "round-result--loss"}`} onClick={advance} onKeyDown={(event) => {
    if (win && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); advance(); }
  }} role={win ? "button" : undefined} tabIndex={win ? 0 : undefined}>
    <div className="round-result__frame">
      <div className="round-result__sparks" aria-hidden="true">✳ · ✦ · ✳</div>
      <p>{win ? `LEVEL ${level} · ${cycle ? `NG+ ${cycle}` : "DREAM"} COMPLETE` : collapsed ? "DREAM COLLAPSED" : "ONE HEART LOST"}</p>
      <h2>{win ? "STAGE CLEAR!" : collapsed ? "BACK TO THE ANCHOR" : "YOU DIED"}</h2>
      <strong>{win ? <><span className="doodle-coin" aria-hidden="true">◉</span> +{Math.round(reward * reveal)} COINS · {coins - reward + Math.round(reward * reveal)} TOTAL</> : `${hearts} ${hearts === 1 ? "HEART" : "HEARTS"} REMAINING`}</strong>
      {win ? <><p>{targetCount} TARGETS · {Math.round(clearMs / 1000)}S · {Math.round(hp)}/{maxHp} HP REMAINING · PERFORMANCE +{performanceBonus} COINS</p><p>+{Math.round(xpReward * reveal)} XP · PLAYER LEVEL {playerLevel} · {skillPoints} SKILL POINTS</p>{levelGain > 0 && <p className="level-up-reveal">✦ PLAYER LEVEL UP! +{levelGain} LEVEL{levelGain === 1 ? "" : "S"} · +{spGain} SP</p>}</> : <p>{collapsed ? `Dream restored to Stage ${anchor.level}. Permanent XP, Magic, Gear, Skins and Coins remain.` : "Retry this stage or prepare at the Dream Desk."}</p>}
      {win && !tutorials.xp && <p className="reward-discovery">NEW: XP levels up your player. Every level gives Skill Points for permanent Magic at the Dream Desk. Your next choice is a run card.</p>}
      {win ? <p className={`round-result__continue ${ready ? "is-ready" : ""}`}>CLICK ANYWHERE TO {screen === "stageClear" ? "CHOOSE YOUR CARD" : "BEGIN NG+"} →</p>
        : <div className={`round-result__actions ${ready ? "is-ready" : ""}`}>
          <button type="button" onClick={() => { markTutorial("hearts"); restart(); }}>RETRY THIS LEVEL →</button>
          <button type="button" onClick={goToMenu}>MAIN MENU</button>
        </div>}
      <div className="round-result__underline" aria-hidden="true" />
    </div>
  </div>;
}
