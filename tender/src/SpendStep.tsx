import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Card, Kicker, Stat } from "@/components/ui";
import { spend } from "@/lib/analysis";
import { formatMoney, pct } from "@/lib/data";

/** Step 1: where the money goes. Spend by category (Pareto), supplier concentration, and the savings each lever could find. */
export function SpendStep() {
  const [s, setS] = useScenario("spend");
  const sp = spend();
  const top = sp.pareto.findIndex((r) => r.cumulative >= 0.8) + 1;

  return (
    <Frame route="spend" s={s} setS={setS}>
      <StepHeading route="spend">
        Before negotiating anything, see the whole bill: which categories matter, where one supplier holds all the cards, and where savings are realistic.
      </StepHeading>

      <div className="rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat dark label="Equipment spend" value={formatMoney(sp.grand)} sub={`${sp.pareto.length} categories`} />
          <Stat dark label="80% of spend" value={`${top} categories`} sub={sp.pareto.slice(0, top).map((r) => r.name.split(" (")[0]).join(", ")} />
          <Stat dark label="Single-sourced" value={`${sp.singleSource.length}`} sub={sp.singleSource.map((r) => r.name.split(" (")[0]).join(", ")} />
          <Stat dark label="Savings in reach" value={`${formatMoney(sp.savingsLow)}–${formatMoney(sp.savingsHigh)}`} sub={`${pct(sp.savingsLow / sp.grand, 1)}–${pct(sp.savingsHigh / sp.grand, 1)} of spend`} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <Card>
          <Kicker method="Pareto">Spend by category</Kicker>
          <ul className="mt-4 grid gap-3">
            {sp.pareto.map((r) => (
              <li key={r.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold">{r.name}</span>
                  <span className="font-mono">
                    {formatMoney(r.total)} <span className="text-muted">· {pct(r.share)} · cumulative {pct(r.cumulative)}</span>
                  </span>
                </div>
                <div className="mt-1 h-3 rounded-r-[3px] bg-sunken">
                  <div className="glide h-full rounded-r-[3px]" style={{ width: `${(r.total / sp.pareto[0]!.total) * 100}%`, background: r.cumulative <= 0.81 ? "var(--brand)" : "var(--part-3)" }} />
                </div>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  {r.qty.toLocaleString("en-US")} {r.unit} × {formatMoney(r.unitPrice)}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid gap-4">
          <Card>
            <Kicker method="Concentration">Who holds the cards</Kicker>
            <ul className="mt-3 grid gap-3 text-sm">
              {sp.pareto.map((r) => (
                <li key={r.id}>
                  <span className="flex items-baseline justify-between gap-2">
                    <span>{r.name.split(" (")[0]}</span>
                    {r.singleSource ? (
                      <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-risk">Single source</span>
                    ) : (
                      <span className="font-mono text-xs text-muted">top supplier {pct(r.topShare)}</span>
                    )}
                  </span>
                  <span className="mt-1 flex h-2.5 overflow-hidden rounded-[3px] bg-sunken" role="img" aria-label={r.suppliers.map((x) => `${x.name} ${pct(x.share)}`).join(", ")}>
                    {r.suppliers.map((x, i) => (
                      <span key={x.name} className="h-full border-r-2 border-surface last:border-r-0" style={{ width: `${x.share * 100}%`, background: `var(--part-${Math.min(4, i + 1)})` }} />
                    ))}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{r.suppliers.map((x) => `${x.name} ${pct(x.share)}`).join(" · ")}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <Kicker>Savings levers</Kicker>
            <ul className="mt-3 grid gap-2.5 text-sm">
              {[...sp.pareto].sort((a, b) => b.savingsHigh - a.savingsHigh).map((r) => (
                <li key={r.id} className="border-b border-line pb-2">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{r.name.split(" (")[0]}</span>
                    <span className="font-mono">
                      {formatMoney(r.savingsLow)}–{formatMoney(r.savingsHigh)}
                    </span>
                  </span>
                  <span className="text-xs text-ink-2">
                    {r.lever} ({pct(r.savings[0])}–{pct(r.savings[1])})
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      <p className="mt-6 text-xs leading-5 text-muted">
        Quantities, prices, suppliers and savings ranges are illustrative assumptions for a fictional buyer. The transformer price sits inside the public range (GAO: up to
        $10M per unit); see Sources.
      </p>
    </Frame>
  );
}
