import { useEffect, useState } from "react";
import { AllocateStep } from "./AllocateStep";
import { Brief } from "./Brief";
import { ForecastStep } from "./ForecastStep";
import { Landing } from "./Landing";
import { PlanStep } from "./PlanStep";
import { DeliverStep } from "./DeliverStep";
import { RippleStep } from "./RippleStep";
import { Sources } from "./Sources";

type View = "landing" | "forecast" | "plan" | "allocate" | "ripple" | "deliver" | "brief" | "sources";
const VIEWS: View[] = ["forecast", "plan", "allocate", "ripple", "deliver", "brief", "sources"];

const resolve = (): View => {
  const first = window.location.pathname.split("/")[1] as View;
  return VIEWS.includes(first) ? first : "landing";
};

const TITLES: Record<View, string> = {
  landing: "Throughline · How much should we build?",
  forecast: "Throughline · 1. Forecast",
  plan: "Throughline · 2. Plan",
  allocate: "Throughline · 3. Allocate",
  ripple: "Throughline · 4. Ripple",
  deliver: "Throughline · 5. Deliver",
  brief: "Throughline · Brief",
  sources: "Throughline · Sources",
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
    case "forecast":
      return <ForecastStep key={view} />;
    case "plan":
      return <PlanStep key={view} />;
    case "allocate":
      return <AllocateStep key={view} />;
    case "ripple":
      return <RippleStep key={view} />;
    case "deliver":
      return <DeliverStep key={view} />;
    case "brief":
      return <Brief key={view} />;
    case "sources":
      return <Sources key={view} />;
    default:
      return <Landing />;
  }
}
