import { Frame, useScenario } from "@/components/Frame";
import { Card, SourceLink } from "@/components/ui";
import { DATA, PRODUCTS, formatMoney, formatMonth, formatUnits, pct } from "@/lib/products";

const METHODS: [string, string][] = [
  ["Forecast accuracy", "WAPE = Σ|forecast − actual| ÷ Σ actual over the 12 held-out months; bias = Σ(forecast − actual) ÷ Σ actual"],
  ["Holt-Winters", "additive level, trend and 12-month season; smoothing constants chosen by the smallest one-step error"],
  ["Safety stock", "z(service level) × forecast error × √(lead time + 1 review month)"],
  ["Order size (EOQ)", "√(2 × yearly demand × order cost ÷ holding cost per unit a year), at least one month's demand"],
  ["Monthly plan", "MRP netting: orders inside the lead time are already placed; after that, receipts in EOQ lots keep month-end stock ≥ safety stock"],
  ["Shortage cost and fill rate", "expected units short per cycle = forecast error over the lead time × G(z), the normal loss function"],
  ["Launch quantity", "newsvendor: Q* = mean + z × σ at the critical ratio (price − cost) ÷ ((price − cost) + (cost − salvage))"],
  ["Allocation", "fair share (same fill rate everywhere), priority order, or most margin per unit first"],
  ["Bullwhip", "each tier orders q = incoming + (L + 1) × change in its moving-average forecast; swing = variance of orders ÷ variance of demand"],
];

/** Where the data comes from, what's assumed, and the methods. */
export function Sources() {
  const [s, setS] = useScenario("sources");
  return (
    <Frame route="sources" s={s} setS={setS}>
      <div className="mb-8 max-w-3xl">
        <p className="kicker">Sources</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">Real demand, fictional products</h1>
        <p className="mt-4 text-lg leading-8 text-ink-2">
          The demand history is real public US data, downloaded {DATA.retrieved}. The products, the company and their prices are made up, so nothing here is
          any company's confidential data. Every assumption is editable in the app.
        </p>
      </div>

      <div className="grid gap-6">
        {PRODUCTS.map((p) => (
          <Card key={p.id}>
            <p className="kicker">
              {p.name} · {p.kind}
            </p>
            <p className="mt-2 text-[15px] leading-7 text-ink-2">
              <span className="font-semibold text-ink">Demand pattern:</span> {p.series.title}, {p.series.unit}, {formatMonth(p.series.points[0]!.month)} to{" "}
              {formatMonth(p.series.points.at(-1)!.month)}. {p.series.publisher}. <SourceLink href={p.series.source}>{p.series.id} on FRED</SourceLink>
            </p>
            <p className="mt-2 text-[15px] leading-7 text-ink-2">
              <span className="font-semibold text-ink">Why it fits:</span> {p.why} Rescaled so the last 12 months average {formatUnits(p.baseUnits)} units a month.
            </p>
            <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
              {[
                ["Price", formatMoney(p.defaults.price)],
                ["Unit cost", formatMoney(p.defaults.unitCost)],
                ["Holding cost", `${pct(p.defaults.holdPerMonth, 1)} of cost a month (${pct(p.defaults.holdPerMonth * 12)} a year)`],
                ["Order cost", `${formatMoney(p.defaults.orderCost)} per production run`],
                ["Lead time", `${p.defaults.leadMonths} months`],
                ["Leftover value", `${pct(p.defaults.salvageShare)} of cost`],
                ["Regions", p.regions.map((r) => `${r.label} ${pct(r.share)} at ${formatMoney(r.price)}`).join(" · ")],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">{k} · assumption</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}

        <Card>
          <p className="kicker">Why not the Walmart (M5) data?</p>
          <p className="mt-2 text-[15px] leading-7 text-ink-2">
            Kaggle's M5 competition data is real Walmart sales, but its rules allow non-commercial use only and forbid publishing or making it available to anyone
            who hasn't joined the competition. A public app can't show it, so Throughline uses public-domain US Census series instead.
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
          <p className="mt-3 text-xs leading-5 text-muted">
            Holding cost of 24–36% a year follows the usual planning range (capital, storage, insurance and obsolescence; fast-aging GPU servers sit at the top).
            Prices, costs, lead times and regional splits are illustrative assumptions, not any company's figures.
          </p>
        </Card>
      </div>
    </Frame>
  );
}
