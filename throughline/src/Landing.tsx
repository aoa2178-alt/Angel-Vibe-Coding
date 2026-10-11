import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Footer, Header, ProductSelect, href, linkClick } from "@/components/Frame";
import { TIER_LABELS, WAVE_COLORS, Waves } from "@/components/Waves";
import { WorldDots } from "@/components/WorldDots";
import { bullwhip } from "@/lib/bullwhip";
import { METHODS } from "@/lib/forecast";
import { PRODUCTS, formatUnits, pct, type ProductId } from "@/lib/products";
import { run } from "@/lib/run";
import { defaultScenario } from "@/lib/scenario";

/** The toolkit, as labels that drop into a pile. Each one opens its explanation in the FAQ. */
const TOOLKIT: [string, string][] = [
  ["Lead time", "safety-stock"],
  ["S&OP", "methods"],
  ["Forecast error", "wape"],
  ["Demand data", "bullwhip"],
  ["Holt-Winters", "methods"],
  ["Service level", "service-cost"],
  ["Allocation", "allocation"],
  ["EOQ", "safety-stock"],
  ["Safety stock", "safety-stock"],
  ["Bullwhip", "bullwhip"],
  ["Fill rate", "allocation"],
  ["Newsvendor", "launch"],
];
const PILL = ["border-accent/60 bg-accent/10 text-brand-ink", "border-brand/40 bg-brand/5 text-brand", "border-[#5b4fd0]/40 bg-[#5b4fd0]/10 text-[#4b3fc0]", "border-[#b45309]/40 bg-[#b45309]/10 text-[#9a4a08]"];

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function Landing() {
  const [id, setId] = useState<ProductId>(PRODUCTS[0]!.id);
  const [shared, setShared] = useState(false);
  const s = defaultScenario(id);
  const r = useMemo(() => run(defaultScenario(id)), [id]);
  const ratios = useMemo(() => [1, ...r.ripple.ratios], [r]);
  const sharedRatios = useMemo(() => [1, ...bullwhip(r.units, { ...defaultScenario(id).bullwhip, share: true }).ratios], [r, id]);
  const chosen = r.fc.scores.find((x) => x.method === r.fc.method)!;
  const method = METHODS.find((m) => m.id === r.fc.method)!;
  const nextYear = r.fc.forecast.reduce((a, b) => a + b, 0);
  const start = href("forecast", s);
  const faq = "/faq";
  const shown = shared ? sharedRatios : ratios;

  // The plan, as code that types itself out line by line.
  const code: [string, string, string?][] = [
    ["kw", "export const plan = {"],
    ["", "  product: ", `"${r.product.name}",`],
    ["", "  method: ", `"${method.label}", // error ${pct(chosen.wape, 1)}`],
    ["", "  serviceLevel: ", `${s.settings.serviceLevel},`],
    ["", "  leadTime: ", `${s.settings.leadMonths}, // months`],
    ["", "  safetyStock: ", `${Math.round(r.plan.safetyStock).toLocaleString("en-US").replace(/,/g, "_")}, // units`],
    ["", "  regions: ", `[${r.product.regions.map((g) => `"${g.id.toUpperCase()}"`).join(", ")}],`],
    ["", "  shareDemandData: ", `${shared},`],
    ["kw", "};"],
  ];
  const [typed, setTyped] = useState(() => (reducedMotion() ? code.length : 0));
  useEffect(() => {
    if (typed >= code.length) return;
    const t = window.setTimeout(() => setTyped((n) => n + 1), 240);
    return () => window.clearTimeout(t);
  }, [typed, code.length]);

  return (
    <div className="min-h-dvh">
      <Header
        tone="dark"
        actions={
          <>
            <nav aria-label="Sections" className="mr-3 hidden items-center gap-6 text-sm text-white/70 md:flex">
              <a href="#tiles" className="transition hover:text-white">
                Approach
              </a>
              <a href="/sources" onClick={linkClick("/sources")} className="transition hover:text-white">
                Sources
              </a>
              <a href={faq} onClick={linkClick(faq)} className="transition hover:text-white">
                FAQ
              </a>
            </nav>
            <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-1.5 rounded-[6px] bg-accent px-3.5 py-2 text-sm font-semibold text-[#062b29] transition hover:opacity-90">
              Start <ArrowRight className="size-4" aria-hidden />
            </a>
          </>
        }
      />

      <main>
        {/* The opener: the bullwhip, live, on a dark stage. */}
        <section className="relative h-[560px] overflow-hidden bg-[#141b3d] text-[#e7ebfb] sm:h-[600px]" aria-label="The bullwhip effect">
          <Waves ratios={ratios} sharedRatios={sharedRatios} shared={shared} className="absolute inset-0 h-full w-full" />
          <div className="relative mx-auto max-w-[1320px] px-4 pt-12 sm:px-8 sm:pt-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#9aa3c9]">Supply and demand planning</p>
            <h1 className="mt-3 max-w-3xl font-mono text-3xl font-medium leading-[1.15] tracking-[-0.02em] sm:text-5xl">
              How much to build,
              <br />
              and where it goes
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ProductSelect value={id} onChange={setId} className="w-64 max-w-full" />
              <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-accent px-4 py-2.5 text-sm font-semibold text-[#062b29] transition hover:opacity-90">
                View analysis <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-4 px-4 pb-6 sm:px-8">
              <p className="font-mono text-[11.5px] leading-[1.8] text-[#9aa3c9]">
                {TIER_LABELS.map((l, i) => (
                  <span key={l} className="mr-3 inline-block">
                    <span style={{ color: WAVE_COLORS[i] }}>●</span> {l} <b className="text-[#e7ebfb]">{i === 0 ? "1×" : `${Math.round(shown[i]!)}×`}</b>
                  </span>
                ))}
                <br />
                {shared ? "Every tier now forecasts from real customer demand." : "Each tier orders a little extra to cover its lead time, so swings grow upstream."}
              </p>
              <div className="text-right font-mono text-[11px] text-[#9aa3c9]">
                <p className="hidden sm:block">[ HOVER ] the waves · [ CLICK ] to share data</p>
                <button
                  type="button"
                  aria-pressed={shared}
                  onClick={() => setShared((v) => !v)}
                  className={`mt-2 rounded-full border px-3.5 py-2 text-xs transition ${shared ? "border-accent bg-accent text-[#062b29]" : "border-white/20 bg-white/5 text-[#e7ebfb] hover:border-accent"}`}
                >
                  {shared ? "Demand data shared ✓" : "Share demand data"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* The tiles: the plan as code, the toolkit, the regions, the pages. */}
        <section id="tiles" className="mx-auto grid max-w-[1320px] scroll-mt-20 gap-3 px-4 py-8 sm:px-8 lg:grid-cols-12" aria-label="The plan at a glance">
          <div className="overflow-hidden rounded-[10px] border border-line bg-surface lg:col-span-5">
            <p className="px-4 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">plan.ts</p>
            <div className="grid grid-cols-[2.25rem_1fr] py-3 font-mono text-[12.5px] leading-[1.75]">
              <div className="select-none border-r border-line pr-3 text-right text-muted/60" aria-hidden>
                {code.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="overflow-x-auto pl-3.5" aria-label="The plan's settings">
                {code.slice(0, Math.max(1, typed)).map(([kind, key, value], i, shownLines) => (
                  <div key={i}>
                    <span className={kind === "kw" ? "text-brand" : "text-ink"}>{key}</span>
                    {value && <span className="text-brand-ink">{value}</span>}
                    {i === shownLines.length - 1 && (
                      <span className="ml-1 inline-block h-3.5 w-[7px] translate-y-0.5 bg-accent" style={{ animation: "caret 1s steps(2) infinite" }} aria-hidden />
                    )}
                  </div>
                ))}
              </pre>
            </div>
          </div>

          <div className="relative min-h-[230px] overflow-hidden rounded-[10px] border border-line bg-surface lg:col-span-7">
            <p className="px-4 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">The toolkit</p>
            {TOOLKIT.map(([label, anchor], i) => {
              const row = Math.floor(i / 4);
              const col = i % 4;
              const to = `${faq}#${anchor}`;
              return (
                <a
                  key={label}
                  href={to}
                  onClick={linkClick(to)}
                  className={`absolute whitespace-nowrap rounded-[999px] border px-3 py-1.5 text-[12.5px] font-medium transition hover:scale-105 ${PILL[i % PILL.length]}`}
                  style={{
                    left: `${3 + col * 24 + ((i * 7) % 5)}%`,
                    top: `${74 - row * 21 + ((i * 3) % 4)}%`,
                    rotate: `${((i * 29) % 26) - 13}deg`,
                    animation: `fall 1s cubic-bezier(0.34,1.4,0.64,1) ${200 + i * 110}ms both`,
                  }}
                >
                  {label}
                </a>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-[10px] border border-line bg-surface lg:col-span-5">
            <p className="px-4 pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Regions · share of demand</p>
            <div className="aspect-[100/52] px-2 pb-2">
              <WorldDots product={r.product} />
            </div>
          </div>

          <div className="rounded-[10px] border border-line bg-surface p-4 lg:col-span-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{r.product.name} · next 12 months</p>
            <nav aria-label="Pages" className="mt-3 flex flex-wrap gap-1.5">
              {(
                [
                  ["forecast", "Forecast"],
                  ["plan", "Supply plan"],
                  ["allocate", "Allocation"],
                  ["ripple", "Bullwhip"],
                  ["deliver", "Delivery"],
                ] as const
              ).map(([route, label], i) => (
                <a
                  key={route}
                  href={href(route, s)}
                  onClick={linkClick(href(route, s))}
                  className={`rounded-[6px] border px-3 py-1.5 text-[13px] transition ${i === 0 ? "border-brand/30 bg-brand/5 font-semibold text-brand" : "border-line text-muted hover:border-brand hover:text-ink"}`}
                >
                  {label}
                </a>
              ))}
            </nav>
            <dl className="mt-3">
              {[
                ["Units forecast", formatUnits(nextYear)],
                ["Forecast error (WAPE)", pct(chosen.wape, 1)],
                [`Safety stock at ${pct(s.settings.serviceLevel)} service`, formatUnits(r.plan.safetyStock)],
                ["Swing at the supplier", `${Math.round(ratios.at(-1)!)}× → ${Math.round(sharedRatios.at(-1)!)}× with shared data`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-t border-line py-2.5 text-[14px]">
                  <dt>{k}</dt>
                  <dd className="text-right font-mono text-muted">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-8">
          <h2 className="text-3xl font-semibold tracking-[-0.035em]">Plan your own product.</h2>
          <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
