import { useEffect, useRef, useState } from "react";

const GLYPHS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ#$%&";

/**
 * Text that "decodes" into place the first time it scrolls into view: letters and digits scramble, then settle
 * left to right in about 0.6 seconds. Punctuation and spaces stay put. Screen readers and people who prefer
 * reduced motion get the plain text.
 */
export function Decode({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(text);

  useEffect(() => {
    setShown(text);
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = () => {
          const p = Math.min(1, (performance.now() - start) / 650);
          const settled = Math.floor(p * text.length);
          setShown(
            [...text]
              .map((ch, i) => (i < settled || !/[A-Za-z0-9]/.test(ch) ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
              .join(""),
          );
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{shown}</span>
    </span>
  );
}
