import { ArrowRight } from "lucide-react";
import { useScores } from "./SitesStep";
import { Footer, Header, href, linkClick } from "@/components/Frame";
import { anim } from "@/components/Motion";
import { UsMap } from "@/components/UsMap";
import { TrustTag } from "@/components/ui";
import { RETRIEVED, SITES, formatMw, mwAt, stateName } from "@/lib/data";
import { byState, totalMw } from "@/lib/metrics";
import { DEFAULT_SCENARIO } from "@/lib/scenario";

const STEPS = [
  { title: "AI sites", body: "Every US frontier AI data center, sized by the power it draws." },
  { title: "Grid and power", body: "Power prices by state and grid-connection waits by region." },
  { title: "Site selection", body: "A DEA scorer finds the states no others beat on price and wait." },
];

export function Landing() {
  const start = href("map", DEFAULT_SCENARIO);
  const faq = "/faq";
  const totals = byState(RETRIEVED);
  const { front } = useScores("industrial", RETRIEVED);
  const sites = SITES.map((site) => ({ site, mw: mwAt(site, RETRIEVED) }));
  const planned = totalMw("2028-12-31");

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

      <main className="mx-auto max-w-[1320px] px-4 sm:px-8">
        <section className="pt-14 sm:pt-20">
          <p className="kicker">AI data centers and the grid</p>
          <h1 className="mt-4 max-w-4xl text-[3rem] leading-[1] tracking-[-0.035em] sm:text-[5.5rem]">
            Where is AI being <span className="underline decoration-accent decoration-[5px] underline-offset-[10px]">built</span>?
          </h1>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-b border-ink pb-6">
            <p className="max-w-lg text-lg leading-8 text-ink-2">{SITES.length} sites, the power they draw, and where the grid connects fastest.</p>
            <div className="flex flex-wrap items-center gap-5">
              <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
                Start <ArrowRight className="size-4" aria-hidden />
              </a>
              <a href={faq} onClick={linkClick(faq)} className="inline-flex items-center gap-1.5 font-semibold text-ink transition hover:text-brand-ink">
                See the method <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <section className="grid items-center gap-10 py-12 lg:grid-cols-[0.8fr_1.4fr]" aria-label="Map preview">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              AI power planned by end of 2028
              <TrustTag kind="data" />
            </p>
            <p className="mt-3 font-serif text-[6rem] leading-none tracking-[-0.04em] text-accent" style={anim("rise", 700, 100)}>
              {formatMw(planned)}
            </p>
            <p className="mt-5 text-[15px] leading-7 text-ink-2">
              Up from <span className="font-semibold text-ink">{formatMw(totalMw(RETRIEVED))}</span> drawing power today. On the price-and-wait frontier:{" "}
              <span className="font-semibold text-ink">{front.map((u) => stateName(u.id)).join(", ")}</span>.
            </p>
          </div>
          <div className="rounded-[7px] border border-line bg-surface p-4 sm:p-5">
            <UsMap date={RETRIEVED} sites={sites} totals={totals} selected="" onSelect={(code) => (window.location.href = href("map", { ...DEFAULT_SCENARIO, state: code }))} />
          </div>
        </section>

        <section className="grid border-t border-line sm:grid-cols-2" aria-label="Key figures">
          <div className="py-5 sm:pr-8">
            <p className="text-xs text-muted">
              AI power drawn today
              <TrustTag kind="data" />
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tracking-tight">{formatMw(totalMw(RETRIEVED))}</p>
          </div>
          <div className="border-line py-5 sm:border-l sm:pl-8">
            <p className="text-xs text-muted">
              Sites tracked
              <TrustTag kind="data" />
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tracking-tight">{SITES.length}</p>
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-t border-ink pb-16 pt-10">
          <h2 className="text-3xl tracking-[-0.02em]">How it works</h2>
          <ol className="mt-6">
            {STEPS.map((st, i) => (
              <li key={st.title} className="grid grid-cols-[3rem_11rem_1fr] gap-4 border-t border-line py-4 text-[15px] max-sm:grid-cols-[2.5rem_1fr]">
                <span className="font-mono text-sm font-semibold text-accent">0{i + 1}</span>
                <span className="font-semibold">{st.title}</span>
                <span className="text-ink-2 max-sm:col-start-2">{st.body}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-6 border-t border-ink py-14">
          <h2 className="text-4xl tracking-[-0.02em]">Score your own site.</h2>
          <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
