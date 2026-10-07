# Throughline

**How much should we build, and where should it go?**

Throughline is a supply-and-demand planner for two fictional products, with real public US demand data behind them. It answers four questions, then puts the answers on one page:

1. **Forecast** (`/forecast`): three methods (same month last year, 3-month average, Holt-Winters), each scored on the last 12 months it didn't see. The most accurate one sets the plan.
2. **Plan** (`/plan`): safety stock for a service level, order size (EOQ), a 12-month plan, total cost against service level, and a launch quantity (newsvendor).
3. **Allocate** (`/allocate`): cut supply and split what's left across three regions by fair share, priority or most margin.
4. **Ripple** (`/ripple`): the bullwhip effect across a four-tier chain, and what shrinks it.

Then **Brief** (`/brief`): a printable weekly update. **Sources** (`/sources`): the data, every assumption and the methods.

**Products:**
- **Wren tablet:** a consumer device with a holiday peak.
- **Kestrel 8-GPU server:** an AI server with lumpy cloud orders and long lead times.

Both products and their company, Northbeam, are made up. The demand patterns are real:
- US Census retail sales at electronics stores (`MRTSSM443USN`);
- new orders for electronic computers (`U34ANO`).

Both come via FRED, rescaled to units. Kaggle's Walmart M5 data was considered, but its rules forbid publishing it.

Sister apps: [Breakeven](https://breakeven-silk.vercel.app) (how to run AI, and is it worth it) and [Loadline](https://loadline-weld.vercel.app) (can this AI campus go live on time).

## Run it

```bash
npm install
npm run dev                    # local dev server
npm test                       # model and data tests
npm run build                  # type-check and build to dist/
node scripts/build-data.mjs    # refresh src/data/demand.json from FRED
```

## How it works

- `scripts/build-data.mjs`: downloads the two series from FRED and keeps the last 120 months in `src/data/demand.json`.
- `src/lib/`: pure functions, with tests in `models.test.ts`.
  - `products.ts`: products, assumptions and history.
  - `forecast.ts`: methods, WAPE and bias.
  - `supply.ts`: safety stock, EOQ, MRP-style monthly plan, costs, newsvendor launch.
  - `allocate.ts`: allocation rules.
  - `bullwhip.ts`: four-tier order-up-to chain.
  - `scenario.ts`: the scenario in the URL.

An illustrative model for learning and discussion, not any company's plan.
