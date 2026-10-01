export type BossHealth = { id: string; name: string; health: number; maxHp: number; detail?: string };

export function reportBossHealth(value: BossHealth | { id: string; clear: true }) {
  window.dispatchEvent(new CustomEvent("boss-health", { detail: value }));
}
