import { ArrowRight, ExternalLink } from "lucide-react";
import { useState, type ReactNode } from "react";
import { STEPS, href, linkClick, type StepRoute } from "./Frame";
import { TrustTag } from "./ui";
import { COMPANIES, RECEIVERS, SPENDERS, filingUrl, formatMillions, formatQuarter, signedPct, type Company } from "@/lib/data";
import { back, headline, quarterRange, total } from "@/lib/metrics";
import { BASES, DEFAULT_SCENARIO } from "@/lib/scenario";

const fmt = (m: number | null) => (m === null ? "null" : m.toLocaleString("en-US"));
const reported = (c: Company, upTo: string) => c.quarters.filter((q) => q.quarter <= upTo && q.capex !== null);

/** One line of the editor: a line number and its code. */
function Ln({ n, children, on = false }: { n: number; children?: ReactNode; on?: boolean }) {
  return (
    <div className={`grid grid-cols-[2.75rem_1fr] ${on ? "bg-brand-soft" : ""}`}>
      <span className="select-none pr-3.5 text-right text-[#a5afc0]">{n}</span>
      <span className="min-w-0 whitespace-pre-wrap break-words pr-3">{children}</span>
    </div>
  );
}
const K = ({ children }: { children: ReactNode }) => <span className="text-[#7c3aed]">{children}</span>;
const N = ({ children }: { children: ReactNode }) => <span className="font-semibold text-accent">{children}</span>;
const C = ({ children }: { children: ReactNode }) => <span className="text-[#8a94a6]">{children}</span>;

/**
 * The landing's filings explorer, laid out like a code editor: the companies' filings as a file tree, the open filing in
 * the middle (its reported figures with line numbers and an ASCII chart of recent capex), and the scenario controls on
 * the right. A status bar carries the headline figures.
 */
