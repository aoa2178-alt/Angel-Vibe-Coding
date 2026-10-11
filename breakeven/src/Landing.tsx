import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { OPTIONS } from "@/components/options";
import { linkClick } from "@/components/Brand";
import { PillBar, SiteFooter } from "@/components/Site";
import { DEFAULT_ASSUMPTIONS, DEFAULT_WORKLOAD, cheapest, compare, formatTokensM, formatUsd } from "@/lib/tco";

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "/sources", label: "Sources" },
  { href: "/faq", label: "FAQ" },
];

/** The path through Breakeven: three steps, then one page with the recommendation. */
const STEPS = [
  {
    n: "01",
    href: "/worth-it",
    label: "Evaluate AI ROI",
    body: "Savings, payback and 12-month ROI.",
  },
  {
    n: "02",
    href: "/run-it",
    label: "Compare compute costs",
    body: "API, rented or owned GPUs, on total cost.",
  },
  {
    n: "03",
    href: "/power-it",
    label: "Power planning",
    body: "Power availability and grid-delay options.",
  },
];

function CtaLink({ to, children, variant = "primary" }: { to: string; children: ReactNode; variant?: "primary" | "light" }) {
  const styles = { primary: "bg-brand text-white hover:bg-[#2c4058]", light: "bg-white text-[#182536] hover:bg-white/90" }[variant];
  return (
    <a href={to} onClick={linkClick(to)} className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[5px] px-5 py-3.5 text-[15px] font-semibold transition ${styles}`}>
      {children}
    </a>
  );
}

export function Landing() {
  const costs = compare(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS);
  const winner = cheapest(costs);
  const runnerUp = Object.values(costs)
    .filter((c) => c.id !== winner)
    .sort((a, b) => a.monthly - b.monthly)[0]!;

  return (
    <div className="min-h-dvh bg-bg">
      <PillBar
        nav={NAV}
        actions={
          <a
            href="/worth-it"
            onClick={linkClick("/worth-it")}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c4058]"
          >
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        }
      />

      <main>
        {/* The question, a short aside, then the three costs at the default workload. */}
        <section className="mx-auto max-w-[1320px] px-4 sm:px-8">
          <div className="pb-12 pt-16 sm:pt-24">
            <div>
              <p className="kicker">Compute economics, made explicit.</p>
              <h1 className="mt-4 text-[3.2rem] font-semibold leading-[0.96] tracking-[-0.065em] sm:text-7xl lg:text-[5.4rem]">
                <span className="underline decoration-[#79aa9f] decoration-4 underline-offset-[7px]">API</span>, cloud GPUs, or your own hardware?
              </h1>
              <p className="mt-6 max-w-[620px] text-lg leading-7 text-muted">Total cost of ownership at your volume, and the volumes where the answer changes.</p>
              <div className="mt-7 flex flex-wrap items-center gap-6">
                <CtaLink to="/worth-it">
                  Start <ArrowRight className="size-4" aria-hidden />
                </CtaLink>
                <a href="/run-it" onClick={linkClick("/run-it")} className="text-[15px] font-semibold text-ink underline-offset-4 hover:underline">
                  Go to the cost comparison <ArrowRight className="inline size-4" aria-hidden />
                </a>
              </div>
              <p className="mt-3 text-sm text-muted">No sign-up required.</p>
            </div>
          </div>

          <div className="mb-20 rounded-[7px] border border-line bg-surface p-5 shadow-[0_10px_35px_rgb(26_39_48/0.08)] sm:mb-28 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-4">
              <p className="font-semibold">One workload. Three ways to run it.</p>
              <p className="text-xs text-muted">{formatTokensM(DEFAULT_WORKLOAD.tokensM)} tokens a month · default assumptions</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(["api", "rent", "own"] as const).map((id) => (
                <div key={id} className={`rounded-[5px] border p-4 ${id === winner ? "border-[#4f9588]" : "border-line"}`}>
                  <p className="flex items-center justify-between gap-2 font-semibold">
                    <span className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${OPTIONS[id].swatch}`} aria-hidden />
                      {OPTIONS[id].short}
                    </span>
                    {id === winner && <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-ink">Lowest cost</span>}
                  </p>
                  <p className="mt-3 text-[28px] font-semibold tracking-tight">
                    {formatUsd(costs[id].monthly)}
                    <span className="ml-1.5 text-sm font-normal text-muted">/ month</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">{formatUsd(costs[id].perM, 2)} per million tokens</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap justify-between gap-2 bg-brand-soft px-4 py-3.5 text-sm text-[#335f57]">
              <span>{OPTIONS[winner].name} has the lowest estimated monthly cost</span>
              <span className="font-semibold">
                {formatUsd(runnerUp.monthly - costs[winner].monthly)} less than {OPTIONS[runnerUp.id].short}
              </span>
            </div>
          </div>
        </section>

        {/* How it works: three steps on a navy band. */}
        <section id="how" className="dark-scope scroll-mt-20">
          <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 sm:py-24">
            <p className="kicker">How it works</p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.03em] sm:text-4xl">Three steps to a decision.</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="border-t border-white/20 pt-5">
                  <p className="text-xs text-white/60">{s.n}</p>
                  <a href={s.href} onClick={linkClick(s.href)} className="mt-1 inline-block font-semibold text-white hover:underline">
                    {s.label}
                  </a>
                  <p className="mt-1.5 text-[15px] leading-6 text-white/75">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing call to action. */}
        <section className="dark-scope">
          <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-6 px-4 py-16 sm:px-8 md:flex-row md:items-center md:justify-between">
            <h2 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">Model your own scenario.</h2>
            <CtaLink to="/worth-it" variant="light">
              Start <ArrowRight className="size-4" aria-hidden />
            </CtaLink>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
