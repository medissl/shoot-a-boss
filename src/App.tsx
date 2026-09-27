import { AudioManager } from "./components/AudioManager";
import { ComicIntro } from "./components/ComicIntro";
import { GameCanvas } from "./components/GameCanvas";
import { MainMenu } from "./components/MainMenu";
import { useGameStore } from "./game/store";

export default function App() {
  const screen = useGameStore((state) => state.screen);
  const runId = useGameStore((state) => state.runId);

  let content;
  if (screen === "story") content = <ComicIntro mode="launch" />;
  else if (screen === "comic") content = <ComicIntro mode="reader" />;
  else if (screen === "menu") content = <MainMenu />;
  else content = <GameCanvas key={runId} />;

  return (
    <>
      <AudioManager />
      {content}
    </>
  );
}
