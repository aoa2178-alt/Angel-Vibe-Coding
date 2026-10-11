import { Bars } from "@/components/Bars";
import { Reach } from "@/components/Reach";
import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Fold } from "@/components/Fold";
import { Card, Kicker, Stat } from "@/components/ui";
import { byIso, pct, people, share, shortName, v, yearOf } from "@/lib/data";
import { barrierRows, gap, groupRows } from "@/lib/gap";
import { defaultGap } from "@/lib/build";

const GREEN = "var(--s-green)";
const CORAL = "var(--s-coral)";
const BLUE = "var(--s-blue)";

export function GapStep() {
  const [s, setS] = useScenario("gap");
  const c = byIso(s.country)!;
  const g = gap(c, s.build.gap);
  const groups = groupRows(c);
  const barriers = barrierRows(c);
  const name = shortName(c);
  const top = barriers[0];
  const women = groups.find((x) => x.id === "women");
  const men = groups.find((x) => x.id === "men");
  const poor = groups.find((x) => x.id === "poor");
  const rich = groups.find((x) => x.id === "rich");

  return (
    <Frame route="gap" s={s} setS={setS}>
      <StepHeading route="gap">
        How many people are offline, how many have no signal, and what keeps the rest off.
      </StepHeading>

      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat trust="data" label="Population" value={people(g.pop)} sub={`${yearOf(c, "pop")}`} />
          <Stat trust="data" label="Online" value={pct(g.online)} sub={`World Bank, ${yearOf(c, "internet")}`} />
          <Stat trust="data" label="Offline" value={people(g.offline)} />
          <Stat trust="modeled" label="No signal at all" value={people(g.noSignal)} sub={`${pct(s.build.gap ?? defaultGap(c))} of people (GSMA, by region)`} />
        </div>
        <div className="mt-6">
          <Reach
            key={c.iso3}
            ariaLabel={`${name}'s population: online, covered but offline, and without a signal`}
            format={people}
            parts={[
              { label: "Online", value: g.pop - g.offline, color: GREEN },
              { label: "Has a signal, not online (usage gap)", value: g.covered, color: CORAL },
              { label: "No signal (coverage gap)", value: g.noSignal, color: BLUE },
            ]}
          />
        </div>
        <p className="mt-4 max-w-3xl text-[15px] leading-7 text-ink-2">
          {people(g.offline)} people in {name} are offline. About {people(g.noSignal)} of them have no mobile-broadband signal where they live; the other {people(g.covered)} could
          connect today but don't. Closing the usage gap is about price and skills (Affordability); closing the coverage gap is about building (Coverage and funding).
        </p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <Kicker method="Global Findex 2025">Why adults don't own a smartphone</Kicker>
          {barriers.length ? (
            <>
              <div className="mt-4">
                <Bars
                  ariaLabel="Reasons for not owning a smartphone, share of adults"
                  rows={barriers.map((b) => ({ label: b.label, values: [{ value: b.share!, color: CORAL }] }))}
                  max={Math.max(0.5, ...barriers.map((b) => b.share!))}
                  format={(x) => pct(x)}
                />
              </div>
              <p className="mt-3 text-sm text-ink-2">
                {top && `The biggest barrier: "${top.label.toLowerCase()}", cited by ${pct(top.share)} of all adults. `}
                People could give more than one reason.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-2">The Findex survey didn't ask about smartphone barriers in {name}. Pick Nigeria, Kenya, India or Pakistan to see them.</p>
          )}
        </Card>

        <Card>
          <Kicker method="Global Findex 2025">Who owns a phone</Kicker>
          {groups.length ? (
            <>
              <div className="mt-4">
                <Bars
                  ariaLabel="Mobile phone and smartphone ownership by group"
                  legend={[
                    { label: "Any mobile phone", color: BLUE },
                    { label: "Smartphone", color: GREEN },
                  ]}
                  rows={groups.map((x) => ({
                    label: x.label,
                    values: [
                      { value: x.phoneShare ?? 0, color: BLUE },
                      { value: x.smartShare ?? 0, color: GREEN },
                    ],
                  }))}
                  max={1}
                  format={(x) => pct(x)}
                />
              </div>
              <p className="mt-3 text-sm text-ink-2">
                {women && men && women.smartShare !== null && men.smartShare !== null && `Women: ${pct(women.smartShare)} have a smartphone, men ${pct(men.smartShare)}. `}
                {poor && rich && poor.smartShare !== null && rich.smartShare !== null && `The poorest 40%: ${pct(poor.smartShare)}, against ${pct(rich.smartShare)} for the richest 60%.`}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-2">No Findex phone data for {name}.</p>
          )}
        </Card>
      </div>

      <div className="mt-6">
      <Fold id="wider" title="Electricity, accounts and mobile money" sub="The wider picture: what a phone connects to">
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat trust="data" label="Has electricity" value={pct(share(c, "electricity"))} sub={`${yearOf(c, "electricity") ?? ""}`} />
          <Stat trust="data" label="Mobile money account" value={pct(share(c, "mobileMoney"))} sub="adults, Findex 2025" />
          <Stat trust="data" label="Any account" value={pct(share(c, "account"))} sub="bank or mobile money" />
          <Stat trust="data" label="Mobile subscriptions" value={v(c, "mobileSubs") === null ? "–" : `${Math.round(v(c, "mobileSubs")!)} per 100`} sub="SIMs, not people" />
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-2">
          Mobile money shows what a phone can do for people with low incomes (M-Pesa in Kenya is the classic case). The same pay-as-you-go rails can finance the phone itself, which Affordability tests.
          Electricity matters too: a phone needs charging, so a coverage plan without power reaches fewer people.
        </p>
      </Fold>
      </div>
    </Frame>
  );
}
