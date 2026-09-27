import { useGameStore } from "../game/store";

export function WeaponView() {
  const weapon = useGameStore((state) => state.weapon);
  const scoped = useGameStore((state) => state.scoped);

  return (
    <div className={`weapon-view weapon-view--${weapon} ${scoped ? "is-scoped" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 360 180" role="presentation">
        {weapon === "sniper" && (
          <>
            <path d="M38 115 L225 98 L315 118 L285 138 L172 126 L92 145 Z" />
            <path d="M125 98 L235 82 L250 95 L130 112 Z" />
            <circle cx="192" cy="79" r="18" />
            <path d="M192 61 L192 39 M172 79 L150 79 M212 79 L234 79" />
          </>
        )}
        {weapon === "rifle" && (
          <>
            <path d="M42 119 L217 88 L327 105 L307 129 L214 122 L101 148 Z" />
            <path d="M168 119 L190 164 L219 160 L210 119 Z" />
            <path d="M235 101 L286 84" />
          </>
        )}
        {weapon === "shotgun" && (
          <>
            <path d="M39 122 L240 96 L325 111 L309 132 L219 128 L82 149 Z" />
            <path d="M208 101 L300 88" />
            <path d="M143 112 L164 151 L195 149 L187 106 Z" />
          </>
        )}
      </svg>
    </div>
  );
}
