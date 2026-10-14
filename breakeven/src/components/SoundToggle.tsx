import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { onSoundChange, setSound, soundOn } from "@/lib/sound";

/** Sound on / off for the calculators. Off by default; remembered on this browser. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(soundOn);
  useEffect(() => {
    const off = onSoundChange(setOn);
    return () => {
      off();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => setSound(!on)}
      aria-pressed={on}
      aria-label={on ? "Turn calculator sounds off" : "Turn calculator sounds on"}
      title={on ? "Sound on" : "Sound off"}
      className={`grid size-10 shrink-0 place-items-center rounded-[5px] border border-line bg-surface text-ink-2 transition hover:border-brand hover:text-ink ${className}`}
    >
      {on ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
    </button>
  );
}
