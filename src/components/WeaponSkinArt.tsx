import type { WeaponId } from "../game/config";
import { getSkin, type SkinId, type SkinTheme } from "../game/skins";

/** Compact sketch assets. The same ornament is mounted at each weapon's attachment points. */
function ThemePlating({theme,weapon}:{theme:SkinTheme;weapon:WeaponId}){
  const {id,color,accent,motif,rarity}=theme;
  const knife=weapon==="knife";
  const panel=knife?"M488 400 535 368 641 459 605 500Z":"M454 356 497 335 649 449 607 478Z";
  const rear=knife?"M527 410 609 467 642 470 605 498Z":"M639 505 827 567 805 611 619 549Z";
  const long=knife?"M320 217 343 235 500 380 478 391Z":"M304 232 318 230 472 345 453 358Z";
  return <g className={`skin-plating skin-plating--${id}`} strokeLinejoin="round" strokeLinecap="round">
    <defs>
      <clipPath id={`skin-plates-${id}-${weapon}`}><path d={`${panel} ${rear} ${long}`}/></clipPath>
      <pattern id={`skin-pattern-${id}`} patternUnits="userSpaceOnUse" width={motif==="hazard"?28:motif==="pixel"?20:motif==="redaction"?38:24} height="24" patternTransform={motif==="hazard"?"rotate(38)":""}>
        <rect width="24" height="24" fill={motif==="stars"?"#191e3e":motif==="redaction"?"#f9f8ef":"#fffef7"}/>
        {motif==="hazard"?<><rect width="13" height="24" fill="#262b3a"/><rect x="13" width="15" height="24" fill="#ffd449"/></>:motif==="pixel"?<><rect x="2" y="2" width="7" height="7" fill={color}/><rect x="12" y="13" width="6" height="6" fill={accent}/></>:motif==="stars"?<><circle cx="5" cy="6" r="2.2" fill="#fff"/><circle cx="19" cy="17" r="1.7" fill={color}/><path d="m5 6 14 11" stroke={color}/></>:motif==="redaction"?<><rect x="0" y="7" width="31" height="7" fill="#20202e"/><path d="M0 20H21" stroke="#e74e55" strokeWidth="2"/></>:motif==="nib"?<><path d="M0 7q8-7 24 0M2 18q8-9 19-3" stroke={color} strokeWidth="3"/></>:motif==="graffiti"?<><path d="m2 18 6-12 6 7 8-10" stroke={color} strokeWidth="3"/><circle cx="18" cy="18" r="2" fill={accent}/></>:motif==="circuit"?<><path d="M0 12h10V3h9m-9 9v10h14" stroke={color} strokeWidth="2.5"/><circle cx="19" cy="3" r="2" fill={accent}/></>:motif==="fold"||motif==="ice"?<path d="M0 0 24 24M0 24 24 0" stroke={color} strokeWidth="2"/>:<><path d="M0 7q12-8 24 0M1 20q14-9 24 0" stroke={color} strokeWidth="2"/><circle cx="17" cy="6" r="2" fill={accent}/></>}
      </pattern>
    </defs>
    <path d={panel} fill={motif==="stars"?"#212342":motif==="redaction"?"#f7f3ea":color} fillOpacity={rarity==="rare"?.36:.42} stroke={color} strokeWidth="3"/>
    <path d={rear} fill={motif==="stars"?"#262448":motif==="redaction"?"#faf7ee":color} fillOpacity={rarity==="legendary"?.42:.29} stroke={accent} strokeWidth="3"/>
    <path d={long} fill={color} fillOpacity={rarity==="rare"?.42:.6} stroke={accent} strokeWidth="2.5"/>
    <g clipPath={`url(#skin-plates-${id}-${weapon})`}><rect x="280" y="180" width="565" height="435" fill={`url(#skin-pattern-${id})`} opacity={motif==="stars"||motif==="hazard"||motif==="redaction"?.85:.42}/></g>
    {!knife&&<><path d="M648 512Q732 539 814 575M629 546Q705 572 799 603" stroke={color} strokeWidth="3" fill="none"/><path d="M641 520 657 524m20 5 16 5m20 4 16 5m20 4 16 5" stroke={accent} strokeWidth="2.5"/></>}
    <g transform={knife?"matrix(.57 0 0 .7 165 58)":undefined}>
    {motif==="nib"&&<><path d="M319 239Q397 289 463 352M326 246Q406 299 470 357" stroke="#131c35" strokeWidth="4" fill="none"/><path d={knife?"M328 230 306 193 328 208Z":"M324 247 291 226 303 248Z"} fill="#222e5a" stroke={color} strokeWidth="3"/><circle cx="545" cy="388" r="9" fill="#141a35"/></>}
    {motif==="ruler"&&<><path d={knife?"M333 239 487 386":"M321 252 472 359"} stroke="#f6c948" strokeWidth="14" opacity=".83"/><path d="M654 522 807 572" stroke="#f6c948" strokeWidth="12" opacity=".65"/>{[0,1,2,3,4,5,6].map((i)=><path key={i} d={`M${659+i*21} ${523+i*7}l-3 10`} stroke={accent} strokeWidth="2"/>)}</>}
    {motif==="fold"&&<><path d="M364 277 412 280 399 310Zm79 56 29-20 10 47Zm211 187 52-20-14 42Z" fill="#d4ebff" stroke={accent} strokeWidth="3"/><path d="M372 284 400 310m44 25 38 25m173 163 37 19" stroke={accent} strokeWidth="2"/></>}
    {motif==="pixel"&&<><rect x="510" y="355" width="56" height="30" rx="3" fill="#1d3153" stroke={color} strokeWidth="3"/><text x="518" y="376" fill="#73f4ff" stroke="none" fontFamily="monospace" fontWeight="bold" fontSize="17">1999</text><path d="M687 528h10v10h-10Zm30 12h9v8h-9Z" fill={accent}/></>}
    {motif==="clip"&&<><path d="M675 516q-9-24 7-27 13-1 12 16l-2 28m42-7q-9-21 5-22 11-1 10 13" fill="none" stroke={accent} strokeWidth="4"/><rect x="517" y="352" width="43" height="19" fill="#fff9e4" stroke={color} strokeWidth="2"/></>}
    {motif==="graffiti"&&<><path d="m688 529 13-17 10 17 24-11-12 26 18 17-32-2-13 15-5-26-22-4Z" fill="#fa9dce" stroke={accent} strokeWidth="3"/><text x="696" y="549" fill="#392d87" stroke="none" fontFamily="sans-serif" fontSize="15" fontWeight="bold">NO!</text><path d="m485 350 18-12-4 18 17-4" stroke={color} strokeWidth="4" fill="none"/></>}
    {motif==="circuit"&&<><path d="m660 527 27 8 9-10 32 11v15l28 6m-92-13 30 12 14-3 32 15" stroke={color} strokeWidth="3.5" fill="none"/>{[[696,525],[727,551],[757,557],[708,553]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4" fill={i%2?accent:color}/>)}</>}
    {motif==="ice"&&<><path d="M377 273 403 247 397 288Zm53 42 22-20-8 40Zm71 48 19-29 7 50Zm190 161 25-26 3 43Z" fill="#c4f5ff" stroke={accent} strokeWidth="3"/></>}
    {motif==="flame"&&<><path d="M364 266Q403 289 456 341M481 358Q533 380 608 443M654 520Q726 544 801 579" fill="none" stroke="#a82e3e" strokeWidth="12" opacity=".75"/><path className="skin-pulse-line" d="M364 266Q403 289 456 341M481 358Q533 380 608 443M654 520Q726 544 801 579" fill="none" stroke="#ffbf6a" strokeWidth="3" strokeDasharray="19 23"/></>}
    {motif==="vial"&&<><path d="M502 320q44-15 52 19" stroke={accent} strokeWidth="6" fill="none"/><rect x="514" y="333" width="57" height="29" rx="8" fill="#d6f9dc" stroke="#276b79" strokeWidth="3"/><path d="M516 351q24-10 53-4v10h-53Z" fill={color}/><circle cx="540" cy="342" r="4" fill="#fff"/></>}
    {motif==="storm"&&<><path d="m651 524 25-23-5 24 33-10-26 32 7-26-34 22Z" fill="#e5e4ff" stroke={accent} strokeWidth="3"/><path d="m427 307 15-15-2 15 21-8-18 22 2-15Z" fill="#fff3b3" stroke={color} strokeWidth="2"/></>}
    {motif==="eye"&&<><path d="M657 527Q692 512 724 539M659 537Q690 526 720 548" fill="none" stroke={accent} strokeWidth="3"/><path className="skin-pulse-line" d="M662 550Q735 538 791 594" stroke={color} strokeWidth="4" strokeDasharray="12 10" fill="none"/></>}
    {motif==="stars"&&<><ellipse cx="704" cy="550" rx="74" ry="17" transform="rotate(17 704 550)" fill="none" stroke={color} strokeWidth="3"/><circle cx="688" cy="535" r="5" fill="#fff"/><circle cx="752" cy="572" r="4" fill={color}/><circle cx="557" cy="380" r="8" fill="#f4f2ff"/><path d="m674 545 27-8 28 20 24-4" stroke="#d4caff" strokeWidth="2" fill="none"/></>}
    {motif==="redaction"&&<><path d="M648 520 775 559M671 544 810 586" stroke="#191a29" strokeWidth="11" fill="none"/><rect x="503" y="355" width="58" height="29" rx="2" fill="#fffaf1" stroke="#e7434c" strokeWidth="3"/><text x="507" y="373" fontFamily="monospace" fontWeight="bold" fontSize="12" fill="#c8243b" stroke="none">SECRET</text><path className="skin-moving-redaction" d="M371 275 444 329" stroke="#171723" strokeWidth="9"/></>}
    </g>
  </g>;
}

export function WeaponSkinArt({weapon,id,firing=false,reloading=false}:{weapon:WeaponId;id:SkinId;firing?:boolean;reloading?:boolean}){
  const theme=getSkin(id);if(!theme)return null;
  const {color,accent,rarity,motif}=theme;
  const isKnife=weapon==="knife";
  const anchors=isKnife?[[392,291,1.32,-15],[514,395,1.25,35],[604,460,.82,30]]:weapon==="sniper"?[[376,276,1.28,-4],[546,383,1.23,35],[683,536,1.1,19]]:weapon==="shotgun"?[[403,304,1.45,-4],[538,398,1.37,28],[680,537,1.1,18]]:[[391,297,1.28,-4],[528,385,1.23,30],[680,537,1.07,18]];
  const ink=motif==="nib"||motif==="eye";
  return <g className={`skin-geometry skin-geometry--${id} skin-geometry--${rarity} ${reloading?"skin-geometry--reload":""}`} stroke={accent} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
    <defs>
      <pattern id={`skin-etch-${id}`} width="11" height="11" patternUnits="userSpaceOnUse" patternTransform={motif==="pixel"?"rotate(0)":"rotate(33)"}><path d="M0 0v11" stroke={color} strokeWidth="2" opacity=".6"/></pattern>
      <linearGradient id={`skin-glow-${id}`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fffef4"/><stop offset=".52" stopColor={color}/><stop offset="1" stopColor={accent}/></linearGradient>
    </defs>
    <ThemePlating theme={theme} weapon={weapon}/>
    {/* The barrel/blade is an attachment path over the original silhouette, never a replacement mesh. */}
    <path d={isKnife?"M320 222 Q402 281 490 382":"M303 238 Q385 292 469 354"} stroke={color} strokeWidth={weapon==="shotgun"?9:5} fill="none" opacity=".72" strokeDasharray={motif==="hazard"?"17 7":motif==="redaction"?"29 7":"none"}/>
    <path d={isKnife?"M321 235Q396 300 487 391":"M314 251Q381 301 456 357"} stroke={accent} strokeWidth="2" fill="none" strokeDasharray={ink?"17 6":"8 8"}/>
    <path className="skin-etched-panel" d={isKnife?"M491 401 530 375 614 451 584 467Z":"M476 359 507 342 568 388 541 404Z"} fill={`url(#skin-etch-${id})`} stroke={color} strokeWidth="2.6"/>
    {rarity!=="rare"&&<path className="skin-pulse-line" d={isKnife?"M331 235 486 380 540 385 610 456":"M326 243 461 349 520 350 581 401"} stroke={color} strokeWidth="3.5" fill="none" strokeDasharray="18 65"/>}
    {motif==="stars"&&<path d="M473 359 507 343 559 385 536 405Z" fill="#182044" stroke={color} opacity=".95"/>}
    {motif==="redaction"&&<path className="skin-moving-redaction" d="M364 258 439 313m91 76 39 28" stroke="#151727" strokeWidth="10" fill="none"/>}
    {/* Engraved paths follow the existing barrel, receiver and stock instead of floating props. */}
    <path className="skin-channel" d={isKnife?"M329 237 478 380 521 381 612 463":"M329 249 458 351 499 344 617 451 651 514 807 578"} stroke={color} strokeWidth={rarity==="legendary"?6:rarity==="epic"?4:3} fill="none" strokeDasharray={motif==="redaction"?"22 10":motif==="pixel"?"9 4":undefined}/>
    <path className="skin-channel skin-channel--inner" d={isKnife?"M344 245 474 372 523 373 604 452":"M343 252 468 340 493 336 626 443 660 505 805 566"} stroke={accent} strokeWidth="2" fill="none"/>
    <path className="skin-receiver-inlay" d={isKnife?"M499 402 532 378 599 447 576 464Z":"M492 357 510 347 549 377 536 390Z"} fill={motif==="stars"?"#171d3d":"#fffef4"} stroke={color} strokeWidth="3"/>
    <path className="skin-receiver-line" d={isKnife?"M507 403 529 388 574 434":"M501 355 513 352 538 373"} stroke={accent} strokeWidth="2.5" fill="none"/>
    {rarity!=="rare"&&<path className="skin-impulse" d={isKnife?"M342 245 479 380 529 379 606 460":"M337 251 461 352 502 345 623 451 666 521"} stroke={color} strokeWidth="3" fill="none" strokeDasharray="20 220"/>}
    {rarity==="legendary"&&<g className="skin-orbit-dust" fill={color} stroke="none"><circle cx="480" cy="318" r="3"/><circle cx="524" cy="310" r="2"/><circle cx="544" cy="342" r="2.5"/></g>}
    {firing&&<g className={`skin-attack-effect skin-attack-effect--${rarity}`} fill="none" stroke={color} strokeWidth="4">
      <path d={isKnife?"M319 226Q263 181 210 171M326 236Q265 203 224 199":"M304 236Q272 204 236 192M304 236Q276 222 224 224"} stroke={accent} strokeWidth={rarity==="legendary"?7:4} strokeLinecap="round"/>
      {isKnife?<><path d="M306 210Q254 167 225 155M316 226Q261 185 244 178M323 240Q271 209 256 199"/><path d="M244 150q-15 2-20 14" stroke={accent}/></>:<><path d="M300 236 249 212m49 23-24-46m27 45 1-57m3 59 23-50"/><circle cx="289" cy="225" r={rarity==="legendary"?31:18} stroke={accent}/></>}
      {rarity!=="rare"&&[0,1,2,3,4].map((i)=><path key={i} d={`m${isKnife?260-i*8:273-i*7} ${isKnife?181-i*5:197+i*8} 5-6 6 6-6 6Z`} fill={i%2?color:accent} stroke="none"/>)}
    </g>}
  </g>;
}

export function ScopedSkinArt({weapon,id}:{weapon:WeaponId;id:SkinId}){
  const theme=getSkin(id);if(!theme)return null;
  return <g className={`skin-geometry skin-geometry--${id} skin-geometry--${theme.rarity}`} stroke={theme.accent} strokeWidth="3" fill="none" strokeLinejoin="round">
    <path d={weapon==="rifle"?"M410 472 459 463m82 0 49 9":"M393 532Q500 473 607 532"} stroke={theme.color} strokeWidth="6"/>
    <path className="skin-scope-channel" d="M429 502Q500 473 571 502" stroke={theme.accent} strokeWidth="2" strokeDasharray={theme.motif==="stars"?"2 11":"15 12"}/>
    {weapon==="rifle"&&<><circle cx="443" cy="254" r="4" fill={theme.color}/><circle cx="557" cy="254" r="4" fill={theme.color}/></>}
  </g>;
}
