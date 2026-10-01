export type WorldSound = "bossStep"|"bossAttack"|"bossShot"|"paperStep"|"paperAttack"|"penShot"|"inkHit"|"flyWing"|"flyAttack"|"flyDeath"|"statueCharge"|"statueFire"|"statueDeath"|"thornGrow"|"thornHit"|"gemCharge"|"gemLaser"|"hellWarning"|"hellErupt"|"paperWind"|"surge"|"finalPush"|"cardProc"|"pickupHealth"|"pickupAmmo"|"pickupBomb"|"pickupSpeed";
type Preset={start:number;end:number;length:number;wave:OscillatorType;noise:number;filter:number;gain:number;interval:number};
const presets:Record<WorldSound,Preset>={
 bossStep:{start:92,end:45,length:.13,wave:"triangle",noise:.42,filter:420,gain:.24,interval:125},
 bossAttack:{start:180,end:68,length:.27,wave:"sawtooth",noise:.44,filter:860,gain:.3,interval:160},
 bossShot:{start:720,end:170,length:.18,wave:"square",noise:.67,filter:1450,gain:.23,interval:150},
 paperStep:{start:1100,end:430,length:.11,wave:"triangle",noise:.8,filter:2900,gain:.17,interval:220},
 paperAttack:{start:980,end:270,length:.22,wave:"sawtooth",noise:.8,filter:2600,gain:.25,interval:200},
 penShot:{start:510,end:140,length:.24,wave:"sawtooth",noise:.65,filter:1500,gain:.27,interval:160},
 inkHit:{start:190,end:52,length:.17,wave:"sine",noise:.45,filter:600,gain:.2,interval:120},
 flyWing:{start:420,end:210,length:.16,wave:"sine",noise:.65,filter:1200,gain:.15,interval:520},
 flyAttack:{start:900,end:135,length:.31,wave:"sawtooth",noise:.54,filter:2200,gain:.31,interval:160},
 flyDeath:{start:1100,end:150,length:.62,wave:"triangle",noise:.48,filter:2450,gain:.36,interval:180},
 statueCharge:{start:140,end:770,length:.72,wave:"sawtooth",noise:.18,filter:1600,gain:.24,interval:2400},
 statueFire:{start:1050,end:105,length:.85,wave:"sawtooth",noise:.62,filter:2300,gain:.42,interval:1800},
 statueDeath:{start:160,end:38,length:.95,wave:"sawtooth",noise:.84,filter:730,gain:.49,interval:180},
 thornGrow:{start:90,end:740,length:.67,wave:"triangle",noise:.82,filter:1700,gain:.39,interval:2000},
 thornHit:{start:490,end:120,length:.12,wave:"triangle",noise:.62,filter:1450,gain:.25,interval:500},
 gemCharge:{start:580,end:1460,length:.44,wave:"sine",noise:.18,filter:4100,gain:.23,interval:1200},
 gemLaser:{start:1720,end:290,length:.86,wave:"sawtooth",noise:.51,filter:3200,gain:.38,interval:2200},
 hellWarning:{start:160,end:76,length:.52,wave:"triangle",noise:.35,filter:650,gain:.23,interval:1800},
 hellErupt:{start:68,end:31,length:1.1,wave:"sawtooth",noise:.94,filter:540,gain:.5,interval:2600},
 paperWind:{start:510,end:92,length:1.15,wave:"triangle",noise:.92,filter:970,gain:.34,interval:2100},
 surge:{start:320,end:570,length:.35,wave:"square",noise:.68,filter:1600,gain:.33,interval:800},
 finalPush:{start:220,end:75,length:.6,wave:"sawtooth",noise:.86,filter:970,gain:.47,interval:1000},
 cardProc:{start:900,end:300,length:.24,wave:"triangle",noise:.35,filter:2100,gain:.23,interval:200},
 pickupHealth:{start:440,end:880,length:.22,wave:"sine",noise:.04,filter:1600,gain:.3,interval:120},
 pickupAmmo:{start:890,end:510,length:.14,wave:"square",noise:.12,filter:2200,gain:.19,interval:120},
 pickupBomb:{start:230,end:490,length:.27,wave:"triangle",noise:.22,filter:950,gain:.33,interval:120},
 pickupSpeed:{start:620,end:1520,length:.19,wave:"sine",noise:.08,filter:2800,gain:.25,interval:120},
};
let ctx:AudioContext|null=null;let noiseBuffer:AudioBuffer|null=null;let compressor:DynamicsCompressorNode|null=null;
const last=new Map<string,number>();
export function resumeWorldSound(){if(!ctx&&typeof AudioContext!=="undefined"){
  ctx=new AudioContext();compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-12;compressor.ratio.value=8;compressor.connect(ctx.destination);
  noiseBuffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*1.2),ctx.sampleRate);
  const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
}if(ctx?.state==="suspended")void ctx.resume().catch(()=>undefined);}
export function playWorldSound(kind:WorldSound,volume:number,source?:[number,number,number],player?:[number,number,number]){
  const p=presets[kind];if(!p||volume<=0)return;
  const at=performance.now();const key=kind+(source?`:${Math.round(source[0]/6)}:${Math.round(source[2]/6)}`:"");
  if(at-(last.get(key)??-Infinity)<p.interval)return;
  last.set(key,at);if(last.size>150)last.clear();
  resumeWorldSound();if(!ctx||!compressor||!noiseBuffer)return;
  const distance=source&&player?Math.hypot(source[0]-player[0],source[1]-player[1],source[2]-player[2]):0;
  const falloff=source?Math.max(.09,1-distance/66):1;
  if(falloff<.12&&distance>70)return;
  const when=ctx.currentTime,gain=ctx.createGain();
  gain.gain.setValueAtTime(.001,when);gain.gain.exponentialRampToValueAtTime(Math.max(.001,p.gain*volume*falloff),when+.012);
  gain.gain.exponentialRampToValueAtTime(.001,when+p.length);
  const pan=ctx.createStereoPanner();pan.pan.value=source&&player?Math.max(-.8,Math.min(.8,(source[0]-player[0])/38)):0;gain.connect(pan);pan.connect(compressor);
  const tone=ctx.createOscillator();tone.type=p.wave;tone.frequency.setValueAtTime(p.start,when);tone.frequency.exponentialRampToValueAtTime(p.end,when+p.length);tone.connect(gain);tone.start(when);tone.stop(when+p.length+.02);
  const noise=ctx.createBufferSource();noise.buffer=noiseBuffer;
  const filter=ctx.createBiquadFilter();filter.type=kind==="hellErupt"||kind==="bossStep"?"lowpass":"bandpass";filter.frequency.value=p.filter;filter.Q.value=.45;
  const noiseGain=ctx.createGain();noiseGain.gain.value=p.noise;noise.connect(filter);filter.connect(noiseGain);noiseGain.connect(gain);noise.start(when);noise.stop(when+p.length+.02);
  tone.onended=()=>{tone.disconnect();noise.disconnect();filter.disconnect();noiseGain.disconnect();gain.disconnect();pan.disconnect();};
}
