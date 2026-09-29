import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { WeaponId } from "../game/config";
import { useGameStore } from "../game/store";
import { getSkin, skinColor, type SkinId } from "../game/skins";
import { SKIN_MUZZLES } from "../game/weaponMuzzle";
import { ScopedSkinArt, SkinWeaponArt } from "./WeaponSkinArt";

function RifleHipArt() {
  return (
    <g className="gun-drawing gun-drawing--rifle">
      <path className="gun-fill gun-hatch" d="M314 250 L330 238 L472 346 L454 362 Z" />
      
      <path className="gun-fill" d="M427 314 L466 299 L548 362 L509 381 Z" />
      <path className="gun-fill gun-hatch" d="M455 352 L497 331 L650 448 L607 470 Z" />
      <path className="gun-fill" d="M607 470 L650 448 L685 479 L640 503 Z" />
      <path className="gun-line gun-line--thin" d="M472 346 L505 321 L626 414" />
      <path className="gun-line gun-line--thin" d="M486 335 L594 420" />
      <path className="gun-fill" d="M487 317 L535 314 L574 343 L538 362 L495 348 Z" />
      <path className="gun-line-only" d="M503 325 L531 324 L552 340 L532 351 L507 343 Z" />
      <path className="gun-fill" d="M557 431 L607 469 L589 545 L544 515 Z" />
      <path className="gun-line gun-line--thin" d="M564 461 L590 481" />
      <path className="gun-fill gun-hatch" d="M639 502 L832 564 L809 613 L619 542 Z" />
      <path className="gun-line gun-line--thin" d="M650 516 L795 570" />
      <path className="gun-hand" d="M501 390 L536 407 L548 459 L519 491 L482 465 L480 416 Z" />
      <path className="gun-line gun-line--thin" d="M495 408 L525 425" />
    </g>
  );
}

function ShotgunHipArt() {
  return (
    <g className="gun-drawing gun-drawing--shotgun">
      <path className="gun-fill" d="M298 236 L316 226 L474 345 L456 362 Z" />
      <path className="gun-line gun-line--thin" d="M307 247 L461 365" />
      
      <path className="gun-fill gun-hatch" d="M419 321 L458 304 L584 400 L544 421 Z" />
      <path className="gun-fill" d="M454 358 L495 336 L653 457 L609 480 Z" />
      <path className="gun-fill gun-hatch" d="M490 357 L548 401 L517 438 L461 394 Z" />
      <path className="gun-line gun-line--thin" d="M478 379 L529 418" />
      <path className="gun-line gun-line--thin" d="M488 367 L539 406" />
      <path className="gun-fill" d="M608 480 L653 457 L687 489 L640 512 Z" />
      <path className="gun-fill gun-hatch" d="M640 511 L831 566 L807 613 L621 549 Z" />
      <path className="gun-hand" d="M502 402 L536 417 L549 469 L520 499 L484 475 L480 428 Z" />
      <path className="gun-line gun-line--thin" d="M495 421 L525 438" />
    </g>
  );
}

function SniperHipArt() {
  return (
    <g className="gun-drawing gun-drawing--sniper">
      <path className="gun-fill" d="M282 222 L300 210 L481 346 L462 364 Z" />
      <path className="gun-line gun-line--thin" d="M292 234 L466 366" />
      <circle className="gun-dot" cx="283" cy="221" r="5" />
      <path className="gun-fill gun-hatch" d="M430 324 L471 307 L602 407 L561 429 Z" />
      <path className="gun-fill" d="M459 361 L500 340 L654 458 L610 482 Z" />
      <g transform="translate(493 326) rotate(37)">
        <rect className="gun-fill" x="-92" y="-25" width="184" height="50" rx="13" />
        <circle className="gun-fill" cx="-90" cy="0" r="31" />
        <circle className="gun-line-only" cx="-90" cy="0" r="18" />
        <circle className="gun-fill" cx="89" cy="0" r="35" />
        <circle className="gun-line-only" cx="89" cy="0" r="20" />
      </g>
      <path className="gun-line gun-line--thin" d="M533 375 L560 349 L586 354" />
      <path className="gun-fill" d="M564 438 L610 481 L592 546 L548 518 Z" />
      <path className="gun-fill gun-hatch" d="M641 510 L831 567 L806 614 L622 550 Z" />
      <path className="gun-hand" d="M504 404 L539 420 L552 471 L522 502 L485 477 L482 430 Z" />
      <path className="gun-line gun-line--thin" d="M498 424 L528 441" />
    </g>
  );
}

