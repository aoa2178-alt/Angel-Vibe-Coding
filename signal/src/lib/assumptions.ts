// Every number Signal assumes, with its source and confidence. Each can be edited on the page.

export type Confidence = "Published" | "Derived" | "Estimate";

export interface Assumption {
  label: string;
  value: string;
  source: string;
  href?: string;
  confidence: Confidence;
}

/** ITU's median price of the 2GB data-only mobile broadband basket, % of GNI per capita, by income group (2024). */
export const DATA_PRICE_PCT_GNI: Record<string, number> = {
  "Low income": 7.4,
  "Lower middle income": 2.2,
  "Upper middle income": 1.1,
  "High income": 0.4,
};
export const DATA_PRICE_FALLBACK = 2.2;

/** GSMA: the cheapest internet-enabled handset in low- and middle-income countries, 2024. */
export const ENTRY_PHONE_USD = 54;

/** UN Broadband Commission: entry-level broadband under 2% of monthly income. */
export const DATA_TARGET = 0.02;
/** GSMA: a handset is affordable below about 20% of monthly income. */
export const HANDSET_TARGET = 0.2;

export const ASSUMPTIONS: Assumption[] = [
  {
    label: "Data plan price",
    value: "ITU's median 2GB basket for the income group: 7.4% of GNI per capita (low income), 2.2% (lower middle), 1.1% (upper middle), 0.4% (high), per year ÷ 12",
    source: "ITU, Facts and Figures 2024: ICT price baskets by income group",
    href: "https://www.itu.int/itu-d/reports/statistics/2024/11/10/ff24-affordability-of-ict-services/",
    confidence: "Published",
  },
  {
    label: "Entry-level smartphone",
    value: "$54",
    source: "GSMA, State of Mobile Internet Connectivity 2025 (cheapest internet-enabled handset in low- and middle-income countries, 2024)",
    href: "https://www.gsma.com/somic/",
    confidence: "Published",
  },
  {
    label: "Affordability targets",
    value: "Data under 2% of monthly income; a handset under 20%",
    source: "UN Broadband Commission target 2; GSMA handset affordability threshold",
    href: "https://www.broadbandcommission.org/advocacy-targets/",
    confidence: "Published",
  },
  {
    label: "Income distribution",
    value: "Lognormal with the country's mean (GNI per capita) and Gini",
    source: "World Bank WDI (Gini, else from quintile income shares)",
    confidence: "Derived",
  },
  { label: "Taxes in a handset's price", value: "15% (import duty and VAT; varies widely)", source: "GSMA mobile taxation studies; editable", confidence: "Estimate" },
  { label: "Taxes in a data plan's price", value: "10% (VAT and excise)", source: "GSMA mobile taxation studies; editable", confidence: "Estimate" },
  { label: "Pay-as-you-go handset terms", value: "15% deposit, 12 monthly payments, 35% total markup", source: "Typical PAYG device financing (M-Kopa-style); editable", confidence: "Estimate" },
  {
    label: "Cost to cover a person",
    value: "4G macro site ~$40 per person covered in rural areas, ~$150 in remote ones; small cells and satellite hotspots priced alongside (see Build)",
    source: "Illustrative, scaled to ITU 'Connecting Humanity' totals ($1.5–1.7T of infrastructure for 2.6B people)",
    href: "https://www.itu.int/itu-d/sites/connecting-humanity/",
    confidence: "Estimate",
  },
  { label: "Adoption once covered", value: "50% of newly covered people go online within the horizon", source: "Editable; GSMA's usage gap shows coverage alone isn't enough", confidence: "Estimate" },
  { label: "Operator margin", value: "35% of revenue (EBITDA-like)", source: "Typical emerging-market mobile operator; editable", confidence: "Estimate" },
  { label: "Universal service fund levy", value: "2.5% of telecom revenue", source: "Common levy rate (Nigeria's USPF uses 2.5%); editable", confidence: "Estimate" },
];
