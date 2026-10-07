import { useEffect, useState } from "react";
import { Brief } from "./Brief";
import { Landing } from "./Landing";
import { PlanStep } from "./PlanStep";
import { PrioritizeStep } from "./PrioritizeStep";
import { ReviewStep } from "./ReviewStep";
import { Sources } from "./Sources";

type View = "landing" | "plan" | "review" | "prioritize" | "brief" | "sources";
const VIEWS: View[] = ["plan", "review", "prioritize", "brief", "sources"];

const resolve = (): View => {
  const first = window.location.pathname.split("/")[1] as View;
  return VIEWS.includes(first) ? first : "landing";
};

const TITLES: Record<View, string> = {
  landing: "Keel · Are we on plan?",
  plan: "Keel · 1. Plan",
  review: "Keel · 2. Review",
  prioritize: "Keel · 3. Prioritize",
  brief: "Keel · The call",
  sources: "Keel · Sources",
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
    case "plan":
      return <PlanStep key={view} />;
    case "review":
      return <ReviewStep key={view} />;
    case "prioritize":
      return <PrioritizeStep key={view} />;
    case "brief":
      return <Brief key={view} />;
    case "sources":
      return <Sources key={view} />;
    default:
      return <Landing />;
  }
}
