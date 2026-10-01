import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

async function source(path) {
  const result = await build({entryPoints:[path],bundle:true,platform:'node',format:'esm',write:false});
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`);
}

const cards = await source('src/game/progression.ts');
const magic = await source('src/game/magicTree.ts');
const weapons = ['sniper','rifle','shotgun','knife'];
const rarities = ['common','rare','epic','legendary'];

test('weapon card count and rarity parity', () => {
  const table = weapons.map(weapon => {
    const row = Object.fromEntries(rarities.map(rarity => [rarity,cards.UPGRADE_CARDS.filter(card => card.weapon === weapon && card.rarity === rarity).length]));
    return {weapon,...row,total:Object.values(row).reduce((a,b)=>a+b,0)};
  });
  console.table(table);
  for(const row of table)assert.deepEqual(rarities.map(r => row[r]),[1,2,2,1],row.weapon);
});

test('ten thousand drafts per preferred weapon keep all weapons available and favor the preferred build', () => {
  for(const preferred of weapons){
    const counts = Object.fromEntries(weapons.map(weapon => [weapon,0]));
    for(let i=0;i<10000;i++)for(const id of cards.rollUpgradeChoices(i+1,i,cards.emptyUpgrades(),true,[],preferred)){
      const weapon=cards.getUpgradeCard(id).weapon;
      if(weapon)counts[weapon]++;
    }
    console.log(preferred,counts);
    for(const weapon of weapons)assert.ok(counts[weapon]>0,`${weapon} remains draftable`);
    for(const weapon of weapons.filter(w=>w!==preferred))assert.ok(counts[preferred]>counts[weapon]*2,`${preferred} bias over ${weapon}`);
  }
});

test('five spells have current milestone descriptions at tiers 5, 10, 15, and 20', () => {
  const names = {fire:['SCORCHED GROUND','FIREBURST','INFERNO TRAIL','FINAL INFERNO'],thunder:['CHAIN REACTION','AFTERSHOCK','STORM NETWORK','JUDGEMENT STORM'],water:['HEAVY RAIN','SPLASH ZONE','MOVING FRONT','MONSOON'],ice:['DEEP FREEZE','FROST RING','PERMAFROST','GLACIAL FAULT'],crystal:['SHARD PRISON','FRACTURE','BRANCHING FORMATION','CRYSTAL DOMAIN']};
  for(const [kind,expected] of Object.entries(names))for(const [index,name] of expected.entries())assert.match(magic.magicNodeDetail(kind,(index+1)*5,'force'),new RegExp(name));
});
