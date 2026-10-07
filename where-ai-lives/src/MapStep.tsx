import { useMemo } from "react";
import { Frame, StepHeading, href, linkClick, useScenario } from "@/components/Frame";
import { LineChart } from "@/components/LineChart";
import { Card, Kicker, Pills, Stat } from "@/components/ui";
import { UsMap } from "@/components/UsMap";
import { MAP, OWNERS, RETRIEVED, formatMonth, formatMw, mwAt, ownerLabel, planned, stateName } from "@/lib/data";
import { byOwner, byState, quarterDates, sitesFor, totalMw } from "@/lib/metrics";
import { DATE_MAX, DATE_MIN, type Scenario } from "@/lib/scenario";

/** Months from DATE_MIN to DATE_MAX, for the date slider. */
const MONTHS: string[] = (() => {
  const out: string[] = [];
  for (let d = DATE_MIN; d <= DATE_MAX; ) {
    out.push(d);
    const [y, m] = d.split("-").map(Number) as [number, number];
    d = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  }
  return out;
})();
const monthIndex = (date: string) => Math.max(0, MONTHS.findLastIndex((m) => m <= date));

export const OWNER_OPTIONS = [{ id: "all", label: "All" }, ...OWNERS.map((o) => ({ id: o, label: ownerLabel(o) })), { id: "Others", label: "Others" }];

