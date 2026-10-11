import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { COMPANY, Footer, Header, MonthSelect, href, linkClick } from "@/components/Frame";
import { anim } from "@/components/Motion";
import { TrustTag } from "@/components/ui";
import { MONTH_NAMES, formatMoney, pct, signed } from "@/lib/model";
import { run, type Run } from "@/lib/run";
import { DEFAULT_SCENARIO } from "@/lib/scenario";

const STEPS = [
  { title: "Annual plan", body: "A driver-based plan with OKRs and headcount." },
  { title: "Business review", body: "Plan vs actual, the variance bridge and a re-forecast." },
  { title: "Funding", body: "The initiatives that close the most gap within budget." },
];

/**
 * The year as twelve columns: plan as an outline, actual filled up to the review month, re-forecast dashed after it.
 * The review month carries the accent.
 */
function Cadence({ r }: { r: Run }) {
  const W = 720;
  const H = 240;
  const top = 26;
  const base = H - 30;
  const max = Math.max(...r.plan.map((m) => m.revenue), ...r.forecast.map((m) => m.revenue)) * 1.08;
  const slot = (W - 24) / 12;
  const bw = slot * 0.52;
  const y = (v: number) => base - (v / max) * (base - top);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label={`Monthly revenue, plan against actual through ${r.monthName} and the re-forecast after it.`}>
      <line x1="12" x2={W - 12} y1={base} y2={base} stroke="var(--line)" />
      {r.plan.map((m, i) => {
        const cx = 12 + slot * i + slot / 2;
        const done = i < r.n;
        const value = done ? r.actual[i]!.revenue : r.forecast[i]!.revenue;
        const current = i === r.n - 1;
        return (
          <g key={i} style={anim("rise", 500, 80 + i * 60)}>
            <rect x={cx - bw / 2} y={y(value)} width={bw} height={base - y(value)} rx="3" fill={done ? (current ? "var(--accent)" : "var(--brand)") : "none"} stroke={done ? "none" : "var(--muted)"} strokeDasharray={done ? undefined : "4 3"} strokeWidth="1.5" />
            <line x1={cx - bw / 2 - 4} x2={cx + bw / 2 + 4} y1={y(m.revenue)} y2={y(m.revenue)} stroke="var(--ink)" strokeWidth="2" />
            <text x={cx} y={H - 10} fontSize="11" textAnchor="middle" fill={current ? "var(--ink)" : "var(--muted)"} fontWeight={current ? 600 : 400}>
              {MONTH_NAMES[i]}
            </text>
          </g>
        );
      })}
      <g fontSize="11" fill="var(--muted)">
        <rect x="12" y="6" width="10" height="10" rx="2" fill="var(--brand)" />
        <text x="27" y="15">Actual</text>
        <line x1="78" x2="96" y1="11" y2="11" stroke="var(--ink)" strokeWidth="2" />
        <text x="101" y="15">Plan</text>
        <rect x="140" y="6" width="10" height="10" rx="2" fill="none" stroke="var(--muted)" strokeDasharray="3 2" />
        <text x="155" y="15">Re-forecast</text>
      </g>
    </svg>
  );
}

export function Landing() {
  const [month, setMonth] = useState(DEFAULT_SCENARIO.month);
  const s = { ...DEFAULT_SCENARIO, month };
  const r = run(s);
  const ytd = r.ytd.actual - r.ytd.plan;
  const gap = Math.max(0, r.fy.gap);
  const closed = gap > 0 ? Math.min(1, r.portfolio.expected / gap) : 1;
  const driver = [...r.bridge].sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))[0];
  const start = href("plan", s);
  const faq = "/faq";

  return (
    <div className="min-h-dvh">
      <Header
        actions={
          <>
            <nav aria-label="Sections" className="mr-3 hidden items-center gap-6 text-sm text-muted md:flex">
              <a href="#how" className="transition hover:text-ink">
                How it works
              </a>
              <a href="/sources" onClick={linkClick("/sources")} className="transition hover:text-ink">
                Sources
              </a>
              <a href={faq} onClick={linkClick(faq)} className="transition hover:text-ink">
                FAQ
              </a>
            </nav>
            <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-3.5 py-2 text-sm font-semibold text-on-brand transition hover:opacity-90">
              Start <ArrowRight className="size-4" aria-hidden />
            </a>
          </>
        }
      />

      <main>
        <section className="mx-auto max-w-[1320px] px-4 pt-16 text-center sm:px-8 sm:pt-24">
          <p className="kicker">Monthly business review</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.045em] text-balance sm:text-6xl">
            Are we on plan, and <span className="whitespace-nowrap underline decoration-accent decoration-[5px] underline-offset-[10px]">why not</span>?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-ink-2">The variance bridge, the KPI tree, and what to fund to close the gap.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-5">
            <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
              Start <ArrowRight className="size-4" aria-hidden />
            </a>
            <a href={faq} onClick={linkClick(faq)} className="inline-flex items-center gap-1.5 font-semibold text-ink transition hover:text-brand-ink">
              See the method <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-[1100px] px-4 sm:px-8" aria-label="Review preview">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Review month</span>
            <MonthSelect value={month} onChange={setMonth} className="w-52" />
          </div>
          <div className="rounded-[8px] border border-line bg-surface p-3 pb-12">
            <Cadence key={month} r={r} />
          </div>
          <div className="relative mx-auto -mt-8 max-w-[960px] rounded-[8px] border border-line bg-surface p-4 shadow-[0_10px_30px_rgb(15_38_41/0.08)] sm:mx-8 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3 text-sm">
              <span className="font-semibold">
                {COMPANY} · {r.monthName} review
              </span>
              <span className="text-xs text-muted">fictional company · illustrative figures</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[6px] border border-accent p-3 shadow-[inset_0_3px_0_var(--accent)]">
                <p className="text-xs text-muted">
                  Revenue vs plan, year to date
                  <TrustTag kind="modeled" />
                </p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight">{signed(ytd, formatMoney)}</p>
              </div>
              <div className="rounded-[6px] border border-line p-3">
                <p className="text-xs text-muted">
                  Full-year gap to plan
                  <TrustTag kind="modeled" />
                </p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight">{formatMoney(gap)}</p>
              </div>
              <div className="rounded-[6px] border border-line p-3">
                <p className="text-xs text-muted">
                  Gap closed by funded work
                  <TrustTag kind="modeled" />
                </p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight">{gap > 0 ? pct(closed) : "n/a"}</p>
              </div>
            </div>
            {driver && (
              <p className="mt-3 flex flex-wrap justify-between gap-2 rounded-[5px] bg-brand-soft px-3 py-2 text-sm text-brand-ink">
                <span>Largest driver: {driver.label}</span>
                <span className="font-mono font-semibold">{signed(driver.effect, formatMoney)}</span>
              </p>
            )}
          </div>
        </section>

        <section id="how" className="mt-16 scroll-mt-20 bg-panel text-panel-ink">
          <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">How it works</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {STEPS.map((st) => (
                <li key={st.title} className="border-t border-white/20 pt-4">
                  <h3 className="text-lg font-semibold">{st.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-6 text-panel-muted">{st.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-sm text-panel-muted">Weekly review · monthly business review · quarterly OKR check-in · annual plan.</p>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-4 py-16 sm:px-8">
          <h2 className="text-3xl font-semibold tracking-[-0.035em]">Run your own review.</h2>
          <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
