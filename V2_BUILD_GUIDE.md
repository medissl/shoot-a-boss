# Shoot a Boss — V2 Refactor Guide

This document is the implementation checklist for the notebook-doodle rewrite.

## Target experience

The game should feel like a hand-drawn FPS happening on notebook paper rather than a low-poly toy shooter.

Reference language:
- warm white / paper background
- blue ballpoint-pen outlines
- blue cross-hatching and cel-like shading
- occasional orange/red accent only for important feedback
- simple stick-figure comic characters
- hand-drawn HUD instead of boxed web UI

## Flow

1. Website opens directly into the story.
2. Six comic panels are presented one at a time in the center of the viewport.
3. Panels move through the stage with comic-page translations / rotations, not a grid.
4. Final panel triggers a blackout.
5. Black fades into the game automatically.
6. There is no main menu.
7. ESC only exposes:
   - Resume
   - Restart
   - Sensitivity

## Story panels

1. Exhausted employee working late.
2. Boss arrives and scolds the employee.
3. Boss drops a huge paperwork stack on the desk.
4. Close-up of the employee's exhausted face.
5. Employee falls asleep at the desk.
6. Boss appears inside the paper-dream world.

Art is created from SVG/CSS line drawing so the project remains self-contained.

## Gameplay visual rewrite

### World
- paper / off-white sky and floor
- blue line edges on all 3D geometry
- blue notebook grid / construction lines
- white cel-shaded surfaces
- props stay procedural
- no realistic textures required

### Boss
Replace the 3D mannequin with a 2D billboard enemy:
- fat cartoon office boss
- white fill + blue line art
- always faces the player
- walk bob
- punch animation
- hit reaction
- fixed ground height (no flying)

### HUD
- blue handwritten-looking typography
- targets top-left
- HP + ammo bottom-left / bottom-center
- active weapon + reserves bottom-right
- grenade count beside weapon HUD
- thin doodle crosshair
- scope overlays become weapon-specific

## Shooting controls

- Left mouse: fire
- Hold right mouse: aim / scope
- Rifle continues firing while left mouse is held
- R: reload
- 1 / 2 / 3 and wheel: switch weapon

## Weapon tuning

### Sniper
- 5 rounds
- very high damage
- strong 5–10× visual zoom
- intentionally inaccurate from hip
- accurate while scoped
- slow cycle time

### Rifle
- 30 rounds
- automatic AK-like cadence
- medium damage
- 2–3× aim zoom
- mild recoil/spread

### Shotgun
- 6 rounds
- exactly 5 pellets
- almost no zoom
- strong close-range damage
- damage falls with distance
- wide pellet spread at range

## Feedback
- visible blue/orange bullet tracers
- paper impact flash
- existing paper grenade remains
- no gore

## Pickups
Spawn intermittent paper-doodle pickups:
- grenade refill
- temporary speed boost

Pickups disappear on collection and respawn later.

## Movement
Keep current movement because it already feels good:
- WASD
- Shift sprint
- C crouch
- moving + C slide
- crouch / slide → immediate jump momentum boost
- Space jump

Speed pickup multiplies movement for a temporary duration without changing the movement identity.

## Execution order

### Pass A — flow / state
- remove main menu
- story → blackout → gameplay
- simplify pause options

### Pass B — combat
- swap mouse buttons
- automatic rifle
- weapon-specific spread / zoom / falloff
- tracers

### Pass C — enemy
- remove 3D mannequin
- add 2D billboard boss
- grounded movement / punch animation

### Pass D — pickups
- grenade refill
- speed boost

### Pass E — art direction
- blue-ink paper world
- notebook HUD
- hand-drawn weapon SVGs
- scope overlays
- comic carousel styling

### Pass F — validation
- lint
- TypeScript build
- production Vite build
- browser playtest on deployed build
