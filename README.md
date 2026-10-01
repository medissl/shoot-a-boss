# Shoot a Boss

A browser FPS drawn like a blue-ink notebook sketch. An exhausted office worker falls asleep at their desk and fights through a twelve-stage paperwork dream.

## Campaign

Stages 1–12 revisit the Playground, Jungle, Gem Island, and Hell, then end in the Heaven office. Stage 11 is Purgatory Shift; Stage 12 is The Heavens. The final Paperwork Dragon arrives after a shorter prelude. Dream Anchors follow Stages 3, 6, and 9. A saved completion of the former Stage 10 finale continues at Stage 11.

The roster includes managers, paperwork, pens, flying couriers, statues, five office enemies, and three named elite encounters. Red warning regions mark heavy attacks and map hazards. All new enemies count toward stage completion and use the same Scan, damage, and reward flow as the older roster.

## Dream Desk

Loadout shows four equipped Gear slots and owned Gear. The Shop offers purchase and immediate equip, or a swap choice when slots are full. Magic shows one element and the next tier at a time. The five casts have distinct shapes: Fire projectile, Thunder strike, Water rain area, Ice eruption, and Crystal prison. Crates unlock cosmetic weapon themes; locked themes remain silhouettes.

## Controls

| Input | Action |
| --- | --- |
| WASD | Move |
| Shift | Sprint |
| C | Crouch or slide |
| Space | Jump |
| Mouse | Look |
| Left click | Attack |
| Right click | Aim or scope |
| 1–4 / mouse wheel | Choose weapon |
| R | Reload |
| G | Paper grenade |
| F | Cast equipped Magic |
| Q | Scan |
| ESC | Pause |

## Stack and development

Vite, React, TypeScript, Three.js / React Three Fiber, Drei, Rapier, and Zustand. The game is a static site with browser save storage.

```bash
npm install
npm run dev
npm run lint
npm run build
node --test tests/flow.test.mjs tests/spawn.test.mjs
```

Older concept documents in this repository may describe previous campaign versions; runtime values live in `src/game/levels.ts`, `src/game/store.ts`, and the combat components.
