import { OPTIONS } from "./options";
import { Odometer } from "./Odometer";
import { Callout, joinLabels } from "./ui";
import {
  CRITERIA,
  DEFAULT_SCORES,
  OPTION_IDS,
  SCORED,
  SCORE_REASONS,
  WEIGHT_PRESETS,
  advantages,
  type CriterionId,
  type ScorecardResult,
  type Scores,
  type Weights,
} from "@/lib/scorecard";
import { formatUsd, type OptionCost, type OptionId } from "@/lib/tco";

/** "Beyond cost": your priorities, weighted into a score out of 100 for each way to run AI. */
export function Scorecard({
  costs,
  cheapestId,
  card,
  weights,
  scores,
  onWeights,
  onScore,
  onResetScores,
}: {
  costs: Record<OptionId, OptionCost>;
  cheapestId: OptionId;
  card: ScorecardResult;
  weights: Weights;
  scores: Scores;
  onWeights: (w: Weights) => void;
  onScore: (c: Exclude<CriterionId, "cost">, o: OptionId, v: number) => void;
  onResetScores: () => void;
}) {
  const activePreset = WEIGHT_PRESETS.find((p) => CRITERIA.every((c) => p.weights[c.id] === weights[c.id]))?.id;
  const winner = card.winner;
  const scoresEdited = SCORED.some((c) => OPTION_IDS.some((o) => scores[c][o] !== DEFAULT_SCORES[c][o]));

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
      <section aria-label="Your priorities" className="rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
        <p className="kicker">Your priorities</p>
        <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Priority presets">
          {WEIGHT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={activePreset === p.id}
              onClick={() => onWeights(p.weights)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                activePreset === p.id ? "border-brand bg-brand text-white" : "border-line bg-bg hover:border-brand"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-5">
          {CRITERIA.map((c) => (
            <div key={c.id}>
              <div className="flex items-end justify-between gap-3">
                <label htmlFor={`weight-${c.id}`} className="text-sm font-medium">
                  {c.label}
                </label>
                <span className="font-mono text-sm text-brand-ink">{weights[c.id] === 0 ? "Ignore" : `${weights[c.id]} / 5`}</span>
              </div>
              <input
                id={`weight-${c.id}`}
                type="range"
                min={0}
                max={5}
                value={weights[c.id]}
                onChange={(e) => onWeights({ ...weights, [c.id]: Number(e.target.value) })}
                aria-valuetext={weights[c.id] === 0 ? "Ignored" : `${weights[c.id]} out of 5`}
                className="mt-2 w-full"
              />
              <p className="mt-0.5 text-xs text-muted">{c.question}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Scorecard" aria-live="polite" className={`grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 ${winner ? `theme-${winner}` : ""}`}>
        {winner ? (
          <div className="win-panel rounded-2xl p-5 text-white sm:p-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/75">Best fit for your priorities</p>
            <p key={winner} className="mt-3 flex animate-rise items-center gap-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
              <span className={`size-4 shrink-0 rounded-full ring-2 ring-white/80 ${OPTIONS[winner].swatch}`} aria-hidden />
              {OPTIONS[winner].name}
            </p>
            <div className="mt-5 grid gap-3 border-t border-white/20 pt-4">
              {OPTION_IDS.map((id) => (
                <div key={id} className="grid grid-cols-[4rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                  <span className="text-white/85">{OPTIONS[id].short}</span>
                  <div className="h-3 rounded-r-[4px] bg-white/15">
                    <div className={`glide h-full rounded-r-[4px] ${OPTIONS[id].swatch} ring-1 ring-white/40`} style={{ width: `${card.totals[id]}%` }} />
                  </div>
                  <span className="text-right font-mono font-semibold">
                    <Odometer text={String(Math.round(card.totals[id]))} />
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[11px] text-white/70">Weighted score out of 100</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="text-xl font-bold">Give at least one priority a weight.</p>
            <p className="mt-1 text-ink-2">With every weight at zero there is nothing to compare.</p>
          </div>
        )}

        {winner && winner !== cheapestId && (
          <Callout>
            {OPTIONS[cheapestId].name} is cheapest at {formatUsd(costs[cheapestId].monthly)} a month, but {OPTIONS[winner].name} fits
            your priorities better on {joinLabels(advantages(card, weights, winner, cheapestId).map((a) => a.label.toLowerCase()))}. It costs{" "}
            {formatUsd(costs[winner].monthly - costs[cheapestId].monthly)} a month more.
          </Callout>
        )}

        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="kicker">Scores, 1 to 5</p>
              <p className="mt-1 text-sm text-ink-2">Disagree with a score? Change it. Cost comes from the comparison above.</p>
            </div>
            {scoresEdited && (
              <button type="button" onClick={onResetScores} className="text-xs font-medium text-brand-ink underline underline-offset-2">
                Reset scores
              </button>
            )}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th className="py-2 pr-3 font-medium">Criterion</th>
                  <th className="py-2 pr-3 font-medium">Weight</th>
                  {OPTION_IDS.map((id) => (
                    <th key={id} className="py-2 pr-3 font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className={`size-2 rounded-full ${OPTIONS[id].swatch}`} aria-hidden />
                        {OPTIONS[id].short}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CRITERIA.map((c) => (
                  <tr key={c.id} className={`border-b border-line/70 align-top ${weights[c.id] === 0 ? "opacity-50" : ""}`}>
                    <td className="py-3 pr-3 font-semibold">{c.label}</td>
                    <td className="py-3 pr-3 font-mono text-ink-2">{weights[c.id]}</td>
                    {OPTION_IDS.map((id) => (
                      <td key={id} className="py-3 pr-3">
                        {c.id === "cost" ? (
                          <>
                            <span className="font-mono font-semibold">{card.scores.cost[id].toFixed(1)}</span>
                            <span className="mt-1 block text-xs leading-5 text-muted">{formatUsd(costs[id].monthly)} / month</span>
                          </>
                        ) : (
                          <>
                            <select
                              aria-label={`${c.label} score for ${OPTIONS[id].name}`}
                              value={scores[c.id][id]}
                              onChange={(e) => onScore(c.id as Exclude<CriterionId, "cost">, id, Number(e.target.value))}
                              className="rounded-lg border border-line bg-bg px-2 py-1 font-mono text-sm"
                            >
                              {[1, 2, 3, 4, 5].map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                            <span className="mt-1 block text-xs leading-5 text-muted">{SCORE_REASONS[c.id][id]}</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
