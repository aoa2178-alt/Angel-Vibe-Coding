import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Card, Kicker, Stat } from "@/components/ui";
import { negotiation, structures } from "@/lib/analysis";
import { formatMoney } from "@/lib/data";

/** Step 4: on what terms? Walk-away, target and the bargaining zone, then three deal structures. */
export function NegotiateStep() {
  const [s, setS] = useScenario("negotiate");
  const n = negotiation(s);
  const st = structures(s);
  const best = st.reduce((a, b) => (b.total < a.total ? b : a));
  const lo = Math.min(n.zone.low, n.target) * 0.9;
  const hi = Math.max(n.zone.high, n.quoted) * 1.05;
  const x = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const marks = [
    { v: n.floor, label: "Supplier's floor", sub: "should-cost, 5% margin" },
    { v: n.target, label: "Our target", sub: "price risen only with costs" },
    { v: n.quoted, label: "Their quote", sub: n.best.bid.supplier },
    { v: n.walkAway, label: "Our walk-away", sub: `matches ${n.next.bid.supplier}'s total` },
  ];

  return (
    <Frame route="negotiate" s={s} setS={setS}>
      <StepHeading route="negotiate">
        Negotiating with {n.best.bid.supplier}, the lowest total cost. Know the numbers that bound the deal, then pick the structure that fits.
      </StepHeading>

      <div className="rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat dark label="Their quote" value={formatMoney(n.quoted)} sub="per unit" />
          <Stat dark label="Our target" value={formatMoney(n.target)} sub="per unit" />
          <Stat dark label="Our walk-away" value={formatMoney(n.walkAway)} sub="above this, buy from the runner-up" />
          <Stat dark label="Saving at target" value={formatMoney(n.savingsAtTarget)} sub="on three units" />
        </div>
      </div>

      <Card className="mt-6">
        <Kicker method="Bargaining zone">Price per transformer</Kicker>
        <div className="relative mt-10 mb-16 h-3 rounded-full bg-sunken" role="img" aria-label={marks.map((m) => `${m.label} ${formatMoney(m.v)}`).join(", ")}>
          <div className="absolute inset-y-0 rounded-full bg-brand-soft ring-1 ring-brand" style={{ left: x(n.zone.low), width: `calc(${x(n.zone.high)} - ${x(n.zone.low)})` }} />
          {marks.map((m, i) => (
            <div key={m.label} className="absolute top-1/2 -translate-x-1/2" style={{ left: x(m.v) }}>
              <span className={`block size-3.5 -translate-y-1/2 rounded-full border-2 border-surface ${m.label === "Our target" ? "bg-brand" : "bg-ink-2"}`} />
              <span className={`absolute left-1/2 w-28 -translate-x-1/2 text-center text-xs ${i % 2 ? "top-3" : "-top-12"}`}>
                <span className="block font-semibold">{m.label}</span>
                <span className="block font-mono">{formatMoney(m.v)}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="text-sm leading-6 text-ink-2">
          Any price between the supplier's floor ({formatMoney(n.floor)}) and our walk-away ({formatMoney(n.walkAway)}) is a deal both sides could accept. Open near the should-cost (
          {formatMoney(n.shouldCost)}), aim for the target, and never go above the walk-away. Above it, {n.next.bid.supplier} costs less all-in.
        </p>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {st.map((d) => (
          <Card key={d.id} className={d === best ? "ring-1 ring-brand" : ""}>
            <Kicker>{d.label}</Kicker>
            <p className="mt-2 font-mono text-2xl font-semibold">{formatMoney(d.total)}</p>
            <p className="text-xs text-muted">total cost for three units</p>
            <p className="mt-3 text-sm leading-6 text-ink-2">{d.detail}</p>
            <p className="mt-2 text-xs leading-5 text-muted">Price risk: {d.indexRisk}</p>
            {d === best && <span className="mt-3 inline-block rounded-full bg-brand px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-on-brand">lowest</span>}
          </Card>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-ink-2">
        A capacity reservation only pays when the supplier would otherwise be late. {n.best.bid.supplier} is on time, so it only adds the cost of the deposit here. Try it on a slower
        supplier by moving the deadline in step 3.
      </p>
    </Frame>
  );
}
