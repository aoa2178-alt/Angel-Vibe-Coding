import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { LineChart } from "@/components/LineChart";
import { Card, Kicker, Pills, Stat } from "@/components/ui";
import { SPENDERS, byTicker, colorOf, formatMillions, formatQuarter, pct, signedPct } from "@/lib/data";
import { headline, payoff, quarterRange, ttm, valueAt } from "@/lib/metrics";

/** Step 2: is it paying off? Capex intensity, free cash flow and the depreciation wave, for any spender. */
export function PayoffStep() {
  const [s, setS] = useScenario("payoff");
  const h = headline();
  const c = byTicker(s.company)!;
  const p = payoff(c, h.quarter);
  const qs = quarterRange("2021Q1", h.quarter);
  const rows = SPENDERS.map((x) => ({ x, p: payoff(x, h.quarter) })).sort((a, b) => (b.p.intensity ?? 0) - (a.p.intensity ?? 0));
  const maxInt = Math.max(...rows.map((r) => r.p.intensity ?? 0));
  const before = ttm(SPENDERS, "2022Q4", "capex")! / ttm(SPENDERS, "2022Q4", "revenue")!;

  return (
    <Frame route="payoff" s={s} setS={setS}>
      <StepHeading route="payoff">
        Spending is only half the story. Is revenue keeping up, how much cash is left after the build, and what does all this capex do to future costs?
      </StepHeading>

      <Pills label="Company" options={SPENDERS.map((x) => ({ id: x.ticker, label: x.short }))} value={s.company} onChange={(company: string) => setS({ ...s, company })} />

      <div className="mt-4 rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">{c.short}, last 12 months to {formatQuarter(h.quarter)}</p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat dark label="Capex intensity" value={p.intensity === null ? "–" : pct(p.intensity, 1)} sub="capex ÷ revenue" />
          <Stat dark label="Free cash flow" value={p.fcf === null ? "–" : formatMillions(p.fcf)} sub="operating cash − capex" />
          <Stat dark label="Depreciation" value={p.da === null ? "not reported" : formatMillions(p.da)} sub={p.daGrowth === null ? "" : `${signedPct(p.daGrowth)} on a year ago`} />
          <Stat dark label="Capex ÷ depreciation" value={p.capexToDa === null ? "–" : `${p.capexToDa.toFixed(1)}×`} sub="above 1×, future depreciation keeps rising" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <Card>
          <LineChart
            title={`${c.short}: quarterly cash flows`}
            xLabels={qs.map(formatQuarter)}
            series={[
              { label: "Operating cash flow", color: "var(--teal)", values: qs.map((q) => valueAt(c, q, "ocf")), width: 2.25 },
              { label: "Capex", color: colorOf(c.ticker), values: qs.map((q) => valueAt(c, q, "capex")), width: 2.5 },
              { label: "Depreciation", color: "var(--muted)", values: qs.map((q) => valueAt(c, q, "da")), dashed: true },
            ]}
            format={formatMillions}
            height={270}
            ariaLabel={`${c.short}'s operating cash flow, capex and depreciation by quarter since 2021.`}
          />
          <p className="mt-3 text-sm leading-6 text-ink-2">
            {p.fcf !== null && p.fcf < 0
              ? `${c.short} now spends more on capex than its operations bring in: free cash flow over the last year is ${formatMillions(p.fcf)}, so the build is funded by cash on hand or borrowing.`
              : `${c.short}'s operations still cover its capex, leaving ${p.fcf === null ? "–" : formatMillions(p.fcf)} of free cash flow over the last year.`}{" "}
            {p.capexToDa !== null &&
              `It is spending ${p.capexToDa.toFixed(1)}× its current depreciation, so depreciation (a cost on the income statement) will keep climbing for years as these assets come into service: the depreciation wave.`}
          </p>
        </Card>
        <Card>
          <Kicker>Capex intensity, last 12 months</Kicker>
          <ul className="mt-3 grid gap-2.5">
            {rows.map((r) => (
              <li key={r.x.ticker}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className={r.x.ticker === s.company ? "font-semibold" : ""}>{r.x.short}</span>
                  <span className="font-mono">{r.p.intensity === null ? "–" : pct(r.p.intensity, 1)}</span>
                </div>
                <div className="mt-1 h-2.5 rounded-r-[3px] bg-sunken">
                  <div className="glide h-full rounded-r-[3px]" style={{ width: `${((r.p.intensity ?? 0) / maxInt) * 100}%`, background: colorOf(r.x.ticker) }} />
                </div>
                <p className="mt-0.5 font-mono text-xs text-muted">free cash flow {r.p.fcf === null ? "–" : formatMillions(r.p.fcf)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-muted">Together the six spend {pct(h.intensity, 1)} of revenue on capex, against {pct(before, 1)} in the 12 months to Q4 2022, when ChatGPT launched.</p>
        </Card>
      </div>
    </Frame>
  );
}
