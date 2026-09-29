import { useEffect, useState } from "react";
import { useGameStore, type TutorialId } from "../game/store";
import { setFullscreenPreference } from "../game/fullscreen";

type Lesson = { title: string; body: string; action?: string };
const lessons: Record<TutorialId, Lesson> = {
  controls: { title: "START YOUR DREAM", body: "Move with WASD, aim with your mouse, fire with LMB, aim with RMB, reload with R, and switch weapons with 1–4." },
  xp: { title: "PLAYER XP", body: "Clearing a deadline earns XP. Fill the bar to raise your Player Level." },
  levelUp: { title: "LEVEL UP", body: "Player Levels award Skill Points. Every fifth level grants a bonus point." },
  skillPoint: { title: "✦ SKILL POINTS", body: "Leveling gives Skill Points. Spend them to awaken and improve Magic." },
  magic: { title: "MAGIC", body: "Open Dream Desk → Magic to choose an element. Once awakened, press F during combat to cast.", action: "OPEN MAGIC" },
  magicAwakened: { title: "MAGIC AWAKENED!", body: "Your first spell is ready. Press F in combat to cast it. Each element has a different cooldown and effect." },
  cards: { title: "DREAM CARDS", body: "Choose one of three cards. Cards last for this Dream, stack, and can combine into Evolutions. A Dream Anchor protects the part of your build earned before it." },
  coins: { title: "COINS", body: "Deadline rewards add Coins to your account. Spend them on permanent Gear, Heart recovery, or cosmetic Skin Crates." },
  anchor: { title: "DREAM ANCHOR SET", body: "Your build has been saved at the next stage. A Dream Collapse returns you here." },
  gear: { title: "PERMANENT GEAR", body: "You can afford Gear. Buy it in Dream Desk → Shop, then equip up to four pieces in Loadout.", action: "VIEW SHOP" },
  shop: { title: "THE SHOP", body: "Gear grants permanent power. Skin Crates are cosmetic and never improve combat." },
  crates: { title: "SKIN CRATES AVAILABLE", body: "A weapon crate costs 300 Coins and unlocks a new cosmetic skin. No combat advantage.", action: "VIEW CRATES" },
  hearts: { title: "ONE HEART LOST", body: "A failed deadline costs one Heart. At zero Hearts your Dream returns to its latest Anchor; permanent progress remains." },
  scan: { title: "FIND YOUR TARGET", body: "Q marks up to three nearest living enemies. All Hands Report marks every living enemy." },
  evolution: { title: "CARD COMBO READY", body: "Compatible Dream Cards can evolve into a powerful combined effect. Choose an Evolution on the next screen." },
};
let fullscreenPromptShown = false;

export function TutorialDirector() {
  const active = useGameStore(s => s.activeTutorial);
  const screen = useGameStore(s => s.screen);
  const complete = useGameStore(s => s.completeTutorial);
  const openMagic = useGameStore(s => s.openMagicFromResult);
  const [fullscreenPrompt, setFullscreenPrompt] = useState(() => !document.fullscreenElement && !fullscreenPromptShown);
  useEffect(() => { if (fullscreenPrompt) fullscreenPromptShown = true; }, [fullscreenPrompt]);
  const dismissFullscreen = () => setFullscreenPrompt(false);
  if (fullscreenPrompt && screen !== "playing" && screen !== "paused") return <div className="tutorial-shade"><section className="tutorial-card">
    <small>SESSION SUGGESTION</small><h2>BEST PLAYED FULLSCREEN</h2><p>Give this first-person Dream more room and keep the HUD in frame.</p>
    <div><button onClick={() => { void document.documentElement.requestFullscreen().then(() => setFullscreenPreference(true)).catch(() => undefined); dismissFullscreen(); }}>GO FULLSCREEN</button><button onClick={dismissFullscreen}>NOT NOW</button></div>
  </section></div>;
  if (!active || screen === "playing" || screen === "paused") return null;
  const lesson = lessons[active];
  const action = () => { complete(); if (active === "magic") openMagic(); else if (active === "gear" || active === "crates") {
    if (screen === "menu") { sessionStorage.setItem("sab-shop-category", active === "crates" ? "crates" : "gear"); window.dispatchEvent(new CustomEvent("tutorial-desk-tab", { detail: active === "gear" ? "shop" : "crates" })); }
  } };
  return <div className="tutorial-shade"><section className="tutorial-card" role="dialog" aria-modal="true" aria-label={lesson.title}>
    <small>NEW DISCOVERY</small><h2>{lesson.title}</h2><p>{lesson.body}</p>
    <div>{lesson.action && <button onClick={action}>{lesson.action} →</button>}<button onClick={complete}>{lesson.action ? "LATER" : "CONTINUE"} →</button></div>
  </section></div>;
}
