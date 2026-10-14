import { Info, Square, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GLOSSARY, type TermId } from "@/lib/glossary";

/** Rewrites short forms so the voice says them naturally: "2B" → "2 billion", "$11K" → "$11 thousand", "GPU" → "G P U". */
export function forSpeech(text: string) {
  return text
    .replace(/(\d+(?:\.\d+)?)B\b/g, "$1 billion")
    .replace(/(\d+(?:\.\d+)?)M\b/g, "$1 million")
    .replace(/(\d+(?:\.\d+)?)K\b/g, "$1 thousand")
    .replace(/\bGPUs\b/g, "G P Us")
    .replace(/\bGPU\b/g, "G P U")
    .replace(/\bAPI\b/g, "A P I")
    .replace(/\bROI\b/g, "R O I");
}

/** Read text aloud with the browser's own voice. Returns false where the browser can't speak. */
export function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(forSpeech(text));
  u.lang = "en-US";
  u.rate = 0.95;
  if (onEnd) {
    u.onend = onEnd;
    u.onerror = onEnd;
  }
  synth.speak(u);
  return true;
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * ⓘ next to a term: opens a plain-English meaning, with a button to hear it. `onDark` for use on the dark result panels.
 */
export function Explain({ id, onDark = false }: { id: TermId; onDark?: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const entry = GLOSSARY[id];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <span ref={box} className="relative inline-block align-middle normal-case tracking-normal">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-label={`What does "${entry.term}" mean?`}
        className={`ml-1 inline-grid size-4 place-items-center rounded-full transition ${onDark ? "text-white/70 hover:text-white" : "text-muted hover:text-brand-ink"}`}
      >
        <Info className="size-3.5" aria-hidden />
      </button>
      {open && (
        <span
          role="dialog"
          aria-label={entry.term}
          className="absolute left-1/2 top-6 z-50 block w-64 -translate-x-1/2 rounded-xl border border-line bg-surface p-3 text-left text-xs font-normal leading-5 text-ink shadow-[0_12px_32px_rgb(23_32_39/0.18)]"
        >
          <span className="flex items-start justify-between gap-2">
            <strong className="text-[13px]">{entry.term}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-muted hover:text-ink">
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
          <span className="mt-1 block text-ink-2">{entry.plain}</span>
          {canSpeak() && (
            <button type="button" onClick={() => speak(`${entry.term}. ${entry.plain}`)} className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-ink hover:underline">
              <Volume2 className="size-3.5" aria-hidden /> Read it to me
            </button>
          )}
        </span>
      )}
    </span>
  );
}

/** "Read this step to me": speaks the step's answer in plain English; press again to stop. */
export function ReadAloud({ text, label = "Read this step to me" }: { text: string; label?: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(canSpeak());
    return () => {
      if (canSpeak()) window.speechSynthesis.cancel();
    };
  }, []);
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (speaking) {
          window.speechSynthesis.cancel();
          setSpeaking(false);
        } else if (speak(text, () => setSpeaking(false))) setSpeaking(true);
      }}
      aria-pressed={speaking}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 transition hover:border-brand hover:text-ink print:hidden"
    >
      {speaking ? <Square className="size-3.5" aria-hidden /> : <Volume2 className="size-3.5" aria-hidden />}
      {speaking ? "Stop reading" : label}
    </button>
  );
}
