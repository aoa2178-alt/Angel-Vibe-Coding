# Breakeven

**How should we run our AI, and is it worth it?**

Breakeven answers that in three steps, with your numbers entered once and carried through:

1. **Worth it** (`/worth-it`): does AI pay off for this work? People cost today vs people plus AI compute: savings, payback and ROI, from editable templates.
2. **Run it** (`/run-it`): pay per token, rent cloud GPUs, or own them? Each option's cost at your volume, where the answer flips, and a scorecard for what fits beyond cost.
3. **Power it** (`/power-it`): if you own, how much power you need, what a power budget allows, and the cheapest way to bridge a late grid connection.

Then **Result** (`/result`): one printable page with the recommendation and the risks. **Sources** (`/sources`) gives the range, reasoning, source and confidence for every default.

Every page shows the same chain, tokens a month → GPUs → power, and the whole plan lives in the URL, so any link reopens it. Old links (`/calculator`, `/business-case`, `/speed-to-power`, `/methodology`) still work.

Live: https://breakeven-silk.vercel.app

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
- `src/lib/plan.ts`: the one plan every step shares. It reads and writes the URL, links step 1's tokens per task to the volume, sizes step 3's cluster from step 2, and redirects old links. `src/components/PlanFrame.tsx` holds the step tracker, workload strip and Back/Next.
- `src/App.tsx`: a tiny router: `/` landing, `/worth-it`, `/run-it`, `/power-it`, `/result`, `/sources`.

The defaults are illustrative (October 2026) and every one is editable in the app. "Rent" and "Own" mean running an open-weight model yourself; frontier models like Claude and GPT are API-only.
