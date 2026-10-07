import { useEffect, useState } from "react";
import { Landing } from "./Landing";
import { NoteStep } from "./NoteStep";
import { PayoffStep } from "./PayoffStep";
import { ReceiversStep } from "./ReceiversStep";
import { Sources } from "./Sources";
import { SpendStep } from "./SpendStep";

type View = "landing" | "spend" | "payoff" | "receivers" | "note" | "sources";
const VIEWS: View[] = ["spend", "payoff", "receivers", "note", "sources"];

const resolve = (): View => {
  const first = window.location.pathname.split("/")[1] as View;
  return VIEWS.includes(first) ? first : "landing";
};

const TITLES: Record<View, string> = {
  landing: "Buildout · AI capex, from the filings",
  spend: "Buildout · 1. Spend",
  payoff: "Buildout · 2. Payoff",
  receivers: "Buildout · 3. Receivers",
  note: "Buildout · Quarterly note",
  sources: "Buildout · Sources",
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
    case "payoff":
      return <PayoffStep key={view} />;
    case "receivers":
      return <ReceiversStep key={view} />;
    case "note":
      return <NoteStep key={view} />;
    case "sources":
      return <Sources key={view} />;
    default:
      return <Landing />;
  }
}
