import { Bars, Stack } from "@/components/Bars";
import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { LineChart } from "@/components/LineChart";
import { Card, Kicker, NumberField, Slider, Stat } from "@/components/ui";
import { afford } from "@/lib/afford";
import { TECHS, allocate, curve, defaultGap, fullCost, funding, lifetime, tranches, uncovered, type Area, type BuildSettings } from "@/lib/build";
import { byIso, pct, people, shortName, usd, type Country } from "@/lib/data";
import type { Scenario } from "@/lib/scenario";

const GREEN = "var(--s-green)";
const CORAL = "var(--s-coral)";
const BLUE = "var(--s-blue)";
const AREA_LABEL: Record<Area, string> = { urban: "Urban", rural: "Rural", remote: "Remote" };

/** Everything step 3 shows, from one place (the brief reuses it). */
export function buildPlan(c: Country, s: Scenario) {
  const b = s.build;
  const list = tranches(c, b);
  const full = fullCost(list);
  const plan = allocate(list, full * b.fund);
  const arpu = b.arpu ?? afford(c, s.afford).prices.data;
  const split = funding(c, b, arpu, plan);
  return { list, full, plan, arpu, split, unc: uncovered(c, b) };
}

export function BuildStep() {
  const [s, setS] = useScenario("build");
  const c = byIso(s.country)!;
  const b = s.build;
  const set = (patch: Partial<BuildSettings>) => setS({ ...s, build: { ...b, ...patch } } as Scenario);
  const { list, full, plan, arpu, split, unc } = buildPlan(c, s);
  const pts = curve(list, 20);
  const name = shortName(c);
  const allUsers = list.reduce((a, t) => a + t.users, 0);
  const sorted = [...plan.funded].sort((x, y) => x.tranche.costPerUser - y.tranche.costPerUser);

  return (
    <Frame route="build" s={s} setS={setS}>
      <StepHeading route="build">
        For people with no signal at all: pick the cheapest way to reach each area, fund the cheapest people first, then split the bill between operators, the universal service fund and the public purse.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-6">
          <Card>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="People without a signal" value={people(unc.total)} sub={`${people(unc.out.remote)} remote · ${people(unc.out.rural)} rural`} />
              <Stat label="Cost to cover all of them" value={usd(full)} sub={`connects ${people(allUsers)} at ${pct(b.adoption)} adoption`} />
              <Stat label="Your budget" value={usd(plan.spend)} sub={`${pct(b.fund)} of the full cost`} />
              <Stat label="People it connects" value={people(plan.users)} sub={`${pct(plan.users / (allUsers || 1))} of the most it could`} />
            </div>
            <div className="mt-6">
              <LineChart
                title="People connected for each dollar of budget"
                xLabels={pts.map((p) => usd(p.budget))}
                series={[{ label: "People connected", color: GREEN, values: pts.map((p) => p.users) }]}
                refs={[{ value: plan.users, label: `Your budget: ${people(plan.users)}`, color: CORAL }]}
                format={people}
                height={240}
                ariaLabel="Coverage curve: people connected as the budget grows"
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-2">
              The curve bends because the budget funds the cheapest people first: easy rural areas, then remote ones, then the hardest to reach. That ordering is the best possible plan when areas can be partly
              funded (the fractional knapsack).
            </p>
          </Card>

          <Card>
            <Kicker>The cheapest way to reach each area</Kicker>
            <div className="mt-3 overflow-auto rounded-lg border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-sunken text-muted">
                  <tr>
                    <th className="px-2 py-1.5 font-medium">Area</th>
                    <th className="px-2 py-1.5 font-medium">Best technology</th>
                    <th className="px-2 py-1.5 text-right font-medium">People</th>
                    <th className="px-2 py-1.5 text-right font-medium">Per person connected</th>
                    <th className="px-2 py-1.5 text-right font-medium">Funded</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((f) => (
                    <tr key={f.tranche.id} className="border-t border-line">
                      <td className="px-2 py-1.5">
                        {AREA_LABEL[f.tranche.area]} <span className="text-muted">{["easier", "typical", "hardest"][f.tranche.level - 1]}</span>
                      </td>
                      <td className="px-2 py-1.5">{f.tranche.tech.label}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{people(f.tranche.people)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{usd(f.tranche.costPerUser)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{pct(f.share)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5">
              <Bars
                title="Lifetime cost per person covered, by technology"
                ariaLabel="Lifetime cost per person covered for each technology in rural and remote areas"
                legend={[
                  { label: "Rural", color: BLUE },
                  { label: "Remote", color: CORAL },
                ]}
                rows={TECHS.map((t) => ({
                  label: t.label,
                  values: [
                    { value: lifetime(t, "rural", b), color: BLUE },
                    { value: lifetime(t, "remote", b), color: CORAL },
                  ],
                }))}
                max={Math.max(...TECHS.map((t) => lifetime(t, "remote", b)))}
                format={(x) => usd(x)}
              />
              <p className="mt-2 text-xs text-muted">
                Capex plus {b.years} years of running costs at {pct(b.rate)}, before the tranche multipliers (easier ×0.75, hardest ×1.5). Illustrative costs, scaled to ITU's "Connecting Humanity"
                estimates; each is listed on the Sources page.
              </p>
            </div>
          </Card>

          <Card>
            <Kicker>Who pays for your budget</Kicker>
            <div className="mt-4">
              <Stack
                ariaLabel="Funding split between operators, the universal service fund, and government or donors"
                total={split.total}
                format={(x) => usd(x)}
                parts={[
                  { label: "Operators (repaid by users)", value: split.operators, color: GREEN },
                  { label: "Universal service fund", value: split.usf, color: BLUE },
                  { label: "Government and donors", value: split.public, color: CORAL },
                ]}
              />
            </div>
            <p className="mt-4 text-[15px] leading-7 text-ink-2">
              Each new user brings {usd(arpu, 2)} a month; at a {pct(b.margin)} margin over {b.years} years that's worth {usd(split.revenuePv)} today. Operators will fund a connection up to that. The rest is the{" "}
              <span className="font-semibold text-ink">viability gap</span>. The universal service fund ({pct(b.levy, 1)} of telecom revenue) raises {usd(split.usfPool)} over the period and covers{" "}
              {split.public > 0 ? "part of the gap; government and donors cover the rest" : "all of it at this budget"}.
            </p>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <Kicker>Plan</Kicker>
            <div className="mt-4 grid gap-5">
              <Slider label="Budget" value={b.fund} display={`${usd(full * b.fund)} · ${pct(b.fund)}`} min={0} max={1} step={0.05} onChange={(x) => set({ fund: x })} />
              <Slider
                label="People with no signal"
                value={b.gap ?? defaultGap(c)}
                display={pct(b.gap ?? defaultGap(c))}
                min={0}
                max={0.3}
                step={0.01}
                onChange={(x) => set({ gap: x })}
              />
              <Slider label="Of them, in remote areas" value={b.remote} display={pct(b.remote)} min={0} max={1} step={0.05} onChange={(x) => set({ remote: x })} />
              <Slider label="Go online once covered" value={b.adoption} display={pct(b.adoption)} min={0.1} max={1} step={0.05} onChange={(x) => set({ adoption: x })} />
            </div>
          </Card>
          <Card>
            <Kicker>Money (editable)</Kicker>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberField label="Revenue per user, $/mo" unit="default: step 2's data price" value={Number(arpu.toFixed(2))} step={0.1} onChange={(x) => set({ arpu: x })} />
              <NumberField label="Operator margin" unit="share of revenue" value={b.margin} step={0.05} max={1} onChange={(x) => set({ margin: x })} />
              <NumberField label="USF levy" unit="share of telecom revenue" value={b.levy} step={0.005} max={0.2} onChange={(x) => set({ levy: x })} />
              <NumberField label="Years" unit="horizon" value={b.years} step={1} min={1} max={30} onChange={(x) => set({ years: x })} />
              <NumberField label="Discount rate" unit="share a year" value={b.rate} step={0.01} max={0.5} onChange={(x) => set({ rate: x })} />
            </div>
            <p className="mt-3 text-xs text-muted">
              The default "no signal" share is GSMA's regional coverage gap ({c.region}). {name}'s own figure may differ; set it above.
            </p>
          </Card>
        </div>
      </div>
    </Frame>
  );
}
