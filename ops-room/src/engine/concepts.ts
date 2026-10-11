// The ideas behind the choices, in plain English. Options list concept keys; the debrief shows the ones you used.

export interface Concept {
  label: string;
  body: string;
}

export const CONCEPTS: Record<string, Concept> = {
  cost_of_delay: {
    label: "Cost of delay",
    body: "Put a price on a month late (revenue not earned plus the cost of capital sitting idle). It turns \"expedite?\" into a business case: worth it if it saves more months than it costs.",
  },
  critical_path: {
    label: "Critical path",
    body: "The finish date is set by the slowest chain of dependencies. Speeding up anything off that chain changes nothing; only the critical path moves the date.",
  },
  queueing: {
    label: "Why busy factories quote long lead times",
    body: "When a factory runs near full, waiting time grows much faster than the work itself (Kingman's formula). Paying more rarely shortens the queue; a reserved slot or another factory does.",
  },
  single_source: {
    label: "Single-source risk",
    body: "One supplier for a critical part means one failure stops the line. A second qualified source costs money now and buys resilience later.",
  },
  capacity_reservation: {
    label: "Capacity reservation",
    body: "A deposit that buys an earlier production slot. It pays only when the supplier would otherwise be late, so its value equals the months it saves times the cost of a month late.",
  },
  sunk_cost: {
    label: "Sunk cost",
    body: "Money already spent can't be recovered, whatever you choose next. Decide on what's still ahead, not on what's already gone.",
  },
  value_of_information: {
    label: "Value of information",
    body: "Sometimes the best move is to learn before committing: a pilot, a test or a measurement. Information is worth buying when it could change the decision and costs less than a wrong call.",
  },
  expected_value: {
    label: "Expected value",
    body: "Weigh each outcome by its chance of happening. A bet with a big upside and a low chance can be worth less than a modest sure thing.",
  },
  allocation: {
    label: "Allocating scarce supply",
    body: "When there isn't enough, every rule is a choice about who matters most. Fair share protects relationships; most-margin protects profit; priority protects strategic accounts.",
  },
  bullwhip: {
    label: "The bullwhip effect",
    body: "Each company in a supply chain orders a little extra to cover its lead time, so small swings in demand become big swings upstream. Sharing real demand data shrinks them.",
  },
  safety_stock: {
    label: "Safety stock",
    body: "Extra inventory held against forecast error. It protects service, but each extra point of service costs more stock than the last.",
  },
  variance_bridge: {
    label: "Variance bridge",
    body: "Explain a gap to plan driver by driver (price, volume, win rate), so the conversation is about causes, not just the size of the miss.",
  },
  reforecast: {
    label: "Re-forecasting",
    body: "Reset the full-year number to what the current run-rate supports. An early, honest reset protects credibility; a late one spends it.",
  },
  binding_constraint: {
    label: "The binding constraint",
    body: "Only the resource that's actually limiting output matters. Adding more of something that isn't the constraint (sales reps when pipeline is short) adds cost, not results.",
  },
  ai_necessity: {
    label: "Is AI the right tool?",
    body: "Compare AI with the cheaper alternatives (rules automation, process redesign) on the same value basis. Sometimes the right answer is \"don't use AI\".",
  },
  cash_vs_capacity: {
    label: "Cash savings vs freed capacity",
    body: "Hours freed by automation only become cash if you avoid hiring or let attrition happen. Otherwise they're capacity to redeploy, which is valuable but not a saving.",
  },
};
