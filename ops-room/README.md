# The Ops Room

An interactive business decision simulator. You play the head of operations at Halcyon Compute, a fictional AI hardware startup. You make calls under pressure with incomplete information, balancing four metrics: launch timing, cost, customer trust and operational risk.

Five scenarios, each 2 decisions × 3 options (9 paths), a short memo and a rule-based debrief:

| Scenario | You play | Numbers from |
| --- | --- | --- |
| **Four Weeks to Launch**: a cold-plate supplier slips three weeks before the first customer shipment | Head of Operations | (standalone) |
| **The Transformer Is Late**: a 96 MW AI hall loses six months on its transformers | Program Lead | [Tender](https://tender-six-iota.vercel.app) |
| **Not Enough to Go Around**: GPU supply drops 30% across three customer regions | Supply Planning Lead | [Throughline](https://throughline-gilt.vercel.app) |
| **The June Review**: $6.2M behind plan with the board meeting Thursday | Head of Strategy & Ops | [Keel](https://keel-one-rho.vercel.app) |
| **Should This Be AI?**: AI, rules automation or process redesign for member support | Head of Support Ops | [Breakeven](https://breakeven-silk.vercel.app) |

The debrief also shows **every path** (all 9 outcomes, yours highlighted), the **ideas behind your calls** (cost of delay, critical path, bullwhip and so on) and a **Run the numbers** link to the matching app.

It runs entirely in the browser: no sign-in, database or API key. Progress saves to `localStorage`, so a refresh doesn't lose a run. All companies and people are fictional.

## Run it

You need Node.js 20 or newer.

```bash
npm install
npm run dev
npm test
```

Then open the URL Vite prints (usually http://localhost:5173).

- `npm run build` type-checks and builds a static site into `dist/`. You can host it on Vercel, Netlify or any static host.
- `npm run preview` serves the built site locally.

## Where to edit content

Each scenario is one file in `src/scenarios/`, registered in `src/scenarios/index.ts`. For example **`src/scenarios/four-weeks-to-launch.ts`**:

| What | Where in the file |
| --- | --- |
| Intro, role and play time | top-level `title`, `tagline`, `intro`, `estMinutes` |
| Characters | `people` (referenced by key in every message) |
| Metrics and their plain-language readouts | `metrics`, `initial` |
| Brief (goal, alert, facts, leadership messages) | `brief` |
| Decisions and options | `decisions`. Each option has `benefit`, `cost`, `uncertainty`, `effects` (metric changes), `outcome`, `tags`, `concepts` (keys in `src/engine/concepts.ts`), and `next` (the next decision id, or `"recommendation"` to end) |
| Link to the app with the numbers | `app` |
| Memo fields | `memo` |
| Debrief feedback | `debrief.profiles` (headline; first match wins), `strengths`, `blindSpots`, `selfCheck`. Each rule has a `when` condition on tags and/or final metric values |

Metrics run from 0 to 100. `higherIsBetter` controls whether a change shows as green or red.

### Adding a scenario

1. Copy `four-weeks-to-launch.ts` to a new file and give it a new `id`.
2. Add it to the list in `src/scenarios/index.ts`.

It shows up on the home screen automatically. In dev mode, `validateScenario` checks the data and warns in the browser console about broken `next` links, unknown metrics or people, and loops.

## How it's built

- **Vite + React + TypeScript**, styled with **Tailwind CSS v4**. The design tokens are in `src/styles.css`.
- `src/engine/` is scenario-agnostic.
  - `types.ts` defines the data shapes.
  - `engine.ts` replays the player's choices to get metrics, a timeline and debrief rules.
  - `storage.ts` saves and loads the run.
- `src/screens/` has one component per stage: Welcome, Brief, Decision, Consequence, Recommendation, Debrief.
- The saved run stores only the player's choices and memo. Metrics are always recalculated from the scenario data, so an edited scenario can't leave a saved run in a broken state.

The written memo is **not** scored. There's no AI integration in this version. The debrief shows the note back to the player with a path-specific self-check list.
