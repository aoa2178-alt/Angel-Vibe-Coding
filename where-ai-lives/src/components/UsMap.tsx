import { useState } from "react";
import { MAP, formatMonth, formatMw, ownerLabel, planned, stateName, type Site } from "@/lib/data";
import type { StateTotal } from "@/lib/metrics";

/** MW bins for shading states (one indigo ramp, dark to light). */
export const BINS = [250, 500, 1000, 2000] as const;
const binOf = (mw: number) => (mw <= 0 ? 0 : 1 + BINS.filter((b) => mw >= b).length);
const BIN_LABELS = ["None", `Under ${BINS[0]} MW`, `${BINS[0]}–${BINS[1]}`, `${BINS[1]}–${formatMw(BINS[2])}`, `${formatMw(BINS[2])}–${formatMw(BINS[3])}`, `${formatMw(BINS[3])}+`];

export const dotRadius = (mw: number) => 2.5 + Math.sqrt(mw) * 0.4;

export interface MapSite {
  site: Site;
  /** Facility MW on the map date */
  mw: number;
}

/**
 * The US map: states shaded by AI power on the date, each site a dot sized by its power (hollow = announced, not drawing
 * power yet). Hover a dot for its details; click a state to focus it. A table view lists every site.
 */
export function UsMap({
  date,
  sites,
  totals,
  selected,
  onSelect,
}: {
  date: string;
  sites: MapSite[];
  totals: Map<string, StateTotal>;
  selected: string;
  onSelect: (code: string) => void;
}) {
  const [hover, setHover] = useState<MapSite | null>(null);
  const [table, setTable] = useState(false);
  const live = sites.filter((s) => s.mw > 0).sort((a, b) => b.mw - a.mw);
  const announced = sites.filter((s) => s.mw <= 0 && planned(s.site).mw > 0);

  return (
    <figure className="min-w-0">
      <div className="relative">
        <svg viewBox={`0 0 ${MAP.width} ${MAP.height}`} className="block h-auto w-full" role="img" aria-label={`Map of US AI data centers on ${formatMonth(date)}: ${live.length} drawing power, ${announced.length} announced`}>
          <g>
            {MAP.states.map((st) => {
              const t = totals.get(st.code);
              const isSel = st.code === selected;
              return (
                <path
                  key={st.code ?? st.name}
                  d={st.d}
                  fill={`var(--ramp-${binOf(t?.mw ?? 0)})`}
                  className="glide cursor-pointer"
                  onClick={() => onSelect(isSel ? "" : st.code)}
                >
                  <title>{`${st.name}: ${t ? `${formatMw(t.mw)} at ${t.sites} site${t.sites === 1 ? "" : "s"}` : "no AI sites drawing power"}`}</title>
                </path>
              );
            })}
          </g>
          <path d={MAP.borders} fill="none" stroke="var(--bg)" strokeWidth={0.8} strokeLinejoin="round" pointerEvents="none" />
          {selected && (
            <path d={MAP.states.find((s) => s.code === selected)?.d} fill="none" stroke="var(--brand)" strokeWidth={2.2} strokeLinejoin="round" pointerEvents="none" />
          )}
          {announced.map((s) => (
            <circle
              key={s.site.name}
              cx={s.site.x}
              cy={s.site.y}
              r={dotRadius(planned(s.site).mw)}
              fill="none"
              stroke="var(--site)"
              strokeWidth={1.5}
              strokeDasharray="3 2.5"
              className="glide"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          {live.map((s) => (
            <circle
              key={s.site.name}
              cx={s.site.x}
              cy={s.site.y}
              r={dotRadius(s.mw)}
              fill="var(--site)"
              fillOpacity={0.9}
              stroke="var(--bg)"
              strokeWidth={1.5}
              className="glide"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        {hover && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 w-60 rounded-lg border border-line bg-sunken px-3 py-2 text-xs text-ink"
            style={{
              left: `clamp(0px, calc(${(hover.site.x / MAP.width) * 100}% + 12px), calc(100% - 15rem))`,
              top: `calc(${(hover.site.y / MAP.height) * 100}% + 12px)`,
            }}
          >
            <p className="font-semibold">{hover.site.name}</p>
            <p className="text-muted">
              {ownerLabel(hover.site.owner)} · {hover.site.place.split(",").slice(-2).join(",").trim() || stateName(hover.site.state)}
            </p>
            <p className="mt-1 flex justify-between gap-3">
              <span className="text-muted">Power on {formatMonth(date)}</span>
              <span className="font-mono">{hover.mw > 0 ? formatMw(hover.mw) : "not yet"}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-muted">Planned</span>
              <span className="font-mono">
                {formatMw(planned(hover.site).mw)}
                {planned(hover.site).date ? ` by ${formatMonth(planned(hover.site).date)}` : ""}
              </span>
            </p>
          </div>
        )}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-ink-2">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-muted">AI power in the state</span>
          {BIN_LABELS.map((l, k) => (
            <span key={l} className="flex items-center gap-1">
              <span className="size-3 rounded-sm border border-line" style={{ background: `var(--ramp-${k})` }} aria-hidden />
              {l}
            </span>
          ))}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-site" aria-hidden /> Drawing power (size = MW)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full border-[1.5px] border-dashed border-site" aria-hidden /> Announced, not yet drawing power
          </span>
        </span>
      </figcaption>
      <button type="button" onClick={() => setTable((t) => !t)} aria-expanded={table} className="mt-3 text-xs font-medium text-brand-ink underline underline-offset-2 print:hidden">
        {table ? "Hide table" : "Show every site as a table"}
      </button>
      {table && (
        <div className="mt-2 max-h-96 overflow-auto rounded-lg border border-line">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-sunken text-muted">
              <tr>
                <th className="px-2 py-1.5 font-medium">Site</th>
                <th className="px-2 py-1.5 font-medium">Owner</th>
                <th className="px-2 py-1.5 font-medium">State</th>
                <th className="px-2 py-1.5 text-right font-medium">MW now</th>
                <th className="px-2 py-1.5 text-right font-medium">Planned</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {[...live, ...announced].map((s) => (
                <tr key={s.site.name} className="border-t border-line">
                  <td className="px-2 py-1 font-sans">{s.site.name}</td>
                  <td className="px-2 py-1 font-sans">{ownerLabel(s.site.owner)}</td>
                  <td className="px-2 py-1">{s.site.state}</td>
                  <td className="px-2 py-1 text-right">{s.mw > 0 ? Math.round(s.mw).toLocaleString("en-US") : "–"}</td>
                  <td className="px-2 py-1 text-right">{Math.round(planned(s.site).mw).toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
