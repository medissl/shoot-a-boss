import { useState } from "react";
import { ArrowLeft, Flame, Gem, Snowflake, Droplets, Zap, Swords, Timer, Sparkles, LockKeyhole } from "lucide-react";
import { MAGIC_TYPES, xpToNextLevel, useGameStore, type MagicType } from "../game/store";
import { ELEMENT_DESIGN, isMilestone, magicCost, magicNodeDetail, magicStats, type Branch } from "../game/magicTree";

const icons = { fire: Flame, crystal: Gem, ice: Snowflake, water: Droplets, thunder: Zap };
const branches = { force: Swords, tempo: Timer, craft: Sparkles };
type Selection = { kind: MagicType; tier: number; branch: Branch };

export function SkillTree({ onBack }: { onBack: () => void }) {
  const { playerLevel, xp, skillPoints, magic, magicChoices, selectedMagic, unlockMagic, selectMagic } = useGameStore();
  const [selection, setSelection] = useState<Selection>({ kind: "fire", tier: 1, branch: "force" });
  const { kind, tier, branch } = selection;
  const currentRank = magic[kind];
  const milestone = isMilestone(tier);
  const learned = tier <= currentRank && (tier === 1 || milestone || (magicChoices[kind]?.[tier] ?? "force") === branch);
  const available = tier === currentRank + 1 && skillPoints >= magicCost(tier);
  const previewChoices = { ...magicChoices, [kind]: { ...magicChoices[kind], [tier]: branch } };
  const preview = magicStats(kind, tier, previewChoices);

  return <main className="skill-scene">
    <header><button onClick={onBack}><ArrowLeft size={18}/> BACK</button><div><span>THE DOODLE GRIMOIRE</span><h1>MAGIC TREE</h1><p>LEVEL {playerLevel} · {xp}/{xpToNextLevel(playerLevel)} XP · {skillPoints} SKILL POINT{skillPoints === 1 ? "" : "S"}</p></div></header>
    <aside className={`skill-inspector skill-inspector--${kind}`} aria-live="polite">
      <div><b>{kind.toUpperCase()} / TIER {String(tier).padStart(2, "0")}</b><strong>{tier === 1 ? "AWAKEN" : milestone ? "SIGNATURE SPELL" : branch === "force" ? "IMPACT" : branch === "tempo" ? "RHYTHM" : "ELEMENTAL CRAFT"}</strong><p>{magicNodeDetail(kind, tier, branch)}</p><small>IMPACT {preview.damage} · COOLDOWN {preview.cooldown}S · {magicCost(tier)} SP</small></div>
      <button type="button" disabled={!available || learned} onClick={() => unlockMagic(kind, branch)}>{learned ? "✓ LEARNED" : tier <= currentRank ? "OTHER PATH CHOSEN" : available ? `LEARN · ${magicCost(tier)} SP` : tier > currentRank + 1 ? <><LockKeyhole size={15}/> FINISH PREVIOUS TIER</> : `NEED ${magicCost(tier)} SP`}</button>
    </aside>
    <p className="skill-instructions">Pick one of three paths at each tier. Every fifth tier upgrades the spell itself. Tap an icon to inspect its details, then spend skill points above. Swipe sideways to see all elements.</p>
    <div className="skill-tree" role="group" aria-label="Five branching elemental paths">
      {MAGIC_TYPES.map((element) => {
        const Icon = icons[element]; const rank = magic[element]; const power= Math.floor(rank/5);
        return <section key={element} className={`skill-column skill-column--${element}`}>
          <h2><span className={`skill-emblem skill-emblem--${power}`}><Icon size={22 + power*2}/>{power>0&&<i aria-hidden="true">✦</i>}</span>{element.toUpperCase()}</h2>
          <p>{ELEMENT_DESIGN[element].identity}</p>
          <button type="button" disabled={!rank} className={`skill-equip ${selectedMagic === element ? "is-active" : ""}`} onClick={() => selectMagic(element)}>{selectedMagic === element ? "✓ EQUIPPED" : rank ? "EQUIP SPELL" : "LOCKED"}</button>
          <div className="skill-nodes">{Array.from({ length: 20 }, (_, index) => {
            const level = index + 1;
            const special = level === 1 || isMilestone(level);
            const paths: Branch[] = special ? ["force"] : ["force", "tempo", "craft"];
            return <div key={level} className={`skill-tier ${special ? "skill-tier--special" : ""} ${level <= rank ? "skill-tier--owned" : ""}`}>
              <span className="skill-tier__label">{String(level).padStart(2, "0")} <small>{magicCost(level)} SP</small></span>
              <div className="skill-tier__paths">{paths.map((path) => {
                const BranchIcon = special ? Icon : branches[path];
                const owned = level <= rank && (special || (magicChoices[element]?.[level] ?? "force") === path);
                const active = selection.kind === element && selection.tier === level && selection.branch === path;
                return <button type="button" key={path} aria-label={`${element} tier ${level} ${special ? "signature" : path}${owned ? ", learned" : ""}`} aria-pressed={active} title={magicNodeDetail(element, level, path)} className={`skill-node ${owned ? "is-owned" : ""} ${active ? "is-selected" : ""} ${level > rank + 1 ? "is-locked" : ""} ${special ? `skill-node--milestone-${Math.floor(level/5)}` : ""}`} onClick={() => setSelection({ kind: element, tier: level, branch: path })}><BranchIcon size={special ? 20 + Math.floor(level/5)*2 : 17}/>{special && level>=5 && <span className="skill-node__star" aria-hidden="true">✦</span>}</button>;
              })}</div>
            </div>;
          })}</div>
        </section>;
      })}
    </div>
  </main>;
}
