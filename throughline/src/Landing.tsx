import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Footer, Header, ProductSelect, href, linkClick } from "@/components/Frame";
import { anim } from "@/components/Motion";
import { TrustTag } from "@/components/ui";
import { bullwhip } from "@/lib/bullwhip";
import { PRODUCTS, formatMonth, formatUnits, pct, type ProductId } from "@/lib/products";
import { run, type Run } from "@/lib/run";
import { defaultScenario } from "@/lib/scenario";

const STEPS = [
  { title: "Forecast", body: "Three methods scored on held-out months." },
  { title: "Supply plan", body: "Safety stock, order size and launch quantity." },
  { title: "Allocation", body: "Who gets scarce supply, by rule." },
];

/** The last three years of demand and the next twelve months, with the forecast's 80% range. */
function FlowChart({ r }: { r: Run }) {
  const shown = r.hist.slice(-36);
  const z80 = 1.2816;
  const lower = r.fc.forecast.map((v) => Math.max(0, v - z80 * r.fc.sigma));
  const upper = r.fc.forecast.map((v) => v + z80 * r.fc.sigma);
  const all = [...shown.map((h) => h.units), ...upper, ...lower];
  const max = Math.max(...all) * 1.05;
  const min = Math.min(...all) * 0.9;
  const W = 720;
  const H = 260;
  const n = shown.length + 12;
  const x = (i: number) => 12 + (i / (n - 1)) * (W - 24);
  const y = (v: number) => 18 + (1 - (v - min) / (max - min)) * (H - 46);
  const line = (vals: number[], from: number) => vals.map((v, k) => `${k ? "L" : "M"}${x(from + k).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = shown.length - 1;
  const back = lower.map((_, k) => lower.length - 1 - k);
  const band = `${line(upper, shown.length)} ${back.map((k) => `L${x(shown.length + k).toFixed(1)} ${y(lower[k]!).toFixed(1)}`).join(" ")} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label={`${r.product.name}: monthly demand for the last three years and the forecast for the next twelve months.`}>
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1="0" x2={W} y1={18 + t * (H - 46)} y2={18 + t * (H - 46)} stroke="var(--line)" />
      ))}
      <path d={band} fill="var(--accent)" fillOpacity="0.16" style={anim("fade", 700, 700)} />
      <path d={line(shown.map((h) => h.units), 0)} fill="none" stroke="var(--brand)" strokeWidth="2.25" strokeLinejoin="round" style={anim("wipe", 1100, 100, "std")} />
      <path d={line([shown[last]!.units, ...r.fc.forecast], last)} fill="none" stroke="var(--accent)" strokeWidth="2.75" strokeLinejoin="round" style={anim("wipe", 800, 900, "std")} />
      <line x1={x(last)} x2={x(last)} y1="10" y2={H - 28} stroke="var(--muted)" strokeDasharray="3 4" />
      <text x={x(last) + 6} y="16" fontSize="11" fill="var(--muted)">
        forecast
      </text>
      <text x="12" y={H - 8} fontSize="11" fill="var(--muted)">
        {formatMonth(shown[0]!.month)}
      </text>
      <text x={x(last)} y={H - 8} fontSize="11" fill="var(--muted)" textAnchor="middle">
        {formatMonth(shown[last]!.month)}
      </text>
      <text x={W - 12} y={H - 8} fontSize="11" fill="var(--muted)" textAnchor="end">
        {formatMonth(r.futureMonths.at(-1)!)}
      </text>
    </svg>
  );
}

