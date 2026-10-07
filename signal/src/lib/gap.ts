// Step 1: who is offline, and why.
import { share, v, type Country, type Key } from "./data";
import { defaultGap } from "./build";

export function gap(c: Country, coverageGap: number | null = null) {
  const pop = v(c, "pop") ?? 0;
  const online = share(c, "internet") ?? 0;
  const offline = pop * (1 - online);
  const noSignal = Math.min(offline, pop * (coverageGap ?? defaultGap(c)));
  return { pop, online, offline, noSignal, covered: offline - noSignal };
}

/** Phone and smartphone ownership by group (adults 15+, Findex), when surveyed. */
export const GROUPS: { id: string; label: string; phone: Key; smart: Key }[] = [
  { id: "all", label: "All adults", phone: "phone", smart: "smart" },
  { id: "women", label: "Women", phone: "phoneWomen", smart: "smartWomen" },
  { id: "men", label: "Men", phone: "phoneMen", smart: "smartMen" },
  { id: "rural", label: "Rural", phone: "phoneRural", smart: "smartRural" },
  { id: "urban", label: "Urban", phone: "phoneUrban", smart: "smartUrban" },
  { id: "poor", label: "Poorest 40%", phone: "phonePoor", smart: "smartPoor" },
  { id: "rich", label: "Richest 60%", phone: "phoneRich", smart: "smartRich" },
];

/** Why adults don't own a smartphone (Findex; people can give several reasons). */
export const BARRIERS: { key: Key; label: string }[] = [
  { key: "noSmartCost", label: "A smartphone costs too much" },
  { key: "noSmartData", label: "Data costs too much" },
  { key: "noSmartNoNeed", label: "Don't need one" },
  { key: "noSmartSkills", label: "Hard to read or type on one" },
  { key: "noSmartCoverage", label: "No reliable coverage" },
  { key: "noSmartSafety", label: "Safety or security worries" },
];

export function groupRows(c: Country) {
  return GROUPS.map((g) => ({ ...g, phoneShare: share(c, g.phone), smartShare: share(c, g.smart) })).filter((g) => g.phoneShare !== null || g.smartShare !== null);
}

export function barrierRows(c: Country) {
  return BARRIERS.map((b) => ({ ...b, share: share(c, b.key) }))
    .filter((b) => b.share !== null)
    .sort((a, b) => b.share! - a.share!);
}
