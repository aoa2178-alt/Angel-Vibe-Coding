import { useEffect, useState } from "react";
import { BusinessCase } from "./BusinessCase";
import { Calculator } from "./Calculator";
import { Landing } from "./Landing";
import { Methodology } from "./Methodology";

type View = "landing" | "calculator" | "methodology" | "business-case";

function viewFor(location: Location): View {
  if (location.pathname.startsWith("/calculator")) return "calculator";
  if (location.pathname.startsWith("/methodology")) return "methodology";
  if (location.pathname.startsWith("/business-case")) return "business-case";
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
    document.title = {
      landing: "Breakeven · AI infrastructure cost, at your volume",
      calculator: "Breakeven · Own, rent, or API?",
      methodology: "Breakeven · Methodology and sources",
      "business-case": "Breakeven · Build a business case",
    }[view];
  }, [view]);

  if (view === "methodology") return <Methodology />;
  if (view === "business-case") return <BusinessCase />;
  return view === "landing" ? <Landing /> : <Calculator />;
}
