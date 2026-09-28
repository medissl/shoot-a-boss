import { getSkin, SKIN_IDS, type SkinId } from "./skins";
import type { WeaponId } from "./config";

type Action="fire"|"equip"|"reload";
const timbres={
  scratch:{start:700,end:210,wave:"triangle",noise:.23},paper:{start:830,end:160,wave:"sine",noise:.28},
  metal:{start:980,end:420,wave:"square",noise:.1},digital:{start:1320,end:340,wave:"square",noise:.035},
  electric:{start:1640,end:350,wave:"sawtooth",noise:.09},glass:{start:1330,end:780,wave:"sine",noise:.08},
  fire:{start:540,end:110,wave:"triangle",noise:.34},bubble:{start:240,end:750,wave:"sine",noise:.08},
  space:{start:145,end:58,wave:"sine",noise:.14},glitch:{start:410,end:90,wave:"square",noise:.18},
} as const;
const buffers=new WeakMap<AudioContext,AudioBuffer>();
const last=new Map<string,number>();

/** A quiet, short theme layer under the existing weapon recording. Never changes mechanics. */
export function playSkinSound(context:AudioContext,id:SkinId,action:Action,volume:number,weapon:WeaponId){
  const skin=getSkin(id);if(!skin||volume<=0)return;
  const key=`${id}:${weapon}:${action}`;const at=performance.now();
  if(at-(last.get(key)??-Infinity)<(action==="fire"?120:350))return;
  last.set(key,at);
  const timbre=timbres[skin.sound];
  const profile={rifle:{pitch:1.08,length:.82,gain:.8},shotgun:{pitch:.74,length:1.16,gain:1.12},sniper:{pitch:.62,length:1.5,gain:1.22},knife:{pitch:1.42,length:.68,gain:.75}}[weapon];
  const identity=1+(SKIN_IDS.indexOf(id as typeof SKIN_IDS[number])%4)*.035;
  const duration=(action==="fire"?.14:action==="equip"?.23:.29)*profile.length;
  const start=context.currentTime;
  const envelope=context.createGain();
  const amplitude=Math.min(.16,volume*profile.gain*(skin.rarity==="legendary"?.13:skin.rarity==="epic"?.1:.075));
  envelope.gain.setValueAtTime(.001,start);
  envelope.gain.exponentialRampToValueAtTime(Math.max(.001,amplitude),start+.012);
  envelope.gain.exponentialRampToValueAtTime(.001,start+duration);
  envelope.connect(context.destination);
  const oscillator=context.createOscillator();oscillator.type=timbre.wave;
  oscillator.frequency.setValueAtTime((action==="fire"?timbre.start:timbre.start*.65)*profile.pitch*identity,start);
  oscillator.frequency.exponentialRampToValueAtTime(timbre.end*profile.pitch*identity,start+duration);
  oscillator.connect(envelope);oscillator.start(start);oscillator.stop(start+duration+.02);
  let buffer=buffers.get(context);
  if(!buffer){buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.4),context.sampleRate);const samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;buffers.set(context,buffer);}
  const noise=context.createBufferSource();noise.buffer=buffer;
  const filter=context.createBiquadFilter();filter.type="bandpass";filter.frequency.value=timbre.start*.8*profile.pitch;filter.Q.value=.6;
  const noiseGain=context.createGain();noiseGain.gain.value=timbre.noise;
  noise.connect(filter);filter.connect(noiseGain);noiseGain.connect(envelope);noise.start(start);noise.stop(start+duration+.02);
  oscillator.onended=()=>{oscillator.disconnect();noise.disconnect();filter.disconnect();noiseGain.disconnect();envelope.disconnect();};
}
