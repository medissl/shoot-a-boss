import { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, LockKeyhole, Play, SlidersHorizontal, Sparkles } from "lucide-react";
import { LEVELS, MAX_STAGE } from "../game/levels";
import { useGameStore } from "../game/store";
import { type UpgradeId } from "../game/progression";
import { ControlsList } from "./ControlsList";
import { GearShopScene } from "./GearShopScene";
import { FullscreenToggle } from "./FullscreenToggle";
import { MonsterEncyclopedia } from "./MonsterEncyclopedia";
import { EquipmentHub } from "./EquipmentHub";
import { Arsenal } from "./Arsenal";
import { SkillTree } from "./SkillTree";
import { ResetDataButton } from "./ResetDataButton";
import { ProgressStrip } from "./ProgressStrip";
import { enterStageAfterCurtain } from "../game/sceneTransition";

type Scene = "home" | "stages" | "desk" | "archives" | "options";
type DeskTab = "loadout" | "magic" | "shop" | "arsenal";
type ArchiveTab = "story" | "bestiary";
const deskTabs: DeskTab[] = ["loadout", "magic", "shop", "arsenal"];

export function MainMenu() {
  const state = useGameStore();
  const queueTutorial = useGameStore(s => s.queueTutorial);
  const [scene, setScene] = useState<Scene>(() => {
    const landing = sessionStorage.getItem("sab-menu-scene"); sessionStorage.removeItem("sab-menu-scene");
    return state.preStage || state.postStageReturn || new URLSearchParams(location.search).has("arsenal") || landing === "desk" ? "desk" : landing === "stages" ? "stages" : "home";
  });
  const [returnTo, setReturnTo] = useState<"home" | "stages">(state.preStage || state.currentLevel > 1 ? "stages" : "home");
  const [deskTab, setDeskTab] = useState<DeskTab>(state.postStageReturn ? "magic" : new URLSearchParams(location.search).has("arsenal") ? "arsenal" : "loadout");
  const [archiveTab, setArchiveTab] = useState<ArchiveTab>("story");
  const [crateActive, setCrateActive] = useState(false);
  useEffect(() => {
    const open = (event: Event) => {
      const tab = (event as CustomEvent<string>).detail;
      if (tab === "shop" || tab === "crates" || tab === "magic" || tab === "loadout") { setScene("desk"); setDeskTab(tab === "crates" ? "shop" : tab); }
    };
    window.addEventListener("tutorial-desk-tab", open);
    return () => window.removeEventListener("tutorial-desk-tab", open);
  }, []);
  useEffect(() => { if (scene === "desk" && deskTab === "shop") queueTutorial("shop"); }, [scene, deskTab, queueTutorial]);
  const back = () => { if (state.postStageReturn) { state.returnFromMagic(); return; } if (scene === "desk" && state.preStage) useGameStore.setState({ preStage: null }); setScene(scene === "desk" ? returnTo : "home"); };
  const prepare = (origin: "home" | "stages", tab: DeskTab = "loadout") => { setReturnTo(origin); setDeskTab(tab); setScene("desk"); };
  const selectStage = (level: number, practice = false) => { state.prepareStage(level, practice); prepare("stages"); };
  const activeCards = (Object.entries(state.upgrades) as [UpgradeId, number][]).filter(([, count]) => count > 0);
  const selectedSpell = state.selectedMagic ? `${state.selectedMagic.toUpperCase()} · TIER ${state.magic[state.selectedMagic]}` : "NOT LEARNED";

  return <main className={`main-menu-shell main-menu-shell--${scene}`}>
    <div className="main-menu-speed-lines" aria-hidden="true" />
    {scene === "home" && <div className="github-comic-bubble"><a href="https://github.com/medissl" target="_blank" rel="noreferrer">Checkout my github for more games!</a></div>}
    {scene === "home" && <section className="main-menu-card">
      <p className="main-menu-kicker">AFTER HOURS // DREAM TERMINAL</p><h1>SHOOT<br />A BOSS</h1>
      <p className="main-menu-copy">The paperwork can wait. The dream is still running.</p>
      <ProgressStrip />
      <div className="main-menu-actions">
        <button onClick={() => setScene("stages")}><Play size={17} /> PLAY DREAM</button>
        <button onClick={() => prepare("home")}><Sparkles size={17} /> DREAM DESK</button>
        <button onClick={() => setScene("archives")}><BookOpen size={17} /> ARCHIVES</button>
        <button onClick={() => setScene("options")}><SlidersHorizontal size={17} /> OPTIONS</button>
      </div>
      <div className="main-menu-note"><span>WASD</span> move · <span>1–4</span> weapons · <span>LMB</span> attack · <span>RMB</span> aim · <span>G</span> paper bomb</div>
    </section>}
    {scene === "stages" && <section className="main-menu-card is-level-select"><div className="stage-select">
      <button className="stage-select__back" onClick={back}><ChevronLeft size={16} /> BACK</button>
      <p className="main-menu-kicker">PLAY DREAM // {MAX_STAGE} DEADLINES</p><h2>DREAM<br />MAP</h2>
      <ProgressStrip compact />
      <div className="stage-run-summary">
        <span>RUN CARDS <b>{activeCards.reduce((sum, [, count]) => sum + count, 0)}</b></span>
        <span>MAGIC <b>{selectedSpell}</b></span>
        <span>GEAR <b>{state.equippedGear.length}/4 EQUIPPED</b></span>
      </div>
      <p className="stage-select__copy">Continue your active dream. Clearing a stage unlocks the next deadline.</p>
      {state.unlockedLevel >= MAX_STAGE && state.champion && <button className="ng-plus-button" onClick={() => selectStage(state.champion?.ready ? 1 : state.champion?.level ?? state.currentLevel)}>
        {state.champion.ready ? `START NG+ LOOP ${state.champion.cycle + 1}` : `CONTINUE NG+ LOOP ${state.champion.cycle}`}
      </button>}
      <div className="stage-road">{LEVELS.map((level, index) => {
        const available = state.ngPlusCycle === 0 && level.level === state.currentLevel && level.level <= state.unlockedLevel && !state.champion?.ready;
        const completed = level.level < state.currentLevel || Boolean(state.champion?.ready);
        return <div key={level.level} className={`stage-node stage-node--${level.theme} ${available ? "is-unlocked" : completed ? "is-completed" : "is-locked"}`}
          style={{ "--stage-index": index } as React.CSSProperties}>
          <button disabled={!available} onClick={() => selectStage(level.level)}>
          <span className="stage-node__number">{completed ? "✓" : available ? level.level : <LockKeyhole size={16} />}</span>
          <span className="stage-node__text"><strong>{level.name}</strong><small>{completed ? "COMPLETED" : level.difficulty}</small></span>
          </button>{completed && <button className="stage-practice" onClick={() => selectStage(level.level, true)}>PRACTICE</button>}</div>;
      })}<span className="stage-road__line" aria-hidden="true" /></div>
    </div></section>}
    {scene === "desk" && <div className={`dream-desk ${crateActive ? "dream-desk--crate" : ""}`}>
      <header className="dream-desk__header"><button onClick={back}><ChevronLeft size={17} /> {state.postStageReturn ? "RETURN TO REWARDS" : returnTo === "stages" ? "DREAM MAP" : "MENU"}</button><div><small>ONE HOME FOR YOUR BUILD</small><h1>DREAM DESK</h1></div><ProgressStrip compact /></header>
      {!crateActive && <nav className="dream-desk__tabs" aria-label="Dream Desk">{deskTabs.map(tab => <button key={tab} data-tutorial={`desk-${tab}-tab`} className={deskTab === tab ? "is-active" : ""} onClick={() => setDeskTab(tab)}>{tab.toUpperCase()}</button>)}</nav>}
      <div className="dream-desk__content">
        {deskTab === "loadout" && <EquipmentHub openShop={() => setDeskTab("shop")} />}
        {deskTab === "magic" && <SkillTree onBack={back} />}
        {deskTab === "shop" && <GearShopScene onBack={back} onCrateActiveChange={setCrateActive} />}
        {deskTab === "arsenal" && <Arsenal onBack={back} />}
      </div>
      {state.preStage && !state.postStageReturn && !crateActive && <footer className="prestage-footer"><div><small>{state.preStage.practice ? "PRACTICE · NO HEARTS / COINS / XP / CARDS" : state.champion?.ready ? "NG+ · NEXT DEADLINE" : "NEXT DEADLINE"}</small><h2>LEVEL {state.preStage.level} · {LEVELS[state.preStage.level - 1].name}</h2><span>{state.preStage.practice ? "Practice does not change your campaign." : `${state.equippedGear.length}/4 GEAR · ${selectedSpell} · ${activeCards.length} CARDS`}</span></div><button onClick={() => enterStageAfterCurtain(state.startPreparedStage)}>START {state.preStage.practice ? "PRACTICE" : `LEVEL ${state.preStage.level}`} →</button></footer>}
    </div>}
    {scene === "archives" && <div className="dream-archives">
      <header><button onClick={back}><ChevronLeft size={17} /> MENU</button><h1>ARCHIVES</h1></header>
      <nav className="dream-desk__tabs" aria-label="Archives">{(["story", "bestiary"] as ArchiveTab[]).map(tab => <button key={tab} className={archiveTab === tab ? "is-active" : ""} onClick={() => setArchiveTab(tab)}>{tab.toUpperCase()}</button>)}</nav>
      {archiveTab === "story" ? <div className="archive-story">{Array.from({ length: 6 }, (_, i) => <figure key={i}><img src={`/comicopening${i + 1}.png`} alt={`Opening comic panel ${i + 1}`} /><figcaption>PAGE {i + 1} / 6</figcaption></figure>)}</div> : <MonsterEncyclopedia onBack={back} />}
    </div>}
    {scene === "options" && <section className="main-menu-card main-menu-options-page">
      <button className="stage-select__back" onClick={back}><ChevronLeft size={16} /> MENU</button><h1>OPTIONS</h1>
      <div className="main-menu-options"><FullscreenToggle /><ControlsList />
        <label className="sensitivity-control"><span>CAMERA SENSITIVITY</span><b>{state.sensitivity.toFixed(2)}×</b><input type="range" min=".25" max="1.6" step=".05" value={state.sensitivity} onChange={(e) => state.setSensitivity(Number(e.target.value))} /></label>
        <label className="sensitivity-control audio-control"><span>BGM VOLUME</span><b>{Math.round(state.bgmVolume * 100)}%</b><input type="range" min="0" max="1" step=".05" value={state.bgmVolume} onChange={(e) => state.setBgmVolume(Number(e.target.value))} /></label>
        <label className="sensitivity-control audio-control"><span>SFX VOLUME</span><b>{Math.round(state.sfxVolume * 100)}%</b><input type="range" min="0" max="1" step=".05" value={state.sfxVolume} onChange={(e) => state.setSfxVolume(Number(e.target.value))} /></label>
        <h2>TUTORIAL REPLAY</h2><div className="tutorial-topic-list">{(Object.keys(state.tutorials) as import("../game/store").TutorialId[]).map(topic => <button key={topic} onClick={() => state.queueTutorial(topic, true)}>{topic.toUpperCase()}</button>)}</div>
        <ResetDataButton />
      </div>
    </section>}
    <small className="creator-credit creator-credit--menu">Made by Medianto Susilo</small>
  </main>;
}
