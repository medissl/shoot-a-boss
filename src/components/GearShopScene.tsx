import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { GEAR, gearCap, gearCost, type GearId, useGameStore } from "../game/store";

const shopkeeperLines = [
  "Let's buy!",
  "You got coins? I've got gear!",
  "Come on, spend your money on this!",
  "The bosses never check their receipts.",
  "One more shield could save your dream.",
  "A faster slide? Very stylish.",
  "Your wallet looks lonely. Let's fix that!",
  "These doodles are tougher than they look.",
];
const gearGlyphs: Record<GearId, string> = {
  vest: "♥", boots: "↝", barrel: "✦", medallion: "✚",
  skates: "➜", aegis: "⬡", lens: "◎", satchel: "◌",
};

export function GearShopScene({ onBack }: { onBack: () => void }) {
  const coins = useGameStore((s) => s.coins);
  const gear = useGameStore((s) => s.gear);
  const buyGear = useGameStore((s) => s.buyGear);
  const [dialogue, setDialogue] = useState(shopkeeperLines[0]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDialogue((current) => {
        const options = shopkeeperLines.filter((line) => line !== current);
        return options[Math.floor(Math.random() * options.length)];
      });
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  const purchase = (id: GearId, name: string) => {
    buyGear(id);
    setDialogue(`${name}? Nice choice. See you on the next stage!`);
  };

  return <main className="gear-scene">
    <div className="gear-scene__rays" aria-hidden="true" />
    <div className="gear-scene__header">
      <button type="button" onClick={onBack}><ArrowLeft size={19} /> BACK TO STAGES</button>
      <span className="gear-scene__cash"><span className="doodle-coin" aria-hidden="true">◉</span> {coins} COINS</span>
    </div>
    <div className="gear-scene__layout">
      <div className="gear-scene__intro">
        <p>ISSUE 02 // THE SUPPLY CLOSET</p>
        <h1>THE<br />GEAR<br />SHOP</h1>
        <div className="gear-scene__stamp">STICKMAN<br />APPROVED ✓</div>
        <p className="gear-scene__note">Spend coins from cleared stages. Gear carries into future runs, even when the dream starts over.</p>
      </div>
      <section className="gear-shelf" aria-label="Gear for sale">
        <h2><ShoppingBag size={23} /> PICK YOUR GEAR <small>PERMANENT · UP TO 5 RANKS</small></h2>
        <div className="gear-shelf__grid">{GEAR.map((item) => {
          const rank = gear[item.id];
          const maxRank = gearCap(item.id);
          const cost = gearCost(item.id, rank);
          return <article key={item.id} className="gear-item">
            <span className="gear-item__glyph" aria-hidden="true">{gearGlyphs[item.id]}</span>
            <div className="gear-item__copy"><h3>{item.name}</h3><p>{item.detail}</p><small>RANK {rank}/{maxRank} · {"●".repeat(rank)}{"○".repeat(maxRank - rank)}</small></div>
            <button type="button" disabled={rank >= maxRank || coins < cost} onClick={() => purchase(item.id, item.name)}>
              {rank >= maxRank ? "MAXED" : `◉ ${cost} · BUY`}
            </button>
          </article>;
        })}</div>
      </section>
      <aside className="shopkeeper" aria-label="Stickman shopkeeper">
        <div className="shopkeeper__bubble" aria-live="polite">{dialogue}</div>
        <div className="shopkeeper__figure" aria-hidden="true">
          <div className="shopkeeper__head"><i /><i /><span /></div>
          <div className="shopkeeper__torso" />
          <div className="shopkeeper__arm shopkeeper__arm--left" />
          <div className="shopkeeper__arm shopkeeper__arm--right" />
          <div className="shopkeeper__leg shopkeeper__leg--left" />
          <div className="shopkeeper__leg shopkeeper__leg--right" />
        </div>
        <span className="shopkeeper__signature">YOUR FRIENDLY<br />PAPER DEALER</span>
      </aside>
    </div>
    <small className="creator-credit creator-credit--menu">Made by Medianto Susilo</small>
  </main>;
}
