import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { OPTIONS } from "@/components/options";
import { linkClick } from "@/components/Brand";
import { Decode } from "@/components/Decode";
import { FlipStory, FlipStoryLink } from "@/components/FlipStory";
import { IsoIcon, type IsoKind } from "@/components/Iso";
import { PillBar, SiteFooter } from "@/components/Site";
import { DEFAULT_ASSUMPTIONS, DEFAULT_WORKLOAD, cheapest, compare, crossovers, formatTokensM, formatUsd } from "@/lib/tco";

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#flip", label: "The flip" },
  { href: "#faq", label: "FAQ" },
  { href: "/sources", label: "Sources" },
];

/** The path through Breakeven: three questions, then one page with the answer. */
const QUESTIONS: { n: number; href: string; kind: IsoKind; theme: string; label: string; title: string; body: string }[] = [
  {
    n: 1,
    href: "/worth-it",
    kind: "tokens",
    theme: "theme-api",
    label: "Worth it",
    title: "Is AI worth it for this work?",
    body: "Compare what the work costs your people today with what it costs once AI does most of it: savings, payback and ROI.",
  },
  {
    n: 2,
    href: "/run-it",
    kind: "datacenter",
    theme: "theme-rent",
    label: "Run it",
    title: "How should we run it?",
    body: "Pay per token, rent cloud GPUs, or own them: what each costs at your volume, where the answer flips, and what fits beyond cost.",
  },
  {
    n: 3,
    href: "/power-it",
    kind: "power",
    theme: "",
    label: "Power it",
    title: "Can we power it?",
    body: "If you own, how much power you need, what your power budget allows, and what to do when the grid connection is late.",
  },
];

const FAQ = [
  {
    q: "Are these real prices?",
    a: "The defaults are illustrative public list prices from October 2026: Claude Sonnet 5.5 API pricing, typical H100 cloud rental rates and 8-GPU server costs. They are not quotes, and every one of them is editable in the calculator. The methodology page lists the range and source behind each one.",
  },
  {
    q: "Why can't I just run Claude or GPT on my own GPUs?",
    a: "Frontier models are only available through their providers' APIs. So “rent” and “own” mean running an open-weight model of similar size yourself, which makes switching a quality decision as well as a cost one.",
  },
  {
    q: "How does it work out how many GPUs I need?",
    a: "Your average tokens per second, divided by what one GPU serves at your target utilization, rounded up. Rented GPUs come one at a time; owned GPUs are bought in whole 8-GPU servers.",
  },
  {
    q: "What is PUE?",
    a: "Power usage effectiveness: total facility power divided by the power the computers themselves use. A PUE of 1.3 means 30% extra on top for cooling and everything else.",
  },
];