function KnifeHipArt() {
  return (
    <g className="gun-drawing gun-drawing--knife">
      <path
        className="gun-fill gun-hatch"
        d="M520 374 L344 234 L303 194 L322 255 L487 405 Z"
      />
      <path
        className="gun-line gun-line--thin"
        d="M342 238 L303 194 M355 257 L322 255"
      />
      <path
        className="gun-fill"
        d="M488 402 L535 366 L651 466 L607 508 Z"
      />
      <path
        className="gun-line gun-line--thin"
        d="M516 389 L625 481 M532 374 L642 466"
      />
      <path
        className="gun-hand"
        d="M590 451 Q628 435 674 469 L703 521 L663 558 L619 529 Z"
      />
      
    </g>
  );
}

function HipWeaponArt({ weapon, skin, firing, reloading, preview=false }: { weapon: WeaponId; skin: SkinId; firing:boolean; reloading:boolean; preview?:boolean }) {
  const muzzle = skin === "default"
    ? { rifle: [310, 245], shotgun: [297, 235], sniper: [281, 220], knife: [0, 0] }[weapon]
    : SKIN_MUZZLES[weapon];
  return (
    <svg viewBox={preview ? "255 173 615 452" : "0 0 900 620"} role="presentation">
      <defs>
        <pattern
          id="gun-hatch"
          width="11"
          height="11"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(29)"
        >
          <rect width="11" height="11" fill="#fbfaf4" />
          <line x1="0" y1="0" x2="0" y2="11" className="gun-hatch-line" />
        </pattern>
      </defs>

      {skin === "default" ? <>
        {weapon === "rifle" && <RifleHipArt />}
        {weapon === "shotgun" && <ShotgunHipArt />}
        {weapon === "sniper" && <SniperHipArt />}
        {weapon === "knife" && <KnifeHipArt />}
      </> : <SkinWeaponArt weapon={weapon} id={skin} firing={firing} reloading={reloading}/>}

      {!preview && weapon !== "knife" && <circle data-weapon-muzzle={weapon} cx={muzzle[0]} cy={muzzle[1]} r="0" />}

      {skin === "default" && weapon !== "knife" && (
        <g className="muzzle-spark" transform={`translate(${muzzle[0]} ${muzzle[1]})`}>
          <path d="M0 0 l-24 -15 M0 0 l-4 -26 M0 0 l20 -16 M0 0 l27 4" />
        </g>
      )}
    </svg>
  );
}

export function SkinWeaponPreview({weapon,skin,firing=false}:{weapon:WeaponId;skin:SkinId;firing?:boolean}){
  return <div className="skin-weapon-preview" style={{"--skin-color":skinColor(skin)} as CSSProperties} aria-hidden="true"><HipWeaponArt weapon={weapon} skin={skin} firing={firing} reloading={false} preview/></div>;
}

function ScopedWeaponArt({ weapon, skin }: { weapon: WeaponId; skin: SkinId }) {
  const muzzle = { rifle: [500, 452], shotgun: [500, 366], sniper: [500, 489], knife: [0, 0] }[weapon];
  return (
    <svg className="weapon-scope-model" viewBox="0 0 1000 600" role="presentation">
      {skin === "default" && weapon === "sniper" && (
        <g className="ads-drawing ads-drawing--sniper">
          <path className="ads-fill" d="M397 520 Q500 468 603 520 L650 600 H350 Z" />
          <path className="ads-line" d="M420 510 Q500 476 580 510" />
          <path className="ads-line ads-line--thin" d="M463 492 H537" />
        </g>
      )}

      {skin === "default" && weapon === "rifle" && (
        <g className="ads-drawing ads-drawing--rifle">
          <path className="ads-fill" d="M405 456 L595 456 L670 600 H330 Z" />
          <path className="ads-fill ads-optic-frame" fillRule="evenodd" d="M438 230 L562 230 L578 368 L422 368 Z M462 268 L462 332 L538 332 L538 268 Z" />
          <rect className="ads-lens" x="462" y="268" width="76" height="64" rx="9" />
          <circle className="ads-dot" cx="500" cy="300" r="5" />
          <path className="ads-line ads-line--thin" d="M447 400 H553" />
        </g>
      )}

      {skin === "default" && weapon === "shotgun" && (
        <g className="ads-drawing ads-drawing--shotgun">
          <path className="ads-fill" d="M418 452 L582 452 L650 600 H350 Z" />
          <path className="ads-line" d="M500 452 V390" />
          <path className="ads-line ads-line--thin" d="M470 409 H530" />
        </g>
      )}
      <ScopedSkinArt weapon={weapon} id={skin}/>
      {weapon !== "knife" && <circle data-weapon-muzzle={weapon} cx={muzzle[0]} cy={muzzle[1]} r="0" />}
    </svg>
  );
}

