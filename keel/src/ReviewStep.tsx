import { useState } from "react";
import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Waterfall } from "@/components/Waterfall";
import { LineChart } from "@/components/LineChart";
import { Card, Kicker, Stat } from "@/components/ui";
import { MONTH_NAMES, formatCount, formatDriver, formatMoney, pct, signed } from "@/lib/model";
import type { Status } from "@/lib/review";
import { STATUS_COLOR, STATUS_WORD, run, type Run } from "@/lib/run";

/** Step 2: the monthly business review. Plan vs actual vs re-forecast, the variance bridge, the KPI tree, alerts and OKRs. */
export function ReviewStep() {
  const [s, setS] = useScenario("review");
  const r = run(s);
  const n = r.n;
  const ytdGap = r.ytd.actual - r.ytd.plan;
  const pad = (k: number) => Array<number | null>(k).fill(null);
  const alerts = r.rows
    .filter((x) => x.status !== "green")
    .map((x) => ({ ...x, effect: r.bridge.find((b) => b.id === x.id)?.effect ?? 0 }))
    .sort((a, b) => a.effect - b.effect);

  return (
    <Frame route="review" s={s} setS={setS}>
      <StepHeading route="review">
        The monthly business review for {r.monthName}. Actuals here are fictional but fixed: change the plan in step 1 and the gap moves, not the actuals.
      </StepHeading>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">Year to date, through {r.monthName}</p>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <Stat dark label="Plan" value={formatMoney(r.ytd.plan)} />
            <Stat dark label="Actual" value={formatMoney(r.ytd.actual)} />
            <Stat dark label="Gap" value={signed(ytdGap, formatMoney)} sub={signed(ytdGap / r.ytd.plan, (v) => pct(v, 1))} />
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Full year</p>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <Stat label="Plan" value={formatMoney(r.fy.plan)} />
            <Stat label="Re-forecast" value={formatMoney(r.fy.forecast)} sub="actuals + today's run-rate" />
            <Stat label="Gap to close" value={formatMoney(Math.max(0, r.fy.gap))} sub={r.fy.gap > 0 ? "see step 3" : "ahead of plan"} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <Card>
          <LineChart
            title="Monthly revenue"
            xLabels={MONTH_NAMES}
            series={[
              { label: "Plan", color: "var(--ink-2)", values: r.plan.map((m) => m.revenue), dashed: true },
              { label: "Actual", color: "var(--series-1)", values: [...r.actual.slice(0, n).map((m) => m.revenue), ...pad(12 - n)], width: 2.5 },
              { label: "Re-forecast", color: "var(--series-2)", values: [...pad(n - 1), ...r.forecast.slice(n - 1).map((m) => m.revenue)] },
            ]}
            format={formatMoney}
            height={240}
            ariaLabel={`Monthly revenue, plan against actual through ${r.monthName} and the re-forecast after. Full-year gap ${formatMoney(r.fy.gap)}.`}
          />
        </Card>
        <Bridge r={r} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <Card>
          <Kicker method="KPI tree">What's driving revenue in {r.monthName}</Kicker>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(["API", "Enterprise"] as const).map((seg) => (
              <div key={seg}>
                <p className="flex items-baseline justify-between border-b border-line pb-1.5 font-semibold">
                  {seg} revenue
                  <span className="font-mono text-sm">{formatMoney(seg === "API" ? r.actual[n - 1]!.apiRevenue : r.actual[n - 1]!.enterpriseRevenue)}</span>
                </p>
                <ul className="mt-2 grid gap-2 border-l-2 border-line pl-3">
                  {r.rows
                    .filter((x) => x.segment === seg)
                    .map((x) => (
                      <li key={x.id} className="text-sm">
                        <span className="flex items-center justify-between gap-2">
                          <span>{x.label}</span>
                          <StatusTag status={x.status} />
                        </span>
                        <span className="font-mono text-xs text-muted">
                          {formatDriver(x.id, x.actual)} vs plan {formatDriver(x.id, x.plan)}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">On track = within 5% of plan (or better); watch = within 10%; off track = more than 10% worse. Churn is better when lower.</p>
        </Card>

        <div className="grid gap-4">
          <Card>
            <Kicker>Alerts</Kicker>
            {alerts.length === 0 ? (
              <p className="mt-2 text-sm text-ink-2">Every driver is within 5% of plan.</p>
            ) : (
              <ul className="mt-3 grid gap-2.5">
                {alerts.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 text-sm">
                    <StatusTag status={a.status} />
                    <span>
                      <span className="font-semibold">{a.label}</span> is {formatDriver(a.id, a.actual)} against {formatDriver(a.id, a.plan)} planned
                      {Math.abs(a.effect) >= 1000 ? `, ${signed(a.effect, formatMoney)} of revenue to date.` : "."}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <Kicker>OKR scorecard (re-forecast vs target)</Kicker>
            <ul className="mt-3 grid gap-2.5 text-sm">
              {r.krs.map((k) => (
                <li key={k.id} className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block">{k.label}</span>
                    <span className="font-mono text-xs text-muted">
                      {k.format === "money" ? formatMoney(k.value) : k.format === "pct" ? pct(k.value, 1) : formatCount(k.value)} vs{" "}
                      {k.format === "money" ? formatMoney(k.target) : k.format === "pct" ? pct(k.target, 1) : formatCount(k.target)}
                    </span>
                  </span>
                  <StatusTag status={k.status} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Frame>
  );
}

export function StatusTag({ status }: { status: Status }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold" style={{ color: STATUS_COLOR[status] }}>
      <span className="size-2 rounded-full" style={{ background: STATUS_COLOR[status] }} aria-hidden />
      {STATUS_WORD[status]}
    </span>
  );
}

/** The variance bridge as diverging bars: each driver's effect on year-to-date revenue, from plan to actual. */
function Bridge({ r }: { r: Run }) {
  const max = Math.max(...r.bridge.map((b) => Math.abs(b.effect)), 1);
  const [list, setList] = useState(false);
  return (
    <Card>
      <Kicker method="Variance bridge">Why year to date is {r.ytd.actual >= r.ytd.plan ? "ahead" : "behind"}</Kicker>
      <div className="mt-3">
        <Waterfall key={`${r.n}-${r.ytd.actual}`} start={r.ytd.plan} end={r.ytd.actual} steps={r.bridge} />
      </div>
      <button type="button" onClick={() => setList((v) => !v)} aria-expanded={list} className="mt-2 text-xs font-medium text-brand-ink underline underline-offset-2 print:hidden">
        {list ? "Hide the list" : "Show as a list"}
      </button>
      {list && (
      <>
      <p className="mt-2 flex justify-between font-mono text-sm">
        <span className="text-muted">Plan</span>
        <span className="font-semibold">{formatMoney(r.ytd.plan)}</span>
      </p>
      <ul className="mt-2 grid gap-2">
        {r.bridge.map((b) => {
          const w = (Math.abs(b.effect) / max) * 50;
          return (
            <li key={b.id} className="grid grid-cols-[8.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 text-sm">
              <span className="truncate">{b.label}</span>
              <span className="relative h-3 rounded-[3px] bg-sunken" role="img" aria-label={`${b.label}: ${signed(b.effect, formatMoney)}`}>
                <span className="absolute inset-y-0 left-1/2 w-px bg-ink-2/40" />
                <span
                  className="glide absolute inset-y-0 rounded-[3px]"
                  style={{ left: b.effect >= 0 ? "50%" : `${50 - w}%`, width: `${w}%`, background: b.effect >= 0 ? "var(--green)" : "var(--red)" }}
                />
              </span>
              <span className="text-right font-mono text-xs">{Math.abs(b.effect) < 500 ? "$0" : signed(b.effect, formatMoney)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 flex justify-between border-t border-line pt-2 font-mono text-sm">
        <span className="text-muted">Actual</span>
        <span className="font-semibold">{formatMoney(r.ytd.actual)}</span>
      </p>
      </>
      )}
      <p className="mt-3 text-xs leading-5 text-muted">
        Sequential substitution: swap one driver at a time from plan to actual, in this order, and record how far revenue moves. The steps add up exactly to the gap.
      </p>
    </Card>
  );
}
