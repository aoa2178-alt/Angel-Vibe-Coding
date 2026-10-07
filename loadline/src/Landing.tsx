import { ArrowRight } from "lucide-react";
import { Footer, Logo, href, linkClick } from "@/components/Frame";
import { CAMPUSES, MILESTONES, defaultSettings, lowerFirst, formatMoney, formatMonth, formatMw, plan } from "@/lib/model";
import { switchCampus } from "@/lib/scenario";

const STEPS = [
  { n: 1, title: "Power", body: "Turn the GPU plan into megawatts at the meter and a yearly electricity bill." },
  { n: 2, title: "Timeline", body: "See when each phase goes live, which milestone it's waiting on, and how much slack the rest have." },
  { n: 3, title: "Delays", body: "Slip transformers, the grid hookup or GPU deliveries, and see what each month late costs and what to fix first." },
];

export function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 px-3 pt-3">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 rounded-full border border-line bg-surface py-2 pl-4 pr-2">
          <Logo />
          <a
            href={href("power", switchCampus(CAMPUSES[0]!.id))}
            onClick={linkClick(href("power", switchCampus(CAMPUSES[0]!.id)))}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:opacity-90"
          >
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-[1200px] px-4 pb-14 pt-16 sm:px-6 sm:pt-24">
          <p className="kicker">AI infrastructure · power · operations</p>
          <h1 className="mt-5 max-w-4xl text-[3rem] font-extrabold leading-[0.98] tracking-[-0.05em] text-balance sm:text-7xl">
            Can this AI campus go live <span className="bg-brand px-2 text-on-brand">on time?</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-2 sm:text-xl sm:leading-9">
            Loadline turns a campus's GPU plan into megawatts, finds the milestone holding up each phase, and shows what every month of delay
            costs, using real projects from Crusoe, CoreWeave and QTS.
          </p>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 sm:px-6" aria-label="Case studies">
          <div className="grid gap-4 md:grid-cols-3">
            {CAMPUSES.map((c) => {
              const plans = plan(c, defaultSettings(c));
              const it = plans.reduce((n, p) => n + p.itMw, 0);
              const last = plans[plans.length - 1]!;
              const perMonth = plans.reduce((n, p) => n + p.monthly.total, 0);
              const to = href("power", switchCampus(c.id));
              return (
                <a key={c.id} href={to} onClick={linkClick(to)} className="group flex flex-col rounded-3xl border border-line bg-surface p-6 transition hover:border-ink">
                  <p className="kicker">{c.company}</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">{c.site}</h2>
                  <p className="mt-1 text-sm text-ink-2">{c.tagline}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">IT power</dt>
                      <dd className="font-mono text-lg font-semibold">{formatMw(it)}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Fully live</dt>
                      <dd className="font-mono text-lg font-semibold">{formatMonth(last.now.live)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Each month late, full build</dt>
                      <dd className="font-mono text-lg font-semibold">{formatMoney(perMonth)}</dd>
                    </div>
                  </dl>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold">
                    Open this campus <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
          <p className="kicker">How it works</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-5xl">Three steps, one brief.</h2>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="bg-surface p-7">
                <span className="grid size-8 place-items-center rounded-full bg-brand font-mono text-sm font-semibold text-on-brand">{s.n}</span>
                <h3 className="mt-6 text-xl font-bold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-3xl text-ink-2">
            Every phase waits on {MILESTONES.length} things: {MILESTONES.map((m) => lowerFirst(m.label)).join(", ")}. Public facts link to
            their sources; everything else is a labeled, editable assumption.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
