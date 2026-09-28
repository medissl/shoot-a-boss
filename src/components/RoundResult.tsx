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
  const coins = useGameStore((s) => s.coins);
  const continueAfterVictory = useGameStore((s) => s.continueAfterVictory);
  const startNewGamePlus = useGameStore((s) => s.startNewGamePlus);
  const restart = useGameStore((s) => s.restart);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), 1150);
    return () => window.clearTimeout(timeout);
  }, [screen]);
  if (!["stageClear", "won", "lost"].includes(screen)) return null;
  const win = screen !== "lost";
  return <div className={`round-result ${win ? "round-result--win" : "round-result--loss"}`}>
    <div className="round-result__sparks" aria-hidden="true">✦ ✧ ✴ ✦ ✧</div>
    <p>{win ? `LEVEL ${level} · ${cycle ? `NG+ ${cycle}` : "DREAM"} COMPLETE` : "ONE HEART LOST"}</p>
    <h2>{win ? "YOU WIN!" : "YOU DIED"}</h2>
    <strong>{win ? `+${reward} COINS · ${coins} TOTAL` : `${hearts} ${hearts === 1 ? "HEART" : "HEARTS"} REMAINING`}</strong>
    <div className={`round-result__actions ${ready ? "is-ready" : ""}`}>
      {screen === "stageClear" && <button type="button" onClick={continueAfterVictory}>{level === 10 ? "SEE YOUR VICTORY →" : "CHOOSE YOUR CARD →"}</button>}
      {screen === "won" && <button type="button" onClick={startNewGamePlus}>NG+ · KEEP YOUR CARDS →</button>}
      {screen === "lost" && <button type="button" onClick={restart}>RETRY THIS LEVEL →</button>}
      <button type="button" onClick={goToMenu}>MAIN MENU</button>
    </div>
  </div>;
}
