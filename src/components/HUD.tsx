import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { WEAPONS, type WeaponId } from "../game/config";
import { getLevelDefinition } from "../game/levels";
import { useGameStore } from "../game/store";

const WEAPON_ORDER: WeaponId[] = ["sniper", "rifle", "shotgun", "knife"];

function shortWeaponLabel(id: WeaponId) {
  return WEAPONS[id].label
    .replace("PAPER ", "")
    .replace("REPORT ", "")
    .replace("STAPLE ", "");
}

export function HUD() {
  const hp = useGameStore((state) => state.hp);
  const maxHp = useGameStore((state) => state.maxHp);
  const weapon = useGameStore((state) => state.weapon);
  const ammo = useGameStore((state) => state.ammo);
  const grenades = useGameStore((state) => state.grenades);
  const eliminated = useGameStore((state) => state.eliminated.length);
  const targetCount = useGameStore((state) => state.targetCount);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const scoped = useGameStore((state) => state.scoped);
  const boostActive = useGameStore((state) => state.speedBoostActive);
  const reloading = useGameStore((state) => state.reloading);
  const reloadingWeapon = useGameStore((state) => state.reloadingWeapon);
  const reloadDurationMs = useGameStore((state) => state.reloadDurationMs);
  const [pickupNotice, setPickupNotice] = useState("");
  const [emptyAlert, setEmptyAlert] = useState(false);
  const [damageFlashKey, setDamageFlashKey] = useState(0);
  const [killPulseKey, setKillPulseKey] = useState(0);
  const emptyTimer = useRef<number | null>(null);
  const level = getLevelDefinition(currentLevel);

  useEffect(() => {
    const pickupHandler = (event: Event) => {
      const kind = (event as CustomEvent<{ kind: "grenade" | "speed" }>).detail.kind;
      setPickupNotice(kind === "grenade" ? "+ PAPER BOMBS" : "+ SPEED BOOST");
      window.setTimeout(() => setPickupNotice(""), 1450);
    };

    const emptyHandler = () => {
      setEmptyAlert(true);
      if (emptyTimer.current) window.clearTimeout(emptyTimer.current);
      emptyTimer.current = window.setTimeout(() => setEmptyAlert(false), 1450);
    };

    const damageHandler = () => setDamageFlashKey((current) => current + 1);
    const killHandler = () => setKillPulseKey((current) => current + 1);

    window.addEventListener("pickup-collected", pickupHandler as EventListener);
    window.addEventListener("empty-mag", emptyHandler);
    window.addEventListener("player-damaged", damageHandler);
    window.addEventListener("boss-killed", killHandler);

    return () => {
      if (emptyTimer.current) window.clearTimeout(emptyTimer.current);
      window.removeEventListener("pickup-collected", pickupHandler as EventListener);
      window.removeEventListener("empty-mag", emptyHandler);
      window.removeEventListener("player-damaged", damageHandler);
      window.removeEventListener("boss-killed", killHandler);
    };
  }, []);

  const reloadStyle = {
    "--reload-duration": `${reloadDurationMs}ms`,
  } as CSSProperties;

  return (
    <div className="hud" aria-hidden="true">
      <div className="hud-level">
        <span>LEVEL {currentLevel}/10</span>
        <strong>{level.name}</strong>
      </div>

      {eliminated > 0 && (
        <div
          key={`${eliminated}-${killPulseKey}`}
          className={`kill-combo ${eliminated > 5 ? "is-overdrive" : ""}`}
        >
          <span>{eliminated > 5 ? "INK RAMPAGE" : "KILL COMBO"}</span>
          <strong>×{eliminated}</strong>
        </div>
      )}

      <div className="hud-targets">
        <span>targets left</span>
        <strong>{Math.max(0, targetCount - eliminated)}</strong>
      </div>

      <div className="hud-health">
        <span>HP</span>
        <div className="health-track">
          <div style={{ width: `${Math.min(100, (hp / maxHp) * 100)}%` }} />
        </div>
        <strong>{Math.round(hp)}</strong>
      </div>

      <div className="hud-ammo-main">
        {weapon === "knife" ? (
          <>
            <strong>∞</strong>
            <span> / MELEE</span>
          </>
        ) : (
          <>
            <strong>{ammo[weapon].mag}</strong>
            <span>/ {ammo[weapon].reserve}</span>
          </>
        )}
      </div>

      <div className="hud-weapons">
        <div className="hud-grenade-line">
          <span>paper bombs</span>
          <b>{Array.from({ length: grenades }, () => "○").join(" ") || "—"}</b>
        </div>
        {WEAPON_ORDER.map((id, index) => (
          <div
            className={id === weapon ? "hud-weapon-row is-active" : "hud-weapon-row"}
            key={id}
          >
            <span>{index + 1}</span>
            <b>{shortWeaponLabel(id)}</b>
            <small>
              {id === "knife" ? "MELEE" : `${ammo[id].mag}/${ammo[id].reserve}`}
            </small>
          </div>
        ))}
      </div>

      {!scoped && (
        <div className="doodle-crosshair">
          <span className="crosshair-line crosshair-line--top" />
          <span className="crosshair-line crosshair-line--right" />
          <span className="crosshair-line crosshair-line--bottom" />
          <span className="crosshair-line crosshair-line--left" />
          <i />
        </div>
      )}

      {scoped && weapon === "sniper" && (
        <div className="scope-overlay scope-overlay--sniper">
          <div className="scope-ring" />
          <span className="scope-axis scope-axis--x" />
          <span className="scope-axis scope-axis--y" />
        </div>
      )}

      {reloading && reloadingWeapon && reloadingWeapon !== "knife" && (
        <div className="reload-progress" style={reloadStyle}>
          <div className="reload-progress__label">
            reloading {shortWeaponLabel(reloadingWeapon).toLowerCase()}
          </div>
          <div className="reload-progress__track">
            <span />
          </div>
        </div>
      )}

      {boostActive && (
        <>
          <div className="speed-boost-vignette" />
          <div className="boost-status">SPEED BOOST</div>
        </>
      )}

      {pickupNotice && <div className="pickup-notice">{pickupNotice}</div>}

      {emptyAlert && (
        <div className="empty-mag-message">
          MAGAZINE EMPTY
          <span>press R to reload</span>
        </div>
      )}

      {damageFlashKey > 0 && (
        <div key={damageFlashKey} className="player-damage-vignette" />
      )}
    </div>
  );
}
