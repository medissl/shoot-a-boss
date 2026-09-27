import { useEffect, useState } from "react";
import { TARGET_COUNT, WEAPONS, type WeaponId } from "../game/config";
import { useGameStore } from "../game/store";

const WEAPON_ORDER: WeaponId[] = ["sniper", "rifle", "shotgun"];

export function HUD() {
  const hp = useGameStore((state) => state.hp);
  const weapon = useGameStore((state) => state.weapon);
  const ammo = useGameStore((state) => state.ammo);
  const grenades = useGameStore((state) => state.grenades);
  const eliminated = useGameStore((state) => state.eliminated.length);
  const scoped = useGameStore((state) => state.scoped);
  const boostActive = useGameStore((state) => state.speedBoostActive);
  const [pickupNotice, setPickupNotice] = useState("");

  useEffect(() => {
    const handler = (event: Event) => {
      const kind = (event as CustomEvent<{ kind: "grenade" | "speed" }>).detail.kind;
      setPickupNotice(kind === "grenade" ? "+ PAPER BOMBS" : "+ SPEED BOOST");
      window.setTimeout(() => setPickupNotice(""), 1450);
    };
    window.addEventListener("pickup-collected", handler as EventListener);
    return () => window.removeEventListener("pickup-collected", handler as EventListener);
  }, []);

  return (
    <div className="hud" aria-hidden="true">
      <div className="hud-targets">
        <span>targets left</span>
        <strong>{TARGET_COUNT - eliminated}</strong>
      </div>

      <div className="hud-health">
        <span>HP</span>
        <div className="health-track">
          <div style={{ width: `${hp}%` }} />
        </div>
        <strong>{hp}</strong>
      </div>

      <div className="hud-ammo-main">
        <strong>{ammo[weapon].mag}</strong>
        <span>/ {ammo[weapon].reserve}</span>
      </div>

      <div className="hud-weapons">
        <div className="hud-grenade-line">
          <span>paper bombs</span>
          <b>{Array.from({ length: grenades }, () => "○").join(" ") || "—"}</b>
        </div>
        {WEAPON_ORDER.map((id, index) => (
          <div className={id === weapon ? "hud-weapon-row is-active" : "hud-weapon-row"} key={id}>
            <span>{index + 1}</span>
            <b>{WEAPONS[id].label.replace("PAPER ", "").replace("REPORT ", "").replace("STAPLE ", "")}</b>
            <small>{ammo[id].mag}/{ammo[id].reserve}</small>
          </div>
        ))}
      </div>

      <div className="doodle-crosshair">
        <span className="crosshair-line crosshair-line--top" />
        <span className="crosshair-line crosshair-line--right" />
        <span className="crosshair-line crosshair-line--bottom" />
        <span className="crosshair-line crosshair-line--left" />
        <i />
      </div>

      {scoped && (
        <div className={`scope-overlay scope-overlay--${weapon}`}>
          <div className="scope-ring" />
          <span className="scope-axis scope-axis--x" />
          <span className="scope-axis scope-axis--y" />
        </div>
      )}

      {boostActive && <div className="boost-status">SPEED ×1.48</div>}
      {pickupNotice && <div className="pickup-notice">{pickupNotice}</div>}
    </div>
  );
}
