// Turns SEC XBRL duration facts into calendar-quarter values. Shared by the build script (Node) and the tests.
// Cash-flow items are usually filed year-to-date (3, 6, 9, 12 months from the fiscal-year start), so a quarter is the
// difference between two year-to-date values with the same start. Restated values: the latest filing wins.

const DAY = 24 * 3600 * 1000;
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);

/** The calendar quarter a period ending on `end` belongs to: the quarter containing its midpoint-ish (end − 45 days). */
export function calendarQuarter(end) {
  const d = new Date(Date.parse(end) - 45 * DAY);
  return `${d.getUTCFullYear()}Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

/**
 * @param {{ start?: string, end: string, val: number, filed?: string, form?: string, accn?: string }[]} facts
 * @returns {{ quarter: string, end: string, value: number, accn?: string }[]} sorted by quarter
 */
export function deriveQuarters(facts) {
  // Keep 10-Q / 10-K style durations; dedupe each (start, end) by the latest filing.
  const byPeriod = new Map();
  for (const f of facts) {
    if (!f.start || !f.end) continue;
    if (f.form && !/^10-[QK]/.test(f.form)) continue;
    const key = `${f.start}|${f.end}`;
    const prev = byPeriod.get(key);
    if (!prev || (f.filed ?? "") >= (prev.filed ?? "")) byPeriod.set(key, f);
  }
  const periods = [...byPeriod.values()];
  const quarters = new Map();
  const put = (end, value, accn, direct) => {
    const q = calendarQuarter(end);
    const prev = quarters.get(q);
    // Prefer a directly reported three-month value over a derived one; otherwise the later period end.
    if (!prev || (direct && !prev.direct) || (direct === prev.direct && end > prev.end)) quarters.set(q, { quarter: q, end, value, accn, direct });
  };
  for (const f of periods) {
    const len = days(f.start, f.end);
    if (len >= 80 && len <= 100) {
      put(f.end, f.val, f.accn, true);
      continue;
    }
    if (len < 150 || len > 380) continue;
    // Year-to-date: subtract the year-to-date value that ends about a quarter earlier, with the same start.
    const prior = periods.find((p) => p.start === f.start && days(p.end, f.end) >= 80 && days(p.end, f.end) <= 100);
    if (prior) put(f.end, f.val - prior.val, f.accn, false);
  }
  return [...quarters.values()].sort((a, b) => (a.quarter < b.quarter ? -1 : 1)).map(({ quarter, end, value, accn }) => ({ quarter, end, value, accn }));
}
