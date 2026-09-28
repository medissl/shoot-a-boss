import { ArrowLeft, Flame, Gem, Snowflake, Droplets, Zap } from "lucide-react";
import { MAGIC_TYPES, magicCooldown, magicDamage, xpToNextLevel, useGameStore } from "../game/store";

const icons = { fire: Flame, crystal: Gem, ice: Snowflake, water: Droplets, thunder: Zap };
const descriptions = { fire: "Burns for five seconds", crystal: "Damaging crystal footsteps", ice: "Freezes targets", water: "Splashes nearby enemies", thunder: "Shocks and paralyzes" };
export function SkillTree({ onBack }: { onBack: () => void }) {
  const { playerLevel, xp, skillPoints, magic, selectedMagic, unlockMagic, selectMagic } = useGameStore();
  return <main className="skill-scene"><header><button onClick={onBack}><ArrowLeft size={18}/> BACK</button><div><span>THE DOODLE GRIMOIRE</span><h1>MAGIC TREE</h1><p>LEVEL {playerLevel} · {xp}/{xpToNextLevel(playerLevel)} XP · {skillPoints} SKILL POINTS</p></div></header>
    <div className="skill-tree" role="group" aria-label="Five elemental magic paths">
      {MAGIC_TYPES.map((kind) => { const Icon = icons[kind]; const rank = magic[kind]; return <section key={kind} className={`skill-column skill-column--${kind}`}><h2><Icon size={22}/> {kind.toUpperCase()}</h2><p>{descriptions[kind]}</p><button disabled={!rank} className={selectedMagic === kind ? "is-active" : ""} onClick={() => selectMagic(kind)}>{selectedMagic === kind ? "✓ EQUIPPED" : rank ? "EQUIP F / MAGIC BUTTON" : "LEARN FIRST"}</button><div className="skill-nodes">{Array.from({ length: 20 }, (_, index) => {const level = index + 1; return <button key={level} className={level <= rank ? "is-owned" : ""} disabled={level !== rank + 1 || !skillPoints} onClick={() => unlockMagic(kind)}><b>{level === 1 ? "✧" : level % 5 === 0 ? "✦" : "◇"} {kind.toUpperCase()} {String(level).padStart(2, "0")}</b><small>{magicDamage(level)} DMG · {magicCooldown(level)}S CD {level <= rank ? "· OWNED" : ""}</small></button>;})}</div></section>;})}
    </div><small>Each path unlocks from top to bottom. Select a learned element to cast it in the arena.</small>
  </main>;
}
