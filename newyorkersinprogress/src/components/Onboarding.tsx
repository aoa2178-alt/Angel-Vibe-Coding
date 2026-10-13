import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BOROUGHS, LOVES, REASONS, WORKS, type BoroughId, type LoveId, type Prefs, type ReasonId, type WorkId } from "@/lib/personalize";
import { checkNickname, suggestNickname } from "@/lib/nickname";

type Choice = { id: string; label: string; emoji: string };

const STEPS = [
  { title: "What brings you to New York?", sub: "Pick one. We'll start you on what matters most." },
  { title: "Where's home base?", sub: "We'll put places near you first." },
  { title: "What do you do?", sub: "Your day shapes which city skills come first." },
  { title: "What do you love?", sub: "Pick as many as you like. We'll shape your city around them." },
  { title: "Pick a league nickname", sub: "It's the only thing other players see on the weekly leaderboard." },
] as const;

/**
 * "Make it yours": five quick screens of tap-to-pick bubbles. Every screen can be skipped, and the
 * standard app is one tap away. Saving and the nickname check happen in the parent (onFinish).
 */
export function Onboarding({
  initial,
  initialNickname,
  editing,
  startAt = 0,
  onFinish,
  onSkip,
  onReset,
}: {
  initial: Prefs | null;
  initialNickname: string | null;
  editing: boolean;
  startAt?: number;
  onFinish: (prefs: Prefs, nickname: string) => Promise<string | null>;
  onSkip: () => void;
  onReset?: () => void;
}) {
  const [step, setStep] = useState(startAt);
  const [reason, setReason] = useState<ReasonId | undefined>(initial?.reason);
  const [borough, setBorough] = useState<BoroughId | undefined>(initial?.borough);
  const [work, setWork] = useState<WorkId | undefined>(initial?.work);
  const [loves, setLoves] = useState<LoveId[]>(initial?.loves ?? []);
  const [nickname, setNickname] = useState(initialNickname ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialNickname) setNickname(suggestNickname());
  }, [initialNickname]);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>("h2")?.focus();
  }, [step]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onSkip();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onSkip]);

  const last = step === STEPS.length - 1;

  async function next() {
    if (!last) {
      setStep((s) => s + 1);
      return;
    }
    const checked = checkNickname(nickname);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setBusy(true);
    const problem = await onFinish({ reason, borough, work, loves }, checked.value);
    setBusy(false);
    if (problem) setError(problem);
  }

  function bubbles(list: readonly Choice[], isOn: (id: string) => boolean, toggle: (id: string) => void, multi = false) {
    return (
      <div role="group" aria-label={STEPS[step]!.title} className="mt-6 flex flex-wrap gap-3">
        {list.map((choice) => {
          const on = isOn(choice.id);
          return (
            <button
              key={choice.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(choice.id)}
              className={cn(
                "nc-press grid size-[88px] place-items-center rounded-full p-2 text-center text-[12px] font-bold leading-tight transition duration-200 hover:scale-105 sm:size-[104px] sm:text-[13px]",
                on ? "bg-signal text-signal-foreground shadow-[inset_0_0_0_3px_#fff]" : "bg-[#2a2a2a] text-[#ddd] hover:bg-[#333]",
              )}
            >
              <span>
                <span aria-hidden className="mb-0.5 block text-2xl sm:text-[26px]">{choice.emoji}</span>
                {choice.label}
              </span>
            </button>
          );
        })}
        {multi && <span className="sr-only">{loves.length} picked</span>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#141414] text-white" role="dialog" aria-modal="true" aria-label="Make it yours">
      <div ref={dialogRef} className="mx-auto flex min-h-full max-w-2xl flex-col px-5 py-6 sm:px-8 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#999]">
            {editing ? "Your picks" : "Make it yours"} · {step + 1} of {STEPS.length}
          </p>
          <button type="button" onClick={onSkip} className="text-sm text-[#aaa] hover:text-white">
            {editing ? "Close" : "Use the standard app"}
          </button>
        </div>
        <div className="mt-4 flex gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-signal" : "bg-[#333]")} />
          ))}
        </div>

        <div key={step} className="nc-rise mt-8">
          <h2 tabIndex={-1} className="font-display text-3xl font-bold outline-none sm:text-4xl">{STEPS[step]!.title}</h2>
          <p className="mt-2 text-[#aaa]">{STEPS[step]!.sub}</p>

          {step === 0 && bubbles(REASONS, (id) => reason === id, (id) => setReason(reason === id ? undefined : (id as ReasonId)))}
          {step === 1 && bubbles(BOROUGHS, (id) => borough === id, (id) => setBorough(borough === id ? undefined : (id as BoroughId)))}
          {step === 2 && bubbles(WORKS, (id) => work === id, (id) => setWork(work === id ? undefined : (id as WorkId)))}
          {step === 3 &&
            bubbles(
              LOVES,
              (id) => loves.includes(id as LoveId),
              (id) => setLoves((l) => (l.includes(id as LoveId) ? l.filter((x) => x !== id) : [...l, id as LoveId])),
              true,
            )}
          {step === 4 && (
            <div className="mt-6">
              <label htmlFor="nickname" className="text-sm font-semibold text-[#ccc]">Nickname</label>
              <div className="mt-2 flex gap-2">
                <input
                  id="nickname"
                  value={nickname}
                  maxLength={20}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setError("");
                  }}
                  className="min-w-0 flex-1 rounded-full border border-[#333] bg-[#1f1f1f] px-5 py-3 text-lg font-bold text-white outline-none focus:border-signal"
                />
                <button
                  type="button"
                  onClick={() => {
                    setNickname(suggestNickname());
                    setError("");
                  }}
                  className="nc-press rounded-full bg-[#2a2a2a] px-4 text-sm font-semibold text-[#ddd] hover:bg-[#333]"
                  aria-label="Suggest another nickname"
                >
                  🎲 Shuffle
                </button>
              </div>
              <p role="status" className={cn("mt-2 text-sm", error ? "text-[#ff8a80]" : "text-[#888]")}>
                {error || "3–20 letters, numbers or spaces. You can hide yourself from the league anytime."}
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="text-sm font-semibold text-[#aaa] hover:text-white">
                ← Back
              </button>
            )}
            {!last && (
              <button type="button" onClick={() => setStep((s) => s + 1)} className="text-sm text-[#888] hover:text-white">
                Skip this one
              </button>
            )}
            {editing && onReset && (
              <button type="button" onClick={onReset} className="text-sm text-[#ff8a80] hover:text-white">
                Reset my picks
              </button>
            )}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={next}
            className="nc-press rounded-full bg-white px-7 py-3 font-display text-sm font-bold text-[#111] transition hover:bg-signal disabled:opacity-60"
          >
            {busy ? "Saving…" : last ? "Make it mine" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
