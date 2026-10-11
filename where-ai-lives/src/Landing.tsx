import { ArrowRight } from "lucide-react";
import { Footer, Header, href, linkClick } from "@/components/Frame";
import { AtlasShowcase } from "@/components/AtlasShowcase";
import { TrustTag } from "@/components/ui";
import { RETRIEVED, SITES, formatMw } from "@/lib/data";
import { totalMw } from "@/lib/metrics";
import { DEFAULT_SCENARIO } from "@/lib/scenario";

const STEPS = [
  { title: "AI sites", body: "Every US frontier AI data center, sized by the power it draws." },
  { title: "Grid and power", body: "Power prices by state and grid-connection waits by region." },
  { title: "Site selection", body: "A DEA scorer finds the states no others beat on price and wait." },
];

export function Landing() {
  const start = href("map", DEFAULT_SCENARIO);
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

      <AtlasShowcase
        title={
          <>
            <p className="kicker">AI data centers and the grid</p>
            <h1 className="mt-4 text-[2.6rem] leading-[1] tracking-[-0.035em] sm:text-[4.2rem]">
              Where is AI being <span className="underline decoration-accent decoration-[5px] underline-offset-[10px]">built</span>?
            </h1>
            <div className="pointer-events-auto mt-6 flex flex-wrap items-center gap-5">
              <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
                View analysis <ArrowRight className="size-4" aria-hidden />
              </a>
              <a href={faq} onClick={linkClick(faq)} className="inline-flex items-center gap-1.5 font-semibold text-ink transition hover:text-brand-ink">
                See the method <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
          </>
        }
      />

      <main className="mx-auto max-w-[1320px] px-4 sm:px-8">
        <section className="grid sm:grid-cols-2" aria-label="Key figures">
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
          <h2 className="text-3xl tracking-[-0.02em]">Approach</h2>
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
