import { describe, expect, it } from "vitest";
import { DEFAULT_AFFORD, afford, defaultDataPrice, prices } from "./afford";
import { DEFAULT_BUILD, TECHS, allocate, annuity, defaultGap, fullCost, funding, lifetime, tranches, uncovered, type Tranche } from "./build";
import { CASES, COUNTRIES, byIso, type Country } from "./data";
import { gap } from "./gap";
import { DEFAULT_SCENARIO, readScenario, scenarioQuery } from "./scenario";
import { giniFromQuintiles, lognormal, normCdf, normInv } from "./stats";

const toy: Country = {
  iso3: "TOY",
  iso2: "TY",
  name: "Toyland",
  region: "Sub-Saharan Africa",
  income: "Lower middle income",
  values: { pop: [10_000_000, 2025], internet: [40, 2024], gniPc: [1200, 2025], gini: [40, 2022], rural: [50, 2025], mobileSubs: [80, 2024], q1: [6, 2022], q2: [10, 2022], q3: [15, 2022], q4: [22, 2022], q5: [47, 2022] },
};

describe("Income model", () => {
  it("normal CDF and its inverse agree with tables", () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 7);
    expect(normCdf(1.96)).toBeCloseTo(0.975, 4);
    expect(normInv(0.975)).toBeCloseTo(1.96, 3);
    expect(normInv(normCdf(-0.7))).toBeCloseTo(-0.7, 6);
  });

  it("a lognormal keeps its mean and Gini: half the people sit above the median, exp(μ)", () => {
    const d = lognormal(100, 0.4);
    // Gini = 2Φ(σ/√2) − 1
    expect(2 * normCdf(d.sigma / Math.SQRT2) - 1).toBeCloseTo(0.4, 6);
    expect(Math.exp(d.mu + (d.sigma * d.sigma) / 2)).toBeCloseTo(100, 6);
    expect(d.shareAbove(Math.exp(d.mu))).toBeCloseTo(0.5, 6);
  });

  it("Gini from quintile shares: equal shares give 0; one fifth holding everything gives 0.8", () => {
    expect(giniFromQuintiles([20, 20, 20, 20, 20])).toBeCloseTo(0, 9);
    expect(giniFromQuintiles([0, 0, 0, 0, 100])).toBeCloseTo(0.8, 9);
  });
});

describe("Afford, by hand", () => {
  it("the default data price is the income group's ITU median: 2.2% of GNI per capita a year, monthly", () => {
    expect(defaultDataPrice(toy)).toBeCloseTo((1200 * 0.022) / 12, 9); // $2.20
  });

  it("pay-as-you-go turns the phone's price into a deposit plus one monthly payment", () => {
    const p = prices(toy, { ...DEFAULT_AFFORD, payg: true });
    // $54 × 15% = $8.10 deposit; $54 × 1.35 × 0.85 ÷ 12 = $5.16 a month
    expect(p.upfront).toBeCloseTo(54 * 0.15 + (54 * 1.35 * 0.85) / 12, 9);
  });

  it("the binding test sets who can afford it, and each lever helps", () => {
    const base = afford(toy, DEFAULT_AFFORD);
    // Phone: $54 needs $270 a month; data: $2.20 needs $110. The phone binds.
    expect(base.needPhone).toBeCloseTo(270, 6);
    expect(base.binding).toBe("phone");
    const levers = [
      { payg: true },
      { handsetTaxCut: 1 },
      { dataSubsidy: 0.5, payg: true },
      { dataTaxCut: 1, payg: true },
      { phonePrice: 30 },
    ];
    for (const l of levers) expect(afford(toy, { ...DEFAULT_AFFORD, ...l }).share).toBeGreaterThan(base.share);
    expect(afford(toy, { ...DEFAULT_AFFORD, payg: true }).share).toBeGreaterThan(afford(toy, DEFAULT_AFFORD).share);
  });

  it("quintile incomes are the mean × 5 × each fifth's share", () => {
    const q = afford(toy, DEFAULT_AFFORD).quintiles!;
    expect(q[0]!.income).toBeCloseTo(100 * 5 * 0.06, 9);
    expect(q.reduce((a, x) => a + x.income, 0) / 5).toBeCloseTo(100, 9);
  });
});

describe("Gap", () => {
  it("offline = population × (1 − internet use); the no-signal part is the coverage gap", () => {
    const g = gap(toy);
    expect(g.offline).toBeCloseTo(6_000_000, 6);
    expect(g.noSignal).toBeCloseTo(1_000_000, 6); // Sub-Saharan Africa default: 10%
    expect(g.noSignal + g.covered).toBeCloseTo(g.offline, 6);
  });
});

