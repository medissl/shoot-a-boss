import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFile, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const output = new URL('../.spawn-test.mjs', import.meta.url);
const bundle = await build({ entryPoints: ['src/game/levels.ts'], bundle: true, platform: 'node', format: 'esm', write: false, packages: 'external' });
await writeFile(output, bundle.outputFiles[0].contents);
const { getEnemySpawnPool, getEnemyTuning, isGemGroundSpawnValid, getTargetCount } = await import(pathToFileURL(output.pathname).href);
await unlink(output);

test('Gem stages have sufficient valid, separated ground spawns across ten layouts', () => {
  for (const level of [3, 6, 9]) for (let runId = 0; runId < 10; runId++) {
    const tuning = getEnemyTuning(level);
    const required = getTargetCount(level) - 3;
    const pool = getEnemySpawnPool(level, runId);
    assert.ok(pool.length >= required, `Stage ${level}, layout ${runId}: ${pool.length}/${required}`);
    for (const [x, y, z] of pool.slice(0, required)) {
      assert.equal(y, 0);
      assert.ok(isGemGroundSpawnValid(x, z, .8), `Stage ${level} invalid ${x},${z}`);
    }
    assert.ok(tuning.paperwork > 0);
  }
});
