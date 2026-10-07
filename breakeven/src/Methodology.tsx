import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect } from "react";
import { linkClick } from "@/components/Brand";
import { PlanFrame, usePlan } from "@/components/PlanFrame";
import { stepHref } from "@/lib/plan";
import { BRIDGE_FORMULAS, BRIDGE_METHODOLOGY } from "@/lib/bridgeMethodology";
import { CHECKED, CONFIDENCE_KEY, FORMULAS, METHODOLOGY, NOT_INCLUDED, type Confidence, type Source } from "@/lib/methodology";

const SECTIONS = [
  { href: "#model", label: "The model" },
  { href: "#defaults", label: "Defaults & sources" },
  { href: "#speed-to-power", label: "Speed-to-Power" },
  { href: "#limits", label: "What's not included" },
];

/** Sources: the formulas and every default, with its range, reasoning, sources and confidence. */
export function Methodology() {
  const [plan] = usePlan("sources");
  // Links like /methodology#speed-to-power open on that section.
  useEffect(() => {
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <PlanFrame route="sources" plan={plan} strip={false} bare>
        <section className="border-b border-line bg-bg">
          <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
            <p className="kicker">Sources</p>
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
            <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2">
              {SECTIONS.map((n) => (
                <a key={n.href} href={n.href} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-2 transition hover:border-brand hover:text-ink">
                  {n.label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <section id="model" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] lg:gap-16">
            <div>
              <p className="kicker">The model</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">{FORMULAS.length} formulas, no black box</h2>
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

        <section id="defaults" className="scroll-mt-24 border-y border-line bg-bg py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="kicker">Defaults & sources</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
                {METHODOLOGY.length} assumptions, each with a source
              </h2>
            </div>
            <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
              {CONFIDENCE_KEY.map((c) => (
                <div key={c.level} className="bg-surface p-4">
                  <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-ink">{c.level}</dt>
                  <dd className="mt-1 text-sm leading-6 text-ink-2">{c.meaning}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {METHODOLOGY.map((m) => (
                <SourceCard {...m} key={m.key} />
              ))}
            </div>
          </div>
        </section>

        <section id="speed-to-power" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] lg:gap-16">
              <div>
                <p className="kicker">Speed-to-Power</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">When the grid is late</h2>
                <p className="mt-4 text-lg leading-8 text-ink-2">
                  Each way to bridge a late grid connection is costed as extra spending versus owning the cluster on a working grid from day
                  one. Until an option is ready, you rent.
                </p>
                <a href={stepHref("power-it", plan)} onClick={linkClick(stepHref("power-it", plan))} className="mt-5 inline-flex items-center gap-2 font-semibold text-brand-ink">
                  Open Speed-to-Power <ArrowRight className="size-4" aria-hidden />
                </a>
              </div>
              <dl className="divide-y divide-line rounded-2xl border border-line bg-bg">
                {BRIDGE_FORMULAS.map((f) => (
                  <div key={f.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                    <dt className="font-semibold">{f.label}</dt>
                    <dd className="font-mono text-[13px] leading-6 text-ink-2">{f.formula}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {BRIDGE_METHODOLOGY.map((m) => (
                <SourceCard key={m.label} {...m} />
              ))}
            </div>
          </div>
        </section>

        <section id="limits" className="scroll-mt-24 py-16 sm:py-20">
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
              href={stepHref("run-it", plan)}
              onClick={linkClick(stepHref("run-it", plan))}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-[#2a1458] transition hover:bg-white/90"
            >
              Back to step 2 <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        </section>
    </PlanFrame>
  );
}

/** One assumption: its value, the range we found, why we chose it, and the sources with their confidence. */
function SourceCard({ label, confidence, value, range, why, sources }: { label: string; confidence: Confidence; value: string; range: string; why: string; sources: Source[] }) {
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-2">{label}</p>
        <span className="rounded-full border border-line bg-bg px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-2">
          {confidence}
        </span>
      </div>
      <p className="mt-1 font-mono text-xl font-semibold tracking-tight">{value}</p>
      <dl className="mt-4 grid gap-3 text-[15px] leading-7">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Range we found</dt>
          <dd className="text-ink-2">{range}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Why this value</dt>
          <dd className="text-ink-2">{why}</dd>
        </div>
      </dl>
      <ul className="mt-auto space-y-1.5 border-t border-line pt-4 text-sm">
        {sources.map((s) => (
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
  );
}
