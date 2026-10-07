import { ArrowRight } from "lucide-react";
import { Footer, Logo, href, linkClick } from "@/components/Frame";
import { PRODUCTS, formatUnits, pct } from "@/lib/products";
import { run } from "@/lib/run";
import { defaultScenario } from "@/lib/scenario";

const STEPS = [
  { n: 1, title: "Forecast", body: "Score three forecasting methods on real demand history and pick the most accurate." },
  { n: 2, title: "Plan", body: "Set a service level and get safety stock, order size, a monthly plan and a launch quantity." },
  { n: 3, title: "Allocate", body: "Cut supply and split what's left across regions: fair share, priority or most margin." },
  { n: 4, title: "Ripple", body: "Watch small demand swings grow into big ones up the supply chain, and what shrinks them." },
  { n: 5, title: "Deliver", body: "See what drives late deliveries in 180,000 real orders, and how often each region gets its goods on time." },
];

export function Landing() {
  const start = href("forecast", defaultScenario(PRODUCTS[0]!.id));
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 px-3 pt-3">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 rounded-full border border-line bg-surface py-2 pl-4 pr-2">
          <Logo />
          <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-ink">
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-[1200px] px-4 pb-14 pt-16 sm:px-6 sm:pt-24">
          <p className="kicker">Supply chain · demand planning · S&OP</p>
          <h1 className="mt-5 max-w-4xl text-[3rem] font-extrabold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
            How much should we build, and <span className="text-brand">where should it go?</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-2 sm:text-xl sm:leading-9">
            Throughline forecasts demand from real public US data, turns it into a supply plan with safety stock and launch quantities, splits scarce supply across
            regions, and shows how small swings grow up the chain.
          </p>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 sm:px-6" aria-label="Products">
          <div className="grid gap-4 md:grid-cols-2">
            {PRODUCTS.map((p) => {
              const r = run(defaultScenario(p.id));
              const to = href("forecast", defaultScenario(p.id));
              return (
                <a key={p.id} href={to} onClick={linkClick(to)} className="group flex flex-col rounded-3xl border border-line bg-surface p-6 transition hover:border-brand">
                  <p className="kicker">{p.kind}</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">{p.name}</h2>
                  <p className="mt-1 text-sm text-ink-2">{p.tagline}</p>
                  <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Next 12 months</dt>
                      <dd className="font-mono text-lg font-semibold">{formatUnits(r.fc.forecast.reduce((a, b) => a + b, 0))}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Safety stock</dt>
                      <dd className="font-mono text-lg font-semibold">{formatUnits(r.plan.safetyStock)}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Supplier swing</dt>
                      <dd className="font-mono text-lg font-semibold">{r.ripple.ratios.at(-1)!.toFixed(0)}×</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-muted">
                    Forecast error {pct(r.fc.scores.find((x) => x.method === r.fc.method)!.wape, 1)} · {p.defaults.leadMonths}-month lead time
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold">
                    Plan the {p.name} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
          <p className="kicker">How it works</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-5xl">Five steps, one weekly update.</h2>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-5">
            {STEPS.map((st) => (
              <li key={st.n} className="bg-surface p-7">
                <span className="grid size-8 place-items-center rounded-full bg-brand font-mono text-sm font-semibold text-on-brand">{st.n}</span>
                <h3 className="mt-6 text-xl font-bold tracking-tight">{st.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-ink-2">{st.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-3xl text-ink-2">
            The products and company are fictional. The demand history is real US Census data, delivery performance comes from the public DataCo supply chain dataset, and every price, cost and lead time is a labeled assumption
            you can change.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
