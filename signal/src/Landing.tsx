import { ArrowRight } from "lucide-react";
import { Footer, Logo, href, linkClick } from "@/components/Frame";
import { DEFAULT_AFFORD, afford } from "@/lib/afford";
import { CASES, byIso, pct, people, shortName } from "@/lib/data";
import { gap } from "@/lib/gap";
import { DEFAULT_SCENARIO } from "@/lib/scenario";

const STEPS = [
  { n: 1, title: "Gap", body: "How many people are offline, how many have no signal at all, and why the rest don't connect: the phone, the data, or skills." },
  { n: 2, title: "Afford", body: "Who can afford a phone and a data plan, fifth by fifth, and what pay-as-you-go phones, tax cuts and subsidies change." },
  { n: 3, title: "Build", body: "The cheapest way to cover each area, a budget that connects the most people, and the split between operators, the universal service fund and donors." },
];

export function Landing() {
  const start = href("gap", DEFAULT_SCENARIO);
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
          <p className="kicker">Digital access · development · public policy</p>
          <h1 className="mt-5 max-w-4xl text-[3rem] font-extrabold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
            Who is offline, and what would it take to <span className="text-brand">connect them?</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-2 sm:text-xl sm:leading-9">
            Signal sizes a country's digital divide on World Bank data, tests what makes being online affordable, and prices the build, down to who should pay for it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
              Start with Nigeria <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
          <ul className="mt-10 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {CASES.map((iso) => {
              const c = byIso(iso)!;
              const g = gap(c);
              const a = afford(c, DEFAULT_AFFORD);
              const to = href("gap", { ...DEFAULT_SCENARIO, country: iso });
              return (
                <li key={iso} className="bg-surface">
                  <a href={to} onClick={linkClick(to)} className="block p-4 transition hover:bg-sunken">
                    <span className="block text-sm font-semibold">{shortName(c)}</span>
                    <span className="mt-1 block font-mono text-lg font-semibold">{people(g.offline)}</span>
                    <span className="block text-xs text-muted">offline · {pct(a.share)} can afford a phone and data</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6">
          <p className="kicker">How it works</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-5xl">Three steps, one country memo.</h2>
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
