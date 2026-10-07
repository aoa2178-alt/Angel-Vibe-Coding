import { Printer } from "lucide-react";
import { ladder } from "./AffordStep";
import { buildPlan } from "./BuildStep";
import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { afford } from "@/lib/afford";
import { DATA_TARGET, HANDSET_TARGET } from "@/lib/assumptions";
import { RETRIEVED, byIso, pct, people, share, shortName, usd } from "@/lib/data";
import { barrierRows, gap, groupRows } from "@/lib/gap";

const list = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);

/** The printable country memo. */
export function Brief() {
  const [s, setS] = useScenario("brief");
  const c = byIso(s.country)!;
  const name = shortName(c);
  const g = gap(c, s.build.gap);
  const barriers = barrierRows(c).slice(0, 3);
  const groups = groupRows(c);
  const women = groups.find((x) => x.id === "women");
  const men = groups.find((x) => x.id === "men");
  const r = afford(c, s.afford);
  const steps = ladder(c, s.afford);
  const base = steps[0]!.r;
  const { full, plan, split, unc } = buildPlan(c, s);
  const levers = steps.slice(1).map((x) => x.label.replace("+ ", "").toLowerCase());

  return (
    <Frame route="brief" s={s} setS={setS}>
      <StepHeading route="brief">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-brand">
          <Printer className="size-4" aria-hidden /> Print or save as PDF
        </button>
      </StepHeading>
      <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="border-b border-line pb-6">
          <p className="kicker">Country memo · Signal</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Connecting {name}</h2>
          <p className="mt-2 text-sm text-muted">
            {c.region} · {c.income} · World Bank data retrieved {RETRIEVED}
          </p>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {[
            ["Offline", people(g.offline)],
            ["No signal", people(g.noSignal)],
            ["Can afford it now", pct(base.share)],
            ["With the levers", pct(r.share)],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{k}</dt>
              <dd className="mt-1 font-mono text-lg font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <Section n={1} title="The gap">
          <p>
            {people(g.offline)} of {name}'s {people(g.pop)} people are offline ({pct(1 - g.online)}). About {people(g.noSignal)} have no mobile-broadband signal; the other {people(g.covered)} live within reach of one
            but aren't online: this usage gap is the bigger problem.
            {barriers.length > 0 && ` Asked why they don't own a smartphone, adults most often say ${list(barriers.map((b) => `${b.label.toLowerCase()} (${pct(b.share)})`))}.`}
            {women && men && women.smartShare !== null && men.smartShare !== null && ` ${pct(women.smartShare)} of women have a smartphone against ${pct(men.smartShare)} of men.`}
          </p>
        </Section>

        <Section n={2} title="Making it affordable">
          <p>
            At today's prices a {usd(base.prices.phone)} phone and a {usd(base.prices.data, 2)} 2GB plan are affordable to {pct(base.share)} of people ({people(base.people)}): the phone must cost under {pct(HANDSET_TARGET)} of a month's
            income and the plan under {pct(DATA_TARGET)}.{" "}
            {levers.length
              ? `With ${list(levers)}, that rises to ${pct(r.share)} (${people(r.people)}, ${people(r.people - base.people)} more). What holds people back now is ${r.binding === "phone" ? "the phone" : "the price of data"}.`
              : `${base.binding === "phone" ? "The phone is the wall: pay-as-you-go financing, run on mobile-money rails, is the first lever to test." : "The price of data is the wall: tax cuts and targeted subsidies are the levers."}`}
            {share(c, "mobileMoney") !== null && ` ${pct(share(c, "mobileMoney"))} of adults already have a mobile money account.`}
          </p>
        </Section>

        <Section n={3} title="Building coverage, and who pays">
          <p>
            Covering the {people(unc.total)} people without a signal ({people(unc.out.remote)} in remote areas, {people(unc.out.rural)} rural) costs about {usd(full)} over {s.build.years} years with the cheapest technology
            for each area. A budget of {usd(plan.spend)} connects {people(plan.users)} people by funding the cheapest first. Operators can carry {usd(split.operators)} (what users' bills repay) and the universal service fund {usd(split.usf)};{" "}
            {split.public > 0 ? `government and donors cover the remaining ${usd(split.public)}.` : "nothing is left for government or donors at this budget."}
          </p>
        </Section>

        <section className="mt-8">
          <h3 className="kicker">Recommendations</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-ink-2">
            <li>Lead with affordability, not towers: most offline people already have a signal.</li>
            {base.binding === "phone" && <li>Finance the phone: pay-as-you-go through mobile money, and review handset import duties.</li>}
            {(base.binding === "data" || r.binding === "data") && <li>Bring data under the 2% target: review taxes on data before subsidizing it, and target any subsidy at the poorest fifths.</li>}
            <li>Point the universal service fund at the viability gap in rural and remote areas, using reverse auctions so operators bid for the smallest subsidy.</li>
            <li>Pair connectivity with digital skills and electricity: a phone needs charging and its owner needs a reason to use it.</li>
          </ul>
        </section>
        <section className="mt-8">
          <h3 className="kicker">Caveats</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-7 text-ink-2">
            <li>Income is GNI per capita spread with the Gini: a rough guide to household budgets, not a survey of them.</li>
            <li>Data prices are ITU income-group medians unless edited; the coverage gap is GSMA's regional figure.</li>
            <li>Technology costs are illustrative, scaled to ITU's "Connecting Humanity" estimates.</li>
          </ul>
        </section>
        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          Sources: World Bank World Development Indicators and Global Findex 2025 (CC BY 4.0); ITU Facts and Figures 2024; GSMA State of Mobile Internet Connectivity 2025; ITU Connecting Humanity.
        </p>
      </article>
    </Frame>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
        <span className="grid size-7 place-items-center rounded-full bg-brand-soft font-mono text-xs font-semibold text-brand-ink">{n}</span>
        {title}
      </h3>
      <div className="mt-3 text-[16px] leading-8 text-ink-2">{children}</div>
    </section>
  );
}
