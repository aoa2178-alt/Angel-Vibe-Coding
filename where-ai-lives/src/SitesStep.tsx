import { ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import { StateSelect } from "./MapStep";
import { SECTOR_OPTIONS } from "./GridStep";
import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Scatter, type ScatterPoint } from "@/components/Scatter";
import { Card, Kicker, Pills } from "@/components/ui";
import { REGION_LABEL, STATE_REGION, cents, formatMw, pct, stateName, years } from "@/lib/data";
import { frontier } from "@/lib/dea";
import { byState, siteScores, type Sector } from "@/lib/metrics";

/** Links that rerun a sister app with a state's power price. */
export function economicsLinks(price: number) {
  return [
    { label: "Loadline: plan a campus at this price", href: `https://loadline-weld.vercel.app/power?price=${Math.round(price * 10)}` },
    { label: "Breakeven: own, rent or API at this price", href: `https://breakeven-silk.vercel.app/run-it?kwh=${(price / 100).toFixed(4)}` },
  ];
}

export function useScores(sector: Sector, at: string) {
  return useMemo(() => {
    const { units, results } = siteScores(sector);
    const totals = byState(at);
    const points: ScatterPoint[] = units.map((unit, k) => ({ unit, result: results[k]!, name: stateName(unit.id), mw: totals.get(unit.id)?.mw ?? 0 }));
    return { units, results, points, front: frontier(units, results) };
  }, [sector, at]);
}

export function SitesStep() {
  const [s, setS] = useScenario("sites");
  const { points, front } = useScores(s.sector, s.at);
  const sel = points.find((p) => p.unit.id === s.state);
  const unscored = s.state && !sel;
  const biggest = [...points].filter((p) => p.mw > 0).sort((a, b) => b.mw - a.mw).slice(0, 8);
  const priceWord = s.sector === "industrial" ? "industrial power price" : "commercial power price";

  return (
    <Frame route="sites" s={s}>
      <StepHeading route="sites">
        A site scorer from operations research (DEA) rates every state on power price and grid wait together, with no weights picked by hand.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Pills options={SECTOR_OPTIONS} value={s.sector} onChange={(sector) => setS({ ...s, sector })} label="Power price" />
          </div>
          <Scatter points={points} frontier={front} selected={s.state} onSelect={(code) => setS({ ...s, state: code })} xLabel={`${priceWord[0]!.toUpperCase()}${priceWord.slice(1)}, ¢/kWh`} />
          <p className="mt-3 text-xs leading-5 text-muted">
            Lower and further left is better on both counts. The frontier joins the states no mix of other states beats on price and wait at once. Click a state to see its benchmark: the dashed
            line runs to the origin, and the hollow dot is where it meets the frontier.
          </p>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <StateSelect s={s} setS={setS} />
            {sel ? (
              <div className="mt-4">
                <p className="text-xl font-bold tracking-tight">{sel.name}</p>
                <p className="mt-1 text-sm text-ink-2">
                  {cents(sel.unit.x1)}/kWh · {years(sel.unit.x2)} wait
                  <span className="block text-xs text-muted">Grid: {REGION_LABEL[STATE_REGION[sel.unit.id]?.region ?? ""] ?? "unknown region"}</span>
                </p>
                <p className="mt-4 font-mono text-3xl font-semibold">{sel.result.theta.toFixed(2)}</p>
                <p className="text-xs text-muted">DEA efficiency score (1.00 = on the frontier)</p>
                <p className="mt-3 text-sm leading-6 text-ink-2">
                  {sel.result.efficient
                    ? `On the frontier: no state, or mix of states, offers both cheaper power and a shorter wait.`
                    : sel.result.theta > 0.999
                      ? `Not beaten on both at once by the same share, but ${sel.result.peers.map((p) => stateName(p.id)).join(" and ")} match it on one count and beat it on the other.`
                      : `A mix of ${sel.result.peers.map((p) => `${pct(p.weight)} ${stateName(p.id)}`).join(" and ")} needs only ${pct(sel.result.theta)} of its price and wait: power at ${cents(sel.result.target.x1)} with a ${years(sel.result.target.x2)} wait. To match it, ${sel.name} would need both about ${pct(1 - sel.result.theta)} better.`}
                </p>
                <p className="mt-2 text-sm text-ink-2">AI power there now: {sel.mw > 0 ? formatMw(sel.mw) : "none tracked"}.</p>
                <p className="kicker mt-5">Run this site's economics</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {economicsLinks(sel.unit.x1).map((l) => (
                    <li key={l.href}>
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-ink underline underline-offset-2">
                        {l.label} <ArrowUpRight className="size-3.5" aria-hidden />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : unscored ? (
              <p className="mt-4 text-sm text-ink-2">{stateName(s.state)} can't be scored: its grid region has no published wait (New England), or it isn't in the queue data (Alaska, Hawaii).</p>
            ) : (
              <div className="mt-4 text-sm text-ink-2">
                <p>Pick a state, or try one of the biggest AI hubs:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["VA", "OH", "TX", "GA"].map((c) => (
                    <button key={c} type="button" onClick={() => setS({ ...s, state: c })} className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:border-brand">
                      {stateName(c)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
          <Card>
            <Kicker>On the frontier</Kicker>
            <ul className="mt-2 space-y-1.5 text-sm">
              {front.map((u) => (
                <li key={u.id} className="flex justify-between gap-3">
                  <button type="button" onClick={() => setS({ ...s, state: u.id })} className="text-left hover:text-brand-ink">
                    {stateName(u.id)}
                  </button>
                  <span className="font-mono text-xs">
                    {cents(u.x1)} · {years(u.x2)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="kicker mt-5">The biggest AI states</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {biggest.map((p) => (
                <li key={p.unit.id} className="flex justify-between gap-3">
                  <button type="button" onClick={() => setS({ ...s, state: p.unit.id })} className="text-left hover:text-brand-ink">
                    {p.name} <span className="text-xs text-muted">{formatMw(p.mw)}</span>
                  </button>
                  <span className="font-mono text-xs">{p.result.theta.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <Kicker method="Data Envelopment Analysis">How the score works</Kicker>
          <ul className="mt-3 space-y-2 text-[15px] leading-7 text-ink-2">
            <li>Each state is a "unit" that uses two inputs to host a data center: a power price and a grid wait. Less of each is better.</li>
            <li>DEA asks: could a mix of other states do the same job with less of both? The score is the smallest share of a state's inputs that some mix still matches.</li>
            <li>No weights are chosen by hand. Each state is judged on the trade-off that flatters it most, so a low score is hard to argue with.</li>
            <li>With two inputs, the answer is geometric: the frontier is the lower-left edge of the points, and every state is measured along a straight line toward zero.</li>
          </ul>
        </Card>
        <Card>
          <Kicker>Read it with care</Kicker>
          <ul className="mt-3 space-y-2 text-[15px] leading-7 text-ink-2">
            <li>Grid waits are by region, so states in one region share a wait, and the score mostly separates regions. Within a region, the cheapest state sits closest to the frontier.</li>
            <li>The wait is for new power plants, a proxy for how fast a region adds supply, not a data center's own hookup time.</li>
            <li>Prices are state averages; a large site negotiates its own contract.</li>
            <li>Land, water, fiber, tax breaks and on-site generation also decide real sites. This scores the grid only.</li>
          </ul>
        </Card>
      </div>
    </Frame>
  );
}
