import { House, RotateCcw } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { Button, cx } from "./ui";

export function Logo({ onClick }: { onClick?: () => void }) {
  const mark = (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-panel-2" />
        <circle cx="16" cy="16" r="9" fill="none" className="stroke-alert" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="3" className="fill-alert" />
      </svg>
      <span className="text-[15px] font-bold tracking-tight text-ink">The Ops Room</span>
    </span>
  );
  if (!onClick) return mark;
  return (
    <button type="button" onClick={onClick} className="rounded-lg" aria-label="The Ops Room, go to home screen">
      {mark}
    </button>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Scenario progress" className="w-full">
      {/* Compact: one line with a progress bar */}
      <div className="md:hidden">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold text-ink">{steps[current]}</span>
          <span className="font-mono text-muted">
            {current + 1}/{steps.length}
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line/70">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${((current + 1) / steps.length) * 100}%` }} />
        </div>
      </div>
      {/* Full: labeled steps */}
      <ol className="hidden items-center gap-1 md:flex">
        {steps.map((label, i) => (
          <li key={label + i} className="flex items-center gap-1" aria-current={i === current ? "step" : undefined}>
            <span
              className={cx(
                "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition",
                i === current && "bg-accent/15 text-accent ring-1 ring-accent/40",
                i < current && "text-ink-2",
                i > current && "text-muted/70",
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && <span className={cx("h-px w-3 lg:w-5", i < current ? "bg-line-strong" : "bg-line")} aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function AppHeader({
  title,
  onHome,
  onRestart,
  children,
}: {
  title: string;
  onHome: () => void;
  onRestart: () => void;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Logo onClick={onHome} />
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <span className="hidden truncate text-sm text-muted sm:block">{title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" onClick={onHome} className="px-3" aria-label="Home">
            <House className="size-4" aria-hidden />
            <span className="hidden sm:inline">Home</span>
          </Button>
          <Button variant="ghost" onClick={onRestart} className="px-3" aria-label="Restart scenario">
            <RotateCcw className="size-4" aria-hidden />
            <span className="hidden sm:inline">Restart</span>
          </Button>
        </div>
      </div>
      {children && <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">{children}</div>}
    </header>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => e.target === ref.current && onCancel()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-panel p-0 text-ink shadow-2xl"
      aria-labelledby="confirm-title"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-[15px] text-ink-2">{body}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} autoFocus>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
