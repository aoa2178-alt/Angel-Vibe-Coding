import { useEffect, useState } from "react";
import { Calculator } from "./Calculator";
import { Landing } from "./Landing";

type View = "landing" | "calculator";

function viewFor(location: Location): View {
  if (location.pathname.startsWith("/calculator")) return "calculator";
  // Links shared before the landing page existed point at "/?v=…"; those still open the calculator.
  if (location.pathname === "/" && location.search) return "calculator";
  return "landing";
}

export default function App() {
  const [view, setView] = useState<View>(() => viewFor(window.location));

  useEffect(() => {
    if (window.location.pathname === "/" && window.location.search) {
      window.history.replaceState(null, "", `/calculator${window.location.search}${window.location.hash}`);
    }
    const onPop = () => setView(viewFor(window.location));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.title = view === "landing" ? "Breakeven · AI infrastructure cost, at your volume" : "Breakeven · Own, rent, or API?";
  }, [view]);

  return view === "landing" ? <Landing /> : <Calculator />;
}
