# Buildout

**How much is Big Tech spending on AI, is it paying off, and who's getting the money?**

Buildout tracks the AI build-out quarter by quarter from official SEC filings (the XBRL API behind every 10-Q and 10-K).

1. **Spend** (`/spend`): quarterly capex for six spenders (Microsoft, Alphabet, Amazon, Meta, Apple, Oracle), stacked. Shows the latest quarter, year-on-year growth, annual pace, and capex as a share of operating cash.
2. **Payoff** (`/payoff`): for any spender:
   - capex intensity (capex ÷ revenue);
   - free cash flow after the build;
   - the **depreciation wave** (capex ÷ depreciation: above 1×, future costs keep rising).
3. **Receivers** (`/receivers`):
   - revenue at NVIDIA, Broadcom, Vertiv and Eaton against the spenders' capex, indexed to a base quarter;
   - the read-through: extra supplier revenue per extra dollar of capex.

Then **Note** (`/note`): a printable quarterly note with links to each filing. **Sources** (`/sources`): the tags used per company and the methods.

Sister apps: [Breakeven](https://breakeven-silk.vercel.app), [Loadline](https://loadline-weld.vercel.app), [Throughline](https://throughline-gilt.vercel.app), [Keel](https://keel-one-rho.vercel.app), Tender.

## Run it

```bash
npm install
npm run dev                    # local dev server
npm test                       # derivation, data and metric tests
npm run build                  # type-check and build to dist/
node scripts/build-data.mjs    # refresh src/data/filings.json from SEC EDGAR (after each earnings season)
```

## How it works

- `scripts/build-data.mjs`: fetches each company's XBRL facts, derives calendar quarters from year-to-date filings, and keeps 2019 onward with the filing accession for each value.
- `src/lib/quarters.js`: the derivation (Q2 = six months − Q1, and so on), shared with the tests.
- `src/lib/metrics.ts`: totals, growth, run-rate, intensity, free cash flow, depreciation wave, read-through.

Figures are as filed. For learning and discussion; not investment advice.
