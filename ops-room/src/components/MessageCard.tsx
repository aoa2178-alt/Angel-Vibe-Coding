import type { Message, Person } from "@/engine/types";
import { cx } from "./ui";

const toneStyles: Record<Person["tone"], string> = {
  amber: "bg-tone-amber/15 text-tone-amber ring-tone-amber/30",
  sky: "bg-tone-sky/15 text-tone-sky ring-tone-sky/30",
  violet: "bg-tone-violet/15 text-tone-violet ring-tone-violet/30",
  emerald: "bg-tone-emerald/15 text-tone-emerald ring-tone-emerald/30",
  rose: "bg-tone-rose/15 text-tone-rose ring-tone-rose/30",
  slate: "bg-tone-slate/15 text-tone-slate ring-tone-slate/30",
};

export function MessageCard({ message, person, delay = 0 }: { message: Message; person?: Person; delay?: number }) {
  const who = person ?? { name: message.from, role: "", initials: "?", tone: "slate" as const };
  return (
    <article
      className="flex animate-rise gap-3 rounded-2xl border border-line bg-panel p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        aria-hidden
        className={cx("grid size-10 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold ring-1", toneStyles[who.tone])}
      >
        {who.initials}
      </div>
      <div className="min-w-0">
        <p className="text-sm leading-tight">
          <span className="font-semibold text-ink">{who.name}</span>
          {who.role && <span className="text-muted"> · {who.role}</span>}
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{message.body}</p>
      </div>
    </article>
  );
}

export function MessageList({ messages, people }: { messages: Message[]; people: Record<string, Person> }) {
  return (
    <div className="grid gap-3">
      {messages.map((m, i) => (
        <MessageCard key={i} message={m} person={people[m.from]} delay={i * 90} />
      ))}
    </div>
  );
}
