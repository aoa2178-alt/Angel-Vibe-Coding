import type { Scenario } from "@/engine/types";

// "Four Weeks to Launch": all names are fictional.
//
// Metrics run 0–100. Effects on each option are deltas applied when the player commits.
// Cost is budget burn: 35 is "on plan" and each point above that is about $8K of unplanned spend.
// Tags on options drive the debrief rules at the bottom of this file.

const COST_BASELINE = 35;

export const fourWeeksToLaunch: Scenario = {
  id: "four-weeks-to-launch",
  title: "Four Weeks to Launch",
  tagline: "Your first customer is waiting. Your supplier just blinked.",
  intro: [
    "You run operations at Halcyon Compute, a 60-person startup about to ship its first AI inference server, the Meridian-1.",
    "Your first customer was promised delivery in four weeks. This morning, a critical supplier called with bad news. You have incomplete information, three leaders who want different things, and no option that's free.",
  ],
  estMinutes: "5–7 min",
  role: "Head of Operations",
  company: "Halcyon Compute",

  people: {
    dana: { name: "Dana Okafor", role: "COO", initials: "DO", tone: "amber" },
    priya: { name: "Priya Raman", role: "Engineering Lead", initials: "PR", tone: "sky" },
    marcus: { name: "Marcus Hale", role: "Commercial Lead", initials: "MH", tone: "violet" },
    tomas: { name: "Tomas Reyes", role: "Account Manager, Kestrel Thermal", initials: "TR", tone: "slate" },
    ana: { name: "Ana Lindqvist", role: "Sales Engineer, Voss Precision", initials: "AL", tone: "emerald" },
  },

  metrics: [
    {
      id: "timing",
      label: "Launch timing",
      shortLabel: "Timing",
      hint: "Confidence that all 8 units ship by the end of week 4.",
      higherIsBetter: true,
      describe: (v) =>
        v >= 75 ? "Week 4, on plan" : v >= 60 ? "Week 4, thin margin" : v >= 45 ? "Slipping to week 5+" : v >= 30 ? "Slipping to week 6+" : "Week 7 or later",
    },
    {
      id: "cost",
      label: "Cost",
      shortLabel: "Cost",
      hint: "Launch spend against plan. Lower is better.",
      higherIsBetter: false,
      describe: (v) => (v <= COST_BASELINE ? "On plan" : `+$${(v - COST_BASELINE) * 8}K over plan`),
    },
    {
      id: "trust",
      label: "Customer trust",
      shortLabel: "Trust",
      hint: "How Brightline Genomics feels about Halcyon right now.",
      higherIsBetter: true,
      describe: (v) => (v >= 80 ? "Advocate" : v >= 60 ? "Confident" : v >= 40 ? "Cautious" : v >= 25 ? "Strained" : "At risk"),
    },
    {
      id: "risk",
      label: "Operational risk",
      shortLabel: "Risk",
      hint: "Supply, quality and team exposure. Lower is better.",
      higherIsBetter: false,
      describe: (v) => (v <= 25 ? "Contained" : v <= 40 ? "Manageable" : v <= 60 ? "Elevated" : v <= 75 ? "High" : "Severe"),
    },
  ],
  initial: { timing: 55, cost: COST_BASELINE, trust: 70, risk: 50 },

  brief: {
    goal: "Ship 8 Meridian-1 servers to Brightline Genomics by the end of week 4.",
    alert: {
      title: "Kestrel Thermal: cold plate delivery slipping ~3 weeks",
      body: "Kestrel's resin supplier has cut their allocation. Kestrel's revised date lands in week 7. Without liquid-cooling cold plates, no Meridian-1 can pass burn-in.",
    },
    facts: [
      { label: "Order", value: "8 units · $1.2M" },
      { label: "Promised", value: "End of week 4" },
      { label: "Kestrel's new date", value: "Week 7" },
      { label: "Plates on hand", value: "Enough for 3 units" },
      { label: "Engineering", value: "Fully booked on firmware" },
    ],
    messages: [
      {
        from: "dana",
        body: "The board meets in three weeks. I don't want to explain a missed first shipment, and I don't want to explain another $200K of unplanned spend either. We have 14 months of runway and every dollar has a job. Bring me options, not panic.",
      },
      {
        from: "priya",
        body: "Cold plates aren't a commodity. Any new source needs flatness checks, pressure-drop tests and a 72-hour thermal soak. My team is heads-down on firmware bring-up, so anything I take on comes out of that.",
      },
      {
        from: "marcus",
        body: "Brightline is our reference logo and three prospects are waiting to hear how it goes. Their CTO has a grant milestone riding on this capacity. If we're going to be late, they need to hear it from us first.",
      },
    ],
  },

  startDecision: "immediate",

  decisions: {
    immediate: {
      id: "immediate",
      step: "Decision 1 · Immediate response",
      title: "Monday, 9:40 a.m. The 2 p.m. customer call is coming.",
      situation:
        "Kestrel's account manager is standing by. Voss Precision, a supplier you've never used, has 40 cold plates in stock built to a similar drawing and a quote ready. Marcus has a call with Brightline at 2 p.m. and needs to know what to say.",
      messages: [
        { from: "tomas", body: "We can put you at the front of the line with weekend shifts and air freight. The expedite fee is about $180K. I'll push for more resin, but I can't promise what our supplier releases." },
        { from: "ana", body: "We have 40 plates on the shelf, built for a customer who cancelled. They're close to your spec. I can ship in five days, but they're unqualified on your system." },
      ],
      prompt: "How do you respond to the supplier delay?",
      options: [
        {
          id: "expedite",
          label: "Expedite Kestrel",
          summary: "Pay Kestrel's expedite fee for weekend shifts, priority resin allocation and air freight.",
          benefit: "Fastest path if it works. There are no new parts to qualify, and engineering stays on firmware.",
          cost: "About $180K of premium, all of it unbudgeted.",
          uncertainty: "Kestrel promises priority allocation but can't confirm how much resin its own supplier will release.",
          effects: { timing: 10, cost: 22, trust: 0, risk: 8 },
          tags: ["expedite", "spent_cash", "single_source"],
          concepts: ["cost_of_delay", "queueing"],
          outcome: {
            headline: "Kestrel delivered, partly.",
            body: "The expedite fee bought weekend shifts and a charter slot, but it couldn't buy resin. Kestrel's supplier released 60% of the requested allocation. By Friday you have plates for 5 of 8 units and a $176K invoice.",
            messages: [
              { from: "tomas", body: "I can get you the rest in 10 days if Halcyon commits to 12 months of exclusive volume. That's what lets me justify the allocation upstairs." },
              { from: "dana", body: "So we paid $176K and we still don't have all the parts?" },
            ],
          },
          next: "kestrel_terms",
        },
        {
          id: "second_source",
          label: "Qualify Voss",
          summary: "Buy Voss's in-stock plates and run an accelerated qualification on Meridian-1.",
          benefit: "Parts arrive in 5 days, and you get a second source you'll need eventually anyway.",
          cost: "About $65K for parts and test time, plus roughly two weeks of Priya's team.",
          uncertainty: "Voss has never built to your exact spec. You won't know thermal performance until the 72-hour soak.",
          effects: { timing: 6, cost: 8, trust: 0, risk: 5 },
          tags: ["second_source"],
          concepts: ["single_source"],
          outcome: {
            headline: "Voss parts arrived. One test unit ran hot.",
            body: "Voss shipped in four days. Priya pulled two engineers off firmware to run qualification. Three of four test units passed the 72-hour soak. The fourth showed a 9°C hot spot on the GPU plate under sustained load, traced to plate flatness at the edge of tolerance.",
            messages: [
              { from: "priya", body: "Three passes and one fail isn't a qualification. It's a coin flip with better odds. I can fix it or we can screen for it, and either one costs something." },
              { from: "ana", body: "We can lap the plates to a tighter flatness, or you can screen incoming parts and send the rejects back. Your call." },
            ],
          },
          next: "voss_hotspot",
        },
        {
          id: "revise_plan",
          label: "Reset the plan with Brightline",
          summary: "Call Brightline today and propose 3 units on the promised date using the plates on hand, with the other 5 arriving three weeks later.",
          benefit: "It's cheap, it's honest, and it's a date you can actually hit.",
          cost: "You tell your first customer about a miss before trying to fix it. Marcus will not love this.",
          uncertainty: "Their CTO may appreciate the candor. Their procurement team may not.",
          effects: { timing: -8, cost: 2, trust: -12, risk: -12 },
          tags: ["early_reset", "transparent", "single_source"],
          concepts: ["reforecast"],
          outcome: {
            headline: "Brightline took the call. Procurement took notes.",
            body: "Brightline's CTO was disappointed but thanked Marcus for calling early; she'd rather plan around a real date than a hopeful one. Two hours later, their procurement team came back. They'll accept the phased plan only with a firm date for the last 5 units and a late-delivery penalty.",
            messages: [
              { from: "marcus", body: "Honestly, it went better than I feared. But procurement wants 2% of the remaining order value for every week we're late, about $15K a week, and they want it in writing today." },
              { from: "dana", body: "A penalty clause in our first contract becomes the template for every contract after it." },
            ],
          },
          next: "brightline_penalty",
        },
      ],
    },

    kestrel_terms: {
      id: "kestrel_terms",
      step: "Decision 2 · The supplier's price",
      title: "Kestrel wants a year of loyalty for the last 40%.",
      situation:
        "You have plates for 5 of 8 units. Kestrel will release the rest within 10 days, but only if Halcyon signs a 12-month exclusive at current pricing, about 9% above Voss's quote. Brightline asked this morning whether week 4 still holds.",
      messages: [
        { from: "dana", body: "We've already spent $176K. Now they want exclusivity? The board will ask why we're handing our supply chain to the vendor who just missed." },
        { from: "priya", body: "If you want Voss qualified in parallel, it comes out of firmware bring-up. I can't do both at full speed." },
        { from: "marcus", body: "Brightline pinged me directly. They're planning their grant demo around week 4." },
      ],
      prompt: "How do you get the remaining units?",
      options: [
        {
          id: "sign_exclusive",
          label: "Sign the 12-month exclusive",
          summary: "Commit to Kestrel as your only cold-plate source for a year in exchange for the remaining allocation.",
          benefit: "All 8 units ship in week 4, exactly as promised.",
          cost: "Pricing about 9% above Voss for a year, and no second source until the exclusive ends.",
          uncertainty: "You're betting a year of supply on a vendor whose own supply chain just failed.",
          effects: { timing: 12, cost: 6, trust: 6, risk: 14 },
          tags: ["lock_in", "full_ship"],
          concepts: ["single_source", "sunk_cost"],
          outcome: {
            headline: "All eight shipped on time.",
            body: "Kestrel found the resin. Eight Meridian-1 units left the dock on the last day of week 4, and Brightline's CTO posted a photo of the rack. Meanwhile, legal flagged that the exclusive has no exit clause if Kestrel misses again, and the premium adds about $110K over the year.",
            messages: [
              { from: "marcus", body: "That rack photo is already in two prospect conversations. Good week." },
              { from: "dana", body: "I'll have to explain the exclusive to the board. Help me write that paragraph." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "ship_partial",
          label: "Ship 5, reset the last 3",
          summary: "Ship the 5 units you have plates for on the promised date. Tell Brightline the last 3 arrive in week 6 on Kestrel's normal allocation.",
          benefit: "No new commitments and no new spend. Brightline gets most of its capacity on day one.",
          cost: "It's still a miss, after you already paid $176K to avoid one.",
          uncertainty: "Whether Brightline's workloads can actually start on 5 of 8 nodes.",
          effects: { timing: -4, cost: 0, trust: -8, risk: -4 },
          tags: ["partial_ship", "transparent"],
          concepts: ["allocation"],
          outcome: {
            headline: "Five on time, three late, one awkward call.",
            body: "Brightline brought 5 nodes online in week 4 and started a reduced pipeline. The last 3 shipped in week 6. Their CTO was measured: she'd rather have known on day one. The expedite spend stays on the books with a partial result to show for it.",
            messages: [
              { from: "marcus", body: "They're fine. Not happy, but fine. Reference calls will be lukewarm for a quarter." },
              { from: "priya", body: "At least my team stayed on firmware. Bring-up finished on schedule." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "parallel_voss",
          label: "Qualify Voss in parallel",
          summary: "Take Kestrel's partial lot and skip the exclusive. Qualify Voss for the last 3 units using Priya's already-booked team.",
          benefit: "Ends single-source dependence without a year-long commitment.",
          cost: "Two engineers leave firmware bring-up for two weeks, and you add more parts and test spend.",
          uncertainty: "Whether Voss parts pass, and how far firmware slips as a result.",
          effects: { timing: -6, cost: 8, trust: -2, risk: -10 },
          tags: ["second_source", "overloaded_engineering", "partial_ship"],
          concepts: ["single_source", "binding_constraint"],
          outcome: {
            headline: "Second source qualified. Firmware paid for it.",
            body: "Voss plates passed after one flatness rework. Five units shipped in week 4 and the last three in week 5 on Voss plates. Firmware release slipped four days, and two of Priya's engineers worked back-to-back weekends. You now have a qualified second source.",
            messages: [
              { from: "priya", body: "We got there. But one of my engineers asked to talk about workload, and that conversation isn't about cold plates." },
              { from: "dana", body: "Another $60K on top of the expedite. Is this the last surprise?" },
            ],
          },
          next: "recommendation",
        },
      ],
    },

    voss_hotspot: {
      id: "voss_hotspot",
      step: "Decision 2 · Quality concern",
      title: "One in four Voss units runs hot under sustained load.",
      situation:
        "The hot spot only appears under long, heavy workloads, which is exactly how Brightline will run these servers. Kestrel is still three weeks out. You have Voss plates for all 8 units, and a 25% chance any given one has the flatness problem.",
      messages: [
        { from: "priya", body: "I won't ship a unit that throttles in the customer's lab without them knowing. Give me a week and I'll make it right." },
        { from: "marcus", body: "Brightline runs genomics pipelines 24/7, so sustained load is their whole use case. But their grant demo is tied to week 4." },
        { from: "dana", body: "Every week of rework is burn. What's the smallest fix that doesn't embarrass us?" },
      ],
      prompt: "What do you do about the hot spot?",
      options: [
        {
          id: "rework",
          label: "Fix it properly",
          summary: "Have Voss lap every plate to a tighter flatness, switch to a higher-grade thermal interface material and re-run the soak.",
          benefit: "Every unit ships to spec. No asterisks, and no throttling in the customer's lab.",
          cost: "About a week of schedule and roughly $80K between rework, material and test time.",
          uncertainty: "Whether the rework fully closes the gap. You'll know after the second soak.",
          effects: { timing: -10, cost: 10, trust: -4, risk: -14 },
          tags: ["quality_first", "schedule_slip"],
          concepts: ["cost_of_delay"],
          outcome: {
            headline: "Fixed properly. One week late.",
            body: "All four re-tested units passed with margin. Eight units shipped at the end of week 5. Brightline's CTO wasn't thrilled about the slip, but her infrastructure lead was impressed by the thermal data package you sent with the shipment.",
            messages: [
              { from: "marcus", body: "A week late on our first shipment. I'll get over it, and they mostly have." },
              { from: "priya", body: "This is the version I'd put my name on." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "derate",
          label: "Ship with a disclosed derate",
          summary: "Ship all 8 in week 4 with a firmware cap that keeps temperatures safe by trimming about 8% of peak performance. Tell Brightline and fix it in the field later.",
          benefit: "Every unit arrives on the promised date.",
          cost: "Brightline gets less performance than the spec sheet promises, plus a field fix later.",
          uncertainty: "How Brightline reacts when benchmarks come in 8% low, and whether the field fix works.",
          effects: { timing: 14, cost: 4, trust: -8, risk: 8 },
          tags: ["quality_shortcut", "disclosed_derate", "transparent", "full_ship"],
          concepts: ["expected_value"],
          outcome: {
            headline: "On time, 8% short.",
            body: "All eight shipped in week 4 with the derate. Because you told them first, Brightline wasn't blindsided. But their benchmark report to their board lists the servers as below spec, and they want a dated plan to restore full performance at Halcyon's cost.",
            messages: [
              { from: "marcus", body: "Telling them first saved us. But \"below spec\" is now in writing at our reference customer." },
              { from: "priya", body: "The field fix is a plate swap on 8 units. That means a site visit and another week of my people." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "screen",
          label: "Screen every plate",
          summary: "Measure the flatness of every incoming Voss plate. Build and ship units with passing plates in week 4, and rework the rejects.",
          benefit: "Most units ship on time, all of them to spec, and the call rests on measured data.",
          cost: "About $55K for a screening fixture and test time, and the line slows down.",
          uncertainty: "The yield. If only half the plates pass, most of the order slips anyway.",
          effects: { timing: 4, cost: 7, trust: -2, risk: -6 },
          tags: ["screened", "partial_ship"],
          concepts: ["value_of_information"],
          outcome: {
            headline: "72% yield. Six on time, two late.",
            body: "72% of plates passed screening, enough for 6 units in week 4. The last two shipped in week 5 with reworked plates. The screening fixture is now part of the line, but nobody has fixed why Voss's flatness drifts.",
            messages: [
              { from: "priya", body: "Screening catches the problem. It doesn't solve it. Voss needs to fix their process." },
              { from: "marcus", body: "Six of eight on day one is a story I can tell." },
            ],
          },
          next: "recommendation",
        },
      ],
    },

    brightline_penalty: {
      id: "brightline_penalty",
      step: "Decision 2 · Customer wants a commitment",
      title: "Procurement wants a firm date, with teeth.",
      situation:
        "Brightline will accept 3 units now and 5 later, but only with a firm date for the remainder and a penalty of 2% of their value, about $15K, for every week late. Your only source for the last 5 units is still Kestrel, whose revised date is week 7.",
      messages: [
        { from: "marcus", body: "If we refuse outright, procurement escalates to the CTO and we spend goodwill we just earned. I need something to offer them." },
        { from: "dana", body: "Whatever we sign here becomes the template for every customer after them. Think past this deal." },
        { from: "priya", body: "Week 7 is only safe if Kestrel's new date holds, and we have no second source." },
      ],
      prompt: "How do you answer Brightline's procurement team?",
      options: [
        {
          id: "accept_penalty",
          label: "Accept the firm date and penalty",
          summary: "Sign: the last 5 units by the end of week 7, with a 2% penalty for each week late.",
          benefit: "Closes the deal today and shows Brightline you'll stand behind the date.",
          cost: "Sets a penalty precedent, with about $15K of exposure per week if Kestrel slips again.",
          uncertainty: "Week 7 depends entirely on Kestrel's revised date, and you still have no backup.",
          effects: { timing: 6, cost: 4, trust: 8, risk: 10 },
          tags: ["penalty_exposure"],
          concepts: ["expected_value"],
          outcome: {
            headline: "Signed. Then Kestrel slipped three days.",
            body: "Brightline procurement signed within an hour and the relationship steadied. Kestrel delivered three days past its revised date, so the final units shipped early in week 8. You paid one week's penalty, $15K, and Marcus's team has already asked legal to reuse the clause for the next customer.",
            messages: [
              { from: "dana", body: "Fifteen thousand isn't the problem. The next customer asking for the same clause is." },
              { from: "marcus", body: "They noticed we paid without arguing. That counts for something." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "counter_transparency",
          label: "Counter with transparency",
          summary: "Decline the penalty. Offer weekly supply updates and an on-site Halcyon engineer during Brightline's ramp.",
          benefit: "Protects your contract precedent while giving procurement something real.",
          cost: "Priya loses an engineer to the customer site for a month.",
          uncertainty: "Procurement may escalate to the CTO, and the CTO may side with them.",
          effects: { timing: -2, cost: 4, trust: 6, risk: -2 },
          tags: ["protected_precedent", "engineering_loaned"],
          concepts: ["binding_constraint"],
          outcome: {
            headline: "Procurement blinked. Engineering paid.",
            body: "Procurement escalated, but the CTO liked the on-site offer and signed without a penalty, and the weekly updates kept Brightline informed. Back home, losing an engineer for a month pushed firmware bring-up back a week. The last 5 units shipped at the end of week 7 with firmware finished just in time.",
            messages: [
              { from: "priya", body: "I gave you my best bring-up engineer. Next time, ask me before it's in the offer." },
              { from: "marcus", body: "The on-site engineer is the best sales tool we have. Brightline's team loves her." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "cloud_credits",
          label: "Bridge with cloud credits",
          summary: "Rent GPU cloud capacity for Brightline's grant demo until the last 5 units arrive, at Halcyon's expense. Keep the phased dates with no penalty clause.",
          benefit: "Solves Brightline's actual problem, the grant milestone, without a penalty clause.",
          cost: "About $100K of rented capacity, unbudgeted.",
          uncertainty: "Whether Brightline's workloads port cleanly to cloud instances in time.",
          effects: { timing: 0, cost: 12, trust: 14, risk: 0 },
          tags: ["credits_bridge", "spent_cash"],
          concepts: ["cost_of_delay"],
          outcome: {
            headline: "The demo ran. The bill arrived.",
            body: "Brightline's pipeline ran on rented capacity after a day of porting pain, and the grant demo went ahead on schedule. Procurement dropped the penalty request. Kestrel's revised date held, and the last units shipped in week 7. The credits cost $96K.",
            messages: [
              { from: "dana", body: "We just paid a customer to be patient. That's fine once. Make sure it's once." },
              { from: "marcus", body: "Their CTO called me to say thanks. That's a first." },
            ],
          },
          next: "recommendation",
        },
      ],
    },
  },

  memo: {
    to: "Dana Okafor, COO",
    subject: "Cold plate delay: recommendation and next steps",
    intro: "Dana wants a short note before the leadership sync. Keep it tight, because she'll forward it to the CEO.",
    fields: [
      { id: "recommendation", label: "My recommendation", placeholder: "What should Halcyon do from here, and why?", minLength: 20, multiline: true },
      { id: "risk", label: "Biggest unresolved risk", placeholder: "What could still go wrong, and how bad would it be?", minLength: 15, multiline: true },
      {
        id: "owner",
        label: "Who owns the next action",
        placeholder: "One name and the action they own",
        minLength: 3,
        suggestions: ["Dana Okafor (COO)", "Priya Raman (Engineering)", "Marcus Hale (Commercial)", "Me (Operations)"],
      },
      { id: "customer", label: "What we tell Brightline", placeholder: "The message, in the words you'd actually use", minLength: 20, multiline: true },
    ],
  },

  debrief: {
    profiles: [
      { when: { tags: ["lock_in"] }, title: "Held the date. Mortgaged the supply chain.", body: "Brightline got exactly what was promised. Halcyon paid for it twice: once in cash, and once in a year of dependence on the supplier that caused the problem." },
      { when: { tags: ["quality_shortcut"] }, title: "On time, with an asterisk.", body: "You hit the date by trading away performance, and you were honest about it. Whether that was the right trade depends on how fast the field fix lands." },
      { when: { tags: ["quality_first"] }, title: "Protected the product. Gave up the week.", body: "You shipped late but to spec. For a hardware company's first customer, that's a defensible call, though not a free one." },
      { when: { tags: ["expedite", "second_source"] }, title: "Bought time, then bought an exit.", body: "You paid to go fast, then refused to be locked in. You ended with a second source, a tired engineering team and a bigger bill." },
      { when: { tags: ["expedite", "partial_ship"] }, title: "Paid to go fast. Still split the shipment.", body: "The expedite didn't fully land, and you chose not to double down. You spent money without buying a clean outcome, but you didn't create new long-term obligations either." },
      { when: { tags: ["screened"] }, title: "Split the difference with data.", body: "You let measurements decide what shipped. Most of the order was on time and all of it to spec, but the root cause is still open." },
      { when: { tags: ["penalty_exposure"] }, title: "Bought trust with contract risk.", body: "Brightline got the commitment it asked for. Halcyon got a penalty clause, one missed week and a template the next customer will ask for." },
      { when: { tags: ["protected_precedent"] }, title: "Held the line on terms.", body: "You kept penalties out of your first contract and gave the customer access instead. The price was paid inside the company, by engineering." },
      { when: { tags: ["credits_bridge"] }, title: "Paid the customer to wait.", body: "You solved Brightline's real problem, the demo, and they loved it. It was expensive, and it quietly sets an expectation for the next delay." },
      { when: {}, title: "You made the calls and lived with the tradeoffs.", body: "No path through this scenario wins on everything. Here's what yours protected and what it left exposed." },
    ],
    strengths: [
      { when: { tags: ["early_reset"] }, title: "You reset expectations before the customer found out.", body: "Calling Brightline on day one kept the story in Halcyon's hands. Customers forgive bad news much more readily than surprises." },
      { when: { tags: ["expedite"] }, title: "You acted within hours.", body: "Expediting on day one showed urgency and kept engineering focused on firmware instead of supplier firefighting." },
      { when: { tags: ["second_source"] }, title: "You reduced single-source risk.", body: "Qualifying Voss cost time now, but the next Kestrel hiccup won't stop the line." },
      { when: { tags: ["quality_first"] }, title: "You refused to ship a known thermal problem.", body: "A first customer's lab is the worst place to discover a hot spot. The thermal data package turned a slip into a credibility moment." },
      { when: { tags: ["disclosed_derate"] }, title: "You disclosed the derate instead of burying it.", body: "Brightline heard about the 8% from you, not from their benchmarks. That's why this is a negotiation and not an escalation." },
      { when: { tags: ["screened"] }, title: "You made the call with data.", body: "Screening every plate turned a 25% risk into a known yield, and let you ship most units on time without shipping bad ones." },
      { when: { tags: ["protected_precedent"] }, title: "You protected the contract template.", body: "Every future customer will see your first contract. Keeping penalty terms out of it is worth more than one deal's goodwill." },
      { when: { tags: ["credits_bridge"] }, title: "You solved the customer's real problem.", body: "Brightline didn't need servers so much as a working grant demo. You found the thing they actually cared about." },
      { when: { tags: ["partial_ship"] }, title: "Something real shipped on the promised date.", body: "Partial capacity on day one let Brightline start working. A partial delivery beats a perfect one that arrives late." },
      { when: { metrics: { timing: { min: 70 } } }, title: "The launch date held.", body: "You ended with a credible week-4 story, which is what the board, Marcus and the prospects were all watching." },
      { when: { metrics: { cost: { max: 45 } } }, title: "Spending stayed disciplined.", body: "You finished under $80K over plan. Dana can present that without a special slide." },
      { when: { metrics: { trust: { min: 70 } } }, title: "The customer relationship is strong.", body: "Brightline ended the scenario more confident in Halcyon than a supplier slip would usually allow." },
      { when: { metrics: { risk: { max: 40 } } }, title: "The operation is safer than you found it.", body: "You finished with less supply and quality exposure than you started with, which is rare in a crisis." },
    ],
    blindSpots: [
      { when: { tags: ["lock_in"] }, title: "You locked in the vendor that just let you down.", body: "The exclusive has no exit if Kestrel misses again. Next time, try negotiating a shorter term, volume without exclusivity, or a performance clause." },
      { when: { tags: ["single_source"], notTags: ["second_source"] }, title: "Kestrel is still your only source.", body: "The root problem was a single supplier for a critical part. Nothing in your path changed that, so the next resin shortage hits you the same way." },
      { when: { tags: ["expedite"] }, title: "You paid before diagnosing the constraint.", body: "Kestrel's problem was resin upstream, and money bought freight and shifts, not material. Asking exactly what was constrained might have saved most of the $176K." },
      { when: { tags: ["overloaded_engineering"] }, title: "Engineering capacity was the hidden constraint.", body: "Running qualification on a fully booked team slipped firmware and burned people out. Capacity is a resource like cash; it needed an explicit trade-off." },
      { when: { tags: ["engineering_loaned"] }, title: "The on-site engineer came out of firmware.", body: "You offered a person Priya hadn't agreed to give up. Check with the owner before you spend someone else's capacity in a negotiation." },
      { when: { tags: ["quality_shortcut"] }, title: "\"Below spec\" is now in writing.", body: "The derate saved the date, but your reference customer's board report now says below spec. That line will follow you into sales calls." },
      { when: { tags: ["screened"] }, title: "Screening isn't a fix.", body: "You're now paying to catch Voss's flatness drift on every plate. Someone needs to own getting Voss to fix their process." },
      { when: { tags: ["schedule_slip"] }, title: "The first shipment was late.", body: "A week matters less than it feels, but Marcus's three prospects heard about it. Pair the slip with a story about why it protected the customer." },
      { when: { tags: ["penalty_exposure"] }, title: "Your first contract has a penalty clause.", body: "You tied a firm date to a supplier you don't control, with no backup. It cost $15K this time, and the clause is now a template." },
      { when: { tags: ["credits_bridge"] }, title: "Credits are a precedent too.", body: "Paying $96K to bridge a delay works once. Make sure it's written up as a one-time goodwill gesture, not a policy." },
      { when: { tags: ["early_reset"] }, title: "Resetting first meant not trying first.", body: "You told the customer before testing whether expediting or a second source could hold the date. Candor is good; conceding before exploring options has a cost." },
      { when: { metrics: { cost: { min: 60 } } }, title: "The burn needs a board narrative.", body: "You finished more than $200K over plan. Dana will need a clear story about what that bought and why it won't repeat." },
      { when: { metrics: { trust: { max: 62 } } }, title: "Brightline's confidence took a hit.", body: "Your reference customer trusts you less than when you started. Plan deliberate recovery: a follow-up visit, a performance review or an executive check-in." },
      { when: { metrics: { risk: { min: 60 } } }, title: "You're carrying real risk into launch.", body: "Operational risk ended high. The next surprise will land on a thinner margin than this one did." },
    ],
    selfCheck: [
      { when: {}, title: "Does your recommendation name a specific action and a date?", body: "\"Stabilize supply\" is a direction. \"Qualify Voss by week 6\" is a recommendation." },
      { when: {}, title: "Is the owner one named person?", body: "\"The team\" and \"Ops and Engineering\" mean nobody owns it." },
      { when: { tags: ["lock_in"] }, title: "Did you flag the 12-month exclusive?", body: "It's the biggest long-term cost of your path, and Dana has to take it to the board." },
      { when: { tags: ["single_source"], notTags: ["second_source"] }, title: "Did you name single-source dependence on Kestrel?", body: "It caused this whole scenario and it's still unresolved." },
      { when: { tags: ["quality_shortcut"] }, title: "Does your customer message quantify the derate and date the fix?", body: "Brightline asked for a dated plan. \"Soon\" won't hold." },
      { when: { tags: ["screened"] }, title: "Did you mention screening yield and Voss's root cause?", body: "A 72% yield is a cost that lasts as long as nobody fixes the process." },
      { when: { tags: ["quality_first"] }, title: "Did you tell Brightline why the slip protects them?", body: "The thermal data is your best argument, so use it." },
      { when: { tags: ["penalty_exposure"] }, title: "Did you cover what happens if Kestrel misses again?", body: "You're exposed at $15K a week with no backup source." },
      { when: { anyTags: ["overloaded_engineering", "engineering_loaned"] }, title: "Did you account for Priya's team?", body: "Engineering capacity absorbed part of your plan's cost. Say how you'll give it back." },
      { when: { tags: ["credits_bridge"] }, title: "Did you say when the credits end?", body: "A bridge needs a far side. Give Brightline the date the hardware takes over." },
      { when: { tags: ["partial_ship"] }, title: "Does your customer message give a firm date for the remaining units?", body: "A partial delivery is only reassuring if the rest has a date." },
    ],
  },
};
