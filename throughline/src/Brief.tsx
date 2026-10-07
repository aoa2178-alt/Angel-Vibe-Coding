import { Printer } from "lucide-react";
import { CallBlocks, type CallContent } from "@/components/CallBlocks";
import { Frame, useScenario } from "@/components/Frame";
import { FAIRNESS_FLOOR, planCall } from "@/lib/call";
import { SourceLink } from "@/components/ui";
import { RULES } from "@/lib/allocate";
import { byMode, onTime, spread } from "@/lib/delivery";
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
  const ship = byMode(s.ship);
  const bestMode = spread().modes.reduce((x, y) => (y.lateRate < x.lateRate ? y : x));
  const onTimes = product.regions.map((g) => onTime(g.id, s.ship).onTimeRate);

  const call = planCall(s);
  const sl = (x: number) => pct(x, 1);
  const saving = call.current ? call.current.total - call.best.total : 0;
  const fairCost = call.rule.most.margin - call.rule.pick.margin;
  const content: CallContent = {
    demo: `Method demo: ${product.name} and ${product.company} are fictional; the demand pattern is real US Census data and the delivery benchmark is 180,519 real orders. Prices, costs and regional splits are labeled assumptions.`,
    decision: "Decision: what supply plan do we sign this month, and what's our rule if supply falls short?",
    headline: `Sign the plan at a ${sl(call.best.serviceLevel)} service level: ${formatMoney(call.best.total)} a year all-in${saving > 1000 ? `, ${formatMoney(saving)} less than at ${sl(s.settings.serviceLevel)}` : ""}. Agree now that any shortage is shared fairly, and share demand data with suppliers.`,
    bullets: [
      { label: "The plan", text: `hold ${formatUnits(plan.safetyStock)} units of safety stock, order ${plan.rawEoq < plan.monthlyDemand ? "every month" : `${formatUnits(plan.eoq)} at a time`}, and build ${formatUnits(launch.quantity)} for the next model's launch quarter (newsvendor).` },
      {
        label: "If supply falls short",
        text: call.rule.pick.rule.id === call.rule.most.rule.id
          ? `use the ${call.rule.pick.rule.label.toLowerCase()} rule: it earns the most margin and leaves every region at least ${pct(call.rule.pick.minFill)} of its order.`
          : `use the ${call.rule.pick.rule.label.toLowerCase()} rule. It gives up ${formatMoney(fairCost)} of margin against filling the most profitable region first, but that rule leaves a region with ${pct(call.rule.most.minFill)} of its order, and customers remember.`,
      },
      { label: "Upstream", text: `sharing customer demand data cuts our suppliers' order swings from ${call.notShared.toFixed(0)}× to ${call.shared.toFixed(0)}× customer demand: the cheapest risk reduction on the page.` },
      {
        label: "Delivery",
        text: s.ship === call.bestMode.mode
          ? `keep ${s.ship}: it's the most reliable promise (${pct(call.ship.lateRate)} late), and lateness tracks the promise, not the region.`
          : `move from ${s.ship} (${pct(call.ship.lateRate)} late) to ${call.bestMode.mode} (${pct(call.bestMode.lateRate)}): lateness tracks the shipping promise, not the region.`,
      },
    ],
    checksIntro: "The plan rerun with one assumption changed:",
    checks: call.checks,
    landing: [
      { when: "First 30 days", what: ["Sign the plan in this month's sales and operations meeting", "Set reorder points and safety stock in the system", "Agree the shortage rule with sales before it's needed"] },
      { when: "60 days", what: ["Share point-of-sale demand with the top supplier", "Compare forecast error against the plan's assumption", "Review late orders by shipping promise"] },
      { when: "90 days", what: ["Decide the launch build", "Re-set the service level if costs or error moved", "Extend data sharing to the next tier"] },
    ],
    people: "The hard part is agreeing rules before the crisis: when supply is short, every region's sales lead asks to be first. Owners: demand planning (forecast), supply planning (plan and orders), sales operations (the shortage rule), logistics (shipping promises).",
    measures: [
      ["Forecast error (WAPE, last 12 months)", pct(chosen.wape, 1), `≤ ${pct(chosen.wape, 1)}`],
      ["Fill rate", call.current ? pct(call.current.fillRate, 1) : "–", pct(call.best.fillRate, 1)],
      ["Inventory and shortage cost a year", call.current ? formatMoney(call.current.total) : "–", formatMoney(call.best.total)],
      ["Supplier order swing vs customer demand", `${ripple.ratios.at(-1)!.toFixed(0)}×`, `${call.shared.toFixed(0)}×`],
      ["Orders delivered late", pct(call.ship.lateRate), pct(call.bestMode.lateRate)],
    ],
    measuresNote: "A slightly lower fill rate can be the right aim: the last fraction of a point costs more in inventory than the shortages it prevents.",
    judgment: [
      { label: "Cost, not a round number, sets the service level", text: "the plan picks the level where holding, ordering and expected shortage costs are lowest together; 99% sounds safer but costs more than the shortages it prevents." },
      { label: "A fairness floor", text: `no region below ${pct(FAIRNESS_FLOOR)} of its order; above that line, margin decides. It's a judgment about customer relationships the model can't price.` },
      { label: "Monthly buckets on a stand-in", text: "public Census series stand in for each product's demand, so planning runs monthly; a real planner would use weekly sell-through." },
      { label: "Left out", text: "supplier capacity limits, the cost of expediting, and the delivery benchmark comes from another industry's orders." },
    ],
  };

  return (
    <Frame route="brief" s={s} setS={setS}>
      <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="kicker">The call · {product.company}</p>
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

        <CallBlocks c={content}>
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
          {
            title: "Delivery",
            body: `Shipping ${s.ship}, about ${pct(Math.min(...onTimes))}–${pct(Math.max(...onTimes))} of orders should arrive on time in every region, ${ship.avgDaysLate >= 0.05 ? `about ${ship.avgDaysLate.toFixed(1)} days later than promised on average` : "on the promised day on average"} (benchmark: 180,519 DataCo orders). Lateness tracks the shipping promise, not the region${s.ship === bestMode.mode ? ", and this is already the most reliable mode" : `: ${bestMode.mode} runs ${pct(bestMode.lateRate)} late against ${pct(ship.lateRate)} for ${s.ship}`}.`,
          },
        ].map((sec) => (
          <section key={sec.title} className="mt-7">
            <h2 className="kicker">{sec.title}</h2>
            <p className="mt-2 text-[16px] leading-8 text-ink-2">{sec.body}</p>
          </section>
        ))}
        </CallBlocks>

        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          {product.name} and {product.company} are fictional. The demand pattern is real: {product.series.title} (
          <SourceLink href={product.series.source}>{product.series.id}</SourceLink>), rescaled to units. Prices, costs, lead times and regional splits are labeled
          assumptions; see Sources.
        </p>
      </article>
    </Frame>
  );
}
