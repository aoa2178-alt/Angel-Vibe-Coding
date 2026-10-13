# Breakeven

**How should we run our AI, and is it worth it?**

Live: https://breakeven-silk.vercel.app · Capstone for the CBS Vibe Coding class (Angel Ade-Oduntan).

Breakeven answers that in three steps, with the numbers entered once and carried through in the URL:

1. **Evaluate AI ROI** (`/worth-it`): does AI pay off for this work? People cost today against people plus AI compute, giving savings, payback and ROI from editable templates.
   - **Is AI the right tool?** The necessity test compares AI with rules automation, a process redesign and no change, on 3-year value in a conservative, base and optimistic case. It ends in Invest, Pilot, Defer, Reject or Don't use AI.
   - **Product mode:** freemium unit economics for an AI product you sell.
2. **Compare compute costs** (`/run-it`): pay per token, rent cloud GPUs, or own them?
   - The cost at your volume and where the answer flips.
   - **Beyond cost:** a scorecard.
   - **Running it well:** response time against utilization, own the base and rent the peaks, and when to retire GPUs.
3. **Power planning** (`/power-it`): if you own, the power you need, what a power budget allows, and the cheapest way to bridge a late grid connection.

Then:
- **Recommendation** (`/result`): the call first, then value against today, what would change it, a 30/60/90 plan and risks. It's printable, and it can send the scenario to an n8n workflow that writes a decision report.
- **Sources** (`/sources`): range, reasoning, source and confidence for every default, plus price history.
- **FAQ** (`/faq`).

Old links (`/calculator`, `/business-case`, `/speed-to-power`, `/methodology`) still work.

## Run it

```bash
npm install
npm run dev     # local dev server
npm test        # 95 tests across the models
npm run build   # type-check and build to dist/
```

## How it works

All the math is in pure, tested functions in `src/lib/`; every rule is written out in plain English in `BREAKEVEN-RULES.md` in the class folder.

| File | What it does |
|---|---|
| `tco.ts` | The cost model: API = tokens × blended price; Rent = GPUs × 730 h × $/GPU-hour; Own = whole 8-GPU servers × (depreciation + support + electricity × PUE + colocation). GPUs needed = average tokens/sec ÷ (throughput × utilization). |
| `roi.ts`, `necessity.ts` | Is it worth it, and is AI the right tool: the business case, alternatives and scenarios, verdict and missing evidence. |
| `freemium.ts` | Product mode: cost per free and paid user, margin, break-even conversion. |
| `scorecard.ts` | Beyond cost: data control, time to launch, quality, ease, flexibility, weighted to a score out of 100. |
| `operate.ts` | Running it well: Erlang C queueing with Kingman variability, Little's Law, hybrid own/rent (newsvendor critical ratio), GPU retirement (sunk cost). |
| `speedToPower.ts` | Bridging a late grid: renting, bridge power, own gas, flexible grid with batteries. |
| `call.ts`, `decisionReport.ts` | The recommendation, and the payload for the n8n decision report. |
| `plan.ts` + `*Share.ts` | One plan shared by every step, kept in the URL; old links redirect. |
| `prices.ts` + `src/data/prices.json` | Dated, sourced price history (API $/M tokens, H100 $/hour), validated by `prices.test.ts`. |

The weekly price watcher (`agents/price-watcher.md`) proposes new price points on a `prices/YYYY-MM-DD` branch for review. It may only append to `prices.json` and never pushes to `main`.

## Data and privacy

- Static site on Vercel: no accounts, no database, no API keys in the browser.
- The only data sent anywhere is the optional decision report: ten scenario fields (no personal data) posted to the n8n webhook when you click the button.

The defaults are illustrative (October 2026), and every one can be edited. "Rent" and "Own" mean running an open-weight model yourself, because frontier models like Claude and GPT are API-only.
