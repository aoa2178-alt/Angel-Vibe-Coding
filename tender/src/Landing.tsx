import { ArrowRight } from "lucide-react";
import { Footer, Logo, href, linkClick } from "@/components/Frame";
import { negotiation, ranked, shouldCost, spend } from "@/lib/analysis";
import { BUYER, DEFAULT_SETTINGS, formatMoney, pct } from "@/lib/data";

const STEPS = [
  { n: 1, title: "Spend", body: "See where the money goes, which categories are single-sourced, and where savings are realistic." },
  { n: 2, title: "Should-cost", body: "Build a transformer's price up from copper, steel and labor, priced from public data." },
  { n: 3, title: "Bids", body: "Compare four bids on total cost of ownership, score them, and decide how to split the award." },
  { n: 4, title: "Negotiate", body: "Set the walk-away and the target, and pick between spot, framework and capacity reservation." },
];

export function Landing() {
  const s = DEFAULT_SETTINGS;
  const start = href("spend", s);
  const sc = shouldCost();
  const t = ranked(s);
  const n = negotiation(s);
  const cheapest = [...t].sort((a, b) => a.price - b.price)[0]!;
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
          <p className="kicker">Procurement · strategic sourcing · AI infrastructure</p>
          <h1 className="mt-5 max-w-4xl text-[3rem] font-extrabold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
            What should it cost, who should we buy from, and <span className="text-brand">on what terms?</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-2 sm:text-xl sm:leading-9">
            Tender sources the power and cooling gear for {BUYER.name}'s {BUYER.itMw} MW AI data hall (a fictional buyer) using real public prices for copper, steel, wages and
            equipment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
              Start with the spend <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
          <dl className="mt-10 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {[
              ["Equipment spend", formatMoney(spend().grand)],
              ["Transformer should-cost", formatMoney(sc.total)],
              ["Prices vs costs since 2019", `+${pct(sc.ppiGrowth - 1)} vs +${pct(sc.costGrowth - 1)}`],
              ["Saving at target", formatMoney(n.savingsAtTarget)],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface p-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{k}</dt>
                <dd className="mt-1 font-mono text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 max-w-3xl text-sm text-ink-2">
            The cheapest quote ({cheapest.bid.supplier}, {formatMoney(cheapest.bid.price)} a unit) is the most expensive deal: its {cheapest.bid.leadMonths}-month lead time leaves the hall
            waiting.
          </p>
        </section>
        <section className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6">
          <p className="kicker">How it works</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-5xl">Four steps, one recommendation.</h2>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
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
