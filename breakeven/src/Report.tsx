import { ArrowLeft, Printer } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { linkClick } from "@/components/Brand";
import { OPTIONS } from "@/components/options";
import { HelpDesk } from "@/components/HelpDesk";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Explain, ReadAloud } from "@/components/Explain";
import type { TermId } from "@/lib/glossary";
import { buildPayload, buildResults, readReportForm } from "@/lib/decisionReport";
import { readPlan, stepHref } from "@/lib/plan";
import type { OptionId } from "@/lib/tco";

const money = (v: number | null | undefined) => {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  const s = a >= 1e6 ? `$${(a / 1e6).toFixed(a >= 1e8 ? 0 : 1)}M` : a >= 1e4 ? `$${Math.round(a / 1e3)}K` : `$${Math.round(a).toLocaleString("en-US")}`;
  return v < 0 ? `−${s}` : s;
};
const tokens = (v: number | null | undefined) => {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  if (v >= 1e9) return `${+(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${+(v / 1e6).toFixed(1)}M`;
  return Math.round(v).toLocaleString("en-US");
};
const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v}%`);
const idOf = (name: string): OptionId => (Object.keys(OPTIONS) as OptionId[]).find((id) => OPTIONS[id].name === name) ?? "api";

function Tile({ label, value, sub, tone, term }: { label: string; value: ReactNode; sub: string; tone?: "good" | undefined; term?: TermId }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="kicker">
        {label}
        {term && <Explain id={term} />}
      </p>
      <p className={`mt-1 text-2xl font-extrabold ${tone === "good" ? "text-[#0e7f72] dark:text-[#4fd1c0]" : ""}`}>{value}</p>
      <p className="mt-0.5 text-xs text-ink-2">{sub}</p>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-4 break-inside-avoid rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="flex items-baseline gap-2.5 text-lg font-bold">
        <span className="font-mono text-xs text-brand-ink">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="mt-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-bg px-3 py-2.5">
      <span className="block text-xs text-ink-2">{label}</span>
      <strong className="text-base">{value}</strong>
    </div>
  );
}

function Table({ head, rows, highlight = -1 }: { head: string[]; rows: ReactNode[][]; highlight?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-ink-2">
            {head.map((h, i) => (
              <th key={h} className={`py-2 pr-2 font-semibold ${i ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, k) => (
            <tr key={k} className={`border-b border-line ${k === highlight ? "bg-brand/10 font-semibold" : ""}`}>
              {row.map((cell, i) => (
                <td key={i} className={`py-2 pr-2 ${i ? "text-right font-mono tabular-nums" : ""}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const List = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

/** The decision report: everything Breakeven worked out for a plan, on one printable page. Built in the browser. */
export function Report() {
  const { plan, form } = useMemo(() => {
    const p = readPlan(window.location.search);
    return { plan: p, form: readReportForm(window.location.search, p) };
  }, []);
  const d = useMemo(() => buildPayload(plan, form), [plan, form]);
  const r = useMemo(() => buildResults(plan, form), [plan, form]);
  const rec = r.options.find((o) => o.name === r.recommended) ?? r.options[0]!;
  const back = stepHref("result", plan);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const last = r.growth_years[r.growth_years.length - 1];
  const nec = r.is_ai_the_right_tool;
  const bc = r.business_case;
  let n = 0;
  const recId = idOf(r.recommended);
  const maxCost = Math.max(...r.options.map((o) => o.monthly), 1);
  const maxGrowth = Math.max(...r.growth_years.map((g) => g[recId]), 1);
  const why: ReactNode[] = [
    r.best_fit_differs ? `Best fit on your priorities, though ${r.cheapest} is cheaper` : `Cheapest at ${tokens(d.monthly_tokens)} tokens a month`,
    `Fit score ${rec.fit_score}/100 on your priorities`,
  ];
  if (nec) why.push(`Is AI the right tool? ${nec.verdict}`);
  else if (bc) why.push(bc.savings_monthly > 0 ? `AI saves ${money(bc.savings_monthly)} a month` : "AI doesn't pay off at these inputs");
  const switches = r.what_would_change_it.filter((c) => !c.holds);
  const holding = r.what_would_change_it.filter((c) => c.holds).length;
  const changes: ReactNode[] = [
    ...switches.slice(0, 3).map((c) => `${c.check} → ${c.instead ?? "another option"}`),
    ...(holding ? [`${holding} price and hardware swings of ±25%: still holds`] : []),
  ];

  const summary: ReactNode[] = [
    `At ${tokens(d.monthly_tokens)} tokens a month, ${r.cheapest} is the cheapest way to run this workload.`,
    r.best_fit_differs ? `Weighing cost against your other priorities, ${r.recommended} is the better fit.` : "It also scores best once your other priorities are weighed in.",
  ];
  if (last && last.year > 0)
    summary.push(
      `With ${pct(d.expected_annual_growth)} growth a year, volume reaches ${tokens(last.monthly_tokens)} tokens a month by year ${last.year}, when ${last.cheapest} is cheapest${last.cheapest !== r.cheapest ? ", so plan to revisit the decision as volume grows" : ""}.`,
    );
  if (bc) summary.push(bc.savings_monthly > 0 ? `The business case saves ${money(bc.savings_monthly)} a month against people alone.` : "The business case doesn't pay off at these inputs.");
  if (nec) summary.push(`Is AI the right tool? ${nec.verdict}. ${nec.reason}`);

  const flips: string[] = [];
  if (r.api_cheapest_until_tokens) flips.push(`Pay per token (API) is cheapest up to about ${tokens(r.api_cheapest_until_tokens)} tokens a month.`);
  if (r.own_cheapest_from_tokens) flips.push(`Owning GPUs is cheapest for good from about ${tokens(r.own_cheapest_from_tokens)} tokens a month.`);
  if (!flips.length) flips.push("The cheapest option doesn't change across the volumes Breakeven checks.");

  const running: string[] = [
    `Average response time: about ${r.running_it.response_seconds} seconds per request (target wait: ${r.running_it.wait_target_seconds} s).`,
  ];
  if (r.running_it.hottest_utilization_pct !== null) running.push(`GPUs can run up to about ${r.running_it.hottest_utilization_pct}% busy and still meet the wait target.`);
  running.push(
    r.running_it.hybrid_best === "split"
      ? `Owning the always-busy base and renting the peaks beats both pure options by ${money(r.running_it.flexibility_value_monthly)} a month.`
      : `Splitting into an owned base and rented peaks doesn't beat ${r.running_it.hybrid_best === "own" ? "owning everything" : "renting everything"} here.`,
  );
  if (r.power.owned_gpus)
    running.push(`Owning means ${r.power.owned_gpus} GPUs drawing about ${r.power.facility_kw} kW at the facility${r.power.power_cap_kw ? ` (power budget: ${r.power.power_cap_kw} kW)` : ""}.`);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <a href={back} onClick={linkClick(back)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
          <ArrowLeft className="size-4" aria-hidden /> Back to the recommendation
        </a>
        <span className="ml-auto" />
        <ReadAloud
          label="Read it to me"
          text={`Decision report for ${d.scenario_name}. The recommendation is ${r.recommended.replace(" (API)", "")}, at ${money(rec.monthly)} a month, or ${money(rec.yearly)} a year.${r.yearly_change_vs_today !== null && r.yearly_change_vs_today > 0 ? ` That saves ${money(r.yearly_change_vs_today)} a year against how you run AI today.` : ""}${bc && bc.savings_monthly > 0 ? ` AI saves ${money(bc.savings_monthly)} a month against people alone.` : ""} ${changes.length ? `What would change it: ${String(changes[0]).replace(" → ", ", which switches it to ")}.` : ""}`}
        />
        <ThemeToggle />
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-ink"
        >
          <Printer className="size-4" aria-hidden /> Print or save as PDF
        </button>
      </div>

      <p className="kicker mt-8">Breakeven · Decision report</p>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">{d.scenario_name}</h1>
      <p className="mt-2 text-sm text-ink-2">
        {d.workload_type} · {tokens(d.monthly_tokens)} tokens a month · {d.demand_pattern} traffic · prepared {today}
      </p>

      {/* The dashboard: the answer at a glance. Everything else sits under "Full details". */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[1.35fr_1fr_1fr_1fr] [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        <div className={`col-span-2 rounded-2xl p-4 text-white sm:col-span-3 lg:col-span-1 ${OPTIONS[recId].swatch}`}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] opacity-85">Recommendation</p>
          <p className="mt-1 text-2xl font-extrabold leading-tight">{r.recommended}</p>
          <p className="mt-1 text-xs opacity-90">{r.best_fit_differs ? `Best fit on your priorities (${r.cheapest} is cheapest)` : "Cheapest and best fit at your volume"}</p>
        </div>
        <Tile label="Monthly cost" value={money(rec.monthly)} sub={`${money(rec.yearly)} a year`} />
        <Tile
          label={d.current_deployment ? `vs today (${d.current_deployment})` : "vs today"}
          value={r.yearly_change_vs_today === null ? "—" : `${r.yearly_change_vs_today >= 0 ? "−" : "+"}${money(Math.abs(r.yearly_change_vs_today))}`}
          sub={r.yearly_change_vs_today === null ? "Set how you run AI today" : r.yearly_change_vs_today >= 0 ? "saved per year" : "extra per year"}
          tone={r.yearly_change_vs_today !== null && r.yearly_change_vs_today >= 0 ? "good" : undefined}
          term="versusToday"
        />
        {bc ? (
          <Tile term="payback" label="Payback" value={bc.payback_months === null ? "None" : `${bc.payback_months} mo`} sub={bc.savings_monthly > 0 ? `AI saves ${money(bc.savings_monthly)} a month` : "AI doesn't pay off here"} />
        ) : r.product ? (
          <Tile label="Margin after compute" value={pct(r.product.margin_pct)} sub={`${money(r.product.monthly_revenue)} revenue a month`} />
        ) : (
          <Tile term="fitScore" label="Fit score" value={`${rec.fit_score}/100`} sub="on your priorities" />
        )}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="kicker">Monthly cost by option</p>
          <div className="mt-3 space-y-2.5">
            {r.options.map((o) => {
              const id = idOf(o.name);
              return (
                <div key={o.name} className="grid grid-cols-[72px_1fr_64px] items-center gap-3 text-sm">
                  <span className={o.name === r.recommended ? "font-semibold" : ""}>
                    {OPTIONS[id].short}
                    {o.name === r.recommended ? " ✓" : ""}
                  </span>
                  <span className="h-3 rounded-full bg-sunken">
                    <span className={`block h-3 rounded-full ${OPTIONS[id].swatch}`} style={{ width: `${Math.max(4, (o.monthly / maxCost) * 100)}%` }} />
                  </span>
                  <span className="text-right font-mono text-xs font-semibold">{money(o.monthly)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="kicker">
            {OPTIONS[recId].short} cost as you grow ({pct(d.expected_annual_growth)} a year)
          </p>
          <div className="mt-3 flex h-28 items-end gap-2" role="img" aria-label={`Monthly cost of ${r.recommended} by year`}>
            {r.growth_years.map((g) => {
              const v = g[recId];
              return (
                <div key={g.year} className="flex flex-1 flex-col items-center justify-end gap-1 text-[11px] text-ink-2">
                  <span className="font-mono">{money(v)}</span>
                  <span className={`w-full rounded-t-md ${OPTIONS[recId].swatch}`} style={{ height: `${Math.max(6, (v / maxGrowth) * 64)}px` }} />
                  <span>{g.year === 0 ? "Now" : `Yr ${g.year}`}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-2">
            {last && last.cheapest === r.recommended
              ? `${OPTIONS[recId].short} stays cheapest through year ${last.year} (${tokens(last.monthly_tokens)} tokens a month).`
              : last
                ? `By year ${last.year}, ${last.cheapest} becomes cheapest: plan to revisit.`
                : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="kicker">Why</p>
          <div className="mt-2 text-sm">
            <List items={why} />
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="kicker">Would change it</p>
          <div className="mt-2 text-sm">
            <List items={changes} />
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="kicker">Next 90 days</p>
          <div className="mt-2 text-sm">
            <List
              items={r.plan_30_60_90.map((step) => (
                <>
                  <strong>{step.when.replace("First ", "")}:</strong> {step.actions[0]}
                </>
              ))}
            />
          </div>
        </div>
      </div>

      <details className="group mt-6">
        <summary className="cursor-pointer list-none text-sm font-semibold text-brand-ink print:hidden">
          <span className="group-open:hidden">Full details ▾</span>
          <span className="hidden group-open:inline">Hide details ▴</span>
          <span className="ml-2 font-normal text-ink-2">costs, growth table, business case, every check, priorities, running it, full plan</span>
        </summary>
      <Section n={++n} title="Executive summary">
        <List items={summary} />
      </Section>

      <Section n={++n} title="What each option costs at today's volume">
        <Table
          head={["Option", "Monthly", "Yearly", "Per M tokens", "GPUs", "Fit score"]}
          rows={r.options.map((o) => [`${o.name}${o.name === r.recommended ? " ✓" : ""}`, money(o.monthly), money(o.yearly), `$${o.per_million_tokens}`, o.gpus ?? "—", `${o.fit_score}/100`])}
          highlight={r.options.findIndex((o) => o.name === r.recommended)}
        />
        <p className="mt-2 text-xs text-ink-2">Fit score weighs cost with data control, time to launch, model quality, ease of running and flexibility, using your priorities below.</p>
      </Section>

      <Section n={++n} title="Where the answer flips">
        <List items={flips} />
      </Section>

      <Section n={++n} title={`Growth outlook (${pct(d.expected_annual_growth)} a year)`}>
        <Table
          head={["Year", "Tokens a month", "API", "Rent", "Own", "Cheapest"]}
          rows={r.growth_years.map((g) => [g.year === 0 ? "Today" : `Year ${g.year}`, tokens(g.monthly_tokens), money(g.api), money(g.rent), money(g.own), g.cheapest])}
        />
        <p className="mt-2 text-xs text-ink-2">Monthly cost at each year's volume, at today's prices. API and GPU rental prices have been falling, so later years are conservative.</p>
      </Section>

      {bc && (
        <Section n={++n} title="AI business case">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Stat label="People cost today" value={`${money(bc.people_cost_monthly)}/mo`} />
            <Stat label="Cost with AI" value={`${money(bc.cost_with_ai_monthly)}/mo`} />
            <Stat label="AI compute" value={`${money(bc.compute_monthly)}/mo`} />
            <Stat label="Monthly savings" value={money(bc.savings_monthly)} />
            <Stat label="Payback" value={bc.payback_months === null ? "Doesn't pay back" : `${bc.payback_months} months`} />
            <Stat label="12-month ROI" value={pct(bc.roi_12_months_pct)} />
          </div>
          <p className="mt-2 text-xs text-ink-2">Assumes the AI resolves {pct(bc.ai_success_rate_pct)} of tasks; the rest go to a person, and AI output gets a short human review.</p>
        </Section>
      )}

      {nec && (
        <Section n={++n} title={`Is AI the right tool? Verdict: ${nec.verdict}`}>
          <p>{nec.reason}</p>
          <div className="mt-3">
            <Table
              head={["Option", "Conservative", "Base", "Optimistic", "Payback"]}
              rows={nec.options
                .filter((o) => o.name !== "No change")
                .map((o) => [o.name, money(o.npv_conservative), money(o.npv_base), money(o.npv_optimistic), o.payback_months === null ? "—" : `${o.payback_months} mo`])}
            />
          </div>
          <p className="mt-2 text-xs text-ink-2">3-year value against changing nothing, discounted at 10% a year.</p>
          {nec.evidence_to_gather.length > 0 && (
            <>
              <p className="mt-3 font-semibold">Evidence to gather before committing</p>
              <List items={nec.evidence_to_gather} />
            </>
          )}
        </Section>
      )}

      {r.product && (
        <Section n={++n} title="Product economics">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Stat label="Revenue" value={`${money(r.product.monthly_revenue)}/mo`} />
            <Stat label="Compute" value={`${money(r.product.monthly_compute)}/mo`} />
            <Stat label="Margin after compute" value={pct(r.product.margin_pct)} />
            <Stat label="Free users per paying user" value={r.product.free_users_per_paying_user ?? "—"} />
            <Stat label="Break-even paid share" value={pct(r.product.break_even_paid_share_pct)} />
          </div>
        </Section>
      )}

      <Section n={++n} title="What would change the recommendation">
        <List
          items={r.what_would_change_it.map((c) => (
            <>
              {c.check}:{" "}
              {c.holds ? <span className="font-semibold text-brand-ink">still holds</span> : <span className="font-semibold text-amber-700 dark:text-amber-300">switches to {c.instead ?? "another option"}</span>}
            </>
          ))}
        />
      </Section>

      <Section n={++n} title="Your priorities">
        <Table head={["Priority", "Weight (0–5)"]} rows={r.priorities.map((p) => [p.name, p.weight])} />
      </Section>

      <Section n={++n} title="Running it and powering it">
        <List items={running} />
      </Section>

      <Section n={++n} title="How to land it: 30/60/90 days">
        <div className="grid gap-3 sm:grid-cols-3">
          {r.plan_30_60_90.map((step) => (
            <div key={step.when} className="rounded-xl bg-bg p-3">
              <p className="kicker">{step.when}</p>
              <div className="mt-2">
                <List items={step.actions} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      </details>

      <p className="mt-6 text-xs text-ink-2">
        Figures come from Breakeven's model with illustrative October 2026 defaults; every assumption can be changed in the app. This report's link reopens it with the same numbers.
      </p>
      <HelpDesk />
    </main>
  );
}
