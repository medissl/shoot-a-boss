import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { WEAPONS, type WeaponId } from "../game/config";
import { getLevelDefinition } from "../game/levels";
import { UPGRADE_CARDS } from "../game/progression";
import { equippedGearRank, xpToNextLevel, useGameStore } from "../game/store";
import { getSkin } from "../game/skins";

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
  const guardHp = useGameStore((state) => state.guardHp);
  const weapon = useGameStore((state) => state.weapon);
  const ammo = useGameStore((state) => state.ammo);
  const grenades = useGameStore((state) => state.grenades);
  const eliminated = useGameStore((state) => state.eliminated.length);
  const targetCount = useGameStore((state) => state.targetCount);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const scoped = useGameStore((state) => state.scoped);
  const equippedSkin = useGameStore((state) => state.equippedSkins[state.weapon]);
  const scopeTheme = getSkin(equippedSkin);
  const boostActive = useGameStore((state) => state.speedBoostActive);
  const reloading = useGameStore((state) => state.reloading);
  const reloadingWeapon = useGameStore((state) => state.reloadingWeapon);
  const reloadDurationMs = useGameStore((state) => state.reloadDurationMs);
  const hearts = useGameStore((state) => state.hearts);
  const ngPlusCycle = useGameStore((state) => state.ngPlusCycle);
  const scanTargets = useGameStore((state) => state.scanTargets);
  const scanCooldownUntil = useGameStore((state) => state.scanCooldownUntil);
  const upgrades = useGameStore((state) => state.upgrades);
  const coins = useGameStore((state) => state.coins);
  const playerLevel = useGameStore((state) => state.playerLevel);
  const xp = useGameStore((state) => state.xp);
  const skillPoints = useGameStore((state) => state.skillPoints);
  const shieldCharges = useGameStore((state) => state.shieldCharges);
  const shieldReadyAt = useGameStore((state) => state.shieldReadyAt);
  const selectedMagic = useGameStore((state) => state.selectedMagic);
  const magicReadyAt = useGameStore((state) => state.magicReadyAt);
  const magic = useGameStore((state) => state.magic);
  const fullReport = useGameStore((state) => equippedGearRank(state, "lens") >= 5);
  const evolutions = useGameStore((state) => state.evolutions);
  const crunchUntil = useGameStore((state) => state.crunchUntil);
  const paperTrailUntil = useGameStore((state) => state.paperTrailUntil);
  const [now, setNow] = useState(() => performance.now());
  const [pickupNotice, setPickupNotice] = useState("");
  const [emptyAlert, setEmptyAlert] = useState(false);
  const [hazardNotice, setHazardNotice] = useState("");
  const [procNotice, setProcNotice] = useState<{ label: string; detail: string } | null>(null);
  const [damageFlashKey, setDamageFlashKey] = useState(0);
  const [damageDirection, setDamageDirection] = useState("front");
  const [scanDirections, setScanDirections] = useState<{ id: string; edge: string; offset: number; distance: number; vertical: string; scan: boolean }[]>([]);
  const [killPulseKey, setKillPulseKey] = useState(0);
  const emptyTimer = useRef<number | null>(null);
  const level = getLevelDefinition(currentLevel);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(performance.now()), 300);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const pickupHandler = (event: Event) => {
      const kind = (event as CustomEvent<{ kind: "grenade" | "speed" | "health" | "ammo" }>).detail.kind;
      setPickupNotice(({ grenade: "+ PAPER BOMB", speed: "+ SPEED BOOST", health: "+ HEALTH", ammo: "+ AMMO" })[kind]);
      window.setTimeout(() => setPickupNotice(""), 1450);
    };

    const emptyHandler = () => {
      setEmptyAlert(true);
      if (emptyTimer.current) window.clearTimeout(emptyTimer.current);
      emptyTimer.current = window.setTimeout(() => setEmptyAlert(false), 1450);
    };

    const damageHandler = (event: Event) => {
      const source = (event as CustomEvent<{ source?: [number, number, number] }>).detail.source;
      if (source) {
        const { playerPosition: [px, , pz], playerYaw: yaw } = useGameStore.getState();
        const dx = source[0] - px;
        const dz = source[2] - pz;
        const forward = -dx * Math.sin(yaw) - dz * Math.cos(yaw);
        const right = dx * Math.cos(yaw) - dz * Math.sin(yaw);
        setDamageDirection(Math.abs(right) > Math.abs(forward) ? right > 0 ? "right" : "left" : forward > 0 ? "front" : "back");
      } else setDamageDirection("front");
      setDamageFlashKey((current) => current + 1);
    };
    const scanHandler = (event: Event) => setScanDirections((event as CustomEvent<{ id: string; edge: string; offset: number; distance: number; vertical: string; scan: boolean }[]>).detail);
    const killHandler = () => setKillPulseKey((current) => current + 1);
    const hazardHandler = (event: Event) => setHazardNotice((event as CustomEvent<{ message: string }>).detail.message);
    let procTimer = 0;
    const procHandler = (event: Event) => {
      setProcNotice((event as CustomEvent<{ label: string; detail: string }>).detail);
      clearTimeout(procTimer);
      procTimer = window.setTimeout(() => setProcNotice(null), 1100);
    };

    window.addEventListener("pickup-collected", pickupHandler as EventListener);
    window.addEventListener("empty-mag", emptyHandler);
    window.addEventListener("player-damaged", damageHandler);
    window.addEventListener("boss-killed", killHandler);
    window.addEventListener("map-hazard-notice", hazardHandler);
    window.addEventListener("scan-directions", scanHandler);
    window.addEventListener("card-proc", procHandler);

    return () => {
      if (emptyTimer.current) window.clearTimeout(emptyTimer.current);
      window.removeEventListener("pickup-collected", pickupHandler as EventListener);
      window.removeEventListener("empty-mag", emptyHandler);
      window.removeEventListener("player-damaged", damageHandler);
      window.removeEventListener("boss-killed", killHandler);
      window.removeEventListener("map-hazard-notice", hazardHandler);
      window.removeEventListener("scan-directions", scanHandler);
      window.removeEventListener("card-proc", procHandler);
      clearTimeout(procTimer);
    };
  }, []);

  const reloadStyle = {
    "--reload-duration": `${reloadDurationMs}ms`,
  } as CSSProperties;

  return (
    <div className="hud" aria-hidden="true">
      <div className="hud-level">
        <span>{ngPlusCycle ? `NG+ ${ngPlusCycle} · ` : ""}LEVEL {currentLevel}/10</span>
        <strong>{level.name}</strong>
        <div className="hud-xp"><span>LV {playerLevel} · {xp}/{xpToNextLevel(playerLevel)} XP · {skillPoints} SP</span><i><b style={{ width: `${Math.min(100, xp / xpToNextLevel(playerLevel) * 100)}%` }} /></i></div>
        <span className="hud-hearts" aria-label={`${hearts} hearts remaining`}>
          {Array.from({ length: 5 }, (_, index) => <b key={index} className={index < hearts ? "is-full" : ""}>{index < hearts ? "♥" : "♡"}</b>)}
        </span>
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
      {now < crunchUntil && <div className="evolution-hud">✳ CRUNCH TIME · {Math.ceil((crunchUntil - now) / 1000)}S</div>}
      {now < paperTrailUntil && <div className="evolution-hud">╱ PAPER TRAIL · {Math.ceil((paperTrailUntil - now) / 1000)}S</div>}
      {evolutions.length > 0 && <div className="hud-evolution-count">✳ {evolutions.length} EVOLUTION{evolutions.length === 1 ? "" : "S"}</div>}
      {selectedMagic && <div className="hud-magic"><span>F · {selectedMagic.toUpperCase()} LV {magic[selectedMagic]}</span><strong>{now < magicReadyAt ? `${Math.ceil((magicReadyAt - now)/1000)}s` : "READY ✦"}</strong></div>}

      <div className="hud-health">
        <span>HP</span>
        <div className="health-track">
          <div style={{ width: `${Math.min(100, (hp / maxHp) * 100)}%` }} />
        </div>
        <strong>{Math.round(hp)}</strong>
        {guardHp > 0 && <small>+{Math.round(guardHp)} GUARD</small>}
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
      <div className="hud-owned-cards">
        <span>YOUR CARDS · {UPGRADE_CARDS.reduce((sum, card) => sum + upgrades[card.id], 0)}</span>
        <div className="hud-owned-cards__list">{UPGRADE_CARDS.filter((card) => upgrades[card.id] > 0).map((card) =>
          <div key={card.id} className={`hud-card rarity--${card.rarity}`} title={card.description}>
            <b>{card.glyph}</b><span>{card.name}</span>{upgrades[card.id] > 1 && <small>×{upgrades[card.id]}</small>}
          </div>)}</div>
        <small>ESC · CARD INVENTORY FOR DETAILS</small>
      </div>
      <div className="hud-scan">Q · {scanTargets.length ? `MARKED ${scanTargets.length}` : scanCooldownUntil > now ? `RECHARGE ${Math.ceil((scanCooldownUntil - now) / 1000)}S` : "MARK ENEMY"}</div>
      <div className="hud-coins"><span className="doodle-coin" aria-hidden="true">◉</span> {coins} COINS</div>
      {Boolean(shieldCharges > 0 || upgrades.shieldOrbit) && <div className="hud-shield">⬡ SHIELD {shieldCharges > 0 ? `×${shieldCharges}` : now < shieldReadyAt ? `${Math.ceil((shieldReadyAt - now) / 1000)}S` : "READY"}</div>}
      {scanDirections.map((mark) => <div key={mark.id} className={`scan-edge scan-edge--${mark.edge} ${mark.scan ? "" : "scan-edge--passive"}`} style={{ "--edge-offset": `${mark.offset}px` } as CSSProperties}>{mark.scan ? "◆" : "➤"}<small>{mark.scan ? "TARGET" : "NEAREST"} {mark.vertical} {mark.distance}M{fullReport ? " · LIVE" : ""}</small></div>)}

      {!scoped && (
        <div className="doodle-crosshair">
          <span className="crosshair-line crosshair-line--top" />
          <span className="crosshair-line crosshair-line--right" />
          <span className="crosshair-line crosshair-line--bottom" />
          <span className="crosshair-line crosshair-line--left" />
          <i />
        </div>
      )}

      {scoped && weapon !== "knife" && (
        <div
          className={`scope-overlay scope-overlay--${weapon} ${scopeTheme ? `scope-overlay--themed scope-overlay--${scopeTheme.rarity} scope-overlay--${scopeTheme.motif}` : ""}`}
          style={scopeTheme ? { "--scope-color": scopeTheme.color, "--scope-accent": scopeTheme.accent } as CSSProperties : undefined}
          aria-hidden="true"
        >
          <div className="scope-ring" />
          {scopeTheme && <div className="scope-theme-rim"><i/><i/><i/><i/><b>{scopeTheme.name.toUpperCase()}</b></div>}
          {weapon === "sniper" && <>
            <span className="scope-axis scope-axis--x" />
            <span className="scope-axis scope-axis--y" />
          </>}
          <span className="scope-reticle" />
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
      {hazardNotice && <div className="hazard-notice">⚠ {hazardNotice}</div>}
      {procNotice && <div className="card-proc-notice">✳ {procNotice.label}<small>{procNotice.detail}</small></div>}

      {emptyAlert && (
        <div className="empty-mag-message">
          MAGAZINE EMPTY
          <span>press R to reload</span>
        </div>
      )}

      {damageFlashKey > 0 && (
        <div key={damageFlashKey} className={`player-damage-vignette damage-from--${damageDirection}`}><span>{damageDirection.toUpperCase()} · HIT</span></div>
      )}
    </div>
  );
}
