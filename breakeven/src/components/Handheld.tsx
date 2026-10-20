import { useEffect, useRef, useState, type ReactNode } from "react";
import { linkClick, navigate } from "./Brand";
import { OPTIONS } from "./options";
import { chime, click, tick } from "@/lib/sound";
import { DEFAULT_ASSUMPTIONS, DEFAULT_WORKLOAD, cheapest, compare, crossovers, formatTokensM, formatUsd, type OptionId } from "@/lib/tco";

/** Volumes the wheel steps through: 10M to 100B tokens a month, ten steps per decade. */
const STEPS = Array.from({ length: 41 }, (_, i) => 10 * 10 ** (i / 10));
const nearest = (m: number) => STEPS.reduce((best, v, i) => (Math.abs(Math.log(v / m)) < Math.abs(Math.log(STEPS[best]! / m)) ? i : best), 0);
const clamp = (i: number) => Math.max(0, Math.min(STEPS.length - 1, i));
const IDS: OptionId[] = ["api", "rent", "own"];
const DOT: Record<OptionId, string> = { api: "#a77bdb", rent: "#5b8fd6", own: "#3aa17a" };
/** Chimes when the cheapest option changes (not on first render). */
function useWinChime(win: OptionId) {
  const prev = useRef(win);
  useEffect(() => {
    if (prev.current !== win) chime();
    prev.current = win;
  }, [win]);
}

const typing = (e: KeyboardEvent) => e.target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);

/**
 * A click wheel: drag around the ring to turn it (one step per eighth of a turn), or use the four labelled buttons and
 * the centre button.
 */
function Wheel({
  onTurn,
  onPress,
  pressLabel,
  labels,
}: {
  onTurn: (d: 1 | -1) => void;
  onPress: () => void;
  pressLabel: string;
  labels: { top: [string, () => void]; left: [string, () => void]; right: [string, () => void]; bottom: [string, () => void] };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<number | null>(null);
  const angle = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };
  const pos = {
    top: "top-2.5 left-1/2 -translate-x-1/2",
    left: "left-2.5 top-1/2 -translate-y-1/2",
    right: "right-2.5 top-1/2 -translate-y-1/2",
    bottom: "bottom-2.5 left-1/2 -translate-x-1/2",
  } as const;
  return (
    <div
      ref={ref}
      className="relative mx-auto mt-6 size-[210px] cursor-grab touch-none select-none rounded-full bg-[radial-gradient(circle_at_50%_40%,#fbfcfc,#e6eaec)] shadow-[inset_0_2px_4px_rgb(23_32_39/0.12),0_1px_0_#fff] active:cursor-grabbing"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        last.current = angle(e);
        ref.current!.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (last.current === null) return;
        let d = angle(e) - last.current;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        if (Math.abs(d) > Math.PI / 8) {
          onTurn(d > 0 ? 1 : -1);
          last.current = angle(e);
        }
      }}
      onPointerUp={() => (last.current = null)}
      onPointerCancel={() => (last.current = null)}
    >
      {(Object.keys(pos) as (keyof typeof pos)[]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={labels[k][1]}
          className={`absolute ${pos[k]} rounded-md px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-[#6b7680] transition hover:text-ink`}
        >
          {labels[k][0]}
        </button>
      ))}
      <button
        type="button"
        onClick={onPress}
        className="absolute inset-[72px] grid place-items-center rounded-[999px] bg-[linear-gradient(160deg,#eef1f2,#d8dee1)] text-[10px] font-semibold tracking-[0.1em] text-[#56626c] shadow-[0_1px_2px_rgb(23_32_39/0.2)] transition hover:text-ink"
      >
        {pressLabel}
      </button>
    </div>
  );
}

function Body({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`w-[330px] max-w-full rounded-[36px] bg-[linear-gradient(160deg,#f4f6f7,#dfe4e7)] p-[22px] shadow-[0_30px_60px_rgb(23_32_39/0.18),inset_0_2px_0_#fff,inset_0_-3px_0_#c9d0d4] ${className}`}>
      {children}
    </div>
  );
}

const screen = "rounded-xl bg-[#182536] px-3.5 pb-3 pt-3.5 text-[13px] text-[#e9f0f2] shadow-[inset_0_0_0_3px_#0f1824]";

/**
 * The landing's handheld: turn the wheel (or press ← →) to change the monthly volume from 10M to 100B tokens. The screen
 * shows the three monthly costs at the default assumptions, with the cheapest lit; the centre button opens the cost
 * comparison at that volume.
 */
