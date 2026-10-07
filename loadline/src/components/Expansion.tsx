import { Card } from "./ui";
import { expansion, type ExpansionSettings } from "@/lib/expansion";
import { formatMoney, type Campus } from "@/lib/model";
import type { Scenario } from "@/lib/scenario";

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Step 2's "Build it all now, or phase it?": a capacity-expansion decision tree (the Du Pont question). */
export function Expansion({ s, setS, campus }: { s: Scenario; setS: (s: Scenario) => void; campus: Campus }) {
  const e = s.expansion;
  const set = (patch: Partial<ExpansionSettings>) => setS({ ...s, expansion: { ...e, ...patch } });
  const r = expansion(campus, s.settings, e);
  if (!r.applies) return null;
  const nowWins = r.advantage > 0;
  const later = campus.phases.slice(1).map((p) => p.name.toLowerCase()).join(" and ");
  const rows = [
    { id: "phased", label: "Phase it (wait and see)", o: r.phased },
    { id: "now", label: "Build it all now", o: r.allNow },
  ];
  const max = Math.max(...rows.flatMap((x) => [Math.abs(x.o.strong), Math.abs(x.o.weak), Math.abs(x.o.expected)]), 1);
  const bar = (v: number, strong: boolean) => (
    <div className="relative h-2.5 rounded-[3px] bg-sunken">
      <div
        className="glide absolute top-0 h-full rounded-[3px]"
        style={{
          left: v >= 0 ? "50%" : `${50 - (Math.abs(v) / max) * 50}%`,
          width: `${(Math.abs(v) / max) * 50}%`,
          background: v >= 0 ? "var(--brand)" : "var(--risk)",
          opacity: strong ? 1 : 0.55,
        }}
      />
      <div className="absolute inset-y-0 left-1/2 w-px bg-ink-2/40" />
    </div>
  );

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="kicker">Capacity strategy</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">Build it all now, or phase it?</h2>
        </div>
        <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">Capacity expansion · decision tree</span>
      </div>
      <p className="mt-3 text-[15px] leading-7 text-ink-2">
        Starting {later} alongside phase 1 brings that capacity live about {Math.round(r.monthsEarlier)} months sooner and {pct(e.scaleSaving)} cheaper
        per MW. That's the case for building ahead, and for getting there before a competitor does. But if demand turns out weak, only{" "}
        {pct(e.weakShare)} of it gets used, while phasing would have built only what was needed.
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="grid gap-4">
          {rows.map((row) => {
            const winner = (row.id === "now") === nowWins;
            return (
              <div key={row.id} className={`rounded-xl border p-4 ${winner ? "border-brand" : "border-line"}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">
                    {row.label}
                    {winner && <span className="ml-2 rounded-full bg-brand px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-on-brand">better bet</span>}
                  </p>
                  <p className="font-mono text-sm">
                    expected <span className="font-semibold">{formatMoney(row.o.expected)}</span>
                  </p>
                </div>
                <div className="mt-3 grid gap-2 text-xs">
                  {(
                    [
                      ["Strong demand", row.o.strong, true],
                      ["Weak demand", row.o.weak, false],
                    ] as const
                  ).map(([label, v, strong]) => (
                    <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)_4.5rem] items-center gap-2">
                      <span className="text-ink-2">{label}</span>
                      {bar(v, strong)}
                      <span className="text-right font-mono">{formatMoney(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid content-start gap-4">
          <label className="block">
            <span className="flex items-baseline justify-between text-sm font-medium">
              Chance demand is strong <span className="font-mono text-brand-ink">{pct(e.pStrong)}</span>
            </span>
            <input type="range" min={0} max={100} value={Math.round(e.pStrong * 100)} onChange={(ev) => set({ pStrong: Number(ev.target.value) / 100 })} className="mt-2 w-full" />
          </label>
          <label className="block">
            <span className="flex items-baseline justify-between text-sm font-medium">
              Used if demand is weak <span className="font-mono text-brand-ink">{pct(e.weakShare)}</span>
            </span>
            <input type="range" min={0} max={100} value={Math.round(e.weakShare * 100)} onChange={(ev) => set({ weakShare: Number(ev.target.value) / 100 })} className="mt-2 w-full" />
          </label>
          <label className="block">
            <span className="flex items-baseline justify-between text-sm font-medium">
              Saving from building in one go <span className="font-mono text-brand-ink">{pct(e.scaleSaving)}</span>
            </span>
            <input type="range" min={0} max={30} value={Math.round(e.scaleSaving * 100)} onChange={(ev) => set({ scaleSaving: Number(ev.target.value) / 100 })} className="mt-2 w-full" />
          </label>
        </div>
      </div>

      <p className="mt-5 rounded-xl bg-brand-soft p-4 text-sm leading-6 text-ink">
        {nowWins ? "Build it all now" : "Phase it"}: worth {formatMoney(Math.abs(r.advantage))} more in expectation.{" "}
        {r.breakEvenP !== null
          ? `Building now wins once the chance of strong demand passes ${pct(r.breakEvenP)}. A signed anchor tenant is what pushes it there.`
          : nowWins
            ? "Building now wins whatever the chance of strong demand."
            : "Phasing wins whatever the chance of strong demand."}
      </p>
      <p className="mt-3 text-xs leading-5 text-muted">
        Net present value of the later phases over {e.horizonYears} years at the {pct(s.settings.costOfCapital)} cost of capital, valued as leased capacity
        (${s.settings.leasePerKwMonth}/kW-month) against the build cost, before operating costs. Phase 1 is the same either way, so it's left out. Illustrative.
      </p>
    </Card>
  );
}
