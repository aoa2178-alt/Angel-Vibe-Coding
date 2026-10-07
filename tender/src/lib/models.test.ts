import { describe, expect, it } from "vitest";
import { NEEDED, QTY, award, awardOptions, negotiation, ranked, scorecard, shouldCost, spend, structures, tco, tierDiscount } from "./analysis";
import { BIDS, DEFAULT_SETTINGS as S, PRICES, growth, latest, monthlyDelayCost } from "./data";
import { readScenario, scenarioQuery } from "./scenario";

describe("public price data", () => {
  it("has monthly points from January 2019 with no gaps", () => {
    for (const s of Object.values(PRICES.series)) {
      expect(s.points[0]!.month).toBe("2019-01");
      for (let i = 1; i < s.points.length; i++) {
        const [y0, m0] = s.points[i - 1]!.month.split("-").map(Number) as [number, number];
        const [y1, m1] = s.points[i]!.month.split("-").map(Number) as [number, number];
        expect(y1 * 12 + m1 - (y0 * 12 + m0)).toBe(1);
      }
    }
  });
});

describe("spend", () => {
  it("adds up, and the Pareto shares reach 100%", () => {
    const sp = spend();
    expect(sp.pareto.reduce((a, r) => a + r.share, 0)).toBeCloseTo(1);
    expect(sp.pareto.at(-1)!.cumulative).toBeCloseTo(1);
    expect(sp.grand).toBeCloseTo(40 * 1.4e6 + 1200 * 25_000 + 3 * 6.5e6 + 64 * 300_000 + 12 * 1.2e6 + 96 * 150_000);
    for (let i = 1; i < sp.pareto.length; i++) expect(sp.pareto[i]!.total).toBeLessThanOrEqual(sp.pareto[i - 1]!.total);
    expect(sp.singleSource.map((c) => c.id).sort()).toEqual(["cdus", "transformers"]);
  });
});

describe("should-cost", () => {
  it("builds up from public prices and assumptions", () => {
    const sc = shouldCost();
    const copper = sc.lines.find((l) => l.id === "copper")!;
    expect(copper.cost).toBeCloseTo(30 * latest("copper").value);
    expect(copper.cost / copper.cost2019).toBeCloseTo(growth("copper"));
    const beforeMargin = sc.lines.filter((l) => l.id !== "margin").reduce((a, l) => a + l.cost, 0);
    expect(sc.total).toBeCloseTo(beforeMargin * 1.15);
  });

  it("shows costs rose more slowly than the transformer price index", () => {
    const sc = shouldCost();
    expect(sc.costGrowth).toBeGreaterThan(1);
    expect(sc.costGrowth).toBeLessThan(sc.ppiGrowth);
  });
});

describe("bids", () => {
  it("prices total cost of ownership by hand", () => {
    const b = BIDS.find((x) => x.supplier === "Aster Transformadores")!;
    const t = tco(b, S);
    const price = 3 * 5.9e6;
    expect(t.price).toBeCloseTo(price);
    expect(t.freight).toBeCloseTo(price * 0.04);
    expect(t.financing).toBeCloseTo(price * 0.2 * 0.09 * (22 / 12));
    expect(t.quality).toBeCloseTo(3 * 0.04 * 0.25 * 5.9e6);
    expect(t.monthsLate).toBe(2);
    expect(t.lateness).toBeCloseTo(2 * monthlyDelayCost(S).total);
  });

  it("lets lead time beat price: the cheapest quote is not the cheapest deal", () => {
    const r = ranked(S);
    const cheapestQuote = [...BIDS].sort((a, b) => a.price - b.price)[0]!.supplier;
    expect(r[0]!.bid.supplier).not.toBe(cheapestQuote);
    // With no deadline pressure, the cheapest quote is close to the top again
    const relaxed = ranked({ ...S, needByMonths: 60 });
    expect(relaxed[0]!.price).toBeLessThan(r[0]!.price);
  });

  it("scores out of 100 with weights that normalize", () => {
    const a = scorecard(S);
    const b = scorecard({ ...S, weights: { cost: 70, delivery: 60, quality: 30, risk: 30, capacity: 10 } });
    a.forEach((x, i) => expect(x.total).toBeCloseTo(b[i]!.total));
    expect(a[0]!.total).toBeLessThanOrEqual(100);
  });
});

describe("award split", () => {
  it("counts the hall short only when fewer than two units arrive", () => {
    const p = S.disruption;
    const single = award("one", [{ supplier: "Northgate Power", units: 3 }], S);
    expect(single.pShort).toBeCloseTo(p);
    const two = award("two", [{ supplier: "Northgate Power", units: 2 }, { supplier: "Helios Grid", units: 1 }], S);
    expect(two.pShort).toBeCloseTo(p);
    const three = award("three", [{ supplier: "Northgate Power", units: 1 }, { supplier: "Helios Grid", units: 1 }, { supplier: "Aster Transformadores", units: 1 }], S);
    expect(three.pShort).toBeCloseTo(3 * p * p * (1 - p) + p ** 3);
    expect(NEEDED).toBe(2);
    expect(QTY).toBe(3);
  });

  it("applies volume tiers and waits for the second unit", () => {
    expect(tierDiscount(3)).toBe(0.04);
    expect(tierDiscount(1)).toBe(0);
    const late = award("late", [{ supplier: "Volta Electric", units: 2 }, { supplier: "Helios Grid", units: 1 }], S);
    // Helios arrives at 14 months, but the second unit is Volta's at 30
    expect(late.monthsLate).toBe(30 - S.needByMonths);
    expect(awardOptions(S)).toHaveLength(3);
  });
});

describe("negotiation", () => {
  it("brackets a zone from the supplier's floor to our walk-away, with the target inside", () => {
    const n = negotiation(S);
    expect(n.zone.low).toBeLessThan(n.target);
    expect(n.target).toBeLessThan(n.quoted);
    expect(n.quoted).toBeLessThan(n.zone.high);
    // At the walk-away price, the chosen bid costs the same as the runner-up
    const atWalk = tco({ ...n.best.bid, price: n.walkAway }, S);
    expect(atWalk.total).toBeCloseTo(n.next.total, -2);
  });

  it("values the three deal structures", () => {
    const [spot, framework, reserve] = structures(S);
    expect(framework!.total).toBeLessThan(spot!.total);
    // The chosen supplier is already on time, so reserving capacity only adds cost
    expect(reserve!.total).toBeGreaterThan(spot!.total);
  });
});

describe("scenario links", () => {
  it("round-trips, and stays short when nothing changed", () => {
    const s = { ...S, needByMonths: 24, disruption: 0.2, weights: { ...S.weights, cost: 50 } };
    expect(readScenario(scenarioQuery(s))).toEqual(s);
    expect(scenarioQuery(S)).toBe("");
  });
});
