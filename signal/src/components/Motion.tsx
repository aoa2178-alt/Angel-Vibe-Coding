import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/** Macro Brief Motion Library timing: an animation style for a keyframe, duration, delay and easing (see styles.css). */
export const anim = (name: string, ms: number, delay = 0, ease: "out" | "back" | "std" = "out"): CSSProperties => ({
  animation: `mb-${name} ${ms}ms var(--ease-${ease}) ${delay}ms both`,
});

/** Headline Word Cascade: each word rises out of a mask, 80 ms apart. */
export function Cascade({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span className="mb-mask">
            <span style={anim("riseMask", 750, delay + i * 80, "back")}>{w}</span>
          </span>{" "}
        </span>
      ))}
    </>
  );
}

/** A small "Replay" button for an animated chart. */
export function Replay({ onClick, label = "Replay" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs font-medium text-muted underline-offset-2 hover:text-ink hover:underline print:hidden">
      <RotateCcw className="size-3" aria-hidden /> {label}
    </button>
  );
}

/** Pause a section's animations until it scrolls into view: put ref on the wrapper and className={paused}. */
export function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") return setSeen(true);
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setSeen(true), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return { ref, paused: seen ? "" : "mb-paused" };
}
