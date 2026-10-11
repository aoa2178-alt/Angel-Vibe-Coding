import type { Scenario } from "@/engine/types";

// "The Transformer Is Late": all names are fictional. Meridian Compute and its suppliers match the case in Tender.
//
// Metrics run 0–100. Effects on each option are deltas applied when the player commits.
// Timing: 75 is "on the date"; each 7.5 points below that is about one month late, and a month late costs about
// $22.3M (Corvid's $14.4M of lease revenue plus $7.9M of capital sitting idle), as in Tender.
// Cost: 30 is "on budget"; each point above that is about $1M of unplanned spend.

const COST_BASELINE = 30;
const MONTH_LATE = 22.3;
const monthsLate = (v: number) => Math.max(0, Math.round((75 - v) / 7.5));

export const transformerIsLate: Scenario = {
  id: "transformer-is-late",
  title: "The Transformer Is Late",
  tagline: "A 96 MW AI hall, a tenant waiting, and the one part you can't make faster.",
  intro: [
    "You run the Hall B program at Meridian Compute: a 96 MW AI data hall with an anchor tenant, Corvid Labs, signed to move in on the energization date.",
    "This morning the transformer supplier told you its factory is full. Your two main transformers will arrive six months late, and every month late costs about $22M.",
  ],
  estMinutes: "5–7 min",
  role: "Program Lead, Hall B",
  company: "Meridian Compute",
  app: { name: "Tender", href: "https://tender-six-iota.vercel.app/bids", label: "Compare the four transformer bids on total cost in Tender" },

  people: {
    rhea: { name: "Rhea Castillo", role: "VP Infrastructure", initials: "RC", tone: "amber" },
    owen: { name: "Owen Park", role: "Procurement Lead", initials: "OP", tone: "sky" },
    lena: { name: "Lena Fischer", role: "Finance Director", initials: "LF", tone: "violet" },
    jonas: { name: "Jonas Weber", role: "Key Account Manager, Volta Electric", initials: "JW", tone: "slate" },
    maya: { name: "Maya Ortiz", role: "Sales Director, Northgate Power", initials: "MO", tone: "emerald" },
    kai: { name: "Kai Brennan", role: "Head of Infrastructure, Corvid Labs", initials: "KB", tone: "rose" },
  },

  metrics: [
    {
      id: "timing",
      label: "Go-live",
      shortLabel: "Go-live",
      hint: "How close Hall B gets to its energization date.",
      higherIsBetter: true,
      describe: (v) => {
        const m = monthsLate(v);
        return m === 0 ? "On the date" : `~${m} month${m === 1 ? "" : "s"} late · ~$${Math.round(m * MONTH_LATE)}M of delay`;
      },
    },
    {
      id: "cost",
      label: "Extra spend",
      shortLabel: "Spend",
      hint: "Unplanned spend on top of the equipment budget. Lower is better.",
      higherIsBetter: false,
      describe: (v) => (v <= COST_BASELINE ? "On budget" : `+$${v - COST_BASELINE}M over budget`),
    },
    {
      id: "trust",
      label: "Tenant confidence",
      shortLabel: "Tenant",
      hint: "How Corvid Labs feels about Meridian right now.",
      higherIsBetter: true,
      describe: (v) => (v >= 80 ? "Committed" : v >= 60 ? "Confident" : v >= 40 ? "Cautious" : v >= 25 ? "Strained" : "Looking elsewhere"),
    },
    {
      id: "risk",
      label: "Supply risk",
      shortLabel: "Risk",
      hint: "Exposure to the next late part, here and on Halls C and D. Lower is better.",
      higherIsBetter: false,
      describe: (v) => (v <= 25 ? "Contained" : v <= 40 ? "Manageable" : v <= 60 ? "Elevated" : v <= 75 ? "High" : "Severe"),
    },
  ],
  initial: { timing: 30, cost: COST_BASELINE, trust: 65, risk: 60 },

  brief: {
    goal: "Energize Hall B for Corvid Labs as close to the date as you can, without buying a problem you'll pay for on Halls C and D.",
    alert: {
      title: "Volta Electric: both main transformers slipping ~6 months",
      body: "Volta's factory is booked solid by utility orders. Its revised date for the two 80 MVA units lands six months after Hall B's energization date. Without them, the hall can't draw power.",
    },
    facts: [
      { label: "Hall B", value: "96 MW of IT · 2 transformers to energize" },
      { label: "Volta's new date", value: "6 months late" },
      { label: "A month late", value: "≈ $22M (lease + idle capital)" },
      { label: "Volta's quote", value: "$5.6M a unit (the cheapest bid)" },
      { label: "Next-best bid", value: "Northgate Power, $6.4M a unit" },
    ],
    messages: [
      { from: "rhea", body: "Corvid is our anchor tenant for Halls B, C and D. I need a plan I can defend to the CEO by Friday, and I don't want to learn about Hall C's transformers the same way." },
      { from: "lena", body: "We picked Volta because it was $800K a unit cheaper. If we now pay to fix that, I want to see the math: what each option costs against what a month of delay costs." },
      { from: "owen", body: "Every transformer factory is running near full. Money buys overtime, not a shorter queue. If we want a different answer, we need a different factory or a reserved slot." },
    ],
  },

  startDecision: "response",

  decisions: {
    response: {
      id: "response",
      step: "Decision 1 · The slip",
      title: "Tuesday, 8:15 a.m. Corvid's weekly call is at 11.",
      situation:
        "Volta is offering to expedite. Northgate Power, the runner-up bid, has two units built for a utility order that was cancelled: close to your spec, available in ten weeks, and still needing a factory test against your design. Your electrical lead says a rented mobile transformer could energize half the hall in eight weeks.",
      messages: [
        { from: "jonas", body: "For $1.5M we'll run weekend shifts and move you up the line. Realistically that's two months back, maybe a bit more. The core-cutting line is the bottleneck, and it's full." },
        { from: "maya", body: "Two units, $6.4M each, on the floor today. We'd test them to your spec at our factory first. If they pass, you have them in about ten weeks." },
      ],
      prompt: "How do you respond to the slip?",
      options: [
        {
          id: "expedite",
          label: "Pay Volta to expedite",
          summary: "Pay Volta's $1.5M premium for weekend shifts and a better place in its queue.",
          benefit: "Cheapest fix on paper, and no new supplier to qualify.",
          cost: "$1.5M of premium, and Hall B still waits on one factory.",
          uncertainty: "Volta's core-cutting line is full. Overtime helps, but the queue in front of you doesn't shrink much.",
          effects: { timing: 15, cost: 2, trust: 0, risk: 6 },
          tags: ["expedite", "single_source"],
          concepts: ["queueing", "cost_of_delay"],
          outcome: {
            headline: "Two months back. Four to go.",
            body: "The weekend shifts helped, but only on the steps that weren't the bottleneck. Volta's new date is four months late. At about $22M a month, the remaining delay still costs around $89M, against a $1.5M premium.",
            messages: [
              { from: "lena", body: "So we paid $1.5M to save $45M of delay. Fine. But we're still $89M exposed and it's all riding on one factory." },
              { from: "kai", body: "Four months is better than six, but our capacity plan assumed this hall. Is that date real, or will it move again?" },
            ],
          },
          next: "next_halls",
        },
        {
          id: "northgate",
          label: "Buy Northgate's ready units",
          summary: "Buy Northgate's two in-stock units at $6.4M each and keep Volta's order as spares for later halls.",
          benefit: "Cuts the critical path: units in about ten weeks, plus a second qualified supplier.",
          cost: "$12.8M of new spend, partly offset by moving Volta's units to Hall C.",
          uncertainty: "The units were built to another customer's spec. Until Northgate's factory test passes, you don't know if they need rework.",
          effects: { timing: 37, cost: 13, trust: 6, risk: -10 },
          tags: ["second_source", "spent_cash"],
          concepts: ["single_source", "cost_of_delay"],
          outcome: {
            headline: "Tested, shipped, one month late.",
            body: "The factory test caught a bushing that needed swapping, which cost two weeks. Hall B energizes about one month late instead of six. Volta's two units, when they arrive, become Hall C's. The $12.8M bought back roughly five months, worth about $110M.",
            messages: [
              { from: "lena", body: "Biggest check of the quarter, and the easiest one I've signed. Write down why, because the board will ask." },
              { from: "kai", body: "One month we can absorb. Thanks for not letting this drift." },
            ],
          },
          next: "next_halls",
        },
        {
          id: "resequence",
          label: "Energize half the hall now",
          summary: "Rent a mobile transformer to energize 48 MW in eight weeks, and bring the other half up when Volta delivers.",
          benefit: "Corvid gets half its capacity close to the date, which halves the monthly cost of the delay.",
          cost: "About $350K a month in rental, plus re-sequencing the fit-out.",
          uncertainty: "Temporary gear on a production hall. The utility has to approve the setup, and it has less redundancy.",
          effects: { timing: 22, cost: 4, trust: 8, risk: 4 },
          tags: ["resequence", "partial_live"],
          concepts: ["critical_path", "cost_of_delay"],
          outcome: {
            headline: "Half the hall, on time.",
            body: "The utility signed off after one redesign. 48 MW went live three weeks after the date, and Corvid moved its first training cluster in. The other half still waits on Volta, six months out, but each month now costs about $11M instead of $22M.",
            messages: [
              { from: "kai", body: "Half on time is a lot better than nothing on time. Our first cluster is running." },
              { from: "owen", body: "We fixed Hall B's critical path without touching the real problem: we still buy every transformer from one busy factory." },
            ],
          },
          next: "next_halls",
        },
      ],
    },

    next_halls: {
      id: "next_halls",
      step: "Decision 2 · The next halls",
      title: "Two weeks later. Halls C and D need six more transformers.",
      situation:
        "Corvid has an option on Halls C and D. Their transformers need ordering now, and every factory is quoting long lead times. Owen has three ways to buy: one hall at a time, a three-year framework with Northgate, or a deposit that reserves factory slots.",
      messages: [
        { from: "maya", body: "Commit to nine units over three years and I'll take 6% off. The price follows the transformer index, which is up about 90% since 2019." },
        { from: "owen", body: "Or a 15% deposit, about $5.8M, reserves slots six months earlier than anyone ordering today. It only pays if we'd otherwise be late." },
        { from: "lena", body: "Whatever we pick, I want the downside in dollars. A deposit is cash tied up. An index-linked price is a number I can't budget." },
      ],
      prompt: "How do you buy the next six transformers?",
      options: [
        {
          id: "spot",
          label: "Buy hall by hall",
          summary: "Order each hall's transformers when its design is final, at whatever price and lead time the market offers.",
          benefit: "No commitment and no cash tied up. You keep every option open.",
          cost: "You take today's queue again, with the same exposure that caused this crisis.",
          uncertainty: "If factories stay full, Halls C and D could slip just like Hall B.",
          effects: { timing: 0, cost: 0, trust: -6, risk: 12 },
          tags: ["spot"],
          concepts: ["queueing"],
          outcome: {
            headline: "Flexible, and exposed.",
            body: "No cash went out. But Hall C's quotes came back at 28 months, longer than its schedule allows, and Corvid's procurement team noticed that nothing had changed.",
            messages: [
              { from: "kai", body: "We're deciding whether to take Halls C and D. Tell me what's different this time." },
              { from: "rhea", body: "We fixed one hall. We didn't fix the process." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "framework",
          label: "Sign a framework with Northgate",
          summary: "Commit to nine units over three years with Northgate at 6% off, with the price linked to the transformer index.",
          benefit: "A second supplier on contract, a volume discount, and priority in Northgate's schedule.",
          cost: "A three-year commitment, and a price that moves with an index that has risen fast.",
          uncertainty: "If the index keeps climbing, the 6% discount can be wiped out. If demand drops, you still owe the volume.",
          effects: { timing: 2, cost: -3, trust: 6, risk: -12 },
          tags: ["framework", "second_source"],
          concepts: ["single_source", "expected_value"],
          outcome: {
            headline: "Two suppliers, one contract.",
            body: "Northgate put Halls C and D in its schedule with dates that fit. Lena flagged the index clause as a budget risk, and finance now tracks it monthly. Corvid's team asked for the supplier plan in writing, and signed for Hall C a week later.",
            messages: [
              { from: "maya", body: "You're in our plan for the next three years. That matters when the factory is full." },
              { from: "lena", body: "I can live with the index if we report it every quarter. No surprises." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "reserve",
          label: "Reserve factory slots",
          summary: "Pay a 15% deposit (about $5.8M) to reserve production slots six months earlier for Halls C and D.",
          benefit: "Buys back the scarcest thing in this market: time in the factory queue.",
          cost: "About $5.8M of cash tied up for up to two years, and less flexibility if plans change.",
          uncertainty: "It only pays if the halls would otherwise be late. If demand for Halls C and D slips, the deposit sits idle.",
          effects: { timing: 4, cost: 6, trust: 8, risk: -14 },
          tags: ["reservation"],
          concepts: ["capacity_reservation", "cost_of_delay"],
          outcome: {
            headline: "Bought the queue.",
            body: "Both halls now have factory slots that land ahead of their energization dates. Six months of avoided delay on a hall is worth over $130M, so the $5.8M deposit is cheap insurance. Lena wants a rule for when deposits are allowed.",
            messages: [
              { from: "kai", body: "Reserved slots is the first thing I've heard from any provider that makes me believe a date." },
              { from: "lena", body: "Good call this time. Now write me the rule, so we don't reserve slots for halls nobody's signed." },
            ],
          },
          next: "recommendation",
        },
      ],
    },
  },

  memo: {
    to: "Rhea Castillo, VP Infrastructure",
    subject: "Hall B transformer slip: recommendation and next steps",
    intro: "Rhea wants a short note before Friday's CEO review. Keep it tight, because she'll forward it as-is.",
    fields: [
      { id: "recommendation", label: "My recommendation", placeholder: "What should Meridian do from here, and why? Put a dollar figure on it.", minLength: 20, multiline: true },
      { id: "risk", label: "Biggest unresolved risk", placeholder: "What could still go wrong, and what would it cost?", minLength: 15, multiline: true },
      { id: "owner", label: "Who owns the next action", placeholder: "One name and the action they own", minLength: 3, suggestions: ["Rhea Castillo (VP Infrastructure)", "Owen Park (Procurement)", "Lena Fischer (Finance)", "Me (Program Lead)"] },
      { id: "tenant", label: "What we tell Corvid", placeholder: "The message, in the words you'd actually use", minLength: 20, multiline: true },
    ],
  },

  debrief: {
    profiles: [
      { when: { tags: ["second_source", "reservation"] }, title: "Bought your way off the critical path, then bought the queue.", body: "You paid real money twice, and both times for the scarcest thing in the market: factory time. Hall B is nearly on time, and Halls C and D have slots that fit." },
      { when: { tags: ["expedite", "spot"] }, title: "Paid for speed, kept the exposure.", body: "The expedite helped a little, and you committed to nothing for the next halls. Hall B is four months late, and Halls C and D face the same queue." },
      { when: { tags: ["resequence", "framework"] }, title: "Moved the critical path, then fixed the supply base.", body: "Half the hall went live on time, and Northgate is now on contract for the next three years. A practical answer to both problems." },
      { when: { tags: ["expedite"] }, title: "Money met a queue.", body: "Paying for overtime bought back two months, but the bottleneck was a full factory, not effort. The rest of your path decided whether that lesson carries to Halls C and D." },
      { when: { tags: ["second_source"] }, title: "Paid a premium to cut the critical path.", body: "The $12.8M looked expensive until you priced the delay it removed: about five months, worth roughly $110M." },
      { when: { tags: ["resequence"] }, title: "Changed the plan instead of fighting the part.", body: "You couldn't make the transformer faster, so you changed what had to wait for it. Half the capacity went live close to the date." },
      { when: {}, title: "You made the calls and lived with the tradeoffs.", body: "No path wins on everything. Here's what yours protected and what it left exposed." },
    ],
    strengths: [
      { when: { tags: ["second_source"] }, title: "You compared the premium with the cost of delay.", body: "A $12.8M purchase against $22M a month of delay is an easy business case once both numbers are on the table." },
      { when: { tags: ["resequence"] }, title: "You found a partial answer when a full one wasn't available.", body: "Energizing half the hall halved the monthly cost of the delay and got the tenant working." },
      { when: { anyTags: ["framework", "second_source"] }, title: "You reduced single-source risk.", body: "A second qualified transformer supplier protects every hall after this one." },
      { when: { tags: ["reservation"] }, title: "You bought time where time was scarce.", body: "In a full market, a reserved factory slot is worth more than a discount." },
      { when: { metrics: { timing: { min: 60 } } }, title: "Hall B is close to its date.", body: "You finished within about two months of energization, which is what Corvid and the CEO were watching." },
      { when: { metrics: { trust: { min: 75 } } }, title: "Corvid is more committed than before.", body: "Your anchor tenant ended the crisis more confident in Meridian, which matters for Halls C and D." },
      { when: { metrics: { risk: { max: 40 } } }, title: "The supply chain is safer than you found it.", body: "You finished with less exposure to the next late part than you started with." },
    ],
    blindSpots: [
      { when: { tags: ["expedite"] }, title: "Overtime doesn't shorten a queue.", body: "Volta's constraint was a full core-cutting line. Ask what the bottleneck is before paying to go faster." },
      { when: { tags: ["spot"] }, title: "Halls C and D face the same queue.", body: "Buying hall by hall keeps flexibility, but it repeats the exposure that caused this crisis." },
      { when: { tags: ["single_source"], notTags: ["framework"] }, title: "Volta is still your only supplier.", body: "One busy factory caused this. Nothing in your path added a second source for the next halls." },
      { when: { tags: ["resequence"] }, title: "Temporary gear is a real risk.", body: "A rented mobile transformer on a production hall has less redundancy. Make sure someone owns its failure plan." },
      { when: { tags: ["framework"] }, title: "The index clause is open-ended.", body: "Transformer prices have risen about 90% since 2019. A 6% discount can disappear if the index keeps climbing. Consider a cap." },
      { when: { tags: ["reservation"] }, title: "A deposit is cash tied up.", body: "If Corvid doesn't take Halls C and D, $5.8M sits idle. Tie future deposits to signed demand." },
      { when: { metrics: { cost: { min: 45 } } }, title: "The overspend needs a board story.", body: "You finished more than $15M over budget. Show what it bought in avoided delay, in dollars." },
      { when: { metrics: { timing: { max: 45 } } }, title: "Hall B is still months late.", body: "Each remaining month costs about $22M. Keep looking for ways to shorten it, even partially." },
    ],
    selfCheck: [
      { when: {}, title: "Did you compare every option with the cost of a month late?", body: "About $22M a month is the yardstick. Any fix that saves a month for less than that pays." },
      { when: {}, title: "Is the owner one named person?", body: "\"Procurement and Finance\" means nobody owns it." },
      { when: { tags: ["second_source"] }, title: "Did you say what happens to Volta's units?", body: "Moving them to Hall C turns a sunk cost into useful stock. Say so." },
      { when: { tags: ["resequence"] }, title: "Does your tenant message say which half goes live, and when the rest follows?", body: "Partial capacity only reassures if the full date is firm." },
      { when: { tags: ["framework"] }, title: "Did you mention the index risk?", body: "Lena will ask what happens to the budget if the index rises another 20%." },
      { when: { tags: ["spot"] }, title: "Did you explain why Halls C and D won't repeat this?", body: "Corvid will ask. \"We'll order earlier\" isn't a plan in a full market." },
    ],
  },
};
