import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { LineChart } from "@/components/LineChart";
import { Card, Kicker, SourceLink, Stat } from "@/components/ui";
import { ranked, shouldCost } from "@/lib/analysis";
import { PRICES, formatMoney, formatMonth, pct } from "@/lib/data";

const INDEXED = [
  { key: "transformers", label: "Transformer prices (PPI)", color: "var(--brand)", width: 2.75 },
  { key: "copper", label: "Copper", color: "var(--part-5)" },
  { key: "steel", label: "Iron and steel", color: "var(--ink-2)" },
  { key: "wages", label: "Factory wages", color: "var(--part-3)" },
];

/** Step 2: what one 80 MVA transformer should cost, built up from materials, labor and overhead, and the index check. */
export function ShouldCostStep() {
  const [s, setS] = useScenario("should-cost");
  const sc = shouldCost();
  const quotes = ranked(s).map((t) => t.bid.price);
  const minQ = Math.min(...quotes);
  const maxQ = Math.max(...quotes);
  const months = PRICES.series.transformers!.points.map((p) => p.month);
  const series = INDEXED.map((x) => {
    const pts = PRICES.series[x.key]!.points;
    const base = pts[0]!.value;
    const byMonth = new Map(pts.map((p) => [p.month, (p.value / base) * 100]));
    return { label: x.label, color: x.color, width: x.width, values: months.map((m) => byMonth.get(m) ?? null) };
  });
  const max = Math.max(...sc.lines.map((l) => l.cost));

  return (
    <Frame route="should-cost" s={s} setS={setS}>
      <StepHeading route="should-cost">
        Build the price up from what goes into the box, priced from public data where it exists. Then check how fast the price rose against what went into it.
      </StepHeading>

      <div className="rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat dark label="Should-cost" value={formatMoney(sc.total)} sub="per 80 MVA unit, with a 15% margin" />
          <Stat dark label="Quotes" value={`${formatMoney(minQ)}–${formatMoney(maxQ)}`} sub="four suppliers, per unit" />
          <Stat dark label="Costs since 2019" value={`+${pct(sc.costGrowth - 1)}`} sub="this build-up, at 2019 vs today's prices" />
          <Stat dark label="Prices since 2019" value={`+${pct(sc.ppiGrowth - 1)}`} sub="transformer producer price index" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <Card>
          <Kicker method="Cost build-up">One 80 MVA transformer</Kicker>
          <ul className="mt-4 grid gap-2.5">
            {sc.lines.map((l) => (
              <li key={l.id}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className={l.id === "margin" ? "text-ink-2" : "font-semibold"}>{l.label}</span>
                  <span className="font-mono">{formatMoney(l.cost)}</span>
                </div>
                <div className="mt-1 h-2 rounded-r-[3px] bg-sunken">
                  <div className="h-full rounded-r-[3px]" style={{ width: `${(l.cost / max) * 100}%`, background: l.id === "copper" ? "var(--part-5)" : "var(--brand)", opacity: l.id === "margin" ? 0.45 : 1 }} />
                </div>
                <p className="mt-0.5 text-xs text-muted">{l.basis}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-baseline justify-between border-t border-line pt-3 font-semibold">
            Should-cost <span className="font-mono">{formatMoney(sc.total)}</span>
          </p>
        </Card>

        <Card>
          <LineChart
            title="Index check: January 2019 = 100"
            xLabels={months.map(formatMonth)}
            series={series}
            format={(v) => `${Math.round(v)}`}
            height={260}
            tableEvery={6}
            ariaLabel={`Since January 2019 transformer prices rose ${pct(sc.ppiGrowth - 1)}, against ${pct(sc.costGrowth - 1)} for the costs inside them.`}
          />
          <p className="mt-4 text-sm leading-6 text-ink-2">
            Copper more than doubled, so some of the price rise is real. But weighting each input by its share of the box, costs rose {pct(sc.costGrowth - 1)} while prices rose{" "}
            {pct(sc.ppiGrowth - 1)}. The difference is the premium suppliers charge while factories are full (lead times near 128 weeks), and it's the room to negotiate in.
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">
            Public data, retrieved {PRICES.retrieved}:{" "}
            {INDEXED.map((x, i) => (
              <span key={x.key}>
                {i > 0 && " · "}
                <SourceLink href={PRICES.series[x.key]!.source}>{PRICES.series[x.key]!.id}</SourceLink>
              </span>
            ))}
            . Quantities, the steel price per tonne and the labor hours are assumptions.
          </p>
        </Card>
      </div>
    </Frame>
  );
}
