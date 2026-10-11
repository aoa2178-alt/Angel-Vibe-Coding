import { href, linkClick } from "./Frame";
import { negotiation, ranked, shouldCost, structures } from "@/lib/analysis";
import { formatMoney, type Settings } from "@/lib/data";

const card = "block rounded-[10px] border border-line bg-surface p-4 text-left shadow-[0_14px_30px_rgb(17_17_17/0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgb(17_17_17/0.14)]";
const head = "mb-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted";
const row = "flex justify-between gap-3 py-[3px] text-[12.5px]";
const HATCH = "repeating-linear-gradient(135deg, #d9d4c8 0 4px, #efebe2 4px 8px)";

/**
 * The landing's collage: Tender's own outputs as four overlapping, slightly tilted cards (should-cost, the bids on total
 * cost, the negotiating range, the deal terms). Each card opens its page. On small screens they stack, squared up.
 */
export function Collage({ s }: { s: Settings }) {
  const sc = shouldCost();
  const bids = ranked(s);
  const n = negotiation(s);
  const st = structures(s);
  const best = st.reduce((a, b) => (b.total < a.total ? b : a));
  const cheapestQuote = [...bids].sort((a, b) => a.price - b.price)[0]!;
  const maxBid = Math.max(...bids.map((b) => b.total));
  const lines = [...sc.lines].sort((a, b) => b.cost - a.cost).slice(0, 5);
  const lo = n.floor;
  const hi = n.walkAway;
  const at = (v: number) => `${Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100))}%`;
  const links = { sc: href("should-cost", s), bids: href("bids", s), neg: href("negotiate", s) };
  const place = "lg:absolute lg:w-[48%] lg:min-w-[250px]";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:block lg:h-[540px] lg:relative" aria-label="What Tender produces">
      <a href={links.sc} onClick={linkClick(links.sc)} className={`${card} ${place} lg:left-0 lg:top-2 lg:-rotate-[4deg]`}>
        <p className={head}>Should-cost · one unit</p>
        {lines.map((l) => (
          <p key={l.id} className={row}>
            <span>{l.label.replace(/ \(.*\)/, "")}</span>
            <span className="font-mono">{formatMoney(l.cost)}</span>
          </p>
        ))}
        <p className="mt-2.5 text-xs text-muted">
          Built up: <b className="text-ink">{formatMoney(sc.total)}</b> vs quote {formatMoney(n.quoted)}
        </p>
        <span className="mt-1.5 flex h-2 overflow-hidden rounded-[3px] bg-sunken">
          <i className="block bg-accent" style={{ width: `${(sc.total / n.quoted) * 100}%` }} />
          <i className="block flex-1" style={{ background: HATCH }} />
        </span>
      </a>

      <a href={links.bids} onClick={linkClick(links.bids)} className={`${card} ${place} lg:right-0 lg:top-0 lg:rotate-[3deg]`}>
        <p className={head}>Four bids · total cost of three units</p>
        {bids.map((b, i) => (
          <div key={b.bid.supplier} className="my-1.5">
            <p className={`${row} py-0`}>
              <span>
                {b.bid.supplier} <span className="text-muted">· {b.bid.leadMonths} mo</span>
              </span>
              <span className={`font-mono ${i === 0 ? "font-bold" : ""}`}>{formatMoney(b.total)}</span>
            </p>
            <span className="mt-1 block h-1.5 rounded-sm bg-sunken">
              <i className={`block h-full rounded-sm ${i === 0 ? "bg-accent" : "bg-[#bdb7aa]"}`} style={{ width: `${(b.total / maxBid) * 100}%` }} />
            </span>
          </div>
        ))}
        <p className="mt-1.5 text-[11.5px] leading-4 text-muted">
          The cheapest quote ({cheapestQuote.bid.supplier}, {formatMoney(cheapestQuote.bid.price)}) is the costliest deal: it arrives {cheapestQuote.monthsLate} months late.
        </p>
      </a>

      <a href={links.neg} onClick={linkClick(links.neg)} className={`${card} ${place} lg:left-[2%] lg:top-[280px] lg:rotate-[2deg]`}>
        <p className={head}>Negotiate · price a unit</p>
        <div className="relative mx-1 mb-1 mt-2 h-11">
          <span className="absolute inset-x-0 top-5 h-2 rounded-[3px] bg-[linear-gradient(90deg,var(--brand-soft),#cfe7da)]" />
          {(
            [
              [n.target, "Target", "var(--accent)"],
              [n.quoted, "Quote", "var(--ink)"],
            ] as const
          ).map(([v, l, c]) => (
            <span key={l} className="absolute top-0 -translate-x-1/2 text-center text-[10.5px] font-bold" style={{ left: at(v), color: c }}>
              {l}
              <i className="mx-auto mt-0.5 block h-6 w-0.5" style={{ background: c }} />
            </span>
          ))}
        </div>
        <p className={row}>
          <span>Floor</span>
          <span className="font-mono">{formatMoney(n.floor)}</span>
        </p>
        <p className={row}>
          <b>Target</b>
          <span className="font-mono font-bold text-accent">{formatMoney(n.target)}</span>
        </p>
        <p className={row}>
          <span>Walk away above</span>
          <span className="font-mono">{formatMoney(n.walkAway)}</span>
        </p>
        <p className="mt-1 text-[11.5px] text-muted">Saves {formatMoney(n.savingsAtTarget)} across three units</p>
      </a>

      <a href={links.neg} onClick={linkClick(links.neg)} className={`${card} ${place} lg:right-0 lg:top-[300px] lg:-rotate-[2.5deg]`}>
        <p className={head}>Deal terms</p>
        {st.map((d) => (
          <p key={d.id} className={row}>
            <span className={d === best ? "font-semibold" : ""}>{d.label}</span>
            <span className="font-mono">{formatMoney(d.total)}</span>
          </p>
        ))}
        <p className="mt-1.5 text-[11.5px] text-muted">{best.label} is cheapest all-in</p>
      </a>
    </div>
  );
}

