import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "breakeven-theme";

/** Light / dark switch. It starts from the device setting and remembers a choice on this browser (index.html applies it before paint). */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

  // Follow the device setting while the visitor hasn't picked one.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(KEY);
      } catch {
        // Storage blocked: just follow the device.
      }
      if (!saved) apply(e.matches);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function apply(next: boolean) {
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
  }

  function toggle() {
    const next = !dark;
    apply(next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      // Storage blocked: the choice lasts for this visit only.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`grid size-10 shrink-0 place-items-center rounded-[5px] border border-line bg-surface text-ink-2 transition hover:border-brand hover:text-ink ${className}`}
    >
      {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  );
}
