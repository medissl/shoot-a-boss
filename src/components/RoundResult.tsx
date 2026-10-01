import { useEffect, useState } from "react";
import { getLevelDefinition } from "../game/levels";
import { xpToNextLevel, useGameStore } from "../game/store";

export function RoundResult() {
  const screen = useGameStore(s => s.screen);
  if (!["stageClear", "levelUp", "reward", "won", "lost", "practiceResult"].includes(screen)) return null;
  return <ResultScene key={screen} />;
}

function ResultScene() {
  const state = useGameStore();
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      const next = Math.min(1, (performance.now() - start) / 1250);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  const base = state.lastReward - state.lastPerformanceBonus;
  const next = () => state.advanceResult();
  const practice = state.screen === "practiceResult";
  const failure = state.screen === "lost" || practice && state.hp <= 0;
  return <div className={`round-result round-result--${state.screen}`}>
    <div className="round-result__frame">
      <div className="round-result__sparks" aria-hidden="true">✳ · ✦ · ✳</div>
      {state.screen === "stageClear" && <>
        <p>LEVEL {state.currentLevel} · {getLevelDefinition(state.currentLevel).name}</p>
        <h2>STAGE<br />CLEAR!</h2>
        <p>{state.targetCount} TARGETS CLEARED</p>
        <button className="result-primary" onClick={next}>CONTINUE →</button>
      </>}
      {state.screen === "levelUp" && <>
        <p>THE DREAM GROWS STRONGER</p><h2>PLAYER<br />LEVEL UP!</h2>
        <div className="level-up-numbers">LV {state.playerLevel - state.lastLevelGain} <span>→</span> LV {state.playerLevel}</div>
        <div className="level-up-xp"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
        <strong>✦ +{state.lastSpGain} SKILL POINT{state.lastSpGain === 1 ? "" : "S"}</strong>
        <button className="result-primary" onClick={next}>CONTINUE →</button>
      </>}
      {state.screen === "reward" && <>
        <p>LEVEL {state.currentLevel} · DEADLINE FILED</p><h2>DREAM REPORT</h2>
        <div className="result-ledger">
          <span>TARGETS <b>{state.targetCount}/{state.targetCount}</b></span>
          <span>TIME <b>{Math.floor(state.lastClearMs / 60000)}:{String(Math.floor(state.lastClearMs / 1000) % 60).padStart(2, "0")}</b></span>
          <span>HP REMAINING <b>{Math.round(state.hp)}/{state.maxHp}</b></span>
          <hr />
          <span>BASE COINS <b>+{base}</b></span>
          <span>PERFORMANCE <b>+{Math.round(state.lastPerformanceBonus * Math.min(1, progress * 1.6))}</b></span>
          <span className="result-ledger__total">TOTAL COINS <b>+{Math.round(state.lastReward * progress)}</b></span>
          <span>XP EARNED <b>+{Math.round(state.lastXpReward * progress)}</b></span>
          <hr />
          <span>CURRENT <b>LV {state.playerLevel} · XP {state.xp}/{xpToNextLevel(state.playerLevel)} · ◉ {state.coins}</b></span>
        </div>
        <button className="result-primary" onClick={next}>CHOOSE A DREAM CARD →</button>
      </>}
      {state.screen === "won" && <>
        <p>ALL TWELVE DEADLINES FILED</p><h2>DREAM<br />COMPLETE!</h2>
        <p>Your build carries forward. NG+ begins a harder dream from Stage 1.</p>
        <button className="result-primary" onClick={() => state.prepareStage(1)}>PREPARE FOR NG+ →</button>
        <button onClick={state.goToMenu}>MAIN MENU</button>
      </>}
      {practice && <>
        <p>PRACTICE · LEVEL {state.currentLevel}</p><h2>{failure ? "TRY AGAIN" : "PRACTICE CLEAR!"}</h2>
        <p>No hearts, coins, XP, cards, or campaign progress changed.</p>
        <button className="result-primary" onClick={state.restart}>RETRY PRACTICE →</button>
        <button onClick={state.goToMenu}>RETURN TO DREAM MAP</button>
      </>}
      {state.screen === "lost" && <>
        <p>{state.lastDeathCollapsed ? "DREAM COLLAPSED" : "ONE HEART LOST"}</p>
        <h2>{state.lastDeathCollapsed ? "BACK TO THE ANCHOR" : "YOU DIED"}</h2>
        <strong>{state.hearts} HEART{state.hearts === 1 ? "" : "S"} REMAINING</strong>
        <p>{state.lastDeathCollapsed ? `Restored to Stage ${state.anchor.level}. Permanent progress remains.` : "Retry this deadline or return to the Dream Map."}</p>
        <button className="result-primary" onClick={state.restart}>RETRY THIS LEVEL →</button>
        <button onClick={state.goToMenu}>DREAM MAP</button>
      </>}
    </div>
  </div>;
}
