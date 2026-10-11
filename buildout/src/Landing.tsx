import { ArrowRight } from "lucide-react";
import { Footer, Header, href, linkClick } from "@/components/Frame";
import { FilingsIde } from "@/components/FilingsIde";
import { DEFAULT_SCENARIO } from "@/lib/scenario";

const STEPS = [
  { title: "Capex", body: "Quarterly capital spending, straight from the filings." },
  { title: "Returns", body: "Capex intensity, free cash flow and depreciation." },
  { title: "Suppliers", body: "How much of the spend lands at the suppliers." },
];

export function Landing() {
  const start = href("spend", DEFAULT_SCENARIO);
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
        <section className="mx-auto max-w-[1320px] px-4 pb-8 pt-12 sm:px-8 sm:pt-16">
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
                View analysis <ArrowRight className="size-4" aria-hidden />
              </a>
              <a href={faq} onClick={linkClick(faq)} className="inline-flex items-center gap-1.5 font-semibold text-ink transition hover:text-brand-ink">
                See the method <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] px-4 sm:px-8" aria-label="Filings explorer">
          <FilingsIde />
        </section>

        <section id="how" className="mt-16 scroll-mt-20 bg-panel text-panel-ink">
          <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-8">
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">Approach</h2>
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
