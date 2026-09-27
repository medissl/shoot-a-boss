import { Crosshair } from "lucide-react";
import { TARGET_COUNT, WEAPONS } from "../game/config";
import { useGameStore } from "../game/store";

export function HUD() {
  const hp = useGameStore((state) => state.hp);
  const weapon = useGameStore((state) => state.weapon);
  const ammo = useGameStore((state) => state.ammo[weapon]);
  const grenades = useGameStore((state) => state.grenades);
  const eliminated = useGameStore((state) => state.eliminated.length);
  const scoped = useGameStore((state) => state.scoped);

  return (
    <div className="hud" aria-hidden="true">
      <div className="hud-targets">
        <span>BOSS COPIES</span>
        <strong>{TARGET_COUNT - eliminated}</strong>
      </div>

      <div className="hud-grenades">
        <span>G</span>
        <strong>{grenades}</strong>
        <small>paper bombs</small>
      </div>

      <div className={`crosshair ${scoped ? "is-scoped" : ""}`}>
        <Crosshair />
      </div>

      <div className="hud-health">
        <span>HP</span>
        <div className="health-track">
          <div style={{ width: `${hp}%` }} />
        </div>
        <strong>{hp}</strong>
      </div>

      <div className="hud-weapon">
        <span>{WEAPONS[weapon].label}</span>
        <strong>
          {ammo.mag}<small> / {ammo.reserve}</small>
        </strong>
      </div>
    </div>
  );
}
