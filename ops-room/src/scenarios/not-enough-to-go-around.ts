import type { Scenario } from "@/engine/types";

// "Not Enough to Go Around": all names are fictional. Northbeam Systems and its Kestrel server match Throughline's
// AI-server case: about 1,660 servers wanted next month, a 30% GPU cut leaves 1,162, and the three allocation rules
// give $84.0M (fair share), $83.9M (priority) and $87.6M (most margin) of gross margin, as in Throughline.
//
// Metrics run 0–100. Margin: $M = 72 + 0.2 × score, so 60 is $84M. Fill: the worst-served region's fill rate, in %.

const marginM = (v: number) => 72 + 0.2 * v;

export const notEnoughToGoAround: Scenario = {
  id: "not-enough-to-go-around",
  title: "Not Enough to Go Around",
  tagline: "GPU supply just dropped 30%. Three customers want their full order.",
  intro: [
    "You lead supply planning at Northbeam Systems, which builds the Kestrel 8-GPU server for cloud providers in three regions.",
    "Your GPU supplier has cut next month's allocation by 30%. You can build about 1,160 servers against orders for 1,660. Every account director wants their customer made whole.",
  ],
  estMinutes: "5–7 min",
  role: "Supply Planning Lead",
  clock: { label: "Until the allocation locks", count: 20, unit: "hours" },
  company: "Northbeam Systems",
  app: { name: "Throughline", href: "https://throughline-gilt.vercel.app/allocate?p=server", label: "Compare the allocation rules on the AI server in Throughline" },

  people: {
    nadia: { name: "Nadia Rahman", role: "VP Supply Chain", initials: "NR", tone: "amber" },
    theo: { name: "Theo Grant", role: "Account Director, US hyperscalers", initials: "TG", tone: "sky" },
    ines: { name: "Inès Moreau", role: "Account Director, European clouds", initials: "IM", tone: "violet" },
    kenji: { name: "Kenji Sato", role: "Account Director, Asian clouds", initials: "KS", tone: "emerald" },
    lars: { name: "Lars Holm", role: "Finance Business Partner", initials: "LH", tone: "slate" },
  },

  metrics: [
    {
      id: "margin",
      label: "Gross margin",
      shortLabel: "Margin",
      hint: "Next month's gross margin on the servers you can build.",
      higherIsBetter: true,
      describe: (v) => `$${marginM(v).toFixed(1)}M next month`,
    },
    {
      id: "fill",
      label: "Worst-region fill",
      shortLabel: "Fill",
      hint: "Share of orders filled in the region that gets the least. Fairness, in one number.",
      higherIsBetter: true,
      describe: (v) => `${Math.round(v)}% of orders filled`,
    },
    {
      id: "trust",
      label: "Customer relationships",
      shortLabel: "Customers",
      hint: "How the three customer groups feel about Northbeam right now.",
      higherIsBetter: true,
      describe: (v) => (v >= 80 ? "Strong" : v >= 60 ? "Steady" : v >= 40 ? "Strained" : v >= 25 ? "Damaged" : "At risk of leaving"),
    },
    {
      id: "risk",
      label: "Supply risk",
      shortLabel: "Risk",
      hint: "Exposure to the next swing in GPU supply or demand. Lower is better.",
      higherIsBetter: false,
      describe: (v) => (v <= 25 ? "Contained" : v <= 40 ? "Manageable" : v <= 60 ? "Elevated" : v <= 75 ? "High" : "Severe"),
    },
  ],
  initial: { margin: 60, fill: 100, trust: 70, risk: 55 },

  brief: {
    goal: "Decide who gets next month's servers, then make sure the next GPU shortage hurts less.",
    alert: {
      title: "GPU supplier: next month's allocation cut by 30%",
      body: "A packaging bottleneck upstream means about 1,160 Kestrel servers next month, not the 1,660 your customers ordered. The shortfall is about 500 servers, roughly $150M of revenue.",
    },
    facts: [
      { label: "Orders next month", value: "≈ 1,660 servers" },
      { label: "Can build", value: "≈ 1,160 (−30%)" },
      { label: "US hyperscalers", value: "60% of orders · $300K a server" },
      { label: "European clouds", value: "25% · $315K a server" },
      { label: "Asian clouds", value: "15% · $290K a server" },
    ],
    messages: [
      { from: "nadia", body: "I need an allocation by tomorrow noon, with a reason I can repeat to every account director. And I don't want to be back here in three months." },
      { from: "lars", body: "European orders carry the best price. If this is about margin, they go first. If it's about relationships, that's a different answer." },
      { from: "theo", body: "The US hyperscalers are 60% of our business. If we short them, they'll dual-source us for good." },
    ],
  },

  startDecision: "allocate",

  decisions: {
    allocate: {
      id: "allocate",
      step: "Decision 1 · The allocation",
      title: "Wednesday, 4 p.m. The allocation locks tomorrow at noon.",
      situation:
        "You have three rules on the table. Fair share gives every customer the same 70% of their order. Priority fills the US hyperscalers first. Most margin fills the highest-price region first.",
      messages: [
        { from: "ines", body: "European clouds pay the most and we've never missed them. Please don't make them the ones who absorb this." },
        { from: "kenji", body: "Asian clouds are our growth market. If they get nothing this month, the competitor who's been calling them every week gets the business." },
      ],
      prompt: "How do you split the 1,160 servers?",
      options: [
        {
          id: "fair",
          label: "Fair share",
          summary: "Give every customer group 70% of its order.",
          benefit: "Easy to explain and hard to argue with. Every relationship takes the same hit.",
          cost: "Gives up about $3.6M of margin against the most-margin rule.",
          uncertainty: "Everyone is short. Some customers may split orders with a competitor to cover the gap.",
          effects: { margin: 0, fill: -30, trust: -4, risk: 0 },
          tags: ["fair_share"],
          concepts: ["allocation"],
          outcome: {
            headline: "Everyone short, nobody singled out.",
            body: "Each region got 70% of its order. Gross margin landed at $84.0M. Account directors had the same message for every customer, and nobody escalated to your CEO.",
            messages: [
              { from: "theo", body: "Not happy, but I can defend 'everyone got the same cut'." },
              { from: "lars", body: "We left about $3.6M of margin on the table versus filling Europe first. That's a choice, and I'm fine with it if we say it out loud." },
            ],
          },
          next: "rebuild",
        },
        {
          id: "priority",
          label: "US hyperscalers first",
          summary: "Fill the US hyperscalers completely, then Europe, then Asia with whatever's left.",
          benefit: "Protects your largest customers, 60% of the business, in full.",
          cost: "Europe gets 40% of its order and Asia gets nothing.",
          uncertainty: "Asian clouds are the fastest-growing region. A zero month could cost more than one month of servers.",
          effects: { margin: -0.5, fill: -100, trust: -12, risk: 6 },
          tags: ["priority", "zeroed_region"],
          concepts: ["allocation"],
          outcome: {
            headline: "The biggest customer, made whole.",
            body: "US hyperscalers got every server they ordered. Europe got 40%; Asia got none. Margin was $83.9M. Within a week, one Asian cloud signed a trial with a competitor.",
            messages: [
              { from: "kenji", body: "Zero. I had to tell them zero. They've started testing the other vendor." },
              { from: "theo", body: "The hyperscalers noticed we kept them whole. That's worth something next year." },
            ],
          },
          next: "rebuild",
        },
        {
          id: "margin",
          label: "Most margin first",
          summary: "Fill the highest-price region first: Europe in full, then the US, with nothing left for Asia.",
          benefit: "The most margin this month: about $87.6M.",
          cost: "Asia gets nothing, and the US gets 75% of its order.",
          uncertainty: "Customers can usually tell when allocation follows price. That can cost more than $3.6M later.",
          effects: { margin: 18, fill: -100, trust: -16, risk: 6 },
          tags: ["most_margin", "zeroed_region"],
          concepts: ["allocation", "expected_value"],
          outcome: {
            headline: "Best month for margin, worst for goodwill.",
            body: "Margin landed at $87.6M, $3.6M above fair share. Europe got everything, the US got 75%, and Asia got nothing. A US hyperscaler asked, pointedly, how Northbeam decides who gets supply.",
            messages: [
              { from: "theo", body: "They asked me directly if we sell to the highest bidder. I didn't have a great answer." },
              { from: "lars", body: "Best margin month of the year. I just hope it's not the most expensive one." },
            ],
          },
          next: "rebuild",
        },
      ],
    },

    rebuild: {
      id: "rebuild",
      step: "Decision 2 · The next shortage",
      title: "One week later. The packaging bottleneck may last a quarter.",
      situation:
        "Nadia wants a plan so the next cut hurts less. Small swings in customer orders are turning into big swings in what you order from the GPU supplier: Throughline's model puts the swing at the supplier at about 26 times the swing in end demand.",
      messages: [
        { from: "nadia", body: "Three ideas on the table: buy GPUs on the broker market now, hold more buffer stock, or start sharing real demand data with the supplier and our customers. Pick one to lead with." },
        { from: "lars", body: "Broker GPUs carry about a $9K premium per server. Buffer stock ties up roughly $80M of components. Data sharing costs almost nothing but takes a quarter to work." },
      ],
      prompt: "What do you lead with?",
      options: [
        {
          id: "broker",
          label: "Buy GPUs on the broker market",
          summary: "Buy enough broker GPUs to build 200 extra servers next month, at about $9K extra per server.",
          benefit: "Closes part of the gap now, for the customers who were shorted hardest.",
          cost: "About $1.8M of premium, and broker parts need extra incoming inspection.",
          uncertainty: "Broker supply is thin and prices move daily. It treats the symptom, not the swings.",
          effects: { margin: -9, fill: 25, trust: 8, risk: 4 },
          tags: ["broker"],
          concepts: ["cost_of_delay"],
          outcome: {
            headline: "200 servers, bought at a premium.",
            body: "The broker GPUs passed inspection, and 200 extra servers went to the region that was shorted most. The premium came to $1.8M. Next quarter's swings are exactly as big as before.",
            messages: [
              { from: "kenji", body: "Getting something to Asia this month kept the competitor trial from turning into a contract." },
              { from: "lars", body: "We paid $1.8M to patch one month. What's the plan for the next one?" },
            ],
          },
          next: "recommendation",
        },
        {
          id: "buffer",
          label: "Hold more safety stock",
          summary: "Raise GPU safety stock to about 350 servers' worth, the level Throughline sets for 95% service.",
          benefit: "The next small disruption gets absorbed by stock instead of by customers.",
          cost: "Roughly $80M of components on the shelf, about $2.4M a month to carry.",
          uncertainty: "A buffer sized for normal swings won't cover another 30% cut. And GPUs lose value as new generations ship.",
          effects: { margin: -12, fill: 10, trust: 4, risk: -10 },
          tags: ["buffer"],
          concepts: ["safety_stock"],
          outcome: {
            headline: "A cushion, at a carrying cost.",
            body: "The buffer covered a smaller dip six weeks later without any customer noticing. Finance flagged $2.4M a month of carrying cost, and the risk that the stock ages if the next GPU generation ships early.",
            messages: [
              { from: "nadia", body: "That dip would have been another allocation fight. It wasn't." },
              { from: "lars", body: "Worth it this quarter. Let's set a rule for when we shrink it back." },
            ],
          },
          next: "recommendation",
        },
        {
          id: "share",
          label: "Share demand data",
          summary: "Share real customer demand with the GPU supplier and your three biggest customers, and plan together each month.",
          benefit: "Cuts the swing at the supplier from about 26× to under 5× the swing in end demand, the biggest lever in Throughline's model.",
          cost: "Little cash, but a quarter of setup, and customers have to agree to share forecasts.",
          uncertainty: "It takes a quarter to work. It doesn't add a single GPU this month.",
          effects: { margin: 0, fill: 4, trust: 10, risk: -20 },
          tags: ["share_data"],
          concepts: ["bullwhip"],
          outcome: {
            headline: "Smaller swings, starting next quarter.",
            body: "Two of three customer groups agreed to share forecasts. The GPU supplier moved Northbeam into its monthly planning call. This month didn't change, but the next allocation was set a month earlier, and with far less drama.",
            messages: [
              { from: "theo", body: "The hyperscalers liked being asked. It's the first time we've treated them as partners in planning." },
              { from: "nadia", body: "This is the fix I wanted: fewer surprises, not bigger warehouses." },
            ],
          },
          next: "recommendation",
        },
      ],
    },
  },

  memo: {
    to: "Nadia Rahman, VP Supply Chain",
    subject: "GPU shortfall: allocation and the plan for the next one",
    intro: "Nadia will share your note with the account directors. Keep it short and give a reason each of them can repeat.",
    fields: [
      { id: "recommendation", label: "My recommendation", placeholder: "Who gets what, and why? Include the margin you gave up or gained.", minLength: 20, multiline: true },
      { id: "risk", label: "Biggest unresolved risk", placeholder: "What could still go wrong next quarter?", minLength: 15, multiline: true },
      { id: "owner", label: "Who owns the next action", placeholder: "One name and the action they own", minLength: 3, suggestions: ["Nadia Rahman (VP Supply Chain)", "Lars Holm (Finance)", "Theo Grant (US accounts)", "Me (Supply Planning)"] },
      { id: "customers", label: "What we tell customers", placeholder: "The message, in the words you'd actually use", minLength: 20, multiline: true },
    ],
  },

  debrief: {
    profiles: [
      { when: { tags: ["fair_share", "share_data"] }, title: "Fair today, fewer fights tomorrow.", body: "You spread the pain evenly and went after the cause: swings that grow as they move up the chain. A planner's answer to a planner's problem." },
      { when: { tags: ["most_margin", "broker"] }, title: "Maximized the month, then paid to patch it.", body: "You took the best margin, then spent part of it buying broker GPUs for the customers you'd shorted. The swings that caused this are still there." },
      { when: { tags: ["priority", "buffer"] }, title: "Protected the biggest customer, then built a cushion.", body: "The hyperscalers got everything and you added buffer stock. Asia paid for this month; the buffer protects the next one." },
      { when: { tags: ["zeroed_region"] }, title: "Someone got zero.", body: "Your rule left one region with nothing this month. That may be right for the business, but it is a decision about which customer matters least." },
      { when: { tags: ["fair_share"] }, title: "Everyone short, nobody singled out.", body: "Fair share gave up some margin and bought you a reason every customer could accept." },
      { when: {}, title: "You made the calls and lived with the tradeoffs.", body: "No rule wins on margin, fairness and relationships at once. Here's what yours protected." },
    ],
    strengths: [
      { when: { tags: ["fair_share"] }, title: "You gave every account director the same story.", body: "A rule that's easy to repeat is worth a lot in a shortage." },
      { when: { tags: ["most_margin"] }, title: "You knew what the margin was worth.", body: "$87.6M against $84.0M: you priced the choice instead of guessing." },
      { when: { tags: ["share_data"] }, title: "You went after the bullwhip.", body: "Sharing real demand shrinks the swings that turn small dips into allocation fights." },
      { when: { tags: ["buffer"] }, title: "You sized the buffer to a service level.", body: "Safety stock set for 95% service absorbs normal swings without a new crisis." },
      { when: { metrics: { fill: { min: 70 } } }, title: "No customer was left far behind.", body: "Your worst-served region still got most of its order." },
      { when: { metrics: { trust: { min: 70 } } }, title: "Relationships came through intact.", body: "You ended the shortage with customers at least as confident as when it started." },
    ],
    blindSpots: [
      { when: { tags: ["zeroed_region"] }, title: "A zero month invites a competitor.", body: "The region that got nothing is the one most likely to qualify a second vendor. Price that into the decision." },
      { when: { tags: ["most_margin"] }, title: "Allocation by price is visible.", body: "Customers notice when supply follows price. The $3.6M can cost more in next year's negotiation." },
      { when: { tags: ["broker"] }, title: "Broker parts patch one month.", body: "The premium bought servers, not stability. Next quarter's swings are as big as before." },
      { when: { tags: ["buffer"] }, title: "Stock ages.", body: "GPUs lose value as new generations ship. Set a rule for shrinking the buffer back." },
      { when: { notTags: ["share_data"] }, title: "The swings are still there.", body: "Orders swing about 26 times more at the supplier than at your customers. Sharing demand data is the biggest lever, and you didn't pull it." },
      { when: { metrics: { margin: { max: 50 } } }, title: "Margin took a real hit.", body: "You finished below $82M of gross margin. Lars will want the trade spelled out." },
    ],
    selfCheck: [
      { when: {}, title: "Does your note give one rule each account director can repeat?", body: "In a shortage, the reason matters as much as the numbers." },
      { when: {}, title: "Did you put a number on what you gave up?", body: "Margin, fill rate, or a customer at risk. Name it." },
      { when: { tags: ["zeroed_region"] }, title: "Did you say what the zeroed region gets next month?", body: "\"Nothing now, first in line next month\" is a message. \"Nothing\" isn't." },
      { when: { tags: ["share_data"] }, title: "Did you say what customers have to share, and when?", body: "Data sharing only works with a cadence and an owner." },
    ],
  },
};
