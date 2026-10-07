import { ArrowRight } from "lucide-react";
import { Footer, Logo, href, linkClick } from "@/components/Frame";
import { formatMillions, formatQuarter, pct, signedPct } from "@/lib/data";
import { headline, readThrough } from "@/lib/metrics";
import { DEFAULT_SCENARIO } from "@/lib/scenario";

const STEPS = [
  { n: 1, title: "Spend", body: "Quarterly capex for Microsoft, Alphabet, Amazon, Meta, Apple and Oracle, from their filings." },
  { n: 2, title: "Payoff", body: "Capex as a share of revenue, free cash flow after the build, and the depreciation wave to come." },
  { n: 3, title: "Receivers", body: "How much of the spend shows up as revenue at NVIDIA, Broadcom, Vertiv and Eaton." },
];

export function Landing() {
  const start = href("spend", DEFAULT_SCENARIO);
  const h = headline();
  const r = readThrough("2022Q4");
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 px-3 pt-3">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 rounded-full border border-line bg-surface py-2 pl-4 pr-2">
          <Logo />
          <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:opacity-90">
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>
      </header>
      <main>
        <section className="mx-auto max-w-[1200px] px-4 pb-14 pt-16 sm:px-6 sm:pt-24">
          <p className="kicker">AI infrastructure · market intelligence · SEC filings</p>
          <h1 className="mt-5 max-w-4xl text-[3rem] font-extrabold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
            How much is Big Tech spending on AI, and <span className="text-brand">who's getting the money?</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-2 sm:text-xl sm:leading-9">
            Buildout tracks the AI build-out quarter by quarter from official filings: what six giants spend, whether it's paying off, and where the dollars land.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
              See the spend <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
          <dl className="mt-10 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {[
              [`Capex, ${formatQuarter(h.quarter)}`, formatMillions(h.capex)],
              ["Year on year", h.yoy === null ? "–" : signedPct(h.yoy)],
              ["Capex ÷ revenue", pct(h.intensity, 1)],
              ["Supplier $ per capex $", r.perDollar === null ? "–" : `$${r.perDollar.toFixed(2)}`],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface p-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{k}</dt>
                <dd className="mt-1 font-mono text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6">
          <p className="kicker">How it works</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-5xl">Three steps, one quarterly note.</h2>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
            {STEPS.map((st) => (
              <li key={st.n} className="bg-surface p-7">
                <span className="grid size-8 place-items-center rounded-full bg-brand font-mono text-sm font-semibold text-on-brand">{st.n}</span>
                <h3 className="mt-6 text-xl font-bold tracking-tight">{st.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-ink-2">{st.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Footer />
    </div>
  );
}