export function DatePicker({ s, setS }: { s: Scenario; setS: (s: Scenario) => void }) {
  const presets = [
    { id: RETRIEVED, label: "Today" },
    { id: "2027-12-31", label: "End of 2027" },
    { id: "2028-12-31", label: "End of 2028" },
  ];
  return (
    <div>
      <label className="block">
        <span className="flex items-baseline justify-between gap-3 text-sm font-medium">
          Map date <span className="font-mono text-brand-ink">{s.at === RETRIEVED ? `Today (${formatMonth(s.at)})` : formatMonth(s.at)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={MONTHS.length - 1}
          value={monthIndex(s.at)}
          onChange={(e) => setS({ ...s, at: MONTHS[Number(e.target.value)]! })}
          className="mt-2 w-full"
          aria-valuetext={formatMonth(s.at)}
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={s.at === p.id}
            onClick={() => setS({ ...s, at: p.id })}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${s.at === p.id ? "border-brand bg-brand text-on-brand" : "border-line hover:border-brand"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StateSelect({ s, setS }: { s: Scenario; setS: (s: Scenario) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">Focus a state</span>
      <select value={s.state} onChange={(e) => setS({ ...s, state: e.target.value })} className="mt-1 w-full rounded-lg border border-line bg-sunken px-3 py-2 text-sm">
        <option value="">None</option>
        {[...MAP.states]
          .filter((m) => m.code)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((m) => (
            <option key={m.code} value={m.code}>
              {m.name}
            </option>
          ))}
      </select>
    </label>
  );
}

export function MapStep() {
  const [s, setS] = useScenario("map");
  const sites = useMemo(() => sitesFor(s.owner).map((site) => ({ site, mw: mwAt(site, s.at) })), [s.owner, s.at]);
  const totals = useMemo(() => byState(s.at, s.owner), [s.at, s.owner]);
  const total = totals.size ? [...totals.values()].reduce((a, t) => a + t.mw, 0) : 0;
  const live = sites.filter((x) => x.mw > 0);
  const plannedTotal = sites.reduce((a, x) => a + planned(x.site).mw, 0);
  const topStates = [...totals.values()].sort((a, b) => b.mw - a.mw).slice(0, 8);
  const owners = byOwner(s.at).filter((o) => o.mw > 0);
  const ownerMax = Math.max(1, ...owners.map((o) => o.mw));
  const dates = quarterDates();
  const focus = s.state ? sites.filter((x) => x.site.state === s.state).sort((a, b) => b.mw - a.mw || planned(b.site).mw - planned(a.site).mw) : [];

  return (
    <Frame route="map" s={s}>
      <StepHeading route="map">
        Every US frontier AI data center Epoch AI tracks, with the power each draws over time. Slide the date to watch the build-out arrive.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label={`AI power, ${s.at === RETRIEVED ? "today" : formatMonth(s.at)}`} value={formatMw(total)} sub="facility power, from the grid" />
            <Stat label="Sites drawing power" value={live.length} sub={`of ${sites.length} tracked`} />
            <Stat label="States" value={totals.size} />
            <Stat label="Planned, all sites" value={formatMw(plannedTotal)} sub="when every timeline completes" />
          </div>
          <div className="mt-6">
            <UsMap date={s.at} sites={sites} totals={totals} selected={s.state} onSelect={(code) => setS({ ...s, state: code })} />
          </div>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <Kicker>View</Kicker>
            <div className="mt-3 grid gap-5">
              <DatePicker s={s} setS={setS} />
              <div>
                <span className="block text-sm font-medium">Owner</span>
                <div className="mt-2">
                  <Pills options={OWNER_OPTIONS} value={s.owner} onChange={(owner) => setS({ ...s, owner })} label="Owner" />
                </div>
              </div>
              <StateSelect s={s} setS={setS} />
            </div>
          </Card>
          {s.state ? (
            <Card>
              <Kicker>{stateName(s.state)}</Kicker>
              <p className="mt-2 font-mono text-2xl font-semibold">{formatMw(totals.get(s.state)?.mw ?? 0)}</p>
              <p className="text-xs text-muted">AI power on {formatMonth(s.at)}</p>
              {focus.length ? (
                <ul className="mt-3 divide-y divide-line text-sm">
                  {focus.map((x) => (
                    <li key={x.site.name} className="flex justify-between gap-3 py-2">
                      <span>
                        <span className="block font-medium">{x.site.name}</span>
                        <span className="text-xs text-muted">{ownerLabel(x.site.owner)}</span>
                      </span>
                      <span className="shrink-0 text-right font-mono text-xs">
                        {x.mw > 0 ? formatMw(x.mw) : "announced"}
                        <span className="block text-muted">→ {formatMw(planned(x.site).mw)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ink-2">No tracked AI sites here{s.owner !== "all" ? ` for ${ownerLabel(s.owner)}` : ""}.</p>
              )}
              <a href={href("grid", s)} onClick={linkClick(href("grid", s))} className="mt-3 inline-block text-sm font-semibold text-brand-ink underline underline-offset-2">
                See its power price and grid wait
              </a>
            </Card>
          ) : (
            <Card>
              <Kicker>Biggest states</Kicker>
              <ul className="mt-3 space-y-2 text-sm">
                {topStates.map((t) => (
                  <li key={t.code}>
                    <button type="button" onClick={() => setS({ ...s, state: t.code })} className="flex w-full items-baseline justify-between gap-3 text-left hover:text-brand-ink">
                      <span>{stateName(t.code)}</span>
                      <span className="font-mono text-xs">
                        {formatMw(t.mw)} · {t.sites} site{t.sites === 1 ? "" : "s"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <Kicker>Who owns the power, {s.at === RETRIEVED ? "today" : formatMonth(s.at)}</Kicker>
          <ul className="mt-4 space-y-2.5">
            {owners.map((o) => (
              <li key={o.owner} className="grid grid-cols-[7.5rem_1fr_4.5rem] items-center gap-3 text-sm">
                <span className="truncate">{ownerLabel(o.owner)}</span>
                <span className="h-3 overflow-hidden rounded-full bg-sunken">
                  <span className="glide block h-full rounded-full" style={{ width: `${(o.mw / ownerMax) * 100}%`, background: s.owner === o.owner ? "var(--site)" : "var(--peri)" }} />
                </span>
                <span className="text-right font-mono text-xs">{formatMw(o.mw)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Owner as Epoch AI records it; sites without one are named for their developer (QTS, STACK and so on).</p>
        </Card>
        <Card>
          <LineChart
            title="AI power online over time"
            xLabels={dates.map(formatMonth)}
            series={[
              { label: "All owners", color: "var(--amber)", values: dates.map((d) => totalMw(d)) },
              ...(s.owner !== "all" ? [{ label: ownerLabel(s.owner), color: "var(--peri)", values: dates.map((d) => totalMw(d, s.owner)) }] : []),
            ]}
            format={(v) => formatMw(v)}
            ariaLabel="Total facility power of US AI data centers by quarter, 2023 to 2029"
            tableEvery={1}
          />
          <p className="mt-3 text-xs text-muted">Future quarters follow each site's announced timeline; projects can slip or be cancelled.</p>
        </Card>
      </div>
    </Frame>
  );
}
