import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Read text aloud with the browser's built-in voice. Hidden where the browser can't speak. */
export function SpeakButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  if (!supported) return null;

  function speak(event: React.MouseEvent) {
    // Speaker buttons sit inside clickable cards; don't flip or open the card.
    event.stopPropagation();
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[“”"]/g, ""));
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    const voice = synth.getVoices().find((v) => v.lang === "en-US");
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      title={label}
      onClick={speak}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          speak(event as unknown as React.MouseEvent);
        }
      }}
      className={cn(
        "nc-press inline-grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-surface text-sm shadow-sm transition hover:border-signal hover:bg-signal/15",
        speaking && "border-signal bg-signal/25",
        className,
      )}
    >
      <span aria-hidden>{speaking ? "🔊" : "🔈"}</span>
    </span>
  );
}
