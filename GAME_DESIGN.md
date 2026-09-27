# Shoot a Boss — Current Game Design

## Core pitch

**Shoot a Boss** is a short browser FPS that looks like somebody drew an action game in a lined notebook.

The player is an exhausted office worker who falls asleep after their boss dumps another huge stack of paperwork onto the desk. The story is introduced as a six-panel blue-ink comic. The last panel blacks out and the player wakes inside a surreal paper-office dream populated by ten cartoon boss copies.

The tone is comedic and bloodless. Damage is communicated through ink flashes, tracer lines, health bars, paper grenades, and disappearing boss sprites.

## Visual language

Primary reference:
- warm white paper
- blue ballpoint line work
- blue cross-hatching
- simple cel-like white/blue shading
- handwritten UI
- occasional orange accent for shots, grenades, and feedback
- procedural 3D architecture with visible blue edge lines
- 2D illustrated boss billboards facing the player

The game deliberately avoids realistic textures and conventional polished 3D character models.

## Story flow

The website has no pre-game menu.

1. Employee works alone late at night.
2. Boss arrives and scolds them.
3. Boss drops an absurd tower of paperwork onto the desk.
4. Close-up: employee is completely exhausted.
5. Employee falls asleep at the desk.
6. The office follows them into the dream.

Panels occupy the center of the viewport and move through the stage like comic frames. Advancing past panel six triggers a blackout followed by a fade directly into gameplay.

## Pause flow

ESC releases pointer lock and pauses.

Pause contains only:
- Resume
- Restart
- Camera sensitivity

There is no return-to-menu action because there is no main menu.

## Controls

| Input | Action |
| --- | --- |
| WASD | Move |
| Shift (hold) | Run |
| C | Crouch |
| C while moving | Slide |
| C then Space | Momentum boost jump |
| Space | Jump |
| Mouse | Look |
| Left click | Shoot |
| Hold right click | Aim / scope |
| 1 / 2 / 3 | Sniper / Rifle / Shotgun |
| Mouse wheel | Cycle weapon |
| R | Reload |
| G | Throw paper grenade |
| ESC | Pause / release pointer lock |

## Movement

Current movement identity is intentionally fast and expressive:

- normal walk
- hold Shift to sprint
- crouch with C
- C while moving starts a slide
- jump immediately after crouching/sliding for a forward velocity boost
- speed pickups temporarily multiply movement speed

The movement system should stay recognizable through future polish rather than being replaced by a generic FPS controller.

## Weapons

### Paper Sniper
- 5-round magazine
- high damage
- slow cycle
- around 5–10× visual zoom compared with hip view
- tiny spread while scoped
- intentionally large hip-fire spread

### Report Rifle
- 35-round magazine
- automatic ~AK-like cadence
- medium damage
- 2–3× aim zoom
- mild aimed spread
- slightly looser hip spread

### Staple Shotgun
- 6-round magazine
- exactly 5 pellets
- almost no aim zoom
- wide spread
- strong close range
- pellet damage falls with distance

### Paper grenade
- 3 carried at a time
- thrown with `G`
- short fuse
- radial falloff damage
- crumpled-paper projectile and doodle burst

## Shooting feedback

- visible tracer for every bullet / pellet
- target hit flash
- orange accent on successful tracer hits
- small weapon kick on fire
- weapon-specific scope overlays

Future polish:
- paper impact particles
- reload animation
- muzzle scribble / flash
- weapon audio

## Boss enemy

The old 3D mannequin has been removed.

Boss copies are now 2D Canvas-texture billboards:
- fat cartoon office boss
- white fill
- blue outline / hatch shading
- always yaw toward the player
- fixed ground height
- walk pose
- punch pose
- hit reaction

Two simple behaviors remain:

**Runner**
- retreats when the player gets close
- side-steps while escaping

**Brawler**
- closes distance
- punches when inside melee range

Obstacle-aware navigation can be added later if needed.

## Pickups

Four respawning doodle pickups are distributed around the arena:

**Paper bomb refill**
- restores grenade capacity

**Speed boost**
- temporarily multiplies movement speed

Pickups float / rotate, disappear after collection, and respawn after a delay.

## Map

A roughly **56 × 56** closed arena.

Procedural props:
- office block buildings
- filing cabinets
- oversized coffee cup
- paper trees
- central cover
- perimeter walls
- wireframe dream dome

The layout keeps:
- long sniper lanes
- medium-range rifle routes
- close shotgun corners

## Stack

- Vite
- React 19
- TypeScript
- Three.js through React Three Fiber
- `@react-three/drei`
- `@react-three/rapier`
- Zustand

No backend is needed.

## Current implementation status

### Completed in V2 refactor
- [x] Refactor plan
- [x] Remove main menu
- [x] Comic carousel flow
- [x] Comic blackout → game fade
- [x] Blue-ink paper world
- [x] Left-click shooting / right-click aim
- [x] Automatic rifle
- [x] Weapon-specific zoom / spread / falloff
- [x] Visible bullet tracers
- [x] New doodle weapon overlays
- [x] Notebook HUD
- [x] 2D boss billboard enemy
- [x] Walk / punch / hit poses
- [x] Grenade refill pickup
- [x] Speed pickup
- [x] Simplified pause overlay

### Next polish
- [ ] Browser playtest and bug pass
- [ ] Reload animation
- [ ] Muzzle scribble
- [ ] Paper impact particles
- [ ] Weapon / movement audio
- [ ] Boss obstacle avoidance
- [ ] Defeat animation
- [ ] Performance profiling
- [ ] Production Vercel deployment
- [ ] README GIF / screenshots

## Scope rule

Keep it small. The goal is a memorable, polished browser game with a strong visual identity — not a general FPS engine.
