import { ArrowRight, ArrowUpRight } from "lucide-react";
import { linkClick } from "@/components/Brand";
import { SiteFooter, SiteHeader } from "@/components/Site";
import { CHECKED, FORMULAS, METHODOLOGY, NOT_INCLUDED } from "@/lib/methodology";

const NAV = [
  { href: "#model", label: "The model" },
  { href: "#defaults", label: "Defaults & sources" },
  { href: "#limits", label: "What's not included" },
];

export function Methodology() {
  return (
    <div className="min-h-dvh bg-surface">
      <SiteHeader nav={NAV} />

      <main>
        <section className="border-b border-line bg-bg">
          <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
            <p className="kicker">Methodology</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] text-balance sm:text-6xl">
              Where every number comes from
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-2 text-pretty">
              Breakeven's defaults are a starting point, not a quote. Each one below shows the value the calculator uses, the range
              we found, why we picked it, and the sources. Every one of them is editable in the calculator.
            </p>
            <p className="mt-6 inline-flex rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-ink-2">
              Sources checked {CHECKED}
            </p>
          </div>
        </section>

        <section id="model" className="scroll-mt-16 py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] lg:gap-16">
            <div>
              <p className="kicker">The model</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Seven formulas, no black box</h2>
              <p className="mt-4 text-lg leading-8 text-ink-2">
                Each option's monthly cost is worked out from your volume and the assumptions below. “Show calculations” in the
                calculator writes them out with your own numbers.
              </p>
            </div>
            <dl className="divide-y divide-line rounded-2xl border border-line bg-bg">
              {FORMULAS.map((f) => (
                <div key={f.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="font-semibold">{f.label}</dt>
                  <dd className="font-mono text-[13px] leading-6 text-ink-2">{f.formula}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="defaults" className="scroll-mt-16 border-y border-line bg-bg py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="kicker">Defaults & sources</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Nine assumptions, each with a source</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {METHODOLOGY.map((m) => (
                <article key={m.key} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
                  <p className="text-sm font-semibold text-ink-2">{m.label}</p>
                  <p className="mt-1 font-mono text-xl font-semibold tracking-tight">{m.value}</p>
                  <dl className="mt-4 grid gap-3 text-[15px] leading-7">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Range we found</dt>
                      <dd className="text-ink-2">{m.range}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Why this value</dt>
                      <dd className="text-ink-2">{m.why}</dd>
                    </div>
                  </dl>
                  <ul className="mt-auto space-y-1.5 border-t border-line pt-4 text-sm">
                    {m.sources.map((s) => (
                      <li key={s.url}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-start gap-1 font-medium text-brand-ink underline-offset-2 hover:underline"
                        >
                          {s.label}
                          <ArrowUpRight className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="limits" className="scroll-mt-16 py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] lg:gap-16">
            <div>
              <p className="kicker">What's not included</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Know the edges</h2>
              <p className="mt-4 text-lg leading-8 text-ink-2">A comparison is only as honest as what it leaves out.</p>
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {NOT_INCLUDED.map((item) => (
                <li key={item} className="flex gap-3 py-4 text-[15px] leading-7 text-ink-2">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 rounded-3xl bg-[#2a1458] px-6 py-14 text-center text-white">
            <h2 className="max-w-xl text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">Use your own numbers.</h2>
            <a
              href="/calculator"
              onClick={linkClick("/calculator")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-[#2a1458] transition hover:bg-white/90"
            >
              Open the calculator <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
