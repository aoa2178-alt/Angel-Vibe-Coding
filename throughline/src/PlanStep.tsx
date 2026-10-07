import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { LineChart } from "@/components/LineChart";
import { Card, Kicker, NumberField, Slider, Stat } from "@/components/ui";
import { formatMoney, formatMonth, formatUnits, pct, type Settings } from "@/lib/products";
import { run } from "@/lib/run";

/** Step 2: how much should we build, and when? Safety stock, order size, the 12-month projection, cost vs service, and the launch quantity. */
export function PlanStep() {
  const [s, setS] = useScenario("plan");
  const r = run(s);
  const { product, plan, curve, launch } = r;
  const set = (patch: Partial<Settings>) => setS({ ...s, settings: { ...s.settings, ...patch } });
  const cheapest = curve.reduce((a, b) => (b.total < a.total ? b : a));
  const at99 = curve.find((c) => c.serviceLevel === 0.99)!;
  const at95 = curve.find((c) => c.serviceLevel === 0.95)!;
  const labels = r.futureMonths.map(formatMonth);
  const L = Math.round(s.settings.leadMonths);

  return (
    <Frame route="plan" s={s} setS={setS}>
      <StepHeading route="plan" product={product}>
        A monthly plan that keeps enough stock to hit the service level without tying up more cash than it needs to.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="grid gap-4">
          <div className="rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">Plan at {pct(s.settings.serviceLevel, 1)} service</p>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat dark label="Safety stock" value={formatUnits(plan.safetyStock)} sub={`${(plan.safetyStock / plan.monthlyDemand).toFixed(2)} months of demand`} />
              <Stat dark label="Order size" value={formatUnits(plan.eoq)} sub={plan.rawEoq < plan.monthlyDemand ? "every month" : `every ${(plan.eoq / plan.monthlyDemand).toFixed(1)} months`} />
              <Stat dark label="Fill rate" value={pct(plan.fillRate, 1)} sub="of demand met from stock" />
              <Stat dark label="Cost a year" value={formatMoney(plan.totalCost)} sub="holding + orders + shortages" />
            </div>
          </div>

          <Card>
            <LineChart
              title="The next 12 months, units"
              xLabels={labels}
              series={[
                { label: "Demand (forecast)", color: "var(--series-1)", values: plan.months.map((m) => m.demand) },
                { label: "Arrivals", color: "var(--series-2)", values: plan.months.map((m) => m.receipts), dashed: true },
                { label: "Stock at month end", color: "var(--brand)", values: plan.months.map((m) => m.endingInventory), width: 2.5 },
              ]}
              refs={[{ value: plan.safetyStock, label: `Safety stock · ${formatUnits(plan.safetyStock)}`, color: "var(--risk)" }]}
              format={formatUnits}
              height={250}
              ariaLabel={`Monthly plan: demand, arrivals and month-end stock, which stays at or above the safety stock of ${formatUnits(plan.safetyStock)} after the first ${L} months.`}
            />
            <p className="mt-3 text-sm leading-6 text-ink-2">
              Orders placed now arrive in {L} month{L === 1 ? "" : "s"}, so the first {L} month{L === 1 ? " is" : "s are"} already on the way. After that, the plan
              orders just enough to keep month-end stock at or above safety stock: z ({plan.z.toFixed(2)}) × forecast error ({formatUnits(plan.sigmaLead / Math.sqrt(s.settings.leadMonths + 1))}) ×
              √(lead time + 1).{" "}
              {plan.rawEoq < plan.monthlyDemand
                ? `The economic order quantity, √(2 × demand × order cost ÷ holding cost) = ${formatUnits(plan.rawEoq)}, is less than a month's demand, so ordering every month is already cheapest.`
                : `The economic order quantity, √(2 × demand × order cost ÷ holding cost), is ${formatUnits(plan.eoq)}.`}
            </p>
          </Card>

          <Card>
            <Kicker method="Cost vs service">The price of the last few points</Kicker>
            <ul className="mt-3 grid gap-2">
              {curve.map((c) => {
                const max = Math.max(...curve.map((x) => x.total));
                const active = Math.abs(c.serviceLevel - s.settings.serviceLevel) < 1e-9;
                return (
                  <li key={c.serviceLevel} className="grid grid-cols-[3.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
                    <button type="button" onClick={() => set({ serviceLevel: c.serviceLevel })} className={`text-left font-mono ${active ? "font-semibold text-brand-ink" : "text-ink-2 hover:text-ink"}`}>
                      {pct(c.serviceLevel, c.serviceLevel > 0.99 ? 1 : 1)}
                    </button>
                    <div className="h-3 rounded-r-[3px] bg-sunken">
                      <div className="glide h-full rounded-r-[3px]" style={{ width: `${(c.total / max) * 100}%`, background: c === cheapest ? "var(--brand)" : "var(--ink-2)", opacity: c === cheapest ? 1 : 0.35 }} />
                    </div>
                    <span className="text-right font-mono">{formatMoney(c.total)}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-sm leading-6 text-ink-2">
              Total cost a year is lowest at about {pct(cheapest.serviceLevel, 1)} service. Going from 95% to 99% adds {formatUnits(at99.safetyStock - at95.safetyStock)} units of
              safety stock and {formatMoney(at99.holding - at95.holding)} a year in holding cost. Click a level to plan at it.
            </p>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card>
            <Kicker>Your assumptions</Kicker>
            <div className="mt-3 grid gap-4">
              <Slider label="Service level" value={Math.round(s.settings.serviceLevel * 1000)} display={pct(s.settings.serviceLevel, 1)} min={800} max={999} onChange={(v) => set({ serviceLevel: v / 1000 })} />
              <Slider label="Lead time" value={s.settings.leadMonths} display={`${s.settings.leadMonths} months`} min={0} max={12} onChange={(v) => set({ leadMonths: v })} />
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Price" unit="$ per unit" value={s.settings.price} step={product.id === "server" ? 5000 : 10} onChange={(v) => set({ price: v })} />
                <NumberField label="Unit cost" unit="$ to build one" value={s.settings.unitCost} step={product.id === "server" ? 5000 : 10} onChange={(v) => set({ unitCost: v })} />
                <NumberField label="Holding cost" unit="share of cost a month" value={s.settings.holdPerMonth} step={0.005} max={1} onChange={(v) => set({ holdPerMonth: v })} />
                <NumberField label="Order cost" unit="$ per production run" value={s.settings.orderCost} step={10_000} onChange={(v) => set({ orderCost: v })} />
              </div>
            </div>
          </Card>

          <Card>
            <Kicker method="Newsvendor">Launch quantity</Kicker>
            <p className="mt-2 font-mono text-3xl font-semibold">{formatUnits(launch.quantity)}</p>
            <p className="text-sm text-muted">to build for the next model's first quarter</p>
            <p className="mt-3 text-sm leading-6 text-ink-2">
              Expected demand is {formatUnits(launch.mean)} ± {formatUnits(launch.sd)}. Each unit short loses {formatMoney(launch.underage)} of margin; each unit left over loses{" "}
              {formatMoney(launch.overage)} (cost less what it fetches at {pct(s.settings.salvageShare)}). So build to the{" "}
              <span className="font-mono text-ink">{pct(launch.criticalRatio)}</span> point of demand:{" "}
              {launch.criticalRatio >= 0.5 ? "a little above the expected demand, because running short costs more." : "below the expected demand, because leftovers cost more than shortages."}
            </p>
            <div className="mt-3">
              <NumberField label="Leftover value" unit="share of cost recovered" value={s.settings.salvageShare} step={0.05} max={1} onChange={(v) => set({ salvageShare: v })} />
            </div>
          </Card>
        </div>
      </div>
    </Frame>
  );
}
