# Signal

**Who is offline, what would make being online affordable, what would it cost to connect everyone, and who should pay?**

Signal sizes a country's digital divide on World Bank data and turns it into a plan. Nigeria, Kenya, India and Pakistan are the worked cases; any of 205 countries can be picked.

1. **Gap** (`/gap`): people offline, split into the coverage gap (no signal) and the usage gap (a signal but not online); why adults don't own a smartphone; phone and smartphone ownership for women, rural people and the poorest 40%.
2. **Afford** (`/afford`): the share of people who can afford a phone (cash under 20% of a month's income, GSMA) and a 2GB plan (under 2%, UN Broadband Commission), from a lognormal income model. Levers: pay-as-you-go phones on mobile-money rails, tax cuts, data subsidies, and their yearly cost to the budget.
3. **Build** (`/build`): the cheapest technology for each area (4G towers, small cells, satellite hotspots), a budget that connects the most people (cheapest first), and the funding split: operators up to what users repay, then the universal service fund, then government and donors.

Then **Brief** (`/brief`): a printable country memo. **Sources** (`/sources`): datasets, every assumption with its confidence, and the methods.

Sister apps: [Breakeven](https://breakeven-silk.vercel.app), [Loadline](https://loadline-weld.vercel.app), [Throughline](https://throughline-gilt.vercel.app), [Keel](https://keel-one-rho.vercel.app), Tender, Buildout, Where AI Lives.

## Run it

```bash
npm install
npm run dev                    # local dev server
npm test                       # income model, affordability, build and funding by hand, data and scenario tests
npm run build                  # type-check and build to dist/
node scripts/build-data.mjs    # refresh src/data/countries.json from the World Bank API
```

## Data

| Source | License | Used for |
|---|---|---|
| [World Bank WDI](https://data.worldbank.org/) | CC BY 4.0 | Population, internet use, income and inequality, electricity, subscriptions |
| [Global Findex 2025](https://www.worldbank.org/en/publication/globalfindex) | CC BY 4.0 | Phone and smartphone ownership by group, barriers, mobile money |
| [ITU Facts and Figures 2024](https://www.itu.int/itu-d/reports/statistics/2024/11/10/ff24-affordability-of-ict-services/) | Cited figures | Default data price by income group |
| [GSMA State of Mobile Internet Connectivity 2025](https://www.gsma.com/somic/) | Cited figures | Coverage gap by region, entry-level smartphone price |

Technology costs, tax shares and pay-as-you-go terms are labeled estimates and can be edited in the app.
