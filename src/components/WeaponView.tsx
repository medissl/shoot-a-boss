import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../game/store";

export function WeaponView() {
  const weapon = useGameStore((state) => state.weapon);
  const scoped = useGameStore((state) => state.scoped);
  const movementMode = useGameStore((state) => state.movementMode);
  const [kick, setKick] = useState(false);
  const kickTimer = useRef<number | null>(null);

  useEffect(() => {
    const handler = () => {
      setKick(true);
      if (kickTimer.current) window.clearTimeout(kickTimer.current);
      kickTimer.current = window.setTimeout(() => setKick(false), 72);
    };

    window.addEventListener("weapon-fired", handler);
    return () => {
      if (kickTimer.current) window.clearTimeout(kickTimer.current);
      window.removeEventListener("weapon-fired", handler);
    };
  }, []);

  return (
    <div
      className={`weapon-view weapon-view--${weapon} movement-${movementMode} ${scoped ? "is-scoped" : ""} ${kick ? "is-kicking" : ""}`}
      aria-hidden="true"
    >
      <div className="weapon-view__motion">
        <div className="weapon-view__kick">
          <svg viewBox="0 0 760 500" role="presentation">
            <defs>
              <pattern id="gun-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
                <line x1="0" y1="0" x2="0" y2="10" className="gun-hatch-line" />
              </pattern>
            </defs>

            {weapon === "rifle" && (
              <g className="gun-drawing gun-drawing--rifle">
                <path className="gun-fill gun-hatch" d="M330 106 L355 92 L640 376 L606 411 L342 153 Z" />
                <path className="gun-fill" d="M355 118 L400 118 L505 222 L472 256 Z" />
                <path className="gun-fill" d="M486 242 L567 313 L533 350 L461 273 Z" />
                <path className="gun-fill gun-hatch" d="M553 330 L718 463 L686 490 L523 363 Z" />
                <path className="gun-fill" d="M462 253 Q493 281 515 338 L482 353 Q455 310 431 276 Z" />
                <path className="gun-line" d="M333 106 L265 44" />
                <path className="gun-line gun-line--thin" d="M262 42 L319 90" />
                <rect className="gun-fill" x="332" y="111" width="92" height="46" rx="7" transform="rotate(42 378 134)" />
                <rect className="gun-line-only" x="347" y="115" width="46" height="27" rx="3" transform="rotate(42 370 128)" />
                <circle className="gun-dot" cx="314" cy="86" r="5" />
                <path className="gun-hand" d="M455 282 Q430 301 427 347 L458 379 L489 353 L484 304 Z" />
                <path className="gun-hand" d="M574 362 Q552 380 558 424 L594 453 L620 423 L611 382 Z" />
              </g>
            )}

            {weapon === "shotgun" && (
              <g className="gun-drawing gun-drawing--shotgun">
                <path className="gun-line" d="M329 102 L252 31" />
                <path className="gun-line gun-line--thin" d="M343 111 L269 41" />
                <circle className="gun-dot gun-dot--red" cx="251" cy="30" r="6" />
                <path className="gun-fill" d="M332 102 L365 89 L638 367 L607 402 L349 147 Z" />
                <path className="gun-fill gun-hatch" d="M390 148 L459 211 L428 246 L364 179 Z" />
                <path className="gun-fill" d="M468 250 L550 328 L520 360 L440 281 Z" />
                <path className="gun-fill gun-hatch" d="M548 331 L714 466 L684 493 L517 363 Z" />
                <path className="gun-line gun-line--thin" d="M386 161 L435 207 M396 151 L445 196" />
                <path className="gun-hand" d="M457 276 Q432 296 430 344 L463 377 L492 348 L485 301 Z" />
                <path className="gun-hand" d="M570 367 Q547 386 556 428 L593 455 L619 424 L607 383 Z" />
              </g>
            )}

            {weapon === "sniper" && (
              <g className="gun-drawing gun-drawing--sniper">
                <path className="gun-line" d="M330 102 L245 24" />
                <path className="gun-line gun-line--thin" d="M342 110 L259 34" />
                <circle className="gun-dot" cx="245" cy="24" r="5" />
                <path className="gun-fill" d="M332 102 L363 91 L633 365 L603 400 L348 145 Z" />
                <path className="gun-fill gun-hatch" d="M386 145 L483 239 L450 272 L358 177 Z" />
                <path className="gun-fill" d="M474 248 L547 317 L516 351 L445 281 Z" />
                <path className="gun-fill gun-hatch" d="M540 327 L707 466 L677 492 L509 360 Z" />
                <g className="sniper-scope" transform="translate(370 154) rotate(42)">
                  <rect className="gun-fill" x="-78" y="-25" width="156" height="50" rx="16" />
                  <circle className="gun-fill" cx="-69" cy="0" r="31" />
                  <circle className="gun-line-only" cx="-69" cy="0" r="19" />
                  <circle className="gun-fill" cx="69" cy="0" r="37" />
                  <circle className="gun-line-only" cx="69" cy="0" r="23" />
                  <path className="gun-line gun-line--thin" d="M-15 -26 V-47 M18 -26 V-47" />
                </g>
                <path className="gun-line gun-line--thin" d="M468 256 L503 227" />
                <path className="gun-line gun-line--thin" d="M498 228 L517 231" />
                <path className="gun-hand" d="M452 279 Q428 300 428 347 L461 379 L491 349 L484 303 Z" />
                <path className="gun-hand" d="M566 365 Q545 384 554 428 L589 456 L616 425 L604 382 Z" />
              </g>
            )}

            <g className="muzzle-spark">
              <path d="M250 30 l-20 -18 M250 30 l-4 -26 M250 30 l18 -18 M250 30 l25 4" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