/**
 * Every price for one unit on a single line, from the supplier's floor to our walk-away: should-cost, target and the
 * quote marked in between, labels alternating above and below so they never collide.
 */
export function PriceLine({ s }: { s: Settings }) {
  const n = negotiation(s);
  const lo = Math.min(n.floor, n.shouldCost) * 0.92;
  const hi = Math.max(n.walkAway, n.quoted) * 1.04;
  const x = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const marks = [
    { v: n.floor, short: "Floor", label: "Supplier's floor", sub: "should-cost, 5% margin", color: "#8a857a" },
    { v: n.shouldCost, short: "Should-cost", label: "Should-cost", sub: "built from inputs", color: "var(--part-2)" },
    { v: n.target, short: "Target", label: "Our target", sub: "risen only with costs", color: "var(--accent)" },
    { v: n.quoted, short: "Quote", label: "Their quote", sub: n.best.bid.supplier, color: "var(--ink)" },
    { v: n.walkAway, short: "Walk-away", label: "Our walk-away", sub: `matches ${n.next.bid.supplier}`, color: "var(--risk)" },
  ].sort((a, b) => a.v - b.v);

  return (
    <div className="relative mx-2 h-[190px] sm:mx-6" role="img" aria-label={marks.map((m) => `${m.label} ${formatMoney(m.v)}`).join(", ")}>
      <span className="absolute inset-x-0 top-[94px] h-px bg-line" />
      <span className="absolute top-[88px] h-3.5 rounded-[3px] border border-[var(--part-3)] bg-[linear-gradient(90deg,var(--brand-soft),#cfe7da)]" style={{ left: x(n.zone.low), width: `calc(${x(n.zone.high)} - ${x(n.zone.low)})` }} />
      {marks.map((m, i) => {
        const up = i % 2 === 1;
        return (
          <span key={m.label} className={`absolute text-xs ${i === 0 ? "text-left max-sm:translate-x-0 sm:-translate-x-1/2 sm:text-center" : i === marks.length - 1 ? "text-right max-sm:-translate-x-full sm:-translate-x-1/2 sm:text-center" : "-translate-x-1/2 text-center"} ${up ? "bottom-[102px]" : "top-[102px]"}`} style={{ left: x(m.v) }}>
            {!up && <i className={`mb-1.5 block h-7 w-0.5 ${i === 0 ? "max-sm:ml-0 sm:mx-auto" : i === marks.length - 1 ? "max-sm:ml-auto sm:mx-auto" : "mx-auto"}`} style={{ background: m.color }} />}
            <b className="block whitespace-nowrap" style={{ color: m.color }}>
              <span className="sm:hidden">{m.short}</span>
              <span className="max-sm:hidden">{m.label}</span>
            </b>
            <span className="block font-mono">{formatMoney(m.v)}</span>
            <span className="block whitespace-nowrap text-[10.5px] text-muted max-sm:hidden">{m.sub}</span>
            {up && <i className={`mt-1.5 block h-7 w-0.5 ${i === 0 ? "max-sm:ml-0 sm:mx-auto" : i === marks.length - 1 ? "max-sm:ml-auto sm:mx-auto" : "mx-auto"}`} style={{ background: m.color }} />}
          </span>
        );
      })}
    </div>
  );
}
