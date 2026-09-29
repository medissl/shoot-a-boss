# Shoot a Boss

A browser FPS drawn like a chaotic blue-ink notebook.

You play an exhausted office worker who falls asleep after another impossible pile of paperwork lands on the desk. The opening six-panel comic drops you into a surreal office dream where managers, paperwork monsters, flying couriers, laser statues, map hazards, magic, cards, gear, and increasingly ridiculous builds all become part of the same run.

**Live build:** https://shoot-a-boss.vercel.app

## What the game is now

Shoot a Boss has grown from a small arena prototype into a progression-focused FPS / roguelite-style browser game with persistent upgrades and run-based builds.

The current game includes:

- 10-stage campaign with difficulty scaling from **VERY EASY** to **ALMOST IMPOSSIBLE**
- 4 handcrafted map themes: **Playground, Jungle, Gem Island, and Hell**
- 4 playable weapons: **Paper Sniper, Report Rifle, Staple Shotgun, and Paper Knife**
- 44 Dream Cards across common, rare, epic, and legendary rarities
- 6 build Evolutions created by combining compatible Cards
- 9 permanent Gear items with up to 4 equipped at once
- 5 elemental Magic trees: **Fire, Crystal, Ice, Water, Thunder**
- 20 Magic tiers per element with **Force / Tempo / Craft** upgrade choices
- Player XP, Levels, Skill Points, Coins, Hearts, Dream Anchors, and NG+
- 22 cosmetic themes per weapon, for **88 themed weapon skins**
- Weapon-specific Skin Crates, Arsenal previews, rarity filtering, and saved loadouts
- Practice mode for cleared stages without affecting campaign progression
- Local persistent save data with save-version migration and a full reset option
- Desktop mouse/keyboard controls plus touch/mobile controls

There is no account system or backend. Progress is stored locally in the browser.

## Core loop

The current progression loop is:

**Play a stage → clear the deadline → earn Coins + XP → level up → choose a Dream Card → unlock Evolutions → prepare in Dream Desk → start the next stage.**

Long-term progression and run progression are deliberately separated:

- **Permanent progression:** Player Level, XP, Skill Points, Magic, Gear ownership/ranks, Coins, unlocked skins, equipped loadout
- **Run progression:** current stage, Hearts, Dream Cards, Evolutions, NG+ run state, Dream Anchor

If all Hearts are lost, the Dream collapses back to the latest Anchor while permanent progression remains safe.

## Campaign

| Level | Stage | Theme | Difficulty |
| ---: | --- | --- | --- |
| 1 | The Playground | Playground | Very Easy |
| 2 | The Jungle | Jungle | Easy |
| 3 | Gem Island | Gems | Easy + |
| 4 | Overtime Yard | Playground | Normal |
| 5 | Green Deadline | Jungle | Normal + |
| 6 | Crystal Audit | Gems | Hard |
| 7 | Playground Panic | Playground | Hard + |
| 8 | Jungle Rush | Jungle | Very Hard |
| 9 | Gem Siege | Gems | Brutal |
| 10 | The Hell | Hell | Almost Impossible |

Each map family has its own traversal and hazard identity:

- **Playground:** cover-heavy arena combat and Paper Storm pressure on later visits
- **Jungle:** towers, ladders, huts, fallen logs, spreading thorns, and ziplines
- **Gems:** vertical cavern movement, spiral climbing, crystal hazards, and telegraphed gem lasers
- **Hell:** lava rivers, stone bridges, volcanic warnings, and eruption zones

Later stages also use combat pacing phases such as **Deadline Surge** and **Final Push**, plus special Dream Events including **Priority Deadline, Paper Jam, and Overtime**.

## Enemies

The current Bestiary contains six main enemy archetypes:

- **Mr. Boss** — aggressive melee manager
- **The Feedback Manager** — ranged boss variant with telegraphed handgun/bow attacks
- **Paper Cutlet** — fast ground-level paperwork monster
- **The Inktern** — ranged pen enemy firing ink bursts
- **Airmail Menace** — flying dive attacker
- **Burn the Deadline Statue** — stationary long-range area-control threat

