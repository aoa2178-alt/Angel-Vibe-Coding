import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Card, Kicker, Slider, Stat } from "@/components/ui";
import { formatMoney, pct } from "@/lib/model";
import { run } from "@/lib/run";

/** Step 3: fund the initiatives with the most expected value that fit the budget and headcount left. */
export function PrioritizeStep() {
  const [s, setS] = useScenario("prioritize");
  const r = run(s);
  const p = r.portfolio;
  const gap = Math.max(0, r.fy.gap);
  const closed = gap > 0 ? Math.min(1, p.expected / gap) : 1;
  const fundedIds = new Set(p.funded.map((x) => x.initiative.id));
  const zero = r.scored.filter((x) => x.upside <= 0);

  return (
    <Frame route="prioritize" s={s} setS={setS}>
      <StepHeading route="prioritize">
        Eight proposals, one budget. Each is valued by the revenue it adds to the rest of the year if it works, times the chance it does.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-4">
          <Card>
            <Kicker>What's left to spend</Kicker>
            <div className="mt-3 grid gap-4">
              <Slider label="Budget" value={s.budget / 1e6} display={formatMoney(s.budget)} min={0} max={20} step={0.5} onChange={(v) => setS({ ...s, budget: v * 1e6 })} />
              <Slider label="Headcount" value={s.people} display={`${s.people} people`} min={0} max={40} onChange={(v) => setS({ ...s, people: v })} />
            </div>
          </Card>
          <div className="rounded-2xl bg-panel p-5 text-panel-ink">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">Funded portfolio</p>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Stat dark label="Expected revenue" value={formatMoney(p.expected)} sub="this year, risk-weighted" />
              <Stat dark label="Of the gap" value={gap > 0 ? pct(closed) : "n/a"} sub={gap > 0 ? `of ${formatMoney(gap)}` : "already ahead of plan"} />
              <Stat dark label="Spend" value={formatMoney(p.cost)} sub={`of ${formatMoney(s.budget)}`} />
              <Stat dark label="People" value={`${p.headcount}`} sub={`of ${s.people}`} />
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <Card>
            <Kicker method="Expected value · knapsack">Proposals, best first</Kicker>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-1.5 font-medium">Initiative</th>
                    <th className="py-1.5 text-right font-medium">Cost</th>
                    <th className="py-1.5 text-right font-medium">People</th>
                    <th className="py-1.5 text-right font-medium">If it works</th>
                    <th className="py-1.5 text-right font-medium">Chance</th>
                    <th className="py-1.5 text-right font-medium">Expected</th>
                  </tr>
                </thead>
                <tbody>
                  {r.scored.map((x) => {
                    const funded = fundedIds.has(x.initiative.id);
                    return (
                      <tr key={x.initiative.id} className="border-t border-line">
                        <td className="py-2 pr-2">
                          <span className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${funded ? "bg-brand text-on-brand" : "bg-sunken text-muted"}`}
                            >
                              {funded ? "fund" : "cut"}
                            </span>
                            <span className={funded ? "font-semibold" : "text-ink-2"}>{x.initiative.name}</span>
                          </span>
                          <span className="ml-[3.1rem] block text-xs text-muted">
                            {x.initiative.owner} · starts {x.initiative.delay} month{x.initiative.delay === 1 ? "" : "s"} after the review
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono">{formatMoney(x.initiative.cost)}</td>
                        <td className="py-2 text-right font-mono">{x.initiative.headcount}</td>
                        <td className="py-2 text-right font-mono">{formatMoney(x.upside)}</td>
                        <td className="py-2 text-right font-mono">{pct(x.initiative.confidence)}</td>
                        <td className="py-2 text-right font-mono font-semibold">{formatMoney(x.expected)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-2">
              Keel checks every combination and funds the one with the most expected revenue that fits {formatMoney(s.budget)} and {s.people} people.
              {gap > 0 && ` It closes ${pct(closed)} of the ${formatMoney(gap)} gap; the rest needs a bigger bet or a lower forecast.`}
            </p>
          </Card>

          {zero.length > 0 && (
            <Card>
              <Kicker>Worth knowing</Kicker>
              <ul className="mt-2 grid gap-2 text-sm leading-6 text-ink-2">
                {zero.map((x) => (
                  <li key={x.initiative.id}>
                    <span className="font-semibold text-ink">{x.initiative.name}</span> adds nothing this year
                    {x.initiative.effects.some((e) => e.driver === "reps")
                      ? ": reps aren't the constraint, pipeline is. Extra sellers have nothing more to close."
                      : x.initiative.delay + r.n >= 12
                        ? ": it wouldn't start working until next year."
                        : "."}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </Frame>
  );
}