export function Landing() {
  const [id, setId] = useState<ProductId>(PRODUCTS[0]!.id);
  const s = defaultScenario(id);
  const r = run(s);
  const chosen = r.fc.scores.find((x) => x.method === r.fc.method)!;
  const nextYear = r.fc.forecast.reduce((a, b) => a + b, 0);
  const swing = r.ripple.ratios.at(-1)!;
  const shared = bullwhip(r.units, { ...s.bullwhip, share: true }).ratios.at(-1)!;
  const start = href("forecast", s);
  const faq = "/faq";

  return (
    <div className="min-h-dvh">
      <Header
        actions={
          <>
            <nav aria-label="Sections" className="mr-3 hidden items-center gap-6 text-sm text-muted md:flex">
              <a href="#how" className="transition hover:text-ink">
                How it works
              </a>
              <a href="/sources" onClick={linkClick("/sources")} className="transition hover:text-ink">
                Sources
              </a>
              <a href={faq} onClick={linkClick(faq)} className="transition hover:text-ink">
                FAQ
              </a>
            </nav>
            <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-3.5 py-2 text-sm font-semibold text-on-brand transition hover:opacity-90">
              Start <ArrowRight className="size-4" aria-hidden />
            </a>
          </>
        }
      />

      <main>
        <section className="mx-auto max-w-[1320px] px-4 pt-16 text-center sm:px-8 sm:pt-24">
          <p className="kicker">Supply and demand planning</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.045em] text-balance sm:text-6xl">
            How much to build, and{" "}
            <span className="underline decoration-accent decoration-[5px] underline-offset-[10px]">where</span> it goes
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-ink-2">Forecast, supply plan and allocation on real US demand data.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-5">
            <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
              Start <ArrowRight className="size-4" aria-hidden />
            </a>
            <a href={faq} onClick={linkClick(faq)} className="inline-flex items-center gap-1.5 font-semibold text-ink transition hover:text-brand-ink">
              See the method <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-[1100px] px-4 sm:px-8" aria-label="Product preview">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Product</span>
            <ProductSelect value={id} onChange={setId} className="w-72 max-w-full" />
          </div>
          <div className="rounded-[8px] border border-line bg-surface p-3 pb-12">
            <FlowChart key={id} r={r} />
          </div>
          <div className="relative mx-auto -mt-10 max-w-[960px] rounded-[8px] border border-line bg-surface p-4 shadow-[0_10px_30px_rgb(20_26_51/0.08)] sm:mx-8 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3 text-sm">
              <span className="font-semibold">{r.product.name} · next 12 months</span>
              <span className="text-xs text-muted">{formatUnits(nextYear)} units forecast</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[6px] border border-line p-3">
                <p className="text-xs text-muted">
                  Forecast error (WAPE)
                  <TrustTag kind="modeled" />
                </p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight">{pct(chosen.wape, 1)}</p>
              </div>
              <div className="rounded-[6px] border border-line p-3">
                <p className="text-xs text-muted">
                  Safety stock at {pct(s.settings.serviceLevel)} service
                  <TrustTag kind="modeled" />
                </p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight">{formatUnits(r.plan.safetyStock)}</p>
              </div>
              <div className="rounded-[6px] border border-accent p-3 shadow-[inset_0_3px_0_var(--accent)]">
                <p className="text-xs text-muted">
                  Bullwhip at the supplier
                  <TrustTag kind="modeled" />
                </p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight">
                  {swing.toFixed(0)}× → {shared.toFixed(0)}×
                </p>
              </div>
            </div>
            <p className="mt-3 flex flex-wrap justify-between gap-2 rounded-[5px] bg-brand-soft px-3 py-2 text-sm text-brand-ink">
              <span>Sharing end-customer demand data cuts the supplier swing</span>
              <span className="font-mono font-semibold">−{pct(1 - shared / swing)}</span>
            </p>
          </div>
        </section>

        <section id="how" className="mt-16 scroll-mt-20 bg-panel text-panel-ink">
          <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">How it works</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {STEPS.map((st) => (
                <li key={st.title} className="border-t border-white/20 pt-4">
                  <h3 className="text-lg font-semibold">{st.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-6 text-panel-muted">{st.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-sm text-panel-muted">Then the bullwhip across four tiers, delivery performance, and a recommendation.</p>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-4 py-16 sm:px-8">
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
