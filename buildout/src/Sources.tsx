import { Frame, useScenario } from "@/components/Frame";
import { Card, SourceLink } from "@/components/ui";
import { COMPANIES, DATA, filingUrl, formatQuarter } from "@/lib/data";

const METHODS: [string, string][] = [
  ["Quarters", "cash-flow items are filed year to date; a quarter = this year-to-date value − the one a quarter earlier with the same start. Direct three-month values win; restated values use the latest filing"],
  ["Calendar mapping", "each quarter is assigned to the calendar quarter containing its end date minus 45 days, so fiscal years that end in May, June or January line up"],
  ["Capex", "payments to acquire property, plant and equipment (Amazon and NVIDIA: payments to acquire productive assets, where that's their tag)"],
  ["Intensity", "trailing-12-month capex ÷ trailing-12-month revenue"],
  ["Free cash flow", "trailing-12-month operating cash flow − capex"],
  ["Depreciation wave", "trailing capex ÷ trailing depreciation; above 1×, the asset base and future depreciation keep growing"],
  ["Read-through", "change in the four suppliers' trailing revenue ÷ change in the six spenders' trailing capex since the base quarter (illustrative)"],
];

/** Every company, the tags used, and the latest filing; plus the methods. */
export function Sources() {
  const [s, setS] = useScenario("sources");
  return (
    <Frame route="sources" s={s} setS={setS}>
      <div className="mb-8 max-w-3xl">
        <p className="kicker">Sources</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">Straight from the filings</h1>
        <p className="mt-4 text-lg leading-8 text-ink-2">
          Every number comes from the SEC's free XBRL API (<SourceLink href="https://www.sec.gov/edgar/sec-api-documentation">EDGAR APIs</SourceLink>), the machine-readable version of
          each company's 10-Q and 10-K. Retrieved {DATA.retrieved}; refreshed after each earnings season.
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <p className="kicker">Companies and tags</p>
          <ul className="mt-2 divide-y divide-line">
            {COMPANIES.map((c) => {
              const last = c.quarters.filter((q) => q.capex !== null && q.accn).at(-1);
              return (
                <li key={c.ticker} className="grid gap-1 py-3 text-sm leading-6 sm:grid-cols-[12rem_1fr] sm:gap-6">
                  <span>
                    <span className="block font-semibold">
                      {c.short} <span className="font-mono text-xs text-muted">{c.ticker}</span>
                    </span>
                    <span className="text-xs text-muted">{c.role === "spender" ? "Spender" : "Receiver"}</span>
                  </span>
                  <span className="text-ink-2">
                    {Object.entries(c.concepts).map(([k, v]) => (
                      <span key={k} className="block break-all font-mono text-xs">
                        {k}: {v}
                      </span>
                    ))}
                    {last && (
                      <span className="mt-1 block text-xs">
                        <span className="break-all">Latest: {formatQuarter(last.quarter)} · </span><SourceLink href={filingUrl(c.cik, last.accn!)}>filing {last.accn}</SourceLink>
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <p className="kicker">Methods</p>
          <dl className="mt-2 divide-y divide-line text-sm">
            {METHODS.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="font-semibold">{k}</dt>
                <dd className="font-mono text-[13px] leading-6 text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-5 text-muted">
            Gaps: some companies changed tags over the years. Revenue and capex are filled across tags for the same quantity; depreciation uses one tag per company, so a few
            early quarters show "not reported". Not investment advice.
          </p>
        </Card>
      </div>
    </Frame>
  );
}
