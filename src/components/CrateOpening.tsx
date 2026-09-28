import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { WeaponId } from "../game/config";
import { SKIN_COLORS, type SkinColor, useGameStore } from "../game/store";

export function CrateOpening({ weapon, onBack }: { weapon: WeaponId; onBack: () => void }) {
  const buyCrate = useGameStore((s) => s.buyCrate);
  const equipSkin = useGameStore((s) => s.equipSkin);
  const [phase, setPhase] = useState<"drop" | "unlock" | "unlocking" | "spin" | "reveal">("drop");
  const [prize, setPrize] = useState<SkinColor | null>(null);
  useEffect(() => { window.dispatchEvent(new Event("crate-drop")); const timer = setTimeout(() => setPhase("unlock"), 2200); return () => clearTimeout(timer); }, []);
  const open = () => {
    if (phase !== "unlock") return;
    const color = buyCrate(weapon);
    if (!color) return;
    setPrize(color);
    window.dispatchEvent(new Event("crate-unlock"));
    setPhase("unlocking");
  };
  useEffect(() => {
    if (phase !== "unlocking") return;
    const timer = setTimeout(() => {setPhase("spin");window.dispatchEvent(new Event("crate-spin"));}, 990);
    return () => clearTimeout(timer);
  }, [phase]);
  useEffect(() => {
    if (phase !== "spin") return;
    const timer = setTimeout(() => { setPhase("reveal"); window.dispatchEvent(new Event("crate-reveal")); }, 5600);
    return () => clearTimeout(timer);
  }, [phase]);
  return <main className="crate-scene"><button className="crate-back" onClick={onBack} disabled={phase === "unlocking" || phase === "spin"}><ArrowLeft size={18}/> BACK TO SHOP</button><h1>{weapon.toUpperCase()} COLOR CRATE</h1><p>◉ 300 COINS · SIX POSSIBLE COLORS</p>
    {phase === "drop" || phase === "unlock" || phase === "unlocking" ? <button className={`crate-box ${phase}`} onClick={open} disabled={phase !== "unlock"}><span>{phase === "unlocking" ? "✧" : "◈"}</span><b>{phase === "drop" ? "DROPPING..." : phase === "unlocking" ? "LOCK OPENING..." : "TAP TO OPEN LOCK"}</b></button> : phase === "spin" ? <div className="crate-window"><div className="crate-roulette">{Array.from({length: 30},(_,i) => {const color = i === 20 ? prize : SKIN_COLORS[i%6]; return <span key={i} style={{"--crate-color":color} as React.CSSProperties}>✦ {color?.toUpperCase()}</span>;})}</div><i/></div> : <div className="crate-prize" style={{"--crate-color":prize} as React.CSSProperties}><span>✧ ◆ ✧</span><h2>YOU GOT {prize?.toUpperCase()} {weapon.toUpperCase()}!</h2><button onClick={() => { if (prize) equipSkin(weapon, prize); onBack(); }}>EQUIP & RETURN</button><button onClick={onBack}>KEEP FOR LATER</button></div>}
  </main>;
}
