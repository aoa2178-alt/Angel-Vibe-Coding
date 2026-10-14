import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { BEACON_COLORS, Beacon, beaconPerDot } from "@/components/Beacon";
import { CountrySelect, Footer, Header, href, linkClick } from "@/components/Frame";
import { TrustTag } from "@/components/ui";
import { DEFAULT_AFFORD, afford } from "@/lib/afford";
import { DEFAULT_BUILD } from "@/lib/build";
import { leverOptions, ranked } from "@/lib/call";
import { byIso, pct, people, shortName, usd } from "@/lib/data";
import { gap } from "@/lib/gap";
import { DEFAULT_SCENARIO } from "@/lib/scenario";

const STEPS = [
  { title: "Access gap", body: "Who is offline, and whether a signal reaches them." },
  { title: "Affordability", body: "Who can afford a phone and data, and what changes it." },
  { title: "Coverage and funding", body: "What coverage costs, and who should pay." },
];

export function Landing() {
  const [iso, setIso] = useState(DEFAULT_SCENARIO.country);
  const c = byIso(iso)!;
  const name = shortName(c);
  const g = gap(c);
  const today = afford(c, DEFAULT_AFFORD).share;
  const financed = afford(c, { ...DEFAULT_AFFORD, payg: true }).share;
  const lead = ranked(leverOptions(c, DEFAULT_AFFORD, DEFAULT_BUILD))[0];
  const s = { ...DEFAULT_SCENARIO, country: iso };
  const start = href("gap", s);
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

      <main>
        {/* The beacon: one lit tower alone on a dusk plain, the country's people dotted across it. */}
        <section className="relative h-[calc(100dvh-4rem)] max-h-[860px] min-h-[600px] overflow-hidden bg-[#0b2a30] text-[#eef6f7]" aria-label="Country preview">
          <Beacon
            key={iso}
            online={g.pop - g.offline}
            covered={g.covered}
            noSignal={g.noSignal}
            ariaLabel={`${name}'s people on a plain around a signal tower: ${people(g.pop - g.offline)} online, ${people(g.covered)} with a signal but not online, ${people(g.noSignal)} with no signal`}
          />
          <div className="relative z-10 mx-auto max-w-[1320px] px-4 pt-12 text-center sm:px-8 sm:pt-16">
            <p className="kicker !text-[#a9c9cd]">Connecting the offline</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.045em] text-balance sm:text-6xl">
              Who is offline, and why?
            </h1>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-5 px-4 pb-6 sm:px-8">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <CountrySelect value={iso} onChange={setIso} className="w-60 max-w-full" />
                <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-accent px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90">
                  View analysis <ArrowRight className="size-4" aria-hidden />
                </a>
              </div>
              <p className="mt-3 text-[13px] text-[#a9c9cd]">
                One dot = {people(beaconPerDot(g.pop))} people · {c.region} · {c.income}
              </p>
            </div>
            <dl className="grid gap-1 text-right text-sm">
              {(
                [
                  ["Online", g.pop - g.offline, BEACON_COLORS.online],
                  ["Signal, not online", g.covered, BEACON_COLORS.covered],
                  ["No signal", g.noSignal, BEACON_COLORS.noSignal],
                ] as const
              ).map(([label, value, color]) => (
                <div key={label} className="flex items-center justify-end gap-2">
                  <dt className="inline-flex items-center gap-1.5 text-[#c9dfe2]">
                    <i className="inline-block size-2.5 rounded-[3px]" style={{ background: color }} />
                    {label}
                  </dt>
                  <dd className="w-16 font-mono font-semibold">{people(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-[1100px] px-4 pt-10 sm:px-8" aria-label="Country summary">
          <div className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3 text-sm">
              <span className="font-semibold">{name}</span>
              <span className="text-xs text-muted">
                {c.region} · {c.income}
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[6px] border border-line p-3">
                <p className="text-xs text-muted">
                  People offline
                  <TrustTag kind="data" />
                </p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight">{people(g.offline)}</p>
              </div>
              <div className="rounded-[6px] border border-line p-3">
                <p className="text-xs text-muted">
                  No signal at all
                  <TrustTag kind="modeled" />
                </p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight">{people(g.noSignal)}</p>
              </div>
              <div className="rounded-[6px] border border-accent p-3 shadow-[inset_0_3px_0_var(--accent)]">
                <p className="text-xs text-muted">
                  Can afford, with phone financing
                  <TrustTag kind="modeled" />
                </p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight">
                  {pct(today)} → {pct(financed)}
                </p>
              </div>
            </div>
            {lead && Number.isFinite(lead.perPerson) && (
              <p className="mt-3 flex flex-wrap justify-between gap-2 rounded-[5px] bg-coral-soft px-3 py-2 text-sm text-coral-ink">
                <span>Lowest-cost lever: {lead.label}</span>
                <span className="font-mono font-semibold">{usd(lead.perPerson)} per person online</span>
              </p>
            )}
          </div>
        </section>

        <section id="how" className="mt-14 scroll-mt-20 bg-brand text-on-brand">
          <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Approach</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {STEPS.map((st) => (
                <li key={st.title} className="border-t border-white/25 pt-4">
                  <h3 className="text-lg font-semibold">{st.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-6 text-white/75">{st.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-4 py-16 sm:px-8">
          <h2 className="text-3xl font-semibold tracking-[-0.035em]">Plan for your own country.</h2>
          <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
