import { useEffect, useState } from "react";
import { Brief } from "./Brief";
import { DelaysStep } from "./DelaysStep";
import { Faq } from "./Faq";
import { Landing } from "./Landing";
import { PowerStep } from "./PowerStep";
import { Sources } from "./Sources";
import { TimelineStep } from "./TimelineStep";

type View = "landing" | "power" | "timeline" | "delays" | "brief" | "sources" | "faq";
const VIEWS: View[] = ["power", "timeline", "delays", "brief", "sources", "faq"];

const resolve = (): View => {
  const first = window.location.pathname.split("/")[1] as View;
  return VIEWS.includes(first) ? first : "landing";
};

const TITLES: Record<View, string> = {
  landing: "Loadline · Can this AI campus go live on time?",
  power: "Loadline · Power demand",
  timeline: "Loadline · Delivery schedule",
  delays: "Loadline · Cost of delay",
  brief: "Loadline · Recommendation",
  sources: "Loadline · Sources",
  faq: "Loadline · FAQ",
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
    case "power":
      return <PowerStep key={view} />;
    case "timeline":
      return <TimelineStep key={view} />;
    case "delays":
      return <DelaysStep key={view} />;
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