export function FilingsIde() {
  const h = headline();
  const [ticker, setTicker] = useState(DEFAULT_SCENARIO.company);
  const company = COMPANIES.find((c) => c.ticker === ticker)!;
  const files = reported(company, h.quarter).slice(-3).reverse();
  const [quarter, setQuarter] = useState(files[0]!.quarter);
  const [base, setBase] = useState(DEFAULT_SCENARIO.base);
  const [view, setView] = useState<StepRoute>("spend");
  const open = company.quarters.find((q) => q.quarter === quarter) ?? files[0]!;
  const recent = reported(company, h.quarter).slice(-8);
  const max = Math.max(...recent.map((q) => q.capex ?? 0));
  const s = { company: company.role === "spender" ? company.ticker : DEFAULT_SCENARIO.company, base };
  const run = href(company.role === "receiver" && view !== "note" ? "receivers" : view, s);
  const yearAgo = total(SPENDERS, back(h.quarter, 4), "capex");
  const first = quarterRange("2020Q1", h.quarter)[0]!;

  const pick = (t: string) => {
    const c = COMPANIES.find((x) => x.ticker === t)!;
    setTicker(t);
    setQuarter(reported(c, h.quarter).at(-1)!.quarter);
  };

  const tree = (label: string, list: Company[]) => (
    <>
      <div className="px-3.5 text-muted">▾ {label}/</div>
      {list.map((c) => {
        const isOpen = c.ticker === ticker;
        return (
          <div key={c.ticker}>
            <button type="button" onClick={() => pick(c.ticker)} aria-expanded={isOpen} className="block w-full px-3.5 pl-7 text-left text-muted hover:bg-sunken">
              {isOpen ? "▾" : "▸"} {c.short.toLowerCase()}/
            </button>
            {isOpen &&
              reported(c, h.quarter)
                .slice(-3)
                .reverse()
                .map((q) => (
                  <button
                    key={q.quarter}
                    type="button"
                    onClick={() => setQuarter(q.quarter)}
                    aria-pressed={q.quarter === quarter}
                    className={`block w-full px-3.5 pl-11 text-left ${q.quarter === quarter ? "bg-brand-soft text-ink shadow-[inset_2px_0_0_var(--accent)]" : "text-ink-2 hover:bg-sunken"}`}
                  >
                    {q.quarter}.xbrl
                  </button>
                ))}
          </div>
        );
      })}
    </>
  );

  const capex = open.capex;
  const lines: ReactNode[] = [
    <C>
      // {company.short} · {company.role} · {open.accn ? `filing ${open.accn}` : "no accession on file"}
    </C>,
    <>
      <K>quarter</K>: <span className="text-[#1d7a50]">"{open.quarter}"</span>, {open.end && <C>// period ends {open.end}</C>}
    </>,
    <>
      <K>capex</K>: <N>{fmt(capex)}</N>, <C>// $M · {company.concepts.capex}</C>
    </>,
    <>
      <K>revenue</K>: <N>{fmt(open.revenue)}</N>, <C>// $M</C>
    </>,
    <>
      <K>opCashFlow</K>: <N>{fmt(open.ocf)}</N>, <C>// $M</C>
    </>,
    <>
      <K>depreciation</K>: <N>{fmt(open.da)}</N>, <C>// $M</C>
    </>,
    <>
      <K>intensity</K>: <N>{capex !== null && open.revenue ? `${((capex / open.revenue) * 100).toFixed(1)}%` : "null"}</N>, <C>// capex ÷ revenue</C>
    </>,
    <>
      <K>freeCash</K>: <N>{capex !== null && open.ocf !== null ? fmt(open.ocf - capex) : "null"}</N>, <C>// op. cash flow − capex</C>
    </>,
    null,
    <C>// quarterly capex, last {recent.length} quarters</C>,
  ];

  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line bg-sunken px-3 py-2 font-mono text-xs text-muted">
        <span aria-hidden className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-[#cfd6e2]" />
          <i className="size-2.5 rounded-full bg-[#cfd6e2]" />
          <i className="size-2.5 rounded-full bg-[#cfd6e2]" />
        </span>
        <span className="flex-1" />
        <span className="-mb-2.5 rounded-t-[6px] border border-b-0 border-line bg-surface px-2.5 py-1 text-ink">
          {company.short.toLowerCase()}/{open.quarter}.xbrl
        </span>
        <span className="flex-1" />
        <span className="max-sm:hidden">EDGAR · companyfacts</span>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[230px_1fr_250px] md:min-h-[470px]">
        <nav aria-label="Filings" className="max-h-[220px] overflow-y-auto border-b border-line py-2.5 font-mono text-[12.5px] leading-[1.9] md:max-h-none md:border-r md:border-b-0">
          {tree("spenders", SPENDERS)}
          {tree("receivers", RECEIVERS)}
        </nav>

        <div className="min-w-0 overflow-hidden py-2.5 font-mono text-[12.5px] leading-[1.75]" aria-label={`${company.short}, ${formatQuarter(open.quarter)}`}>
          {lines.map((l, i) => (
            <Ln key={i} n={i + 1}>
              {l}
            </Ln>
          ))}
          {recent.map((q, i) => (
            <Ln key={q.quarter} n={lines.length + i + 1} on={q.quarter === open.quarter}>
              <span className="text-muted">{q.quarter}</span> <span className="tracking-[-1px] text-accent">{"█".repeat(Math.max(1, Math.round(((q.capex ?? 0) / max) * 30)))}</span> <N>{formatMillions(q.capex ?? 0)}</N>
            </Ln>
          ))}
        </div>

        <div className="border-t border-line p-4 text-[13px] md:col-span-2 lg:col-span-1 lg:border-t-0 lg:border-l">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Filing</p>
          <p className="mt-2 font-semibold">{company.name}</p>
          <p className="mt-0.5 text-muted">
            {formatQuarter(open.quarter)} · CIK {Number(company.cik)}
          </p>
          {open.accn && (
            <a href={filingUrl(company.cik, open.accn)} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline">
              Open on EDGAR <ExternalLink className="size-3" aria-hidden />
            </a>
          )}

          <label className="mt-5 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted" htmlFor="ide-base">
            Index base
          </label>
          <select id="ide-base" value={base} onChange={(e) => setBase(e.target.value)} className="mt-2 w-full rounded-[6px] border border-line bg-surface px-2.5 py-2">
            {BASES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>

          <label className="mt-4 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted" htmlFor="ide-view">
            View
          </label>
          <select id="ide-view" value={view} onChange={(e) => setView(e.target.value as StepRoute)} className="mt-2 w-full rounded-[6px] border border-line bg-surface px-2.5 py-2">
            {STEPS.map((st) => (
              <option key={st.route} value={st.route}>
                {st.label}
              </option>
            ))}
          </select>

          <a href={run} onClick={linkClick(run)} className="mt-5 flex items-center justify-center gap-2 rounded-[6px] bg-brand px-4 py-2.5 font-semibold text-on-brand transition hover:opacity-90">
            Run analysis <ArrowRight className="size-4" aria-hidden />
          </a>
          {company.role === "receiver" && <p className="mt-2 text-xs text-muted">Supplier filings open on the supplier read-through.</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 bg-panel px-3.5 py-2 font-mono text-[11.5px] text-panel-muted">
        <span>
          {formatQuarter(h.quarter)} · six spenders <b className="text-panel-ink">{formatMillions(h.capex)}</b>
          <TrustTag kind="data" />
        </span>
        {h.yoy !== null && yearAgo !== null && (
          <span>
            vs {formatQuarter(back(h.quarter, 4))} <b className="text-panel-ink">{signedPct(h.yoy)}</b>
          </span>
        )}
        <span>
          Annual pace <b className="text-panel-ink">{formatMillions(h.runRate)}</b>
        </span>
        <span className="sm:ml-auto">
          {COMPANIES.length} filers · {first}–{h.quarter}
        </span>
      </div>
    </div>
  );
}
