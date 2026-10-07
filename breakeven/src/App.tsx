import { useEffect, useState } from "react";
import { Landing } from "./Landing";
import { Methodology } from "./Methodology";
import { PowerIt } from "./PowerIt";
import { Result } from "./Result";
import { RunIt } from "./RunIt";
import { WorthIt } from "./WorthIt";
import { legacyRedirect } from "@/lib/plan";

type View = "landing" | "worth-it" | "run-it" | "power-it" | "result" | "sources";

const VIEWS: View[] = ["worth-it", "run-it", "power-it", "result", "sources"];

/** Old links (/calculator, /business-case, /speed-to-power, /methodology, /?v=) move to the new routes, keeping their plan. */
function resolve(): View {
  const { pathname, search, hash } = window.location;
  const to = legacyRedirect(pathname, search, hash);
  if (to) window.history.replaceState(null, "", to);
  const first = window.location.pathname.split("/")[1] as View;
  return VIEWS.includes(first) ? first : "landing";
}

const TITLES: Record<View, string> = {
  landing: "Breakeven · AI infrastructure cost, at your volume",
  "worth-it": "Breakeven · 1. Is AI worth it?",
  "run-it": "Breakeven · 2. How should we run it?",
  "power-it": "Breakeven · 3. Can we power it?",
  result: "Breakeven · Your AI plan",
  sources: "Breakeven · Sources",
};

export default function App() {
  // Resolving here, before any page mounts, means pages always read the new route's URL.
  const [view, setView] = useState<View>(resolve);

  useEffect(() => {
    const onPop = () => setView(resolve());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.title = TITLES[view];
  }, [view]);

  // Keyed by view so a page re-reads the plan from the URL each time you arrive on it.
  switch (view) {
    case "worth-it":
      return <WorthIt key={view} />;
    case "run-it":
      return <RunIt key={view} />;
    case "power-it":
      return <PowerIt key={view} />;
    case "result":
      return <Result key={view} />;
    case "sources":
      return <Methodology key={view} />;
    default:
      return <Landing />;
  }
}
