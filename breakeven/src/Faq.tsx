import { useEffect } from "react";
import { Fold } from "@/components/Fold";
import { PlanFrame, usePlan } from "@/components/PlanFrame";

export { FAQ_GROUPS } from "@/lib/faq";
import { FAQ_GROUPS } from "@/lib/faq";

export function Faq() {
  const [plan] = usePlan("faq");
  useEffect(() => {
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, []);
  return (
    <PlanFrame route="faq" plan={plan} strip={false} bare>
      <div className="mx-auto max-w-[900px] px-4 py-14 sm:px-8 sm:py-20">
        <p className="kicker">FAQ</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Questions behind the numbers</h1>
        {FAQ_GROUPS.map((g) => (
          <section key={g.title} className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">{g.title}</h2>
            <div className="mt-4 grid gap-3">
              {g.items.map((it) => (
                <Fold key={it.id} id={it.id} title={it.q}>
                  <p className="max-w-3xl text-[15px] leading-7 text-ink-2">{it.a}</p>
                </Fold>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PlanFrame>
  );
}
