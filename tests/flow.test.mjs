import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFile, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const memory = new Map();
const localStorage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: key => memory.delete(key),
};
const events = new EventTarget();
globalThis.window = Object.assign(globalThis, {
  localStorage,
  addEventListener: events.addEventListener.bind(events),
  removeEventListener: events.removeEventListener.bind(events),
  dispatchEvent: events.dispatchEvent.bind(events),
});
globalThis.CustomEvent ??= class CustomEvent extends Event {
  constructor(type, options) { super(type); this.detail = options?.detail; }
};

const output = new URL('../.flow-store.mjs', import.meta.url);
const bundle = await build({ entryPoints: ['src/game/store.ts'], bundle: true, platform: 'node', format: 'esm', write: false, packages: 'external' });
await writeFile(output, bundle.outputFiles[0].contents);
const { useGameStore, SAVE_VERSION } = await import(pathToFileURL(output.pathname).href);
await unlink(output);
async function reloadStore() {
  const reloaded = new URL('../.flow-store-reload.mjs', import.meta.url);
  await writeFile(reloaded, bundle.outputFiles[0].contents);
  try { return (await import(`${pathToFileURL(reloaded.pathname).href}?v=${Math.random()}`)).useGameStore; }
  finally { await unlink(reloaded); }
}

function dismissLessons() {
  while (useGameStore.getState().activeTutorial) useGameStore.getState().completeTutorial();
}

test('first clear follows distinct result, card, and pre-stage steps', () => {
  useGameStore.getState().resetData();
  useGameStore.getState().startGame();
  useGameStore.getState().closeTutorial();
  for (let i = 0; i < 4; i++) useGameStore.getState().eliminate(`target-${i}`);
  assert.equal(useGameStore.getState().screen, 'stageClear');
  assert.ok(useGameStore.getState().playerLevel >= 2);
  assert.ok(useGameStore.getState().activeTutorial);
  dismissLessons();
  useGameStore.getState().advanceResult();
  assert.equal(useGameStore.getState().screen, 'levelUp');
  dismissLessons();
  useGameStore.getState().advanceResult();
  assert.equal(useGameStore.getState().screen, 'reward');
  dismissLessons();
  useGameStore.getState().advanceResult();
  assert.equal(useGameStore.getState().screen, 'upgrade');
  dismissLessons();
  useGameStore.getState().chooseUpgrade(useGameStore.getState().upgradeChoices[0]);
  useGameStore.getState().continueDraft();
  assert.equal(useGameStore.getState().screen, 'menu');
  assert.deepEqual(useGameStore.getState().preStage, { level: 2, practice: false });
  useGameStore.getState().startPreparedStage();
  assert.equal(useGameStore.getState().screen, 'playing');
  assert.equal(useGameStore.getState().currentLevel, 2);
  const saved = JSON.parse(localStorage.getItem('shoot-a-boss:campaign'));
  assert.equal(saved.saveVersion, SAVE_VERSION);
});

test('practice death preserves hearts, run build, and campaign stage', () => {
  const before = useGameStore.getState();
  useGameStore.setState({ screen: 'menu', currentLevel: 3, unlockedLevel: 3 });
  useGameStore.getState().prepareStage(1, true);
  useGameStore.getState().startPreparedStage();
  assert.equal(useGameStore.getState().practiceActive, true);
  useGameStore.getState().damagePlayer(500);
  assert.equal(useGameStore.getState().screen, 'practiceResult');
  assert.equal(useGameStore.getState().hearts, before.hearts);
  useGameStore.getState().goToMenu();
  assert.equal(useGameStore.getState().currentLevel, 3);
  assert.deepEqual(useGameStore.getState().upgrades, before.upgrades);
});

test('evolution is a separate scene after a normal card', () => {
  const state = useGameStore.getState();
  useGameStore.setState({ screen: 'upgrade', currentLevel: 5, upgrades: { ...state.upgrades, damage: 1, fireRate: 1 }, upgradeChoices: ['movement'], selectedUpgrade: null, evolutions: [] });
  useGameStore.getState().chooseUpgrade('movement');
  useGameStore.getState().continueDraft();
  assert.equal(useGameStore.getState().screen, 'evolution');
  useGameStore.getState().chooseEvolution('crunchTime');
  useGameStore.getState().continueEvolution();
  assert.deepEqual(useGameStore.getState().preStage, { level: 6, practice: false });
  assert.ok(useGameStore.getState().evolutions.includes('crunchTime'));
});

