import { useEffect, useState } from "react";
import { Brief } from "./Brief";
import { GridStep } from "./GridStep";
import { Landing } from "./Landing";
import { MapStep } from "./MapStep";
import { SitesStep } from "./SitesStep";
import { Sources } from "./Sources";

type View = "landing" | "map" | "grid" | "sites" | "brief" | "sources";
const VIEWS: View[] = ["map", "grid", "sites", "brief", "sources"];

const resolve = (): View => {
  const first = window.location.pathname.split("/")[1] as View;
  return VIEWS.includes(first) ? first : "landing";
};

const TITLES: Record<View, string> = {
  landing: "Where AI Lives · AI data centers and the grid",
  map: "Where AI Lives · 1. Map",
  grid: "Where AI Lives · 2. Grid",
  sites: "Where AI Lives · 3. Sites",
  brief: "Where AI Lives · The call",
  sources: "Where AI Lives · Sources",
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
    case "map":
      return <MapStep key={view} />;
    case "grid":
      return <GridStep key={view} />;
    case "sites":
      return <SitesStep key={view} />;
    case "brief":
      return <Brief key={view} />;
    case "sources":
      return <Sources key={view} />;
    default:
      return <Landing />;
  }
}
