import { Frame, useScenario } from "@/components/Frame";
import { Card, SourceLink } from "@/components/ui";
import { ASSUMPTIONS } from "@/lib/assumptions";
import { TECHS } from "@/lib/build";
import { COUNTRIES, RETRIEVED, usd } from "@/lib/data";

const DATASETS: { name: string; href: string; license: string; use: string }[] = [
  {
    name: "World Bank, World Development Indicators (API)",
    href: "https://data.worldbank.org/",
    license: "CC BY 4.0",
    use: "Population, rural share, internet users, GNI per capita, Gini and income shares by fifth, poverty, electricity access, mobile subscriptions, account ownership.",
  },
  {
    name: "World Bank, Global Findex 2025 (API)",
    href: "https://www.worldbank.org/en/publication/globalfindex",
    license: "CC BY 4.0",
    use: "Mobile phone and smartphone ownership by group (women, men, rural, urban, poorest 40%, richest 60%), reasons for not owning a smartphone, and mobile money accounts.",
  },
  {
    name: "ITU, Facts and Figures 2024: affordability",
    href: "https://www.itu.int/itu-d/reports/statistics/2024/11/10/ff24-affordability-of-ict-services/",
    license: "Published figures, cited (not bulk-copied)",
    use: "Median price of the 2GB data-only mobile broadband basket by income group, the default data price.",
  },
  {
    name: "GSMA, State of Mobile Internet Connectivity 2025",
    href: "https://www.gsma.com/somic/",
    license: "Published figures, cited",
    use: "Coverage gap by region (Sub-Saharan Africa 10%, South Asia 4%, world 4%) and the $54 entry-level smartphone.",
  },
];

const METHODS: [string, string][] = [
  ["Offline", "population × (1 − share using the internet); the no-signal part = population × coverage gap; the rest is the usage gap"],
  ["Income", "a lognormal with mean = GNI per capita ÷ 12 and the country's Gini: σ = √2 · Φ⁻¹((1 + Gini) ÷ 2), μ = ln(mean) − σ² ÷ 2"],
  ["Can afford", "share with income ≥ max(phone cash ÷ 20%, data price ÷ 2%); pay-as-you-go makes the phone cash = deposit + first payment"],
  ["Lifetime cost", "capex + yearly running cost × annuity(years, rate), per person covered; ÷ adoption for per person connected"],
  ["Budget", "fund the lowest cost per connected person first (fractional knapsack: optimal when areas can be partly funded)"],
  ["The call", "each lever alone vs today's prices: people newly able to afford a phone and data × share with a signal × adoption; public cost = forgone tax or subsidy on every user × annuity, or the pay-as-you-go default guarantee; ranked by public money per person newly online; sensitivities rerun the ranking with one assumption changed"],
  ["Who pays", "operators fund up to the present value of a user's margin (revenue × margin × annuity); the viability gap goes to the universal service fund (levy × telecom revenue × annuity), then government and donors"],
];

/** Every dataset, assumption and method. */
export function Sources() {
  const [s] = useScenario("sources");
  return (
    <Frame route="sources" s={s}>
      <div className="mb-8 max-w-3xl">
        <p className="kicker">Sources</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">Open data, cited assumptions</h1>
        <p className="mt-4 text-lg leading-8 text-ink-2">
          {COUNTRIES.length} countries from the World Bank's free API, rebuilt with one script (<span className="font-mono text-base">scripts/build-data.mjs</span>). Retrieved {RETRIEVED}. Each value shows the latest year
          available.
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <p className="kicker">Datasets</p>
          <ul className="mt-2 divide-y divide-line">
            {DATASETS.map((d) => (
              <li key={d.name} className="grid gap-1 py-3 text-sm leading-6 sm:grid-cols-[16rem_1fr] sm:gap-6">
                <span>
                  <span className="block font-semibold">
                    <SourceLink href={d.href}>{d.name}</SourceLink>
                  </span>
                  <span className="text-xs text-muted">{d.license}</span>
                </span>
                <span className="text-ink-2">{d.use}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="kicker">Assumptions</p>
          <ul className="mt-2 divide-y divide-line">
            {ASSUMPTIONS.map((a) => (
              <li key={a.label} className="grid gap-1 py-3 text-sm leading-6 sm:grid-cols-[14rem_1fr_6rem] sm:gap-6">
                <span className="font-semibold">{a.label}</span>
                <span className="text-ink-2">
                  {a.value}
                  <span className="block text-xs text-muted">{a.href ? <SourceLink href={a.href}>{a.source}</SourceLink> : a.source}</span>
                </span>
                <span className={`self-start rounded-full px-2 py-0.5 text-center font-mono text-[10px] uppercase tracking-wider ${a.confidence === "Estimate" ? "bg-coral-soft text-coral-ink" : "bg-brand-soft text-brand-ink"}`}>
                  {a.confidence}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 overflow-auto rounded-lg border border-line">
            <table className="w-full text-left text-xs">
              <thead className="bg-sunken text-muted">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Technology (estimate)</th>
                  <th className="px-2 py-1.5 text-right font-medium">Capex per person covered: urban · rural · remote</th>
                  <th className="px-2 py-1.5 text-right font-medium">Running cost a year</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {TECHS.map((t) => (
                  <tr key={t.id} className="border-t border-line">
                    <td className="px-2 py-1 font-sans">{t.label}</td>
                    <td className="px-2 py-1 text-right">
                      {usd(t.capex.urban)} · {usd(t.capex.rural)} · {usd(t.capex.remote)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {usd(t.opex.urban)} · {usd(t.opex.rural)} · {usd(t.opex.remote)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <p className="kicker">Methods</p>
          <dl className="mt-2 divide-y divide-line text-sm">
            {METHODS.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="font-semibold">{k}</dt>
                <dd className="font-mono text-[13px] leading-6 text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </Frame>
  );
}
