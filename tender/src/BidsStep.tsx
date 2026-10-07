import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Card, Kicker, Slider } from "@/components/ui";
import { CRITERIA, awardOptions, ranked, scorecard } from "@/lib/analysis";
import { formatMoney, monthlyDelayCost, pct, type Settings } from "@/lib/data";

const PARTS = [
  { key: "price", label: "Price", color: "var(--part-1)" },
  { key: "freight", label: "Freight and duty", color: "var(--part-2)" },
  { key: "financing", label: "Cash paid up front", color: "var(--part-3)" },
  { key: "quality", label: "Failed tests", color: "var(--part-4)" },
  { key: "lateness", label: "Hall waiting", color: "var(--part-5)" },
] as const;

/** Step 3: who to buy from. Total cost of ownership, a weighted scorecard, and how to split the award. */
export function BidsStep() {
  const [s, setS] = useScenario("bids");
  const set = (patch: Partial<Settings>) => setS({ ...s, ...patch });
  const t = ranked(s);
  const max = Math.max(...t.map((x) => x.total));
  const cheapestQuote = [...t].sort((a, b) => a.price - b.price)[0]!;
  const card = scorecard(s);
  const awards = awardOptions(s);
  const bestAward = awards.reduce((a, b) => (b.total < a.total ? b : a));
  const monthly = monthlyDelayCost(s).total;

  return (
    <Frame route="bids" s={s} setS={setS}>
      <StepHeading route="bids">
        Four bids for three transformers (two to energize the hall, one spare). Compare what each really costs, not just the quote.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <Card>
          <Kicker method="Total cost of ownership">Three transformers, all-in</Kicker>
          <ul className="mt-4 grid gap-4">
            {t.map((x, i) => (
              <li key={x.bid.supplier}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span>
                    <span className="font-semibold">{x.bid.supplier}</span> <span className="text-muted">· {x.bid.country}</span>
                    {i === 0 && <span className="ml-2 rounded-full bg-brand px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-on-brand">lowest total</span>}
                  </span>
                  <span className="font-mono font-semibold">{formatMoney(x.total)}</span>
                </div>
                <div className="mt-1.5 flex h-4 overflow-hidden rounded-r-[3px] bg-sunken" role="img" aria-label={PARTS.map((p) => `${p.label} ${formatMoney(x[p.key])}`).join(", ")}>
                  {PARTS.map((p) =>
                    x[p.key] > 0 ? <span key={p.key} className="glide h-full border-r-2 border-surface last:border-r-0" style={{ width: `${(x[p.key] / max) * 100}%`, background: p.color }} /> : null,
                  )}
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  {formatMoney(x.bid.price)}/unit · {x.bid.leadMonths}-month lead {x.monthsLate > 0 ? `(${x.monthsLate} late: ${formatMoney(x.lateness)})` : "(on time)"} · {pct(x.bid.upfront)} up front ·{" "}
                  {pct(x.bid.defect, 1)} test failures
                </p>
              </li>
            ))}
          </ul>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
            {PARTS.map((p) => (
              <li key={p.key} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: p.color }} aria-hidden />
                {p.label}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-brand-soft p-3 text-sm leading-6 text-ink">
            {cheapestQuote.bid.supplier} has the lowest quote ({formatMoney(cheapestQuote.bid.price)} a unit) but a {cheapestQuote.bid.leadMonths}-month lead time. At{" "}
            {formatMoney(monthly)} for every month the hall waits, that's {formatMoney(cheapestQuote.lateness)} of lost revenue and idle capital, so {t[0]!.bid.supplier} is the better deal by{" "}
            {formatMoney(cheapestQuote.total - t[0]!.total)}.
          </p>
        </Card>

        <div className="grid gap-4">
          <Card>
            <Kicker>Deadline and risk</Kicker>
            <div className="mt-3 grid gap-4">
              <Slider label="Needed on site in" value={s.needByMonths} display={`${s.needByMonths} months`} min={6} max={40} onChange={(v) => set({ needByMonths: v })} />
              <Slider label="Chance a supplier fails to deliver" value={Math.round(s.disruption * 100)} display={pct(s.disruption)} min={0} max={40} onChange={(v) => set({ disruption: v / 100 })} />
              <Slider label="Lease rate" value={s.leasePerKwMonth} display={`$${s.leasePerKwMonth}/kW-month`} min={50} max={300} step={5} onChange={(v) => set({ leasePerKwMonth: v })} />
            </div>
          </Card>
          <Card>
            <Kicker method="Scorecard">Beyond cost</Kicker>
            <ul className="mt-3 grid gap-2 text-sm">
              {card.map((c, i) => (
                <li key={c.supplier} className="flex items-baseline justify-between gap-2 border-b border-line pb-1.5">
                  <span className={i === 0 ? "font-semibold" : ""}>{c.supplier}</span>
                  <span className="font-mono">{Math.round(c.total)}/100</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid gap-2">
              {CRITERIA.map((c) => (
                <label key={c.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-xs">
                  <span>{c.label}</span>
                  <input type="range" min={0} max={50} value={s.weights[c.id]} onChange={(e) => set({ weights: { ...s.weights, [c.id]: Number(e.target.value) } })} />
                  <span className="text-right font-mono">{s.weights[c.id]}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <Kicker method="Award split">Single source or spread the risk?</Kicker>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1.5 font-medium">Award</th>
                <th className="py-1.5 text-right font-medium">Equipment cost</th>
                <th className="py-1.5 text-right font-medium">Months late</th>
                <th className="py-1.5 text-right font-medium">Chance the hall slips</th>
                <th className="py-1.5 text-right font-medium">Expected slip cost</th>
                <th className="py-1.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {awards.map((a) => (
                <tr key={a.label} className={`border-t border-line ${a === bestAward ? "font-semibold" : ""}`}>
                  <td className="py-2 font-sans">{a.label}</td>
                  <td className="py-2 text-right">{formatMoney(a.cost)}</td>
                  <td className="py-2 text-right">{a.monthsLate}</td>
                  <td className="py-2 text-right">{pct(a.pShort, 1)}</td>
                  <td className="py-2 text-right">{formatMoney(a.expectedDisruption)}</td>
                  <td className="py-2 text-right">{formatMoney(a.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-6 text-ink-2">
          The hall needs two of the three units to energize. With one supplier, a {pct(s.disruption)} chance that supplier fails is a {pct(s.disruption)} chance the hall slips{" "}
          {s.disruptionMonths} months. Splitting two and one doesn't help (the hall still depends on the supplier with two). One each from three suppliers means two must fail
          together, which cuts the chance to {pct(awards[2]!.pShort, 1)}.{" "}
          {bestAward === awards[2] ? "At these settings that's worth giving up the volume discount." : "At these settings it isn't worth giving up the volume discount."}
        </p>
      </Card>
    </Frame>
  );
}
