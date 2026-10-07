import { Frame, useScenario } from "@/components/Frame";
import { Card, SourceLink } from "@/components/ui";
import { BIDS, PRICES, formatMoney, formatMonth, pct } from "@/lib/data";

const METHODS: [string, string][] = [
  ["Pareto", "categories sorted by spend; the share of spend each covers, and the running total"],
  ["Should-cost", "materials (quantity × public price) + labor (hours × wage × 2) + 30% overhead + engineering + freight, then a 15% margin"],
  ["Index check", "the same build-up at January 2019 prices (each line scaled by its public index) against the transformer producer price index"],
  ["Total cost of ownership", "price + freight and duty + interest on cash paid up front until delivery + expected test failures (a quarter of the unit price each) + months late × cost of a month late"],
  ["Cost of a month late", "IT MW × lease rate + build cost × cost of capital ÷ 12, as in Loadline"],
  ["Scorecard", "cost, delivery, quality, supply risk and capacity scored 1–5, weighted, scaled to 100"],
  ["Award split", "the hall needs two units; chance it slips = chance the suppliers that don't fail deliver fewer than two units, with each supplier failing independently"],
  ["Negotiation", "walk-away = the unit price that makes the chosen bid's total match the runner-up's; target = quote × cost growth ÷ price growth; floor = should-cost with a 5% margin"],
];

/** Where the prices come from, what's assumed, and the methods. */
export function Sources() {
  const [s, setS] = useScenario("sources");
  return (
    <Frame route="sources" s={s} setS={setS}>
      <div className="mb-8 max-w-3xl">
        <p className="kicker">Sources</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">Public prices, fictional suppliers</h1>
        <p className="mt-4 text-lg leading-8 text-ink-2">
          The buyer, the suppliers and their bids are made up. The prices that move them (copper, steel, wages and equipment price indexes) are public US data, retrieved{" "}
          {PRICES.retrieved}.
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <p className="kicker">Public price series (FRED)</p>
          <ul className="mt-2 divide-y divide-line">
            {Object.values(PRICES.series).map((x) => (
              <li key={x.id} className="grid gap-1 py-3 text-sm leading-6 sm:grid-cols-[1fr_14rem] sm:gap-6">
                <span>
                  <span className="block font-semibold">{x.title}</span>
                  <SourceLink href={x.source}>{x.id}</SourceLink>
                </span>
                <span className="font-mono text-xs text-ink-2">
                  {formatMonth(x.points[0]!.month)}: {x.points[0]!.value.toLocaleString("en-US")} → {formatMonth(x.points.at(-1)!.month)}: {x.points.at(-1)!.value.toLocaleString("en-US")} (
                  {x.points.at(-1)!.value >= x.points[0]!.value ? "+" : ""}
                  {pct(x.points.at(-1)!.value / x.points[0]!.value - 1)})
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="kicker">Transformer anchors</p>
          <ul className="mt-2 grid gap-2 text-[15px] leading-7 text-ink-2">
            <li>
              Large power transformers "can cost as high as $10 million". <SourceLink href="https://www.gao.gov/products/gao-23-106180">GAO-23-106180</SourceLink>
            </li>
            <li>
              Power transformer lead times averaged 128 weeks in Wood Mackenzie's second-quarter 2025 survey, with prices up 77% since 2019.{" "}
              <SourceLink href="https://www.powermag.com/transformers-in-2026-shortage-scramble-or-self-inflicted-crisis">POWER magazine</SourceLink>
            </li>
          </ul>
        </Card>
        <Card>
          <p className="kicker">The fictional bids</p>
          <ul className="mt-2 grid gap-1.5 text-sm leading-6 text-ink-2">
            {BIDS.map((b) => (
              <li key={b.supplier}>
                <span className="font-semibold text-ink">{b.supplier}</span> ({b.country}): {formatMoney(b.price)} a unit, {b.leadMonths}-month lead, {pct(b.freight)} freight and duty,{" "}
                {pct(b.upfront)} up front, {pct(b.defect, 1)} test failures, {b.warrantyYears}-year warranty.
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-muted">
            Quotes sit between the should-cost and GAO's upper bound; Volta's lead time matches the 2025 survey average. Spend quantities, other category prices and savings ranges
            are illustrative.
          </p>
        </Card>
        <Card>
          <p className="kicker">Methods</p>
          <dl className="mt-2 divide-y divide-line text-sm">
            {METHODS.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="font-semibold">{k}</dt>
                <dd className="font-mono text-[13px] leading-6 text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </Frame>
  );
}
