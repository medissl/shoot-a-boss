# Shoot a Boss

A short browser FPS drawn like a blue-ink notebook sketch.

An exhausted office worker falls asleep at their desk after another impossible pile of paperwork lands in front of them. The website opens as a six-panel comic, blacks out, and drops straight into a surreal paper-office dream where ten cartoon boss copies are waiting.

The game is intentionally slapstick and bloodless. Everything is built from code: procedural 3D geometry, SVG/CSS comic art, Canvas-rendered 2D boss sprites, doodle weapon overlays, and paper-style UI.

## Current direction

- White paper / blue ballpoint visual system
- Six-panel animated comic intro
- Comic flows directly into gameplay — no main menu
- Closed procedural dream-office arena
- 10 billboard-style cartoon boss enemies
- Runner and brawler behavior
- Paper Sniper, Report Rifle, and Staple Shotgun
- Left click to shoot
- Hold right click to aim / scope
- Automatic rifle fire
- Visible bullet tracers
- Weapon-specific zoom, accuracy, spread, and falloff
- Paper grenade on `G`
- Grenade-refill and temporary speed-boost pickups
- Sprint, crouch, slide, and crouch-jump momentum boost
- Notebook-style HP / ammo / target / grenade HUD
- Pause overlay with resume, restart, and sensitivity only
- Win and loss states
- No backend, database, login, save system, or external 3D models

## Controls

| Input | Action |
| --- | --- |
| WASD | Move |
| Shift | Run |
| C | Crouch / slide while moving |
| C → Space | Momentum boost jump |
| Space | Jump |
| Mouse | Look |
| Left click | Shoot |
| Hold right click | Aim / scope |
| 1 / 2 / 3 | Sniper / Rifle / Shotgun |
| Mouse wheel | Cycle weapon |
| R | Reload |
| G | Throw paper grenade |
| ESC | Pause |

## Weapons

**Paper Sniper**
- heavy single-shot damage
- very strong zoom
- accurate while scoped
- deliberately unreliable when hip-fired

**Report Rifle**
- automatic fire
- medium damage
- light 2–3× aim zoom
- mild spread

**Staple Shotgun**
- 5 pellets per shot
- almost no zoom
- strongest up close
- wide spread and distance falloff

## Stack

- Vite
- React 19
- TypeScript
- Three.js / React Three Fiber
- Drei
- Rapier physics
- Zustand
- GitHub Actions
- Vercel-ready static build

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

## Design / build docs

- [`V2_BUILD_GUIDE.md`](./V2_BUILD_GUIDE.md) — the notebook-FPS refactor checklist
- [`GAME_DESIGN.md`](./GAME_DESIGN.md) — current narrative, systems, map, weapons, and remaining polish

<!-- Clean baseline redeploy: 2026-09-29 -->
