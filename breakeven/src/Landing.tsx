import { ArrowRight, Coins, Cpu, Server, Zap } from "lucide-react";
import hero from "@/assets/landing-hero.webp";
import { Logo, linkClick } from "@/components/Brand";
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_WORKLOAD,
  PRESETS,
  cheapest,
  compare,
  formatTokensM,
  formatUsd,
  ownCostPerGpuMonth,
  type OptionId,
} from "@/lib/tco";

const WINNER_NAME: Record<OptionId, string> = { api: "Pay per token (API)", rent: "Rent cloud GPUs", own: "Own GPUs" };

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
  { n: "01", title: "Set your volume", body: "Pick a preset or enter your monthly tokens. Every price, power and throughput assumption is editable." },
  { n: "02", title: "See what's cheapest", body: "Monthly cost and cost per million tokens for the API, rented GPUs and owned GPUs, side by side." },
  { n: "03", title: "See where it flips", body: "A projection from 10M to 100B tokens marks exactly where one option overtakes another." },
];

export function Landing() {
  const examples = PRESETS.map((p) => {
    const costs = compare({ ...DEFAULT_WORKLOAD, tokensM: p.tokensM }, DEFAULT_ASSUMPTIONS);
    const winner = cheapest(costs);
    return { preset: p, winner, cost: costs[winner] };
  });
  const a = DEFAULT_ASSUMPTIONS;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#how" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-2 hover:text-ink sm:inline">
              How it works
            </a>
            <a
              href="/calculator"
              onClick={linkClick("/calculator")}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-ink"
            >
              Open calculator <ArrowRight className="size-4" aria-hidden />
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-[1360px] px-4 pt-10 sm:px-6 lg:pt-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-end">
            <div className="max-w-4xl">
              <p className="inline-flex rounded-full border border-line bg-brand-soft px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-ink">
                AI infrastructure cost calculator
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-6xl">
                Should your AI run on <span className="underline decoration-api decoration-[6px] underline-offset-[10px]">tokens</span>,{" "}
                <span className="underline decoration-rent decoration-[6px] underline-offset-[10px]">rented GPUs</span>, or{" "}
                <span className="underline decoration-own decoration-[6px] underline-offset-[10px]">your own hardware</span>?
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-2">
                Breakeven shows the monthly cost and cost per million tokens of each option at your volume. API prices,
                rented GPUs, hardware, power and operations, in one honest comparison.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/calculator"
                  onClick={linkClick("/calculator")}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-ink"
                >
                  Run the comparison <ArrowRight className="size-4" aria-hidden />
                </a>
                <a
                  href="/calculator#projection"
                  onClick={linkClick("/calculator#projection")}
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 font-semibold text-ink transition hover:border-brand"
                >
                  See where the answer flips
                </a>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-1">
              {[
                ["3", "ways to run it"],
                ["10M–100B", "tokens a month"],
                ["0", "sign-ups needed"],
              ].map(([value, label]) => (
                <div key={label} className="bg-surface px-4 py-3 lg:px-5 lg:py-4">
                  <dt className="sr-only">{label}</dt>
                  <dd className="whitespace-nowrap font-mono text-base font-semibold tracking-tight sm:text-2xl">{value}</dd>
                  <dd className="text-xs text-muted">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Illustration with live labels pinned to it */}
          <figure className="relative mt-10 overflow-hidden rounded-3xl border border-line bg-[#f7f5fc]">
            <img
              src={hero}
              alt="Illustration of GPU chips wired into a data center, with cooling units and power lines behind it"
              width={1536}
              height={1024}
              className="block aspect-[3/2] w-full object-cover md:aspect-[12/5] md:object-[center_48%]"
            />
            <Tag className="left-[3%] top-[70%]" swatch="bg-own" title="Own GPUs" value={`${formatUsd(ownCostPerGpuMonth(a))} per GPU / month`} />
            <Tag className="left-[47%] top-[8%]" swatch="bg-rent" title="Rent cloud GPUs" value={`${formatUsd(a.rentPerGpuHour, 2)} per GPU-hour`} />
            <Tag className="right-[3%] top-[74%]" swatch="bg-brand" title="Power & cooling" value={`${a.kwPerGpu} kW per GPU · PUE ${a.pue}`} />
          </figure>
        </section>

        {/* What it compares */}
        <section className="mx-auto max-w-[1360px] px-4 pt-16 sm:px-6">
          <p className="kicker">What it compares</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Everything that decides the bill.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, swatch, body }) => (
              <article key={title} className="rounded-2xl border border-line bg-surface p-5">
                <span className={`grid size-10 place-items-center rounded-xl text-white ${swatch}`} aria-hidden>
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold tracking-tight">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-2">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-[1360px] scroll-mt-6 px-4 pt-16 sm:px-6">
          <p className="kicker">How it works</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Three steps, one answer.</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-2xl border border-line bg-surface p-5">
                <span className="font-mono text-sm font-semibold text-brand-ink">{s.n}</span>
                <h3 className="mt-2 text-lg font-bold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Three volumes, three winners */}
        <section className="mx-auto max-w-[1360px] px-4 pb-20 pt-16 sm:px-6">
          <div className="rounded-3xl border border-line bg-surface p-6 sm:p-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="kicker">One workload. Three ways to run it.</p>
                <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
                  The cheapest option changes with your volume.
                </h2>
              </div>
              <a
                href="/calculator"
                onClick={linkClick("/calculator")}
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-ink lg:self-auto"
              >
                Open the calculator <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {examples.map(({ preset, winner, cost }) => (
                <a
                  key={preset.id}
                  href={`/calculator?v=${preset.tokensM}`}
                  onClick={linkClick(`/calculator?v=${preset.tokensM}`)}
                  className={`theme-${winner} win-panel group block rounded-2xl p-5 text-white transition hover:-translate-y-0.5`}
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/75">
                    {preset.label} · {formatTokensM(preset.tokensM)} tokens / month
                  </p>
                  <p className="mt-3 text-2xl font-extrabold tracking-tight">{WINNER_NAME[winner]}</p>
                  <p className="mt-1 font-mono text-sm text-white/85">
                    {formatUsd(cost.monthly)} / month · {formatUsd(cost.perM, 2)} per M tokens
                  </p>
                  <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                    Open this estimate <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                  </p>
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">Using the calculator's default assumptions. Every one of them is editable.</p>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1360px] flex-wrap justify-between gap-2 border-t border-line px-4 py-6 font-mono text-[11px] uppercase tracking-[0.12em] text-muted sm:px-6">
        <span>
          Illustrative estimates <span className="text-brand-ink">·</span> not provider quotes
        </span>
        <span>Breakeven · Angel Ade-Oduntan</span>
      </footer>
    </div>
  );
}

function Tag({ className, swatch, title, value }: { className: string; swatch: string; title: string; value: string }) {
  return (
    <div className={`absolute hidden rounded-xl border border-line bg-surface/95 px-3 py-2 md:block ${className}`}>
      <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
        <span className={`size-2 rounded-full ${swatch}`} aria-hidden />
        {title}
      </span>
      <span className="mt-0.5 block font-mono text-xs text-ink-2">{value}</span>
    </div>
  );
}
