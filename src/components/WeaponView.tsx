import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../game/store";

function HipWeaponArt({ weapon }: { weapon: "sniper" | "rifle" | "shotgun" }) {
  return (
    <svg viewBox="0 0 900 620" role="presentation">
      <defs>
        <pattern id="gun-hatch" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(29)">
          <line x1="0" y1="0" x2="0" y2="11" className="gun-hatch-line" />
        </pattern>
      </defs>

      {weapon === "rifle" && (
        <g className="gun-drawing gun-drawing--rifle" transform="translate(0 108) scale(1 .72)">
          <path className="gun-barrel" d="M237 128 L347 225" />
          <circle className="gun-dot gun-dot--red" cx="237" cy="128" r="5" />
          <path className="gun-fill gun-hatch" d="M337 211 L382 201 L641 438 L600 481 L365 257 Z" />
          <path className="gun-fill" d="M374 235 L432 237 L523 320 L486 356 L401 276 Z" />
          <path className="gun-fill gun-hatch" d="M572 403 L812 571 L770 610 L548 451 Z" />
          <path className="gun-fill" d="M488 335 Q530 362 560 429 L518 450 Q478 398 454 355 Z" />
          <rect className="gun-fill gun-optic" x="335" y="176" width="105" height="60" rx="8" transform="rotate(42 388 206)" />
          <rect className="gun-line-only" x="356" y="184" width="53" height="32" rx="4" transform="rotate(42 383 200)" />
          <path className="gun-hand" d="M491 370 Q458 397 462 459 L507 491 L545 451 L532 393 Z" />
          <path className="gun-hand" d="M642 468 Q610 498 621 555 L674 594 L710 553 L692 500 Z" />
        </g>
      )}

      {weapon === "shotgun" && (
        <g className="gun-drawing gun-drawing--shotgun" transform="translate(0 108) scale(1 .72)">
          <path className="gun-barrel" d="M230 121 L350 228" />
          <path className="gun-barrel gun-barrel--thin" d="M245 135 L361 239" />
          <circle className="gun-dot gun-dot--red" cx="230" cy="121" r="6" />
          <path className="gun-fill" d="M344 218 L390 206 L654 450 L611 491 L371 262 Z" />
          <path className="gun-fill gun-hatch" d="M404 263 L486 335 L449 377 L373 302 Z" />
          <path className="gun-line gun-line--thin" d="M403 276 L466 334 M413 266 L476 324" />
          <path className="gun-fill" d="M492 355 L579 432 L543 471 L458 390 Z" />
          <path className="gun-fill gun-hatch" d="M578 430 L819 577 L782 616 L548 477 Z" />
          <path className="gun-hand" d="M483 384 Q454 410 457 464 L501 497 L538 458 L527 408 Z" />
          <path className="gun-hand" d="M645 481 Q613 508 624 560 L674 598 L709 558 L692 507 Z" />
        </g>
      )}

      {weapon === "sniper" && (
        <g className="gun-drawing gun-drawing--sniper" transform="translate(0 108) scale(1 .72)">
          <path className="gun-barrel" d="M224 114 L357 232" />
          <path className="gun-barrel gun-barrel--thin" d="M238 127 L367 242" />
          <circle className="gun-dot" cx="224" cy="114" r="5" />
          <path className="gun-fill" d="M349 222 L392 208 L655 450 L613 493 L376 266 Z" />
          <path className="gun-fill gun-hatch" d="M409 267 L508 355 L469 396 L378 306 Z" />
          <path className="gun-fill" d="M511 365 L589 435 L552 474 L475 402 Z" />
          <path className="gun-fill gun-hatch" d="M588 438 L819 579 L783 616 L555 480 Z" />
          <g className="sniper-scope" transform="translate(407 251) rotate(42)">
            <rect className="gun-fill" x="-102" y="-31" width="204" height="62" rx="18" />
            <circle className="gun-fill" cx="-95" cy="0" r="39" />
            <circle className="gun-line-only" cx="-95" cy="0" r="24" />
            <circle className="gun-fill" cx="95" cy="0" r="45" />
            <circle className="gun-line-only" cx="95" cy="0" r="28" />
          </g>
          <path className="gun-line gun-line--thin" d="M503 371 L543 338 L566 343" />
          <path className="gun-hand" d="M485 389 Q454 414 458 470 L504 501 L541 462 L530 411 Z" />
          <path className="gun-hand" d="M643 484 Q613 510 624 562 L674 599 L710 560 L694 510 Z" />
        </g>
      )}

      <g className="muzzle-spark" transform="translate(0 108) scale(1 .72)">
        <path d="M230 122 l-26 -21 M230 122 l-5 -31 M230 122 l22 -23 M230 122 l31 5" />
      </g>
    </svg>
  );
}

function ScopedWeaponArt({ weapon }: { weapon: "sniper" | "rifle" | "shotgun" }) {
  return (
    <svg className="weapon-scope-model" viewBox="0 0 1000 600" role="presentation">
      {weapon === "sniper" && (
        <g className="ads-drawing ads-drawing--sniper">
          <path className="ads-fill" d="M397 520 Q500 468 603 520 L650 600 H350 Z" />
          <path className="ads-line" d="M420 510 Q500 476 580 510" />
          <path className="ads-line ads-line--thin" d="M463 492 H537" />
        </g>
      )}

      {weapon === "rifle" && (
        <g className="ads-drawing ads-drawing--rifle">
          <path className="ads-fill" d="M405 456 L595 456 L670 600 H330 Z" />
          <path className="ads-fill ads-optic-frame" d="M438 230 L562 230 L578 368 L422 368 Z" />
          <rect className="ads-lens" x="462" y="268" width="76" height="64" rx="9" />
          <circle className="ads-dot" cx="500" cy="300" r="5" />
          <path className="ads-line ads-line--thin" d="M447 400 H553" />
        </g>
      )}

      {weapon === "shotgun" && (
        <g className="ads-drawing ads-drawing--shotgun">
          <path className="ads-fill" d="M418 452 L582 452 L650 600 H350 Z" />
          <path className="ads-line" d="M500 452 V306" />
          <path className="ads-line ads-line--thin" d="M470 330 H530" />
          <circle className="ads-dot ads-dot--red" cx="500" cy="300" r="7" />
        </g>
      )}
    </svg>
  );
}

export function WeaponView() {
  const weapon = useGameStore((state) => state.weapon);
  const scoped = useGameStore((state) => state.scoped);
  const movementMode = useGameStore((state) => state.movementMode);
  const reloading = useGameStore((state) => state.reloading);
  const [kick, setKick] = useState(false);
  const kickTimer = useRef<number | null>(null);

  useEffect(() => {
    const handler = () => {
      setKick(true);
      if (kickTimer.current) window.clearTimeout(kickTimer.current);
      kickTimer.current = window.setTimeout(() => setKick(false), 86);
    };

    window.addEventListener("weapon-fired", handler);
    return () => {
      if (kickTimer.current) window.clearTimeout(kickTimer.current);
      window.removeEventListener("weapon-fired", handler);
    };
  }, []);

  return (
    <div
      className={`weapon-view weapon-view--${weapon} movement-${movementMode} ${scoped ? "is-scoped" : "is-hip"} ${kick ? "is-kicking" : ""} ${reloading ? "is-reloading" : ""}`}
      aria-hidden="true"
    >
      <div className="weapon-view__motion">
        <div className="weapon-view__perspective">
          <div className="weapon-view__kick">
            {scoped ? (
              <ScopedWeaponArt weapon={weapon} />
            ) : (
              <HipWeaponArt weapon={weapon} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
