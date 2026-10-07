import { maxOwnedGpus, type Assumptions } from "@/lib/tco";

/** Facility power you have for your own servers. 0 means no limit; above the cap, extra GPUs are rented. */
export function PowerBudget({ kw, assumptions, onChange }: { kw: number; assumptions: Assumptions; onChange: (kw: number) => void }) {
  const max = maxOwnedGpus(assumptions);
  const choices = [0, 25, 50, 100];
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor="power-kw" className="text-sm font-medium">
          Power you can get for owned GPUs
        </label>
        <span className="font-mono text-sm text-brand-ink">{kw > 0 ? `up to ${max} GPUs` : "No limit"}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="grid flex-1 grid-cols-4 gap-1.5" role="group" aria-label="Power budget presets">
          {choices.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={kw === c}
              onClick={() => onChange(c)}
              className={`whitespace-nowrap rounded-lg border px-1 py-1.5 font-mono text-xs transition ${kw === c ? "border-brand bg-brand text-white" : "border-line bg-bg hover:border-brand"}`}
            >
              {c === 0 ? "None" : `${c} kW`}
            </button>
          ))}
        </div>
        <input
          id="power-kw"
          type="number"
          min={0}
          step={5}
          value={kw || ""}
          placeholder="kW"
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(Number.isFinite(v) && v > 0 ? v : 0);
          }}
          className="w-20 rounded-lg border border-line bg-bg px-2 py-1 text-right font-mono text-sm"
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        Like the size of a colocation cage. Above it, extra GPUs are rented, so owning becomes a hybrid. This changes the step 2 answer.
      </p>
    </div>
  );
}
