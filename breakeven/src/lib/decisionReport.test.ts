import { describe, expect, it, vi } from "vitest";
import { REPORT_WEBHOOK, buildPayload, sendReport, validateForm, type ReportForm } from "./decisionReport";
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

describe("Sending", () => {
  const payload = buildPayload(readPlan(""), FORM);

  it("POSTs the JSON to the n8n webhook", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    await sendReport(payload, fetchMock);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(REPORT_WEBHOOK);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(init.body)).toEqual(payload);
  });

  it("turns a failed answer or a network error into a friendly message", async () => {
    await expect(sendReport(payload, vi.fn().mockResolvedValue(new Response("", { status: 500 })))).rejects.toThrow(/couldn't be generated/);
    await expect(sendReport(payload, vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))).rejects.toThrow(/try again/);
  });
});
