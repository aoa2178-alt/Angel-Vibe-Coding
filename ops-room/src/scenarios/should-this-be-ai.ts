import type { Scenario } from "@/engine/types";

// "Should This Be AI?": all names are fictional. The numbers match Breakeven's customer-support template and its AI
// necessity test: 20,000 tickets a month at 8 minutes and $40 an hour (about $107K a month of agent time). Over three
// years at 10%, with half of freed hours becoming cash: AI with human review ≈ $810K, rules automation ≈ $166K,
// process redesign ≈ $146K. AI stays positive in the conservative case, so the test says Invest.
//
// Metrics run 0–100. Value: 3-year value in $K = (score − 20) × 15, so 20 is "nothing yet" and 74 is about $810K.

const valueK = (v: number) => Math.round((v - 20) * 15);

export const shouldThisBeAi: Scenario = {
  id: "should-this-be-ai",
  title: "Should This Be AI?",
  tagline: "The CEO wants an AI agent on member support. Is AI the right tool?",
  intro: [
    "You run member support at Larkspur Health: 20,000 tickets a month, about eight minutes each, roughly $107K a month of agent time.",
    "The CEO saw a demo and wants an AI agent live this quarter. Engineering has a cheaper idea, and your team lead has a simpler one. You have a week to recommend.",
  ],
  estMinutes: "5–7 min",
  role: "Head of Support Operations",
  clock: { label: "Until the CEO wants an answer", count: 4, unit: "days" },
  company: "Larkspur Health",
  app: { name: "Breakeven", href: "https://breakeven-silk.vercel.app/worth-it?t=support", label: "Run the AI necessity test on the support case in Breakeven" },

  people: {
    grace: { name: "Grace Liu", role: "COO", initials: "GL", tone: "amber" },
    mateo: { name: "Mateo Silva", role: "Head of Engineering", initials: "MS", tone: "sky" },
    nia: { name: "Dr. Nia Owens", role: "Chief Compliance Officer", initials: "NO", tone: "violet" },
    ben: { name: "Ben Carter", role: "Finance Manager", initials: "BC", tone: "slate" },
    sam: { name: "Sam Okoro", role: "Support Team Lead", initials: "SO", tone: "rose" },
  },

  metrics: [
    {
      id: "value",
      label: "3-year value",
      shortLabel: "Value",
      hint: "Net value over three years, counting half of freed hours as cash.",
      higherIsBetter: true,
      describe: (v) => (valueK(v) <= 0 ? "Nothing yet" : `≈ $${valueK(v)}K over 3 years`),
    },
    {
      id: "experience",
      label: "Member experience",
      shortLabel: "Members",
      hint: "How fast and how well members get answers.",
      higherIsBetter: true,
      describe: (v) => (v >= 80 ? "Excellent" : v >= 60 ? "Good" : v >= 40 ? "Mixed" : v >= 25 ? "Frustrated" : "Complaining loudly"),
    },
    {
      id: "risk",
      label: "Quality and compliance risk",
      shortLabel: "Risk",
      hint: "Chance of a wrong answer about someone's health plan, or a data problem. Lower is better.",
      higherIsBetter: false,
      describe: (v) => (v <= 25 ? "Contained" : v <= 40 ? "Manageable" : v <= 60 ? "Elevated" : v <= 75 ? "High" : "Severe"),
    },
    {
      id: "team",
      label: "Support team",
      shortLabel: "Team",
      hint: "How the 40-person support team feels about the change.",
      higherIsBetter: true,
      describe: (v) => (v >= 80 ? "Bought in" : v >= 60 ? "Steady" : v >= 40 ? "Anxious" : v >= 25 ? "Resisting" : "Leaving"),
    },
  ],
  initial: { value: 20, experience: 60, risk: 35, team: 65 },

  brief: {
    goal: "Recommend how Larkspur should take cost and wait time out of member support, AI or not, and how to roll it out.",
    alert: {
      title: "CEO: \"I want an AI agent on support this quarter.\"",
      body: "After a vendor demo, the CEO asked for an AI agent to answer member tickets. Nobody has yet compared it with the cheaper options, or measured how often it would get a health-plan answer right.",
    },
    facts: [
      { label: "Tickets", value: "20,000 a month · 8 min each" },
      { label: "Agent time", value: "≈ $107K a month" },
      { label: "AI vendor's claim", value: "Resolves 60% · 1-min human review" },
      { label: "Rules engine", value: "Could fully handle ~15% of tickets" },
      { label: "Redesign", value: "Could cut ~10% of handling time" },
    ],
    messages: [
      { from: "grace", body: "I'm not against AI. I'm against buying it because it demoed well. Show me it beats the cheaper options." },
      { from: "nia", body: "These are questions about people's health coverage. A wrong answer is a complaint at best and a regulatory problem at worst. Whatever we do needs a human check." },
      { from: "ben", body: "Freed hours only save money if we don't backfill roles. Tell me how much of this is cash and how much is capacity." },
    ],
  },

  startDecision: "approach",

  decisions: {
    approach: {
      id: "approach",
      step: "Decision 1 · The approach",
      title: "Monday. The CEO wants an answer by Friday.",
      situation:
        "Three approaches are on the table. Breakeven's necessity test puts them side by side on three-year value: AI with human review about $810K, rules automation about $166K, and a process redesign about $146K.",
      messages: [
        { from: "mateo", body: "A rules engine handles the simple 15% (password resets, address changes, ID cards) with zero risk of a made-up answer. Two months to build." },
        { from: "sam", body: "Half our handling time is agents hunting for the right policy page. Better macros and routing would fix a lot of that without any new technology." },
      ],
      prompt: "Which approach do you recommend?",
      options: [
        {
          id: "ai",
          label: "AI agent with human review",
          summary: "Deploy the AI agent on all ticket types, with an agent reviewing each AI answer for about a minute before it goes out.",
          benefit: "By far the most value: about $810K over three years, and it stays positive even if the AI resolves 15 points fewer tickets.",
          cost: "About $50K to set up, plus review time, and a new kind of risk to manage.",
          uncertainty: "The 60% resolution rate is the vendor's number, not Larkspur's. Nobody has measured it on your tickets.",
          effects: { value: 54, experience: 4, risk: 15, team: -8 },
          tags: ["ai"],
          concepts: ["ai_necessity", "expected_value"],
          outcome: {
            headline: "The biggest lever, with real risk attached.",
            body: "The case for AI held up: even the conservative estimate beats both alternatives. The team heard \"AI\" and \"cost\" in the same sentence and started asking about jobs. Dr. Owens wants to know what happens when the AI is confidently wrong.",
            messages: [
              { from: "nia", body: "One minute of review per answer is our safety net. I want to see that it actually catches errors before we trust it." },
              { from: "sam", body: "My team is asking if this replaces them. I need an answer I can give them honestly." },
            ],
          },
          next: "rollout",
        },
        {
          id: "rules",
          label: "Rules automation",
          summary: "Build a rules engine that fully handles the simplest 15% of tickets, and leave the rest with agents.",
          benefit: "No risk of a made-up answer, and engineering owns it end to end.",
          cost: "About $60K to build and $750 a month to maintain, for about $166K of value over three years.",
          uncertainty: "Rules break when policies change. Coverage may be lower than 15% once you see the real tickets.",
          effects: { value: 11, experience: 2, risk: 3, team: -2 },
          tags: ["rules", "left_value"],
          concepts: ["ai_necessity"],
          outcome: {
            headline: "Safe, and small.",
            body: "The rules engine went live and handled the simple tickets cleanly. It's about a fifth of what the AI case was worth, and Grace asked why the bigger option was set aside.",
            messages: [
              { from: "grace", body: "Safe is good. But the CEO will ask what we left on the table, and the answer is about $640K." },
              { from: "mateo", body: "It works and nobody worries about it. That counts for something." },
            ],
          },
          next: "rollout",
        },
        {
          id: "redesign",
          label: "Redesign the process",
          summary: "Fix routing, macros and the knowledge base so agents find answers faster, with no new technology.",
          benefit: "Cheapest and fastest: about $20K, members get faster answers, and the team owns the change.",
          cost: "Only about 10% of handling time comes out, roughly $146K of value over three years.",
          uncertainty: "Process gains fade if nobody maintains the knowledge base.",
          effects: { value: 10, experience: 6, risk: 0, team: 6 },
          tags: ["redesign", "left_value"],
          concepts: ["ai_necessity"],
          outcome: {
            headline: "The team fixed its own process.",
            body: "Within a month, handling time dropped by about 10% and the team was proud of it. It's the least risky option, and also the smallest: Grace pointed out the AI case was worth about five times more.",
            messages: [
              { from: "sam", body: "The team loves this. They designed it." },
              { from: "grace", body: "Good first step. Is it the last step?" },
            ],
          },
          next: "rollout",
        },
      ],
    },

    rollout: {
      id: "rollout",
      step: "Decision 2 · The rollout",
      title: "Two weeks later. How do you roll it out?",
      situation:
        "Whatever you chose needs a rollout plan, and Ben needs to know how the savings show up. The biggest unknown is still whether the numbers you used hold on Larkspur's real tickets.",
      messages: [
        { from: "ben", body: "Half of freed hours becoming cash is an assumption. If we let attrition run, it's more cash. If we keep everyone, it's capacity, not savings." },
        { from: "nia", body: "I'd sleep better with a pilot. Measure first, then scale." },
      ],
      prompt: "How do you roll it out?",
      options: [
        {
          id: "pilot",
          label: "Pilot first and measure",
          summary: "Run six weeks on 10% of tickets. Measure the real resolution rate and review time, and agree the cash share with finance.",
          benefit: "Replaces the vendor's numbers with yours before you scale, and gives compliance its evidence.",
          cost: "Six weeks of delay on the savings.",
          uncertainty: "A pilot can look better than a full rollout if the easiest tickets land in it.",
          effects: { value: -2, experience: 2, risk: -12, team: 6 },
          tags: ["pilot"],
          concepts: ["value_of_information"],
          outcome: {
            headline: "Measured, then scaled.",
            body: "The pilot showed the real numbers, a little worse than promised on complex tickets and better on simple ones. Reviewers caught the errors that mattered. The scale-up plan now rests on Larkspur's data, not a demo.",
            messages: [
              { from: "nia", body: "Now I have evidence. That's what I needed to sign off." },
              { from: "ben", body: "With the measured numbers, the savings case is smaller but solid. I can put it in the budget." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "full",
          label: "Roll out everywhere now",
          summary: "Switch every ticket type over this month to capture the savings as fast as possible.",
          benefit: "The fastest path to the full value.",
          cost: "No time to learn. Errors surface in front of members, not in a pilot.",
          uncertainty: "If the real resolution rate is lower than assumed, you find out at full scale.",
          effects: { value: 3, experience: -6, risk: 12, team: -6 },
          tags: ["full_rollout"],
          concepts: ["expected_value"],
          outcome: {
            headline: "Fast, and bumpy.",
            body: "Savings started immediately. So did the complaints: a handful of wrong coverage answers slipped through on complex tickets in the first two weeks. Dr. Owens paused two ticket types until the review step was tightened.",
            messages: [
              { from: "nia", body: "We found the problems in front of members. That's exactly what I asked us to avoid." },
              { from: "sam", body: "My reviewers were overwhelmed in week one. It's settling down, but that was rough." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "bank",
          label: "Bank the savings now",
          summary: "Freeze hiring and let attrition shrink the team, so most freed hours become cash this year.",
          benefit: "More of the value turns into cash: Ben gets a real budget line.",
          cost: "A smaller team, and less slack for volume spikes or new member programs.",
          uncertainty: "If the change delivers less than expected, you've already cut the people you'd need.",
          effects: { value: 6, experience: -4, risk: 4, team: -14 },
          tags: ["bank_savings"],
          concepts: ["cash_vs_capacity"],
          outcome: {
            headline: "Cash now, slack gone.",
            body: "The hiring freeze turned freed hours into savings Ben could book. Three months later, open enrollment doubled ticket volume and the smaller team struggled to keep up.",
            messages: [
              { from: "ben", body: "This is the first automation project that shows up in my numbers. Thank you." },
              { from: "sam", body: "We're stretched. Open enrollment was hard, and two of my best agents left." },
            ],
          },
          next: "recommendation",
        },
      ],
    },
  },

  memo: {
    to: "Grace Liu, COO",
    subject: "Member support: AI or not, and how we roll it out",
    intro: "Grace will take your note to the CEO. Make the case in numbers, and be clear about what you still don't know.",
    fields: [
      { id: "recommendation", label: "My recommendation", placeholder: "Which approach, why, and what it's worth over three years.", minLength: 20, multiline: true },
      { id: "risk", label: "Biggest unresolved risk", placeholder: "What could make this worth less, or go wrong in front of members?", minLength: 15, multiline: true },
      { id: "owner", label: "Who owns the next action", placeholder: "One name and the action they own", minLength: 3, suggestions: ["Grace Liu (COO)", "Mateo Silva (Engineering)", "Dr. Nia Owens (Compliance)", "Ben Carter (Finance)", "Me (Support Ops)"] },
      { id: "team", label: "What we tell the support team", placeholder: "The message, in the words you'd actually use", minLength: 20, multiline: true },
    ],
  },

  debrief: {
    profiles: [
      { when: { tags: ["ai", "pilot"] }, title: "The right tool, proven before it scaled.", body: "AI was the biggest lever, and you measured it on Larkspur's own tickets before betting the member experience on it. That is what the necessity test's \"Invest\" verdict needs to be safe." },
      { when: { tags: ["ai", "full_rollout"] }, title: "The right tool, rolled out too fast.", body: "The case for AI held up, but you skipped the step that would have told you where it fails. Members found the errors before you did." },
      { when: { tags: ["ai", "bank_savings"] }, title: "Banked the savings before you'd proved them.", body: "AI was the right call and the cash is real, but you cut capacity before measuring how much work the AI really absorbs." },
      { when: { tags: ["left_value"] }, title: "Safe, and smaller than it could be.", body: "You chose the low-risk option. It works, but for this ticket mix the necessity test puts AI at about five times the value. The question is whether the risk was big enough to justify that." },
      { when: {}, title: "You made the calls and lived with the tradeoffs.", body: "Every approach trades value, risk and the team's trust. Here's what yours protected." },
    ],
    strengths: [
      { when: { tags: ["ai"] }, title: "You compared AI with the cheaper options first.", body: "AI won on the numbers, not on the demo. That's the question the necessity test exists to answer." },
      { when: { tags: ["pilot"] }, title: "You bought information before scaling.", body: "A six-week pilot replaced the vendor's 60% with your own number. That's the value of information in practice." },
      { when: { tags: ["redesign"] }, title: "You let the team fix its own process.", body: "Cheap, fast and owned by the people doing the work." },
      { when: { tags: ["rules"] }, title: "You removed the risk of a made-up answer.", body: "On health coverage, a rules engine that can't improvise is a real safety feature." },
      { when: { metrics: { risk: { max: 30 } } }, title: "Quality risk is contained.", body: "You finished with less exposure to a wrong answer than you started with." },
      { when: { metrics: { value: { min: 70 } } }, title: "You captured most of the available value.", body: "Your path ends near the top of what this ticket mix can return over three years." },
    ],
    blindSpots: [
      { when: { tags: ["ai"], notTags: ["pilot"] }, title: "The 60% was never measured.", body: "The vendor's resolution rate drives the whole case. Measuring it on your tickets is the cheapest insurance you can buy." },
      { when: { tags: ["full_rollout"] }, title: "Members found the errors first.", body: "On health questions, the first wrong answer in public costs more than six weeks of delay." },
      { when: { tags: ["bank_savings"] }, title: "Cash or capacity: you chose before you knew.", body: "Freezing hiring locks in the savings, and removes the slack for spikes like open enrollment." },
      { when: { tags: ["left_value"] }, title: "About $650K was left on the table.", body: "For this ticket mix, AI with human review is worth roughly five times the alternatives. If you rejected it on risk, say exactly which risk." },
      { when: { metrics: { team: { max: 45 } } }, title: "The team is anxious.", body: "Automation projects fail quietly when the people who run them don't trust them. Tell the team what changes for them, specifically." },
    ],
    selfCheck: [
      { when: {}, title: "Did you compare against the cheaper options, in dollars?", body: "About $810K for AI, $166K for rules and $146K for redesign over three years." },
      { when: {}, title: "Did you say how much is cash and how much is capacity?", body: "Ben will ask. \"Half, unless we freeze hiring\" is an answer." },
      { when: { tags: ["ai"] }, title: "Did you say how errors get caught?", body: "Dr. Owens needs the review step described, not assumed." },
      { when: {}, title: "Does your message to the team say what happens to their jobs?", body: "Silence on that question gets filled with the worst version." },
    ],
  },
};
