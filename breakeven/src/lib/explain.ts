// Plain-English explanations for the cost comparison: what a volume means, why the cheapest option wins, and the volume
// ranges where each option is cheapest. Pure functions, so the wording always matches the model's numbers.
import { HOURS_PER_MONTH, VOLUME_MAX_M, VOLUME_MIN_M, cheapest, compare, formatTokensM, formatUsd, type Assumptions, type OptionCost, type OptionId, type Workload } from "./tco";

const NAMES: Record<OptionId, string> = { api: "the API", rent: "renting", own: "owning" };

/** "≈ 1.5 billion words a month · about 760 tokens every second" (a token is about ¾ of a word). */
export function volumeInWords(tokensM: number) {
  const words = tokensM * 1e6 * 0.75;
  const perSec = (tokensM * 1e6) / (HOURS_PER_MONTH * 3600);
  const w = words >= 1e9 ? `${+(words / 1e9).toFixed(1)} billion` : words >= 1e6 ? `${Math.round(words / 1e6)} million` : `${Math.round(words / 1e3)} thousand`;
  const s = perSec >= 10 ? Math.round(perSec / 10) * 10 : +perSec.toFixed(1);
  return `≈ ${w} words a month · about ${s.toLocaleString("en-US")} tokens every second`;
}

const gpuWord = (n: number) => (n === 1 ? "1 GPU" : `${n} GPUs`);

/** One or two sentences on why the cheapest option wins at this volume, using the model's own numbers. */
export function whyThisWins(workload: Workload, costs: Record<OptionId, OptionCost>) {
  const win = cheapest(costs);
  const v = formatTokensM(workload.tokensM);
  const rentGpus = costs.rent.gpus ?? 1;
  const ownGpus = costs.own.gpus ?? 0;
  const api = formatUsd(costs.api.monthly);
  const rent = formatUsd(costs.rent.monthly);
  const own = formatUsd(costs.own.monthly);
  if (win === "api")
    return `At ${v} tokens a month you'd keep a GPU busy only part of the time. Paying per token (${api} a month) costs less than renting a whole GPU (${rent}) or buying a ${gpuWord(ownGpus)} server (${own}).`;
  if (win === "rent")
    return `At ${v} tokens a month you need about ${gpuWord(rentGpus)} working all the time. Renting ${rentGpus === 1 ? "it" : "them"} (${rent} a month) costs less than paying the API for every token (${api})${
      ownGpus > rentGpus ? `, and owning means buying ${gpuWord(ownGpus)} in whole servers (${own}), more than you'd keep busy` : ` or owning (${own})`
    }.`;
  return `At ${v} tokens a month you keep ${gpuWord(ownGpus)} busy around the clock. Spread over the hardware's life, owning them (${own} a month) costs less than renting (${rent}) or paying per token (${api}).`;
}

/** The same reason in one sentence, for the "Why this wins" box. */
export function whyShort(workload: Workload, costs: Record<OptionId, OptionCost>) {
  const win = cheapest(costs);
  const v = formatTokensM(workload.tokensM);
  const rentGpus = costs.rent.gpus ?? 1;
  const ownGpus = costs.own.gpus ?? 0;
  const api = formatUsd(costs.api.monthly);
  const rent = formatUsd(costs.rent.monthly);
  const own = formatUsd(costs.own.monthly);
  if (win === "api") return `${v} tokens a month won't keep a GPU busy: the API costs ${api}, versus ${rent} to rent and ${own} to own.`;
  if (win === "rent")
    return `${rentGpus === 1 ? "One rented GPU covers" : `${rentGpus} rented GPUs cover`} ${v} tokens a month: ${rent}, versus ${api} on the API and ${own} to own.`;
  return `${v} tokens a month keeps ${ownGpus} GPUs busy, so owning them costs ${own}, versus ${rent} to rent and ${api} on the API.`;
}

export interface FlipSegment {
  id: OptionId;
  fromM: number;
  toM: number;
  /** Where the segment starts and ends on a 0–1 log scale from the smallest to the largest volume */
  from: number;
  to: number;
}

const toPos = (m: number) => Math.log10(m / VOLUME_MIN_M) / Math.log10(VOLUME_MAX_M / VOLUME_MIN_M);

/** The volume ranges where each option is cheapest, sampled on a log scale (adjacent samples with the same winner merge). */
export function flipSegments(workload: Workload, assumptions: Assumptions, steps = 160): FlipSegment[] {
  const segments: FlipSegment[] = [];
  for (let i = 0; i <= steps; i++) {
    const m = VOLUME_MIN_M * Math.pow(VOLUME_MAX_M / VOLUME_MIN_M, i / steps);
    const id = cheapest(compare({ ...workload, tokensM: m }, assumptions));
    const last = segments[segments.length - 1];
    if (last && last.id === id) {
      last.toM = m;
      last.to = toPos(m);
    } else {
      if (last) {
        last.toM = m;
        last.to = toPos(m);
      }
      segments.push({ id, fromM: m, toM: m, from: toPos(m), to: toPos(m) });
    }
  }
  return segments;
}

/** Where a volume sits on the same 0–1 scale, clamped to the ends. */
export const volumePosition = (tokensM: number) => Math.min(1, Math.max(0, toPos(tokensM)));

/** "You're in the renting zone." */
export const zoneSentence = (id: OptionId) => `You're in the ${NAMES[id] === "the API" ? "API" : NAMES[id]} zone.`;
