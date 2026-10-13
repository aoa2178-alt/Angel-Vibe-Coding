import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CHALLENGE_XP, type ChallengeItem } from "@/lib/challenge";
import { formatCountdown, msUntilNycMidnight } from "@/lib/streak";
import { SpeakButton } from "@/components/SpeakButton";

/** Today's one-question challenge. Answering (right or wrong) keeps the streak; a right answer earns XP once a day. */
export function DailyChallenge({
  item,
  done,
  streak,
  onAnswer,
}: {
  item: ChallengeItem;
  done: boolean;
  streak: number;
  onAnswer: (choice: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [left, setLeft] = useState<string>("");

  useEffect(() => {
    const tick = () => setLeft(formatCountdown(msUntilNycMidnight()));
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const answered = picked !== null;
  const correct = picked === item.answer;

  return (
    <section aria-labelledby="challenge-title" className="nc-rise relative overflow-hidden rounded-2xl border-2 border-foreground bg-surface p-5 shadow-[0_6px_0_var(--foreground)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Today's challenge · {item.source}</p>
        <span className="rounded-full bg-signal px-3 py-1 text-xs font-bold text-signal-foreground">+{CHALLENGE_XP} XP · keeps your 🔥</span>
      </div>

      {done && !answered ? (
        <div className="mt-4">
          <h2 id="challenge-title" className="text-xl font-semibold">Done for today ✅</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your streak is {streak} {streak === 1 ? "day" : "days"}. A new question unlocks in {left}.
          </p>
        </div>
      ) : (
        <>
          {item.context && <p className="mt-4 text-xs text-muted-foreground">{item.context}</p>}
          <div className="mt-2 flex items-start gap-3">
            <h2 id="challenge-title" className="flex-1 text-xl font-semibold leading-snug">{item.prompt}</h2>
            {item.say && <SpeakButton text={item.say} label="Hear it said" />}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {item.options.map((option, i) => {
              const state = !answered ? "idle" : i === item.answer ? "correct" : i === picked ? "wrong" : "dim";
              return (
                <button
                  key={option}
                  type="button"
                  disabled={answered}
                  onClick={() => {
                    setPicked(i);
                    onAnswer(i);
                  }}
                  className={cn(
                    "nc-press rounded-xl border border-border bg-surface-2 px-4 py-3 text-left text-sm transition",
                    state === "idle" && "hover:-translate-y-0.5 hover:border-signal/60",
                    state === "correct" && "nc-pop border-mint bg-mint/10 text-mint",
                    state === "wrong" && "border-destructive bg-destructive/10 text-destructive",
                    state === "dim" && "opacity-45",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {answered && (
            <div role="status" className="nc-rise mt-4 rounded-xl bg-surface-2 p-4">
              <p className="font-display text-sm font-semibold">
                {correct ? `Nice. +${CHALLENGE_XP} XP and your streak is safe.` : "Not quite, but your streak is safe."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{item.explain}</p>
              <p className="mt-2 text-xs text-muted-foreground">Come back tomorrow: a new question unlocks in {left}.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
