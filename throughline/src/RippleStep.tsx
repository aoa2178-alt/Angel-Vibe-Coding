import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { LineChart } from "@/components/LineChart";
import { Card, Kicker, Slider } from "@/components/ui";
import { TIERS, type BullwhipSettings } from "@/lib/bullwhip";
import { formatMonth, formatUnits } from "@/lib/products";
import { run } from "@/lib/run";

const TIER_COLOR = ["var(--tier-1)", "var(--tier-2)", "var(--tier-3)", "var(--tier-4)"];
const SHOWN = 48;

/** Step 4: the bullwhip. Each tier orders to cover its lead time from a moving-average forecast, and the swings grow. */
export function RippleStep() {
  const [s, setS] = useScenario("ripple");
  const r = run(s);
  const { product, ripple } = r;
  const b = s.bullwhip;
  const set = (patch: Partial<BullwhipSettings>) => setS({ ...s, bullwhip: { ...b, ...patch } });
  const labels = r.hist.slice(-SHOWN).map((h) => formatMonth(h.month));
  const tail = (xs: number[]) => xs.slice(-SHOWN);
  const top = ripple.ratios[ripple.ratios.length - 1]!;

  return (
    <Frame route="ripple" s={s} setS={setS}>
      <StepHeading route="ripple" product={product}>
        Every company in the chain orders a little extra to cover its lead time from a forecast of the orders it sees. Small swings in what customers
        buy turn into big swings at the factory and its suppliers. This is the bullwhip effect, the lesson of the beer game.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <Card>
          <LineChart
            title="Orders at each tier, units a month (last 4 years)"
            xLabels={labels}
            series={[
              { label: "Customer demand", color: "var(--ink)", values: tail(ripple.series[0]!.values), width: 2.5 },
              ...TIERS.map((t, i) => ({ label: t, color: TIER_COLOR[i]!, values: tail(ripple.series[i + 1]!.values) })),
            ]}
            format={formatUnits}
            height={300}
            ariaLabel={`Orders at four tiers against customer demand. Swings grow up the chain: the supplier's orders vary ${top.toFixed(0)} times as much as demand.`}
          />
        </Card>

        <div className="grid gap-4">
          <div className="rounded-2xl bg-panel p-5 text-panel-ink">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">Swing at the supplier</p>
            <p className="mt-2 font-mono text-4xl font-semibold">{top.toFixed(top < 10 ? 1 : 0)}×</p>
            <p className="mt-1 text-sm text-panel-muted">the variance of customer demand</p>
          </div>
          <Card>
            <Kicker method="Variance ratio">Swing at each tier</Kicker>
            <ul className="mt-3 grid gap-2.5">
              {TIERS.map((t, i) => {
                const v = ripple.ratios[i]!;
                return (
                  <li key={t} className="grid grid-cols-[5.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full" style={{ background: TIER_COLOR[i] }} aria-hidden />
                      {t}
                    </span>
                    <div className="h-2.5 rounded-r-[3px] bg-sunken">
                      <div className="glide h-full rounded-r-[3px]" style={{ width: `${Math.min(100, (Math.log10(Math.max(1, v)) / Math.log10(Math.max(10, top))) * 100)}%`, background: TIER_COLOR[i] }} />
                    </div>
                    <span className="text-right font-mono">{v.toFixed(v < 10 ? 1 : 0)}×</span>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card>
            <Kicker>Try it</Kicker>
            <div className="mt-3 grid gap-4">
              <Slider label="Lead time at each tier" value={b.leadMonths} display={`${b.leadMonths} months`} min={0} max={6} onChange={(v) => set({ leadMonths: v })} />
              <Slider label="Forecast window" value={b.window} display={`${b.window} months`} min={1} max={12} onChange={(v) => set({ window: v })} />
              <label className="flex items-start gap-3 rounded-xl border border-line p-3 text-sm">
                <input type="checkbox" checked={b.share} onChange={(e) => set({ share: e.target.checked })} className="mt-1 size-4 accent-[var(--brand)]" />
                <span>
                  <span className="block font-semibold">Share customer demand data</span>
                  <span className="text-ink-2">Every tier forecasts from what end customers buy, not from the orders it receives.</span>
                </span>
              </label>
            </div>
          </Card>
        </div>
      </div>

    </Frame>
  );
}
