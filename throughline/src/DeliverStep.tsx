import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Card, Kicker, Pills, SourceLink, Stat } from "@/components/ui";
import { DELIVERY, MARKETS, MARKET_LABEL, MODES, REGION_MARKETS, byMode, cell, onTime, spread, topLateLanes, worstCategories, type Mode } from "@/lib/delivery";
import { formatUnits, pct, productById } from "@/lib/products";

/** A single-hue ramp for late rates: light (few late) to dark (most late). The number is always printed too. */
function heat(rate: number) {
  const t = Math.min(1, Math.max(0, (rate - 0.3) / 0.7));
  const light = [251, 233, 231];
  const dark = [155, 28, 19];
  const c = light.map((l, i) => Math.round(l + (dark[i]! - l) * t));
  return { background: `rgb(${c.join(",")})`, color: t > 0.45 ? "#ffffff" : "var(--ink)" };
}

/** Step 5: will it get there on time? Real delivery performance from 180,519 DataCo orders, applied to the product's regions. */
export function DeliverStep() {
  const [s, setS] = useScenario("deliver");
  const product = productById(s.productId);
  const sp = spread();
  const chosen = byMode(s.ship);
  const lanes = topLateLanes(6);
  const cats = DELIVERY.category.filter((c) => c.orders >= 1000).map((c) => c.late / c.orders);
  const worst = worstCategories(4);
  const best = sp.modes.reduce((a, b) => (b.lateRate < a.lateRate ? b : a));
  const worstMode = sp.modes.reduce((a, b) => (b.lateRate > a.lateRate ? b : a));

  return (
    <Frame route="deliver" s={s} setS={setS}>
      <StepHeading route="deliver" product={product}>
        {formatUnits(DELIVERY.totalOrders)} real orders from a public supply chain dataset show what makes deliveries late, and what doesn't. Use them as the benchmark for{" "}
        {product.name}'s distribution.
      </StepHeading>

      <div className="rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">The finding</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">The promise, not the place.</p>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-panel-muted">
          Late-delivery rates swing {Math.round(sp.modeRange * 100)} points across shipping modes ({pct(best.lateRate)} for {best.mode} up to {pct(worstMode.lateRate)} for {worstMode.mode}) but only{" "}
          {(sp.marketRange * 100).toFixed(1)} points across five markets on four continents, and product categories sit in a narrow {pct(Math.min(...cats))}–{pct(Math.max(...cats))} band. Late
          orders come from promising a delivery time the network doesn't keep, so the fix is the promise and the carrier, not the region.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <Card>
          <Kicker method="Late-delivery rate">Shipping mode × market</Kicker>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[30rem] border-separate border-spacing-1 text-center text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="text-left font-medium">Mode</th>
                  {MARKETS.map((m) => (
                    <th key={m} className="font-medium">
                      {MARKET_LABEL[m]}
                    </th>
                  ))}
                  <th className="font-medium">All</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {MODES.map((mode) => (
                  <tr key={mode}>
                    <th className="pr-2 text-left font-sans text-sm font-semibold">{mode}</th>
                    {MARKETS.map((m) => {
                      const c = cell(m, mode);
                      return (
                        <td key={m} className="rounded-md px-1.5 py-2.5" style={heat(c.lateRate)} title={`${mode} to ${MARKET_LABEL[m]}: ${pct(c.lateRate, 1)} late of ${c.orders.toLocaleString("en-US")} orders`}>
                          {pct(c.lateRate)}
                        </td>
                      );
                    })}
                    <td className="rounded-md px-1.5 py-2.5 font-semibold" style={heat(byMode(mode).lateRate)}>
                      {pct(byMode(mode).lateRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">
            Share of orders delivered after the promised date. Darker = more late. Read down a column (modes differ hugely) and across a row (markets barely do).
          </p>
        </Card>

        <div className="grid gap-4">
          <Card>
            <Kicker>Ship {product.name} by</Kicker>
            <div className="mt-3">
              <Pills label="Shipping mode" options={MODES.map((m) => ({ id: m, label: m }))} value={s.ship} onChange={(ship: Mode) => setS({ ...s, ship })} />
            </div>
            <ul className="mt-4 grid gap-3">
              {product.regions.map((r) => {
                const o = onTime(r.id, s.ship);
                return (
                  <li key={r.id}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold">{r.label}</span>
                      <span className="font-mono">{pct(o.onTimeRate)} on time</span>
                    </div>
                    <div className="mt-1 h-2.5 rounded-r-[3px] bg-sunken">
                      <div className="glide h-full rounded-r-[3px] bg-brand" style={{ width: `${o.onTimeRate * 100}%` }} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted">benchmark: {REGION_MARKETS[r.id].map((m) => MARKET_LABEL[m]).join(" + ")}, {o.orders.toLocaleString("en-US")} orders</p>
                  </li>
                );
              })}
            </ul>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <Stat label="Days late, on average" value={Math.abs(chosen.avgDaysLate) < 0.05 ? "0.0" : `${chosen.avgDaysLate > 0 ? "+" : "−"}${Math.abs(chosen.avgDaysLate).toFixed(1)}`} sub={`${s.ship}: actual − promised`} />
            </Card>
            <Card>
              <Stat label="Profit margin" value={pct(chosen.margin, 1)} sub={`on ${s.ship} orders`} />
            </Card>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card>
          <Kicker>Where late orders pile up</Kicker>
          <ul className="mt-3 grid gap-2 text-sm">
            {lanes.map((l) => (
              <li key={`${l.region}-${l.mode}`} className="grid grid-cols-[minmax(0,1fr)_5rem_4rem] items-baseline gap-2 border-b border-line pb-1.5">
                <span>
                  {l.region} · <span className="text-ink-2">{l.mode}</span>
                </span>
                <span className="text-right font-mono">{l.late.toLocaleString("en-US")}</span>
                <span className="text-right font-mono text-muted">{pct(l.lateRate)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-muted">
            Late orders (and the lane's late rate). The biggest piles are simply the biggest lanes; their rates match their shipping mode, which is the point.
          </p>
        </Card>
        <Card>
          <Kicker>Not the product either</Kicker>
          <ul className="mt-3 grid gap-2 text-sm">
            {worst.map((c) => (
              <li key={c.category} className="flex items-baseline justify-between gap-2 border-b border-line pb-1.5">
                <span>{c.category}</span>
                <span className="font-mono">
                  {pct(c.lateRate, 1)} <span className="text-muted">of {c.orders.toLocaleString("en-US")}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-muted">
            The most-late categories with at least 1,000 orders are within a few points of the average. Moving SKUs or regions won't fix lateness; resetting the promise
            (or the carrier) will.
          </p>
        </Card>
      </div>

      <p className="mt-6 text-xs leading-5 text-muted">
        Data: {DELIVERY.source.authors} ({DELIVERY.source.year}). {DELIVERY.source.title}, version {DELIVERY.source.version}, Mendeley Data,{" "}
        <SourceLink href={DELIVERY.source.doi}>{DELIVERY.source.license}</SourceLink>. {DELIVERY.source.note} DataCo is a different (anonymized) company; its orders are
        used here as a delivery benchmark, mapped to {product.name}'s regions.
      </p>
    </Frame>
  );
}
