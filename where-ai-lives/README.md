# Where AI Lives

**Where is AI being built, what does the grid look like there, and where should the next site go?**

A map of US frontier AI data centers, the power prices and grid-connection waits where they sit, and a site scorer from operations research (Data Envelopment Analysis). All public data.

1. **Map** (`/map`): every US site in Epoch AI's tracker, sized by the facility power it draws on any date from 2023 to the end of 2028's announced builds. States are shaded by AI power. Filter by owner, focus a state.
2. **Grid** (`/grid`): the industrial or commercial power price in each state (EIA), and how long each grid region took to connect new power plants (Berkeley Lab), with AI power weighted on both.
3. **Sites** (`/sites`): a DEA site scorer rates each state on price and wait together, with no hand-picked weights. It draws the efficient frontier and shows each state's benchmark mix of frontier states. Links rerun Loadline or Breakeven at that state's price.

Then **Brief** (`/brief`): a printable one-page site brief. **Sources** (`/sources`): every dataset, license and method.

Sister apps: [Breakeven](https://breakeven-silk.vercel.app), [Loadline](https://loadline-weld.vercel.app), [Throughline](https://throughline-gilt.vercel.app), [Keel](https://keel-one-rho.vercel.app), Tender, Buildout.

## Run it

```bash
npm install
npm run dev                    # local dev server
npm test                       # DEA by hand, data, joins, map-point and scenario tests
npm run build                  # type-check and build to dist/
node scripts/build-data.mjs    # rebuild src/data/*.json from the public sources (downloads land in raw/, git-ignored)
```

## Data

| Source | License | Used for |
|---|---|---|
| [Epoch AI, "Frontier Data Centers"](https://epoch.ai/data/data-centers) | CC BY 4.0 | Sites, owners, power, H100s, capital cost, build timelines |
| [US Census Geocoder](https://geocoding.geo.census.gov/geocoder/) and ZCTA Gazetteer | Public domain | Map points (street address, else ZIP center, else a hand-checked town) |
| [EIA Electric Power Monthly, Table 5.6.B](https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_b) | Public domain | Average power price by state |
| [Berkeley Lab interconnection queue data](https://emp.lbl.gov/queues) | Public | Median request-to-operation years by grid region, queue GW |
| [us-atlas](https://github.com/topojson/us-atlas) | ISC | State outlines |

## How it works

- `src/lib/dea.ts`: input-oriented DEA with two inputs and one shared output. With two inputs the best peer mix lies on the lower-left convex hull, so every pair of states is checked exactly, with no solver. A slack check keeps weakly efficient states off the frontier.
- `src/lib/metrics.ts`: totals by state and owner on a date, state-to-region joins, power-weighted averages.
- `src/lib/scenario.ts`: owner, date, price type and focused state live in the URL, so every view is a shareable link.

Grid waits describe power plants joining the grid, a public proxy for how fast a region adds supply; data centers' own hookup times aren't published consistently. Not siting or investment advice.