Enemy speed, vision, damage, HP, composition, active-enemy pressure, and NG+ scaling increase through the campaign. Ranged pressure is coordinated by an attack-director system rather than letting every enemy attack at once.

## Weapons

### Paper Sniper

- 5-round magazine
- 175 base damage
- extreme zoom and perfect aimed spread
- strong headshot / precision-card synergy
- slower follow-up and reload rhythm

### Report Rifle

- 35-round magazine
- 26 base damage
- automatic fire
- reliable general-purpose sustained damage
- supports freeze, precision, overclock, and empowered-shot Cards

### Staple Shotgun

- 5-shell magazine
- 6 pellets per shot
- 34 base damage per pellet
- strongest at close range
- spread, slow, extra-pellet, and point-blank build options

### Paper Knife

- 100 base damage
- no ammunition
- short melee range
- 20% movement-speed bonus while held
- dedicated Knife Cards and Evolution synergy

Firearms use world-space tracers that visually originate from the weapon muzzle while hit detection remains aligned to the crosshair.

## Dream Cards

Every cleared stage offers a three-card draft with a single reroll.

Base rarity odds are:

- **Common:** 50%
- **Rare:** 30%
- **Epic:** 15%
- **Legendary:** 5%

The current pool contains **44 Cards**, including:

- global damage, accuracy, movement, reload, magazine, jump, HP, and bomb upgrades
- Sniper-specific burn, focus, piercing, bolt, and Legendary double-shot effects
- Rifle freeze, precision, overclock, damage, and empowered-shot effects
- Shotgun pellet, choke, slow, close-range, and Legendary multi-pellet effects
- shields, healing, orbiting attacks, scan upgrades, ammo effects, and survivability
- Magic damage, cooldown, echo, shield, and element-specific upgrades

Magic Cards are gated until the relevant Magic has actually been learned.

## Evolutions

Compatible Cards can combine into one of six run-defining Evolutions:

- **Crunch Time**
- **Bottomless Inbox**
- **Paper Trail**
- **Return to Sender**
- **Overtime Arcana**
- **Expense Report**

Evolutions have their own reward flow and remain visible in the Run Sheet for inspection.

## Magic

Skill Points earned from Player Levels are spent in five elemental trees:

- **Fire** — heavy impact, burn, and fire pools
- **Crystal** — persistent crystal trails and branching effects
- **Ice** — freeze, slow, and crowd control
- **Water** — splash damage, seekers, and sustain
- **Thunder** — paralysis and chain lightning

Each tree has 20 tiers. Non-milestone tiers can specialize into **Force**, **Tempo**, or **Craft**, while tiers 5 / 10 / 15 / 20 unlock larger milestone effects.

Press **F** in combat to cast the currently equipped element.

## Gear and economy

Permanent Gear is purchased with Coins in **Dream Desk → Shop**.

The current Gear roster includes:

- Iron Vest
- Quick Boots
- Ink Barrel
- Life Medallion
- Ink Skates
- Paper Aegis
- Scout Lens
- Extra Satchel
- Arcane Pen

You can own every Gear item, but only **4** can be equipped at once.

Coins are also used for Heart recovery and cosmetic Skin Crates.

## Arsenal and skins

The Arsenal supports all four weapons and saves an equipped skin independently for each one.

There are **22 cosmetic themes per weapon**:

- 10 Rare
- 7 Epic
- 5 Legendary

That makes **88 themed weapon skins** across Rifle, Sniper, Shotgun, and Knife, plus their default appearances.

Skins can change the visual material language, particles, muzzle effects, tracers, scope treatment, animation accents, and theme audio without changing weapon combat stats.

Crates cost Coins and are cosmetic-only.

## Pickups and combat tools

Maps can spawn four pickup types:

