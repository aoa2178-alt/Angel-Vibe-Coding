import { Bars } from "@/components/Bars";
import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Card, Kicker, NumberField, Slider, Stat } from "@/components/ui";
import { DEFAULT_AFFORD, afford, defaultDataPrice, leverCost, type AffordSettings } from "@/lib/afford";
import { DATA_TARGET, HANDSET_TARGET } from "@/lib/assumptions";
import { byIso, pct, people, shortName, usd, type Country } from "@/lib/data";
import type { Scenario } from "@/lib/scenario";

const GREEN = "var(--s-green)";
const CORAL = "var(--s-coral)";
const QUINTILES = ["Poorest fifth", "Second fifth", "Middle fifth", "Fourth fifth", "Richest fifth"];

/** Each lever the user has switched on, added one at a time, so the ladder shows what each one adds. */
export function ladder(c: Country, a: AffordSettings) {
  const base: AffordSettings = { ...a, payg: false, handsetTaxCut: 0, dataTaxCut: 0, dataSubsidy: 0 };
  const steps: { label: string; s: AffordSettings }[] = [{ label: "Today's prices", s: base }];
  let cur = base;
  if (a.payg) steps.push({ label: "+ Pay-as-you-go phones", s: (cur = { ...cur, payg: true }) });
  if (a.handsetTaxCut > 0) steps.push({ label: `+ Cut phone taxes ${pct(a.handsetTaxCut)}`, s: (cur = { ...cur, handsetTaxCut: a.handsetTaxCut }) });
  if (a.dataTaxCut > 0) steps.push({ label: `+ Cut data taxes ${pct(a.dataTaxCut)}`, s: (cur = { ...cur, dataTaxCut: a.dataTaxCut }) });
  if (a.dataSubsidy > 0) steps.push({ label: `+ Subsidize data ${pct(a.dataSubsidy)}`, s: (cur = { ...cur, dataSubsidy: a.dataSubsidy }) });
  return steps.map((x) => ({ label: x.label, r: afford(c, x.s) }));
}

