import { useEffect, useState } from "react";
import { AffordStep } from "./AffordStep";
import { BuildStep } from "./BuildStep";
import { Call } from "./Call";
import { GapStep } from "./GapStep";
import { Landing } from "./Landing";
import { Sources } from "./Sources";

type View = "landing" | "gap" | "afford" | "build" | "call" | "sources";
const VIEWS: View[] = ["gap", "afford", "build", "call", "sources"];

const resolve = (): View => {
  // The memo used to live at /brief; it is now The call.
  if (window.location.pathname.split("/")[1] === "brief") window.history.replaceState(null, "", `/call${window.location.search}`);
  const first = window.location.pathname.split("/")[1] as View;
  return VIEWS.includes(first) ? first : "landing";
};

const TITLES: Record<View, string> = {
  landing: "Signal · Connecting the offline",
  gap: "Signal · 1. Gap",
  afford: "Signal · 2. Afford",
  build: "Signal · 3. Build",
  call: "Signal · The call",
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
    case "call":
      return <Call key={view} />;
    case "sources":
      return <Sources key={view} />;
    default:
      return <Landing />;
  }
}
