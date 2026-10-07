import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { LineChart } from "@/components/LineChart";
import { Card, Kicker, SourceLink, Stat } from "@/components/ui";
import { HOLDOUT, METHODS } from "@/lib/forecast";
import { formatMonth, formatUnits, pct } from "@/lib/products";
import { run } from "@/lib/run";

const SHOWN = 36;

/** Step 1: how much will customers want? Real demand history, three methods scored on months they didn't see, and the forecast. */
export function ForecastStep() {
  const [s, setS] = useScenario("forecast");
  const r = run(s);
  const { product, hist, fc } = r;
  const chosen = fc.scores.find((x) => x.method === fc.method)!;
  const z80 = 1.2816;

  // Chart: the last 36 months, then 12 forecast months.
  const shown = hist.slice(-SHOWN);
  const labels = [...shown.map((h) => formatMonth(h.month)), ...r.futureMonths.map(formatMonth)];
  const pad = (n: number) => Array<number | null>(n).fill(null);
  const actual = [...shown.map((h) => h.units), ...pad(12)];
  const backtest = [...pad(SHOWN - HOLDOUT), ...chosen.holdout, ...pad(12)];
  const ahead = [...pad(SHOWN - 1), shown[shown.length - 1]!.units, ...fc.forecast];
  const lower = [...pad(SHOWN), ...fc.forecast.map((v) => Math.max(0, v - z80 * fc.sigma))];
  const upper = [...pad(SHOWN), ...fc.forecast.map((v) => v + z80 * fc.sigma)];
  const nextYear = fc.forecast.reduce((a, b) => a + b, 0);
  const lastYear = hist.slice(-12).reduce((a, h) => a + h.units, 0);

  return (
    <Frame route="forecast" s={s} setS={setS}>
      <StepHeading route="forecast" product={product}>
        Three standard methods, each tested on the last 12 months it didn't see. The most accurate one sets the plan, and its error sets the
        safety stock in step 2.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <Card>
          <LineChart
            title={`${product.name}: monthly demand, units`}
            xLabels={labels}
            series={[
              { label: "Actual", color: "var(--series-1)", values: actual, width: 2.25 },
              { label: "Back-test (last 12 months)", color: "var(--series-2)", values: backtest, dashed: true },
              { label: "Forecast", color: "var(--series-2)", values: ahead, width: 2.25 },
            ]}
            band={{ color: "var(--series-2)", lower, upper, label: "80% range" }}
            format={formatUnits}
            ariaLabel={`${product.name} demand over the last three years and the next twelve months. Forecast total ${formatUnits(nextYear)} units.`}
          />
          <p className="mt-4 text-xs leading-5 text-muted">
            Demand pattern: {product.series.title} (<SourceLink href={product.series.source}>{product.series.id}</SourceLink>, {product.series.publisher}),
            rescaled so the last 12 months average {formatUnits(product.baseUnits)} {product.name}s a month. {product.why} Retrieved {r.retrieved}.
          </p>
        </Card>

        <div className="grid gap-4">
          <div className="rounded-2xl bg-panel p-5 text-panel-ink">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">Next 12 months</p>
            <p className="mt-2 font-mono text-4xl font-semibold tracking-tight">{formatUnits(nextYear)}</p>
            <p className="mt-1 text-sm text-panel-muted">
              units, {nextYear >= lastYear ? "+" : "−"}
              {pct(Math.abs(nextYear / lastYear - 1), 1)} on the last 12
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4">
              <Stat dark label="Error (WAPE)" value={pct(chosen.wape, 1)} sub="share of demand missed" />
              <Stat dark label="Bias" value={`${chosen.bias >= 0 ? "+" : "−"}${pct(Math.abs(chosen.bias), 1)}`} sub={chosen.bias >= 0 ? "over-forecasts" : "under-forecasts"} />
            </div>
          </div>

          <Card>
            <Kicker>Pick a method</Kicker>
            <ul className="mt-3 grid gap-2">
              {fc.scores.map((sc) => {
                const meta = METHODS.find((m) => m.id === sc.method)!;
                const active = sc.method === fc.method;
                return (
                  <li key={sc.method}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setS({ ...s, method: sc.method === fc.best ? null : sc.method })}
                      className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-brand bg-brand-soft" : "border-line hover:border-brand"}`}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold">{meta.label}</span>
                        <span className="font-mono text-sm">{pct(sc.wape, 1)}</span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-ink-2">{meta.blurb}</span>
                      {sc.method === fc.best && <span className="mt-1 inline-block rounded-full bg-brand px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-on-brand">most accurate</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs leading-5 text-muted">
              WAPE = total size of the misses ÷ total demand, over the 12 held-out months. Lower is better.
            </p>
          </Card>
        </div>
      </div>
    </Frame>
  );
}