test('base scan selects the three closest living targets; Recon reveals all', () => {
  const state = useGameStore.getState();
  useGameStore.setState({ screen: 'playing', practiceActive: false, tutorialOpen: false, scanCooldownUntil: 0,
    playerPosition: [0, 0, 0], enemyPositions: { a: [3, 0, 0], b: [4, 0, 0], c: [5, 0, 0], d: [40, 0, 0] }, eliminated: [] });
  useGameStore.getState().triggerScan();
  assert.deepEqual(useGameStore.getState().scanTargets, ['a', 'b', 'c']);
  useGameStore.setState({ scanCooldownUntil: 0, upgrades: { ...state.upgrades, recon: 1 } });
  useGameStore.getState().triggerScan();
  assert.equal(useGameStore.getState().scanTargets.length, 4);
});

test('practice clear pays no permanent reward', () => {
  const state = useGameStore.getState();
  useGameStore.setState({ screen: 'menu', currentLevel: 3, unlockedLevel: 3, scanCooldownUntil: 0 });
  useGameStore.getState().prepareStage(1, true);
  useGameStore.getState().startPreparedStage();
  const coins = useGameStore.getState().coins;
  const xp = useGameStore.getState().xp;
  const claims = useGameStore.getState().claimedRewards.slice();
  for (let i = 0; i < 4; i++) useGameStore.getState().eliminate(`target-${i}`);
  assert.equal(useGameStore.getState().screen, 'practiceResult');
  assert.equal(useGameStore.getState().coins, coins);
  assert.equal(useGameStore.getState().xp, xp);
  assert.deepEqual(useGameStore.getState().claimedRewards, claims);
  useGameStore.getState().goToMenu();
  assert.equal(useGameStore.getState().currentLevel, 3);
});

test('result reload restores its scene and actual remaining health', async () => {
  useGameStore.setState({ screen: 'stageClear', currentLevel: 3, unlockedLevel: 4, hp: 37, lastLevelGain: 0 });
  useGameStore.getState().advanceResult();
  const reloaded = await reloadStore();
  assert.equal(reloaded.getState().screen, 'reward');
  assert.equal(reloaded.getState().hp, 37);
});

test('old save migrates tutorials and retains unlocked cosmetics', async () => {
  memory.set('shoot-a-boss:campaign', JSON.stringify({ level: 2, saveVersion: 0, tutorialSeen: true,
    skins: { rifle: ['default', 'blue'] }, equippedSkins: { rifle: 'blue' }, magic: { fire: 1 } }));
  const reloaded = await reloadStore();
  assert.equal(reloaded.getState().tutorials.controls, true);
  assert.equal(reloaded.getState().tutorials.magic, true);
  assert.ok(reloaded.getState().skins.rifle.includes('inkspill'));
  assert.equal(reloaded.getState().equippedSkins.rifle, 'inkspill');
});

test('a clean campaign can advance through all ten result flows', () => {
  useGameStore.getState().resetData();
  useGameStore.getState().startGame();
  useGameStore.getState().closeTutorial();
  for (let level = 1; level <= 10; level++) {
    const count = useGameStore.getState().targetCount;
    for (let i = 0; i < count; i++) useGameStore.getState().eliminate(`stage-${level}-target-${i}`);
    assert.equal(useGameStore.getState().screen, 'stageClear');
    dismissLessons();
    while (['stageClear', 'levelUp', 'reward'].includes(useGameStore.getState().screen)) {
      useGameStore.getState().advanceResult();
      dismissLessons();
    }
    assert.equal(useGameStore.getState().screen, 'upgrade');
    assert.equal(useGameStore.getState().upgradeChoices.length, 3);
    useGameStore.getState().chooseUpgrade(useGameStore.getState().upgradeChoices[0]);
    useGameStore.getState().continueDraft();
    if (useGameStore.getState().screen === 'evolution') {
      for (const id of ['crunchTime', 'bottomlessInbox', 'paperTrail', 'returnToSender', 'overtimeArcana', 'expenseReport']) {
        useGameStore.getState().chooseEvolution(id);
        if (useGameStore.getState().selectedEvolution) break;
      }
      assert.ok(useGameStore.getState().selectedEvolution);
      useGameStore.getState().continueEvolution();
    }
    if (level < 10) {
      assert.deepEqual(useGameStore.getState().preStage, { level: level + 1, practice: false });
      useGameStore.getState().startPreparedStage();
      assert.equal(useGameStore.getState().currentLevel, level + 1);
    }
  }
  assert.equal(useGameStore.getState().screen, 'won');
  assert.equal(useGameStore.getState().claimedRewards.length, 10);
});
