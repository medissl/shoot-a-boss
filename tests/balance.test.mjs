import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFile, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

async function loadSource(name) {
  const output = new URL(`../.balance-${name}.mjs`, import.meta.url);
  const bundle = await build({ entryPoints: [`src/game/${name}.ts`], bundle: true, platform: 'node', format: 'esm', write: false, packages: 'external' });
  await writeFile(output, bundle.outputFiles[0].contents);
  try { return await import(pathToFileURL(output.pathname).href); }
  finally { await unlink(output); }
}
const levels = await loadSource('levels');
const encounter = await loadSource('encounter');
const magic = await loadSource('magicTree');

test('each stage target equals its required roster, including Gem extras and the Dragon', () => {
  const expected = [4, 7, 9, 8, 10, 12, 12, 10, 13, 14, 14, 12];
  for (let stage = 1; stage <= 12; stage++) {
    const e = levels.getEnemyTuning(stage);
    const roster = ['bosses','paperwork','pens','flying','statues','sticky','stapler','highlighter','shredder','clipboard','elite','dragon'].reduce((sum, key) => sum + (e[key] ?? 0), 0);
    const gems = levels.getLevelDefinition(stage).theme === 'gems' ? 3 : 0;
    assert.equal(levels.getTargetCount(stage), roster + gems, `stage ${stage}`);
    assert.equal(levels.getTargetCount(stage), expected[stage - 1], `stage ${stage} balance snapshot`);
  }
  assert.equal(levels.getEnemyTuning(12).dragon, 1);
});

test('field pressure has no sudden ordinary stage cliff and boss fields stay small', () => {
  let previous = 0;
  for (let stage = 1; stage <= 12; stage++) {
    const opening = encounter.fieldCap(stage, 'OPENING');
    const pressure = opening * levels.getEnemyTuning(stage).damage;
    assert.ok(opening >= 4 && opening <= 8);
    if (previous) assert.ok(pressure / previous < 1.42, `stage ${stage} pressure jump ${(pressure / previous).toFixed(2)}`);
    if ([4,6,8].includes(stage)) assert.ok(opening <= 5, `boss field ${stage}`);
    previous = pressure;
  }
  assert.ok(encounter.spawnCadence('FINAL PUSH') >= 850);
});

test('every normal spell retains at least 45% of its base cooldown under maximum Tempo and Gear reduction', () => {
  for (const kind of magic.ELEMENTS) {
    const choices = magic.emptyMagicChoices();
    for (let tier = 2; tier <= 20; tier++) choices[kind][tier] = 'tempo';
    const cooldown = magic.adjustedMagicCooldown(kind, 20, choices, .9);
    assert.ok(cooldown >= magic.ELEMENT_DESIGN[kind].cooldown * .45, kind);
  }
});
