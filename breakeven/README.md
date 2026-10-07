# Breakeven

**Own, rent, or API? What AI really costs you.**

Breakeven compares what one month of AI inference costs three ways: a pay-per-token API, rented cloud GPUs, or GPUs you own. Pick a preset or enter your monthly token volume, adjust the assumptions, and it shows each option's monthly cost and cost per million tokens, which one is cheapest, and the volumes where the answer changes.

Live: https://breakeven-silk.vercel.app

Features: **Speed-to-Power** (`/speed-to-power`: when the grid connection is late, compare renting, a bridge power service, your own on-site gas, and a flexible grid connection with batteries, and see when each pays off), a guided business case (`/business-case`: ROI → scorecard → cost → a printable summary), a methodology page with sources and confidence ratings for every default, an ownership view (year-1 cash vs total), a sensitivity table (what flips the answer), presets, editable assumptions, a power budget (owned GPUs capped by kW, with rented overflow), rolling-digit cost readouts, a closing-gap cost comparison, a cost projection chart (log scales) with both crossovers marked, "Show calculations", CSV export, and estimates saved in a shareable link. Coming next: price trackers.

## Run it

```bash
npm install
npm run dev     # local dev server
npm test        # cost-model tests
npm run build   # type-check and build to dist/
```

## How it works

- `src/lib/tco.ts`: the cost model (pure functions), defaults and presets. Tests are in `src/lib/tco.test.ts`.
  - **API:** tokens × the blended input/output price.
  - **Rent:** GPUs needed × 730 hours × $/GPU-hour.
  - **Own:** GPUs bought in whole 8-GPU servers × (depreciation + support % of hardware + electricity × PUE + colocation per kW).
  - GPUs needed = average tokens/sec ÷ (throughput per GPU × utilization).
- `src/lib/roi.ts`: the business case's ROI step. People cost today vs people (failed tasks + review) plus AI compute, priced at the cheapest option from the cost model. Four illustrative templates.
- `src/lib/scorecard.ts`: scores API / rent / own on cost (from the model), data control, time to launch, model quality, ease of running and flexibility, weighted 0–5 into a score out of 100.
- `src/lib/businessCaseShare.ts`: a business case lives in the URL, like an estimate.
- `src/lib/speedToPower.ts`: Speed-to-Power. Each way to bridge a late grid is costed as extra spending versus owning on a working grid from day one; until an option is ready you rent. `speedToPowerShare.ts` keeps a scenario in the URL; `bridgeMethodology.ts` holds its sources.
- `src/lib/share.ts`: shareable links (the estimate lives in the URL) and CSV export. Tests are in `src/lib/share.test.ts`.
- `src/components/`: `CostChart` (projection chart), `ClosingBars`, `Odometer`.
- `src/App.tsx`: a tiny router: `/` landing, `/calculator`, `/business-case`, `/speed-to-power`, `/methodology`.

The defaults are illustrative (October 2026) and every one is editable in the app. "Rent" and "Own" mean running an open-weight model yourself; frontier models like Claude and GPT are API-only.
