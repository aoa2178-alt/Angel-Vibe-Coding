import { Printer } from "lucide-react";
import { useMemo } from "react";
import { useScores } from "./SitesStep";
import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { PRICES, REGIONS, RETRIEVED, SITES, STATE_REGION, WAIT_YEARS, cents, formatMonth, formatMw, mwAt, ownerLabel, pct, stateName, years } from "@/lib/data";
import { byOwner, byState, powerWeighted, totalMw } from "@/lib/metrics";

/** The printable one-pager: where AI lives, what the grid looks like there, and where the next site should go. */
export function Brief() {
  const [s, setS] = useScenario("brief");
  const at = s.at;
  const when = at === RETRIEVED ? "today" : formatMonth(at);
  const totals = useMemo(() => byState(at), [at]);
  const { points, front } = useScores(s.sector, at);
  const top = [...totals.values()].sort((a, b) => b.mw - a.mw).slice(0, 5);
  const total = totalMw(at);
  const later = totalMw("2028-12-31");
  const owners = byOwner(at).filter((o) => o.mw > 0).slice(0, 3);
  const bigSites = [...SITES].map((x) => ({ x, mw: mwAt(x, at) })).sort((a, b) => b.mw - a.mw).slice(0, 3);
  const us = PRICES.states.US?.[s.sector] ?? null;
  const aiPrice = powerWeighted(at, (c) => PRICES.states[c]?.[s.sector] ?? null);
  const aiWait = powerWeighted(at, (c) => REGIONS[STATE_REGION[c]?.region ?? ""]?.waitYears ?? null);
  const regions = Object.entries(REGIONS).filter(([, r]) => r.waitYears !== null).sort((a, b) => a[1].waitYears! - b[1].waitYears!);
  const hubs = points.filter((p) => p.mw > 0).sort((a, b) => b.mw - a.mw).slice(0, 5);
  const focus = points.find((p) => p.unit.id === s.state);
  const lowHub = hubs.reduce<(typeof hubs)[number] | null>((lo, p) => (!lo || p.result.theta < lo.result.theta ? p : lo), null);

  return (
    <Frame route="brief" s={s}>
      <StepHeading route="brief">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-brand"
        >
          <Printer className="size-4" aria-hidden /> Print or save as PDF
        </button>
      </StepHeading>
      <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="border-b border-line pb-6">
          <p className="kicker">Site brief · Where AI Lives</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Where AI lives, and where the next site should go</h2>
          <p className="mt-2 text-sm text-muted">
            As of {formatMonth(at)} · data retrieved {RETRIEVED} · {s.sector} power prices
          </p>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {[
            [`AI power, ${when}`, formatMw(total)],
            ["By end of 2028", formatMw(later)],
            ["AI's power price", `${cents(aiPrice)}/kWh`],
            ["AI's grid wait", years(aiWait)],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{k}</dt>
              <dd className="mt-1 font-mono text-lg font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <Section n={1} title="Where AI lives">
          <p>
            {SITES.length} tracked US sites draw {formatMw(total)} {when}, and announced timelines take that to {formatMw(later)} by the end of 2028. The biggest states are{" "}
            {list(top.map((t) => `${stateName(t.code)} (${formatMw(t.mw)})`))}. The largest owners are{" "}
            {list(owners.map((o) => `${ownerLabel(o.owner)} (${formatMw(o.mw)})`))}; the largest single sites are {list(bigSites.map((b) => `${b.x.name} (${formatMw(b.mw)})`))}.
          </p>
        </Section>

        <Section n={2} title="The grid where it lives">
          <p>
            AI power pays {cents(aiPrice)}/kWh on average, weighted by where it sits, against a US average of {cents(us)}: builders have chased cheap power. Connections are slower. AI's power sits in
            regions where new power plants waited a median {years(aiWait)} to connect ({WAIT_YEARS}); the fastest region is {regions[0]?.[0]} ({years(regions[0]?.[1].waitYears ?? null)}) and the
            slowest is {regions.at(-1)?.[0]} ({years(regions.at(-1)?.[1].waitYears ?? null)}).
          </p>
        </Section>

        <Section n={3} title="Where the next one should go">
          <p>
            On price and wait together (DEA, no hand-picked weights), the efficient frontier is {front.map((u) => `${stateName(u.id)} (${cents(u.x1)}, ${years(u.x2)})`).join(" and ")}. Among today's
            biggest hubs, {list(hubs.map((p) => `${p.name} scores ${p.result.theta.toFixed(2)}`))}.
            {lowHub && lowHub.result.theta < 0.9 && ` ${lowHub.name} is the clearest mismatch: a mix of frontier states offers both cheaper power and a faster connection by about ${pct(1 - lowHub.result.theta)}.`}
          </p>
          {focus && (
            <p className="mt-3">
              <span className="font-semibold text-ink">{focus.name}:</span> score {focus.result.theta.toFixed(2)}, {cents(focus.unit.x1)}/kWh and a {focus.unit.x2.toFixed(1)}-year wait.{" "}
              {focus.result.efficient ? "It's on the frontier." : `Its benchmark is ${focus.result.peers.map((p) => `${pct(p.weight)} ${stateName(p.id)}`).join(" + ")}.`}
            </p>
          )}
        </Section>

        <section className="mt-8">
          <h3 className="kicker">Caveats</h3>
          <ul className="mt-3 space-y-2 text-[15px] leading-7 text-ink-2">
            <li>Future power follows announced timelines (Epoch AI's satellite and permit tracking); projects slip and get cancelled.</li>
            <li>The grid wait is for new power plants by region, a proxy; data centers' own hookup times aren't published consistently.</li>
            <li>Prices are state averages ({PRICES.period.replace(" YTD", " year to date")}); land, water, fiber, tax and on-site power also decide real sites.</li>
          </ul>
        </section>
        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          Sources: Epoch AI "Frontier Data Centers" (CC BY 4.0); EIA Electric Power Monthly Table 5.6.B; Lawrence Berkeley National Laboratory interconnection queue data; US Census geocoder.
        </p>
      </article>
      <p className="mt-4 text-center text-xs text-muted print:hidden">
        Change the date or price type in steps 1–3; {s.state ? `${stateName(s.state)} is included because it's in focus.` : "focus a state in step 3 to add it here."}{" "}
        {s.state && (
          <button type="button" onClick={() => setS({ ...s, state: "" })} className="underline underline-offset-2">
            Remove it
          </button>
        )}
      </p>
    </Frame>
  );
}

/** "a, b and c" */
const list = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);

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
