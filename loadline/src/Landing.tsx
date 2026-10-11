import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { CampusSelect, Footer, Header, href, linkClick } from "@/components/Frame";
import { IsoCampus } from "@/components/IsoCampus";
import { TrustTag } from "@/components/ui";
import { CAMPUSES, MILESTONES, campusById, defaultSettings, formatMoney, formatMw, lowerFirst, monthIndex, plan, resolveFirst } from "@/lib/model";
import { switchCampus } from "@/lib/scenario";

const STEPS = [
  { title: "Power demand", body: "GPU plan to facility megawatts and annual energy cost." },
  { title: "Delivery schedule", body: "Go-live by phase and the milestone on the critical path." },
  { title: "Cost of delay", body: "The value of each month late, and what to resolve first." },
];
const TODAY = monthIndex(new Date().toISOString().slice(0, 10));

export function Landing() {
  const [id, setId] = useState(CAMPUSES[0]!.id);
  const campus = campusById(id);
  const plans = plan(campus, defaultSettings(campus));
  const top = resolveFirst(campus, defaultSettings(campus))[0]!;
  const topPlan = plans.find((p) => p.phase.id === top.phaseId)!;
  const facility = plans.reduce((n, p) => n + p.facilityMw, 0);
  const buildings = plans.reduce((n, p) => n + p.phase.buildings, 0);
  const live = plans.filter((p) => p.now.live <= TODAY).reduce((n, p) => n + p.phase.buildings, 0);
  const sc = switchCampus(id);
  const links = { power: href("power", sc), timeline: href("timeline", sc), delays: href("delays", sc), brief: href("brief", sc) };
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
            <a href={links.power} onClick={linkClick(links.power)} className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-3.5 py-2 text-sm font-semibold text-on-brand transition hover:opacity-90">
              Start <ArrowRight className="size-4" aria-hidden />
            </a>
          </>
        }
      />

      <main>
        {/* The campus at night, as the hero: its labelled buildings are the four pages. */}
        <section className="relative overflow-hidden" aria-label="Campus">
          <div className="relative z-10 mx-auto flex max-w-[1320px] flex-wrap items-start justify-between gap-6 px-4 pt-10 sm:px-8 sm:pt-14">
            <div className="max-w-xl">
              <p className="kicker">AI campus delivery</p>
              <h1 className="mt-3 text-[2.4rem] font-bold leading-[1.04] tracking-[-0.04em] sm:text-6xl">
                Can this campus go live <span className="whitespace-nowrap underline decoration-brand decoration-[5px] underline-offset-[10px]">on time</span>?
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <CampusSelect value={id} onChange={setId} className="w-80 max-w-full" />
                <a href={links.power} onClick={linkClick(links.power)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition hover:opacity-90">
                  View analysis <ArrowRight className="size-4" aria-hidden />
                </a>
              </div>
            </div>
            <dl className="grid gap-1 text-right font-mono text-xs text-muted">
              <div>
                <dd className="inline text-base font-semibold text-ink">{formatMw(facility)}</dd> <dt className="inline">facility load</dt>
              </div>
              <div>
                <dd className="inline text-base font-semibold text-ink">
                  {live}/{buildings}
                </dd>{" "}
                <dt className="inline">buildings energized</dt>
              </div>
              <div>
                <dd className="inline text-base font-semibold text-ink">{formatMoney(topPlan.monthly.total)}</dd>{" "}
                <dt className="inline">
                  per month of delay
                  <TrustTag kind="modeled" />
                </dt>
              </div>
              <div className="mt-1 max-w-xs text-[11px] leading-5">
                Critical-path priority: {top.phaseName}, {lowerFirst(MILESTONES.find((m) => m.id === top.milestone)!.label)}
              </div>
            </dl>
          </div>

          <div className="-mt-6 sm:-mt-16">
            <IsoCampus key={id} campusId={id} plans={plans} links={links} />
          </div>

          <nav aria-label="Pages" className="relative z-10 mx-auto -mt-10 mb-8 flex w-fit max-w-[calc(100%-2rem)] flex-wrap justify-center gap-1 rounded-full border border-line bg-surface/85 p-1.5 backdrop-blur-sm sm:-mt-16">
            {(
              [
                [links.power, "Power demand"],
                [links.timeline, "Delivery schedule"],
                [links.delays, "Cost of delay"],
                [links.brief, "Recommendation"],
              ] as const
            ).map(([to, label]) => (
              <a key={label} href={to} onClick={linkClick(to)} className="rounded-full px-4 py-2 text-sm text-ink transition hover:bg-brand-soft hover:text-brand-ink">
                {label}
              </a>
            ))}
          </nav>
        </section>

        <section id="how" className="scroll-mt-20 bg-panel">
          <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-8">
            <h2 className="text-2xl font-bold tracking-[-0.02em]">Approach</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.title} className="border-t border-white/15 pt-4">
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-6 text-panel-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-4 py-16 sm:px-8">
          <h2 className="text-3xl font-bold tracking-[-0.03em]">Model your own campus.</h2>
          <a href={links.power} onClick={linkClick(links.power)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
