import { useEffect, useRef, useState, type ReactNode } from "react";
import { linkClick, navigate } from "./Brand";
import { OPTIONS } from "./options";
import { DEFAULT_ASSUMPTIONS, DEFAULT_WORKLOAD, cheapest, compare, crossovers, formatTokensM, formatUsd, type OptionId } from "@/lib/tco";

/** Volumes the wheel steps through: 10M to 100B tokens a month, ten steps per decade. */
const STEPS = Array.from({ length: 41 }, (_, i) => 10 * 10 ** (i / 10));
const nearest = (m: number) => STEPS.reduce((best, v, i) => (Math.abs(Math.log(v / m)) < Math.abs(Math.log(STEPS[best]! / m)) ? i : best), 0);
const clamp = (i: number) => Math.max(0, Math.min(STEPS.length - 1, i));
const IDS: OptionId[] = ["api", "rent", "own"];
const DOT: Record<OptionId, string> = { api: "#a77bdb", rent: "#5b8fd6", own: "#3aa17a" };
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
  const go = () => navigate(open);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") setI((x) => clamp(x + 1));
      else if (e.key === "ArrowLeft") setI((x) => clamp(x - 1));
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
        onTurn={(d) => setI((x) => clamp(x + d))}
        onPress={go}
        pressLabel="OPEN"
        labels={{
          top: ["10M", () => setI(0)],
          left: ["−", () => setI((x) => clamp(x - 1))],
          right: ["+", () => setI((x) => clamp(x + 1))],
          bottom: ["10× ▸", () => setI((x) => clamp(x + 10))],
        }}
      />
      <a href={open} onClick={linkClick(open)} className="sr-only">
        Open the cost comparison at {formatTokensM(tokensM)} tokens a month
      </a>
    </Body>
  );
}

/** The pages, as the menu device lists them. */
export const PAGES = [
  { tab: "ROI", href: "/worth-it", label: "Evaluate AI ROI", sub: "Is AI worth it?", body: "Savings, payback and 12-month ROI, and whether AI beats rules or a process fix." },
  { tab: "Cost", href: "/run-it", label: "Compare compute costs", sub: "API, rent or own", body: "API, rented or owned GPUs on total cost, and the volumes where the answer changes." },
  { tab: "Power", href: "/power-it", label: "Power planning", sub: "kW and grid delay", body: "How much power owning needs, and the cheapest way to bridge a late grid connection." },
  { tab: "Call", href: "/result", label: "Recommendation", sub: "the call", body: "One page: the call, what would change it, and how to land it. Printable." },
];

/**
 * The same handheld as a menu: the wheel moves through Breakeven's four pages, the screen describes the one selected,
 * and the centre button opens it.
 */
export function MenuPod() {
  const [i, setI] = useState(0);
  const page = PAGES[i]!;
  const move = (d: 1 | -1) => setI((x) => (x + d + PAGES.length) % PAGES.length);
  const go = () => navigate(page.href);
  return (
    <Body className="mx-auto">
      <div className={`${screen} h-[236px]`} aria-live="polite">
        <div className="mb-2 flex gap-1">
          {PAGES.map((p, k) => (
            <span key={p.tab} className={`flex-1 rounded py-1 text-center font-mono text-[10px] ${k === i ? "bg-[#2d3d50] text-white" : "text-[#8fa3b3]"}`}>
              {p.tab}
            </span>
          ))}
        </div>
        {PAGES.map((p, k) => (
          <button
            key={p.href}
            type="button"
            onClick={() => setI(k)}
            onDoubleClick={go}
            className={`flex w-full justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] ${k === i ? "bg-[#2f7366] text-white" : "text-[#e9f0f2]"}`}
          >
            <span>{p.label}</span>
            <small className={`font-mono text-[11px] ${k === i ? "text-[#d5ece6]" : "text-[#8fa3b3]"}`}>{p.sub} ›</small>
          </button>
        ))}
        <p className="mt-2.5 text-[12px] leading-[1.45] text-[#a9c9c2]">{page.body}</p>
      </div>
      <Wheel
        onTurn={move}
        onPress={go}
        pressLabel="OPEN"
        labels={{
          top: ["▲", () => move(-1)],
          left: ["◂", () => move(-1)],
          right: ["▸", () => move(1)],
          bottom: ["▼", () => move(1)],
        }}
      />
    </Body>
  );
}
