import { useState } from "react";
import { createPortal } from "react-dom";
import { useGameStore } from "../game/store";
export function ResetDataButton() {
  const [confirm, setConfirm] = useState(false);
  const resetData = useGameStore((s) => s.resetData);
  return <><button className="reset-data-button" type="button" onClick={() => setConfirm(true)}>RESET DATA AND START AGAIN</button>{confirm && createPortal(<div className="reset-confirm" role="alertdialog" aria-modal="true" aria-label="Reset your progress"><div><h3>ERASE THIS DREAM?</h3><p>All hearts, stages, coins, cards, gear, XP, magic, crates and skins will be erased. The opening comic will play again.</p><button autoFocus onClick={() => setConfirm(false)}>CANCEL</button><button onClick={resetData}>YES, RESET EVERYTHING</button></div></div>,document.body)}</>;
}