export function SkinScopePreview({weapon,skin}:{weapon:WeaponId;skin:SkinId}){
  const theme=getSkin(skin);
  return <div className="arsenal-scope-model"><ScopedWeaponArt weapon={weapon} skin={skin}/><div className={`scope-overlay scope-overlay--${weapon} ${theme ? `scope-overlay--themed scope-overlay--${theme.rarity} scope-overlay--${theme.motif}` : ""}`} style={theme?{"--scope-color":theme.color,"--scope-accent":theme.accent} as CSSProperties:undefined}><div className="scope-ring"/>{theme&&<div className="scope-theme-rim"><i/><i/><i/><i/><b>{theme.name.toUpperCase()}</b></div>}{weapon==="sniper"&&<><span className="scope-axis scope-axis--x"/><span className="scope-axis scope-axis--y"/></>}<span className="scope-reticle"/></div></div>
}

export function WeaponView() {
  const weapon = useGameStore((state) => state.weapon);
  const skin = useGameStore((state) => state.equippedSkins[state.weapon]);
  const scoped = useGameStore((state) => state.scoped);
  const movementMode = useGameStore((state) => state.movementMode);
  const reloading = useGameStore((state) => state.reloading);
  const [kick, setKick] = useState(false);
  const [inspecting,setInspecting]=useState(false);
  const kickTimer = useRef<number | null>(null);
  const inspectTimer=useRef<number|null>(null);

  useEffect(()=>{
    const inspect=(event:KeyboardEvent)=>{
      if(event.code!=="KeyI"||event.repeat||skin==="default"||useGameStore.getState().screen!=="playing")return;
      if(event.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(event.target.tagName))return;
      setInspecting(false);
      window.requestAnimationFrame(()=>setInspecting(true));
      if(inspectTimer.current)window.clearTimeout(inspectTimer.current);
      inspectTimer.current=window.setTimeout(()=>setInspecting(false),1750);
    };
    window.addEventListener("keydown",inspect);
    return ()=>{window.removeEventListener("keydown",inspect);if(inspectTimer.current)window.clearTimeout(inspectTimer.current);};
  },[skin]);

  useEffect(() => {
    const handler = () => {
      setKick(true);
      if (kickTimer.current) window.clearTimeout(kickTimer.current);
      kickTimer.current = window.setTimeout(
        () => setKick(false),
        weapon === "knife" ? 180 : 86,
      );
    };

    window.addEventListener("weapon-fired", handler);
    return () => {
      if (kickTimer.current) window.clearTimeout(kickTimer.current);
      window.removeEventListener("weapon-fired", handler);
    };
  }, [weapon]);

  return (
    <div
      className={`weapon-view weapon-view--${weapon} movement-${movementMode} ${scoped ? "is-scoped" : "is-hip"} ${kick ? "is-kicking" : ""} ${inspecting ? "is-inspecting" : ""} ${reloading ? "is-reloading" : ""} ${skin !== "default" ? `has-skin skin-${skin} skin-${getSkin(skin)?.rarity}` : ""}`}
      style={{"--skin-color":skinColor(skin)} as CSSProperties}
      aria-hidden="true"
    >
      <div className="weapon-view__motion">
        <div className="weapon-view__perspective">
          <div className="weapon-view__kick">
            {scoped && weapon !== "knife" ? (
              <ScopedWeaponArt weapon={weapon} skin={skin}/>
            ) : (
              <HipWeaponArt weapon={weapon} skin={skin} firing={kick} reloading={reloading}/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
