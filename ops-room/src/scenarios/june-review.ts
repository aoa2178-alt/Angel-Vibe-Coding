import type { Scenario } from "@/engine/types";

// "The June Review": all names are fictional. Halcyon AI's numbers match Keel's default June review: year to date
// $6.2M behind plan, a $23.3M full-year gap ($660M plan against a $637M re-forecast), the API price cut as the largest
// driver (−$7.2M), and a best-value portfolio of four initiatives that recovers about $8.6M (37%) for $7.7M.
//
// Metrics run 0–100. Forecast: $M = 612 + 0.5 × score, so 50 is $637M. Cash: 30 is "nothing new committed";
// each point above is $0.5M committed, each point below is $0.5M freed up.

const forecastM = (v: number) => Math.round(612 + 0.5 * v);
const CASH_BASELINE = 30;

export const juneReview: Scenario = {
  id: "june-review",
  title: "The June Review",
  tagline: "Six months in, $6.2M behind, and the board meets Thursday.",
  intro: [
    "You run strategy and operations for the commercial team at Halcyon AI. It's the June business review, and revenue is $6.2M behind plan for the year to date.",
    "At today's run-rate the year ends $23.3M short. You have $8M and 15 people left to spend, and an hour with the leadership team before the board pack locks.",
  ],
  estMinutes: "5–7 min",
  role: "Head of Strategy & Operations, Commercial",
  clock: { label: "Until the board meets", count: 3, unit: "days" },
  company: "Halcyon AI",
  app: { name: "Keel", href: "https://keel-one-rho.vercel.app/review", label: "See June's variance bridge and the funding portfolio in Keel" },

  people: {
    elena: { name: "Elena Varga", role: "Chief Revenue Officer", initials: "EV", tone: "amber" },
    sofia: { name: "Sofia Lind", role: "CFO", initials: "SL", tone: "violet" },
    raj: { name: "Raj Mehta", role: "VP Enterprise Sales", initials: "RM", tone: "sky" },
    hana: { name: "Hana Kim", role: "Head of API Product", initials: "HK", tone: "emerald" },
  },

  metrics: [
    {
      id: "forecast",
      label: "Full-year forecast",
      shortLabel: "Forecast",
      hint: "Where the year lands against the $660M plan.",
      higherIsBetter: true,
      describe: (v) => `$${forecastM(v)}M of $660M plan`,
    },
    {
      id: "cash",
      label: "Cash committed",
      shortLabel: "Cash",
      hint: "New spend you've committed this half. Lower is better.",
      higherIsBetter: false,
      describe: (v) =>
        v === CASH_BASELINE ? "Nothing new committed" : v > CASH_BASELINE ? `$${((v - CASH_BASELINE) * 0.5).toFixed(1)}M committed` : `$${((CASH_BASELINE - v) * 0.5).toFixed(1)}M freed up`,
    },
    {
      id: "credibility",
      label: "Board credibility",
      shortLabel: "Board",
      hint: "How much the board trusts the commercial team's numbers.",
      higherIsBetter: true,
      describe: (v) => (v >= 80 ? "High" : v >= 60 ? "Solid" : v >= 40 ? "Questioned" : v >= 25 ? "Doubted" : "Lost"),
    },
    {
      id: "morale",
      label: "Team morale",
      shortLabel: "Morale",
      hint: "How the sales and product teams feel about the plan they're being asked to hit.",
      higherIsBetter: true,
      describe: (v) => (v >= 80 ? "Energized" : v >= 60 ? "Steady" : v >= 40 ? "Uneasy" : v >= 25 ? "Burning out" : "Checked out"),
    },
  ],
  initial: { forecast: 50, cash: CASH_BASELINE, credibility: 60, morale: 65 },

  brief: {
    goal: "Explain the gap honestly, decide what to fund, and give the board a number it can believe.",
    alert: {
      title: "June close: $6.2M behind plan, $23.3M full-year gap",
      body: "Year to date: $292M against a $299M plan. Re-forecast at today's run-rate: $637M against $660M. The biggest single driver is April's 10% API price cut to match a competitor.",
    },
    facts: [
      { label: "Behind plan, year to date", value: "−$6.2M" },
      { label: "Full-year gap", value: "$23.3M" },
      { label: "Largest driver", value: "API price cut, −$7.2M" },
      { label: "Also", value: "Win rate down from 25% to ~21%" },
      { label: "Left to spend", value: "$8M · 15 people" },
    ],
    messages: [
      { from: "elena", body: "The board will ask two things: why, and what we're doing about it. I'd rather answer both than defend a number we don't believe." },
      { from: "sofia", body: "Developers are actually beating plan. The gap is price and win rate. Let's not let one bad story hide a good one." },
      { from: "raj", body: "My reps are working. A competitor entered our enterprise deals in March, and we're losing on price, not effort." },
    ],
  },

  startDecision: "story",

  decisions: {
    story: {
      id: "story",
      step: "Decision 1 · The story",
      title: "Monday, 9 a.m. The board pack locks Wednesday.",
      situation: "Elena wants your view on how to present June. Three framings are on the table, and they set up very different board conversations.",
      messages: [
        { from: "hana", body: "The price cut was the right call. Usage is up because of it. If we only show the revenue hit, it looks like a mistake." },
        { from: "raj", body: "If we lower the number now, my team hears 'the plan's gone soft.' If we keep it, they need a reason to believe it." },
      ],
      prompt: "How do you frame the gap?",
      options: [
        {
          id: "bridge",
          label: "Walk the variance bridge",
          summary: "Show the gap driver by driver: the price cut, win rate and churn against developers beating plan.",
          benefit: "The board sees causes, not just a miss, and the good news on developers doesn't get lost.",
          cost: "It takes the hard conversation head-on: the price cut and the lost deals are both on the slide.",
          uncertainty: "The board may push on whether the price cut was worth it.",
          effects: { forecast: 0, cash: 0, credibility: 12, morale: 2 },
          tags: ["bridge"],
          concepts: ["variance_bridge"],
          outcome: {
            headline: "Causes, not excuses.",
            body: "The bridge showed −$7.2M from the price cut and a smaller hit from win rate, partly offset by developer growth. The board spent its time on the price decision, not on whether to trust the numbers.",
            messages: [
              { from: "elena", body: "That's the first board review where nobody asked 'how do you know?'" },
              { from: "hana", body: "They debated the price cut on its merits. That's all I wanted." },
            ],
          },
          next: "fund",
        },
        {
          id: "reset",
          label: "Reset the forecast now",
          summary: "Lower the full-year forecast to $637M today, with the drivers, and plan to recover from there.",
          benefit: "The earliest possible honest number. No end-of-year surprise.",
          cost: "A visible reset in June, and a team that may hear 'lower targets'.",
          uncertainty: "The board may ask why the plan was wrong in the first place.",
          effects: { forecast: 0, cash: 0, credibility: 8, morale: -6 },
          tags: ["reset"],
          concepts: ["reforecast"],
          outcome: {
            headline: "The number is real now.",
            body: "The board accepted $637M with little argument and asked for a recovery plan by Q3. Sales heard the reset as a softer target, and Raj spent a week re-energizing the team.",
            messages: [
              { from: "sofia", body: "The board likes a number that won't move again. We just bought a quarter of trust." },
              { from: "raj", body: "Half my team thinks we gave up. I'll fix it, but it cost us a week." },
            ],
          },
          next: "fund",
        },
        {
          id: "hold",
          label: "Hold the number",
          summary: "Keep the $660M forecast and present a second-half recovery plan to close the gap.",
          benefit: "No reset headline, and the team keeps an ambitious target.",
          cost: "The plan now needs the second half to beat its own plan by $23M.",
          uncertainty: "If the recovery doesn't land, the reset comes in Q4, when it's much harder to explain.",
          effects: { forecast: 0, cash: 0, credibility: -10, morale: 2 },
          tags: ["hold", "hockey_stick"],
          concepts: ["reforecast", "expected_value"],
          outcome: {
            headline: "A hockey stick on the slide.",
            body: "The board approved the plan, but one director asked for the probability of hitting it. You didn't have one. Sofia added a footnote with the run-rate forecast, which became the slide everyone remembered.",
            messages: [
              { from: "sofia", body: "I can't sign a number I don't believe. The footnote stays." },
              { from: "elena", body: "We've bought ourselves a very loud Q3." },
            ],
          },
          next: "fund",
        },
      ],
    },

    fund: {
      id: "fund",
      step: "Decision 2 · The money",
      title: "Wednesday. $8M and 15 people to commit.",
      situation:
        "Seven proposals came in. Valued by the revenue each adds this year if it works, times the chance it does, the best set that fits the budget recovers about $8.6M, or 37% of the gap. Raj has his own proposal.",
      messages: [
        { from: "raj", body: "Give me ten more enterprise reps. More feet on the street, more deals." },
        { from: "sofia", body: "Our pipeline is the constraint, not selling capacity. Reps can only close what's in the funnel. Show me what each dollar recovers this year." },
      ],
      prompt: "How do you commit the $8M?",
      options: [
        {
          id: "portfolio",
          label: "Fund the best-value portfolio",
          summary: "Fund the four initiatives with the most expected value per dollar: the self-serve upgrade flow, a 5% price rise on the top API tier, the agent product beta and a churn playbook.",
          benefit: "About $8.6M of expected recovery this year, for $7.7M and 14 people.",
          cost: "Uses almost all of the budget and headcount, with nothing left for surprises.",
          uncertainty: "Each initiative has a real chance of not working. The $8.6M is an expected value, not a promise.",
          effects: { forecast: 17, cash: 15.4, credibility: 6, morale: 4 },
          tags: ["portfolio"],
          concepts: ["expected_value"],
          outcome: {
            headline: "A third of the gap, on evidence.",
            body: "The self-serve flow shipped in August and beat its estimate; the agent beta slipped a month. By September the re-forecast had recovered about $8M. The board saw where every dollar went and what it returned.",
            messages: [
              { from: "sofia", body: "This is how I want every budget conversation to go: expected value per dollar, then fund down the list." },
              { from: "raj", body: "I didn't get my reps, but the self-serve flow is feeding my team better leads. I'll take it." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "reps",
          label: "Hire ten more reps",
          summary: "Put $3M of the budget into ten more enterprise sales reps, as Raj asked.",
          benefit: "Visible action, and the sales team feels backed.",
          cost: "About $3M this year, and reps take four months to ramp.",
          uncertainty: "If pipeline is the constraint, new reps have nothing more to close.",
          effects: { forecast: 0, cash: 6, credibility: -6, morale: 8 },
          tags: ["reps"],
          concepts: ["binding_constraint"],
          outcome: {
            headline: "More sellers, same funnel.",
            body: "The new reps ramped through the summer, but the pipeline didn't grow, so they shared the same deals. Forecast didn't move. In September, Sofia asked what the $3M had bought.",
            messages: [
              { from: "raj", body: "The team feels backed. The numbers don't show it yet." },
              { from: "sofia", body: "We added capacity to the step that wasn't the bottleneck. That's a lesson, and an expensive one." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "cut",
          label: "Cut programs to protect margin",
          summary: "Commit nothing new and cut $3M of marketing programs to protect this year's profit.",
          benefit: "Profit holds, and Sofia gets a cleaner margin story.",
          cost: "Less pipeline later this year, and a team asked to close a gap with fewer tools.",
          uncertainty: "Cutting programs saves cash now and may widen next year's gap.",
          effects: { forecast: -2, cash: -6, credibility: 2, morale: -10 },
          tags: ["cut"],
          concepts: ["expected_value"],
          outcome: {
            headline: "Margin protected, pipeline thinner.",
            body: "Profit held for the year. By September, marketing-sourced pipeline was down, and the Q4 forecast slipped another $1M. The board noticed the discipline, and the shrinking pipeline.",
            messages: [
              { from: "sofia", body: "Good discipline. Let's make sure we didn't cut next year's revenue to save this year's margin." },
              { from: "raj", body: "We're being asked to close a bigger gap with less. The team has noticed." },
            ],
          },
          next: "recommendation",
        },
      ],
    },
  },

  memo: {
    to: "Elena Varga, CRO",
    subject: "June review: the gap, the plan and the number for the board",
    intro: "Elena will paste your note into the board pack. Make it the version you'd want read aloud.",
    fields: [
      { id: "recommendation", label: "My recommendation", placeholder: "The number for the board, what we fund, and why.", minLength: 20, multiline: true },
      { id: "risk", label: "Biggest unresolved risk", placeholder: "What could make the second half worse?", minLength: 15, multiline: true },
      { id: "owner", label: "Who owns the next action", placeholder: "One name and the action they own", minLength: 3, suggestions: ["Elena Varga (CRO)", "Sofia Lind (CFO)", "Raj Mehta (Sales)", "Hana Kim (API Product)", "Me (Strategy & Ops)"] },
      { id: "team", label: "What we tell the team", placeholder: "The message to sales and product, in plain words", minLength: 20, multiline: true },
    ],
  },

  debrief: {
    profiles: [
      { when: { tags: ["bridge", "portfolio"] }, title: "Explained the gap, then funded the fix.", body: "The board saw causes, not excuses, and every dollar of the $8M went where it returned the most. A textbook monthly business review." },
      { when: { tags: ["hold", "reps"] }, title: "Held the number, hired for it, and hoped.", body: "The forecast stayed at $660M and the money went to capacity that wasn't the constraint. Q3 will test both calls at once." },
      { when: { tags: ["reset", "cut"] }, title: "Honest and lean.", body: "You gave the board a number it could believe and protected the margin. The risk is that next year's pipeline paid for this year's profit." },
      { when: { tags: ["hold"] }, title: "A promise the second half has to keep.", body: "You kept the full-year number. That only works if the recovery lands; if it doesn't, the reset comes in Q4." },
      { when: { tags: ["portfolio"] }, title: "Funded on expected value.", body: "You picked the set that recovers the most per dollar, which is the defensible answer when every proposal claims to be the priority." },
      { when: {}, title: "You made the calls and lived with the tradeoffs.", body: "Every framing and every budget choice trades something away. Here's what yours protected." },
    ],
    strengths: [
      { when: { tags: ["bridge"] }, title: "You explained the gap by driver.", body: "A variance bridge turns 'we missed' into 'here's why, and here's what's working'." },
      { when: { tags: ["reset"] }, title: "You reset early.", body: "An honest number in June is worth far more than a surprise in December." },
      { when: { tags: ["portfolio"] }, title: "You funded by expected value per dollar.", body: "That's the answer a CFO and a board can audit." },
      { when: { tags: ["cut"] }, title: "You protected the margin.", body: "Cash discipline in a soft half is a real strength, if it doesn't starve the pipeline." },
      { when: { metrics: { credibility: { min: 70 } } }, title: "The board trusts your numbers.", body: "That trust is what lets you ask for money next time." },
      { when: { metrics: { forecast: { min: 65 } } }, title: "You recovered a real share of the gap.", body: "The year now lands closer to plan than the run-rate said it would." },
    ],
    blindSpots: [
      { when: { tags: ["hockey_stick"] }, title: "A hockey stick needs a probability.", body: "If you hold a number, give the board the odds of hitting it. Otherwise the run-rate footnote becomes the real forecast." },
      { when: { tags: ["reps"] }, title: "Reps weren't the constraint.", body: "New ARR was limited by pipeline, not selling capacity. More reps shared the same deals." },
      { when: { tags: ["cut"] }, title: "Cutting programs can cut next year's pipeline.", body: "Marketing spend fills the funnel with a lag. Check what the cut does to Q1." },
      { when: { tags: ["reset"] }, title: "A reset needs a story for the team.", body: "Lower numbers can sound like lower ambition. Pair the reset with the recovery plan." },
      { when: { notTags: ["portfolio"] }, title: "The funding wasn't ranked by return.", body: "Seven proposals, one budget: ranking by expected value per dollar is the most defensible way to choose." },
      { when: { metrics: { morale: { max: 50 } } }, title: "The team is uneasy.", body: "Sales and product are being asked to close a gap they don't fully believe in. Plan a deliberate reset of their targets and tools." },
    ],
    selfCheck: [
      { when: {}, title: "Does your note give the board one number?", body: "\"Between $630M and $660M\" isn't a forecast." },
      { when: {}, title: "Did you name the biggest driver?", body: "The API price cut was −$7.2M. Say whether it was worth it." },
      { when: { tags: ["portfolio"] }, title: "Did you say the $8.6M is expected, not promised?", body: "Each initiative can fail. Give the board the range, not just the average." },
      { when: { tags: ["hold"] }, title: "Did you give the odds of hitting $660M?", body: "A director will ask. Have the answer before they do." },
    ],
  },
};
