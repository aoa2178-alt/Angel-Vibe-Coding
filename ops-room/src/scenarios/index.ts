import { validateScenario } from "@/engine/engine";
import type { Scenario } from "@/engine/types";
import { fourWeeksToLaunch } from "./four-weeks-to-launch";
import { juneReview } from "./june-review";
import { notEnoughToGoAround } from "./not-enough-to-go-around";
import { shouldThisBeAi } from "./should-this-be-ai";
import { transformerIsLate } from "./transformer-is-late";

// Add new scenarios to this list. The welcome screen shows them in this order.
export const scenarios: Scenario[] = [fourWeeksToLaunch, transformerIsLate, notEnoughToGoAround, juneReview, shouldThisBeAi];

export function getScenario(id: string) {
  return scenarios.find((s) => s.id === id) ?? null;
}

if (import.meta.env.DEV) {
  for (const s of scenarios) {
    const problems = validateScenario(s);
    if (problems.length) console.warn(`[ops-room] Scenario "${s.id}" has problems:\n- ${problems.join("\n- ")}`);
  }
}
