# Keel

**Are we on plan, why not, and what do we do about it?**

Keel runs the operating rhythm for the commercial org of Halcyon AI, a fictional AI lab that sells an API (usage-based) and enterprise contracts.

1. **Plan** (`/plan`): a driver-based annual plan, with headcount, opex and OKR targets that trace back to the drivers.
   - API: developers × tokens × price.
   - Enterprise: pipeline × win rate, capped by ramped sales capacity, plus churn and expansion.
2. **Review** (`/review`): the monthly business review for any month, comparing plan, actual and re-forecast.
   - A variance bridge splits the gap into driver effects by sequential substitution.
   - A KPI tree shows each driver's status, with alerts and an OKR scorecard.
3. **Prioritize** (`/prioritize`): eight initiatives valued by risk-weighted revenue impact. Keel funds the best set within the budget and headcount left (every combination checked) and shows how much of the gap it closes.

Then **Brief** (`/brief`): a printable leadership update. **Sources** (`/sources`): every assumption and method.

Halcyon AI, its plan, actuals and initiatives are fictional. The actuals are fixed (seeded) so the review tells a consistent story. The API price matches the public list price tracked in [Breakeven](https://breakeven-silk.vercel.app).

Sister apps: [Breakeven](https://breakeven-silk.vercel.app), [Loadline](https://loadline-weld.vercel.app), [Throughline](https://throughline-gilt.vercel.app).

## Run it

```bash
npm install
npm run dev     # local dev server
npm test        # model tests
npm run build   # type-check and build to dist/
```

## How it works

`src/lib/` holds pure functions, with tests in `models.test.ts`:
- `model.ts`: drivers, simulation, OKRs.
- `review.ts`: fixed actuals, re-forecast, variance bridge, status.
- `initiatives.ts`: scoring and funding.
- `scenario.ts`: the scenario in the URL.

An illustrative model for learning and discussion, not any company's plan.
