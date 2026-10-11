import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink hover:brightness-110 shadow-[0_6px_18px_-8px_rgb(36_83_255/0.6)]",
  secondary: "bg-panel-2 text-ink border border-line hover:border-line-strong hover:bg-line/60",
  ghost: "text-ink-2 hover:text-ink hover:bg-panel-2",
  danger: "bg-bad text-white hover:brightness-110",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:brightness-100",
        buttonStyles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-2xl border border-line bg-panel", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx("font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-accent", className)}>{children}</p>
  );
}

/** The deadline as a mission clock: "T–28:00 DAYS", with the colon blinking once a second. */
export function Countdown({ clock, size = "lg" }: { clock: { label: string; count: number; unit: string }; size?: "sm" | "lg" }) {
  const value = String(clock.count).padStart(2, "0");
  if (size === "sm")
    return (
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink" aria-label={`${clock.label}: ${clock.count} ${clock.unit}`}>
        T–{value}
        <span className="blink text-accent" aria-hidden>
          :
        </span>
        00 {clock.unit}
      </span>
    );
  return (
    <div aria-label={`${clock.label}: ${clock.count} ${clock.unit}`}>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{clock.label}</p>
      <p className="mt-1 font-serif text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-5xl" aria-hidden>
        T–{value}
        <span className="blink text-accent">:</span>
        00 <span className="font-mono text-base font-semibold uppercase tracking-[0.1em] text-muted">{clock.unit}</span>
      </p>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{children}</h2>;
}
