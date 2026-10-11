import { useEffect, useRef } from "react";

export const TIER_LABELS = ["Customer", "Retailer", "Distributor", "Factory", "Supplier"];
const COLORS = ["#c9d2ff", "#7fd8cf", "#2fd1c4", "#12a19a", "#5fa8ff"];
const STRANDS = 3;

/**
 * The bullwhip as glowing waves: one ribbon per link in the chain, customer to supplier. Each ribbon's swing is the square
 * root of that tier's variance ratio from the model, so the supplier's wave really is about 9× wider than the customer's
 * when its variance is 89×. Swings grow left to right (downstream to upstream) and ease to the shared-data ratios when
 * `shared` is on. Hovering adds a little ripple. With reduced motion, it draws one still frame.
 */
export function Waves({ ratios, sharedRatios, shared, className = "" }: { ratios: number[]; sharedRatios: number[]; shared: boolean; className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const state = useRef({ amp: ratios.map(Math.sqrt), target: ratios.map(Math.sqrt), hover: 0 });

  useEffect(() => {
    state.current.target = (shared ? sharedRatios : ratios).map(Math.sqrt);
  }, [shared, ratios, sharedRatios]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const maxA = Math.sqrt(Math.max(...ratios));
    let raf = 0;

    const draw = (t: number) => {
      const W = svg.clientWidth || 800;
      const H = svg.clientHeight || 300;
      const s = state.current;
      s.amp = s.amp.map((a, i) => (reduced ? s.target[i]! : a + (s.target[i]! - a) * 0.05));
      const mid = H * 0.5;
      let out = "";
      s.amp.forEach((amp, i) => {
        const A = (amp / maxA) * H * 0.32;
        for (let k = 0; k < STRANDS; k++) {
          let d = "";
          for (let x = 0; x <= W; x += 8) {
            const u = x / W;
            const grow = 0.25 + 0.75 * u;
            const y = mid + (i - 2) * 6 + Math.sin(u * 7 - t / 900 + i * 0.7 + k * 0.25) * A * grow + Math.sin(u * 17 - t / 600 + k) * 3 * (1 + s.hover);
            d += `${x ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
          }
          out += `<path d="${d}" fill="none" stroke="${COLORS[i % COLORS.length]}" stroke-width="${k === 1 ? 2 : 1}" stroke-opacity="${k === 1 ? 0.95 : 0.45}" filter="url(#wave-glow)"/>`;
        }
      });
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.innerHTML = `<defs><filter id="wave-glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${out}`;
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onMove = (e: PointerEvent) => {
      const b = svg.getBoundingClientRect();
      state.current.hover = Math.min(1, Math.max(0, (e.clientX - b.left) / b.width));
    };
    svg.parentElement?.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      svg.parentElement?.removeEventListener("pointermove", onMove);
    };
  }, [ratios]);

  const r = shared ? sharedRatios : ratios;
  return (
    <svg
      ref={svgRef}
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Bullwhip: order swings at each tier, as a multiple of customer demand: ${TIER_LABELS.map((l, i) => `${l} ${i === 0 ? 1 : Math.round(r[i]!)}×`).join(", ")}.`}
    />
  );
}

export const WAVE_COLORS = COLORS;
