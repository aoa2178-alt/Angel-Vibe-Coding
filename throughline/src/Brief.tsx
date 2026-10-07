import { Printer } from "lucide-react";
import { Frame, useScenario } from "@/components/Frame";
import { SourceLink } from "@/components/ui";
import { RULES } from "@/lib/allocate";
import { METHODS } from "@/lib/forecast";
import { formatMoney, formatMonth, formatUnits, pct } from "@/lib/products";
import { run } from "@/lib/run";

/** One printable page: the weekly exec update for operations leadership. */
export function Brief() {
  const [s, setS] = useScenario("brief");
  const r = run(s);
  const { product, fc, plan, launch, allocation: a, ripple } = r;
  const chosen = fc.scores.find((x) => x.method === fc.method)!;
  const nextYear = fc.forecast.reduce((x, y) => x + y, 0);
  const lastYear = r.hist.slice(-12).reduce((x, h) => x + h.units, 0);
  const peak = fc.forecast.reduce((best, v, i) => (v > fc.forecast[best]! ? i : best), 0);
  const worst = a.regions.reduce((x, y) => (y.fillRate < x.fillRate ? y : x));

  return (
    <Frame route="brief" s={s} setS={setS}>
      <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="kicker">Supply & demand update · {product.company}</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">{product.name}</h1>
            <p className="mt-1 text-sm text-muted">
              Prepared {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · data through {formatMonth(r.lastMonth)}
            </p>
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-sm font-semibold transition hover:border-brand print:hidden">
            <Printer className="size-4" aria-hidden /> Print or save PDF
          </button>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {[
            ["Next 12 months", `${formatUnits(nextYear)} units`],
            ["Forecast error", pct(chosen.wape, 1)],
            ["Safety stock", `${formatUnits(plan.safetyStock)} units`],
            ["Plan cost a year", formatMoney(plan.totalCost)],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{k}</dt>
              <dd className="mt-1 font-mono text-lg font-semibold sm:text-xl">{v}</dd>
            </div>
          ))}
        </dl>

        {[
          {
            title: "Demand",
            body: `We expect ${formatUnits(nextYear)} units over the next 12 months, ${nextYear >= lastYear ? "up" : "down"} ${pct(Math.abs(nextYear / lastYear - 1), 1)} on the last 12, peaking in ${formatMonth(r.futureMonths[peak]!)} at ${formatUnits(fc.forecast[peak]!)}. The forecast uses ${METHODS.find((m) => m.id === fc.method)!.label.toLowerCase()}, which missed by ${pct(chosen.wape, 1)} on the last 12 months and ${chosen.bias >= 0 ? "over" : "under"}-forecast by ${pct(Math.abs(chosen.bias), 1)}.`,
          },
          {
            title: "Supply plan",
            body: `At a ${pct(s.settings.serviceLevel, 1)} service level we hold ${formatUnits(plan.safetyStock)} units of safety stock and order ${plan.rawEoq < plan.monthlyDemand ? "every month" : `${formatUnits(plan.eoq)} at a time`}, with a ${s.settings.leadMonths}-month lead time. Expected fill rate is ${pct(plan.fillRate, 1)}, at ${formatMoney(plan.totalCost)} a year in holding, ordering and shortage costs. For the next model's first quarter, build ${formatUnits(launch.quantity)} units (newsvendor, ${pct(launch.criticalRatio)} critical ratio).`,
          },
          {
            title: "If supply falls short",
            body: `With a ${pct(s.cut)} supply cut next month, the ${RULES.find((x) => x.id === s.rule)!.label.toLowerCase()} rule earns ${formatMoney(a.margin)} of margin and loses ${formatMoney(a.marginLost)}. ${worst.label} gets the least: ${pct(worst.fillRate)} of what it ordered.`,
          },
          {
            title: "Upstream risk",
            body: `With ${s.bullwhip.leadMonths}-month lead times at each tier${s.bullwhip.share ? " and shared demand data" : ""}, our suppliers' orders swing ${ripple.ratios.at(-1)!.toFixed(0)}× as much as customer demand. ${s.bullwhip.share ? "Sharing demand data is already holding that down." : "Sharing customer demand data with suppliers is the cheapest way to cut that swing."}`,
          },
        ].map((sec) => (
          <section key={sec.title} className="mt-7">
            <h2 className="kicker">{sec.title}</h2>
            <p className="mt-2 text-[16px] leading-8 text-ink-2">{sec.body}</p>
          </section>
        ))}

        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          {product.name} and {product.company} are fictional. The demand pattern is real: {product.series.title} (
          <SourceLink href={product.series.source}>{product.series.id}</SourceLink>), rescaled to units. Prices, costs, lead times and regional splits are labeled
          assumptions; see Sources.
        </p>
      </article>
    </Frame>
  );
}
