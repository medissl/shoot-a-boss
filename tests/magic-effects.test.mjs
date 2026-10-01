import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFile, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const memory=new Map();
const events=new EventTarget();
globalThis.window=Object.assign(globalThis,{localStorage:{getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)},addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events)});
globalThis.CustomEvent??=class CustomEvent extends Event{constructor(type,options){super(type);this.detail=options?.detail;}};
const bundled=await build({stdin:{contents:'export * from "./src/game/magicEffects.ts"; export {useGameStore} from "./src/game/store.ts";',resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,packages:'external'});
const output=new URL('../.magic-effects-test.mjs',import.meta.url);
await writeFile(output,bundled.outputFiles[0].contents);
const magic=await import(pathToFileURL(output.pathname).href);
await unlink(output);
const hits=[];
window.addEventListener('boss-hit',event=>hits.push(event.detail));
const setup=(runId,enemyPositions)=>{magic.useGameStore.setState({screen:'playing',runId,enemyPositions,eliminated:[]});hits.length=0;};
const primary={a:[0,0,0],b:[2,0,0],c:[5,0,0],d:[7,0,0]};

test('Fire impact, burst, trail, and final flare belong to the current projectile',()=>{
  for(const rank of [1,5,10,15,20]){
    setup(rank,primary);
    magic.magicSplash('fire',rank,[0,0,0]);
    const pool=magic.magicPools().at(-1);
    assert.equal(pool.finalFlare,rank>=20);
    assert.equal(hits.length>0,rank>=10,`fire burst tier ${rank}`);
    const before=magic.magicPools().length;
    magic.magicFireTrail(rank,[1,0,0]);
    assert.equal(magic.magicPools().length>before,rank>=15,`fire trail tier ${rank}`);
  }
});

test('Thunder chains, delayed pulse, and final small bolts use living nearby enemies',()=>{
  for(const rank of [1,5,10,15,20]){
    setup(30+rank,primary);
    magic.magicHit('thunder',rank,'a',[0,0,0]);
    assert.equal(hits.some(hit=>hit.id==='b'),rank>=5,`thunder chain tier ${rank}`);
    const before=hits.length;
    magic.magicMilestonePulse('thunder',rank,[0,0,0]);
    assert.equal(hits.length>before,rank>=10,`thunder aftershock tier ${rank}`);
    if(rank===20)assert.ok(hits.some(hit=>hit.id==='c'));
  }
});

test('Water splashes, Ice frost ring, and Crystal prison evolve at their tiers',()=>{
  for(const rank of [1,5,10,15,20]){
    setup(60+rank,{a:[0,0,0],b:[1,0,0]});
    magic.magicAreaPulse('water',rank,[0,0,0],true);
    assert.equal(hits.length>2,rank>=10,`water splash tier ${rank}`);
    const before=hits.length;magic.magicMilestonePulse('water',rank,[0,0,0]);
    assert.equal(hits.length>before,rank>=20,`monsoon tier ${rank}`);

    setup(90+rank,{a:[0,0,0],outer:[6,0,0]});
    magic.magicAreaPulse('ice',rank,[0,0,0],true);
    assert.equal(hits.some(hit=>hit.id==='outer'),rank>=10,`frost ring tier ${rank}`);
    const iceBefore=hits.length;magic.magicMilestonePulse('ice',rank,[6,0,0]);
    assert.equal(hits.length>iceBefore,rank>=20,`glacial fault tier ${rank}`);

    setup(120+rank,{a:[0,0,0]});
    const trails=magic.magicTrails().length;
    magic.magicAreaPulse('crystal',rank,[0,0,0],true);
    assert.equal(magic.magicTrails().length-trails,rank>=15?10:7,`crystal clusters tier ${rank}`);
    const crystalBefore=hits.length;magic.magicMilestonePulse('crystal',rank,[0,0,0]);
    assert.equal(hits.length>crystalBefore,rank>=10,`crystal fracture tier ${rank}`);
  }
});
