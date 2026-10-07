import { ArrowRight, Check, Coins, Cpu, Server, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import hero from "@/assets/landing-hero.webp";
import { OPTIONS } from "@/Calculator";
import { linkClick } from "@/components/Brand";
import { SiteFooter, SiteHeader } from "@/components/Site";
import { ClosingBars } from "@/components/ClosingBars";
import { Odometer } from "@/components/Odometer";
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_WORKLOAD,
  PRESETS,
  cheapest,
  compare,
  crossovers,
  formatTokensM,
  formatUsd,
} from "@/lib/tco";

// The illustration's own edge color, so the hero band and the picture blend into one surface.
const HERO_BG = "#fbf8fe";

const NAV = [
  { href: "#compares", label: "What it compares" },
  { href: "#demo", label: "Try it" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
  { href: "/business-case", label: "Business case" },
  { href: "/methodology", label: "Methodology" },
];

const FEATURES = [
  {
    icon: Coins,
    title: "Tokens",
    swatch: "bg-api",
    body: "Pay-per-token APIs scale to zero and stay simple, but the bill climbs in step with every token.",
  },
  {
    icon: Server,
    title: "Datacenter",
    swatch: "bg-rent",
    body: "Rented cloud GPUs buy you the facility, cooling and networking without owning the racks.",
  },
  {
    icon: Cpu,
    title: "GPUs",
    swatch: "bg-own",
    body: "Owned hardware is depreciated month by month, and the cost per token keeps falling as you grow.",
  },
  {
    icon: Zap,
    title: "Operations & power",
    swatch: "bg-brand",
    body: "Electricity, cooling and upkeep decide whether owning actually beats renting.",
  },
];

const STEPS = [
  { title: "Set your volume", body: "Pick a preset or enter your monthly tokens. Every price, power and throughput assumption is editable." },
  { title: "See what's cheapest", body: "Monthly cost and cost per million tokens for the API, rented GPUs and owned GPUs, side by side." },
  { title: "See where it flips", body: "A projection from 10M to 100B tokens marks exactly where one option overtakes another." },
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

function SectionHeader({ kicker, title, body }: { kicker: string; title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="kicker">{kicker}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-[2.6rem] sm:leading-[1.1]">{title}</h2>
      {body && <p className="mt-4 text-lg leading-8 text-ink-2 text-pretty">{body}</p>}
    </div>
  );
}

function CtaLink({ to, children, variant = "primary" }: { to: string; children: ReactNode; variant?: "primary" | "secondary" | "light" }) {
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-ink",
    secondary: "border border-line bg-surface text-ink hover:border-brand",
    light: "bg-white text-[#2a1458] hover:bg-white/90",
  }[variant];
  return (
    <a href={to} onClick={linkClick(to)} className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition ${styles}`}>
      {children}
    </a>
  );
}

export function Landing() {
  const startup = compare(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS);
  const startupWinner = cheapest(startup);
  const cross = crossovers(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS);

  return (
    <div className="min-h-dvh bg-surface">
      <SiteHeader nav={NAV} />

      <main>
        {/* Hero: centered message over a full-width illustration that shares its background */}
        <section className="light-scope relative overflow-hidden" style={{ backgroundColor: HERO_BG }}>
          <div className="mx-auto max-w-[1200px] px-4 pt-16 text-center sm:px-6 sm:pt-24">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-2">
              <span className="rounded-full bg-brand px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">Free</span>
              AI infrastructure cost calculator
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-[2.6rem] font-extrabold leading-[1.04] tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
              Tokens, rented GPUs, or your own hardware?
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ink-2 text-pretty sm:text-xl">
              Breakeven compares what it really costs to run your AI three ways, at your exact volume, and shows where the cheapest
              option changes.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <CtaLink to="/calculator">
                Run the comparison <ArrowRight className="size-4" aria-hidden />
              </CtaLink>
              <CtaLink to="/business-case" variant="secondary">
                Build a business case
              </CtaLink>
            </div>
            <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink-2">
              {["No sign-up", "Every assumption editable", "Shareable estimates"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-brand" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto mt-12 max-w-[1600px]">
            <img
              src={hero}
              alt="Illustration of GPU chips wired into a data center, with cooling units and power lines behind it"
              width={1536}
              height={1024}
              className="block aspect-[3/2] w-full object-cover sm:aspect-[2/1] lg:aspect-[21/9] lg:object-[center_46%]"
            />
            {/* A real answer from the calculator, pinned over the picture */}
            <div className={`theme-${startupWinner} win-panel absolute bottom-5 left-1/2 hidden w-72 -translate-x-1/2 rounded-2xl p-4 text-left text-white sm:block lg:bottom-8 lg:left-[40%] lg:translate-x-0`}>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/75">Cheapest at 2B tokens / month</p>
              <p className="mt-1.5 text-xl font-extrabold tracking-tight">{OPTIONS[startupWinner].name}</p>
              <p className="mt-1 font-mono text-sm text-white/85">
                {formatUsd(startup[startupWinner].monthly)} / month · {formatUsd(startup[startupWinner].perM, 2)} / M
              </p>
            </div>
            {cross.ownFromM !== null && (
              <div className="absolute right-4 top-4 hidden rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left md:block lg:right-[6%] lg:top-8">
                <p className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="size-2 rounded-full bg-own" aria-hidden /> Owning wins for good
                </p>
                <p className="mt-0.5 font-mono text-xs text-ink-2">from {formatTokensM(cross.ownFromM)} tokens / month</p>
              </div>
            )}
          </div>
        </section>

        {/* At a glance */}
        <section aria-label="At a glance" className="border-y border-line bg-surface">
          <dl className="mx-auto grid max-w-[1200px] grid-cols-3 divide-x divide-line px-4 sm:px-6">
            {[
              ["3", "ways to run your AI"],
              ["10M–100B", "tokens a month, compared"],
              ["0", "sign-ups or quotes needed"],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col-reverse px-3 py-7 text-center sm:py-9">
                <dt className="mt-1.5 text-xs text-muted sm:text-sm">{label}</dt>
                <dd className="font-mono text-xl font-semibold tracking-tight sm:text-4xl">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* What it compares */}
        <section id="compares" className="scroll-mt-16 bg-bg py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <SectionHeader
              kicker="What it compares"
              title="Everything that decides the bill"
              body="Four cost drivers, one honest comparison. No vendor quotes and no hidden assumptions."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, swatch, body }) => (
                <article key={title} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
                  <span className={`grid size-11 place-items-center rounded-xl text-white ${swatch}`} aria-hidden>
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold tracking-tight">{title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-ink-2">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Live demo */}
        <section id="demo" className="scroll-mt-16 bg-surface py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <SectionHeader
              kicker="Try it"
              title="Watch the cheapest option change"
              body="Pick a company size. The gap between the three options closes and opens as the volume grows."
            />
            <LiveDemo />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16 bg-bg py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <SectionHeader kicker="How it works" title="Three steps, one answer" />
            <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
              <span className="absolute left-[16.6%] right-[16.6%] top-6 hidden h-px bg-line md:block" aria-hidden />
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative text-center">
                  <span className="relative mx-auto grid size-12 place-items-center rounded-full border border-line bg-surface font-mono text-sm font-semibold text-brand-ink">
                    0{i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-bold tracking-tight">{s.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-[15px] leading-7 text-ink-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 bg-surface py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
            <div>
              <p className="kicker">FAQ</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-[2.6rem] sm:leading-[1.1]">Good questions</h2>
              <p className="mt-4 text-lg leading-8 text-ink-2">The short version of how the numbers work.</p>
            </div>
            <div className="divide-y divide-line border-y border-line">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                    {f.q}
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-ink-2 transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="bg-surface px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center rounded-3xl bg-[#2a1458] px-6 py-16 text-center text-white sm:py-20">
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-5xl">Find your breakeven.</h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-white/80">
              Two minutes, your own numbers, and an answer you can share with your team.
            </p>
            <div className="mt-8">
              <CtaLink to="/calculator" variant="light">
                Open the calculator <ArrowRight className="size-4" aria-hidden />
              </CtaLink>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/** A small working version of the calculator, framed like a browser window. */
function LiveDemo() {
  const [presetId, setPresetId] = useState<string>("startup");
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[1];
  const workload = { ...DEFAULT_WORKLOAD, tokensM: preset.tokensM };
  const costs = compare(workload, DEFAULT_ASSUMPTIONS);
  const winner = cheapest(costs);

  return (
    <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-2xl border border-line bg-bg">
      <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-line" />
          <span className="size-3 rounded-full bg-line" />
          <span className="size-3 rounded-full bg-line" />
        </span>
        <span className="flex-1 truncate rounded-md bg-sunken px-3 py-1 text-center font-mono text-xs text-muted">
          breakeven-silk.vercel.app/calculator
        </span>
      </div>

      <div className={`theme-${winner} grid gap-4 p-4 sm:p-6`}>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Company size">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === presetId}
              onClick={() => setPresetId(p.id)}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                p.id === presetId ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand"
              }`}
            >
              <span className="block text-sm font-semibold leading-tight">{p.label}</span>
              <span className={`mt-0.5 block font-mono text-xs ${p.id === presetId ? "text-white/80" : "text-muted"}`}>{formatTokensM(p.tokensM)}/mo</span>
            </button>
          ))}
        </div>

        <div className="win-panel flex flex-wrap items-end justify-between gap-3 rounded-2xl p-5 text-white">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/75">Cheapest at {formatTokensM(preset.tokensM)} tokens / month</p>
            <p key={winner} className="mt-1.5 animate-rise text-2xl font-extrabold tracking-tight sm:text-3xl">
              {OPTIONS[winner].name}
            </p>
          </div>
          <p className="font-mono text-lg font-semibold sm:text-xl">
            <Odometer text={formatUsd(costs[winner].monthly)} /> <span className="text-sm font-normal text-white/75">/ month</span>
          </p>
        </div>

        <ClosingBars costs={costs} winner={winner} meta={OPTIONS} />

        <div className="flex justify-center">
          <CtaLink to={`/calculator?v=${preset.tokensM}`} variant="secondary">
            Open this estimate in the calculator <ArrowRight className="size-4" aria-hidden />
          </CtaLink>
        </div>
      </div>
    </div>
  );
}
