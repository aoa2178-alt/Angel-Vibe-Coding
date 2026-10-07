import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import { OPTIONS } from "./options";
import { joinLabels, months, percent } from "./ui";
import { advantages } from "@/lib/scorecard";
import { landingPlan, type Call } from "@/lib/call";
import { CURRENTS, type Current, type Plan } from "@/lib/plan";
import { formatTokensM, formatUsd } from "@/lib/tco";

/** "Rent cloud GPUs" → "rent cloud GPUs" (acronyms keep their capitals). */
const lowerFirst = (t: string) => (/^[A-Z]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));

function Block({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <p className="kicker">
        {n} · {title}
      </p>
      <div className="mt-3 text-[15px] leading-7 text-ink-2">{children}</div>
    </section>
  );
}

/** 1 · The recommendation, answer first, with its value versus today's setup and versus doing the work by hand. */
export function CallRecommendation({ call, plan, setPlan }: { call: Call; plan: Plan; setPlan: (p: Plan) => void }) {
  const { costs, recommended, cheapestId, card, split, r, product, versusToday, current } = call;
  const rec = costs[recommended];
  const currentLabel = CURRENTS.find((c) => c.id === current)?.label;
  return (
    <section className={`theme-${recommended} win-border mt-6 rounded-2xl border-2 p-5 sm:p-6`}>
      <p className="kicker">1 · My recommendation</p>
      <p className="mt-2 flex items-start gap-2.5 text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl">
        <span className={`mt-2 size-3.5 shrink-0 rounded-full ${OPTIONS[recommended].swatch}`} aria-hidden />
        <span>
          {OPTIONS[recommended].name}: {formatUsd(rec.monthly)} a month, {formatUsd(rec.perM, 2)} per million tokens.
        </span>
      </p>
      <ul className="mt-4 space-y-2 text-[15px] leading-7 text-ink-2">
        <li>
          <span className="font-semibold text-ink">Versus today:</span>{" "}
          {versusToday === null ? (
            current === "none" ? (
              "you're not using AI yet, so the value is the case below, not a switch."
            ) : current === "mix" ? (
              "you run a mix today; compare each workload's volume against the flip points below."
            ) : (
              <>
                <label htmlFor="now" className="sr-only">
                  How do you run AI today?
                </label>
                <select
                  id="now"
                  value=""
                  onChange={(e) => setPlan({ ...plan, current: e.target.value as Current })}
                  className="rounded-lg border border-line bg-surface px-2 py-1 text-sm"
                >
                  <option value="" disabled>
                    How do you run AI today?
                  </option>
                  {CURRENTS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>{" "}
                to see what switching is worth.
              </>
            )
          ) : versusToday > 1 ? (
            `you run on ${lowerFirst(currentLabel ?? "")} today. Switching saves about ${formatUsd(versusToday)} a year.`
          ) : versusToday < -1 ? (
            `you run on ${lowerFirst(currentLabel ?? "")} today, which is ${formatUsd(-versusToday)} a year cheaper; the recommendation costs more but scores higher on ${joinLabels(
              advantages(card, plan.weights, recommended, cheapestId).map((a) => a.label.toLowerCase()),
            )}.`
          ) : (
            `you already run on ${lowerFirst(currentLabel ?? "")}. Keep it, and revisit at the flip points below.`
          )}
          {current && (
            <button type="button" onClick={() => setPlan({ ...plan, current: undefined })} className="ml-2 text-xs font-medium text-brand-ink underline underline-offset-2 print:hidden">
              Change
            </button>
          )}
        </li>
        {split.best === "split" && (
          <li>
            <span className="font-semibold text-ink">Once volume is steady:</span> own the always-busy base ({split.base.gpus} GPUs) and rent the peaks. That beats either pure option by {formatUsd(split.flexibilityValue)} a month.
          </li>
        )}
        {r && (
          <li>
            <span className="font-semibold text-ink">Is it worth it:</span>{" "}
            {r.savings > 0
              ? `yes. AI saves ${formatUsd(r.savings)} a month against doing the work by hand and pays back its setup in ${months(r.paybackMonths!)}.`
              : `not at these numbers: AI costs ${formatUsd(-r.savings)} a month more than people do. Fix the success rate or review time before investing.`}
          </li>
        )}
        {product && (
          <li>
            <span className="font-semibold text-ink">Is it worth it:</span>{" "}
            {product.margin >= 0 ? `yes. The product clears ${formatUsd(product.margin)} a month after compute.` : `not yet: free users cost ${formatUsd(-product.margin)} a month more than paying users bring in.`}
          </li>
        )}
        {recommended !== cheapestId && (
          <li>
            <span className="font-semibold text-ink">Not the cheapest, on purpose:</span> {OPTIONS[cheapestId].name} would save {formatUsd(rec.monthly - costs[cheapestId].monthly)} a month, but your priorities weigh{" "}
            {joinLabels(advantages(card, plan.weights, recommended, cheapestId).map((a) => a.label.toLowerCase()))} more.
          </li>
        )}
      </ul>
    </section>
  );
}

/** 3 · What would change my mind: every flip point, as checks that hold or don't. */
export function CallChecks({ call, extra }: { call: Call; extra: string[] }) {
  const flips = [...call.volumeChecks, ...call.checks.filter((c) => !c.holds)];
  const holds = call.checks.filter((c) => c.holds).map((c) => c.label.replace(" 25% higher or lower", ""));
  return (
    <Block n={3} title="What would change my mind">
      {call.recommended !== call.cheapestId && (
        <p className="mb-2">These are cost checks. The cheapest option today is {lowerFirst(OPTIONS[call.cheapestId].name)}; the recommendation trades some cost for your priorities.</p>
      )}
      <ul className="space-y-2">
        {holds.length > 0 && (
          <li className="flex gap-2.5">
            <Check className="mt-1.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-label="Holds" />
            <span>
              The answer holds if any one of these is 25% higher or lower than assumed: {joinLabels(holds.map(lowerFirst))}.
            </span>
          </li>
        )}
        {flips.map((c) => (
          <li key={c.label} className="flex gap-2.5">
            {c.holds ? <Check className="mt-1.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-label="Holds" /> : <X className="mt-1.5 size-4 shrink-0 text-red-700 dark:text-red-400" aria-label="Changes the answer" />}
            <span>
              {c.label}: {c.holds ? "the answer holds." : <>the cheapest way becomes <span className="font-semibold text-ink">{lowerFirst(OPTIONS[c.instead!].name)}</span>.</>}
            </span>
          </li>
        ))}
        {extra.map((e) => (
          <li key={e} className="flex gap-2.5">
            <X className="mt-1.5 size-4 shrink-0 text-red-700 dark:text-red-400" aria-hidden />
            <span>{e}</span>
          </li>
        ))}
      </ul>
    </Block>
  );
}

/** 4 · How to land it: 30/60/90 days and the people side. */
export function CallLanding({ call }: { call: Call }) {
  return (
    <Block n={4} title="How to land it">
      <div className="grid gap-3 sm:grid-cols-3">
        {landingPlan(call.recommended).map((col) => (
          <div key={col.when} className="rounded-xl border border-line p-4">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-ink">{col.when}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6">
              {col.what.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3">
        <span className="font-semibold text-ink">The hard part is people, not technology.</span>{" "}
        {call.r && call.r.savings > 0
          ? `The budget moves from people to tokens: ${formatUsd(call.r.escalationCost + call.r.reviewCost)} a month stays on people who review and handle what the AI can't. Redesign those jobs before launch, and train reviewers on what good AI output looks like.`
          : "Whoever owns the workflow has to trust the output. Agree what the AI does alone, what a person checks, and who's accountable when it's wrong."}{" "}
        Owners: the business lead (value and adoption), finance (the budget and the switch triggers), engineering or a partner (running it).
      </p>
    </Block>
  );
}

/** 5 · How we'd know it worked. */
export function CallMeasures({ call, plan }: { call: Call; plan: Plan }) {
  const { costs, recommended, r, inputs, q } = call;
  const rows: [string, string, string][] = [["Cost per million tokens", "–", `≤ ${formatUsd(costs[recommended].perM, 2)}`]];
  if (r) {
    rows.push(["AI success rate (tasks solved without a person redoing them)", "–", `≥ ${percent(inputs.aiSuccess)}`]);
    rows.push(["Cost per task handled", formatUsd(r.humanCost / inputs.tasksPerMonth, 2), `≤ ${formatUsd(r.aiCost / inputs.tasksPerMonth, 2)}`]);
  }
  if (recommended !== "api") rows.push(["GPU utilization", "–", `≈ ${percent(plan.workload.utilization)}`]);
  rows.push(["Average wait for an answer", "–", `≤ ${plan.ops.waitTargetSec} s (modeled ${q.waitSec < 10 ? q.waitSec.toFixed(1) : Math.round(q.waitSec)} s)`]);
  rows.push(["Monthly volume", formatTokensM(plan.workload.tokensM), call.cross.apiUntilM || call.cross.ownFromM ? "re-check at the flip points" : "–"]);
  return (
    <Block n={5} title="How we'd know it worked">
      <div className="overflow-auto rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-sunken text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Measure</th>
              <th className="px-3 py-2 text-right font-medium">Today</th>
              <th className="px-3 py-2 text-right font-medium">Aim</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([m, t, a]) => (
              <tr key={m} className="border-t border-line">
                <td className="px-3 py-2">{m}</td>
                <td className="px-3 py-2 text-right font-mono">{t}</td>
                <td className="px-3 py-2 text-right font-mono">{a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">Value is measured per finished task, not tokens or time saved: a cheaper token that needs more human fixing is not a saving.</p>
    </Block>
  );
}

/** 6 · The judgment calls behind the answer. */
export function CallJudgment() {
  return (
    <Block n={6} title="My judgment calls">
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <span className="font-semibold text-ink">Like for like:</span> "rent" and "own" mean running an open-weight model of similar size. The strongest frontier models are API-only, so if quality matters most, the
          API may win regardless of cost.
        </li>
        <li>
          <span className="font-semibold text-ink">Prices that move:</span> API and GPU rental prices come from the tracker with their dates; GPU rents have fallen about a quarter a year, which favors renting and shortens
          the life of owned GPUs.
        </li>
        <li>
          <span className="font-semibold text-ink">Conservative throughput and a queueing model:</span> GPUs are sized so answers stay within the wait target, not just to average load. Running hotter looks cheaper on
          paper and slower in practice.
        </li>
        <li>
          <span className="font-semibold text-ink">Left out:</span> egress, taxes, the cost of switching, model-quality differences between options, and change-management costs. Each would narrow the gap between options.
        </li>
      </ul>
    </Block>
  );
}