export function AffordStep() {
  const [s, setS] = useScenario("afford");
  const c = byIso(s.country)!;
  const a = s.afford;
  const set = (patch: Partial<AffordSettings>) => setS({ ...s, afford: { ...a, ...patch } } as Scenario);
  const r = afford(c, a);
  const steps = ladder(c, a);
  const base = steps[0]!.r;
  const cost = leverCost(a, r);
  const name = shortName(c);
  const q = r.quintiles;

  return (
    <Frame route="afford" s={s} setS={setS}>
      <StepHeading route="afford">
        Being online takes a phone and a data plan. A plan is affordable under {pct(DATA_TARGET)} of monthly income (UN target); a phone, when the cash needed is under {pct(HANDSET_TARGET)} (GSMA).
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-6">
          <Card>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Can afford a phone and data" value={pct(r.share)} sub={`${people(r.people)} people`} />
              <Stat label="At today's prices" value={pct(base.share)} sub={`${people(base.people)} people`} />
              <Stat label="Added by your levers" value={`+${people(r.people - base.people)}`} />
              <Stat label="What holds people back" value={r.binding === "phone" ? "The phone" : "The data"} sub={`needs ${usd(r.need)} a month of income`} />
            </div>
            <div className="mt-6">
              <Bars
                title="How many people can afford it, lever by lever"
                ariaLabel="People who can afford a phone and data, as each lever is added"
                rows={steps.map((x) => ({ label: x.label, values: [{ value: x.r.people, color: GREEN }], note: `${people(x.r.people)} · ${pct(x.r.share)}` }))}
                max={Math.max(...steps.map((x) => x.r.people), 1)}
                format={people}
              />
            </div>
            <p className="mt-4 max-w-3xl text-[15px] leading-7 text-ink-2">
              The average income in {name} is {usd(r.meanMonthly)} a month (GNI per capita), spread with a Gini of {r.gini.toFixed(2)}. A {usd(r.prices.phone)} phone needs {usd(r.needPhone)} of monthly income
              to pass the {pct(HANDSET_TARGET)} test{a.payg ? ` (with pay-as-you-go, the first month's cash is ${usd(r.prices.upfront, 2)})` : ""}; a {usd(r.prices.data, 2)} data plan needs {usd(r.needData)} to pass the {pct(DATA_TARGET)} test.{" "}
              {r.binding === "phone"
                ? "The phone is the wall. Try pay-as-you-go financing."
                : "The data price is now the wall: tax cuts and subsidies move it."}
            </p>
          </Card>

          {q ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <Bars
                  title="Cash for a phone, % of a month's income"
                  ariaLabel="Upfront phone cost as a share of each income fifth's monthly income"
                  rows={q.map((x, k) => ({ label: QUINTILES[k]!, values: [{ value: x.phone, color: x.phone <= HANDSET_TARGET ? GREEN : CORAL }], note: `${pct(x.phone)} ${x.phone <= HANDSET_TARGET ? "✓" : "✗"}` }))}
                  max={Math.max(HANDSET_TARGET * 2, Math.min(3, Math.max(...q.map((x) => x.phone))))}
                  format={(x) => pct(x)}
                  target={{ value: HANDSET_TARGET, label: `GSMA threshold, ${pct(HANDSET_TARGET)}` }}
                />
              </Card>
              <Card>
                <Bars
                  title="2GB of data, % of monthly income"
                  ariaLabel="Data plan cost as a share of each income fifth's monthly income"
                  rows={q.map((x, k) => ({ label: QUINTILES[k]!, values: [{ value: x.data, color: x.data <= DATA_TARGET ? GREEN : CORAL }], note: `${pct(x.data, 1)} ${x.data <= DATA_TARGET ? "✓" : "✗"}` }))}
                  max={Math.max(DATA_TARGET * 2, Math.min(0.3, Math.max(...q.map((x) => x.data))))}
                  format={(x) => pct(x, 1)}
                  target={{ value: DATA_TARGET, label: `UN target, ${pct(DATA_TARGET)}` }}
                />
              </Card>
              <p className="text-xs text-muted md:col-span-2">
                Each fifth's average monthly income = mean × 5 × its share of national income (World Bank). ✓ under the threshold, ✗ over it. Within each fifth incomes vary, which the headline share accounts for.
              </p>
            </div>
          ) : (
            <Card>
              <p className="text-sm text-ink-2">The World Bank has no income-by-fifth data for {name}, so only the headline share (from the Gini) is shown.</p>
            </Card>
          )}
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <Kicker>Levers</Kicker>
            <div className="mt-4 grid gap-5">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={a.payg} onChange={(e) => set({ payg: e.target.checked })} className="mt-1 size-4 accent-[var(--brand)]" />
                <span>
                  <span className="block text-sm font-medium">Pay-as-you-go phone financing</span>
                  <span className="block text-xs text-muted">
                    {pct(a.deposit)} deposit, then {a.months} monthly payments with a {pct(a.markup)} markup: the M-Kopa model, run on mobile-money rails.
                  </span>
                </span>
              </label>
              <Slider label="Cut taxes on phones" value={a.handsetTaxCut} display={pct(a.handsetTaxCut)} min={0} max={1} step={0.05} onChange={(x) => set({ handsetTaxCut: x })} />
              <Slider label="Cut taxes on data" value={a.dataTaxCut} display={pct(a.dataTaxCut)} min={0} max={1} step={0.05} onChange={(x) => set({ dataTaxCut: x })} />
              <Slider label="Subsidize data" value={a.dataSubsidy} display={pct(a.dataSubsidy)} min={0} max={0.75} step={0.05} onChange={(x) => set({ dataSubsidy: x })} />
              <button type="button" onClick={() => setS({ ...s, afford: { ...DEFAULT_AFFORD, dataPrice: a.dataPrice, phonePrice: a.phonePrice } })} className="justify-self-start text-xs font-medium text-brand-ink underline underline-offset-2">
                Reset levers
              </button>
            </div>
          </Card>
          <Card>
            <Kicker>What the levers cost the budget</Kicker>
            <p className="mt-2 font-mono text-2xl font-semibold">{usd(cost.total)}</p>
            <p className="text-xs text-muted">a year in taxes forgone and subsidies, if everyone who can afford it gets online ({usd(cost.perUser, 2)} per user)</p>
          </Card>
          <Card>
            <Kicker>Prices (editable)</Kicker>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberField label="2GB plan, $/month" unit={`default ${usd(defaultDataPrice(c), 2)} (ITU, ${c.income.toLowerCase()})`} value={Number((a.dataPrice ?? defaultDataPrice(c)).toFixed(2))} step={0.1} onChange={(x) => set({ dataPrice: x })} />
              <NumberField label="Entry smartphone, $" unit="default $54 (GSMA)" value={a.phonePrice} step={1} onChange={(x) => set({ phonePrice: x })} />
              <NumberField label="Tax in phone price" unit="share, default 0.15" value={a.handsetTax} step={0.01} max={0.9} onChange={(x) => set({ handsetTax: x })} />
              <NumberField label="Tax in data price" unit="share, default 0.10" value={a.dataTax} step={0.01} max={0.9} onChange={(x) => set({ dataTax: x })} />
              <NumberField label="PAYG deposit" unit="share of price" value={a.deposit} step={0.05} max={1} onChange={(x) => set({ deposit: x })} />
              <NumberField label="PAYG markup" unit="total, over the term" value={a.markup} step={0.05} max={3} onChange={(x) => set({ markup: x })} />
            </div>
            {a.dataPrice !== null && (
              <button type="button" onClick={() => set({ dataPrice: null })} className="mt-3 text-xs font-medium text-brand-ink underline underline-offset-2">
                Use the ITU default data price
              </button>
            )}
          </Card>
        </div>
      </div>
    </Frame>
  );
}
