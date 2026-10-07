# Loadline

**Can this AI campus go live on time?**

Loadline takes a real AI data center campus and answers three questions, then puts the answers on one page:

1. **Power** (`/power`): how many megawatts the GPU plan needs at the meter, and the yearly electricity bill.
2. **Timeline** (`/timeline`): when each phase goes live, which milestone it's waiting on (its critical path), and how much slack everything else has.
3. **Delays** (`/delays`): slip transformers, the grid hookup, cooling or GPU deliveries, and see what each month late costs and what to resolve first.

Then **Brief** (`/brief`): one printable page. **Sources** (`/sources`): every public fact with its source and confidence, and every assumption explained.

Case studies: **Crusoe, Abilene TX** (the Stargate campus), **CoreWeave, Lancaster PA**, and **QTS, Cedar Rapids IA**. Public facts come from the companies' announcements and reputable reporting. Milestone dates inside each phase, prices and costs are labeled assumptions you can change. The scenario lives in the URL, so any link reopens it.

Sister app: [Breakeven](https://breakeven-silk.vercel.app), which decides whether to use an API, rent GPUs, or own them, and how to bridge a late grid.

## Run it

```bash
npm install
npm run dev     # local dev server
npm test        # model and data tests
npm run build   # type-check and build to dist/
```

## How it works

- `src/data/campuses.json`: the three case studies (facts with sources and confidence; phases with GPUs or MW, milestone dates and commissioning time) and the GB200 power figure from NVIDIA's reference design.
- `src/lib/model.ts`: the model, pure functions with tests in `model.test.ts`.
  - **Power:** GPUs × kW per GPU = IT MW; × PUE = facility MW; × 8,760 h × average load × $/MWh = yearly electricity.
  - **Go-live:** the latest of the five milestones, plus commissioning. The latest one is the critical path; slack = critical date − each milestone's date.
  - **Cost of a month late:** lost revenue (leased kW × $/kW-month, or GPUs × hours × utilization × $/GPU-hour) plus build cost × cost of capital ÷ 12.
  - **Resolve first:** slip each milestone 3 more months and rank by what the go-live it moves would cost.
- `src/lib/scenario.ts`: the scenario in the URL.
- `src/components/`: `Frame` (step tracker, campus switcher, Back/Next), `Gantt` (timeline with the critical path), `CapacityChart` (MW online over time).

An illustrative model for discussion, not company guidance.
