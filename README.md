# Shoot a Boss

**Shoot a Boss** is a browser FPS game I built with React, TypeScript, Three.js, and Rapier.

The idea is pretty simple: an exhausted office worker falls asleep at their desk and gets thrown into a weird notebook-style dream where all the stress from work turns into enemies, hazards, paperwork monsters, and bosses. The whole game has a hand-drawn white-paper / blue-ink style.

**Live build:** https://shoot-a-boss.vercel.app

## Screenshots

<p align="center">
  <img src="https://raw.githubusercontent.com/medissl/shoot-a-boss/main/public/Gameplay.png" alt="Shoot a Boss gameplay" width="100%" />
</p>

<table>
  <tr>
    <td width="50%" align="center">
      <img src="https://raw.githubusercontent.com/medissl/shoot-a-boss/main/public/Menu.png" alt="Shoot a Boss main menu" width="100%" />
      <br />
      <sub><b>Main Menu</b></sub>
    </td>
    <td width="50%" align="center">
      <img src="https://raw.githubusercontent.com/medissl/shoot-a-boss/main/public/GameDesk.png" alt="Shoot a Boss Dream Desk" width="100%" />
      <br />
      <sub><b>Dream Desk</b></sub>
    </td>
  </tr>
</table>

## About the game

The campaign now runs through twelve stages, five map themes, named boss fights, and a final Paperwork Dragon. Each map changes how you move and where danger comes from. Dream Cards and Evolutions shape each run; Gear, Magic, levels, and weapon cosmetics give you more ways to build a playstyle.

## Main systems

- Four weapons: Sniper, Rifle, Shotgun, and Knife
- Twelve campaign stages across Playground, Jungle, Gem, Hell, and Heaven
- Dream Cards, Evolutions, Gear, and five elemental Magic trees
- XP, player levels, Skill Points, Coins, Hearts, Dream Anchors, and NG+
- Enemy scanning, pickups, paper bombs, map hazards, and timed stage events
- Cosmetic weapon themes, crates, and an Arsenal
- Practice mode, local save migration, and desktop and touch controls

The menus are organized around Play Dream, Dream Desk, Archives, and Options.

## Campaign

| Stage | Dream | Map | Encounter |
| --- | --- | --- | --- |
| 1 | The Playground | Playground | First managers |
| 2 | The Jungle | Jungle | Paperwork and pens join |
| 3 | Gem Island | Gems | Flying couriers and the inner spiral |
| 4 | Overtime Yard | Playground | The HR Enforcer and Priority Deadline |
| 5 | Green Deadline | Jungle | Stapler Hound |
| 6 | Crystal Audit | Gems | The Chief Auditor |
| 7 | Playground Panic | Playground | Clipboard Guard and a broader roster |
| 8 | Jungle Rush | Jungle | The Operations Director and Paper Jam |
| 9 | Gem Siege | Gems | Overtime event |
| 10 | The Last Shift | Playground | The final office rush |
| 11 | The Hell | Hell | Shredder Rollers, stone bridges, and lava |
| 12 | The Heavens | Heaven | Final Approval, then the Paperwork Dragon |

Dream Anchors follow Stages 3, 6, and 9. A saved completion of the former Stage 10 finale continues at Stage 11. Stage 12 counts the Dragon as its final required target; approval seals are event objects rather than enemies.

Managers, Paper Cutlets, Inkterns, flying couriers, statues, five office enemies, and three named bosses have distinct roles. Red warning shapes announce heavy attacks and map hazards. Normal enemy health appears briefly after a hit; named boss health appears at the top of the screen. Enemy arrivals and attack slots are paced by stage and by Opening, Surge, and Final Push phases.

## Dream Desk and progression

The Dream Desk has Loadout, Magic, Shop, and Arsenal tabs. Equip up to four owned Gear pieces, rank up five elemental spells with Force, Tempo, or Craft choices, buy supplies, and view weapon skins. Inferno Orb burns a path and leaves burning ground; Judgement Bolt strikes and chains; Rain Cloud drifts over an area; Glacial Eruption freezes and leaves frost; Crystal Prison forms shards and a control zone. Each spell gains distinct effects at tiers 5, 10, 15, and 20. Normal spell cooldowns retain at least 45% of their base value after reductions.

Stage clears grant XP, Coins, and a Card draft on the first clear of that stage and cycle. Each weapon has six dedicated Cards: one Common, two Rare, two Epic, and one Legendary. Drafts favor the weapon you use most while still offering other builds. Some drafts lead to an Evolution choice. Practice runs use temporary pickups but grant no permanent campaign rewards. Dream Cache events offer a temporary in-run benefit. Hearts, Gear, Magic, cosmetics, and campaign progress persist in browser storage.

The Shop sells Gear and four weapon-specific cosmetic crates. A crate costs 300 Coins and awards one theme that weapon does not yet own. Each weapon has the default look plus 22 unlockable themes: 10 Rare, 7 Epic, and 5 Legendary. Themes alter the weapon drawing and its audio and visual effects while preserving the original weapon outline. Locked themes remain silhouettes until earned.

## Combat

The Paper Sniper, rifle, shotgun, and knife have separate magazine, range, damage, and cooldown rules. Guns aim with a camera-center ray; their world-space tracers leave the weapon muzzle toward the hit point. Head, body, and leg hits provide damage feedback. Scan marks targets, the paper grenade deals area damage, and equipped Magic adds elemental attacks. Boss seals, shield openings, cover, movement, and warning regions matter as much as raw damage.

| Input | Action |
| --- | --- |
| WASD / Shift | Move / sprint |
| Space / C | Jump or climb / crouch or slide |
| Mouse | Look, left click attack, right click aim |
| 1–4 / wheel | Choose weapon |
| R / G | Reload / paper grenade |
| F / Q | Cast Magic / Scan |
| E / Shift+E | Jungle zipline forward / back |
| I | Inspect equipped weapon skin |
| Esc / P | Pause and view Cards |

Touch controls offer movement and look pads, a weapon bar, fire, scope, jump, slide, bomb, reload, Scan, Magic, and pause.

## Production notes

The environments, enemy behavior, weapons, UI, progression, effects, hazards, and most sound layers are made in code. The game also uses normal audio files for some weapon and interface sounds. Progress is stored locally in the browser, with no account or backend.

## Tech stack

React 19, TypeScript, Vite, Three.js, React Three Fiber, Drei, Rapier, Zustand, Lucide React, and Vercel.

## Local development

```bash
npm install
npm run dev
npm run lint
npm run build
node --test tests/*.test.mjs
```

Add `?debugBalance=1` to inspect the current stage, roster, threat, attack slots, player build, economy, and estimated weapon DPS. Runtime tuning lives in `src/game/levels.ts`, `src/game/encounter.ts`, `src/game/attackDirector.ts`, `src/game/balance.ts`, and `src/game/store.ts`. Older concept documents may describe earlier campaign versions.

## Current status

The game is actively being improved, especially around balancing, encounter feel, boss polish, and visual playtesting. The campaign, progression, maps, weapons, cards, Magic, Gear, cosmetics, save system, Practice, and NG+ are implemented in the current build.

Made by **Medianto Susilo**.