/** Section heading: an index and label on a thin rule, then a large left-aligned title. */
function SectionHeader({ index, kicker, title, body }: { index: string; kicker: string; title: string; body?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-brand-ink">
        <span>{index}</span>
        <span className="h-px w-10 bg-current opacity-60" aria-hidden />
        <span>{kicker}</span>
      </p>
      <h2 className="mt-5 text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] text-balance sm:text-6xl">{title}</h2>
      {body && <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-2 text-pretty">{body}</p>}
    </div>
  );
}

function CtaLink({ to, children, variant = "primary" }: { to: string; children: ReactNode; variant?: "primary" | "secondary" | "light" }) {
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-ink",
    secondary: "border border-line bg-surface text-ink hover:border-brand",
    light: "bg-white text-[#120a26] hover:bg-white/90",
  }[variant];
  return (
    <a href={to} onClick={linkClick(to)} className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3.5 text-base font-semibold transition ${styles}`}>
      {children}
    </a>
  );
}

export function Landing() {
  const startup = compare(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS);
  const startupWinner = cheapest(startup);
  const cross = crossovers(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS);
  const runnerUp = (Object.values(startup) as (typeof startup)[keyof typeof startup][])
    .filter((c) => c.id !== startupWinner)
    .sort((a, b) => a.monthly - b.monthly)[0]!;

  return (
    <div className="min-h-dvh bg-bg">
      <PillBar
        nav={NAV}
        actions={
          <a
            href="/worth-it"
            onClick={linkClick("/worth-it")}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-ink"
          >
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        }
      />

      <main>
        {/* Hero, after the Figma design: the question on the left, a short aside on the right, then the three costs. */}
        <section className="light-scope -mt-[73px] bg-bg pt-[73px]">
          <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-4 pb-12 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.4fr_0.65fr] lg:gap-24">
            <div>
              <p className="kicker">Compute economics, made explicit.</p>
              <h1 className="mt-4 text-[3.2rem] font-semibold leading-[0.96] tracking-[-0.065em] sm:text-7xl lg:text-[5.4rem]">
                <span className="underline decoration-[#79aa9f] decoration-4 underline-offset-[7px]">API</span>, cloud GPUs, or your own hardware?
              </h1>
              <p className="mt-6 max-w-[650px] text-base leading-7 text-muted">
                Pay per token, rent cloud GPUs, or own the machines. See what each really costs at your workload, and where the cheapest answer
                flips.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-6">
                <CtaLink to="/worth-it">
                  Start <ArrowRight className="size-4" aria-hidden />
                </CtaLink>
                <a href="/run-it" onClick={linkClick("/run-it")} className="text-[15px] font-semibold text-ink underline-offset-4 hover:underline">
                  Jump to the calculator <ArrowRight className="inline size-4" aria-hidden />
                </a>
              </div>
              <p className="mt-3 text-sm text-muted">Opens on a worked example you can change. No sign-up, and Reset in the header brings the example back.</p>
            </div>
            <aside className="max-w-[340px]">
              <h2 className="text-lg font-semibold">Find your breakeven.</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Use your workload, not a vendor pitch. Compare all-in API, cloud and owned cost, and know where the assumptions matter.
              </p>
            </aside>
          </div>

          {/* One workload, three ways to run it: the real numbers at the default workload. */}
          <div className="mx-auto max-w-[1320px] px-4 pb-16 sm:px-8 sm:pb-20">
            <div className="rounded-[7px] border border-line bg-surface p-5 shadow-[0_10px_35px_rgb(26_39_48/0.08)] sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-4">
                <p className="font-semibold">One workload. Three ways to run it.</p>
                <p className="text-xs text-muted">
                  {formatTokensM(DEFAULT_WORKLOAD.tokensM)} tokens a month · default assumptions
                </p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(["api", "rent", "own"] as const).map((id) => (
                  <div key={id} className={`rounded-[5px] border p-4 ${id === startupWinner ? "border-[#4f9588]" : "border-line"}`}>
                    <p className="flex items-center justify-between gap-2 font-semibold">
                      <span className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${OPTIONS[id].swatch}`} aria-hidden />
                        {OPTIONS[id].short}
                      </span>
                      {id === startupWinner && <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-ink">Lowest cost</span>}
                    </p>
                    <p className="mt-3 text-[28px] font-semibold tracking-tight">
                      {formatUsd(startup[id].monthly)}
                      <span className="ml-1.5 text-sm font-normal text-muted">/ month</span>
                    </p>
                    <p className="mt-1 text-xs text-muted">{formatUsd(startup[id].perM, 2)} per million tokens</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap justify-between gap-2 bg-brand-soft px-4 py-3.5 text-sm text-[#335f57]">
                <span>{OPTIONS[startupWinner].name} has the lowest estimated monthly cost</span>
                <span className="font-semibold">
                  {formatUsd(runnerUp.monthly - startup[startupWinner].monthly)} less than {OPTIONS[runnerUp.id].short}
                </span>
              </div>
              <p className="mt-4 text-sm text-muted">
                {cross.apiUntilM !== null && <>The API stops winning above about {formatTokensM(cross.apiUntilM)} tokens a month. </>}
                {cross.ownFromM !== null && <>Owning wins for good from about {formatTokensM(cross.ownFromM)}. </>}
                <a href="/run-it" onClick={linkClick("/run-it")} className="font-semibold text-brand-ink hover:underline">
                  Find your own breakeven <ArrowRight className="inline size-3.5" aria-hidden />
                </a>
              </p>
            </div>
          </div>

          {/* At a glance */}
          <dl className="mx-auto grid max-w-[1320px] grid-cols-3 border-t border-line px-4 sm:px-6">
            {[
              ["3", "ways to run your AI"],
              ["10M–100B", "tokens a month, compared"],
              ["0", "sign-ups or quotes needed"],
            ].map(([value, label], i) => (
              <div key={label} className={`flex flex-col-reverse py-7 sm:py-10 ${i > 0 ? "border-l border-line pl-4 sm:pl-8" : ""}`}>
                <dt className="mt-2 text-xs text-muted sm:text-sm">{label}</dt>
                <dd className="font-mono text-xl font-semibold tracking-tight sm:text-5xl">
                  <Decode text={value} />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 01 · How it works: the three questions */}
        <section id="how" className="scroll-mt-20 bg-bg py-24 sm:py-36">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <SectionHeader
              index="01"
              kicker="How it works"
              title="Three questions, one answer."
              body="Enter your numbers once. Each step builds on the last, and you finish with one page you can share."
            />
            <ol className="mt-16 grid gap-5 md:grid-cols-3">
              {QUESTIONS.map((q) => (
                <li key={q.n} className={`${q.theme} flex`}>
                  <a
                    href={q.href}
                    onClick={linkClick(q.href)}
                    className="group flex w-full flex-col rounded-3xl border border-line bg-surface p-6 transition hover:border-brand"
                  >
                    <div className="grid h-40 place-items-center rounded-2xl bg-sunken px-6">
                      <IsoIcon kind={q.kind} className="h-28 w-auto max-w-full" />
                    </div>
                    <p className="mt-6 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-brand-ink">
                      <span className="grid size-6 place-items-center rounded-full bg-brand text-[11px] text-white">{q.n}</span>
                      {q.label}
                    </p>
                    <h3 className="mt-3 text-2xl font-bold tracking-tight">{q.title}</h3>
                    <p className="mt-2 text-[15px] leading-7 text-ink-2">{q.body}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-brand-ink">
                      {q.n === 1 ? "Start here" : `Go to step ${q.n}`} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-ink-2">
              Then <span className="font-semibold text-ink">The call</span>: my recommendation first, what would change it, how to land it and how we'd know it worked, ready
              to print or share.
            </p>
          </div>
        </section>

        {/* 02 · The flip: step 2's answer as a scroll-driven story on a dark section */}
        <section id="flip" className="dark-scope">
          <div className="mx-auto max-w-[1320px] px-4 pt-24 sm:px-6 sm:pt-32">
            <SectionHeader
              index="02"
              kicker="The flip"
              title="Watch the cheapest answer change as you grow."
              body="The heart of step 2. Scroll to raise the volume from 10 million to 100 billion tokens a month; the bars and the winner follow."
            />
          </div>
          <FlipStory />
          <div className="mx-auto flex max-w-[1320px] px-4 pb-24 sm:px-6 sm:pb-32">
            <FlipStoryLink />
          </div>
        </section>

        {/* 03 · FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-line bg-bg py-24 sm:py-36">
          <div className="mx-auto grid max-w-[1320px] gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16">
            <SectionHeader index="03" kicker="FAQ" title="Good questions." body="The short version of how the numbers work." />
            <div className="divide-y divide-line border-y border-line">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                    {f.q}
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink-2 transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-2">{f.a}</p>
                </details>
              ))}
              <a href="/sources" onClick={linkClick("/sources")} className="flex items-center justify-between py-6 text-lg font-semibold text-brand-ink">
                Every number, with its source <ArrowUpRight className="size-5" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="dark-scope">
          <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-8 px-4 py-24 sm:px-6 sm:py-36 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-3xl text-5xl font-extrabold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
              Your numbers. <span className="text-brand-ink">Your answer.</span>
            </h2>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <CtaLink to="/worth-it" variant="light">
                Start <ArrowRight className="size-4" aria-hidden />
              </CtaLink>
              <CtaLink to="/run-it" variant="secondary">
                Jump to the calculator
              </CtaLink>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
