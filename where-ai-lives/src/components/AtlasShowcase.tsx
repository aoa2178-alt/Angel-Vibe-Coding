import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { href, linkClick } from "./Frame";
import { TrustTag } from "./ui";
import { MAP, PRICES, REGIONS, RETRIEVED, SITES, STATE_REGION, cents, formatMw, mwAt, ownerLabel, planned, stateName, years } from "@/lib/data";
import { totalMw } from "@/lib/metrics";
import { DEFAULT_SCENARIO } from "@/lib/scenario";

type Box = [number, number, number, number];

/** The six largest sites by planned power: the showcase strip. */
const TOP = SITES.map((s) => ({ s, p: planned(s) }))
  .sort((a, b) => b.p.mw - a.p.mw)
  .slice(0, 6);

const city = (place: string) => {
  const parts = place.split(",").map((x) => x.trim());
  return parts[parts.length - 2] ?? place;
};

/** A state's bounding box, read off its outline. */
function bbox(code: string): Box {
  const d = MAP.states.find((s) => s.code === code)?.d ?? "";
  const n = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < n.length; i += 2) {
    x0 = Math.min(x0, n[i]!);
    x1 = Math.max(x1, n[i]!);
    y0 = Math.min(y0, n[i + 1]!);
    y1 = Math.max(y1, n[i + 1]!);
  }
  return [x0, y0, x1, y1];
}

/** The whole country, shifted right so the headline has room on the left (the view fits inside the frame; the map continues past the edges). */
const OVERVIEW: Box = [-160, -40, MAP.width + 190, MAP.height + 90];

