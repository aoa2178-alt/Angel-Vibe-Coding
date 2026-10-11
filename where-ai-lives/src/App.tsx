import { useEffect, useState } from "react";
import { Brief } from "./Brief";
import { GridStep } from "./GridStep";
import { Faq } from "./Faq";
import { Landing } from "./Landing";
import { MapStep } from "./MapStep";
import { SitesStep } from "./SitesStep";
import { Sources } from "./Sources";

type View = "landing" | "map" | "grid" | "sites" | "brief" | "sources" | "faq";
const VIEWS: View[] = ["map", "grid", "sites", "brief", "sources", "faq"];

const resolve = (): View => {
  const first = window.location.pathname.split("/")[1] as View;
  return VIEWS.includes(first) ? first : "landing";
};

const TITLES: Record<View, string> = {
  landing: "Where AI Lives · AI data centers and the grid",
  map: "Where AI Lives · AI sites",
  grid: "Where AI Lives · Grid and power",
  sites: "Where AI Lives · Site selection",
  brief: "Where AI Lives · Recommendation",
  sources: "Where AI Lives · Sources",
  faq: "Where AI Lives · FAQ",
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
    case "faq":
      return <Faq key={view} />;
    default:
      return <Landing />;
  }
}
