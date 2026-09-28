let enteringStage = false;

export function enterStageAfterCurtain(start: () => void) {
  if (enteringStage) return;
  enteringStage = true;
  window.dispatchEvent(new Event("ui-scene-open"));
  window.setTimeout(() => {
    enteringStage = false;
    start();
  }, 620);
}
