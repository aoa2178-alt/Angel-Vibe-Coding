// "The call" for Loadline: what to fix first to protect go-live, what it's worth paying to pull it in, and the hedges,
// with checks on what would change them.
import { expansion, type ExpansionSettings } from "./expansion";
import { spares, type HedgeSettings } from "./hedge";
import { MILESTONES, campusById, lowerFirst, plan, resolveFirst, type Settings, type Slips } from "./model";

const label = (id: string) => lowerFirst(MILESTONES.find((m) => m.id === id)!.label);

export function programCall(s: { campusId: string; settings: Settings; slips: Slips; hedge: HedgeSettings; expansion: ExpansionSettings }) {
  const campus = campusById(s.campusId);
  const plans = plan(campus, s.settings, s.slips);
  const risks = resolveFirst(campus, s.settings, s.slips).filter((r) => r.cost > 0);
  const top = risks[0] ?? null;
  const topPlan = top ? plans.find((p) => p.phase.id === top.phaseId)! : null;
  const hedge = spares(campus, s.settings, s.hedge);
  const build = expansion(campus, s.settings, s.expansion);
  const key = (r: typeof top) => (r ? `${r.phaseId}.${r.milestone}` : "none");

  const topUnder = (settings: Settings, slips: Slips = s.slips) => resolveFirst(campus, settings, slips).filter((r) => r.cost > 0)[0] ?? null;
  const halfValue = { ...s.settings, leasePerKwMonth: s.settings.leasePerKwMonth / 2, gpuHourPrice: s.settings.gpuHourPrice / 2 };
  const checks: { label: string; holds: boolean; outcome: string }[] = [];
  const t1 = topUnder(halfValue);
  checks.push({ label: "A month of delay is worth half as much", holds: key(t1) === key(top), outcome: t1 ? `resolve ${t1.phaseName}: ${label(t1.milestone)} first.` : "nothing is critical." });
  if (top) {
    const grid = plans.map((p) => `${p.phase.id}.grid`);
    const slipped: Slips = { ...s.slips };
    for (const g of grid) slipped[g] = (slipped[g] ?? 0) + 6;
    const t2 = topUnder(s.settings, slipped);
    checks.push({ label: "The utility's grid date slips six more months", holds: key(t2) === key(top), outcome: t2 ? `the grid becomes the item to chase: ${t2.phaseName}: ${label(t2.milestone)}.` : "nothing is critical." });
  }
  const calmer = spares(campus, s.settings, { ...s.hedge, supplierLoad: 0.7 });
  checks.push({
    label: "Transformer factories ease to 70% busy",
    holds: calmer.best === hedge.best,
    outcome: `hold ${calmer.best} spare${calmer.best === 1 ? "" : "s"} instead: a shortage costs less when replacements come faster.`,
  });
  if (build.applies) {
    const weak = expansion(campus, s.settings, { ...s.expansion, pStrong: 0.5 });
    checks.push({
      label: "Only a 50% chance demand is strong",
      holds: Math.sign(weak.advantage) === Math.sign(build.advantage),
      outcome: weak.advantage > 0 ? "build the later phases now anyway." : "phase the later buildings instead.",
    });
  }
  return { campus, plans, risks, top, topPlan, hedge, build, checks, label };
}
