import { ArrowRight } from "lucide-react";
import { Footer, Logo, href, linkClick } from "@/components/Frame";
import { formatMoney } from "@/lib/model";
import { run } from "@/lib/run";
import { DEFAULT_SCENARIO } from "@/lib/scenario";

const CADENCE = [
  { when: "Weekly", what: "Business review", body: "Pipeline, usage and hiring against plan. Catch drift early." },
  { when: "Monthly", what: "Business review", body: "Plan vs actual, the variance bridge, the KPI tree and the re-forecast." },
  { when: "Quarterly", what: "OKR check-in", body: "Score the key results, re-prioritize initiatives, move budget." },
  { when: "Yearly", what: "Annual plan", body: "Set the drivers, the headcount, the budget and the OKRs." },
];

const STEPS = [
  { n: 1, title: "Plan", body: "Build the year from drivers each team owns: developers, usage, price, pipeline, win rate, reps." },
  { n: 2, title: "Review", body: "Compare any month to plan, split the gap into driver effects, and re-forecast the year." },
  { n: 3, title: "Prioritize", body: "Fund the initiatives with the most expected value that fit the budget and headcount left." },
];

export function Landing() {
  const start = href("plan", DEFAULT_SCENARIO);
  const review = href("review", DEFAULT_SCENARIO);
  const r = run(DEFAULT_SCENARIO);
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
          <p className="kicker">Strategy & operations · the operating rhythm</p>
          <h1 className="mt-5 max-w-4xl text-[3rem] font-extrabold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
            Are we on plan, why not, and <span className="text-brand underline decoration-[#b08a3e] decoration-4 underline-offset-8">what do we do?</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-2 sm:text-xl sm:leading-9">
            Keel runs the planning-and-review cycle for the commercial org of Halcyon AI, a fictional AI lab: a driver-based annual plan with OKRs, a monthly business
            review that explains every dollar of variance, and a funding decision that closes the gap.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
              Start with the plan <ArrowRight className="size-4" aria-hidden />
            </a>
            <a href={review} onClick={linkClick(review)} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3 font-semibold transition hover:border-brand">
              Jump to the {r.monthName} review
            </a>
          </div>
          <dl className="mt-10 grid max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {[
              ["Plan for the year", formatMoney(r.fy.plan)],
              [`Re-forecast at ${r.monthName}`, formatMoney(r.fy.forecast)],
              ["Gap to close", formatMoney(Math.max(0, r.fy.gap))],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface p-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{k}</dt>
                <dd className="mt-1 font-mono text-xl font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <p className="kicker">The operating cadence</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-5xl">A rhythm, not a scramble.</h2>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {CADENCE.map((c) => (
              <li key={c.when} className="bg-surface p-6">
                <p className="font-mono text-xs uppercase tracking-wider text-brass">{c.when}</p>
                <h3 className="mt-2 text-lg font-bold tracking-tight">{c.what}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-2">{c.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6">
          <p className="kicker">How it works</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-5xl">Three steps, one leadership update.</h2>
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
