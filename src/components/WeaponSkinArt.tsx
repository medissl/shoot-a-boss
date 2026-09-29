import type { WeaponId } from '../game/config';
import { SKIN_MUZZLES } from '../game/weaponMuzzle';
import { getSkin, type SkinId, type SkinTheme } from '../game/skins';

type Part={name:string;d:string;layer:'shell'|'dark'|'metal'|'light'|'core'};
const PARTS:Record<WeaponId,Part[]>={
  rifle:[
    {name:'barrel',d:'M306 225 326 230 476 343 457 361 301 242Z',layer:'metal'},
    {name:'upper',d:'M421 313 466 296 552 360 511 381Z',layer:'dark'},
    {name:'optic',d:'M488 315 537 309 579 342 540 365 491 346Z',layer:'light'},
    {name:'receiver',d:'M455 351 498 330 652 447 607 474Z',layer:'shell'},
    {name:'rear',d:'M606 470 650 447 688 478 640 510Z',layer:'metal'},
    {name:'magazine',d:'M555 430 609 469 591 547 543 516Z',layer:'dark'},
    {name:'stock',d:'M640 504 835 562 808 614 619 543Z',layer:'shell'},
    {name:'grip',d:'M492 386 531 398 548 459 519 490 480 460 478 414Z',layer:'dark'},
    {name:'muzzle',d:'M294 221 309 225 307 247 290 243Z',layer:'core'},
  ],
  shotgun:[
    {name:'barrel',d:'M296 223 320 222 478 341 455 362 296 240Z',layer:'metal'},
    {name:'upper',d:'M418 317 459 301 588 399 544 423Z',layer:'dark'},
    {name:'receiver',d:'M452 356 496 335 654 455 609 482Z',layer:'shell'},
    {name:'pump',d:'M486 350 548 396 517 443 460 397Z',layer:'core'},
    {name:'rear',d:'M609 480 653 455 690 488 640 516Z',layer:'metal'},
    {name:'stock',d:'M642 509 836 565 806 614 619 549Z',layer:'shell'},
    {name:'grip',d:'M494 396 536 414 552 471 519 500 480 475 480 425Z',layer:'dark'},
    {name:'muzzle',d:'M287 219 303 219 301 244 284 239Z',layer:'core'},
  ],
  sniper:[
    {name:'barrel',d:'M281 209 303 207 484 343 462 365 281 229Z',layer:'metal'},
    {name:'upper',d:'M428 322 472 304 605 406 560 433Z',layer:'dark'},
    {name:'receiver',d:'M455 359 500 337 657 455 609 484Z',layer:'shell'},
    {name:'scopeMount',d:'M505 347 531 334 569 363 550 380Z',layer:'core'},
    {name:'scope',d:'M402 258 Q405 243 426 243 L559 339 Q576 353 563 368 L544 379 397 279Z',layer:'dark'},
    {name:'scopeFront',d:'M391 244 Q407 232 425 245 L437 262 Q443 279 429 290 Q412 299 397 284 Q380 266 391 244Z',layer:'core'},
    {name:'scopeRear',d:'M548 333 Q568 325 583 344 L587 362 Q586 377 568 384 Q551 385 543 369 Q537 347 548 333Z',layer:'core'},
    {name:'magazine',d:'M562 437 611 480 592 548 548 519Z',layer:'dark'},
    {name:'stock',d:'M642 509 835 565 805 615 619 549Z',layer:'shell'},
    {name:'grip',d:'M495 398 537 417 553 474 520 503 480 475 480 428Z',layer:'dark'},
    {name:'muzzle',d:'M270 206 283 208 283 234 267 230Z',layer:'core'},
  ],
  knife:[
    {name:'blade',d:'M301 187 342 225 521 370 490 411 321 257Z',layer:'metal'},
    {name:'edge',d:'M301 187 344 229 490 385 321 257Z',layer:'light'},
    {name:'guard',d:'M478 384 511 356 548 389 512 425Z',layer:'core'},
    {name:'handle',d:'M507 405 537 370 653 466 609 510Z',layer:'dark'},
    {name:'pommel',d:'M609 465 653 463 671 493 635 523 606 511Z',layer:'shell'},
    {name:'grip',d:'M591 452 Q629 433 675 471 L703 521 660 558 618 527Z',layer:'dark'},
  ],
};

