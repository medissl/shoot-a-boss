export type WorldSound = "bossStep"|"bossAttack"|"bossShot"|"paperStep"|"paperAttack"|"penShot"|"inkHit"|"flyWing"|"flyAttack"|"flyDeath"|"statueCharge"|"statueFire"|"statueDeath"|"thornGrow"|"thornHit"|"gemCharge"|"gemLaser"|"hellWarning"|"hellErupt"|"paperWind"|"surge"|"finalPush"|"cardProc"|"pickupHealth"|"pickupAmmo"|"pickupBomb"|"pickupSpeed"|"paperWarning"|"officeAttack"|"paperDeath"|"staplerClick"|"staplerSnap"|"staplerDeath"|"markerCharge"|"markerSweep"|"shredderMotor"|"shredderDeath"|"dragonRoar"|"dragonBreath"|"dragonCrash"|"dragonSeal"|"dragonPhase"|"dragonWing"|"dragonHurt"|"dragonDeath"|"approvalStart"|"approvalStamp"|"approvalSuccess"|"approvalReject"|"stickyPeel"|"stickySlap"|"clipboardThud"|"hrStamp"|"hrTape"|"hrReview"|"hrDeath"|"auditorPage"|"auditorBalance"|"auditorOpen"|"auditorDeath"|"directorGavel"|"directorRing"|"directorDelegate"|"directorDeath"|"heavenChime";
type Preset={start:number;end:number;length:number;wave:OscillatorType;noise:number;filter:number;gain:number;interval:number};
const presets:Record<WorldSound,Preset>={
 paperWarning:{start:650,end:380,length:.18,wave:"triangle",noise:.32,filter:1300,gain:.2,interval:280},
 officeAttack:{start:760,end:120,length:.27,wave:"sawtooth",noise:.55,filter:1800,gain:.26,interval:180},
 paperDeath:{start:330,end:85,length:.45,wave:"triangle",noise:.7,filter:1400,gain:.23,interval:180},
 staplerClick:{start:1100,end:420,length:.14,wave:"square",noise:.34,filter:2600,gain:.24,interval:300},
 staplerSnap:{start:1450,end:160,length:.22,wave:"square",noise:.7,filter:3400,gain:.36,interval:250},
 staplerDeath:{start:580,end:70,length:.55,wave:"square",noise:.62,filter:1600,gain:.27,interval:250},
 markerCharge:{start:540,end:1150,length:.38,wave:"sine",noise:.14,filter:2500,gain:.19,interval:300},
 markerSweep:{start:1200,end:290,length:.45,wave:"sine",noise:.55,filter:3200,gain:.3,interval:200},
 shredderMotor:{start:190,end:95,length:.55,wave:"sawtooth",noise:.9,filter:700,gain:.35,interval:400},
 shredderDeath:{start:240,end:36,length:.85,wave:"sawtooth",noise:.85,filter:520,gain:.4,interval:250},
 dragonRoar:{start:115,end:310,length:.9,wave:"sawtooth",noise:.72,filter:800,gain:.42,interval:900},
 dragonBreath:{start:990,end:90,length:1,wave:"sawtooth",noise:.8,filter:1800,gain:.43,interval:850},
 dragonCrash:{start:185,end:28,length:1.1,wave:"sawtooth",noise:.95,filter:500,gain:.48,interval:1000},
 dragonSeal:{start:1850,end:180,length:.65,wave:"square",noise:.8,filter:3400,gain:.39,interval:130},
 dragonPhase:{start:135,end:480,length:1.15,wave:"sawtooth",noise:.9,filter:1500,gain:.43,interval:1500},
 dragonWing:{start:230,end:95,length:.42,wave:"triangle",noise:.86,filter:850,gain:.16,interval:1000},
 dragonHurt:{start:390,end:110,length:.28,wave:"triangle",noise:.64,filter:1150,gain:.22,interval:260},
 dragonDeath:{start:240,end:29,length:1.18,wave:"sawtooth",noise:.95,filter:740,gain:.5,interval:1500},
 approvalStart:{start:450,end:930,length:.68,wave:"sine",noise:.24,filter:2100,gain:.25,interval:600},
 approvalStamp:{start:280,end:95,length:.3,wave:"triangle",noise:.7,filter:1000,gain:.3,interval:160},
 approvalSuccess:{start:550,end:1150,length:.9,wave:"sine",noise:.1,filter:2300,gain:.3,interval:700},
 approvalReject:{start:440,end:80,length:.8,wave:"triangle",noise:.6,filter:950,gain:.3,interval:700},
 stickyPeel:{start:1300,end:390,length:.25,wave:"triangle",noise:.48,filter:2700,gain:.18,interval:250},
 stickySlap:{start:600,end:130,length:.25,wave:"triangle",noise:.6,filter:1900,gain:.25,interval:210},
 clipboardThud:{start:220,end:52,length:.32,wave:"triangle",noise:.42,filter:850,gain:.31,interval:250},
 hrStamp:{start:450,end:75,length:.44,wave:"square",noise:.7,filter:1600,gain:.36,interval:290},
 hrTape:{start:180,end:870,length:.45,wave:"triangle",noise:.78,filter:1150,gain:.3,interval:350},
 hrReview:{start:950,end:320,length:.33,wave:"square",noise:.62,filter:2350,gain:.25,interval:240},
 hrDeath:{start:600,end:56,length:.8,wave:"square",noise:.85,filter:1100,gain:.42,interval:500},
 auditorPage:{start:840,end:245,length:.48,wave:"triangle",noise:.8,filter:2000,gain:.3,interval:250},
 auditorBalance:{start:1220,end:420,length:.53,wave:"sine",noise:.55,filter:2700,gain:.31,interval:350},
 auditorOpen:{start:640,end:1400,length:.39,wave:"sine",noise:.2,filter:2600,gain:.28,interval:300},
 auditorDeath:{start:1360,end:68,length:.9,wave:"sine",noise:.77,filter:2100,gain:.38,interval:500},
 directorGavel:{start:300,end:64,length:.52,wave:"sawtooth",noise:.5,filter:890,gain:.39,interval:330},
 directorRing:{start:160,end:860,length:.58,wave:"sawtooth",noise:.46,filter:1500,gain:.33,interval:430},
 directorDelegate:{start:870,end:190,length:.45,wave:"triangle",noise:.35,filter:2000,gain:.27,interval:380},
 directorDeath:{start:370,end:39,length:.95,wave:"sawtooth",noise:.86,filter:1100,gain:.42,interval:500},
 heavenChime:{start:740,end:1290,length:1.1,wave:"sine",noise:.08,filter:2800,gain:.13,interval:6500},
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
