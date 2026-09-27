import { ComicIntro } from "./components/ComicIntro";
import { GameCanvas } from "./components/GameCanvas";
import { StartScreen } from "./components/StartScreen";
import { useGameStore } from "./game/store";

export default function App() {
  const screen = useGameStore((state) => state.screen);
  const runId = useGameStore((state) => state.runId);

  if (screen === "story") return <ComicIntro />;
  if (screen === "menu") return <StartScreen />;
  return <GameCanvas key={runId} />;
}
