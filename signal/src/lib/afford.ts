// Step 2: who can afford to be online. Monthly income follows a lognormal with the country's mean (GNI per capita ÷ 12)
// and Gini. Being online takes two things: cash for a phone (affordable under 20% of a month's income, GSMA) and a data plan
// (affordable under 2% of monthly income, UN Broadband Commission). Levers change the prices; the share who clear both
// tests is the share who can afford to be online.
import { DATA_PRICE_FALLBACK, DATA_PRICE_PCT_GNI, DATA_TARGET, ENTRY_PHONE_USD, HANDSET_TARGET } from "./assumptions";
import { giniOf, v, type Country } from "./data";
import { lognormal } from "./stats";

export interface AffordSettings {
  /** Monthly price of a 2GB plan, $ (null = the income-group default) */
  dataPrice: number | null;
  /** Entry-level smartphone price, $ */
  phonePrice: number;
  /** Share of the handset price that is tax, and the share of that tax cut (0–1) */
  handsetTax: number;
  handsetTaxCut: number;
  /** Share of the data price that is tax, and the share of that tax cut (0–1) */
  dataTax: number;
  dataTaxCut: number;
  /** Share of the data price paid by a subsidy (0–1) */
  dataSubsidy: number;
  /** Pay-as-you-go handset financing */
  payg: boolean;
  deposit: number;
  months: number;
  markup: number;
  /** Share of financed phones that default, covered by a public guarantee (0–1) */
  defaultRate: number;
}

export const DEFAULT_AFFORD: AffordSettings = {
  dataPrice: null,
  phonePrice: ENTRY_PHONE_USD,
  handsetTax: 0.15,
  handsetTaxCut: 0,
  dataTax: 0.1,
  dataTaxCut: 0,
  dataSubsidy: 0,
  payg: false,
  deposit: 0.15,
  months: 12,
  markup: 0.35,
  defaultRate: 0.15,
};

/** The income-group default for a 2GB plan, $ a month. */
export function defaultDataPrice(c: Country) {
  const pctGni = DATA_PRICE_PCT_GNI[c.income] ?? DATA_PRICE_FALLBACK;
  return ((v(c, "gniPc") ?? 0) * pctGni) / 100 / 12;
}

export function prices(c: Country, s: AffordSettings) {
  const baseData = s.dataPrice ?? defaultDataPrice(c);
  const data = baseData * (1 - s.dataTax * s.dataTaxCut) * (1 - s.dataSubsidy);
  const phone = s.phonePrice * (1 - s.handsetTax * s.handsetTaxCut);
  const installment = s.payg ? (phone * (1 + s.markup) * (1 - s.deposit)) / s.months : 0;
  /** Cash needed in the first month to get a phone */
  const upfront = s.payg ? phone * s.deposit + installment : phone;
  return { baseData, data, phone, installment, upfront };
}

export interface AffordResult {
  meanMonthly: number;
  gini: number;
  giniSource: "wdi" | "quintiles" | "assumed";
  prices: ReturnType<typeof prices>;
  /** Monthly income needed to pass each test, and both */
  needData: number;
  needPhone: number;
  need: number;
  /** Which test binds */
  binding: "phone" | "data";
  shareData: number;
  sharePhone: number;
  share: number;
  people: number;
  /** Mean monthly income of each fifth, poorest first (when the World Bank has quintile shares) */
  quintiles: { income: number; data: number; phone: number; passes: boolean }[] | null;
}

export function afford(c: Country, s: AffordSettings): AffordResult {
  const meanMonthly = (v(c, "gniPc") ?? 0) / 12;
  const { gini, source } = giniOf(c);
  const dist = lognormal(meanMonthly, gini);
  const p = prices(c, s);
  const needData = p.data / DATA_TARGET;
  const needPhone = p.upfront / HANDSET_TARGET;
  const need = Math.max(needData, needPhone);
  const share = dist.shareAbove(need);
  const q = (["q1", "q2", "q3", "q4", "q5"] as const).map((k) => v(c, k));
  const quintiles = q.every((x) => x !== null)
    ? (q as number[]).map((sh) => {
        const income = meanMonthly * 5 * (sh / 100);
        return { income, data: p.data / income, phone: p.upfront / income, passes: income >= need };
      })
    : null;
  return {
    meanMonthly,
    gini,
    giniSource: source,
    prices: p,
    needData,
    needPhone,
    need,
    binding: needPhone >= needData ? "phone" : "data",
    shareData: dist.shareAbove(needData),
    sharePhone: dist.shareAbove(needPhone),
    share,
    people: share * (v(c, "pop") ?? 0),
    quintiles,
  };
}

/** What the price levers cost the public purse each year, if everyone who can afford it is online. */
export function leverCost(s: AffordSettings, r: AffordResult) {
  const users = r.people;
  const dataTaxLost = r.prices.baseData * s.dataTax * s.dataTaxCut * 12;
  const subsidy = r.prices.baseData * (1 - s.dataTax * s.dataTaxCut) * s.dataSubsidy * 12;
  // Handset tax forgone: one phone every three years per user.
  const handsetTaxLost = (s.phonePrice * s.handsetTax * s.handsetTaxCut) / 3;
  return { perUser: dataTaxLost + subsidy + handsetTaxLost, total: users * (dataTaxLost + subsidy + handsetTaxLost), users };
}
