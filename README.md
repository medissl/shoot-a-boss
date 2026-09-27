# Shoot a Boss

A tiny browser FPS where an exhausted office worker falls asleep at their desk and dreams of escaping a surreal paper-built office arena filled with ten copies of their cartoon boss.

The game is intentionally bloodless and comic-like: doodle weapons, paper grenades, exaggerated boss mannequins, hard ink outlines, and a six-panel opening story built directly in HTML/CSS.

## Current features

- Six-panel comic-style opening sequence
- First-person pointer-lock camera
- Closed procedural 3D arena
- 10 boss copies with runner / brawler behavior
- Paper Sniper, Report Rifle, and Staple Shotgun
- Right-click shooting and hold-left aiming
- Reloading and ammo reserves
- Paper grenade on `G`
- WASD movement + jump
- Hold Shift to run
- `C` to crouch or slide while moving
- Crouch/slide → jump momentum boost
- HP / ammo / grenade / target HUD
- Pause / restart / controls / sensitivity menu
- Win and loss states
- No backend, database, accounts, or external 3D assets

## Controls

| Input | Action |
| --- | --- |
| WASD | Move |
| Shift | Run |
| C | Crouch / slide |
| C → Space | Velocity boost jump |
| Space | Jump |
| Mouse | Look |
| Right click | Shoot |
| Hold left click | Scope / aim |
| 1 / 2 / 3 | Switch weapon |
| Mouse wheel | Cycle weapon |
| R | Reload |
| G | Throw paper grenade |
| ESC | Pause |

## Stack

- Vite
- React 19
- TypeScript
- Three.js / React Three Fiber
- Drei
- Rapier physics
- Zustand
- Vercel

## Local development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

## Design notes

See [`GAME_DESIGN.md`](./GAME_DESIGN.md) for the narrative, controls, map design, movement system, weapons, AI, and development plan.
