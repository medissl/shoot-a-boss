# Shoot a Boss — Game Design / Build Plan

## Core pitch

**Shoot a Boss** is a short browser FPS presented like an office comic that falls into a doodle dream.

The player is an exhausted corporate worker who falls asleep after their cartoon boss dumps another impossible stack of paperwork on the desk. The dream turns the office into a boxed-in surreal arena populated by ten copies of the boss.

The player clears the dream with three paper-themed weapons and throwable paper grenades. The tone is slapstick and bloodless: hits use flashes, paper bursts, health bars, and disappearing boss copies rather than gore.

## Opening story

The site opens with a six-panel comic sequence:

1. The employee works alone late at night, exhausted.
2. A round cartoon boss arrives and scolds them.
3. The boss drops an absurd tower of paperwork onto the desk.
4. Close-up: the employee is completely drained.
5. The employee falls asleep at the desk.
6. The office transforms into a paper dream arena filled with boss copies.

The intro is built from HTML/CSS illustration rather than external art assets, keeping the project self-contained.

## Controls

| Input | Action |
| --- | --- |
| WASD | Move |
| Shift (hold) | Run |
| C | Crouch |
| C while moving | Slide |
| C then Space | Momentum / velocity boost jump |
| Space | Jump |
| Mouse | Look |
| Right click | Shoot |
| Hold left click | Scope / aim |
| 1 / 2 / 3 | Sniper / Rifle / Shotgun |
| Mouse wheel | Cycle weapon |
| R | Reload |
| G | Throw paper grenade |
| ESC | Pause / release pointer lock |

## Screen flow

1. **Comic intro**
   - Six-panel sequential story
   - Next / skip controls
   - Final "Enter the dream" transition

2. **Main menu**
   - Game pitch and objective
   - Compact control preview
   - Start dream

3. **Gameplay**
   - Pointer-lock first-person camera
   - 10 boss copies
   - Closed dream-office arena
   - 3 weapons + paper grenades
   - HP, ammo, grenade, and target HUD

4. **Pause menu**
   - Resume
   - Restart
   - Return to menu
   - Options / complete controls
   - Camera sensitivity

5. **Win / lose**
   - All 10 boss copies eliminated → win
   - Player HP reaches 0 → lose

## Visual direction

- American-comic framing for the intro
- Cream paper backgrounds
- Heavy black ink outlines
- Pale blue dream sky
- Yellow/red comic accents
- Low-poly 3D geometry
- Buildings and cover = boxes / office blocks
- Props = filing cabinets, giant coffee cup, paper trees
- Boss copies = exaggerated round white-shirt mannequin with tie and angry brows
- Weapons = hand-drawn SVG first-person overlays
- UI = sketchbook cards with hard borders and offset shadows

No external 3D models are required for the first version.

## Map

A roughly **56 × 56** unit square arena with solid perimeter walls.

Inside:
- blocky office-like structures
- filing cabinet cover
- oversized coffee-cup prop
- paper trees
- open sniper lanes
- tight shotgun corners
- central rifle cover

Targets are distributed around the full arena so the player has to move rather than camp one location.

## Weapons

### Paper Sniper
- 5-round magazine
- high single-shot damage
- slow fire rate
- strongest zoom
- rewards headshots

### Report Rifle
- 30-round magazine
- medium damage
- fast fire rate
- light spread
- general-purpose weapon

### Staple Shotgun
- 6-round magazine
- multiple pellets
- wide spread
- strongest at close range

### Paper grenade
- 3 per run
- thrown with `G`
- short fuse
- radial damage with distance falloff
- crumpled-paper visual and doodle blast ring

## Movement identity

The movement is intentionally a little expressive for a tiny browser FPS:

- Walk with WASD
- Hold Shift to sprint
- Hold C without momentum to crouch
- Tap/hold C while moving on the ground to slide
- Jump immediately after crouching/sliding to receive a forward velocity boost

This gives the project a movement mechanic worth demonstrating rather than feeling like only a static Three.js shooting demo.

## AI v1

Two boss-copy personalities:

- **Runner:** retreats when the player gets close and drifts sideways.
- **Brawler:** approaches when nearby and punches on a short cooldown.

No navmesh is used in v1. Bosses stay inside the arena boundaries and can be upgraded to obstacle-aware navigation later.

## Tech stack

### Frontend / game
- Vite
- React 19
- TypeScript
- Three.js through React Three Fiber
- `@react-three/drei`
- `@react-three/rapier`
- Zustand

### Assets
- Procedural Three.js primitives
- HTML/CSS comic illustration
- SVG/CSS weapon overlays
- No backend assets required

### Backend
None.

The game has no account, save data, database, or upload requirement.

### Hosting
- GitHub
- GitHub Actions lint/build check
- Vercel static deployment

## Build workflow

### Phase 1 — playable vertical slice
- [x] Six-panel comic intro
- [x] Main menu
- [x] Procedural 3D arena
- [x] Pointer-lock FPS camera
- [x] WASD + jump
- [x] Sprint
- [x] Crouch / slide
- [x] Crouch-jump velocity boost
- [x] Three weapon switching
- [x] Ammo / reload
- [x] Shoot / scope controls
- [x] Paper grenade
- [x] 10 cartoon boss targets
- [x] Runner + brawler AI
- [x] HP / ammo / grenade / target HUD
- [x] Pause / options / sensitivity
- [x] Win and loss states

### Phase 2 — game feel
- [ ] Muzzle flash / recoil
- [x] Target hit flash
- [ ] Paper impact particles
- [ ] Reload animation
- [ ] Footsteps and weapon sounds
- [ ] Stronger slide camera feedback
- [ ] Target obstacle avoidance
- [ ] Spawn / defeat animation

### Phase 3 — polish
- [ ] Audio pass
- [ ] Performance profiling
- [ ] Desktop compatibility pass
- [ ] Touch-device fallback message
- [ ] README GIF + screenshots
- [x] GitHub Actions
- [ ] Vercel production deploy

## Scope rule

Keep this intentionally small. The portfolio value is a polished, complete, funny browser FPS with a clear visual identity — not a giant FPS engine project.
