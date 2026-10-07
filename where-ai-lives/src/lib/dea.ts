// Data Envelopment Analysis (DEA) with two inputs to minimize and the same output for every unit.
//
// Each unit (a state) "uses" two inputs to host a data center: a power price and a grid-connection wait. DEA asks:
// could some mix of other states deliver the same thing with less of BOTH inputs? Its efficiency score θ is the
// smallest share of its inputs at which a mix of other units still matches it (input-oriented, Charnes–Cooper–Rhodes).
// θ = 1 means nobody beats it on both counts at once; θ = 0.8 means a mix of peers needs only 80% of its price AND wait.
//
// With two inputs and one shared output, the linear program has a geometric answer: the best mix always sits on the
// lower-left convex hull of the points, using at most two peers. So we check every pair (and every single unit) exactly,
// with no solver and no weights chosen by hand.

export interface Unit {
  id: string;
  /** Input 1 (e.g. power price), must be > 0 */
  x1: number;
  /** Input 2 (e.g. grid wait), must be > 0 */
  x2: number;
}

export interface DeaResult {
  id: string;
  /** Efficiency score, 0–1 */
  theta: number;
  /** On the efficient frontier: θ = 1 and no mix of others is at least as good on both and better on one */
  efficient: boolean;
  /** The peers whose mix sets the benchmark, with their weights (sum to 1) */
  peers: { id: string; weight: number }[];
  /** The benchmark point: θ × this unit's inputs */
  target: { x1: number; x2: number };
}

const EPS = 1e-9;

/** The weight λ in [0,1] that minimizes max(a0 + a1·λ, b0 + b1·λ): an end point or where the two lines cross. */
function minMax(a0: number, a1: number, b0: number, b1: number) {
  const f = (l: number) => Math.max(a0 + a1 * l, b0 + b1 * l);
  let best = { l: 0, v: f(0) };
  const consider = (l: number) => {
    if (l >= 0 && l <= 1) {
      const v = f(l);
      if (v < best.v - EPS) best = { l, v };
    }
  };
  consider(1);
  if (Math.abs(a1 - b1) > EPS) consider((b0 - a0) / (a1 - b1));
  return best;
}

/** Score one unit against all units (itself included, so θ ≤ 1). */
export function scoreOne(o: Unit, units: Unit[]): Omit<DeaResult, "efficient"> {
  let best = { theta: Infinity, peers: [] as { id: string; weight: number }[] };
  for (let i = 0; i < units.length; i++) {
    for (let j = i; j < units.length; j++) {
      const p = units[i]!;
      const q = units[j]!;
      // Mix = λ·p + (1−λ)·q. Needed share of o's inputs = max(mix1 / o1, mix2 / o2).
      const { l, v } = minMax(q.x1 / o.x1, (p.x1 - q.x1) / o.x1, q.x2 / o.x2, (p.x2 - q.x2) / o.x2);
      if (v < best.theta - EPS) {
        const peers = i === j ? [{ id: p.id, weight: 1 }] : [{ id: p.id, weight: l }, { id: q.id, weight: 1 - l }];
        best = { theta: v, peers: peers.filter((x) => x.weight > EPS) };
      }
    }
  }
  const theta = Math.min(1, best.theta);
  return { id: o.id, theta, peers: best.peers, target: { x1: theta * o.x1, x2: theta * o.x2 } };
}

/** Is there a mix of units at least as good as t on both inputs and strictly better on one? (DEA's slack check) */
function hasSlack(t: { x1: number; x2: number }, units: Unit[]) {
  for (let i = 0; i < units.length; i++) {
    for (let j = i; j < units.length; j++) {
      const p = units[i]!;
      const q = units[j]!;
      // Points on segment p–q: m(λ) = q + λ(p − q). Check the end points, and where each coordinate equals t's.
      const ls = [0, 1];
      if (Math.abs(p.x1 - q.x1) > EPS) ls.push((t.x1 - q.x1) / (p.x1 - q.x1));
      if (Math.abs(p.x2 - q.x2) > EPS) ls.push((t.x2 - q.x2) / (p.x2 - q.x2));
      for (const l of ls) {
        if (l < -EPS || l > 1 + EPS) continue;
        const m1 = q.x1 + l * (p.x1 - q.x1);
        const m2 = q.x2 + l * (p.x2 - q.x2);
        if (m1 <= t.x1 + EPS && m2 <= t.x2 + EPS && (m1 < t.x1 - 1e-7 || m2 < t.x2 - 1e-7)) return true;
      }
    }
  }
  return false;
}

/** Score every unit. */
export function dea(units: Unit[]): DeaResult[] {
  if (units.some((u) => !(u.x1 > 0 && u.x2 > 0))) throw new Error("DEA inputs must be positive");
  return units.map((u) => {
    const r = scoreOne(u, units);
    return { ...r, efficient: r.theta > 1 - 1e-7 && !hasSlack(r.target, units) };
  });
}

/** The efficient frontier as a drawable path: up the y axis to the cheapest efficient unit, through each, then right. */
export function frontier(units: Unit[], results: DeaResult[]) {
  const on = new Set(results.filter((r) => r.efficient).map((r) => r.id));
  return units.filter((u) => on.has(u.id)).sort((a, b) => a.x1 - b.x1 || b.x2 - a.x2);
}