- **Health** — restores 20% max HP
- **Ammo** — restores reserve ammunition
- **Paper Bomb** — restores grenade capacity
- **Speed** — temporary movement boost

Other combat tools include:

- Paper Bombs on **G**
- target marking / Scan on **Q**
- elemental Magic on **F**
- shields and shield-triggered Card effects
- passive off-screen guidance when enemies are difficult to locate
- Dream Cache rewards from special events
- world hazards that create movement and positioning pressure

## Menus and progression UX

The current front-end is organized around four top-level destinations:

- **Play Dream** — campaign Dream Map and Practice stages
- **Dream Desk** — Loadout, Magic, Shop, and Arsenal
- **Archives** — opening Story and Bestiary
- **Options** — controls, sensitivity, audio, fullscreen, tutorial replay, and save reset

The game includes a guided tutorial/discovery system for:

- controls
- XP and Levels
- Skill Points
- Magic
- Dream Cards
- Gear
- Shop
- Skin Crates
- Hearts
- Dream Anchors
- Scan
- Evolutions

Post-stage progression uses dedicated Stage Clear, Level Up, Reward, Card Draft, and Evolution presentations rather than dropping directly back into gameplay.

## Controls

### Desktop

| Input | Action |
| --- | --- |
| W A S D | Move |
| Shift | Sprint |
| Space | Jump / climb |
| C | Crouch / slide |
| 1–4 / Mouse Wheel | Switch weapon |
| I | Inspect equipped weapon skin |
| Mouse | Look |
| Left Mouse | Fire / attack |
| Right Mouse | Aim / scope |
| R | Reload |
| G | Throw Paper Bomb |
| E / Shift+E | Jungle zipline forward / back |
| Q | Mark nearby enemies |
| F | Cast equipped Magic |
| Esc / P | Pause / Run Sheet |

Touch devices use an on-screen movement pad, swipe aiming, weapon bar, fire/scope controls, jump/slide controls, and utility buttons for bombs, reload, marking, ziplines, Magic, and pause.

## Visual and audio direction

The entire game is built around a hand-drawn notebook aesthetic:

- warm white paper
- blue ballpoint outlines
- doodled UI
- hand-written presentation
- red telegraphs for danger
- procedural 3D geometry mixed with SVG, CSS, Canvas, and Three.js effects

The game also contains:

- weapon-specific firing, reload, and mechanical audio
- world/enemy procedural SFX
- map-hazard warnings
- Card-proc feedback
- crate-opening SFX
- BGM and independent BGM/SFX volume controls
- fullscreen support and a fullscreen session prompt

## Tech stack

- Vite 7
- React 19
- TypeScript 5
- Three.js
- React Three Fiber
- Drei
- Rapier physics
- Zustand
- Lucide React
- ESLint
- Vercel

## Local development

~~~bash
npm install
npm run dev
~~~

Production build:

~~~bash
npm run build
~~~

Lint:

~~~bash
npm run lint
~~~

Preview the production build locally:

~~~bash
npm run preview
~~~

## Debugging

A local balance/debug overlay can be enabled with:

~~~text
?debugBalance=1
~~~

The project also contains flow/progression tests for important systems such as Card drafting, Evolutions, Scan behavior, and post-stage progression.

## Save data

Campaign progress is stored in browser localStorage and currently includes versioned migration support.

Saved progression includes things such as:

- campaign / NG+ state
- Player Level and XP
- Skill Points and Magic
- Gear ownership and equipped Gear
- Coins and Hearts
- Dream Cards and Evolutions
- skins and equipped skins
- Dream Anchors
- tutorial/discovery state

**Reset saved progress** in Options intentionally erases the entire local save.

## Project status

This repository is actively being developed and balanced. The current build already contains the full 10-stage progression loop, persistent meta progression, run-based Cards/Evolutions, Gear, Magic, cosmetics, multiple map systems, Practice, NG+, tutorials, and a much larger UX layer than the original prototype.

Made by **Medianto Susilo**.
