import { ArrowRight } from "lucide-react";
import { Footer, Header, href, linkClick } from "@/components/Frame";
import { anim } from "@/components/Motion";
import { TrustTag } from "@/components/ui";
import { negotiation, ranked, shouldCost } from "@/lib/analysis";
import { BUYER, DEFAULT_SETTINGS, formatMoney, pct } from "@/lib/data";

const STEPS = [
  { title: "Spend", body: "Where the money goes and where savings are realistic." },
  { title: "Should-cost", body: "A transformer priced up from copper, steel and labor." },
  { title: "Bid evaluation", body: "Four bids compared on total cost, not price." },
  { title: "Negotiation", body: "Walk-away, target, and the deal structure." },
];
const SHADES = ["var(--part-1)", "var(--part-2)", "var(--part-3)", "var(--part-4)"];

/** The should-cost built up line by line, against the quote and the negotiating target. */
function CostBuild() {
  const sc = shouldCost();
  const n = negotiation(DEFAULT_SETTINGS);
  const W = 560;
  const max = Math.max(n.quoted, n.walkAway) * 1.06;
  const x = (v: number) => 8 + (v / max) * (W - 16);
  let at = 0;
  return (
    <svg viewBox={`0 0 ${W} 190`} className="w-full" role="img" aria-label={`Should-cost ${formatMoney(sc.total)} built from ${sc.lines.length} cost lines; best-value quote ${formatMoney(n.quoted)}; target ${formatMoney(n.target)}.`}>
      <text x="8" y="16" fontSize="12" fill="var(--muted)">
        Should-cost, line by line
      </text>
      {sc.lines.map((l, i) => {
        const x0 = x(at);
        at += l.cost;
        return (
          <rect key={l.id} x={x0} y={24} width={Math.max(0.5, x(at) - x0 - 1.5)} height="34" fill={SHADES[i % SHADES.length]} style={anim("fade", 400, 80 + i * 70)}>
            <title>
              {l.label}: {formatMoney(l.cost)}
            </title>
          </rect>
        );
      })}
      <text x={x(sc.total) + 6} y="46" fontSize="13" fontWeight="600" fill="var(--accent)">
        {formatMoney(sc.total)}
      </text>
      <text x="8" y="94" fontSize="12" fill="var(--muted)">
        Quote from the best-value bid ({n.best.bid.supplier}), per unit
      </text>
      <rect x="8" y="102" width={x(n.quoted) - 8} height="34" fill="var(--ink)" style={anim("growX", 700, 800)} className="[transform-box:fill-box] [transform-origin:left]" />
      <text x={x(n.quoted) - 8} y="124" fontSize="13" fontWeight="600" textAnchor="end" fill="#ffffff">
        {formatMoney(n.quoted)}
      </text>
      <line x1={x(n.target)} x2={x(n.target)} y1="20" y2="146" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 3" />
      <text x={x(n.target)} y="166" fontSize="12" textAnchor="middle" fill="var(--accent)" fontWeight="600">
        target {formatMoney(n.target)}
      </text>
      <text x={x(n.walkAway)} y="184" fontSize="11" textAnchor="end" fill="var(--muted)">
        walk away above {formatMoney(n.walkAway)}
      </text>
      <line x1={x(n.walkAway)} x2={x(n.walkAway)} y1="140" y2="172" stroke="var(--muted)" strokeWidth="1.5" />
    </svg>
  );
}

export function Landing() {
  const s = DEFAULT_SETTINGS;
  const start = href("spend", s);
  const faq = "/faq";
  const sc = shouldCost();
  const n = negotiation(s);
  const cheapest = [...ranked(s)].sort((a, b) => a.price - b.price)[0]!;

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

      <main className="mx-auto max-w-[1320px] px-4 sm:px-8">
        <section className="pt-14 sm:pt-20">
          <p className="kicker">Strategic sourcing</p>
          <h1 className="mt-4 max-w-4xl text-[3rem] leading-[1] tracking-[-0.03em] sm:text-[5.5rem]">
            What <em className="underline decoration-accent decoration-[5px] underline-offset-[10px]">should</em> this cost?
          </h1>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-b border-ink pb-6">
            <p className="max-w-lg text-lg leading-8 text-ink-2">Should-cost from commodity prices, bids on total cost, and a target to negotiate to.</p>
            <div className="flex flex-wrap items-center gap-5">
              <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
                Start <ArrowRight className="size-4" aria-hidden />
              </a>
              <a href={faq} onClick={linkClick(faq)} className="inline-flex items-center gap-1.5 font-semibold text-ink transition hover:text-brand-ink">
                See the method <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <section className="grid items-center gap-10 py-12 lg:grid-cols-[1fr_1.2fr]" aria-label="Case preview">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Should-cost · 80 MVA transformer
              <TrustTag kind="modeled" />
            </p>
            <p className="mt-3 font-serif text-[5.5rem] leading-none tracking-[-0.04em] text-accent" style={anim("rise", 700, 100)}>
              {formatMoney(sc.total)}
            </p>
            <p className="mt-5 text-[15px] leading-7 text-ink-2">
              Target price <span className="font-semibold text-ink">{formatMoney(n.target)}</span> a unit, about {pct(1 - n.target / n.quoted)} below the best-value bid. {BUYER.name}, {BUYER.project}, a{" "}
              {BUYER.itMw} MW AI data hall.
            </p>
          </div>
          <div className="rounded-[7px] border border-line bg-surface p-5">
            <CostBuild />
          </div>
        </section>

        <section className="grid border-t border-line sm:grid-cols-2" aria-label="Key figures">
          <div className="py-5 sm:pr-8">
            <p className="text-xs text-muted">
              Quote, best-value bid ({n.best.bid.supplier})
              <TrustTag kind="assumption" />
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tracking-tight">{formatMoney(n.quoted)}</p>
          </div>
          <div className="border-line py-5 sm:border-l sm:pl-8">
            <p className="text-xs text-muted">
              Delay cost of the cheapest bid ({cheapest.bid.supplier})
              <TrustTag kind="modeled" />
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tracking-tight">{formatMoney(cheapest.lateness)}</p>
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-t border-ink pb-16 pt-10">
          <h2 className="text-3xl tracking-[-0.02em]">How it works</h2>
          <ol className="mt-6">
            {STEPS.map((st, i) => (
              <li key={st.title} className="grid grid-cols-[3rem_10rem_1fr] gap-4 border-t border-line py-4 text-[15px] max-sm:grid-cols-[2.5rem_1fr]">
                <span className="font-mono text-sm font-semibold text-accent">0{i + 1}</span>
                <span className="font-semibold">{st.title}</span>
                <span className="text-ink-2 max-sm:col-start-2">{st.body}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-6 border-t border-ink py-14">
          <h2 className="text-4xl tracking-[-0.02em]">Source your own category.</h2>
          <a href={start} onClick={linkClick(start)} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
            Start <ArrowRight className="size-4" aria-hidden />
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
