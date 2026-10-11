import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { linkClick } from "@/components/Brand";
import { CostPod, MenuPod, PAGES } from "@/components/Handheld";
import { PillBar, SiteFooter } from "@/components/Site";

const NAV = [
  { href: "#how", label: "Approach" },
  { href: "/sources", label: "Sources" },
  { href: "/faq", label: "FAQ" },
];

function CtaLink({ to, children, variant = "primary" }: { to: string; children: ReactNode; variant?: "primary" | "light" }) {
  const styles = { primary: "bg-brand text-white hover:bg-[#2c4058]", light: "bg-white text-[#182536] hover:bg-white/90" }[variant];
  return (
    <a href={to} onClick={linkClick(to)} className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[5px] px-5 py-3.5 text-[15px] font-semibold transition ${styles}`}>
      {children}
    </a>
  );
}

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded border border-b-2 border-line bg-surface px-1.5 py-px font-mono text-[11px] text-ink-2">{children}</kbd>
);

export function Landing() {
  return (
    <div className="min-h-dvh bg-bg">
      <PillBar
        nav={NAV}
        actions={
          <a
            href="/worth-it"
            onClick={linkClick("/worth-it")}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c4058]"
          >
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        }
      />

      <main>
        {/* The question, with the handheld: turn the wheel and watch the cheapest way to run AI change with volume. */}
        <section className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="kicker">Compute economics, made explicit.</p>
            <h1 className="mt-4 text-[3.2rem] font-semibold leading-[0.96] tracking-[-0.065em] sm:text-7xl lg:text-[5.4rem]">
              <span className="underline decoration-[#79aa9f] decoration-4 underline-offset-[7px]">API</span>, cloud GPUs, or your own hardware?
            </h1>
            <p className="mt-6 max-w-[620px] text-lg leading-7 text-muted">Total cost of ownership at your volume, and the volumes where the answer changes.</p>
            <div className="mt-7 flex flex-wrap items-center gap-6">
              <CtaLink to="/worth-it">
                View analysis <ArrowRight className="size-4" aria-hidden />
              </CtaLink>
              <a href="/run-it" onClick={linkClick("/run-it")} className="text-[15px] font-semibold text-ink underline-offset-4 hover:underline">
                Go to the cost comparison <ArrowRight className="inline size-4" aria-hidden />
              </a>
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted max-lg:hidden">
              <span>
                <Kbd>←</Kbd> <Kbd>→</Kbd> turn the wheel
              </span>
              <span>Default assumptions · no sign-up required</span>
            </p>
          </div>
          <CostPod />
        </section>

        {/* Approach: the four pages, browsed on the same handheld. */}
        <section id="how" className="dark-scope scroll-mt-20">
          <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="kicker">Approach</p>
              <h2 className="mt-3 text-3xl font-medium tracking-[-0.03em] sm:text-4xl">Three analyses and a recommendation.</h2>
              <ol className="mt-8 grid gap-5">
                {PAGES.map((p) => (
                  <li key={p.href} className="border-t border-white/20 pt-4">
                    <a href={p.href} onClick={linkClick(p.href)} className="font-semibold text-white hover:underline">
                      {p.label}
                    </a>
                    <p className="mt-1 text-[15px] leading-6 text-white/75">{p.body}</p>
                  </li>
                ))}
              </ol>
            </div>
            <MenuPod />
          </div>
        </section>

        {/* Closing call to action. */}
        <section className="dark-scope border-t border-white/10">
          <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-6 px-4 py-16 sm:px-8 md:flex-row md:items-center md:justify-between">
            <h2 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">Model your own scenario.</h2>
            <CtaLink to="/worth-it" variant="light">
              Start <ArrowRight className="size-4" aria-hidden />
            </CtaLink>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
