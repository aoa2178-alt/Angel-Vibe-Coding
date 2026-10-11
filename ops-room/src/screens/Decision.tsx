import { CircleCheck, CircleHelp, CircleMinus, CirclePlus, Lock } from "lucide-react";
import { useState } from "react";
import { MessageList } from "@/components/MessageCard";
import { Button, Eyebrow, SectionTitle, cx } from "@/components/ui";
import type { Decision as DecisionData, Option, Scenario } from "@/engine/types";

function OptionCard({
  option,
  letter,
  selected,
  onSelect,
}: {
  option: Option;
  letter: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const rows = [
    { icon: CirclePlus, label: "Benefit", text: option.benefit, color: "text-good" },
    { icon: CircleMinus, label: "Cost", text: option.cost, color: "text-bad" },
    { icon: CircleHelp, label: "Unknown", text: option.uncertainty, color: "text-alert" },
  ];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-labelledby={`opt-${option.id}`}
      aria-describedby={`opt-${option.id}-summary`}
      onClick={onSelect}
      className={cx(
        "group w-full rounded-2xl border p-4 text-left transition sm:p-5",
        selected
          ? "border-accent bg-accent/[0.07] shadow-[0_0_0_1px_var(--color-accent)]"
          : "border-line bg-panel hover:border-line-strong hover:bg-panel-2/60",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cx(
            "grid size-8 shrink-0 place-items-center rounded-lg font-mono text-sm font-semibold transition",
            selected ? "bg-accent text-accent-ink" : "bg-panel-2 text-ink-2 group-hover:text-ink",
          )}
          aria-hidden
        >
          {selected ? <CircleCheck className="size-4" /> : letter}
        </span>
        <div className="min-w-0 flex-1">
          <p id={`opt-${option.id}`} className="text-lg font-semibold leading-snug">{option.label}</p>
          <p id={`opt-${option.id}-summary`} className="mt-1 text-[15px] text-ink-2">{option.summary}</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-2.5 border-t border-line pt-4 sm:pl-11">
        {rows.map(({ icon: Icon, label, text, color }) => (
          <div key={label} className="grid grid-cols-[auto_1fr] gap-x-2.5">
            <Icon className={cx("mt-0.5 size-4", color)} aria-hidden />
            <div>
              <dt className={cx("inline text-xs font-semibold uppercase tracking-wider", color)}>{label}</dt>
              <dd className="text-sm text-ink-2">{text}</dd>
            </div>
          </div>
        ))}
      </dl>
    </button>
  );
}

export function Decision({
  scenario,
  decision,
  onCommit,
}: {
  scenario: Scenario;
  decision: DecisionData;
  onCommit: (optionId: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = decision.options.find((o) => o.id === selected);

  return (
    <div className="grid gap-8">
      <div className="animate-rise">
        <Eyebrow>{decision.step}</Eyebrow>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-balance sm:text-3xl">{decision.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2 sm:text-base">{decision.situation}</p>
      </div>

      {decision.messages.length > 0 && (
        <section>
          <SectionTitle>New messages</SectionTitle>
          <MessageList messages={decision.messages} people={scenario.people} />
        </section>
      )}

      <section aria-labelledby="decision-prompt">
        <h2 id="decision-prompt" className="text-xl font-semibold">
          {decision.prompt}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Pick one. You'll see what happened only after you commit.
        </p>
        <div role="radiogroup" aria-labelledby="decision-prompt" className="mt-4 grid gap-3">
          {decision.options.map((o, i) => (
            <OptionCard
              key={o.id}
              option={o}
              letter={String.fromCharCode(65 + i)}
              selected={o.id === selected}
              onSelect={() => setSelected(o.id)}
            />
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          <p className="text-sm text-muted sm:text-right" aria-live="polite">
            {chosen ? (
              <>
                Selected: <span className="font-semibold text-ink">{chosen.label}</span>
              </>
            ) : (
              "No option selected yet"
            )}
          </p>
          <Button disabled={!chosen} onClick={() => chosen && onCommit(chosen.id)} className="w-full sm:w-auto">
            <Lock className="size-4" aria-hidden />
            Commit decision
          </Button>
        </div>
      </div>
    </div>
  );
}
