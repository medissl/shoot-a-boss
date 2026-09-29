import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { WeaponId } from "../game/config";
import { type SkinColor, useGameStore } from "../game/store";
import { SKIN_THEMES, getSkin, skinColor } from "../game/skins";
import { SkinWeaponPreview } from "./WeaponView";

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
  return <main className={`crate-scene crate-scene--${phase}`}><button className="crate-back" onClick={onBack} disabled={phase === "unlocking" || phase === "spin"}><ArrowLeft size={18}/> BACK TO SHOP</button><h1>{weapon.toUpperCase()} THEME CRATE</h1><p>◉ 300 COINS · 10 RARE · 7 EPIC · 5 LEGENDARY THEMES</p>
    {phase === "drop" || phase === "unlock" || phase === "unlocking" ? <button className={`crate-box ${phase}`} onClick={open} disabled={phase !== "unlock"}><span className="crate-lock">{phase === "unlocking" ? "✧" : "▣"}</span><b>{phase === "drop" ? "DROPPING..." : phase === "unlocking" ? "LOCK OPENING..." : "TAP TO OPEN LOCK"}</b></button> : phase === "spin" ? <div className="crate-window" aria-label="Crate roulette spinning"><div className="crate-roulette">{Array.from({length: 30},(_,i) => {const theme=i===20&&prize?getSkin(prize)!:SKIN_THEMES[i%SKIN_THEMES.length];return <span key={i} className={`crate-roulette--${theme.rarity}`} style={{"--crate-color":theme.color,"--crate-accent":theme.accent} as React.CSSProperties}><em>{theme.rarity.toUpperCase()}</em><b>✦</b><strong>{theme.name}</strong></span>;})}</div><i/></div> : <div className={`crate-prize crate-prize--${getSkin(prize!)?.rarity}`} style={{"--crate-color":skinColor(prize!)} as React.CSSProperties}><span>✧ ◆ ✧</span><strong>{getSkin(prize!)?.rarity.toUpperCase()} DROP</strong><h2>YOU GOT {getSkin(prize!)?.name.toUpperCase()} {weapon.toUpperCase()}!</h2>{prize&&<SkinWeaponPreview weapon={weapon} skin={prize}/>}<button onClick={() => { if (prize) equipSkin(weapon, prize); onBack(); }}>EQUIP & RETURN</button><button onClick={onBack}>KEEP FOR LATER</button></div>}
  </main>;
}
