import { ArrowRight } from "lucide-react";
import { useScores } from "./SitesStep";
import { Footer, Logo, href, linkClick } from "@/components/Frame";
import { UsMap } from "@/components/UsMap";
import { RETRIEVED, SITES, formatMw, mwAt, stateName } from "@/lib/data";
import { byState, totalMw } from "@/lib/metrics";
import { DEFAULT_SCENARIO } from "@/lib/scenario";

const STEPS = [
  { n: 1, title: "Map", body: "Every US frontier AI data center, sized by the power it draws, from 2023 to the end of 2028's announced builds." },
  { n: 2, title: "Grid", body: "The power price in each state, and how many years each grid region takes to connect new power." },
  { n: 3, title: "Sites", body: "A DEA site scorer finds the states no others beat on price and wait at once, and how far each AI hub sits from them." },
];

export function Landing() {
  const start = href("map", DEFAULT_SCENARIO);
  const totals = byState(RETRIEVED);
  const { front } = useScores("industrial", RETRIEVED);
  const sites = SITES.map((site) => ({ site, mw: mwAt(site, RETRIEVED) }));
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
        <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 pb-14 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div>
            <p className="kicker">AI infrastructure · energy · site selection</p>
            <h1 className="mt-5 text-[3rem] font-extrabold leading-[0.98] tracking-[-0.05em] text-balance sm:text-6xl">
              Where is AI being built, and <span className="text-site">where should it go next?</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-2">
              A map of US AI data centers, the power prices and grid-connection waits where they sit, and a site scorer from operations research. All from public data.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
                Open the map <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
              {[
                ["AI power today", formatMw(totalMw(RETRIEVED))],
                ["By end of 2028", formatMw(totalMw("2028-12-31"))],
                ["Sites tracked", String(SITES.length)],
                ["On the frontier", front.map((u) => u.id).join(", ")],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{k}</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold" title={k === "On the frontier" ? front.map((u) => stateName(u.id)).join(", ") : undefined}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-3xl border border-line bg-surface p-4 sm:p-6">
            <UsMap date={RETRIEVED} sites={sites} totals={totals} selected="" onSelect={(code) => (window.location.href = href("map", { ...DEFAULT_SCENARIO, state: code }))} />
          </div>
        </section>
        <section className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6">
          <p className="kicker">How it works</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-5xl">Three steps, one site brief.</h2>
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
