import { ArrowDown, ArrowUp } from "lucide-react";
import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Card, Kicker, Pills, Slider, Stat } from "@/components/ui";
import { RULES, allocate, type Rule } from "@/lib/allocate";
import { formatMoney, formatMonth, formatUnits, pct, type RegionId } from "@/lib/products";
import { run } from "@/lib/run";

const REGION_COLOR: Record<RegionId, string> = { americas: "var(--series-1)", emea: "var(--series-2)", apac: "var(--series-3)" };

/** Step 3: when there isn't enough, who gets it? Cut next month's supply and compare three allocation rules. */
export function AllocateStep() {
  const [s, setS] = useScenario("allocate");
  const r = run(s);
  const { product, allocation: a } = r;
  const compare = RULES.map((rule) => ({ rule, result: allocate(product, s.settings, r.nextDemand, r.nextDemand * (1 - s.cut), rule.id, s.order) }));
  const bestMargin = compare.reduce((x, y) => (y.result.margin > x.result.margin ? y : x));
  const move = (i: number, d: -1 | 1) => {
    const order = [...s.order];
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j]!, order[i]!];
    setS({ ...s, order });
  };

  return (
    <Frame route="allocate" s={s} setS={setS}>
      <StepHeading route="allocate" product={product}>
        A supplier comes up short for {formatMonth(r.futureMonths[0]!)}. Every rule for splitting what's left is a choice about which customers matter most.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-4">
          <Card>
            <Kicker>The shortfall</Kicker>
            <div className="mt-3 grid gap-4">
              <Slider label="Supply cut" value={Math.round(s.cut * 100)} display={pct(s.cut)} min={0} max={80} onChange={(v) => setS({ ...s, cut: v / 100 })} />
              <p className="text-sm leading-6 text-ink-2">
                Demand {formatUnits(r.nextDemand)} · supply {formatUnits(r.nextDemand * (1 - s.cut))} · short {formatUnits(r.nextDemand * s.cut)} units.
              </p>
              <div>
                <p className="text-sm font-medium">Rule</p>
                <div className="mt-2">
                  <Pills label="Allocation rule" options={RULES} value={s.rule} onChange={(rule: Rule) => setS({ ...s, rule })} />
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{RULES.find((x) => x.id === s.rule)!.blurb}</p>
              </div>
              {s.rule === "priority" && (
                <div>
                  <p className="text-sm font-medium">Priority order</p>
                  <ol className="mt-2 grid gap-1.5">
                    {s.order.map((id, i) => (
                      <li key={id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-1.5 text-sm">
                        <span>
                          <span className="font-mono text-muted">{i + 1}.</span> {product.regions.find((x) => x.id === id)!.label}
                        </span>
                        <span className="flex gap-1">
                          <button type="button" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 hover:bg-sunken disabled:opacity-30">
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button type="button" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === s.order.length - 1} className="rounded p-1 hover:bg-sunken disabled:opacity-30">
                            <ArrowDown className="size-3.5" />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">{RULES.find((x) => x.id === s.rule)!.label}</p>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat dark label="Revenue" value={formatMoney(a.revenue)} />
              <Stat dark label="Margin" value={formatMoney(a.margin)} />
              <Stat dark label="Margin lost to the cut" value={formatMoney(a.marginLost)} />
            </div>
          </div>

          <Card>
            <Kicker>Fill rate by region</Kicker>
            <ul className="mt-4 grid gap-4">
              {a.regions.map((g) => (
                <li key={g.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="size-2.5 rounded-full" style={{ background: REGION_COLOR[g.id] }} aria-hidden />
                      {g.label}
                    </span>
                    <span className="font-mono text-ink-2">
                      {formatUnits(g.allocated)} of {formatUnits(g.demand)} · <span className="font-semibold text-ink">{pct(g.fillRate)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-3 rounded-r-[3px] bg-sunken" role="img" aria-label={`${g.label}: ${pct(g.fillRate)} filled`}>
                    <div className="glide h-full rounded-r-[3px]" style={{ width: `${g.fillRate * 100}%`, background: REGION_COLOR[g.id] }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatMoney(g.unitMargin)} margin per unit · {product.regions.find((x) => x.id === g.id)!.share * 100}% of demand
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <Kicker>The three rules side by side</Kicker>
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1.5 font-medium">Rule</th>
                  <th className="py-1.5 text-right font-medium">Margin</th>
                  <th className="py-1.5 text-right font-medium">Lowest fill rate</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {compare.map(({ rule, result }) => (
                  <tr key={rule.id} className={`border-t border-line ${rule.id === s.rule ? "font-semibold" : ""}`}>
                    <td className="py-1.5 font-sans">{rule.label}</td>
                    <td className="py-1.5 text-right">{formatMoney(result.margin)}</td>
                    <td className="py-1.5 text-right">{pct(Math.min(...result.regions.map((g) => g.fillRate)))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-sm leading-6 text-ink-2">
              {bestMargin.rule.label} earns the most ({formatMoney(bestMargin.result.margin)}), but it can leave a region with nothing, and that customer remembers.
              Fair share protects every relationship and gives up {formatMoney(bestMargin.result.margin - compare[0]!.result.margin)} of margin to do it.
            </p>
          </Card>
        </div>
      </div>
    </Frame>
  );
}
