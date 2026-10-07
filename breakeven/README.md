# Breakeven

**Own, rent, or API? What AI really costs you.**

Breakeven compares what one month of AI inference costs three ways: a pay-per-token API, rented cloud GPUs, or GPUs you own. Pick a preset or enter your monthly token volume, adjust the assumptions, and it shows each option's monthly cost and cost per million tokens, which one is cheapest, and the volumes where the answer changes.

Live: https://breakeven-silk.vercel.app

Features: a methodology page with sources for every default, presets, editable assumptions, a power budget (owned GPUs capped by kW, with rented overflow), rolling-digit cost readouts, a closing-gap cost comparison, a cost projection chart (log scales) with both crossovers marked, "Show calculations", CSV export, and estimates saved in a shareable link. Coming next: ROI and vendor steps, and price trackers.

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
  - **Own:** GPUs bought in whole 8-GPU servers × (depreciation + power × PUE + space, staff and upkeep).
  - GPUs needed = average tokens/sec ÷ (throughput per GPU × utilization).
- `src/lib/share.ts`: shareable links (the estimate lives in the URL) and CSV export. Tests are in `src/lib/share.test.ts`.
- `src/components/`: `CostChart` (projection chart), `ClosingBars`, `Odometer`.
- `src/App.tsx`: the page.

The defaults are illustrative (October 2026) and every one is editable in the app. "Rent" and "Own" mean running an open-weight model yourself; frontier models like Claude and GPT are API-only.
