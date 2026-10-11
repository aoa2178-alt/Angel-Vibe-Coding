import { useEffect, useState } from "react";
import { BidsStep } from "./BidsStep";
import { Brief } from "./Brief";
import { Faq } from "./Faq";
import { Landing } from "./Landing";
import { NegotiateStep } from "./NegotiateStep";
import { ShouldCostStep } from "./ShouldCostStep";
import { Sources } from "./Sources";
import { SpendStep } from "./SpendStep";

type View = "landing" | "spend" | "should-cost" | "bids" | "negotiate" | "brief" | "sources" | "faq";
const VIEWS: View[] = ["spend", "should-cost", "bids", "negotiate", "brief", "sources", "faq"];

const resolve = (): View => {
  const first = window.location.pathname.split("/")[1] as View;
  return VIEWS.includes(first) ? first : "landing";
};

const TITLES: Record<View, string> = {
  landing: "Tender · What should it cost?",
  spend: "Tender · Spend analysis",
  "should-cost": "Tender · Should-cost",
  bids: "Tender · Bid evaluation",
  negotiate: "Tender · Negotiation",
  brief: "Tender · Recommendation",
  sources: "Tender · Sources",
  faq: "Tender · FAQ",
};

export default function App() {
  const [view, setView] = useState<View>(resolve);

  useEffect(() => {
    const onPop = () => setView(resolve());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.title = TITLES[view];
  }, [view]);

  // Keyed so each page re-reads the scenario from the URL when you arrive on it.
  switch (view) {
    case "spend":
      return <SpendStep key={view} />;
    case "should-cost":
      return <ShouldCostStep key={view} />;
    case "bids":
      return <BidsStep key={view} />;
    case "negotiate":
      return <NegotiateStep key={view} />;
    case "brief":
      return <Brief key={view} />;
    case "sources":
      return <Sources key={view} />;
    case "faq":
      return <Faq key={view} />;
    default:
      return <Landing />;
  }
}
