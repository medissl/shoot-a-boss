import { getSkin, type SkinId } from './skins';
import type { WeaponId } from './config';
type Action='fire'|'equip'|'reload';
type Wave=OscillatorType;
type Timbre={pitch:number;fall:number;wave:Wave;noise:number;filter:BiquadFilterType;cut:number;echo:number;harmonic:number;attack:number};
/** Individually tuned timbres. The same family is processed separately for each weapon. */
const voices:Record<string,Timbre>={
 ink:{pitch:390,fall:115,wave:'triangle',noise:.31,filter:'lowpass',cut:820,echo:.12,harmonic:1.4,attack:.006},
 chalk:{pitch:830,fall:350,wave:'sine',noise:.42,filter:'highpass',cut:1200,echo:.02,harmonic:1.6,attack:.001},
 metal:{pitch:210,fall:78,wave:'square',noise:.26,filter:'bandpass',cut:670,echo:.03,harmonic:2.25,attack:.001},
 paper:{pitch:1130,fall:290,wave:'sine',noise:.48,filter:'highpass',cut:1800,echo:.09,harmonic:1.26,attack:.003},
 arcade:{pitch:950,fall:240,wave:'square',noise:.07,filter:'lowpass',cut:2100,echo:.09,harmonic:2,attack:.001},
 staple:{pitch:370,fall:145,wave:'triangle',noise:.24,filter:'bandpass',cut:980,echo:.02,harmonic:3,attack:.001},
 spray:{pitch:720,fall:180,wave:'sawtooth',noise:.58,filter:'bandpass',cut:2100,echo:.03,harmonic:1.1,attack:.013},
 comic:{pitch:440,fall:72,wave:'square',noise:.18,filter:'lowpass',cut:1200,echo:.12,harmonic:1.5,attack:.001},
 blueprint:{pitch:1450,fall:790,wave:'sine',noise:.1,filter:'highpass',cut:2100,echo:.13,harmonic:2.01,attack:.001},
 cassette:{pitch:610,fall:185,wave:'sawtooth',noise:.4,filter:'lowpass',cut:1250,echo:.16,harmonic:.5,attack:.003},
 circuit:{pitch:1480,fall:215,wave:'sawtooth',noise:.12,filter:'bandpass',cut:2800,echo:.13,harmonic:2.5,attack:.001},
 ice:{pitch:1820,fall:680,wave:'sine',noise:.15,filter:'highpass',cut:3000,echo:.24,harmonic:1.51,attack:.001},
 fire:{pitch:310,fall:61,wave:'sawtooth',noise:.56,filter:'lowpass',cut:1500,echo:.09,harmonic:.74,attack:.004},
 toxic:{pitch:180,fall:540,wave:'sine',noise:.18,filter:'bandpass',cut:850,echo:.15,harmonic:2.1,attack:.013},
 storm:{pitch:2150,fall:104,wave:'sawtooth',noise:.43,filter:'highpass',cut:1900,echo:.17,harmonic:.48,attack:.001},
 clock:{pitch:760,fall:375,wave:'triangle',noise:.1,filter:'bandpass',cut:1600,echo:.19,harmonic:1.5,attack:.001},
 abyss:{pitch:180,fall:55,wave:'sine',noise:.32,filter:'lowpass',cut:710,echo:.22,harmonic:3.4,attack:.019},
 living:{pitch:960,fall:90,wave:'triangle',noise:.38,filter:'bandpass',cut:1420,echo:.23,harmonic:1.41,attack:.006},
 void:{pitch:125,fall:36,wave:'sine',noise:.26,filter:'lowpass',cut:600,echo:.33,harmonic:8.1,attack:.026},
 redacted:{pitch:470,fall:73,wave:'square',noise:.55,filter:'bandpass',cut:1300,echo:.045,harmonic:3.8,attack:.001},
 prism:{pitch:1530,fall:375,wave:'sine',noise:.14,filter:'highpass',cut:2300,echo:.29,harmonic:1.26,attack:.001},
 dragon:{pitch:280,fall:44,wave:'sawtooth',noise:.5,filter:'lowpass',cut:1020,echo:.2,harmonic:1.9,attack:.008},
};
const noiseCache=new WeakMap<AudioContext,AudioBuffer>();
const last=new Map<string,number>();
function noiseBuffer(ctx:AudioContext){let b=noiseCache.get(ctx);if(b)return b;b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.65),ctx.sampleRate);const out=b.getChannelData(0);for(let i=0;i<out.length;i++)out[i]=Math.random()*2-1;noiseCache.set(ctx,b);return b;}
export function playSkinSound(ctx:AudioContext,id:SkinId,action:Action,volume:number,weapon:WeaponId){
 const theme=getSkin(id);if(!theme||volume<=0)return;
 const key=`${id}:${weapon}:${action}`,now=performance.now();if(now-(last.get(key)??-Infinity)<(action==='fire'?(weapon==='rifle'?68:120):300))return;last.set(key,now);
 const t=voices[theme.sound];if(!t)return;
 const w={rifle:{pitch:1.16,length:.78,body:.72},shotgun:{pitch:.67,length:1.4,body:1.35},sniper:{pitch:.48,length:1.9,body:1.5},knife:{pitch:1.7,length:.65,body:.75}}[weapon];
 const a=action==='fire'?1:action==='reload'?.65:.55;
 const duration=(action==='fire'?.17:action==='reload'?.3:.23)*w.length;
 const at=ctx.currentTime,amp=Math.min(.32,volume*.32*w.body*a);
 const bus=ctx.createGain();bus.gain.setValueAtTime(.0001,at);bus.gain.linearRampToValueAtTime(amp,at+t.attack);bus.gain.exponentialRampToValueAtTime(.0001,at+duration);bus.connect(ctx.destination);
 const filter=ctx.createBiquadFilter();filter.type=t.filter;filter.frequency.setValueAtTime(t.cut*w.pitch,at);filter.frequency.exponentialRampToValueAtTime(Math.max(80,t.cut*.37*w.pitch),at+duration);filter.Q.value=.72;filter.connect(bus);
 const spawn=(ratio:number,gain:number,delay=0)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=t.wave;o.frequency.setValueAtTime(t.pitch*w.pitch*ratio,at+delay);o.frequency.exponentialRampToValueAtTime(Math.max(24,t.fall*w.pitch*ratio),at+delay+duration);g.gain.value=gain;o.connect(g).connect(filter);o.start(at+delay);o.stop(at+delay+duration+.01);o.onended=()=>{o.disconnect();g.disconnect()}};
 spawn(1,.85);spawn(t.harmonic,.33,action==='fire'?.006:.014);
 const n=ctx.createBufferSource(),ng=ctx.createGain();n.buffer=noiseBuffer(ctx);ng.gain.value=t.noise;n.connect(ng).connect(filter);n.start(at);n.stop(at+duration+.015);n.onended=()=>{n.disconnect();ng.disconnect();filter.disconnect();bus.disconnect()};
 if(t.echo>0){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(t.pitch*w.pitch*(weapon==='sniper'?2:1.5),at+t.echo);o.frequency.exponentialRampToValueAtTime(Math.max(40,t.fall*w.pitch),at+t.echo+.09);g.gain.setValueAtTime(.0001,at+t.echo);g.gain.exponentialRampToValueAtTime(amp*.18,at+t.echo+.008);g.gain.exponentialRampToValueAtTime(.0001,at+t.echo+.15);o.connect(g).connect(ctx.destination);o.start(at+t.echo);o.stop(at+t.echo+.16);o.onended=()=>{o.disconnect();g.disconnect()};}
}
