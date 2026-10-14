import { useMemo } from "react";
import { Explain } from "./Explain";
import { OPTIONS } from "./options";
import { flipSegments, volumePosition } from "@/lib/explain";
import { VOLUME_MAX_M, VOLUME_MIN_M, cheapest, compare, crossovers, formatTokensM, type Assumptions, type OptionId, type Workload } from "@/lib/tco";

const ZONE: Record<OptionId, string> = { api: "API", rent: "renting", own: "owning" };

/**
 * Where the answer flips, as one strip: the volume ranges where each option is cheapest (log scale, 10M to 100B tokens
 * a month), with a marker for your volume. The sentence above it says the same thing in words.
 */
export function FlipStrip({ workload, assumptions, sentence }: { workload: Workload; assumptions: Assumptions; sentence: string }) {
  const segments = useMemo(() => flipSegments(workload, assumptions), [workload, assumptions]);
  const here = cheapest(compare(workload, assumptions));
  const cross = useMemo(() => crossovers(workload, assumptions), [workload, assumptions]);
  const you = volumePosition(workload.tokensM);
  const ids = [...new Set(segments.map((s) => s.id))];

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <p className="kicker">
        Where the answer flips
        <Explain id="crossover" />
      </p>
      <p className="mt-1 text-sm leading-6 text-ink">
        {sentence} <strong>You're in the {ZONE[here]} zone.</strong>
      </p>
      <div className="relative mt-6 h-3" role="img" aria-label={`Cheapest option by monthly volume, from ${formatTokensM(VOLUME_MIN_M)} to ${formatTokensM(VOLUME_MAX_M)} tokens. Your volume, ${formatTokensM(workload.tokensM)}, is in the ${ZONE[here]} zone.`}>
        {segments.map((s, i) => (
          <span
            key={i}
            className={`absolute top-0 h-3 ${OPTIONS[s.id].swatch} ${i === 0 ? "rounded-l-full" : ""} ${i === segments.length - 1 ? "rounded-r-full" : ""}`}
            style={{ left: `${s.from * 100}%`, width: `${Math.max(0.5, (s.to - s.from) * 100)}%` }}
          />
        ))}
        <span className="absolute -top-5 bottom-[-6px] w-0.5 bg-ink" style={{ left: `calc(${you * 100}% - 1px)` }} aria-hidden>
          <span className={`absolute -top-1 whitespace-nowrap text-[11px] font-bold text-ink ${you > 0.8 ? "right-1.5" : "left-1.5"}`}>You · {formatTokensM(workload.tokensM)}</span>
        </span>
      </div>
      <div className="relative mt-2 h-4 font-mono text-[10.5px] text-muted" aria-hidden>
        <span className="absolute left-0">{formatTokensM(VOLUME_MIN_M)}</span>
        {[cross.apiUntilM, cross.ownFromM].map((m) =>
          m !== null && volumePosition(m) > 0.08 && volumePosition(m) < 0.92 ? (
            <span key={m} className="absolute -translate-x-1/2" style={{ left: `${volumePosition(m) * 100}%` }}>
              {formatTokensM(m)}
            </span>
          ) : null,
        )}
        <span className="absolute right-0">{formatTokensM(VOLUME_MAX_M)}</span>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        {ids.map((id) => (
          <span key={id} className="inline-flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${OPTIONS[id].swatch}`} aria-hidden />
            {OPTIONS[id].name}
          </span>
        ))}
      </p>
    </div>
  );
}
