/** The nine builds: what the detail panel shows when a card is clicked. */
export type Project = {
  id: string;
  name: string;
  /** Live app, opened in the panel and by "Open ↗" */
  url: string;
  /** Where the embedded app starts: the step the "Try this" list begins on */
  start: string;
  tags: string[];
  pitch: string;
  why: string;
  what: string[];
  tryThis: string[];
  builtWith: string;
};

export const projects: Project[] = [
  {
    id: "breakeven",
    name: "Breakeven",
    url: "https://breakeven-silk.vercel.app",
    start: "/worth-it",
    tags: ["Decision tool", "AI economics", "Live"],
    pitch:
      "How should a company run its AI (pay per token, rent cloud GPUs, or own the hardware) and is the use case worth it at all?",
    why: "Teams adopting AI pick an API because it's easy, then keep paying for it long after their volume says otherwise. Breakeven finds the point where today's setup starts overpaying, and checks whether the work pays off before anyone argues about infrastructure.",
    what: [
      "Prices a use case end to end: hours saved, AI success rate, human review and payback.",
      "Compares API, rented and owned GPUs at your volume, and shows the volumes where the answer flips.",
      "Uses queueing theory to show how hot you can run GPUs before answers slow down, and the newsvendor ratio to own the base and rent the peaks.",
      "Tracks public API and GPU rental prices over time, every point linked to its source.",
      "Ends in a call: the recommendation, what would change it, and a 90-day rollout with measures.",
    ],
    tryThis: [
      "Start on Evaluate AI ROI with the Customer support template: about $55K a month saved, payback in under a month.",
      "Go to Compare compute costs and drag the volume to 30B tokens a month: the cheapest option flips from the API to owning GPUs.",
      "Open Recommendation for the answer, the switching saving and the 90-day plan.",
    ],
    builtWith:
      "React · TypeScript · Vite · Tailwind · Vitest · Vercel · n8n (decision report) · public API price pages, H100 rental index, EIA power prices",
  },
  {
    id: "loadline",
    name: "Loadline",
    url: "https://loadline-weld.vercel.app",
    start: "/power?c=crusoe-abilene",
    tags: ["Method demo", "Data centers", "Live"],
    pitch:
      "Can this AI campus go live on time, what does each month late cost, and what should we fix first?",
    why: "AI campuses slip on long-lead equipment and grid connections, and every month late leaves billions of dollars of GPUs idle. Loadline turns a campus plan into a critical path, so a program lead knows which milestone to protect and what expediting is worth.",
    what: [
      "Turns GPU plans into megawatts and a yearly power bill for three public case studies: Crusoe Abilene, CoreWeave Lancaster and QTS Cedar Rapids.",
      "Builds each phase's critical path from permits, grid, transformers, cooling, GPUs and commissioning.",
      "Ranks what to resolve first by the cost of a three-month slip. In the modeled scenario a month late costs about $150M.",
      "Explains multi-year transformer lead times with factory physics, and sizes spare transformers with the newsvendor model.",
      "Compares building all phases now against phasing them as demand becomes clear.",
    ],
    tryThis: [
      "Start on Power for Crusoe Abilene: about a gigawatt at the meter.",
      "Open Delays and slip phase 2's transformers by three months: watch the cost and the resolve-first list change.",
      "Open The call for the program plan: return on expediting, owners and triggers.",
    ],
    builtWith:
      "React · TypeScript · Vite · Tailwind · Vitest · Vercel · public filings and press for each campus, EIA industrial power prices",
  },
  {
    id: "throughline",
    name: "Throughline",
    url: "https://throughline-gilt.vercel.app",
    start: "/forecast?p=tablet",
    tags: ["Method demo", "Supply chain", "Live"],
    pitch: "How much should we build, where should it go, and what happens when the plan is wrong?",
    why: "Planning teams have to argue for trade-offs: more service costs inventory, and scarce supply means someone gets less. Throughline puts a price on each trade-off, on real US Census demand data, so the plan someone signs is a choice rather than a default.",
    what: [
      "Tests three forecasting methods on the last 12 months and picks the most accurate.",
      "Builds a monthly supply plan with safety stock, order size and a newsvendor launch quantity. Going from 95% to 99% service costs about 9,000 more units.",
      "Splits a 30% supply cut across regions by three rules, and shows who is left short.",
      "Simulates the bullwhip effect, and how sharing demand data shrinks it.",
      "Reads 180,519 real orders to show late delivery depends on the shipping promise, not the region.",
    ],
    tryThis: [
      "Start on Forecast for the Wren tablet: Holt-Winters wins with about a 3% error.",
      "Open Allocate and pick Most margin: more revenue, but one region gets nothing.",
      "Open Ripple and tick Share demand data: the swing at the supplier drops sharply.",
    ],
    builtWith:
      "React · TypeScript · Vite · Tailwind · Vitest · Vercel · US Census retail and orders data via FRED, DataCo Smart Supply Chain (CC BY 4.0)",
  },
  {
    id: "keel",
    name: "Keel",
    url: "https://keel-one-rho.vercel.app",
    start: "/review",
    tags: ["Method demo", "Operating rhythm", "Live"],
    pitch: "Are we on plan, why not, and what do we do about it?",
    why: "Business operations teams run the annual plan, the monthly review and the funding call, often in disconnected spreadsheets. Keel connects them for a fictional AI lab, so a missed plan turns into a funded fix rather than a slide.",
    what: [
      "A driver-based annual plan for API and enterprise revenue, headcount and OKRs.",
      "A monthly business review: plan against actual, a KPI tree, and alerts on anything off track.",
      "A variance bridge that swaps one driver at a time, so the reasons add up exactly to the gap.",
      "Funds the initiatives with the most expected revenue within the budget and headcount left, and shows what gets cut.",
      "Finds that hiring more reps adds nothing when pipeline is the constraint.",
    ],
    tryThis: [
      "Start on Review in June: $6M behind plan year to date.",
      "Read the waterfall: a price cut, a lower win rate and more developers explain the gap.",
      "Open Prioritize, then The call: fund four initiatives, stop hiring reps, decide now.",
    ],
    builtWith: "React · TypeScript · Vite · Tailwind · Vitest · Vercel · a fictional company, labeled as such",
  },
  {
    id: "tender",
    name: "Tender",
    url: "https://tender-six-iota.vercel.app",
    start: "/spend",
    tags: ["Method demo", "Procurement", "Live"],
    pitch: "What should it cost, who should we buy it from, and on what terms?",
    why: "The costliest sourcing mistake is picking the cheapest quote. Tender shows how a sourcing lead buys the power and cooling gear for a 96 MW AI data hall on total cost, with a should-cost to negotiate from.",
    what: [
      "Spend analysis: where the $154M goes, and which categories rely on one supplier.",
      "A transformer should-cost built from public copper, steel and wage prices: costs rose 47% since 2019, prices 90%.",
      "Bids compared on total cost of ownership. In the modeled scenario the cheapest quote carries $223M of delay cost.",
      "An award split across suppliers that cuts the chance the hall slips.",
      "A negotiation plan: a $4.95M target against a $6.4M quote, and a walk-away price.",
    ],
    tryThis: [
      "Start on Spend: six categories, two of them single-sourced.",
      "Open Should-cost and watch the transformer's cost build up line by line.",
      "Open Bids: the cheapest quote loses once lead time is priced in.",
    ],
    builtWith:
      "React · TypeScript · Vite · Tailwind · Vitest · Vercel · BLS producer price indexes and IMF copper via FRED, GAO and industry lead-time reports",
  },
  {
    id: "buildout",
    name: "Buildout",
    url: "https://buildout-three.vercel.app",
    start: "/spend",
    tags: ["Data + analysis", "Capital intelligence", "Live"],
    pitch: "How much is Big Tech spending on the AI build-out, is it paying off, and who is getting the money?",
    why: "Strategy and finance teams need a quarterly read on whether the AI capex cycle is sustainable. Buildout reads it straight from SEC filings, with every number linked to its source.",
    what: [
      "Quarterly capex for Microsoft, Alphabet, Amazon, Meta, Oracle and Apple since 2019: $184B last quarter, up 83% on a year.",
      "Payoff: capex intensity, free cash flow, and the depreciation wave that turns today's spend into tomorrow's cost.",
      "Receivers: how much of each extra capex dollar shows up as NVIDIA, Broadcom, Vertiv and Eaton revenue.",
      "A thesis with five warning lights to watch each quarter.",
    ],
    tryThis: [
      "Start on Spend and watch the headline figures count up.",
      "Open Payoff and pick a company to see its free cash flow.",
      "Open The call: plan for growth, hedge for a slowdown, and the light that's already on.",
    ],
    builtWith: "React · TypeScript · Vite · Tailwind · Vitest · Vercel · SEC EDGAR XBRL company facts (10-Q and 10-K)",
  },
  {
    id: "where-ai-lives",
    name: "Where AI Lives",
    url: "https://where-ai-lives.vercel.app",
    start: "/map",
    tags: ["Synthesis", "Site selection", "Live"],
    pitch: "Where are AI data centers being built, what does the grid look like there, and where should the next one go?",
    why: "Site selection used to start with land and tax breaks; for AI it starts with power. Where AI Lives lets an energy or site-selection team shortlist states in minutes: speed to power is the moat.",
    what: [
      "Maps 77 US AI data centers by the power they draw, today and as announced through 2028.",
      "Sets each state's industrial power price against its grid-connection wait.",
      "Scores states with Data Envelopment Analysis: price and wait together, with no hand-picked weights.",
      "Finds today's biggest hubs, Virginia and Ohio, about a third worse than the frontier states.",
      "Sends any state's power price straight into Loadline or Breakeven.",
    ],
    tryThis: [
      "Start on Map and switch to End of 2028.",
      "Open Grid: cheap power, but connecting new power takes years.",
      "Open Sites and pick Virginia to see its benchmark on the frontier.",
    ],
    builtWith:
      "React · TypeScript · Vite · Tailwind · Vitest · Vercel · Epoch AI data centers (CC BY 4.0), EIA power prices, LBNL interconnection queues, US Census geocoder",
  },
  {
    id: "signal",
    name: "Signal",
    url: "https://signal-zeta-five.vercel.app",
    start: "/gap",
    tags: ["Decision tool", "Digital inclusion", "Live"],
    pitch: "Who is offline, what would make being online affordable, what would it cost to connect them, and who should pay?",
    why: "Ministries and development banks have to decide what to fund first. Signal puts every lever (phone financing, tax cuts, data subsidies and towers) on one yardstick: public money per person newly online.",
    what: [
      "Splits the offline population into those with no signal and those who could connect but don't, on World Bank data.",
      "Tests whether each income group can afford a phone and a data plan, and what each lever changes.",
      "Prices coverage by area and technology, and funds the cheapest people first within a budget.",
      "Splits the bill between operators, the universal service fund and public money.",
      "In Nigeria, financing phones costs about $23 per person newly online, almost six times less than towers.",
    ],
    tryThis: [
      "Start on Gap for Nigeria: 140 million offline, but only about 24 million have no signal.",
      "Open Afford and tick Pay-as-you-go phone financing: affordability jumps from 4% to 32%.",
      "Open The call for the order to fund things in, and what would change it.",
    ],
    builtWith:
      "React · TypeScript · Vite · Tailwind · Vitest · Vercel · World Bank WDI and Global Findex (CC BY 4.0), ITU and GSMA published figures",
  },
  {
    id: "walkin-here",
    name: "Walkin' Here!",
    url: "https://walkinhere.vercel.app",
    start: "/",
    tags: ["Consumer app", "City learning", "Live"],
    pitch: "How do you learn to move like a New Yorker, three minutes a day?",
    why: "Newcomers learn a city the hard way: the wrong subway etiquette, a fumbled bodega order, a tourist's sidewalk pace. Walkin' Here turns the unwritten rules into short daily lessons with a streak, so the habit sticks.",
    what: [
      "Six three-minute lessons: OMNY and subway rules, sidewalk cadence, bodega culture, ordering a bagel and coffee, street navigation, and tipping norms.",
      "Quizzes that earn XP, and a daily city streak that brings people back.",
      "A slang guide and a list of local spots to try.",
      "Sign in with Google or email; progress is saved to your account.",
    ],
    tryThis: [
      "Sign up with Google or an email and password.",
      "Take the first lesson, OMNY & Subway Rules, and answer its quiz to start your streak.",
      "Open the slang guide and the spots list from the menu.",
    ],
    builtWith: "Lovable · React · TanStack Start · TypeScript · Tailwind · Better Auth (Google sign-in) · Neon Postgres · Vercel",
  },
];
