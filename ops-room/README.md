# The Ops Room

An interactive business decision simulator. You play the head of operations at Halcyon Compute, a fictional AI hardware startup. You make calls under pressure with incomplete information, balancing four metrics: launch timing, cost, customer trust and operational risk.

The first scenario is **Four Weeks to Launch**. A cold-plate supplier slips three weeks just before your first customer shipment. You make two decisions (3 × 3 = 9 possible paths), write a short note to the COO, and get a rule-based debrief.

It runs entirely in the browser: no sign-in, database or API key. Progress saves to `localStorage`, so a refresh doesn't lose a run. All companies and people are fictional.

## Run it

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

- `npm run build` type-checks and builds a static site into `dist/`. You can host it on Vercel, Netlify or any static host.
- `npm run preview` serves the built site locally.

## Where to edit content

All scenario text, numbers and rules live in one file:

**`src/scenarios/four-weeks-to-launch.ts`**

| What | Where in the file |
| --- | --- |
| Intro, role and play time | top-level `title`, `tagline`, `intro`, `estMinutes` |
| Characters | `people` (referenced by key in every message) |
| Metrics and their plain-language readouts | `metrics`, `initial` |
| Brief (goal, alert, facts, leadership messages) | `brief` |
| Decisions and options | `decisions`. Each option has `benefit`, `cost`, `uncertainty`, `effects` (metric changes), `outcome`, `tags`, and `next` (the next decision id, or `"recommendation"` to end) |
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
