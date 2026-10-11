import { Plus } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * A section folded behind its title, as in the design: the answer stays on screen, the detail opens on demand.
 * It opens by itself when the address points at it (or at anything inside it), so links like /run-it#projection still land.
 */
export function Fold({ id, title, sub, children, open = false }: { id?: string; title: string; sub?: string; children: ReactNode; open?: boolean }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const reveal = () => {
      const el = ref.current;
      const hash = window.location.hash.slice(1);
      if (!el || !hash) return;
      if (el.id === hash || el.querySelector(`#${CSS.escape(hash)}`)) {
        el.open = true;
        window.requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }));
      }
    };
    const forPrint = () => {
      if (ref.current) ref.current.open = true;
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    window.addEventListener("beforeprint", forPrint);
    return () => {
      window.removeEventListener("hashchange", reveal);
      window.removeEventListener("beforeprint", forPrint);
    };
  }, []);
  return (
    <details ref={ref} id={id} open={open} className="group min-w-0 scroll-mt-24 rounded-[7px] border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-lg font-semibold tracking-tight text-ink">{title}</span>
          {sub && <span className="mt-1 block text-xs text-muted">{sub}</span>}
        </span>
        <Plus className="size-5 shrink-0 text-ink transition-transform group-open:rotate-45" aria-hidden />
      </summary>
      <div className="min-w-0 border-t border-line p-4 sm:p-5">{children}</div>
    </details>
  );
}
