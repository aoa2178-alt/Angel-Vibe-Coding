// Build it all now, or phase it? A capacity-expansion decision tree (the Du Pont question): building every later
// phase alongside the first gets capacity live sooner and cheaper per MW, but if demand is weak some of it sits idle.
// Phasing waits to see demand and builds only what's needed. Pure functions only, like model.ts.
import { monthIndex, phaseItMw, schedule, type Campus, type Settings } from "./model";

export interface ExpansionSettings {
  /** Chance demand turns out strong (every later phase fully used), 0–1 */
  pStrong: number;
  /** If demand is weak, the share of the later phases' capacity that gets used, 0–1 */
  weakShare: number;
  /** Capex saved per MW by building everything in one go, 0–1 */
  scaleSaving: number;
  /** Years of revenue counted, from the first phase's construction start (a data center building lasts about 20) */
  horizonYears: number;
}

export const DEFAULT_EXPANSION: ExpansionSettings = { pStrong: 0.7, weakShare: 0.4, scaleSaving: 0.08, horizonYears: 20 };

export interface Outcome {
  strong: number;
  weak: number;
  expected: number;
}

export interface ExpansionResult {
  /** False when the campus has only one phase, so there's nothing to phase */
  applies: boolean;
  /** Months earlier the later phases go live if built now (capacity-weighted average) */
  monthsEarlier: number;
  /** NPV of the later phases as leased capacity, $, before operating costs */
  phased: Outcome;
  allNow: Outcome;
  /** allNow.expected − phased.expected */
  advantage: number;
  /** The chance of strong demand at which both choices are worth the same; null if one always wins */
  breakEvenP: number | null;
}

/** NPV at the first phase's construction start of: −capex at `buildAt`, then `monthlyRevenue` from `liveAt` to the horizon end. */
function npv(capex: number, buildAt: number, monthlyRevenue: number, liveAt: number, t0: number, horizonEnd: number, rate: number) {
  const disc = (m: number) => Math.pow(1 + rate, -(m - t0) / 12);
  let value = -capex * disc(buildAt);
  for (let m = Math.ceil(liveAt); m < horizonEnd; m++) value += monthlyRevenue * disc(m);
  return value;
}

export function expansion(c: Campus, s: Settings, e: ExpansionSettings): ExpansionResult {
  const [anchor, ...later] = c.phases;
  const empty = { strong: 0, weak: 0, expected: 0 };
  if (!anchor || later.length === 0) return { applies: false, monthsEarlier: 0, phased: empty, allNow: empty, advantage: 0, breakEvenP: null };

  const t0 = monthIndex(anchor.start);
  const horizonEnd = t0 + e.horizonYears * 12;
  const rate = s.costOfCapital;
  const p = Math.min(1, Math.max(0, e.pStrong));
  const w = Math.min(1, Math.max(0, e.weakShare));
  const sum = { phasedStrong: 0, phasedWeak: 0, nowStrong: 0, nowWeak: 0, earlier: 0, mw: 0 };

  for (const ph of later) {
    const capex = phaseItMw(ph) * s.capexPerMw * 1e6;
    // Valued as leased capacity, so revenue and capex cover the same thing: the building, not the GPUs inside it.
    const revenue = phaseItMw(ph) * 1000 * s.leasePerKwMonth;
    const start = monthIndex(ph.start);
    const live = schedule(ph).live;
    // Built now: same construction time, starting with the first phase.
    const liveNow = t0 + (live - start);
    sum.phasedStrong += npv(capex, start, revenue, live, t0, horizonEnd, rate);
    sum.phasedWeak += npv(capex * w, start, revenue * w, live, t0, horizonEnd, rate);
    sum.nowStrong += npv(capex * (1 - e.scaleSaving), t0, revenue, liveNow, t0, horizonEnd, rate);
    sum.nowWeak += npv(capex * (1 - e.scaleSaving), t0, revenue * w, liveNow, t0, horizonEnd, rate);
    sum.earlier += (live - liveNow) * phaseItMw(ph);
    sum.mw += phaseItMw(ph);
  }

  const phased = { strong: sum.phasedStrong, weak: sum.phasedWeak, expected: p * sum.phasedStrong + (1 - p) * sum.phasedWeak };
  const allNow = { strong: sum.nowStrong, weak: sum.nowWeak, expected: p * sum.nowStrong + (1 - p) * sum.nowWeak };
  const dS = allNow.strong - phased.strong;
  const dW = allNow.weak - phased.weak;
  const pStar = dS !== dW ? -dW / (dS - dW) : null;
  return {
    applies: true,
    monthsEarlier: sum.mw > 0 ? sum.earlier / sum.mw : 0,
    phased,
    allNow,
    advantage: allNow.expected - phased.expected,
    breakEvenP: pStar !== null && pStar > 0 && pStar < 1 ? pStar : null,
  };
}
