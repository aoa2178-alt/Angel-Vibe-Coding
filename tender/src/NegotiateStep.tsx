import { PriceLine } from "@/components/Collage";
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

  return (
    <Frame route="negotiate" s={s} setS={setS}>
      <StepHeading route="negotiate">
        Price bounds and deal structure for {n.best.bid.supplier}, the lowest total cost bid.
      </StepHeading>

      <div className="rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat trust="assumption" dark label="Their quote" value={formatMoney(n.quoted)} sub="per unit" />
          <Stat trust="modeled" dark label="Our target" value={formatMoney(n.target)} sub="per unit" />
          <Stat trust="modeled" dark label="Our walk-away" value={formatMoney(n.walkAway)} sub="above this, buy from the runner-up" />
          <Stat trust="modeled" dark label="Saving at target" value={formatMoney(n.savingsAtTarget)} sub="on three units" />
        </div>
      </div>

      <Card className="mt-6">
        <Kicker method="Bargaining zone">Price per transformer</Kicker>
        <div className="mt-4 mb-2">
          <PriceLine s={s} />
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
        supplier by moving the deadline under Bid evaluation.
      </p>
    </Frame>
  );
}