/** A site's plate: its state with room around it, the site just left of centre and below the middle (clear of the headline and the card), above the strip. */
function plateBox(code: string, x: number, y: number): Box {
  const [x0, y0, x1, y1] = bbox(code);
  const span = Math.max(x1 - x0, y1 - y0);
  const pad = span * 0.3;
  const w = (x1 - x0 + pad * 2) * 1.8;
  const h = (y1 - y0 + pad * 2) * 1.25;
  return [x - w * 0.44, y - h * 0.55, w, h];
}

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Glide the view box to a target when it changes (instant for reduced motion). */
function useGlide(target: Box) {
  const [box, setBox] = useState<Box>(target);
  const from = useRef<Box>(target);
  useEffect(() => {
    const start = from.current;
    if (reduced()) {
      from.current = target;
      setBox(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 900);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      const next = start.map((v, j) => v + (target[j]! - v) * e) as Box;
      from.current = next;
      setBox(next);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return box;
}

function Spec({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="mt-3 grid grid-cols-[auto_auto] gap-x-6 gap-y-1.5 text-sm">
      {rows.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="text-right font-mono font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The landing showcase: the whole US atlas with every AI site pinned. Pick a site in the strip and the map glides into
 * its state, which becomes an engraved plate with rings sized by the site's power and its figures in a card.
 */
export function AtlasShowcase({ title }: { title: ReactNode }) {
  const [i, setI] = useState(-1);
  const pick = TOP[i];
  const code = pick?.s.state ?? "";
  const target = useRef<Record<string, Box>>({});
  const key = pick?.s.name ?? "overview";
  target.current[key] ??= pick ? plateBox(code, pick.s.x, pick.s.y) : OVERVIEW;
  const box = useGlide(target.current[key]!);

  // Sizes in map units: pins shrink as we zoom in so they stay readable; plate details scale to the state.
  const zoom = box[2] / OVERVIEW[2];
  const [bx0, by0, bx1, by1] = code ? bbox(code) : [0, 0, MAP.width, MAP.height];
  const sc = Math.max(bx1 - bx0, by1 - by0) / 420;
  const now = SITES.map((s) => ({ s, mw: mwAt(s, RETRIEVED), plan: planned(s).mw }));
  const region = code ? STATE_REGION[code] : undefined;
  const wait = region ? REGIONS[region.region]?.waitYears ?? null : null;
  const price = code ? PRICES.states[code]?.industrial ?? null : null;
  const mapLink = href("map", code ? { ...DEFAULT_SCENARIO, state: code } : DEFAULT_SCENARIO);

  return (
    <section className="relative flex flex-col overflow-hidden border-b border-line md:block md:h-[calc(100dvh-4rem)] md:max-h-[880px] md:min-h-[640px]" aria-label="AI sites showcase">
      <svg
        viewBox={box.map((n) => n.toFixed(1)).join(" ")}
        preserveAspectRatio="xMidYMid meet"
        className="block h-[440px] w-full md:absolute md:inset-0 md:h-full"
        role="img"
        aria-label={pick ? `${pick.s.name} in ${city(pick.s.place)}, ${stateName(code)}: ${formatMw(pick.p.mw)} planned.` : `Every tracked AI site in the US: ${SITES.length} sites.`}
      >
        <defs>
          <pattern id="atlas-hatch" width={5 * sc} height={5 * sc} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="100%" height="100%" fill="#e6dccb" />
            <line x1="0" y1="0" x2="0" y2={5 * sc} stroke="#a6967a" strokeWidth={1.2 * sc} />
          </pattern>
        </defs>
        {MAP.states.map((s) => (
          <path key={s.code || s.name} d={s.d} fill={s.code === code ? "url(#atlas-hatch)" : "var(--sunken)"} stroke="#cfc5b2" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
        ))}
        {now.map(({ s, mw, plan }) => (
          <circle
            key={s.name}
            cx={s.x}
            cy={s.y}
            r={(1.4 + Math.sqrt(Math.max(mw, plan)) * 0.24) * Math.max(zoom, 0.3)}
            fill={mw > 0 ? "var(--site)" : "none"}
            fillOpacity={s === pick?.s ? 1 : 0.55}
            stroke={mw > 0 ? "var(--surface)" : "var(--site)"}
            strokeWidth={0.8}
            vectorEffect="non-scaling-stroke"
          >
            <title>
              {s.name}, {city(s.place)}, {s.state}: {formatMw(mw)} today, {formatMw(plan)} planned
            </title>
          </circle>
        ))}
        {pick && (
          <g>
            {[1, 2, 3].map((k) => (
              <circle key={k} cx={pick.s.x} cy={pick.s.y} r={k * Math.sqrt(pick.p.mw) * 0.35 * sc} fill="none" stroke="var(--site)" strokeOpacity={0.75 - k * 0.18} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
            ))}
            <circle cx={pick.s.x} cy={pick.s.y} r={4 * sc} fill="var(--site)" />
            <text x={pick.s.x + 9 * sc} y={pick.s.y - 9 * sc} fontSize={12 * sc} letterSpacing={sc} className="fill-ink font-mono">
              {city(pick.s.place).toUpperCase()}, {code}
            </text>
          </g>
        )}
      </svg>

      <div className="pointer-events-none relative z-10 order-first mx-auto w-full max-w-[1320px] px-4 pt-8 sm:px-8 md:pt-14">
        <div className="max-w-[460px]">{title}</div>
      </div>

      <div className="relative z-10 px-4 pt-4 sm:px-8 md:absolute md:right-0 md:bottom-36 md:pt-0">
        <div className="rounded-[8px] border border-line bg-surface/95 p-4 md:w-[330px] md:p-5">
          {pick ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                0{i + 1} / 06 · {stateName(code)}
              </p>
              <p className="mt-1.5 font-serif text-[1.65rem] leading-tight">{pick.s.name}</p>
              <Spec
                rows={[
                  ["Owner", ownerLabel(pick.s.owner)],
                  ["Power, planned", formatMw(pick.p.mw)],
                  ["H100 equivalents", pick.s.h100 > 0 ? `${Math.round(pick.s.h100 / 1000).toLocaleString()}K` : "Not disclosed"],
                  ["Capital cost", pick.s.capexB > 0 ? `${pick.s.capexB.toFixed(1)}B` : "Not disclosed"],
                  ["Industrial power", price === null ? "–" : `${cents(price)}/kWh`],
                  [`Grid wait${region ? ` (${region.region})` : ""}`, years(wait)],
                ]}
              />
            </>
          ) : (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">United States · {SITES.length} sites</p>
              <p className="mt-1.5 font-serif text-[1.65rem] leading-tight">Every frontier AI data center</p>
              <Spec
                rows={[
                  ["AI power drawn today", formatMw(totalMw(RETRIEVED))],
                  ["Planned by end of 2028", formatMw(totalMw("2028-12-31"))],
                  ["Largest site", `${TOP[0]!.s.name}, ${formatMw(TOP[0]!.p.mw)}`],
                ]}
              />
            </>
          )}
          <p className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
            <span>
              Epoch AI, EIA, LBNL
              <TrustTag kind="data" />
            </span>
            <a href={mapLink} onClick={linkClick(mapLink)} className="inline-flex items-center gap-1 font-semibold text-ink hover:text-brand-ink">
              {pick ? "Open on the map" : "Open the map"} <ArrowRight className="size-3.5" aria-hidden />
            </a>
          </p>
        </div>
      </div>

      <nav aria-label="Sites" className="relative z-10 px-4 pt-6 pb-5 sm:px-8 md:absolute md:inset-x-0 md:bottom-0 md:bg-gradient-to-b md:from-transparent md:to-bg md:to-30% md:pt-10">
        <div className="relative mb-3 h-[2px] bg-ink/15">
          <i className="absolute inset-y-0 left-0 block bg-ink transition-[width] duration-500" style={{ width: `${((i + 2) / (TOP.length + 1)) * 100}%` }} />
        </div>
        <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-7 md:overflow-visible">
          {[{ label: "All sites", sub: `United States · ${SITES.length} sites` }, ...TOP.map(({ s, p }) => ({ label: s.name, sub: `${city(s.place)}, ${s.state} · ${formatMw(p.mw)}` }))].map((c, k) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setI(k - 1)}
              aria-pressed={k - 1 === i}
              className={`min-w-[150px] text-left text-xs leading-snug transition md:min-w-0 ${k - 1 === i ? "text-ink-2" : "text-muted hover:text-ink-2"}`}
            >
              <span className="font-mono text-[10px] tracking-[0.14em]">0{k}</span>
              <span className={`block text-[13px] font-semibold ${k - 1 === i ? "text-ink" : "text-ink-2"}`}>{c.label}</span>
              {c.sub}
            </button>
          ))}
        </div>
      </nav>
    </section>
  );
}
