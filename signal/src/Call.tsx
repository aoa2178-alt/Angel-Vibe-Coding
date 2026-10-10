import { Check, Printer, X } from "lucide-react";
import { useMemo } from "react";
import { ladder } from "./AffordStep";
import { buildPlan } from "./BuildStep";
import { Bars } from "@/components/Bars";
import { Frame, StepHeading, href, linkClick, useScenario } from "@/components/Frame";
import { Cascade, anim, useInView } from "@/components/Motion";
import { afford } from "@/lib/afford";
import { DATA_TARGET, HANDSET_TARGET } from "@/lib/assumptions";
import { leverOptions, measures, ranked, sensitivities, type LeverOption } from "@/lib/call";
import { RETRIEVED, byIso, pct, people, share, shortName, usd } from "@/lib/data";
import { barrierRows, gap } from "@/lib/gap";

const GREEN = "var(--s-green)";
const BLUE = "var(--s-blue)";
const list = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);
const per = (o: LeverOption) => (Number.isFinite(o.perPerson) ? usd(o.perPerson) : "connects no one");

/**
 * The call: the recommendation first, then the evidence, what would change it, how to land it, how we'd know it worked,
 * and the judgment calls behind it. Printable as the country memo.
 */
export function Call() {
  const [s, setS] = useScenario("call");
  const c = byIso(s.country)!;
  const name = shortName(c);
  const g = gap(c, s.build.gap);
  const options = useMemo(() => ranked(leverOptions(c, s.afford, s.build)), [c, s.afford, s.build]);
  const sens = useMemo(() => sensitivities(c, s.afford, s.build), [c, s.afford, s.build]);
  const lead = options[0]!;
  const towers = options.find((o) => o.id === "towers")!;
  const pkg = options.find((o) => o.id === "package")!;
  const deadweight = options.filter((o) => o.deadweight !== null && o.deadweight > 0.5);
  const noOne = options.filter((o) => o.people === 0);
  const today = ladder(c, { ...s.afford, payg: false, handsetTaxCut: 0, dataTaxCut: 0, dataSubsidy: 0 })[0]!.r;
  const barrier = barrierRows(c)[0];
  const { split } = buildPlan(c, s);
  const m = measures(c);
  const multiple = Number.isFinite(lead.perPerson) && Number.isFinite(towers.perPerson) && lead.id !== "towers" ? towers.perPerson / lead.perPerson : null;
  const targetOnline = m.online !== null ? Math.min(100, m.online + ((lead.people + (lead.id === "towers" ? 0 : towers.people)) / g.pop) * 100) : null;
  const phoneBinds = today.binding === "phone";
  const r = afford(c, s.afford);
  const landing = useInView<HTMLDivElement>();

  return (
    <Frame route="call" s={s} setS={setS}>
      <StepHeading route="call">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-brand">
          <Printer className="size-4" aria-hidden /> Print or save as PDF
        </button>
      </StepHeading>

      <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="border-b border-line pb-6">
          <p className="kicker">The call · {name}</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Where should {name}'s next dollar for connectivity go?</h2>
          <p className="mt-2 text-sm text-muted">
            {people(g.offline)} people offline · {c.region} · {c.income} · World Bank data retrieved {RETRIEVED}
          </p>
        </header>

        {/* 1. The recommendation, answer first */}
        <section className="mt-6 rounded-2xl border-2 border-brand bg-brand-soft p-5 sm:p-6" style={anim("rise", 600, 0, "back")}>
          <p className="kicker">1 · My recommendation</p>
          <p className="mt-2 text-xl font-bold leading-snug tracking-tight sm:text-2xl">
            <Cascade
              key={`${c.iso3}-${lead.id}`}
              delay={150}
              text={`${lead.id === "towers" ? "Build coverage first" : `Start with ${lead.label.toLowerCase()}`}: it gets ${people(lead.people)} people online for about ${per(lead)} of public money each${multiple && multiple > 1.2 ? `, ${multiple.toFixed(1)}× less per person than building towers` : ""}.`}
            />
          </p>
          <ul className="mt-4 space-y-2 text-[15px] leading-7 text-ink-2">
            {lead.id !== "package" && pkg.people > lead.people && Number.isFinite(pkg.perPerson) && (
              <li>
                {pkg.perPerson <= towers.perPerson ? (
                  <>
                    <span className="font-semibold text-ink">Then:</span> remove data taxes once phones are financed. Together they reach {people(pkg.people)} people at {usd(pkg.perPerson)} each.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-ink">Data taxes can wait:</span> removing them on top of phone financing reaches {people(pkg.people)} people but at {usd(pkg.perPerson)} each, more than
                    building coverage ({per(towers)}), because most of the tax cut goes to people already online.
                  </>
                )}
              </li>
            )}
            {lead.id !== "towers" && (
              <li>
                <span className="font-semibold text-ink">In parallel:</span> point the universal service fund at the {people(g.noSignal)} people with no signal. Covering them connects {people(towers.people)} at{" "}
                {per(towers)} of public money each; operators carry {usd(split.operators)} of a full build.
              </li>
            )}
            {noOne.length > 0 && (
              <li>
                <span className="font-semibold text-ink">Not now:</span> {list(noOne.map((o) => o.label.toLowerCase()))}. While the phone is the barrier, {noOne.length > 1 ? "they" : "it"} would add no one.
              </li>
            )}
          </ul>
        </section>

        {/* 2. Why: the comparison */}
        <section className="mt-8">
          <p className="kicker">2 · Why</p>
          <div className="mt-3">
            <Bars
              title="Public money per person newly online, each lever on its own"
              ariaLabel="Public cost per person newly connected for each policy lever"
              rows={options.map((o) => ({
                label: o.label,
                values: [{ value: Number.isFinite(o.perPerson) ? o.perPerson : 0, color: o.id === lead.id ? GREEN : BLUE }],
                note: Number.isFinite(o.perPerson) ? `${usd(o.perPerson)} · ${people(o.people)}` : "adds no one",
              }))}
              max={Math.max(...options.filter((o) => Number.isFinite(o.perPerson)).map((o) => o.perPerson), 1)}
              format={(x) => usd(x)}
            />
          </div>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] leading-7 text-ink-2">
            <li>
              <span className="font-semibold text-ink">The problem is use, not signal.</span> {people(g.covered)} of the {people(g.offline)} offline people already have a signal (
              {pct(g.covered / (g.offline || 1))}); only {people(g.noSignal)} need a network built.
            </li>
            <li>
              <span className="font-semibold text-ink">{phoneBinds ? "The phone is the wall." : "The data price is the wall."}</span>{" "}
              {phoneBinds
                ? `A ${usd(today.prices.phone)} phone needs ${usd(today.needPhone)} of monthly income to pass the ${pct(HANDSET_TARGET)} test, against an average of ${usd(today.meanMonthly)}; only ${pct(today.share)} can afford a phone and data today.`
                : `A ${usd(today.prices.data, 2)} plan needs ${usd(today.needData)} of monthly income to pass the ${pct(DATA_TARGET)} test.`}
              {barrier && ` Adults agree: "${barrier.label.toLowerCase()}" is their top reason (${pct(barrier.share)}).`}
            </li>
            <li>
              <span className="font-semibold text-ink">Blanket cuts leak.</span>{" "}
              {deadweight.length
                ? `${list(deadweight.map((o) => `${pct(o.deadweight)} of "${o.label.toLowerCase()}"`))} would go to people who'd pay anyway.`
                : "Tax cuts and subsidies are paid on every user, not just new ones, so their cost per new person runs high."}{" "}
              Financing reaches only the people who need it.
            </li>
          </ol>
          <p className="mt-3 text-xs leading-5 text-muted">
            Each lever is tested alone against today's prices, over {s.build.years} years at {pct(s.build.rate)}. People count only where there's a signal and only the {pct(s.build.adoption)} who go online, the same rate as
            for towers. Pay-as-you-go cost = a public guarantee on {pct(s.afford.defaultRate)} defaults, renewed with each phone (every 3 years).
          </p>
        </section>

        {/* 3. What would change my mind */}
        <section className="mt-8">
          <p className="kicker">3 · What would change my mind</p>
          <ul className="mt-3 space-y-2 text-[15px] leading-7 text-ink-2">
            {sens.map((x) => (
              <li key={x.label} className="flex gap-2.5">
                {x.holds ? <Check className="mt-1.5 size-4 shrink-0 text-brand" aria-label="Holds" /> : <X className="mt-1.5 size-4 shrink-0 text-coral" aria-label="Changes" />}
                <span>
                  {x.label}: {x.holds ? "the recommendation holds." : <>the lead becomes <span className="font-semibold text-ink">{x.lead.label.toLowerCase()}</span>.</>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 4. How to land it */}
        <section className="mt-8">
          <p className="kicker">4 · How to land it</p>
          <div ref={landing.ref} className={`mt-3 grid gap-3 sm:grid-cols-3 ${landing.paused}`}>
            {[
              {
                when: "First 30 days",
                what:
                  lead.id === "towers"
                    ? ["Ministry and regulator agree the uncovered areas", "Design the reverse auction for the service fund", "Set the subsidy cap per site"]
                    : ["Ministry, regulator and the central bank agree the guarantee", "Pick 2–3 phone-financing partners already running on mobile money", "Fix the default-rate trigger that pauses lending"],
              },
              {
                when: "60 days",
                what:
                  lead.id === "towers"
                    ? ["Run the first auction round", "Operators bid the smallest subsidy per area", "Publish the coverage map"]
                    : ["Pilot in two regions, one rural", "Bundle a starter data plan and basic digital-skills onboarding", "Track repayments weekly"],
              },
              {
                when: "90 days",
                what:
                  lead.id === "towers"
                    ? ["First sites contracted", "Pair each site with an affordability offer", "Report cost per connection"]
                    : ["Go or no-go on national scale-up", `Review data taxes, the next barrier`, "Commission the coverage auction for the remaining no-signal areas"],
              },
            ].map((col, i) => (
              <div key={col.when} className="rounded-xl border border-line p-4" style={anim("rise", 600, 200 + i * 150, "back")}>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-ink">{col.when}</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6 text-ink-2">
                  {col.what.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-2">
            <span className="font-semibold text-ink">The hard part is people, not technology:</span> lenders must trust the guarantee, the treasury must accept forgone tax, and first-time users need a reason and the skills to stay online.
            Owners: the ministry (policy), the regulator (spectrum and the service fund), mobile-money providers (financing), operators (build and data plans).
          </p>
        </section>

        {/* 5. How we'd know it worked */}
        <section className="mt-8">
          <p className="kicker">5 · How we'd know it worked</p>
          <div className="mt-3 overflow-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-sunken text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Measure</th>
                  <th className="px-3 py-2 text-right font-medium">Today</th>
                  <th className="px-3 py-2 text-right font-medium">Aim</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line">
                  <td className="px-3 py-2">People using the internet</td>
                  <td className="px-3 py-2 text-right font-mono">{m.online === null ? "–" : `${m.online.toFixed(0)}%`}</td>
                  <td className="px-3 py-2 text-right font-mono">{targetOnline === null ? "–" : `${targetOnline.toFixed(0)}%`}</td>
                </tr>
                <tr className="border-t border-line">
                  <td className="px-3 py-2">Smartphone ownership, poorest 40% of adults</td>
                  <td className="px-3 py-2 text-right font-mono">{m.smartPoor === null ? "–" : `${m.smartPoor.toFixed(0)}%`}</td>
                  <td className="px-3 py-2 text-right font-mono">{m.smartPoor === null ? "–" : `${Math.min(100, m.smartPoor + 10).toFixed(0)}%`}</td>
                </tr>
                <tr className="border-t border-line">
                  <td className="px-3 py-2">Smartphone ownership, women</td>
                  <td className="px-3 py-2 text-right font-mono">{m.smartWomen === null ? "–" : `${m.smartWomen.toFixed(0)}%`}</td>
                  <td className="px-3 py-2 text-right font-mono">{m.smart === null ? "–" : `${m.smart.toFixed(0)}% (close the gap)`}</td>
                </tr>
                <tr className="border-t border-line">
                  <td className="px-3 py-2">Public money per person newly online</td>
                  <td className="px-3 py-2 text-right font-mono">–</td>
                  <td className="px-3 py-2 text-right font-mono">≤ {per(lead)}</td>
                </tr>
                {lead.id !== "towers" && (
                  <tr className="border-t border-line">
                    <td className="px-3 py-2">Default rate on financed phones</td>
                    <td className="px-3 py-2 text-right font-mono">–</td>
                    <td className="px-3 py-2 text-right font-mono">≤ {pct(s.afford.defaultRate)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">Aims over {s.build.years} years if the plan lands as modeled; the Findex measures are re-surveyed every few years, so pair them with operator and lender data in between.</p>
        </section>

        {/* 6. Judgment calls */}
        <section className="mt-8">
          <p className="kicker">6 · My judgment calls</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-ink-2">
            <li>
              <span className="font-semibold text-ink">One yardstick for every lever:</span> public money per person newly online, counted the same way for towers and for prices. Comparing total spend would favor whatever is
              cheapest overall, not what reaches people.
            </li>
            <li>
              <span className="font-semibold text-ink">Income from GNI and inequality:</span> a lognormal with the World Bank's mean and Gini. It's a model of household budgets, not a survey; good for ranking levers, rough for exact counts.
            </li>
            <li>
              <span className="font-semibold text-ink">Cited defaults, not copied data:</span> ITU's per-country prices can't be republished (non-commercial license), so I used its published medians by income group and made every price editable.
            </li>
            <li>
              <span className="font-semibold text-ink">Left out:</span> skills programs, electricity ({share(c, "electricity") === null ? "no data" : `${pct(share(c, "electricity"))} have it`}), content in local languages, and how the phone lenders' own
              economics work. Each could change uptake.
            </li>
            <li>
              <span className="font-semibold text-ink">Estimates I'd test first:</span> the {pct(s.afford.defaultRate)} default rate, the tax shares in prices, and technology costs per person. Each is editable on its step.
            </li>
          </ul>
        </section>

        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          Evidence: <a href={href("gap", s)} onClick={linkClick(href("gap", s))} className="underline underline-offset-2">Gap</a> ·{" "}
          <a href={href("afford", s)} onClick={linkClick(href("afford", s))} className="underline underline-offset-2">Afford</a> ({pct(r.share)} can afford a phone and data at your settings) ·{" "}
          <a href={href("build", s)} onClick={linkClick(href("build", s))} className="underline underline-offset-2">Build</a>. Sources: World Bank WDI and Global Findex 2025 (CC BY 4.0); ITU Facts and Figures 2024; GSMA State of
          Mobile Internet Connectivity 2025; ITU Connecting Humanity.
        </p>
      </article>
    </Frame>
  );
}
