import { useEffect, useState } from "react";
import { AffordStep } from "./AffordStep";
import { Brief } from "./Brief";
import { BuildStep } from "./BuildStep";
import { GapStep } from "./GapStep";
import { Landing } from "./Landing";
import { Sources } from "./Sources";

type View = "landing" | "gap" | "afford" | "build" | "brief" | "sources";
const VIEWS: View[] = ["gap", "afford", "build", "brief", "sources"];

const resolve = (): View => {
  const first = window.location.pathname.split("/")[1] as View;
  return VIEWS.includes(first) ? first : "landing";
};

const TITLES: Record<View, string> = {
  landing: "Signal · Connecting the offline",
  gap: "Signal · 1. Gap",
  afford: "Signal · 2. Afford",
  build: "Signal · 3. Build",
  brief: "Signal · Country memo",
  sources: "Signal · Sources",
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
    case "gap":
      return <GapStep key={view} />;
    case "afford":
      return <AffordStep key={view} />;
    case "build":
      return <BuildStep key={view} />;
    case "brief":
      return <Brief key={view} />;
    case "sources":
      return <Sources key={view} />;
    default:
      return <Landing />;
  }
}
