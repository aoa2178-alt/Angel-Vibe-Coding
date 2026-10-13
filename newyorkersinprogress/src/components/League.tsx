import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatCountdown, msUntilWeekReset } from "@/lib/streak";

export type LeagueData = {
  weekStart: string;
  top: { nickname: string; weekXp: number; me: boolean }[];
  me: { nickname: string | null; onBoard: boolean; weekXp: number; rank: number | null };
};

const MEDALS = ["🥇", "🥈", "🥉"];

/** The weekly league: top 20 nicknames by XP earned since Monday, New York time. */
export function League({
  data,
  loading,
  onToggleBoard,
  onEditNickname,
  onStartChallenge,
}: {
  data: LeagueData | null;
  loading: boolean;
  onToggleBoard: (onBoard: boolean) => void;
  onEditNickname: () => void;
  onStartChallenge: () => void;
}) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => setLeft(formatCountdown(msUntilWeekReset()));
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const me = data?.me;
  const meInTop = data?.top.some((row) => row.me) ?? false;

  return (
    <section className="relative mx-auto max-w-3xl px-6 pb-16 pt-8">
      <div className="rounded-3xl bg-[#141414] p-5 text-white shadow-xl sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#999]">This week · resets in {left}</p>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">🏆 League</h1>
        <p className="mt-2 text-sm text-[#aaa]">XP earned since Monday. Everyone starts from zero each week.</p>

        {loading && !data ? (
          <p className="mt-8 text-sm text-[#999]">Loading this week's board…</p>
        ) : data && data.top.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-[#1f1f1f] p-5">
            <p className="font-semibold">Nobody's on the board yet this week.</p>
            <p className="mt-1 text-sm text-[#aaa]">Answer today's challenge or finish a lesson to take first place.</p>
            <button type="button" onClick={onStartChallenge} className="nc-press mt-4 rounded-full bg-signal px-5 py-2.5 text-sm font-bold text-signal-foreground">
              Go to today's challenge
            </button>
          </div>
        ) : (
          <ol className="mt-6 space-y-1.5">
            {data?.top.map((row, i) => (
              <li
                key={row.nickname}
                className={cn(
                  "grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl px-3.5 py-2.5",
                  row.me ? "bg-signal font-bold text-signal-foreground" : "bg-[#1f1f1f]",
                )}
              >
                <span className="text-center tabular-nums">{MEDALS[i] ?? i + 1}</span>
                <span className="truncate">{row.nickname}{row.me ? " (you)" : ""}</span>
                <span className={cn("text-sm tabular-nums", row.me ? "" : "text-[#999]")}>{row.weekXp} XP</span>
              </li>
            ))}
            {me && !meInTop && me.rank && (
              <li className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl bg-signal px-3.5 py-2.5 font-bold text-signal-foreground">
                <span className="text-center tabular-nums">{me.rank}</span>
                <span className="truncate">{me.nickname} (you)</span>
                <span className="text-sm tabular-nums">{me.weekXp} XP</span>
              </li>
            )}
          </ol>
        )}

        {me && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#2a2a2a] pt-5 text-sm">
            <div className="text-[#ccc]">
              {me.nickname ? (
                <>
                  Playing as <strong className="text-white">{me.nickname}</strong>{" "}
                  <button type="button" onClick={onEditNickname} className="ml-1 text-signal underline-offset-2 hover:underline">
                    Change
                  </button>
                </>
              ) : (
                <button type="button" onClick={onEditNickname} className="font-semibold text-signal hover:underline">
                  Pick a nickname to join the league →
                </button>
              )}
              {me.nickname && me.onBoard && !me.rank && <span className="block text-xs text-[#888]">Earn XP this week to show up on the board.</span>}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[#ccc]">
              <input
                type="checkbox"
                checked={me.onBoard}
                onChange={(e) => onToggleBoard(e.target.checked)}
                className="size-4 accent-[var(--signal)]"
              />
              Show me in the league
            </label>
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">Only nicknames and weekly XP are shown. Names and emails never appear.</p>
    </section>
  );
}
