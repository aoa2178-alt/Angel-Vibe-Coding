import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { LineChart } from "@/components/LineChart";
import { Card, Kicker, Pills, Stat } from "@/components/ui";
import { RECEIVERS, SPENDERS, colorOf, formatMillions, formatQuarter, signedPct } from "@/lib/data";
import { indexed, latestCommon, quarterRange, readThrough } from "@/lib/metrics";
import { BASES } from "@/lib/scenario";

/** Step 3: who is getting the money? The suppliers' revenue against the spenders' capex, indexed to a base quarter. */
export function ReceiversStep() {
  const [s, setS] = useScenario("receivers");
  const r = readThrough(s.base);
  const end = latestCommon([...SPENDERS, ...RECEIVERS]);
  const qs = quarterRange(s.base, end);
  const fmt = (v: number) => `${Math.round(v)}`;

  return (
    <Frame route="receivers" s={s} setS={setS}>
      <StepHeading route="receivers">
        Every dollar of capex is someone else's revenue. Four suppliers sit downstream of the spend: chips (NVIDIA, Broadcom) and power and cooling (Vertiv, Eaton).
      </StepHeading>

      <Pills label="Compare since" options={BASES.map((b) => ({ id: b.id, label: b.label }))} value={s.base} onChange={(base: string) => setS({ ...s, base })} />

      <div className="mt-4 rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">
          Last 12 months to {formatQuarter(r.quarter)} vs to {formatQuarter(r.base)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat dark label="Spenders' capex" value={signedPct(r.capexGrowth)} sub={`+${formatMillions(r.addedCapex)} a year`} />
          <Stat dark label="Receivers' revenue" value={signedPct(r.revenueGrowth)} sub={`+${formatMillions(r.addedRevenue)} a year`} />
          <Stat dark label="Read-through" value={r.perDollar === null ? "–" : `$${r.perDollar.toFixed(2)}`} sub="extra supplier revenue per extra $1 of capex" />
          <Stat dark label="Biggest winner" value={[...r.byReceiver].sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0))[0]!.c.short} sub={signedPct([...r.byReceiver].sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0))[0]!.growth ?? 0)} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <Card>
          <LineChart
            title={`Indexed, last 12 months (${formatQuarter(s.base)} = 100)`}
            xLabels={qs.map(formatQuarter)}
            series={[
              { label: "Spenders' capex", color: "var(--ink)", values: indexed(SPENDERS, "capex", qs, s.base), width: 2.75, dashed: true },
              ...RECEIVERS.map((c) => ({ label: `${c.short} revenue`, color: colorOf(c.ticker), values: indexed([c], "revenue", qs, s.base) })),
            ]}
            format={fmt}
            height={290}
            ariaLabel={`Since ${formatQuarter(s.base)}, the spenders' capex grew ${signedPct(r.capexGrowth)} and the four suppliers' revenue ${signedPct(r.revenueGrowth)}.`}
          />
          <p className="mt-3 text-sm leading-6 text-ink-2">
            NVIDIA's line leaves the chart's other lines behind: it captured most of the added spend. The power and cooling makers grew more slowly but steadily, since every
            new hall needs switchgear, UPS and cooling (the gear Tender and Loadline plan for).
          </p>
        </Card>
        <Card>
          <Kicker>Revenue growth since {formatQuarter(s.base)}</Kicker>
          <ul className="mt-3 grid gap-2.5 text-sm">
            {[...r.byReceiver].sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0)).map((x) => (
              <li key={x.c.ticker} className="flex items-baseline justify-between gap-2 border-b border-line pb-2">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ background: colorOf(x.c.ticker) }} aria-hidden />
                  <span className="font-semibold">{x.c.short}</span>
                </span>
                <span className="text-right font-mono">
                  {x.growth === null ? "–" : signedPct(x.growth)}
                  <span className="block text-xs text-muted">{x.now === null ? "" : `${formatMillions(x.now)} a year`}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-muted">
            The read-through is illustrative: these suppliers also sell to other customers, and the spenders also buy from many others. It shows direction and scale, not a
            contract-level match.
          </p>
        </Card>
      </div>
    </Frame>
  );
}
