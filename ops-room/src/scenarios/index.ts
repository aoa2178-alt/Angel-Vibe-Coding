import { validateScenario } from "@/engine/engine";
import type { Scenario } from "@/engine/types";
import { fourWeeksToLaunch } from "./four-weeks-to-launch";

// Add new scenarios to this list. The welcome screen shows them in this order.
export const scenarios: Scenario[] = [fourWeeksToLaunch];

export function getScenario(id: string) {
  return scenarios.find((s) => s.id === id) ?? null;
}

if (import.meta.env.DEV) {
  for (const s of scenarios) {
    const problems = validateScenario(s);
    if (problems.length) console.warn(`[ops-room] Scenario "${s.id}" has problems:\n- ${problems.join("\n- ")}`);
  }
}
