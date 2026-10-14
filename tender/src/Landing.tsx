import { ArrowRight, Check } from "lucide-react";
import { Footer, Header, href, linkClick } from "@/components/Frame";
import { Collage } from "@/components/Collage";
import { BUYER, DEFAULT_SETTINGS } from "@/lib/data";

const STEPS = [
  { title: "Spend", body: "Where the money goes and where savings are realistic." },
  { title: "Should-cost", body: "A transformer priced up from copper, steel and labor." },
  { title: "Bid evaluation", body: "Four bids compared on total cost, not price." },
  { title: "Negotiation", body: "Walk-away, target, and the deal structure." },
];

export function Landing() {
  const s = DEFAULT_SETTINGS;
  const start = href("spend", s);
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

      <main className="mx-auto max-w-[1320px] px-4 sm:px-8">
        {/* The question, beside a collage of what Tender produces. */}
        <section className="grid items-center gap-10 pb-10 pt-12 sm:pt-16 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="kicker">Sourcing for an AI data hall</p>
            <h1 className="mt-4 text-[3rem] leading-[1] tracking-[-0.03em] sm:text-[5.5rem]">
              What <em>should</em> this cost?
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-ink-2">Should-cost from public commodity prices, bids compared on total cost, and a target price to negotiate to.</p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
                View analysis <ArrowRight className="size-4" aria-hidden />
              </a>
              <a href={faq} onClick={linkClick(faq)} className="inline-flex items-center gap-1.5 font-semibold text-ink transition hover:text-brand-ink">
                See the method <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
            <p className="mt-4 text-xs text-muted">
              {BUYER.name}, {BUYER.project}: three 80 MVA transformers for a {BUYER.itMw} MW AI data hall. Fictional buyer and suppliers; real commodity prices.
            </p>
          </div>
          <Collage s={s} />
        </section>

        <ul className="flex flex-wrap gap-x-8 gap-y-2 border-y border-line py-4 text-sm text-ink-2" aria-label="What every analysis holds to">
          {["Public commodity prices", "Total cost, not price", "A target to negotiate to", "Every number sourced"].map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Check className="size-4 text-accent" aria-hidden />
              {p}
            </li>
          ))}
        </ul>

        <section id="how" className="scroll-mt-20 pb-16 pt-10">
          <h2 className="text-3xl tracking-[-0.02em]">Approach</h2>
          <ol className="mt-6">
            {STEPS.map((st, i) => (
              <li key={st.title} className="grid grid-cols-[3rem_10rem_1fr] gap-4 border-t border-line py-4 text-[15px] max-sm:grid-cols-[2.5rem_1fr]">
                <span className="font-mono text-sm font-semibold text-accent">0{i + 1}</span>
                <span className="font-semibold">{st.title}</span>
                <span className="text-ink-2 max-sm:col-start-2">{st.body}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-6 border-t border-ink py-14">
          <h2 className="text-4xl tracking-[-0.02em]">Source your own category.</h2>
          <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
