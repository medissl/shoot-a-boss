import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../game/store";

type WeaponId = "sniper" | "rifle" | "shotgun";

function FrontHand() {
  return (
    <path
      className="gun-hand"
      d="M668 448
         C642 453 620 473 617 503
         C615 529 626 550 646 566
         L683 554
         C698 534 703 511 695 489
         C690 473 681 458 668 448 Z"
    />
  );
}

function HipWeaponArt({ weapon }: { weapon: WeaponId }) {
  return (
    <svg
      className="weapon-hip-model"
      viewBox="0 0 1000 600"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
    >
      <defs>
        <pattern
          id="gun-hatch"
          width="11"
          height="11"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(29)"
        >
          <line x1="0" y1="0" x2="0" y2="11" className="gun-hatch-line" />
        </pattern>
        <linearGradient id="gun-paper-depth" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fffef8" />
          <stop offset="1" stopColor="#eef2ff" />
        </linearGradient>
      </defs>

      {weapon === "rifle" && (
        <g className="gun-drawing gun-drawing--rifle">
          <path className="gun-barrel gun-barrel--thin" d="M503 318 L615 392" />
          <path className="gun-fill gun-hatch" d="M610 384 L660 378 L846 520 L807 560 L643 418 Z" />
          <path className="gun-fill" d="M641 405 L701 408 L791 477 L757 515 L673 443 Z" />
          <path className="gun-fill gun-hatch" d="M786 493 L1000 596 L960 628 L758 527 Z" />
          <path className="gun-fill" d="M742 466 Q784 487 807 535 L769 554 Q735 516 716 481 Z" />

          <path className="gun-line gun-line--thin" d="M571 355 L597 336 L631 362 L608 387 Z" />
          <path className="gun-fill gun-optic" d="M550 337 L596 340 L625 367 L598 391 L557 385 L536 361 Z" />
          <path className="gun-line-only" d="M558 348 L588 350 L607 367 L590 381 L564 377 L549 362 Z" />
          <circle className="gun-dot gun-dot--red" cx="579" cy="365" r="4.5" />

          <path className="gun-line gun-line--thin" d="M690 432 L719 424 L740 439" />
          <FrontHand />

          <path className="gun-perspective-line" d="M506 318 L987 604" />
        </g>
      )}

      {weapon === "shotgun" && (
        <g className="gun-drawing gun-drawing--shotgun">
          <path className="gun-barrel" d="M500 318 L674 420" />
          <path className="gun-barrel gun-barrel--thin" d="M505 329 L677 430" />
          <circle className="gun-dot gun-dot--red" cx="500" cy="318" r="5.5" />

          <path className="gun-fill" d="M666 407 L710 401 L858 515 L821 554 L693 442 Z" />
          <path className="gun-fill gun-hatch" d="M635 389 L704 403 L758 445 L717 478 L651 430 Z" />
          <path className="gun-line gun-line--thin" d="M650 401 L711 444 M661 393 L721 435" />
          <path className="gun-fill gun-hatch" d="M832 500 L1000 590 L961 627 L803 538 Z" />

          <FrontHand />
          <path className="gun-perspective-line" d="M504 321 L986 600" />
        </g>
      )}

      {weapon === "sniper" && (
        <g className="gun-drawing gun-drawing--sniper">
          <path className="gun-barrel" d="M500 318 L646 404" />
          <path className="gun-barrel gun-barrel--thin" d="M504 329 L650 414" />

          <path className="gun-fill" d="M642 394 L686 386 L847 511 L811 554 L670 430 Z" />
          <path className="gun-fill gun-hatch" d="M676 420 L752 450 L801 490 L763 526 L692 468 Z" />
          <path className="gun-fill gun-hatch" d="M820 496 L1000 590 L962 628 L791 536 Z" />

          <g className="sniper-scope-perspective">
            <path className="gun-fill" d="M560 345 L612 345 L684 401 L651 431 L594 398 L546 363 Z" />
            <ellipse className="gun-fill" cx="563" cy="355" rx="25" ry="18" transform="rotate(30 563 355)" />
            <ellipse className="gun-line-only" cx="563" cy="355" rx="14" ry="9" transform="rotate(30 563 355)" />
            <ellipse className="gun-fill" cx="650" cy="409" rx="37" ry="27" transform="rotate(31 650 409)" />
            <ellipse className="gun-line-only" cx="650" cy="409" rx="22" ry="15" transform="rotate(31 650 409)" />
            <path className="gun-line gun-line--thin" d="M597 366 L604 343 M625 385 L635 361" />
          </g>

          <path className="gun-line gun-line--thin" d="M728 457 L758 441 L779 447" />
          <FrontHand />
          <path className="gun-perspective-line" d="M504 320 L987 602" />
        </g>
      )}

      <g className="muzzle-spark muzzle-spark--hip">
        <path d="M501 318 l-24 -17 M501 318 l-4 -27 M501 318 l22 -21 M501 318 l28 5" />
      </g>
    </svg>
  );
}

function ScopedWeaponArt({ weapon }: { weapon: WeaponId }) {
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
