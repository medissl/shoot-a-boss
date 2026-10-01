export type OfficeKind = "sticky" | "stapler" | "highlighter" | "shredder" | "clipboard" | "hr" | "auditor" | "director";
type Profile = { name: string; hp: number; stage: number; damage: number; warning: number; cooldown: number; radius: number; range: number; color: string; attack: string };
export const OFFICE_ENEMIES: Record<OfficeKind, Profile> = {
  sticky: { name:"Sticky Note Stalker", hp:110, stage:4, damage:7, warning:.7, cooldown:3.1, radius:2.5, range:32, color:"#ffdf61", attack:"REMINDER" },
  stapler: { name:"Stapler Hound", hp:150, stage:5, damage:14, warning:.8, cooldown:3.8, radius:2.7, range:19, color:"#8894aa", attack:"POUNCE" },
  highlighter: { name:"Highlighter Wisp", hp:125, stage:6, damage:11, warning:.9, cooldown:3.5, radius:3.2, range:31, color:"#d8f760", attack:"HIGHLIGHT" },
  shredder: { name:"Shredder Roller", hp:240, stage:10, damage:19, warning:1, cooldown:4.6, radius:3.3, range:22, color:"#5e75a2", attack:"PAPER JAM" },
  clipboard: { name:"Clipboard Guard", hp:190, stage:7, damage:13, warning:.7, cooldown:3.8, radius:3.1, range:15, color:"#bd9568", attack:"SIGN HERE" },
  hr: { name:"The HR Enforcer", hp:800, stage:4, damage:20, warning:1, cooldown:4.1, radius:5, range:26, color:"#efe6d5", attack:"RED TAPE CHARGE" },
  auditor: { name:"The Chief Auditor", hp:1000, stage:6, damage:16, warning:.9, cooldown:4.3, radius:5.1, range:35, color:"#d1ecf4", attack:"LEDGER SWEEP" },
  director: { name:"The Operations Director", hp:1100, stage:8, damage:14, warning:1, cooldown:4.1, radius:5, range:34, color:"#b9d1a0", attack:"BOARDROOM DROP" },
};
