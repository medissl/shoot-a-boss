import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { touchInput, useTouchMode } from "../game/touch";
import { useGameStore } from "../game/store";
import type { WeaponId } from "../game/config";

function fireInput(kind: "fire" | "aim" | string, down: boolean) {
  if (kind === "fire" || kind === "aim") {
    window.dispatchEvent(new MouseEvent(down ? "mousedown" : "mouseup", { button: kind === "fire" ? 0 : 2 }));
    return;
  }
  window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { code: kind, bubbles: true }));
}

function HoldButton({ kind, label, className = "" }: { kind: string; label: string; className?: string }) {
  const pointer = useRef<number | null>(null);
  useEffect(() => () => {
    if (pointer.current !== null) fireInput(kind, false);
  }, [kind]);
  const down = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (pointer.current !== null) return;
    pointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    fireInput(kind, true);
  };
  const up = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    fireInput(kind, false);
  };
  return <button type="button" className={`touch-button ${className}`} aria-label={label} onPointerDown={down} onPointerUp={up} onPointerCancel={up}>{label}</button>;
}

function MovementPad() {
  const pointer = useRef<number | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  useEffect(() => () => { touchInput.x = 0; touchInput.y = 0; }, []);
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) * 0.36;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const factor = Math.min(1, radius / Math.max(1, Math.hypot(dx, dy)));
    let x = dx * factor / radius;
    let y = dy * factor / radius;
    if (Math.hypot(x, y) < 0.12) { x = 0; y = 0; }
    touchInput.x = x;
    touchInput.y = y;
    setPosition({ x: x * radius, y: y * radius });
  };
  const release = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    touchInput.x = 0;
    touchInput.y = 0;
    setPosition({ x: 0, y: 0 });
  };
  return <div className="touch-joystick" role="group" aria-label="Analog movement pad" onPointerDown={(event) => {
    event.preventDefault();
    event.stopPropagation();
    if (pointer.current !== null) return;
    pointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    move(event);
  }} onPointerMove={move} onPointerUp={release} onPointerCancel={release}>
    <span className="touch-joystick__label">MOVE</span>
    <span className="touch-joystick__knob" style={{ transform: `translate(${position.x}px, ${position.y}px)` }} />
  </div>;
}

function LookPad() {
  const pointer = useRef<number | null>(null);
  const last = useRef({ x: 0, y: 0 });
  return <div className="touch-look-pad" aria-label="Swipe to look around" onPointerDown={(event) => {
    event.preventDefault();
    if (pointer.current !== null) return;
    pointer.current = event.pointerId;
    last.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }} onPointerMove={(event) => {
    if (pointer.current !== event.pointerId) return;
    const dx = event.clientX - last.current.x;
    const dy = event.clientY - last.current.y;
    last.current = { x: event.clientX, y: event.clientY };
    window.dispatchEvent(new CustomEvent("touch-look", { detail: { dx, dy } }));
  }} onPointerUp={(event) => { if (pointer.current === event.pointerId) pointer.current = null; }} onPointerCancel={(event) => { if (pointer.current === event.pointerId) pointer.current = null; }} />;
}

const weapons: { id: WeaponId; name: string }[] = [
  { id: "sniper", name: "SNIPER" }, { id: "rifle", name: "RIFLE" },
  { id: "shotgun", name: "SHOTGUN" }, { id: "knife", name: "KNIFE" },
];

export function MobileControls() {
  const touch = useTouchMode();
  const screen = useGameStore((s) => s.screen);
  const tutorialOpen = useGameStore((s) => s.tutorialOpen);
  const weapon = useGameStore((s) => s.weapon);
  const setWeapon = useGameStore((s) => s.setWeapon);
  const pause = useGameStore((s) => s.pause);
  if (!touch || screen !== "playing" || tutorialOpen) return null;

  return <div className="mobile-controls">
    <LookPad />
    <MovementPad />
    <div className="touch-actions">
      <HoldButton kind="fire" label="FIRE" className="touch-fire" />
      <HoldButton kind="aim" label="AIM" />
      <HoldButton kind="Space" label="JUMP" />
      <HoldButton kind="KeyC" label="SLIDE" />
      <HoldButton kind="KeyG" label="BOMB" />
      <HoldButton kind="KeyR" label="RELOAD" />
      <HoldButton kind="KeyQ" label="MARK" />
      <HoldButton kind="KeyE" label="ZIP" />
      <HoldButton kind="ShiftLeft" label="RUN" />
    </div>
    <div className="touch-weapons" role="group" aria-label="Choose weapon">{weapons.map(({ id, name }) =>
      <button key={id} type="button" className={weapon === id ? "is-active" : ""} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); setWeapon(id); }}>{name}</button>,
    )}</div>
    <button type="button" className="touch-pause" onPointerDown={(event) => { event.preventDefault(); pause(); }} aria-label="Pause game">Ⅱ</button>
    <span className="touch-look-hint">SWIPE TO LOOK</span>
    <span className="touch-rotate-hint">↻ LANDSCAPE FEELS BETTER</span>
  </div>;
}
