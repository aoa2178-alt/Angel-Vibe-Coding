import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { OPTIONS } from "@/Calculator";
import { linkClick } from "./Brand";
import { ClosingBars } from "./ClosingBars";
import { Odometer } from "./Odometer";
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_WORKLOAD,
  VOLUME_MAX_M,
  VOLUME_MIN_M,
  cheapest,
  compare,
  crossovers,
  formatTokensM,
  formatUsd,
  type OptionId,
} from "@/lib/tco";

interface Milestone {
  fromM: number;
  option: OptionId;
  title: string;
  body: string;
}

/** The story's chapters, placed at the model's real switch points for the default assumptions. */
function milestones(): Milestone[] {
  const cross = crossovers(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS);
  const out: Milestone[] = [
    { fromM: VOLUME_MIN_M, option: "api", title: "Pay per token", body: "At low volume the API wins: no hardware, no idle GPUs, and you pay only for what you use." },
  ];
  if (cross.apiUntilM !== null) {
    out.push({
      fromM: cross.apiUntilM,
      option: "rent",
      title: "Rent a GPU",
      body: `Around ${formatTokensM(cross.apiUntilM)} tokens a month, one rented GPU, busy around the clock, costs less than the API bill.`,
    });
  }
  // The first volume where owning wins, if it comes before owning wins for good: rent and own trade places in between.
  let firstOwn: number | null = null;
  for (let i = 0; i <= 400; i++) {
    const m = VOLUME_MIN_M * Math.pow(VOLUME_MAX_M / VOLUME_MIN_M, i / 400);
    if (cheapest(compare({ ...DEFAULT_WORKLOAD, tokensM: m }, DEFAULT_ASSUMPTIONS)) === "own") {
      firstOwn = m;
      break;
    }
  }
  if (cross.flipFlops && firstOwn !== null && cross.ownFromM !== null && firstOwn < cross.ownFromM * 0.9) {
    out.push({
      fromM: firstOwn,
      option: "own",
      title: "Rent and own trade places",
      body: "Owned GPUs come in whole 8-GPU servers: cheap once full, costly while half empty. So the lead swaps as each new server fills.",
    });
  }
  if (cross.ownFromM !== null) {
    out.push({
      fromM: cross.ownFromM,
      option: "own",
      title: "Own the hardware",
      body: `From about ${formatTokensM(cross.ownFromM)} tokens a month, your own servers stay the cheapest for good.`,
    });
  }
  return out;
}

const logPos = (m: number) => Math.log10(m / VOLUME_MIN_M) / Math.log10(VOLUME_MAX_M / VOLUME_MIN_M);
const TICKS = [10, 100, 1_000, 10_000, 100_000];

/** Two significant figures, so the rolling volume reads cleanly. */
function round2(m: number) {
  const p = Math.pow(10, Math.floor(Math.log10(m)) - 1);
  return Math.round(m / p) * p;
}

/**
 * "The flip": a pinned panel whose token volume is driven by scrolling, from 10M to 100B a month.
 * The bars, the winner and the chapter captions update as the reader scrolls through the tall track.
 */
export function FlipStory() {
  const track = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const chapters = useMemo(milestones, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = track.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      setProgress(span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const tokensM = round2(VOLUME_MIN_M * Math.pow(VOLUME_MAX_M / VOLUME_MIN_M, progress));
  const costs = compare({ ...DEFAULT_WORKLOAD, tokensM }, DEFAULT_ASSUMPTIONS);
  const winner = cheapest(costs);
  const active = chapters.reduce((a, c, i) => (tokensM >= c.fromM ? i : a), 0);

  return (
    <div ref={track} className="relative h-[320vh]">
      <p className="sr-only">
        As volume grows from 10 million to 100 billion tokens a month:{" "}
        {chapters.map((c) => `${c.title}, from ${formatTokensM(c.fromM)}: ${c.body}`).join(" ")}
      </p>
      <div className="sticky top-0 flex h-dvh items-center pb-4 pt-20">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-5 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <div className="min-w-0">
            {/* Volume rail: where the reader is, and where each chapter starts */}
            <div className="relative h-10">
              <div className="absolute inset-x-0 top-3 h-px bg-line" />
              <div className="absolute left-0 top-3 h-px bg-brand" style={{ width: `${progress * 100}%` }} />
              {chapters.map((c) => (
                <span
                  key={c.title}
                  className={`absolute top-[7px] size-3 -translate-x-1/2 rounded-full border-2 border-bg ${OPTIONS[c.option].swatch}`}
                  style={{ left: `${logPos(c.fromM) * 100}%` }}
                />
              ))}
              <span className="absolute top-[5px] h-4 w-0.5 -translate-x-1/2 bg-ink" style={{ left: `${progress * 100}%` }} />
              {TICKS.map((t) => (
                <span key={t} className="absolute top-6 -translate-x-1/2 font-mono text-[10px] text-muted first:translate-x-0 last:-translate-x-full" style={{ left: `${logPos(t) * 100}%` }}>
                  {formatTokensM(t)}
                </span>
              ))}
            </div>

            <ol className="mt-6 space-y-1">
              {chapters.map((c, i) => (
                <li
                  key={c.title}
                  className={`border-l-2 py-2 pl-4 transition-[opacity,border-color] duration-500 ${
                    i === active ? "border-[var(--win)] opacity-100" : "hidden border-line opacity-40 lg:block"
                  } theme-${c.option}`}
                >
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="text-lg font-bold tracking-tight sm:text-xl">{c.title}</span>
                    <span className="font-mono text-xs text-muted">from {formatTokensM(c.fromM)}</span>
                  </p>
                  <p className={`mt-1 text-[15px] leading-7 text-ink-2 ${i === active ? "" : "lg:hidden"}`}>{c.body}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className={`theme-${winner} grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3`}>
            <div className="win-panel rounded-2xl p-5 text-white sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                <p className="font-mono text-3xl font-semibold tracking-tight sm:text-5xl">
                  <Odometer text={formatTokensM(tokensM)} />
                  <span className="ml-2 text-sm font-normal text-white/70 sm:text-base">tokens / month</span>
                </p>
                <p className="font-mono text-sm text-white/85">
                  <Odometer text={formatUsd(costs[winner].monthly)} /> / mo
                </p>
              </div>
              <p className="mt-3 flex items-center gap-2.5 text-xl font-extrabold tracking-tight sm:text-3xl">
                <span className={`size-3 shrink-0 rounded-full ring-2 ring-white/80 ${OPTIONS[winner].swatch}`} />
                {OPTIONS[winner].name} wins
              </p>
            </div>
            <ClosingBars costs={costs} winner={winner} meta={OPTIONS} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlipStoryLink() {
  return (
    <a
      href="/calculator"
      onClick={linkClick("/calculator")}
      className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 font-semibold text-ink transition hover:border-brand"
    >
      Try your own number <ArrowRight className="size-4" aria-hidden />
    </a>
  );
}
