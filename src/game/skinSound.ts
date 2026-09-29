import { getSkin, type SkinId } from './skins';
import type { WeaponId } from './config';
type Action='fire'|'equip'|'cock'|'reload'|'knife-hit';
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
/** Complete theme sound. No original weapon recording is mixed into this signal. */
export function playSkinSound(ctx:AudioContext,id:SkinId,action:Action,volume:number,weapon:WeaponId){
 const theme=getSkin(id);if(!theme||volume<=0)return;
 const key=`${id}:${weapon}:${action}`,now=performance.now();
 if(now-(last.get(key)??-Infinity)<(action==='fire'?(weapon==='rifle'?67:100):action==='knife-hit'?90:300))return;
 last.set(key,now);
 const t=voices[theme.sound];if(!t)return;
 const profile={rifle:{pitch:1.08,length:.27,body:.96},shotgun:{pitch:.65,length:.49,body:1.18},sniper:{pitch:.46,length:.75,body:1.24},knife:{pitch:1.67,length:.29,body:.85}}[weapon];
 const at=ctx.currentTime+.002;
 const master=ctx.createGain();master.gain.value=Math.min(.95,Math.max(.02,volume*1.05*profile.body));
 const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-11;limiter.knee.value=9;limiter.ratio.value=5;limiter.attack.value=.002;limiter.release.value=.18;
 master.connect(limiter).connect(ctx.destination);
 const duration=action==='fire'?profile.length:action==='knife-hit'?.35:action==='reload'?.64:.37;
 const trigger=(delay:number,strength:number,tail:number,pitch:number,cut:number)=>{
   const start=at+delay;
   const bus=ctx.createGain();bus.gain.setValueAtTime(.0001,start);bus.gain.exponentialRampToValueAtTime(Math.max(.01,strength),start+.005);bus.gain.exponentialRampToValueAtTime(.0001,start+tail);bus.connect(master);
   const filter=ctx.createBiquadFilter();filter.type=t.filter;filter.frequency.setValueAtTime(Math.max(120,cut),start);filter.frequency.exponentialRampToValueAtTime(Math.max(80,cut*.32),start+tail);filter.Q.value=.7;filter.connect(bus);
   const noise=ctx.createBufferSource();noise.buffer=noiseBuffer(ctx);const grit=ctx.createGain();grit.gain.value=action==='fire'?Math.max(.23,t.noise):Math.max(.18,t.noise*.72);noise.connect(grit).connect(filter);noise.start(start);noise.stop(start+Math.min(tail,.62));
   const low=ctx.createOscillator();low.type=t.wave;low.frequency.setValueAtTime(Math.max(45,t.pitch*profile.pitch*pitch),start);low.frequency.exponentialRampToValueAtTime(Math.max(28,t.fall*profile.pitch*pitch),start+tail);const lowGain=ctx.createGain();lowGain.gain.value=.85;low.connect(lowGain).connect(filter);low.start(start);low.stop(start+tail);
   const overtone=ctx.createOscillator();overtone.type=theme.sound==='arcade'||theme.sound==='circuit'?'square':'sine';overtone.frequency.setValueAtTime(Math.max(60,t.pitch*t.harmonic*profile.pitch*pitch),start);overtone.frequency.exponentialRampToValueAtTime(Math.max(45,t.fall*t.harmonic*profile.pitch),start+tail);const upper=ctx.createGain();upper.gain.value=.27;overtone.connect(upper).connect(filter);overtone.start(start);overtone.stop(start+tail);
   noise.onended=()=>{noise.disconnect();grit.disconnect()};overtone.onended=()=>{overtone.disconnect();upper.disconnect()};low.onended=()=>{low.disconnect();lowGain.disconnect();filter.disconnect();bus.disconnect()};
 };
 if(action==='fire'){
   if(weapon==='knife'){
     trigger(0,.65,.21,2.2,t.cut*1.9);
     trigger(.075,.55,.16,.77,t.cut*.8);
   }else{
     // Mechanical crack, pressure body, and the theme's tail form one complete shot.
     trigger(0,1,.095,1.9,t.cut*2.1);
     trigger(.018,.82,duration,.77,t.cut);
     trigger(Math.min(.1,duration*.31),.34,Math.min(.32,duration*.65),t.harmonic,t.cut*1.25);
   }
 }else if(action==='reload'){
   trigger(0,.66,.13,2.4,t.cut*1.55);
   trigger(.19,.55,.17,1.3,t.cut);
   trigger(.41,.83,.22,.72,t.cut*.68);
 }else if(action==='cock'){
   trigger(0,.87,.09,2.5,t.cut*1.8);
   trigger(.075,.63,.16,.58,t.cut*.82);
 }else if(action==='equip'){
   trigger(0,.6,.13,1.7,t.cut*1.3);
   trigger(.12,.75,.24,.68,t.cut*.75);
 }else{
   trigger(0,.8,.11,2.1,t.cut*1.6);
   trigger(.04,.72,.28,.5,t.cut*.65);
 }
 const release=at+Math.max(duration,.68)+.15;
 window.setTimeout(()=>{master.disconnect();limiter.disconnect()},Math.max(800,(release-at)*1000));
}
