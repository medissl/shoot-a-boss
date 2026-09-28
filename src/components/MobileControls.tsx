import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Crosshair, Eye, Footprints, Pause, PersonStanding, RotateCcw, ScanSearch, Target, Zap, Sparkles } from "lucide-react";
import { touchInput, useTouchMode } from "../game/touch";
import { useGameStore } from "../game/store";
import type { WeaponId } from "../game/config";

function input(kind: "fire" | "aim" | string, down: boolean) {
  if (kind === "fire" || kind === "aim") {
    window.dispatchEvent(new MouseEvent(down ? "mousedown" : "mouseup", { button: kind === "fire" ? 0 : 2 }));
  } else window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { code: kind, bubbles: true }));
}

function look(dx: number, dy: number) {
  window.dispatchEvent(new CustomEvent("touch-look", { detail: { dx, dy } }));
}

function ActionButton({ kind, label, children, className = "" }: { kind: string; label: string; children: ReactNode; className?: string }) {
  const pointer = useRef<number | null>(null);
  useEffect(() => () => { if (pointer.current !== null) input(kind, false); }, [kind]);
  const release = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    input(kind, false);
  };
  return <button type="button" aria-label={label} className={`touch-button ${className}`} onPointerDown={(event) => {
    event.preventDefault(); event.stopPropagation();
    if (pointer.current !== null) return;
    pointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    input(kind, true);
  }} onPointerUp={release} onPointerCancel={release}>{children}</button>;
}

function MovementPad() {
  const pointer = useRef<number | null>(null);
  const pressedAt = useRef(0);
  const [locked, setLocked] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  useEffect(() => () => { touchInput.x = 0; touchInput.y = 0; touchInput.sprint = false; }, []);
  const reset = () => {
    pointer.current = null;
    touchInput.x = 0; touchInput.y = 0; touchInput.sprint = false;
    setLocked(false); setPosition({ x: 0, y: 0 });
  };
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) * 0.34;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    if (dy < -radius * 1.48 && performance.now() - pressedAt.current > 300) {
      setLocked(true);
      touchInput.x = 0; touchInput.y = -1; touchInput.sprint = true;
      setPosition({ x: 0, y: -radius });
      return;
    }
    const factor = Math.min(1, radius / Math.max(1, Math.hypot(dx, dy)));
    const x = Math.abs(dx * factor / radius) < 0.1 ? 0 : dx * factor / radius;
    const y = Math.abs(dy * factor / radius) < 0.1 ? 0 : dy * factor / radius;
    touchInput.x = x; touchInput.y = y; touchInput.sprint = false;
    setPosition({ x: x * radius, y: y * radius });
  };
  return <div className={`touch-joystick ${locked ? "is-running" : ""}`} role="group" aria-label="Movement pad, swipe upward to lock run" onPointerDown={(event) => {
    event.preventDefault(); event.stopPropagation();
    if (pointer.current !== null) return;
    if (locked) reset();
    pointer.current = event.pointerId;
    pressedAt.current = performance.now();
    event.currentTarget.setPointerCapture(event.pointerId);
    move(event);
  }} onPointerMove={move} onPointerUp={(event) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    if (!touchInput.sprint) reset();
  }} onPointerCancel={(event) => { if (pointer.current === event.pointerId) reset(); }}>
    <span className="touch-run-lock"><Footprints size={14} /> {locked ? "RUNNING · TAP TO STOP" : "SWIPE UP TO RUN"}</span>
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
    look(event.clientX - last.current.x, event.clientY - last.current.y);
    last.current = { x: event.clientX, y: event.clientY };
  }} onPointerUp={(event) => { if (pointer.current === event.pointerId) pointer.current = null; }} onPointerCancel={(event) => { if (pointer.current === event.pointerId) pointer.current = null; }} />;
}

