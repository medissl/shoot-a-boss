import { useEffect, useState } from "react";
import { useGameStore } from "../game/store";

export function WeaponView() {
  const weapon = useGameStore((state) => state.weapon);
  const scoped = useGameStore((state) => state.scoped);
  const [kick, setKick] = useState(false);

  useEffect(() => {
    const handler = () => {
      setKick(true);
      window.setTimeout(() => setKick(false), 75);
    };
    window.addEventListener("weapon-fired", handler);
    return () => window.removeEventListener("weapon-fired", handler);
  }, []);

  return (
    <div
      className={`weapon-view weapon-view--${weapon} ${scoped ? "is-scoped" : ""} ${kick ? "is-kicking" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 600 360" role="presentation">
        <defs>
          <pattern id="gun-hatch" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
            <line x1="0" y1="0" x2="0" y2="11" className="gun-hatch-line" />
          </pattern>
        </defs>

        {weapon === "sniper" && (
          <g className="gun-drawing">
            <path className="gun-fill gun-hatch" d="M294 64 L319 64 L349 182 L425 255 L391 284 L326 205 Z" />
            <path className="gun-fill" d="M290 55 L319 55 L324 203 L298 203 Z" />
            <path className="gun-fill" d="M303 205 L377 270 L353 302 L293 231 Z" />
            <path className="gun-fill" d="M351 280 L526 344 L558 322 L401 250 Z" />
            <path className="gun-line" d="M303 58 L303 18" />
            <path className="gun-line gun-line--thin" d="M289 19 L318 19" />
            <rect className="gun-fill" x="268" y="116" width="78" height="26" rx="7" transform="rotate(-3 307 129)" />
            <circle className="gun-fill" cx="308" cy="129" r="24" />
            <circle className="gun-line-only" cx="308" cy="129" r="12" />
            <path className="gun-line gun-line--thin" d="M308 104 V88 M308 170 V153 M283 129 H265 M351 129 H333" />
          </g>
        )}

        {weapon === "rifle" && (
          <g className="gun-drawing">
            <path className="gun-fill gun-hatch" d="M294 64 L321 64 L352 190 L431 266 L394 296 L322 210 Z" />
            <path className="gun-fill" d="M292 55 L320 55 L324 200 L299 201 Z" />
            <path className="gun-fill" d="M305 196 L402 265 L380 292 L299 224 Z" />
            <path className="gun-fill gun-hatch" d="M399 272 L538 340 L565 321 L432 250 Z" />
            <path className="gun-fill" d="M344 222 Q373 250 393 286 L366 303 Q335 266 319 233 Z" />
            <path className="gun-line" d="M305 62 V26" />
            <path className="gun-line gun-line--thin" d="M286 25 H324" />
            <path className="gun-line gun-line--thin" d="M289 78 H326" />
            <rect className="gun-fill" x="282" y="115" width="48" height="24" rx="5" />
            <path className="gun-line gun-line--thin" d="M294 115 V92 M319 115 V92" />
          </g>
        )}

        {weapon === "shotgun" && (
          <g className="gun-drawing">
            <path className="gun-fill" d="M286 67 L331 67 L338 212 L293 212 Z" />
            <path className="gun-line" d="M299 67 V25 M319 67 V25" />
            <path className="gun-line gun-line--thin" d="M287 24 H331" />
            <path className="gun-fill gun-hatch" d="M296 203 L387 271 L362 303 L287 232 Z" />
            <path className="gun-fill" d="M375 273 L529 344 L558 324 L414 258 Z" />
            <path className="gun-fill" d="M285 151 L342 151 L348 188 L280 188 Z" />
            <path className="gun-line gun-line--thin" d="M288 161 H340 M290 174 H342" />
          </g>
        )}
      </svg>
    </div>
  );
}
