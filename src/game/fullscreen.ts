let preferred = false;

export function prefersFullscreen() { return preferred; }
export function setFullscreenPreference(value: boolean) { preferred = value; }

// Chrome owns Escape in fullscreen and can exit before game code receives it.
// The resume click is a new user gesture, so it may enter fullscreen again.
export function restorePreferredFullscreen() {
  if (preferred && !document.fullscreenElement && document.fullscreenEnabled) {
    return document.documentElement.requestFullscreen().then(() => true).catch(() => false);
  }
  return Promise.resolve(true);
}