function FireButton({ weapon }: { weapon: WeaponId }) {
  const pointer = useRef<number | null>(null);
  const start = useRef(0);
  const last = useRef({ x: 0, y: 0 });
  const autoAim = useRef(false);
  const pending = useRef<number | null>(null);
  useEffect(() => () => {
    if (pending.current !== null) window.clearTimeout(pending.current);
    if (pointer.current !== null && weapon !== "sniper") input("fire", false);
    if (autoAim.current) input("aim", false);
  }, [weapon]);
  const release = (event: ReactPointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    event.preventDefault();
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    if (weapon !== "sniper") { input("fire", false); return; }
    if (cancelled) { if (autoAim.current) input("aim", false); autoAim.current = false; return; }
    const delay = Math.max(0, 400 - (performance.now() - start.current));
    pending.current = window.setTimeout(() => {
      if (useGameStore.getState().screen === "playing" && useGameStore.getState().weapon === "sniper") {
        input("fire", true); input("fire", false);
      }
      if (autoAim.current) input("aim", false);
      autoAim.current = false;
      pending.current = null;
    }, delay);
  };
  return <button type="button" className="touch-button touch-fire" aria-label={weapon === "sniper" ? "Hold to aim sniper, release to fire" : "Hold and drag to fire and aim"} onPointerDown={(event) => {
    event.preventDefault(); event.stopPropagation();
    if (pointer.current !== null) return;
    if (pending.current !== null) { window.clearTimeout(pending.current); pending.current = null; }
    pointer.current = event.pointerId;
    start.current = performance.now();
    last.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (weapon === "sniper") {
      autoAim.current = !useGameStore.getState().scoped;
      if (autoAim.current) input("aim", true);
    } else input("fire", true);
  }} onPointerMove={(event) => {
    if (pointer.current !== event.pointerId) return;
    look(event.clientX - last.current.x, event.clientY - last.current.y);
    last.current = { x: event.clientX, y: event.clientY };
  }} onPointerUp={(event) => release(event, false)} onPointerCancel={(event) => release(event, true)}><Crosshair size={24} strokeWidth={2.5} /><span>{weapon === "sniper" ? "RELEASE" : "FIRE"}</span></button>;
}

function ScopeButton({ scoped, weapon }: { scoped: boolean; weapon: WeaponId }) {
  return <button type="button" className={`touch-button touch-scope ${scoped ? "is-active" : ""}`} aria-label={scoped ? "Turn scope off" : "Turn scope on"} disabled={weapon === "knife"} onPointerDown={(event) => {
    event.preventDefault(); event.stopPropagation();
    input("aim", !useGameStore.getState().scoped);
  }}><Target size={23} /><span>SCOPE</span></button>;
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
  const scoped = useGameStore((s) => s.scoped);
  const setWeapon = useGameStore((s) => s.setWeapon);
  const pause = useGameStore((s) => s.pause);
  const magic = useGameStore((s) => s.selectedMagic);
  if (!touch || screen !== "playing" || tutorialOpen) return null;

  return <div className="mobile-controls">
    <LookPad />
    <MovementPad />
    <FireButton weapon={weapon} />
    <ActionButton kind="KeyF" label={`Cast ${magic ?? "magic"}`} className="touch-magic"><Sparkles size={20}/><span>MAGIC</span></ActionButton>
    <ScopeButton scoped={scoped} weapon={weapon} />
    <ActionButton kind="Space" label="Jump" className="touch-jump"><PersonStanding size={23} /><span>JUMP</span></ActionButton>
    <ActionButton kind="KeyC" label="Slide and crouch" className="touch-slide"><Footprints size={21} /><span>SLIDE</span></ActionButton>
    <div className="touch-utility">
      <ActionButton kind="KeyG" label="Paper bomb"><Zap size={17} /><span>BOMB</span></ActionButton>
      <ActionButton kind="KeyR" label="Reload"><RotateCcw size={17} /><span>RELOAD</span></ActionButton>
      <ActionButton kind="KeyQ" label="Mark enemy"><Eye size={17} /><span>MARK</span></ActionButton>
      <ActionButton kind="KeyE" label="Use zipline"><ScanSearch size={17} /><span>ZIP</span></ActionButton>
    </div>
    <div className="touch-weapons" role="group" aria-label="Choose weapon">{weapons.map(({ id, name }) =>
      <button key={id} type="button" className={weapon === id ? "is-active" : ""} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); setWeapon(id); }}>{name}</button>,
    )}</div>
    <button type="button" className="touch-pause" onPointerDown={(event) => { event.preventDefault(); pause(); }} aria-label="Pause game"><Pause size={19} /></button>
    <span className="touch-rotate-hint">↻ LANDSCAPE FOR THE BEST VIEW</span>
  </div>;
}
