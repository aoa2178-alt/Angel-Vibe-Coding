import { useMemo, useState } from "react";
import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Card, Kicker, Pills, Stat } from "@/components/ui";
import { PRICES, REGIONS, REGION_LABEL, RETRIEVED, STATE_REGION, WAIT_YEARS, cents, formatMonth, formatMw, stateName, years } from "@/lib/data";
import { byState, powerWeighted, stateRows, type Sector } from "@/lib/metrics";

export const SECTOR_OPTIONS: { id: Sector; label: string; blurb: string }[] = [
  { id: "industrial", label: "Industrial price", blurb: "What large industrial users pay; closest to a big data center's contract" },
  { id: "commercial", label: "Commercial price", blurb: "What commercial buildings pay; closer to a small colocation site" },
];

export function GridStep() {
  const [s, setS] = useScenario("grid");
  const [table, setTable] = useState(false);
  const totals = useMemo(() => byState(s.at), [s.at]);
  const rows = useMemo(() => stateRows(s.sector), [s.sector]);
  const us = PRICES.states.US?.[s.sector] ?? null;
  const aiPrice = powerWeighted(s.at, (c) => PRICES.states[c]?.[s.sector] ?? null);
  const aiWait = powerWeighted(s.at, (c) => REGIONS[STATE_REGION[c]?.region ?? ""]?.waitYears ?? null);
  const when = s.at === RETRIEVED ? "today" : formatMonth(s.at);

  const aiStates = rows.filter((r) => (totals.get(r.code)?.mw ?? 0) > 0).sort((a, b) => totals.get(b.code)!.mw - totals.get(a.code)!.mw);
  const priceMax = Math.ceil(Math.max(...aiStates.map((r) => r.price ?? 0), us ?? 0) / 5) * 5 || 20;

  const regions = Object.entries(REGIONS)
    .map(([id, r]) => {
      const mw = [...totals.values()].filter((t) => STATE_REGION[t.code]?.region === id).reduce((a, t) => a + t.mw, 0);
      return { id, ...r, mw };
    })
    .sort((a, b) => (a.waitYears ?? 99) - (b.waitYears ?? 99));
  const waitMax = 10;
  const ercot = REGIONS.ERCOT?.waitYears ?? null;
  const pjm = REGIONS.PJM?.waitYears ?? null;

  return (
    <Frame route="grid" s={s}>
      <StepHeading route="grid">
        Two things a data center needs from the grid: cheap power, and a fast connection. Here's both, for every state and grid region.
      </StepHeading>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Pills options={SECTOR_OPTIONS} value={s.sector} onChange={(sector) => setS({ ...s, sector })} label="Power price" />
        <span className="text-xs text-muted">Average price, {PRICES.period.replace(" YTD", " year to date")} (EIA)</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <Kicker method="EIA 5.6.B">Are they building where power is cheap?</Kicker>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Stat label={`AI power's average price, ${when}`} value={`${cents(aiPrice)}/kWh`} sub="weighted by each state's AI MW" />
            <Stat label="US average" value={`${cents(us)}/kWh`} sub={aiPrice !== null && us ? `AI pays ${Math.round((1 - aiPrice / us) * 100)}% less` : undefined} />
          </div>
          <ul className="mt-5 space-y-2" aria-label="Power price in each state with AI power">
            {aiStates.map((r) => {
              const mw = totals.get(r.code)!.mw;
              return (
                <li key={r.code} className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-3 text-sm">
                  <span className="truncate" title={`${formatMw(mw)} of AI power`}>
                    {r.name}
                  </span>
                  <span className="relative h-4">
                    <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
                    {us !== null && <span className="absolute top-0 h-4 w-px bg-ink-2/50" style={{ left: `${(us / priceMax) * 100}%` }} title="US average" />}
                    {r.price !== null && (
                      <span
                        className="glide absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface"
                        style={{ left: `${(r.price / priceMax) * 100}%`, background: r.price <= (us ?? 0) ? "var(--amber)" : "var(--peri)" }}
                      />
                    )}
                  </span>
                  <span className="text-right font-mono text-xs">{cents(r.price)}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: "var(--amber)" }} /> At or below the US average
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: "var(--peri)" }} /> Above it
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-px bg-ink-2/50" /> US average
            </span>
            <span>Biggest AI states first; scale 0–{priceMax}¢</span>
          </p>
        </Card>

        <Card>
          <Kicker method="LBNL queue data">How long does the grid make you wait?</Kicker>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Stat label={`AI power's typical wait, ${when}`} value={years(aiWait)} sub="weighted by each region's AI MW" />
            <Stat label="Fastest region" value={years(regions[0]?.waitYears ?? null)} sub={regions[0]?.id} />
          </div>
          <ul className="mt-5 space-y-3" aria-label="Grid connection wait by region">
            {regions.map((r) => (
              <li key={r.id} className="text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate">{REGION_LABEL[r.id] ?? r.id}</span>
                  <span className="shrink-0 font-mono text-xs">{r.waitYears === null ? "no data" : years(r.waitYears)}</span>
                </div>
                <div className="relative mt-1 h-3 rounded-full bg-sunken">
                  {r.p25 !== null && r.p75 !== null && (
                    <span className="absolute top-0 h-3 rounded-full bg-peri/45" style={{ left: `${(r.p25 / waitMax) * 100}%`, width: `${((Math.min(r.p75, waitMax) - r.p25) / waitMax) * 100}%` }} />
                  )}
                  {r.waitYears !== null && (
                    <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-amber" style={{ left: `${(r.waitYears / waitMax) * 100}%` }} />
                  )}
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {r.activeGw.toLocaleString("en-US")} GW waiting in the queue · {r.mw > 0 ? `${formatMw(r.mw)} of AI power` : "no AI power yet"} · {r.n} plants measured
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Dot = median years from asking to connect to switching on, for power plants that came online {WAIT_YEARS}; bar = the middle half (25th–75th percentile). Scale 0–{waitMax} years.
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <Kicker>What it means</Kicker>
        <p className="mt-2 max-w-3xl text-[15px] leading-7 text-ink-2">
          AI is mostly being built where power is cheap: its power-weighted price is {cents(aiPrice)}/kWh against a US average of {cents(us)}. Speed is another story.
          {ercot !== null && pjm !== null &&
            ` Texas's grid (ERCOT) connects new power in about ${years(ercot)}, while PJM, home to Virginia and Ohio, takes ${years(pjm)}.`}{" "}
          Step 3 scores every state on both at once.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-5 text-muted">
          The wait is for new power plants joining the grid, a public proxy for how fast a region can add supply. Data centers' own connection waits aren't published consistently. Each state uses its main grid
          region (where most of its connection requests go); a few states are split between regions.
        </p>
        <button type="button" onClick={() => setTable((t) => !t)} aria-expanded={table} className="mt-3 text-xs font-medium text-brand-ink underline underline-offset-2">
          {table ? "Hide every state" : "Show every state as a table"}
        </button>
        {table && (
          <div className="mt-2 max-h-96 overflow-auto rounded-lg border border-line">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-sunken text-muted">
                <tr>
                  <th className="px-2 py-1.5 font-medium">State</th>
                  <th className="px-2 py-1.5 text-right font-medium">¢/kWh</th>
                  <th className="px-2 py-1.5 font-medium">Main region</th>
                  <th className="px-2 py-1.5 text-right font-medium">Wait</th>
                  <th className="px-2 py-1.5 text-right font-medium">AI MW</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.code} className="border-t border-line">
                    <td className="px-2 py-1">{stateName(r.code)}</td>
                    <td className="px-2 py-1 text-right font-mono">{r.price?.toFixed(2) ?? "–"}</td>
                    <td className="px-2 py-1">
                      {r.region ?? "–"}
                      {r.regionShare !== null && r.regionShare < 0.75 ? <span className="text-muted"> (split)</span> : null}
                    </td>
                    <td className="px-2 py-1 text-right font-mono">{r.wait?.toFixed(1) ?? "–"}</td>
                    <td className="px-2 py-1 text-right font-mono">{totals.get(r.code) ? Math.round(totals.get(r.code)!.mw).toLocaleString("en-US") : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Frame>
  );
}
