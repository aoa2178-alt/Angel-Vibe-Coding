import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { COMPANY, Footer, Header, MonthSelect, href, linkClick } from "@/components/Frame";
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
 * The year as a tilted wall of twelve month blocks that drifts slowly: each block stands as tall as that month's revenue,
 * and the blocks float in a slow wave. Actuals up to the review month (lit), glassy re-forecasts after it. Each closed
 * month is a button that makes it the review month.
 */
function MonthWall({ r, onPick }: { r: Run; onPick: (m: number) => void }) {
  const max = Math.max(...r.actual.slice(0, r.n).map((m) => m.revenue), ...r.forecast.map((m) => m.revenue));
  return (
    <div className="keel-wall grid grid-cols-4 gap-[22px]">
      {r.plan.map((p, i) => {
        const done = i < r.n;
        const now = i === r.n - 1;
        const v = done ? r.actual[i]!.revenue : r.forecast[i]!.revenue;
        const d = v / p.revenue - 1;
        const kind = now ? "kt-now" : done ? "kt-done" : "kt-fc";
        return (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            disabled={!done}
            onClick={() => onPick(i + 1)}
            className={`kt ${kind}`}
            style={{ ["--h" as string]: `${Math.round(14 + (v / max) * 40)}px`, animationDelay: `${-(i % 4) * 0.45 - Math.floor(i / 4) * 0.7}s` }}
          >
            <span className="kt-shadow" />
            <span className="kt-side kt-n" />
            <span className="kt-side kt-w" />
            <span className="kt-side kt-s" />
            <span className="kt-side kt-e" />
            <span className="kt-top flex flex-col justify-between p-3.5 text-left">
              <span className={`text-[11px] tracking-[0.24em] ${now ? "text-[#bfe9df]" : "text-muted"}`}>
                {MONTH_NAMES[i]!.toUpperCase()}
                {done ? "" : " · FORECAST"}
              </span>
              <span className="font-mono text-[22px] font-semibold">{formatMoney(v)}</span>
              <span className={`text-xs ${now ? "text-[#bfe9df]" : d < 0 ? "text-risk" : "text-muted"}`}>{signed(d * 100, (x) => `${x.toFixed(1)}%`)} vs plan</span>
              <span className="block h-[5px] overflow-hidden rounded-[3px] bg-[#cfd9c8]">
                <i className="block h-full bg-accent" style={{ width: `${Math.min(100, (v / p.revenue) * 100)}%` }} />
              </span>
            </span>
          </button>
        );
      })}
    </div>
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
                Approach
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
        {/* The year as tiles: twelve monthly reviews on a slowly drifting wall, the review month lit. */}
        <section className="relative overflow-hidden bg-[#dfe6d9] pb-8 lg:min-h-[640px] lg:pb-24" aria-label="Review preview">
          <div className="relative z-10 mx-auto max-w-[1320px] px-4 pt-14 sm:px-8 sm:pt-20">
            <div className="max-w-[520px]">
              <p className="kicker">Monthly business review</p>
              <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl">
                Are we on plan, and <span className="whitespace-nowrap underline decoration-accent decoration-[5px] underline-offset-[10px]">why not</span>?
              </h1>
              <p className="mt-5 text-lg leading-8 text-ink-2">Variance by driver, a re-forecast, and what to fund to close the gap.</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <MonthSelect value={month} onChange={setMonth} className="w-52" />
                <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:opacity-90">
                  View analysis <ArrowRight className="size-4" aria-hidden />
                </a>
              </div>
            </div>
          </div>
          <div aria-hidden className="pointer-events-none relative mt-6 h-[360px] [perspective:1600px] sm:h-[480px] lg:absolute lg:top-10 lg:left-[53%] lg:mt-0 lg:h-[700px] lg:w-[860px]">
            <div className="pointer-events-auto absolute top-6 left-1/2 w-[734px] -translate-x-1/2 scale-[0.62] origin-top sm:scale-[0.85] lg:top-10 lg:left-[-40px] lg:translate-x-0 lg:scale-100">
              <MonthWall key={month} r={r} onPick={setMonth} />
            </div>
          </div>
          <div className="relative z-10 mx-auto flex lg:absolute lg:right-0 lg:bottom-6 lg:left-0 max-w-[1320px] flex-wrap items-center gap-2.5 px-4 sm:px-8">
            <span className="inline-flex items-baseline gap-2 rounded-full bg-[#fbfbf7]/90 px-3.5 py-2 text-[13px]">
              Revenue vs plan, YTD <b className={`font-mono ${ytd < 0 ? "text-risk" : ""}`}>{signed(ytd, formatMoney)}</b>
            </span>
            <span className="inline-flex items-baseline gap-2 rounded-full bg-[#fbfbf7]/90 px-3.5 py-2 text-[13px]">
              Full-year gap <b className="font-mono">{formatMoney(gap)}</b>
            </span>
            {gap > 0 && (
              <span className="inline-flex items-baseline gap-2 rounded-full bg-[#fbfbf7]/90 px-3.5 py-2 text-[13px]">
                Closed by funded work <b className="font-mono">{pct(closed)}</b>
              </span>
            )}
            {driver && (
              <span className="inline-flex items-baseline gap-2 rounded-full bg-[#fbfbf7]/90 px-3.5 py-2 text-[13px]">
                Largest driver <b className="font-mono">{driver.label} {signed(driver.effect, formatMoney)}</b>
              </span>
            )}
            <span className="inline-flex items-center text-xs text-muted">
              {COMPANY}, fictional · modeled
              <TrustTag kind="modeled" />
            </span>
          </div>
        </section>

        <section id="how" className="scroll-mt-20 bg-panel text-panel-ink">
          <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Approach</h2>
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