export function CostPod() {
  const [i, setI] = useState(nearest(DEFAULT_WORKLOAD.tokensM));
  const tokensM = STEPS[i]!;
  const costs = compare({ ...DEFAULT_WORKLOAD, tokensM }, DEFAULT_ASSUMPTIONS);
  const win = cheapest(costs);
  const max = Math.max(...IDS.map((id) => costs[id].monthly));
  const cross = crossovers(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS);
  const next =
    win === "api"
      ? cross.apiUntilM
        ? `renting wins above about ${formatTokensM(cross.apiUntilM)}`
        : "the API stays cheapest"
      : cross.ownFromM && tokensM < cross.ownFromM
        ? `owning wins for good above about ${formatTokensM(cross.ownFromM)}`
        : "owning stays cheapest from here";
  const open = `/run-it?v=${Math.round(tokensM)}`;
  const go = () => {
    click();
    navigate(open);
  };
  useWinChime(win);
  const turn = (d: number) => {
    tick();
    setI((x) => clamp(x + d));
  };
  const press = (f: () => void) => () => {
    click();
    f();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") turn(1);
      else if (e.key === "ArrowLeft") turn(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Body className="mx-auto">
      <div className={`${screen} h-[236px]`} aria-live="polite">
        <div className="flex justify-between font-mono text-[10px] tracking-[0.1em] text-[#8fa3b3]">
          <span>MONTHLY VOLUME</span>
          <span>
            {i + 1}/{STEPS.length}
          </span>
        </div>
        <p className="mb-2 mt-1.5 font-mono text-[26px] font-semibold text-white">
          {formatTokensM(tokensM)} <span className="text-[13px] font-normal text-[#8fa3b3]">tokens</span>
        </p>
        {IDS.map((id) => (
          <div key={id} className={`grid grid-cols-[12px_1fr_auto] items-center gap-x-2 rounded-md px-2 py-1.5 text-[12.5px] ${id === win ? "bg-[#2f7366] text-white" : ""}`}>
            <span className="size-2 rounded-full" style={{ background: DOT[id] }} aria-hidden />
            <span>{OPTIONS[id].name}</span>
            <span className="font-mono">{formatUsd(costs[id].monthly)}/mo</span>
            <span className={`col-span-2 col-start-2 mt-1 h-1 overflow-hidden rounded-sm ${id === win ? "bg-[#24564d]" : "bg-[#2d3d50]"}`}>
              <i className="block h-full" style={{ width: `${(costs[id].monthly / max) * 100}%`, background: id === win ? "#79aa9f" : DOT[id] }} />
            </span>
          </div>
        ))}
        <p className="mt-1.5 text-[11px] leading-4 text-[#a9c9c2]">
          Cheapest: {OPTIONS[win].name} · {next}
        </p>
      </div>
      <Wheel
        onTurn={turn}
        onPress={go}
        pressLabel="OPEN"
        labels={{
          top: ["10M", press(() => setI(0))],
          left: ["−", () => turn(-1)],
          right: ["+", () => turn(1)],
          bottom: ["10× ▸", press(() => setI((x) => clamp(x + 10)))],
        }}
      />
      <a href={open} onClick={linkClick(open)} className="sr-only">
        Open the cost comparison at {formatTokensM(tokensM)} tokens a month
      </a>
    </Body>
  );
}

/** Breakeven's four pages, for the Approach list. */
export const PAGES = [
  { href: "/worth-it", label: "Evaluate AI ROI", body: "Does AI save money for this work?" },
  { href: "/run-it", label: "Compare compute costs", body: "API, rent or own: which is cheapest at your volume?" },
  { href: "/power-it", label: "Power planning", body: "Only if you own: how much power you need." },
  { href: "/result", label: "Recommendation", body: "The answer on one printable page." },
];

const SHORT: Record<OptionId, string> = { api: "API", rent: "Rent", own: "Own" };

/**
 * The cost page's volume control, as a pocket calculator: a green LCD reads the volume and the cheapest way to run it,
 * the named presets and round volumes are keys, and the dial (drag it round, or − and +) steps the volume up and down.
 */
export function CalcPad({
  tokensM,
  onChange,
  costs,
  presets,
}: {
  tokensM: number;
  onChange: (m: number) => void;
  costs: Record<OptionId, { monthly: number }>;
  presets: readonly { id: string; label: string; tokensM: number }[];
}) {
  const win = (IDS as OptionId[]).reduce((a, b) => (costs[b].monthly < costs[a].monthly ? b : a));
  const i = nearest(tokensM);
  const step = (d: number) => {
    tick();
    onChange(STEPS[clamp(i + d)]!);
  };
  const pick = (m: number) => {
    click();
    onChange(m);
  };
  useWinChime(win);
  const dial = useRef<HTMLDivElement>(null);
  const last = useRef<number | null>(null);
  const angle = (e: React.PointerEvent) => {
    const r = dial.current!.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };
  const key = "rounded-[10px] px-1 py-2.5 font-mono text-[12px] font-semibold leading-tight shadow-[0_3px_0_#121b26] transition active:translate-y-px dark:shadow-[0_3px_0_#b9c3c9]";
  const on = (m: number) => Math.abs(Math.log(m / tokensM)) < 0.01;
  const tone = (m: number) => (on(m) ? "bg-[#2f7366] text-white" : "bg-[#2c3d52] text-[#e7eef2] hover:bg-[#34485f] dark:bg-white dark:text-[#1d2a3a] dark:hover:bg-[#f1f4f6]");

  return (
    <div className="rounded-[22px] bg-[#1d2a3a] p-4 shadow-[0_18px_40px_rgb(23_32_39/0.22),inset_0_2px_0_#2c3d52] dark:bg-[linear-gradient(160deg,#f4f6f7,#dfe4e7)] dark:shadow-[0_18px_40px_rgb(0_0_0/0.45),inset_0_2px_0_#fff]">
      <div className="rounded-lg bg-[#c9d7cf] px-3 py-2.5 font-mono text-[#1d2a26] shadow-[inset_0_2px_6px_rgb(0_0_0/0.25)]" aria-live="polite">
        <div className="flex justify-between text-[10px] tracking-[0.06em]">
          <span>TOKENS / MONTH</span>
          <span>CHEAPEST</span>
        </div>
        <p className="text-right text-[26px] font-semibold tracking-[-0.02em]">
          {formatTokensM(tokensM)} → {SHORT[win].toUpperCase()}
        </p>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-[10.5px]">
          {IDS.map((id) => (
            <div key={id} className={`rounded border px-1.5 py-1 ${id === win ? "border-[#1d2a26] bg-[#1d2a26] text-[#c9d7cf]" : "border-[#9fb1a8]"}`}>
              {SHORT[id]}
              <br />
              {formatUsd(costs[id].monthly)}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3.5 grid grid-cols-3 gap-2" role="group" aria-label="Presets">
        {presets.map((p) => (
          <button key={p.id} type="button" onClick={() => pick(p.tokensM)} aria-pressed={on(p.tokensM)} className={`${key} ${tone(p.tokensM)}`}>
            {p.label}
            <span className="block text-[10px] font-normal opacity-75">{formatTokensM(p.tokensM)}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2" role="group" aria-label="Round volumes">
        {[10, 1_000, 10_000, 100_000].map((m) => (
          <button key={m} type="button" onClick={() => pick(m)} aria-pressed={on(m)} className={`${key} ${tone(m)}`}>
            {formatTokensM(m)}
          </button>
        ))}
      </div>
      <div className="mt-3.5 flex items-center justify-center gap-4">
        <button type="button" onClick={() => step(-1)} className="px-2 font-mono text-sm text-[#a9b6bf] hover:text-white dark:text-[#4b5a66] dark:hover:text-[#1d2a3a]" aria-label="Lower volume">
          −
        </button>
        <div
          ref={dial}
          role="slider"
          tabIndex={0}
          aria-label="Monthly token volume"
          aria-valuemin={0}
          aria-valuemax={STEPS.length - 1}
          aria-valuenow={i}
          aria-valuetext={`${formatTokensM(tokensM)} tokens a month`}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") step(1);
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") step(-1);
          }}
          onPointerDown={(e) => {
            last.current = angle(e);
            dial.current!.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (last.current === null) return;
            let d = angle(e) - last.current;
            if (d > Math.PI) d -= 2 * Math.PI;
            if (d < -Math.PI) d += 2 * Math.PI;
            if (Math.abs(d) > 0.3) {
              step(d > 0 ? 1 : -1);
              last.current = angle(e);
            }
          }}
          onPointerUp={() => (last.current = null)}
          onPointerCancel={() => (last.current = null)}
          className="relative size-[64px] cursor-grab touch-none rounded-[999px] bg-[radial-gradient(circle_at_40%_35%,#46586e,#22303f)] shadow-[0_4px_0_#121b26] dark:bg-[radial-gradient(circle_at_40%_35%,#ffffff,#d5dce1)] dark:shadow-[0_4px_0_#b9c3c9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#79aa9f] active:cursor-grabbing"
        >
          <i className="absolute left-1/2 top-1.5 block h-3.5 w-[3px] rounded-sm bg-[#79aa9f]" style={{ transformOrigin: "50% 26px", transform: `translateX(-50%) rotate(${(i / (STEPS.length - 1)) * 300 - 150}deg)` }} />
        </div>
        <button type="button" onClick={() => step(1)} className="px-2 font-mono text-sm text-[#a9b6bf] hover:text-white dark:text-[#4b5a66] dark:hover:text-[#1d2a3a]" aria-label="Higher volume">
          +
        </button>
      </div>
    </div>
  );
}
