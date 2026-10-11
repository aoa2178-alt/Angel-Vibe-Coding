import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { CampusSelect, Footer, Header, href, linkClick } from "@/components/Frame";
import { anim } from "@/components/Motion";
import { TrustTag } from "@/components/ui";
import { CAMPUSES, MILESTONES, campusById, defaultSettings, formatMoney, formatMonth, formatMw, lowerFirst, monthIndex, plan, resolveFirst, type PhasePlan } from "@/lib/model";
import { switchCampus } from "@/lib/scenario";

const STEPS = [
  { title: "Power demand", body: "GPU plan to facility megawatts and annual energy cost." },
  { title: "Delivery schedule", body: "Go-live by phase and the milestone on the critical path." },
  { title: "Cost of delay", body: "The value of each month late, and what to resolve first." },
];

/** Each phase as a row: construction start to go-live, its milestones as dots, the critical one in the accent colour. */
function MilestoneMap({ plans }: { plans: PhasePlan[] }) {
  const from = Math.min(...plans.map((p) => monthIndex(p.phase.start)));
  const to = Math.max(...plans.map((p) => p.now.live)) + 1;
  const W = 520;
  const rowH = 64;
  const H = plans.length * rowH + 28;
  const x = (m: number) => 18 + ((m - from) / (to - from)) * (W - 36);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label={plans.map((p) => `${p.phase.name}: live ${formatMonth(p.now.live)}, waiting on ${lowerFirst(MILESTONES.find((m) => m.id === p.now.critical)!.label)}`).join("; ")}>
      {plans.map((p, i) => {
        const y = 30 + i * rowH;
        const start = monthIndex(p.phase.start);
        return (
          <g key={p.phase.id} style={anim("fade", 600, 150 + i * 150)}>
            <text x={18} y={y - 10} fontSize="11" fill="var(--muted)" fontFamily="var(--font-mono)">
              {p.phase.name.toUpperCase()} · {formatMw(p.facilityMw)}
            </text>
            <line x1={x(start)} x2={x(p.now.live)} y1={y + 6} y2={y + 6} stroke="var(--line)" strokeWidth="8" strokeLinecap="round" />
            <text x={x(start)} y={y + 30} fontSize="10" fill="var(--muted)" fontFamily="var(--font-mono)">
              start {formatMonth(start)}
            </text>
            {p.now.deps.map((d) => (
              <circle key={d.id} cx={x(d.at)} cy={y + 6} r={d.id === p.now.critical ? 7 : 4.5} fill={d.id === p.now.critical ? "var(--brand)" : "var(--muted)"} stroke="var(--surface)" strokeWidth="2" />
            ))}
            <line x1={x(p.now.live)} x2={x(p.now.live)} y1={y - 4} y2={y + 16} stroke="var(--ink)" strokeWidth="2" />
            <text x={x(p.now.live) - 8} y={y - 10} fontSize="11" textAnchor="end" fill="var(--ink)" fontFamily="var(--font-mono)">
              live {formatMonth(p.now.live)}
            </text>
          </g>
        );
      })}
      <g fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted)">
        <circle cx={W - 178} cy={H - 8} r="5" fill="var(--brand)" />
        <text x={W - 169} y={H - 4.5}>critical path</text>
        <circle cx={W - 76} cy={H - 8} r="3.5" fill="var(--muted)" />
        <text x={W - 68} y={H - 4.5}>milestone</text>
      </g>
    </svg>
  );
}

export function Landing() {
  const [id, setId] = useState(CAMPUSES[0]!.id);
  const campus = campusById(id);
  const plans = plan(campus, defaultSettings(campus));
  const top = resolveFirst(campus, defaultSettings(campus))[0]!;
  const topPlan = plans.find((p) => p.phase.id === top.phaseId)!;
  const facility = plans.reduce((n, p) => n + p.facilityMw, 0);
  const energy = plans.reduce((n, p) => n + p.annualEnergy, 0);
  const start = href("power", switchCampus(id));
  const faq = "/faq";

  return (
    <div className="min-h-dvh">
      <Header
        actions={
          <>
            <nav aria-label="Sections" className="mr-3 hidden items-center gap-6 text-sm text-muted md:flex">
              <a href="#how" className="transition hover:text-ink">
                How it works
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
        <section className="mx-auto max-w-[1320px] px-4 pb-8 pt-14 sm:px-8 sm:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="kicker">AI campus delivery</p>
              <h1 className="mt-4 max-w-3xl text-[2.6rem] font-bold leading-[1.02] tracking-[-0.04em] sm:text-6xl">
                Can this campus go live{" "}
                <span className="whitespace-nowrap underline decoration-brand decoration-[5px] underline-offset-[10px]">on time</span>?
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-ink-2">The critical path, the cost of every month late, and what to resolve first.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
                Start <ArrowRight className="size-4" aria-hidden />
              </a>
              <a href={faq} onClick={linkClick(faq)} className="inline-flex items-center gap-1.5 font-semibold text-ink transition hover:text-brand-ink">
                See the method <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] px-4 sm:px-8" aria-label="Case study preview">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Case study</span>
            <CampusSelect value={id} onChange={setId} className="min-w-0 max-w-full sm:w-80" />
          </div>
          <div className="grid gap-3 md:grid-cols-3 md:grid-rows-[auto_auto]">
            <div className="flex flex-col justify-between rounded-[7px] border border-brand bg-surface p-5 shadow-[inset_0_3px_0_var(--brand)] md:row-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Cost of a month late · {top.phaseName}
                <TrustTag kind="modeled" />
              </p>
              <p key={id} className="my-6 font-mono text-5xl font-semibold tracking-[-0.03em] sm:text-6xl" style={anim("rise", 700, 100)}>
                {formatMoney(topPlan.monthly.total)}
              </p>
              <p className="text-sm text-ink-2">
                Lost revenue plus the carrying cost of idle capital, {campus.company} · {campus.site}.
              </p>
            </div>
            <div className="min-h-[170px] rounded-[7px] border border-line bg-surface p-3 md:col-span-2">
              <MilestoneMap key={id} plans={plans} />
            </div>
            <div className="rounded-[7px] border border-line bg-surface p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Facility power
                <TrustTag kind="modeled" />
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">{formatMw(facility)}</p>
            </div>
            <div className="rounded-[7px] border border-line bg-surface p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Electricity per year
                <TrustTag kind="modeled" />
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">{formatMoney(energy)}</p>
            </div>
          </div>
          <p className="mt-3 flex flex-wrap justify-between gap-2 rounded-[6px] bg-brand-soft px-4 py-3 text-sm text-brand-ink">
            <span>
              Resolve first: {top.phaseName}, {lowerFirst(MILESTONES.find((m) => m.id === top.milestone)!.label)}
            </span>
            <span className="font-mono font-semibold">+3 months = {formatMoney(top.cost)}</span>
          </p>
        </section>

        <section id="how" className="mt-16 scroll-mt-20 bg-panel">
          <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-8">
            <h2 className="text-2xl font-bold tracking-[-0.02em]">How it works</h2>
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
          <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
