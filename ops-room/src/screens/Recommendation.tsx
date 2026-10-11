import { Send } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Card, Eyebrow, cx } from "@/components/ui";
import type { TimelineEntry } from "@/engine/engine";
import type { Scenario } from "@/engine/types";

export function Recommendation({
  scenario,
  timeline,
  memo,
  onChange,
  onSubmit,
}: {
  scenario: Scenario;
  timeline: TimelineEntry[];
  memo: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  onSubmit: () => void;
}) {
  const [attempted, setAttempted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { fields } = scenario.memo;
  const recipient = scenario.memo.to.split(" ")[0];
  const tooShort = (id: string, min: number) => (memo[id] ?? "").trim().length < min;
  const missing = fields.filter((f) => tooShort(f.id, f.minLength));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (missing.length) {
      formRef.current?.querySelector<HTMLElement>(`#memo-${missing[0].id}`)?.focus();
      return;
    }
    onSubmit();
  };

  return (
    <div className="grid gap-8">
      <div className="animate-rise">
        <Eyebrow>Executive recommendation</Eyebrow>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">Write it up for {recipient}.</h1>
        <p className="mt-3 text-ink-2">{scenario.memo.intro}</p>
      </div>

      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Your calls so far</p>
        <ol className="mt-2 grid gap-1.5">
          {timeline.map((t) => (
            <li key={t.decision.id} className="text-sm text-ink-2">
              <span className="font-semibold text-ink">{t.option.label}:</span> {t.option.outcome.headline}
            </li>
          ))}
        </ol>
      </Card>

      <form ref={formRef} onSubmit={submit} noValidate>
        <Card className="overflow-hidden">
          <div className="grid gap-1 border-b border-line bg-panel-2/50 px-4 py-3 text-sm sm:px-6">
            <p>
              <span className="inline-block w-16 text-muted">To</span>
              {scenario.memo.to}
            </p>
            <p>
              <span className="inline-block w-16 text-muted">From</span>
              You, {scenario.role}
            </p>
            <p>
              <span className="inline-block w-16 text-muted">Re</span>
              {scenario.memo.subject}
            </p>
          </div>

          <div className="grid gap-6 p-4 sm:p-6">
            {fields.map((f) => {
              const value = memo[f.id] ?? "";
              const invalid = attempted && tooShort(f.id, f.minLength);
              const inputClass = cx(
                "w-full rounded-xl border bg-bg/60 px-3.5 py-3 text-[15px] text-ink placeholder:text-muted/80 transition",
                "focus:outline-none focus:ring-2 focus:ring-accent/60",
                invalid ? "border-bad" : "border-line focus:border-accent",
              );
              const describedBy = `memo-${f.id}-hint`;
              return (
                <div key={f.id}>
                  <label htmlFor={`memo-${f.id}`} className="text-sm font-semibold">
                    {f.label}
                  </label>
                  <div className="mt-2">
                    {f.multiline ? (
                      <textarea
                        id={`memo-${f.id}`}
                        rows={3}
                        value={value}
                        onChange={(e) => onChange(f.id, e.target.value)}
                        placeholder={f.placeholder}
                        aria-invalid={invalid}
                        aria-describedby={describedBy}
                        className={cx(inputClass, "min-h-24 resize-y")}
                      />
                    ) : (
                      <input
                        id={`memo-${f.id}`}
                        value={value}
                        onChange={(e) => onChange(f.id, e.target.value)}
                        placeholder={f.placeholder}
                        aria-invalid={invalid}
                        aria-describedby={describedBy}
                        className={inputClass}
                      />
                    )}
                  </div>
                  {f.suggestions && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {f.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => onChange(f.id, value.trim() ? `${s}: ${value.replace(/^[^:]*:\s*/, "")}` : `${s}: `)}
                          className="rounded-full border border-line bg-panel-2 px-2.5 py-1 text-xs text-ink-2 transition hover:border-accent hover:text-ink"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <p id={describedBy} className={cx("mt-1.5 text-xs", invalid ? "text-bad" : "text-muted")}>
                    {invalid
                      ? `Add a bit more. At least ${f.minLength} characters.`
                      : `${value.trim().length} characters${value.trim().length < f.minLength ? ` · ${f.minLength} minimum` : ""}`}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-muted">
              Your note isn't scored. The debrief shows it back to you with a checklist for your path.
            </p>
            <Button type="submit" className="w-full shrink-0 sm:w-auto">
              <Send className="size-4" aria-hidden />
              Send to {recipient}
            </Button>
          </div>
          {attempted && missing.length > 0 && (
            <p role="alert" className="border-t border-line bg-bad/10 px-4 py-3 text-sm text-bad sm:px-6">
              {missing.length === 1 ? "One section needs" : `${missing.length} sections need`} more detail before you send.
            </p>
          )}
        </Card>
      </form>
    </div>
  );
}
