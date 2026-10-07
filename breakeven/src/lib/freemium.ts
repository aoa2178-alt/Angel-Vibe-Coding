// Step 1 for an AI product you sell: free users cost compute but pay nothing, so paying users have to carry them.
// Compute is priced with Breakeven's cost model at the cheapest option for the total volume, like roi.ts.
import { cheapest, compare, type Assumptions, type OptionId, type Workload } from "./tco";

export interface ProductInputs {
  /** People using the product in a month */
  users: number;
  /** Share of them who pay, 0–1 */
  paidShare: number;
  /** Price per paying user, $ a month */
  price: number;
  /** Tokens a free user uses in a month */
  freeTokens: number;
  /** Tokens a paying user uses in a month */
  paidTokens: number;
}

/** Illustrative: an AI writing app. Freemium products typically convert 2–5% of users. */
export const PRODUCT_TEMPLATE: ProductInputs = { users: 100_000, paidShare: 0.05, price: 20, freeTokens: 200_000, paidTokens: 5_000_000 };

/** Monthly tokens, in millions, for these users. */
export const productTokensM = (p: ProductInputs) => (p.users * ((1 - p.paidShare) * p.freeTokens + p.paidShare * p.paidTokens)) / 1e6;

export interface FreemiumResult {
  tokensM: number;
  computeOption: OptionId;
  /** Compute per million tokens at the cheapest option */
  perM: number;
  freeUsers: number;
  paidUsers: number;
  costPerFree: number;
  costPerPaid: number;
  revenue: number;
  compute: number;
  /** Revenue − compute */
  margin: number;
  /** margin ÷ revenue; null with no revenue */
  marginPct: number | null;
  /** Free users each paying user carries */
  freePerPaid: number | null;
  /** The paid share at which revenue just covers everyone's compute (at today's cost per token); null if a paying user doesn't cover their own compute */
  breakEvenShare: number | null;
}

export function freemium(p: ProductInputs, a: Assumptions, workload: Pick<Workload, "outputShare" | "utilization">): FreemiumResult {
  const tokensM = productTokensM(p);
  const costs = compare({ ...workload, tokensM }, a);
  const computeOption = cheapest(costs);
  const compute = costs[computeOption].monthly;
  const perM = tokensM > 0 ? compute / tokensM : 0;
  const paidUsers = p.users * p.paidShare;
  const freeUsers = p.users - paidUsers;
  const costPerFree = (p.freeTokens / 1e6) * perM;
  const costPerPaid = (p.paidTokens / 1e6) * perM;
  const revenue = paidUsers * p.price;
  const margin = revenue - compute;
  const denom = p.price - costPerPaid + costPerFree;
  return {
    tokensM,
    computeOption,
    perM,
    freeUsers,
    paidUsers,
    costPerFree,
    costPerPaid,
    revenue,
    compute,
    margin,
    marginPct: revenue > 0 ? margin / revenue : null,
    freePerPaid: paidUsers > 0 ? freeUsers / paidUsers : null,
    breakEvenShare: p.price > costPerPaid && denom > 0 ? costPerFree / denom : null,
  };
}
