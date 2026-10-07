import { Frame, useScenario } from "@/components/Frame";
import { Card, SourceLink } from "@/components/ui";
import { PRICES, RETRIEVED, SITES, WAIT_YEARS } from "@/lib/data";

const how = (k: string) => SITES.filter((s) => s.located === k).length;

const DATASETS: { name: string; href: string; license: string; use: string }[] = [
  {
    name: 'Epoch AI, "Frontier Data Centers"',
    href: "https://epoch.ai/data/data-centers",
    license: "CC BY 4.0",
    use: `${SITES.length} US sites: owner, users, current IT power, H100-equivalents, capital cost, and each site's facility-power timeline from satellite imagery, permits and filings.`,
  },
  {
    name: "US Census Geocoder and ZIP Code Gazetteer",
    href: "https://geocoding.geo.census.gov/geocoder/",
    license: "Public domain",
    use: `Map points: ${how("address")} sites at their street address, ${how("zip")} at their ZIP code's center (new builds the geocoder can't match yet), ${how("town")} at the town named in Epoch's sources. Every point is checked to fall inside its state.`,
  },
  {
    name: "EIA Electric Power Monthly, Table 5.6.B",
    href: "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_b",
    license: "Public domain",
    use: `Average price of electricity by state, industrial and commercial, ${PRICES.period.replace(" YTD", " year to date")}.`,
  },
  {
    name: 'Lawrence Berkeley National Laboratory, "Queued Up" interconnection data (through 2025)',
    href: "https://emp.lbl.gov/queues",
    license: "Public, US DOE-funded",
    use: `Median years from interconnection request to operation for power plants that came online ${WAIT_YEARS}, by grid region (25th–75th percentile shown), and active queue capacity. Each state is assigned the region with most of its requests.`,
  },
  {
    name: "us-atlas (Mike Bostock), from US Census cartographic boundaries",
    href: "https://github.com/topojson/us-atlas",
    license: "ISC",
    use: "State outlines, projected to Albers USA once at build time.",
  },
];

const METHODS: [string, string][] = [
  ["Power on a date", "each site's facility power from its Epoch timeline: the last recorded step on or before the date (0 before construction)"],
  ["Power-weighted price and wait", "Σ (state value × AI MW in the state) ÷ Σ AI MW"],
  ["DEA site score", "input-oriented efficiency with two inputs (price, wait) and one shared output: θ = the smallest share of a state's inputs that a convex mix of states still matches. Solved exactly by checking every pair of states"],
  ["Efficient frontier", "states with θ = 1 and no mix of others at least as good on both inputs and better on one (no slack)"],
  ["Benchmark", "the point θ × (price, wait) on the frontier, and the peer states whose mix forms it"],
];

/** Every dataset, its license and use; plus the methods. */
export function Sources() {
  const [s] = useScenario("sources");
  return (
    <Frame route="sources" s={s}>
      <div className="mb-8 max-w-3xl">
        <p className="kicker">Sources</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">All public data</h1>
        <p className="mt-4 text-lg leading-8 text-ink-2">
          Four public datasets, joined by state, rebuilt with one script (<span className="font-mono text-base">scripts/build-data.mjs</span>). Retrieved {RETRIEVED}.
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
          <p className="kicker">Methods</p>
          <dl className="mt-2 divide-y divide-line text-sm">
            {METHODS.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="font-semibold">{k}</dt>
                <dd className="font-mono text-[13px] leading-6 text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-5 text-muted">
            DEA reference: Charnes, Cooper and Rhodes (1978), "Measuring the efficiency of decision making units," European Journal of Operational Research. Grid waits describe power plants, not data
            centers; New England has no wait figure in the sample, and Alaska and Hawaii aren't in the queue data, so they aren't scored. Not investment or siting advice.
          </p>
        </Card>
      </div>
    </Frame>
  );
}
