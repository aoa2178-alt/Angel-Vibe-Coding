// "The call" for Tender: who to award, at what price, on what terms, and whether that survives other assumptions.
import { awardOptions, negotiation, ranked, structures } from "./analysis";
import { formatMoney, monthlyDelayCost, type Settings } from "./data";

export function sourcingCall(s: Settings) {
  const t = ranked(s);
  const leader = t[0]!;
  const cheapestQuote = [...t].sort((a, b) => a.price - b.price)[0]!;
  const n = negotiation(s);
  const awards = awardOptions(s);
  const bestAward = awards.reduce((a, b) => (b.total < a.total ? b : a));
  const st = structures(s);
  const bestStructure = st.reduce((a, b) => (b.total < a.total ? b : a));
  /** What picking the cheapest quote would cost us, all-in (mostly the months the hall waits) */
  const avoided = cheapestQuote.total - leader.total;

  const rerun = (label: string, patch: Partial<Settings>) => {
    const s2 = { ...s, ...patch };
    const lead2 = ranked(s2)[0]!.bid.supplier;
    const award2 = awardOptions(s2).reduce((a, b) => (b.total < a.total ? b : a));
    const sameLead = lead2 === leader.bid.supplier;
    const sameAward = award2.label === bestAward.label;
    return {
      label,
      holds: sameLead && sameAward,
      outcome: !sameLead ? `${lead2} becomes the best value, so the award moves.` : `the split changes to: ${award2.label.charAt(0).toLowerCase()}${award2.label.slice(1)}.`,
    };
  };
  const checks = [
    rerun("A month of delay is worth half as much (a weaker lease market)", { leasePerKwMonth: s.leasePerKwMonth / 2 }),
    rerun("We need the transformers 6 months later", { needByMonths: s.needByMonths + 6 }),
    rerun("We need them 6 months sooner", { needByMonths: Math.max(1, s.needByMonths - 6) }),
    rerun("Supplier failure is twice as likely", { disruption: Math.min(1, s.disruption * 2) }),
    rerun("Supplier failure is half as likely", { disruption: s.disruption / 2 }),
  ];
  return { t, leader, cheapestQuote, n, awards, bestAward, bestStructure, avoided, checks, delay: monthlyDelayCost(s).total, money: formatMoney };
}
