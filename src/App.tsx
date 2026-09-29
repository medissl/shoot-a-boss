import { AudioManager } from "./components/AudioManager";
import { Arsenal } from "./components/Arsenal";
import { ComicIntro } from "./components/ComicIntro";
import { GameCanvas } from "./components/GameCanvas";
import { MainMenu } from "./components/MainMenu";
import { SceneCurtain } from "./components/SceneCurtain";
import { UpgradeScreen } from "./components/UpgradeScreen";
import { useGameStore } from "./game/store";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const tryLandscape = () => { const orientation = window.screen.orientation as ScreenOrientation & {lock?: (value:string)=>Promise<void>}; void orientation?.lock?.("landscape").catch(() => undefined); };
    window.addEventListener("pointerdown", tryLandscape, {once:true});
    return () => window.removeEventListener("pointerdown", tryLandscape);
  }, []);
  const screen = useGameStore((state) => state.screen);
  const runId = useGameStore((state) => state.runId);

  let content;
  if (new URLSearchParams(window.location.search).has("arsenal")) content = <Arsenal onBack={() => { window.location.href = "/"; }} />;
  else if (screen === "story") content = <ComicIntro mode="launch" />;
  else if (screen === "comic") content = <ComicIntro mode="reader" />;
  else if (screen === "menu") content = <MainMenu />;
  else if (screen === "upgrade") content = <UpgradeScreen />;
  else content = <GameCanvas key={runId} />;

  return (
    <>
      <AudioManager />
      {content}
      <SceneCurtain />
    </>
  );
}
