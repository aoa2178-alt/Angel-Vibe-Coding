import { useState } from "react";
import { endingsOf } from "@/engine/paths";
import { clearEndings, loadEndings } from "@/engine/storage";
import type { Scenario } from "@/engine/types";

/**
 * Every ending as a slot, case by case. Endings this browser has reached show their title; the rest stay blank, so you
 * can see how many are left without spoiling them.
 */
export function EndingsShelf({ scenarios }: { scenarios: Scenario[] }) {
  const [found, setFound] = useState(loadEndings);
  const cases = scenarios.map((s) => ({ s, endings: endingsOf(s), mine: found[s.id] ?? [] }));
  const total = cases.reduce((n, c) => n + c.endings.length, 0);
  const got = cases.reduce((n, c) => n + c.endings.filter((e) => c.mine.includes(e)).length, 0);

  return (
    <section id="endings" className="mt-12 scroll-mt-20" aria-label="Your endings">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Your endings</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="mt-2 font-serif text-3xl font-extrabold tracking-tight sm:text-4xl">Every road you've taken.</h2>
        <p className="font-mono text-[13px] text-muted">
          <b className="text-[22px] text-ink">{got}</b> of {total} found
          {got > 0 && (
            <button
              type="button"
              onClick={() => {
                clearEndings();
                setFound({});
              }}
              className="ml-3 text-xs text-muted underline underline-offset-2 transition hover:text-ink"
            >
              Reset
            </button>
          )}
        </p>
      </div>
      <div className="mt-4">
        {cases.map(({ s, endings, mine }, i) => (
          <div key={s.id} className="grid gap-4 border-t border-line py-4 sm:grid-cols-[210px_1fr]">
            <div>
              <p className="font-mono text-[11px] text-muted">CASE {String(i + 1).padStart(2, "0")}</p>
              <h3 className="font-serif text-[17px] font-extrabold leading-tight">{s.title}</h3>
              <p className="font-mono text-[11px] text-muted">
                {endings.filter((e) => mine.includes(e)).length} of {endings.length} found
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
              {endings.map((e, k) =>
                mine.includes(e) ? (
                  <li key={e} className="min-h-[58px] rounded-lg border border-accent bg-panel px-2.5 py-2 text-xs leading-snug shadow-[inset_0_3px_0_var(--color-accent)]">
                    <span className="mb-0.5 block font-mono text-[9.5px] tracking-[0.12em] text-accent">ENDING {k + 1}</span>
                    {e}
                  </li>
                ) : (
                  <li key={e} className="grid min-h-[58px] place-items-center rounded-lg border border-dashed border-line-strong font-mono text-[11px] text-[#a9a59c]">
                    Not found yet
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Remembered in this browser only. Play a case again and choose differently to find the rest.</p>
    </section>
  );
}
