# Tender

**What should it cost, who should we buy from, and on what terms?**

Tender sources the power and cooling equipment for Hall B, a 96 MW AI data hall built by Meridian Compute (a fictional buyer). Its prices are anchored to public US data.

1. **Spend** (`/spend`): spend by category (Pareto), supplier concentration and single-source risk, and the savings each sourcing lever could find.
2. **Should-cost** (`/should-cost`): a cost build-up for one 80 MVA transformer.
   - Inputs: copper, electrical and structural steel, components, labor, overhead, freight and margin, priced from FRED series.
   - An index check compares how fast costs rose since 2019 with how fast prices rose.
3. **Bids** (`/bids`): four fictional bids compared on total cost of ownership.
   - Parts: price, freight and duty, interest on cash paid up front, test failures, and the cost of the hall waiting.
   - Then a weighted scorecard and an award split (single source vs spreading the risk).
4. **Negotiate** (`/negotiate`):
   - the supplier's floor, our target and our walk-away (the bargaining zone);
   - three deal structures: spot, framework agreement and capacity reservation.

Then **Brief** (`/brief`): a printable sourcing recommendation. **Sources** (`/sources`): every series, anchor, assumption and method.

**Public anchors:**
- FRED: transformer, switchgear, generator and electrical equipment price indexes; copper; iron and steel; manufacturing wages.
- GAO-23-106180: large power transformers cost up to $10M.
- Wood Mackenzie Q2 2025, via POWER magazine: 128-week lead times.

The buyer, the suppliers and their bids are fictional.

Sister apps: [Breakeven](https://breakeven-silk.vercel.app), [Loadline](https://loadline-weld.vercel.app), [Throughline](https://throughline-gilt.vercel.app), [Keel](https://keel-one-rho.vercel.app).

## Run it

```bash
npm install
npm run dev                    # local dev server
npm test                       # model and data tests
npm run build                  # type-check and build to dist/
node scripts/build-data.mjs    # refresh src/data/prices.json from FRED
```

## How it works

`src/lib/` holds pure functions, with tests in `models.test.ts`:
- `data.ts`: the case, the bids, the settings.
- `analysis.ts`: spend, should-cost, total cost of ownership, scorecard, award split, negotiation, deal structures.
- `scenario.ts`: the scenario in the URL.

An illustrative model for learning and discussion, not any company's sourcing decision.
