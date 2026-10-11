import { ArrowRight } from "lucide-react";
import { Footer, Header, href, linkClick } from "@/components/Frame";
import { anim } from "@/components/Motion";
import { TrustTag } from "@/components/ui";
import { formatMillions, formatQuarter, signedPct, type Company } from "@/lib/data";
import { back, headline, quarterRange, valueAt } from "@/lib/metrics";
import { DEFAULT_SCENARIO } from "@/lib/scenario";

const STEPS = [
  { title: "Capex", body: "Quarterly capital spending, straight from the filings." },
  { title: "Returns", body: "Capex intensity, free cash flow and depreciation." },
  { title: "Suppliers", body: "How much of the spend lands at the suppliers." },
];

/** One small chart per company: quarterly capex since 2020, the fastest grower in the accent colour. */
function Spark({ c, qs, accent, i }: { c: Company; qs: string[]; accent: boolean; i: number }) {
  const vals = qs.map((q) => valueAt(c, q, "capex"));
  const nums = vals.filter((v): v is number => v !== null);
  const max = Math.max(...nums);
  const W = 160;
  const H = 52;
  const pts = vals
    .map((v, k) => (v === null ? null : `${((k / (qs.length - 1)) * W).toFixed(1)},${(H - (v / max) * (H - 4)).toFixed(1)}`))
    .filter(Boolean)
    .join(" ");
  const latest = valueAt(c, qs.at(-1)!, "capex");
  return (
    <div className="min-w-0 border-line p-3 [&:nth-child(n+4)]:border-t sm:[&:not(:nth-child(3n+1))]:border-l">
      <div className="flex items-baseline justify-between gap-2 font-mono text-[11px]">
        <span className="font-semibold">{c.ticker}</span>
        <span className="text-muted">{latest === null ? "–" : formatMillions(latest)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-12 w-full" preserveAspectRatio="none" aria-hidden style={anim("wipe", 900, 150 + i * 90, "std")}>
        <polyline points={pts} fill="none" stroke={accent ? "var(--accent)" : "var(--ink)"} strokeWidth={accent ? 2.25 : 1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Landing() {
  const start = href("spend", DEFAULT_SCENARIO);
  const faq = "/faq";
  const h = headline();
  const qs = quarterRange("2020Q1", h.quarter);
  const yearAgo = back(h.quarter, 4);

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
        <section className="mx-auto max-w-[1320px] px-4 pb-8 pt-14 sm:px-8 sm:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="kicker">AI capital spending</p>
              <h1 className="mt-4 max-w-3xl text-[2.3rem] font-semibold leading-[1.08] tracking-[-0.05em] sm:text-[3.4rem]">
                How much is Big Tech <span className="underline decoration-accent decoration-[5px] underline-offset-[10px]">spending</span>?
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-ink-2">Quarterly capex for six companies, straight from 10-Q and 10-K filings.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
                Start <ArrowRight className="size-4" aria-hidden />
              </a>
              <a href={faq} onClick={linkClick(faq)} className="inline-flex items-center gap-1.5 font-semibold text-ink transition hover:text-brand-ink">
                See the method <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] px-4 sm:px-8" aria-label="Latest quarter">
          <div className="grid gap-3 md:grid-cols-3 md:grid-rows-[auto_auto]">
            <div className="flex flex-col justify-between rounded-[7px] border border-accent bg-surface p-5 shadow-[inset_0_3px_0_var(--accent)] md:row-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Capex, six spenders · {formatQuarter(h.quarter)}
                <TrustTag kind="data" />
              </p>
              <p className="my-6 font-mono text-5xl font-semibold tracking-[-0.04em] sm:text-6xl" style={anim("rise", 700, 100)}>
                {formatMillions(h.capex)}
              </p>
              <p className="text-sm text-ink-2">Microsoft, Alphabet, Amazon, Meta, Apple and Oracle, calendar quarters.</p>
            </div>
            <div className="rounded-[7px] border border-line bg-surface md:col-span-2">
              <p className="border-b border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Quarterly capex since 2020</p>
              <div className="grid grid-cols-2 sm:grid-cols-3">
                {h.ranked.map((r, i) => (
                  <Spark key={r.c.ticker} c={r.c} qs={qs} accent={r.c.ticker === h.fastest.c.ticker} i={i} />
                ))}
              </div>
            </div>
            <div className="rounded-[7px] border border-line bg-surface p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Year on year, vs {formatQuarter(yearAgo)}
                <TrustTag kind="modeled" />
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">{h.yoy === null ? "–" : signedPct(h.yoy)}</p>
            </div>
            <div className="rounded-[7px] border border-line bg-surface p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Annual pace
                <TrustTag kind="modeled" />
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">{formatMillions(h.runRate)}</p>
            </div>
          </div>
          {h.fastest.yoy !== null && (
            <p className="mt-3 flex flex-wrap justify-between gap-2 rounded-[6px] bg-brand-soft px-4 py-3 text-sm text-brand-ink">
              <span>Fastest grower: {h.fastest.c.short}</span>
              <span className="font-mono font-semibold">{signedPct(h.fastest.yoy)} y/y</span>
            </p>
          )}
        </section>

        <section id="how" className="mt-16 scroll-mt-20 bg-panel text-panel-ink">
          <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-8">
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">How it works</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {STEPS.map((st) => (
                <li key={st.title} className="border-t border-white/20 pt-4">
                  <h3 className="text-lg font-semibold">{st.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-6 text-panel-muted">{st.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-4 py-16 sm:px-8">
          <h2 className="text-3xl font-semibold tracking-[-0.05em]">Read the latest quarter.</h2>
          <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