describe("Build, by hand", () => {
  it("lifetime cost = capex + running cost × annuity", () => {
    const macro = TECHS.find((t) => t.id === "macro")!;
    expect(annuity(10, 0.1)).toBeCloseTo(6.1446, 4);
    expect(lifetime(macro, "rural", DEFAULT_BUILD)).toBeCloseTo(40 + 4 * 6.1446, 3);
  });

  it("each tranche gets its cheapest technology: towers for rural, satellite for remote, at the defaults", () => {
    const t = tranches(toy, DEFAULT_BUILD);
    for (const x of t) {
      const best = Math.min(...TECHS.map((k) => lifetime(k, x.area, DEFAULT_BUILD, [0.75, 1, 1.5][x.level - 1])));
      expect(x.costPerCovered).toBeCloseTo(best, 9);
    }
    expect(t.find((x) => x.area === "rural")!.tech.id).toBe("macro");
    expect(t.find((x) => x.area === "remote")!.tech.id).toBe("satellite");
  });

  it("uncovered people split remote / rural as set, and add up to the gap", () => {
    const u = uncovered(toy, DEFAULT_BUILD);
    expect(u.total).toBeCloseTo(1_000_000, 6);
    expect(u.out.remote).toBeCloseTo(600_000, 6);
  });

  it("greedy funding connects at least as many people as any whole-tranche plan within the budget (brute force)", () => {
    const t = tranches(toy, DEFAULT_BUILD);
    const budget = fullCost(t) * 0.45;
    const greedy = allocate(t, budget).users;
    let best = 0;
    for (let mask = 0; mask < 1 << t.length; mask++) {
      const pick = t.filter((_, k) => mask & (1 << k));
      const cost = pick.reduce((a, x) => a + x.cost, 0);
      if (cost <= budget) best = Math.max(best, pick.reduce((a, x) => a + x.users, 0));
    }
    expect(greedy).toBeGreaterThanOrEqual(best - 1e-6);
    expect(allocate(t, fullCost(t)).users).toBeCloseTo(t.reduce((a, x) => a + x.users, 0), 6);
  });

  it("the funding split adds up to the spend, operators pay no more than users' margin repays", () => {
    const t = tranches(toy, DEFAULT_BUILD);
    const plan = allocate(t, fullCost(t));
    const f = funding(toy, DEFAULT_BUILD, 2.2, plan);
    expect(f.operators + f.usf + f.public).toBeCloseTo(plan.spend, 4);
    expect(f.revenuePv).toBeCloseTo(2.2 * 12 * 0.35 * annuity(10, 0.1), 6);
    expect(f.operators).toBeLessThanOrEqual(f.revenuePv * plan.users + 1e-6);
  });

  it("a viable tranche needs no public money", () => {
    const cheap: Tranche = { ...tranches(toy, DEFAULT_BUILD)[0]!, cost: 10, people: 1, users: 1, costPerUser: 10 };
    const f = funding(toy, DEFAULT_BUILD, 50, allocate([cheap], 10));
    expect(f.operators).toBeCloseTo(10, 9);
    expect(f.usf + f.public).toBeCloseTo(0, 9);
  });
});

describe("Data", () => {
  it("the four cases have every core indicator, in sane ranges", () => {
    for (const iso of CASES) {
      const c = byIso(iso)!;
      expect(c, iso).toBeTruthy();
      for (const k of ["pop", "internet", "gniPc", "gini", "rural", "mobileSubs", "phone", "smart", "noSmartCost"] as const) expect(c.values[k], `${iso} ${k}`).toBeTruthy();
      expect(c.values.internet![0]).toBeGreaterThan(0);
      expect(c.values.internet![0]).toBeLessThanOrEqual(100);
    }
    expect(COUNTRIES.length).toBeGreaterThan(190);
  });

  it("Nigeria matches the World Bank: GNI per capita $1,360, 41% online", () => {
    const n = byIso("NGA")!;
    expect(n.values.gniPc![0]).toBe(1360);
    expect(Math.round(n.values.internet![0])).toBe(41);
    expect(defaultGap(n)).toBe(0.1);
  });
});

describe("Scenario", () => {
  it("round-trips through the URL and keeps the default link empty", () => {
    expect(scenarioQuery(DEFAULT_SCENARIO)).toBe("");
    const s = { country: "KEN", afford: { ...DEFAULT_AFFORD, payg: true, dataSubsidy: 0.25, dataPrice: 3.5 }, build: { ...DEFAULT_BUILD, fund: 0.8, gap: 0.07 } };
    expect(readScenario(scenarioQuery(s))).toEqual(s);
  });

  it("ignores unreadable values", () => {
    expect(readScenario("?c=XXX&sub=5&fund=-1")).toEqual(DEFAULT_SCENARIO);
  });
});