function Motif({theme,weapon}:{theme:SkinTheme;weapon:WeaponId}){
  const {motif,color,accent}=theme;
  const knife=weapon==='knife';
  // These drawings sit on the surfaces facing the camera, with theme structure on the barrel/blade and rear.
  const barrel=knife?'M328 232 Q408 285 484 389':'M323 240 Q399 293 458 348';
  const stock=knife?'M536 394 619 472':'M655 519 805 581';
  return <g className={`skin-motif skin-motif--${motif}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
    {motif==='nib'&&<><path d={barrel} stroke={accent} strokeWidth="9"/><path d={barrel} stroke={color} strokeWidth="3" className="skin-flow" strokeDasharray="17 28"/><path d={stock} stroke={accent} strokeWidth="7"/><path d="M500 365 Q528 351 553 379 L537 398 Q521 378 500 365Z" fill={accent}/><path d="M519 366 540 383" stroke={color} strokeWidth="5"/><circle cx="550" cy="384" r="5" fill={color}/></>}
    {motif==='ruler'&&<><path d={barrel} stroke="#edbc48" strokeWidth="15"/><path d={stock} stroke="#edbc48" strokeWidth="13"/>{[0,1,2,3,4,5].map(i=><path key={i} d={`M${352+i*21} ${260+i*15}l-7 9 M${663+i*24} ${522+i*9}l-4 11`} stroke={accent} strokeWidth="3"/>)}<path d="M506 355 547 382m-32-31 42 28" stroke={color} strokeWidth="8"/></>}
    {motif==='hazard'&&<><path d={barrel} stroke={color} strokeWidth="15" strokeDasharray="20 12"/><path d={stock} stroke={accent} strokeWidth="20" strokeDasharray="27 14"/><path d="M490 363 517 344 577 392 546 411Z" fill={color} stroke={accent} strokeWidth="4"/><path d="m515 361 11 26 10-17-21-9Z" fill={accent}/><circle cx="526" cy="391" r="3" fill={accent}/></>}
    {motif==='fold'&&<><path d="M300 224 354 235 345 275 399 274 390 309 454 337" stroke={accent} strokeWidth="4"/><path d="M480 354 513 327 529 378 558 370 613 450" stroke={color} strokeWidth="5"/><path d="m638 509 52 1-14 43 50-4-11 26 96 9" stroke={accent} strokeWidth="4"/><path d="m485 364 34-22-5 31Zm56 26 21-18-8 30Z" fill="#faffff" stroke={accent}/></>}
    {motif==='pixel'&&<><path d={barrel} stroke={color} strokeWidth="11" strokeDasharray="10 8"/><path d={stock} stroke={accent} strokeWidth="12" strokeDasharray="19 7"/><rect x="498" y="350" width="61" height="39" rx="2" fill="#151d39" stroke={color} strokeWidth="4"/><text x="504" y="377" fill={color} stroke="none" fontFamily="monospace" fontWeight="900" fontSize="20">99</text>{[0,1,2,3].map(i=><rect key={i} x={662+i*35} y={530+i*12} width="10" height="10" fill={i%2?accent:color}/>)}</>}
    {motif==='clip'&&<><path d={barrel} stroke="#c5cbd1" strokeWidth="15"/><path d={stock} stroke={accent} strokeWidth="8"/><path d="M494 357 551 385 543 398 497 371Z" fill="#fff8e8" stroke={accent} strokeWidth="3"/><path d="M504 360h42M506 367h33" stroke={color} strokeWidth="2"/><path d="M665 521q-13-24 4-29 18-3 14 17l-4 26m37 3q-8-23 8-23 12 0 10 18" stroke={accent} strokeWidth="4"/></>}
    {motif==='graffiti'&&<><path d={barrel} stroke={color} strokeWidth="7" strokeDasharray="27 6 4 9"/><path d="m481 374 35-31 23 38 28-10 43 68-28-15-15 24-27-53-20 16Z" fill={color} stroke={accent} strokeWidth="3"/><path d="m650 527 43-10 25 34 44-4 35 38" stroke={color} strokeWidth="7"/><circle cx="685" cy="564" r="5" fill={accent}/><circle cx="747" cy="580" r="4" fill={color}/></>}
    {motif==='comic'&&<><path d={barrel} stroke={accent} strokeWidth="11" strokeDasharray="30 7"/><path d={stock} stroke={color} strokeWidth="6" strokeDasharray="4 7"/><path d="m493 371 18-27 11 17 18-17 5 24 22-1-12 21 10 16-27-6-12 12-8-19-24 4Z" fill="#fff9da" stroke={accent} strokeWidth="4"/><text x="501" y="383" fontSize="18" fontWeight="1000" fill={color} stroke="none">POW!</text></>}
    {motif==='blueprint'&&<><path d={barrel} stroke={accent} strokeWidth="3" strokeDasharray="7 5"/><path d={stock} stroke={accent} strokeWidth="3" strokeDasharray="8 5"/><path d="M491 356 551 394m-49-44 59 40m-50-36-5 26m12-15-5 25m12-13-5 24m12-13-5 20M661 527l131 50" stroke={accent} strokeWidth="2"/><circle cx="525" cy="374" r="14" stroke={color} strokeWidth="3"/><circle cx="525" cy="374" r="3" fill={accent}/></>}
    {motif==='cassette'&&<><path d={barrel} stroke={color} strokeWidth="10"/><path d={stock} stroke={accent} strokeWidth="9"/><path d="M491 352 547 344 588 388 545 408Z" fill="#24243e" stroke={color} strokeWidth="4"/><circle cx="525" cy="366" r="9" stroke={accent} strokeWidth="3"/><circle cx="551" cy="383" r="9" stroke={accent} strokeWidth="3"/><path d="M525 375 546 387M651 524q38-16 58 29t83 32" stroke={accent} strokeWidth="3"/></>}
    {motif==='circuit'&&<><path d={barrel} stroke={color} strokeWidth="5" className="skin-flow" strokeDasharray="22 16"/><path d="M484 367 508 348 522 369 544 361 575 392m-72-2 15-12 18 20 27-7 56 58M652 524l32 10 17-9 32 13v18l64 27" stroke={color} strokeWidth="4"/><circle cx="522" cy="370" r="7" fill={accent}/><circle cx="544" cy="361" r="5" fill={color}/><circle cx="732" cy="540" r="6" fill={accent}/></>}
    {motif==='ice'&&<><path d={barrel} stroke="#e8ffff" strokeWidth="10"/><path d="m319 228 38-15-9 46 47-10-15 46 39-8-8 33 42 7" fill={color} stroke={accent} strokeWidth="3"/><path d="m487 354 24-24 9 34 27-24 11 37 39 9-29 17M647 515l31-26 13 40 32-18 12 47 44-4" fill={color} stroke={accent} strokeWidth="4"/><path d={stock} stroke="#ecffff" strokeWidth="4" strokeDasharray="11 8"/></>}
    {motif==='flame'&&<><path d={barrel} stroke={accent} strokeWidth="12"/><path d="M326 243q14-39 31-11t37 17q20-17 28 22t39 52M482 359q21-39 33-10t22-3q16-18 19 19t37 40M649 518q19-45 31-6t32 2q18-25 21 17t45 31" fill={color} stroke={accent} strokeWidth="4"/><path d={stock} className="skin-flow" stroke="#ffec97" strokeWidth="4" strokeDasharray="17 26"/></>}
    {motif==='vial'&&<><path d={barrel} stroke={color} strokeWidth="8" strokeDasharray="9 4"/><path d="M494 350q34-27 67 22l-21 30q-42-10-46-52Z" fill="#c6faad" stroke={accent} strokeWidth="4"/><path d="M500 366q28-8 46 16" stroke={color} strokeWidth="8" className="skin-flow"/><circle cx="524" cy="364" r="5" fill="#fff"/><circle cx="546" cy="373" r="4" fill="#fff"/><path d={stock} stroke={color} strokeWidth="10" strokeDasharray="12 8"/></>}
    {motif==='storm'&&<><path d="M323 236 374 277 388 264 419 308 447 328M488 365l25-23 15 27 19-12 21 32 39 40M651 515l29 9-10 16 45 5-13 17 91 19" stroke={accent} strokeWidth="10"/><path d={barrel} stroke="#fff9b5" strokeWidth="3" className="skin-flow" strokeDasharray="9 24"/><path d={stock} stroke="#fff9b5" strokeWidth="4" className="skin-flow" strokeDasharray="13 21"/></>}
    {motif==='clock'&&<><path d={barrel} stroke={accent} strokeWidth="3" strokeDasharray="4 8"/><path d={stock} stroke={color} strokeWidth="7" strokeDasharray="9 9"/><circle cx="532" cy="377" r="25" fill="#48382b" stroke={color} strokeWidth="5"/><circle cx="532" cy="377" r="16" stroke={accent} strokeWidth="2"/><path d="M532 365v13l10 7" stroke={accent} strokeWidth="3"/><circle cx="684" cy="539" r="12" stroke={color} strokeWidth="4"/><circle cx="738" cy="558" r="15" stroke={accent} strokeWidth="4"/></>}
    {motif==='abyss'&&<><path d={barrel} stroke={accent} strokeWidth="6" strokeDasharray="4 14"/><path d="M486 372q24-42 54-12t43 20M490 386q24-28 47-7t41 17M651 528q22-30 39 8t49 7q32-23 63 35" stroke={color} strokeWidth="8"/><circle cx="531" cy="374" r="8" fill={color}/><circle cx="698" cy="536" r="5" fill={accent}/><circle cx="756" cy="563" r="7" fill={color}/></>}
    {motif==='eye'&&<><path d={barrel} stroke={accent} strokeWidth="4" className="skin-flow" strokeDasharray="30 12 5 8"/><path d={stock} stroke={accent} strokeWidth="6" className="skin-flow" strokeDasharray="19 13"/><path d="M489 372q37-46 78 17-40 36-78-17Z" fill="#fff" stroke={accent} strokeWidth="5"/><circle cx="528" cy="375" r="15" fill={color} stroke={accent} strokeWidth="4"/><circle cx="531" cy="375" r="7" fill={accent}/><path d="m497 361-10-16m26 11-4-22m44 33 14-17" stroke={accent} strokeWidth="3"/></>}
    {motif==='stars'&&<><path d={barrel} stroke="#8e7de3" strokeWidth="5" strokeDasharray="2 12"/><path d={stock} stroke={color} strokeWidth="4" strokeDasharray="2 15"/><ellipse cx="526" cy="375" rx="65" ry="22" transform="rotate(34 526 375)" stroke={color} strokeWidth="4" className="skin-orbit"/><ellipse cx="722" cy="550" rx="88" ry="17" transform="rotate(17 722 550)" stroke={accent} strokeWidth="3" className="skin-orbit"/>{[[492,353],[515,363],[547,385],[675,534],[723,552],[780,572]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%2?5:3} fill={i%2?accent:color}/>)}</>}
    {motif==='redaction'&&<><path d={barrel} stroke={accent} strokeWidth="14" strokeDasharray="33 12"/><path d={stock} stroke={accent} strokeWidth="17" strokeDasharray="45 9"/><path d="M490 355 556 387" stroke={accent} strokeWidth="15"/><path d="M503 391 567 418" stroke={accent} strokeWidth="11"/><rect x="489" y="341" width="70" height="23" fill="#eeeae1" stroke={color} strokeWidth="3"/><text x="495" y="357" fill={color} stroke="none" fontFamily="monospace" fontSize="12" fontWeight="900">SEALED</text><path d="M377 278 440 324" stroke={accent} strokeWidth="9" className="skin-redact"/></>}
    {motif==='prism'&&<><path d="m317 220 29-14 16 50 33-13 14 46 41-1m37 68 38-24 20 38 31-21 16 47 40 21m9 102 50-32 15 41 42-24 16 50 48 14" fill="#c6fff2" stroke={accent} strokeWidth="4"/><path d={barrel} stroke={color} strokeWidth="4"/><path d={stock} stroke={color} strokeWidth="8" className="skin-flow" strokeDasharray="9 13"/><path d="m505 345 32 37 25-20-13 42Z" fill="#ffb3ea" stroke="#fff" strokeWidth="3"/></>}
    {motif==='dragon'&&<><path d={barrel} stroke={accent} strokeWidth="10"/><path d="M325 233q8-31 20-8l9 31 15-18 17 43 17-11 23 46 21-2M483 366q17-26 29-15l14 28 16-18 18 28 25-5 30 48M650 523q31-39 38 10l27-14 18 40 24-13 31 42" fill={accent} stroke={color} strokeWidth="3"/><path d="M505 367q25-17 38 7l-16 18Z" fill={color}/><circle cx="532" cy="368" r="4" fill="#fff"/></>}
  </g>;
}

function ThemeSilhouette({theme,weapon}:{theme:SkinTheme;weapon:WeaponId}){
  const m=theme.motif,knife=weapon==='knife';
  return <g className="skin-silhouette" fill={theme.base} stroke={theme.accent} strokeWidth="4" strokeLinejoin="round">
    {knife&&<path d={m==='dragon'?'M289 175 314 182 328 200 304 231Z':m==='ice'||m==='prism'?'M281 176 317 194 347 244 303 228Z':'M289 180 315 187 347 229 305 232Z'} fill={theme.color}/>}
    {['ice','prism','dragon','flame','storm','abyss','stars','eye'].includes(m)&&<path d={knife?'M346 231q45-42 51 38l38-13 47 105-84-64Z':'M371 257q27-45 37 17l36-22 31 84-66-43Z'} fill={theme.base} opacity=".9"/>}
    {m==='clock'&&<><circle cx="514" cy="334" r="21" fill={theme.base}/><path d="M502 328v-18h22v19"/></>}
    {m==='hazard'&&<path d={knife?'M481 365 522 348 554 386 512 420Z':'M476 333 511 317 580 355 550 373Z'} fill={theme.color}/>}
    {m==='cassette'&&<path d="M493 313 536 298 582 344 542 359Z" fill={theme.color}/>}
    {m==='stars'&&<><path d="M479 356q50-48 108 24l-35 37-73-43Z" fill="#11112a" stroke={theme.color} strokeWidth="6"/><path d="M631 497q89-20 187 51l13 36-95-28-87-27Z" fill="#1b1833" stroke={theme.color} strokeWidth="5"/></>}
    {m==='eye'&&<><path d="M429 331q14-38 33 2t38 4q30-33 46 8l-18 30-54-10Z" fill="#f6f6ee"/><path d="M646 490q42-18 85 21t95 42l-22 41-112-32-61-33Z" fill="#f3f4ee"/></>}
    {m==='redaction'&&<><path d="M431 309h68v16h-68Zm28 23h76v14h-76ZM637 480h68v17h-68Zm52 17h83v15h-83Zm73 17h54v15h-54Z" fill="#171c28" stroke={theme.color} strokeWidth="3"/></>}
    {m==='prism'&&<><path d="M412 299 437 268 455 312 481 289 504 347 465 362Z" fill="#b2fbef"/><path d="M640 490 676 466 690 506 721 481 735 525 783 515 822 559 746 544Z" fill="#e7c2f7"/></>}
    {m==='dragon'&&<><path d="M412 297q18-52 34 1l22-21 38 58-34 27Z" fill={theme.accent}/><path d="M640 487q18-58 37 2l36-20 31 43 29-12 39 54-56-12-87-14Z" fill={theme.accent}/></>}
  </g>;
}

function SkinAttack({theme,weapon}:{theme:SkinTheme;weapon:WeaponId}){
  const knife=weapon==='knife';const motif=theme.motif;
  const [x,y]=SKIN_MUZZLES[weapon];
  const signature:Record<SkinTheme['motif'],string>={
    nib:'M-8 0q-30-36-54-10t-35-4q24 24 62 19t27-5',
    ruler:'M-12-33h-77v13h13v13h-13v14h77',
    hazard:'M-7-10-30-43-43-11-78-19-54 13-87 29-37 20Z',
    fold:'M-6-1-33-42-49-8-80-20-51 14-85 32-26 13Z',
    pixel:'M-5-12h-25v-19h-22v17h-24v26h24v17h22V12h25Z',
    clip:'M-8-8q-24-35-42-19t-21 36q5 21 19 7t-2-24',
    graffiti:'M-6-16q-24-35-30 5t-26-5q-15-21-22 18t-25 4',
    comic:'M-5-7-25-39-34-16-57-48-57-13-92-18-63 11-78 32-35 20-15 30Z',
    blueprint:'M-6-32h-95M-54-53v103m-25-87 50 73',
    cassette:'M-6-13q-22-29-44 0t-42 0M-6 4q-22-29-44 0t-42 0',
    circuit:'M-5-2h-20v-23h-24v-16h-27m51 39v20h-34v24h-27',
    ice:'M-7-3-24-49-39-11-71-32-51 4-83 21-30 23-38 53Z',
    flame:'M-7 0q-20-59-34-23t-33-15q13 28-27 43 34-7 29 35 18-19 32-5Z',
    vial:'M-8-7q-25-30-49-10t-33 2q12 23 34 18t48-10m-62-26v-10m-10 3v-8',
    storm:'M-7-7-27-41-34-7-60-29-46 7-86 35-41 21Z',
    clock:'M-4-4a42 42 0 1 0-84 0 42 42 0 0 0 84 0m-42-27v27l22 15',
    abyss:'M-8-11q-25-36-53 4t-49 13m38-46q-22 15-15 34m32 12q-11 34-38 34',
    eye:'M-7-5q-46-53-91 0 45 50 91 0Zm-45-22v44',
    stars:'M-8-5q-60-49-103 0 50 50 103 0Zm-42-35v70m-32-50 72 30',
    redaction:'M-5-24h-81v14h81M-16-2h-91v17h91M-7 25h-67v11h67',
    prism:'M-8 0-33-50-45-6-87-28-55 9-95 27-37 18-51 53Z',
    dragon:'M-8-6q-28-64-52-19l-37-23 19 47-28 22 47-7 18 39 19-43Z',
  };
  return <g transform={`translate(${x} ${y})`}><g className={`skin-attack skin-attack--${motif}`} fill="none" stroke={theme.color} strokeLinecap="round">
    {knife?<><path d="M0 0Q-95-92-162-78M0 5Q-91-48-153-45M0 11Q-85-19-138-13" strokeWidth="7"/><path d="M-106-55q-35-24-56-4" stroke={theme.accent} strokeWidth="4"/></>:<><path d={motif==='stars'?'M0 0Q-80-48-115 0Q-80 48 0 0Z':motif==='flame'||motif==='dragon'?'M0 0Q-18-75-54-78Q-43-37-103-43Q-71-10-120 16Q-65 10-38 56Z':motif==='ice'||motif==='prism'?'M0 0-92-55-63-5-110 16-47 18-72 66Z':motif==='pixel'||motif==='redaction'?'M0-14h-33v-21h-26v24h-44v28h56v29h33V14H0Z':'M0 0-91-47-57-8-113 8-50 16-74 52Z'} fill={theme.color} fillOpacity=".75" stroke={theme.accent} strokeWidth="4"/><circle r={theme.rarity==='legendary'?33:theme.rarity==='epic'?23:16} strokeWidth="4"/><path d="M-35-35-65-65M-40 27-78 52" strokeWidth="5"/></>}
    <path d={signature[motif]} stroke={theme.accent} strokeWidth={knife?4:5} fill="none"/>
    {Array.from({length:theme.rarity==='legendary'?9:theme.rarity==='epic'?6:4},(_,i)=><circle key={i} cx={-22-i*13} cy={Math.sin(i*2.4)*34} r={2+i%3} fill={i%2?theme.accent:theme.color} stroke="none"/>)}
  </g></g>;
}

export function SkinWeaponArt({weapon,id,firing=false,reloading=false}:{weapon:WeaponId;id:SkinId;firing?:boolean;reloading?:boolean}){
  const theme=getSkin(id);if(!theme)return null;
  const uid=`${weapon}-${id}`;
  const darkMaterial:Partial<Record<SkinTheme['motif'],string>>={stars:'#22203e',eye:'#263849',redaction:'#1b202b',prism:'#2a365b',dragon:'#20253a',flame:'#292631',abyss:'#122a3e',circuit:'#13263d'};
  const paints={shell:theme.base,dark:darkMaterial[theme.motif]??theme.accent,metal:theme.color,light:theme.motif==='stars'?'#51477a':theme.base,core:theme.color};
  return <g className={`skin-render skin-render--${theme.motif} skin-render--${theme.rarity} ${reloading?'skin-render--reload':''}`} style={{'--skin-color':theme.color,'--skin-accent':theme.accent} as React.CSSProperties}>
    <defs>
      <linearGradient id={`${uid}-surface`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={theme.base}/><stop offset=".55" stopColor={theme.color}/><stop offset="1" stopColor={theme.accent}/></linearGradient>
      <pattern id={`${uid}-grain`} width="24" height="24" patternUnits="userSpaceOnUse" patternTransform={theme.motif==='hazard'?'rotate(35)':undefined}><rect width="24" height="24" fill={theme.base}/>{['hazard','redaction','pixel','cassette'].includes(theme.motif)?<path d="M0 0h10v12H0M13 13h9v9h-9" fill={theme.accent}/>:<path d="M0 20 20 0m-9 24L24 11" stroke={theme.color} strokeWidth="2" opacity=".4"/>}</pattern>
    </defs>
    <ThemeSilhouette theme={theme} weapon={weapon}/>
    {PARTS[weapon].map((part,i)=><path key={part.name} data-weapon-part={part.name} d={part.d} fill={part.layer==='shell'?`url(#${uid}-grain)`:paints[part.layer]} stroke={part.layer==='dark'?theme.color:theme.accent} strokeWidth={part.name==='scope'||part.name==='stock'?7:5} strokeLinejoin="round" strokeLinecap="round" opacity={part.name==='grip'?'.95':undefined} className={`skin-part skin-part--${part.name}`} style={{animationDelay:`${i*35}ms`}}/>)}
    <Motif theme={theme} weapon={weapon}/>
    {weapon!=='knife'&&<><path d="M315 239 458 351 503 343 617 454 651 515 808 578" fill="none" stroke={theme.accent} strokeWidth="3"/><path d="M325 245 464 345 515 348 619 448 661 511 801 572" fill="none" stroke={theme.color} strokeWidth="3" className="skin-flow" strokeDasharray="15 37"/></>}
    {theme.rarity!=='rare'&&<g className="skin-idle-particles" fill={theme.color}>{[0,1,2,3,4].map(i=><circle key={i} cx={395+i*63} cy={278+(i%3)*54} r={i%2?2:3} style={{animationDelay:`${i*.43}s`}}/>)}</g>}
    {firing&&<SkinAttack theme={theme} weapon={weapon}/>}
  </g>;
}

export function ScopedSkinArt({weapon,id}:{weapon:WeaponId;id:SkinId}){
  const theme=getSkin(id);if(!theme)return null;
  return <g className={`skin-scoped skin-scoped--${theme.motif}`} fill="none" stroke={theme.color} strokeWidth="5" strokeLinejoin="round">
    <path d="M399 520Q500 466 601 520L652 600H348Z" fill={theme.base} stroke={theme.accent} strokeWidth="8"/>
    <path d="M415 519Q500 477 585 519M377 587H623" stroke={theme.color} strokeWidth="5"/>
    {weapon==='rifle'?<><path d="M435 231 565 231 583 370 417 370Z M464 260 464 340 536 340 536 260Z" fill={theme.accent} fillRule="evenodd"/><path d="M464 260h72v80h-72Z" stroke={theme.color}/></>:weapon==='shotgun'?<><path d="M490 451V390M469 408h62" strokeWidth="9"/><path d="M477 390 500 366 523 390Z" fill={theme.accent}/></>:<><ellipse cx="500" cy="520" rx="112" ry="49" stroke={theme.accent} strokeWidth="9"/><path d="M472 491h56"/></>}
    <path d="M421 535q79-48 158 0" stroke={theme.color} strokeWidth="3" strokeDasharray="9 8" className="skin-flow"/>
  </g>;
}
