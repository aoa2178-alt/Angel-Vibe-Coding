// "The call": compare every lever on one yardstick, public money per person newly connected, then recommend.
//
// Each affordability lever is tested on its own against today's prices. The people it newly lets afford a phone and data
// are counted only where there's a signal, and only the share who actually go online (the same adoption rate used for
// towers), so every lever is measured the same way. Costs are present values over the planning horizon.
//
// A strategist's point the comparison makes visible: tax cuts and untargeted subsidies are paid on every user, including
// the people who could already afford it (the "deadweight"), so their cost per *new* person is high.
import { DEFAULT_AFFORD, afford, type AffordSettings } from "./afford";
import { allocate, annuity, fullCost, funding, tranches, type BuildSettings } from "./build";
import { v, type Country } from "./data";
import { gap } from "./gap";

export type LeverId = "payg" | "phoneTax" | "dataTax" | "subsidy" | "package" | "towers";

export interface LeverOption {
  id: LeverId;
  label: string;
  /** People newly online because of this lever */
  people: number;
  /** Public money, present value over the horizon */
  publicCost: number;
  /** Public money per person newly online (Infinity if it connects no one) */
  perPerson: number;
  /** Share of the spending that goes to people who could already afford it */
  deadweight: number | null;
  how: string;
}

/** A subsidy level for the comparison (the user's own, or 30% if they haven't set one). */
const SUBSIDY = 0.3;
/** Phones are replaced about every three years. */
const PHONE_LIFE_YEARS = 3;

export function leverOptions(c: Country, a: AffordSettings, b: BuildSettings): LeverOption[] {
  const g = gap(c, b.gap);
  const withSignal = g.pop ? 1 - g.noSignal / g.pop : 0;
  const A = annuity(b.years, b.rate);
  // Today's prices, keeping the user's own price and terms edits.
  const today: AffordSettings = { ...a, payg: false, handsetTaxCut: 0, dataTaxCut: 0, dataSubsidy: 0 };
  const base = afford(c, today);
  const online = (people: number) => people * withSignal * b.adoption;

  const evaluate = (id: LeverId, label: string, s: AffordSettings, yearlyCost: (r: ReturnType<typeof afford>) => number, oneOff: (fresh: number) => number, how: string, paidOnAll: boolean): LeverOption => {
    const r = afford(c, s);
    const fresh = online(Math.max(0, r.people - base.people));
    const publicCost = yearlyCost(r) * A + oneOff(fresh);
    return {
      id,
      label,
      people: fresh,
      publicCost,
      perPerson: fresh > 0 ? publicCost / fresh : Infinity,
      deadweight: paidOnAll && r.people > 0 ? Math.min(1, base.people / r.people) : null,
      how,
    };
  };

  const financed = (s: AffordSettings) => afford(c, s).prices.phone * (1 - s.deposit);
  const guarantee = (s: AffordSettings) => (fresh: number) => fresh * financed(s) * s.defaultRate * (b.years / PHONE_LIFE_YEARS);
  const users = (r: ReturnType<typeof afford>) => online(r.people);
  const sub = a.dataSubsidy > 0 ? a.dataSubsidy : SUBSIDY;

  const payg = { ...today, payg: true };
  const pkg = { ...today, payg: true, dataTaxCut: 1 };
  const list: LeverOption[] = [
    evaluate("payg", "Pay-as-you-go phones, with a default guarantee", payg, () => 0, guarantee(payg), `The state covers ${Math.round(a.defaultRate * 100)}% defaults on financed phones; providers run the loans on mobile money.`, false),
    evaluate("phoneTax", "Remove taxes on phones", { ...today, handsetTaxCut: 1 }, (r) => (users(r) * today.phonePrice * a.handsetTax) / PHONE_LIFE_YEARS, () => 0, "Tax forgone on every phone sold, including to people who'd buy anyway.", true),
    evaluate("dataTax", "Remove taxes on data", { ...today, dataTaxCut: 1 }, (r) => users(r) * r.prices.baseData * a.dataTax * 12, () => 0, "Tax forgone on every data plan, including existing users'.", true),
    evaluate("subsidy", `Subsidize data ${Math.round(sub * 100)}% for everyone`, { ...today, dataSubsidy: sub }, (r) => users(r) * r.prices.baseData * sub * 12, () => 0, "Paid on every user's plan; targeting the poorest would cut this.", true),
    evaluate("package", "Pay-as-you-go phones + no data taxes", pkg, (r) => users(r) * r.prices.baseData * a.dataTax * 12, guarantee(pkg), "Finance the phone, then lower the data price that becomes the next barrier.", true),
  ];

  // Towers: the full coverage plan; public money = the universal service fund plus government and donors.
  const t = tranches(c, b);
  const plan = allocate(t, fullCost(t));
  const arpu = b.arpu ?? afford(c, a).prices.data;
  const split = funding(c, b, arpu, plan);
  const towerPublic = split.usf + split.public;
  list.push({
    id: "towers",
    label: "Build coverage where there's no signal",
    people: plan.users,
    publicCost: towerPublic,
    perPerson: plan.users > 0 ? towerPublic / plan.users : Infinity,
    deadweight: null,
    how: "Towers and satellite for the uncovered; operators fund what users repay, public money the viability gap.",
  });
  return list;
}

/** Ranked by public money per person newly online; levers that connect no one go last. */
export const ranked = (list: LeverOption[]) => [...list].sort((x, y) => x.perPerson - y.perPerson || y.people - x.people);

export interface Sensitivity {
  label: string;
  lead: LeverOption;
  holds: boolean;
}

/** Does the lead recommendation survive if a key assumption is wrong? */
export function sensitivities(c: Country, a: AffordSettings, b: BuildSettings): Sensitivity[] {
  const lead = ranked(leverOptions(c, a, b))[0]!;
  const tests: { label: string; a?: Partial<AffordSettings>; b?: Partial<BuildSettings> }[] = [
    { label: `Twice as many phone loans default (${Math.round(a.defaultRate * 200)}%)`, a: { defaultRate: Math.min(1, a.defaultRate * 2) } },
    { label: "Phones cost 50% more", a: { phonePrice: a.phonePrice * 1.5 } },
    { label: "Data costs 50% more", a: { dataPrice: (a.dataPrice ?? afford(c, DEFAULT_AFFORD).prices.baseData) * 1.5 } },
    { label: "Half as many newly covered people go online", b: { adoption: b.adoption / 2 } },
  ];
  return tests.map((t) => {
    const top = ranked(leverOptions(c, { ...a, ...t.a }, { ...b, ...t.b }))[0]!;
    return { label: t.label, lead: top, holds: top.id === lead.id };
  });
}

/** Baselines for the measures we'd track. */
export function measures(c: Country) {
  return {
    online: v(c, "internet"),
    smartPoor: v(c, "smartPoor"),
    smartWomen: v(c, "smartWomen"),
    smart: v(c, "smart"),
  };
}
