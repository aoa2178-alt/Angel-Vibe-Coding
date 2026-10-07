import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { StackedBars } from "@/components/StackedBars";
import { Card, Kicker, SourceLink, Stat } from "@/components/ui";
import { SPENDERS, colorOf, filingUrl, formatMillions, formatQuarter, pct, signedPct } from "@/lib/data";
import { headline, quarterRange, valueAt } from "@/lib/metrics";

/** Step 1: how much is Big Tech spending? Quarterly capex for the six spenders, stacked, with the headline numbers. */
export function SpendStep() {
  const [s, setS] = useScenario("spend");
  const h = headline();
  const qs = quarterRange("2019Q1", h.quarter);
  const order = [...SPENDERS].sort((a, b) => (valueAt(b, h.quarter, "capex") ?? 0) - (valueAt(a, h.quarter, "capex") ?? 0));

  return (
    <Frame route="spend" s={s} setS={setS}>
      <StepHeading route="spend">
        Capital expenditure (cash spent on data centers, servers and other long-lived assets) straight from each company's 10-Q and 10-K, quarter by quarter.
      </StepHeading>

      <div className="rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">Six spenders, {formatQuarter(h.quarter)}</p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat dark label="Capex this quarter" value={formatMillions(h.capex)} sub={`${h.yoy === null ? "" : signedPct(h.yoy)} on a year ago`} />
          <Stat dark label="Annual pace" value={formatMillions(h.runRate)} sub="this quarter × 4" />
          <Stat dark label="Last 12 months" value={formatMillions(h.ttmCapex)} sub={`${h.ttmGrowth === null ? "" : signedPct(h.ttmGrowth)} on the 12 before`} />
          <Stat dark label="Share of operating cash" value={pct(h.capexShareOfOcf)} sub="capex ÷ cash from operations" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <Card>
          <StackedBars
            title="Quarterly capex, six spenders"
            labels={qs.map(formatQuarter)}
            series={order.map((c) => ({ label: c.short, color: colorOf(c.ticker), values: qs.map((q) => valueAt(c, q, "capex")) }))}
            format={formatMillions}
            ariaLabel={`Quarterly capex for six companies from Q1 2019 to ${formatQuarter(h.quarter)}, reaching ${formatMillions(h.capex)} in the latest quarter.`}
          />
          <p className="mt-3 text-xs leading-5 text-muted">
            Calendar quarters by period end; fiscal years differ (Microsoft's year ends in June, Oracle's in May). Amazon reports purchases of property and equipment
            before finance leases.
          </p>
        </Card>
        <Card>
          <Kicker>{formatQuarter(h.quarter)}, by company</Kicker>
          <ul className="mt-3 grid gap-2.5 text-sm">
            {h.ranked.map((r) => {
              const q = r.c.quarters.find((x) => x.quarter === h.quarter)!;
              return (
                <li key={r.c.ticker} className="flex items-baseline justify-between gap-2 border-b border-line pb-2">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-sm" style={{ background: colorOf(r.c.ticker) }} aria-hidden />
                    <span>
                      <span className="font-semibold">{r.c.short}</span>{" "}
                      {q.accn && <SourceLink href={filingUrl(r.c.cik, q.accn)}>filing</SourceLink>}
                    </span>
                  </span>
                  <span className="text-right font-mono">
                    {formatMillions(r.capex)}
                    <span className="block text-xs text-muted">{r.yoy === null ? "" : `${signedPct(r.yoy)} y/y`}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-sm leading-6 text-ink-2">
            {h.fastest.c.short} grew fastest ({signedPct(h.fastest.yoy!)}). Apple is the outlier: its capex is {h.ranked.find((r) => r.c.ticker === "AAPL")?.yoy !== null ? `${signedPct(h.ranked.find((r) => r.c.ticker === "AAPL")!.yoy!)} on a year ago` : "flat"}, a sliver of the others'.
          </p>
        </Card>
      </div>
    </Frame>
  );
}
