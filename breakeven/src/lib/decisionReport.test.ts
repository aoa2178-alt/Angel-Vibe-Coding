import { describe, expect, it } from "vitest";
import { REPORT_WEBHOOK, buildPayload, buildResults, openReport, validateForm, type ReportForm } from "./decisionReport";
import { readPlan } from "./plan";

const FORM: ReportForm = { scenarioName: "  Support pilot ", currentDeployment: "Pay-per-token API", growthPct: "30", horizonYears: 3 };

describe("Decision report payload", () => {
  it("takes volume, workload, traffic and priorities from the plan, and the rest from the form", () => {
    // 2B tokens a month, customer-support template, spiky traffic, Regulated-data weights.
    const plan = readPlan("?v=2000&t=support&burst=3");
    plan.weights = { cost: 2, control: 5, launch: 1, quality: 2, ease: 1, flex: 3 };
    expect(buildPayload(plan, FORM)).toEqual({
      scenario_name: "Support pilot",
      monthly_tokens: 2_000_000_000,
      workload_type: "Customer support",
      current_deployment: "Pay-per-token API",
      demand_pattern: "Spiky",
      expected_annual_growth: 30,
      decision_horizon: 3,
      cost_priority: 2,
      scalability_priority: 3,
      privacy_priority: 5,
    });
  });

  it("names product mode and hand-set traffic plainly", () => {
    const plan = readPlan("?mode=product");
    plan.ops = { ...plan.ops, burst: 2.2 };
    const p = buildPayload(plan, FORM);
    expect(p.workload_type).toBe("AI product we sell");
    expect(p.demand_pattern).toBe("Custom");
  });

  it("asks for the missing answers before sending", () => {
    expect(validateForm(FORM)).toEqual({});
    const e = validateForm({ scenarioName: " ", currentDeployment: "", growthPct: "", horizonYears: 4 });
    expect(Object.keys(e).sort()).toEqual(["currentDeployment", "growthPct", "scenarioName"]);
    expect(validateForm({ ...FORM, growthPct: "0" })).toEqual({});
  });
});

describe("Report results", () => {
  const plan = readPlan("?v=2000&t=support");
  const results = buildResults(plan, FORM);

  it("carries the model's own numbers and the recommendation", () => {
    expect(results.options.map((o) => o.name)).toEqual(["Pay per token (API)", "Rent cloud GPUs", "Own GPUs"]);
    expect(results.cheapest).toBe("Rent cloud GPUs");
    expect(results.options.every((o) => Math.abs(o.yearly - o.monthly * 12) <= 6)).toBe(true); // rounding only
    expect(results.business_case?.savings_monthly).toBeGreaterThan(0);
    expect(results.is_ai_the_right_tool?.verdict).toBeTruthy();
    expect(results.plan_30_60_90).toHaveLength(3);
    expect(results.app_link).toMatch(/^https:\/\/breakeven-silk\.vercel\.app\/result\?/);
  });

  it("projects the expected growth for each year of the horizon", () => {
    expect(results.growth_years).toHaveLength(FORM.horizonYears + 1);
    expect(results.growth_years[0]!.monthly_tokens).toBe(2_000_000_000);
    expect(results.growth_years[1]!.monthly_tokens).toBe(2_600_000_000); // +30%
  });
});

describe("Opening the report", () => {
  it("posts the scenario and results to the n8n webhook as a form into a new tab", () => {
    // A stand-in for the page: records what openReport builds and submits.
    type Fake = Record<string, unknown> & { children: Fake[]; appendChild: (c: Fake) => void; submit: () => void; remove: () => void; style: Record<string, string> };
    let submitted: Fake | null = null;
    let attached = 0;
    const make = (): Fake => {
      const el: Fake = { children: [], style: {}, appendChild: (c) => el.children.push(c), submit: () => (submitted = el), remove: () => attached-- };
      return el;
    };
    const doc = { createElement: make, body: { appendChild: () => attached++ } } as unknown as Document;
    const plan = readPlan("");
    openReport(buildPayload(plan, FORM), buildResults(plan, FORM), doc);
    const form = submitted as unknown as Fake;
    expect(form.action).toBe(REPORT_WEBHOOK);
    expect(form.method).toBe("POST");
    expect(form.target).toBe("_blank");
    const input = form.children[0]!;
    expect(input.name).toBe("data");
    const data = JSON.parse(input.value as string);
    expect(data.scenario_name).toBe("Support pilot");
    expect(data.results.options).toHaveLength(3);
    expect(attached).toBe(0);
  });
});
