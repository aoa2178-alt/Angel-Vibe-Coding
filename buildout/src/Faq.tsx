import { Fold } from "@/components/Fold";
import { Frame, useScenario } from "@/components/Frame";

/** The explanations behind the numbers, kept here so the working pages stay short. Each answer has an id for deep links. */
export const FAQ_GROUPS: { title: string; items: { id: string; q: string; a: string }[] }[] = [
  {
    title: "Data",
    items: [
      {
        id: "source",
        q: "Where do the figures come from?",
        a: "SEC EDGAR's XBRL company facts: the figures each company reports in its 10-Q and 10-K. Six spenders (Microsoft, Alphabet, Amazon, Meta, Apple, Oracle) and four suppliers (NVIDIA, Broadcom, Vertiv, Eaton). Every value links to its filing on the Sources page.",
      },
      {
        id: "capex",
        q: "What counts as capex?",
        a: "Cash paid for property, plant and equipment (PaymentsToAcquirePropertyPlantAndEquipment), or for productive assets where a company reports that instead (Amazon). Amazon's figure is before finance leases.",
      },
      {
        id: "quarters",
        q: "How are quarters lined up when fiscal years differ?",
        a: "Filings report year-to-date figures, so each quarter is derived by subtraction (Q2 = six months − Q1, and so on) and mapped to a calendar quarter by its period end. Microsoft's fiscal year ends in June and Oracle's in May; the app compares companies on calendar quarters.",
      },
    ],
  },
  {
    title: "Returns",
    items: [
      {
        id: "intensity",
        q: "What is capex intensity?",
        a: "Capex divided by revenue over the last twelve months. Rising intensity means more of each revenue dollar is going into the build-out.",
      },
      {
        id: "fcf",
        q: "How is free cash flow calculated?",
        a: "Operating cash flow minus capex, over the last twelve months.",
      },
      {
        id: "depreciation",
        q: "Why does capex ÷ depreciation matter?",
        a: "Capex becomes depreciation over the assets' lives. While capex runs above depreciation (a ratio above 1×), the asset base is still growing, so depreciation, a future cost, keeps rising.",
      },
    ],
  },
  {
    title: "Suppliers",
    items: [
      {
        id: "read-through",
        q: "How is the supplier read-through calculated?",
        a: "The suppliers' trailing twelve-month revenue against the spenders' trailing capex, indexed to a base quarter, plus the extra supplier revenue per extra dollar of capex since that base. It is illustrative: the suppliers also sell to other customers and the spenders also buy elsewhere, so it shows direction and scale, not a contract-level match.",
      },
      {
        id: "advice",
        q: "Is this investment advice?",
        a: "No. Buildout summarizes public filings for analysis and discussion.",
      },
    ],
  },
];

export function Faq() {
  const [s, setS] = useScenario("faq");
  return (
    <Frame route="faq" s={s} setS={setS}>
      <div className="mb-8 max-w-2xl">
        <p className="kicker">FAQ</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">How Buildout works</h1>
      </div>
      <div className="grid gap-10">
        {FAQ_GROUPS.map((g) => (
          <section key={g.title} aria-label={g.title}>
            <h2 className="mb-3 text-lg font-semibold">{g.title}</h2>
            <div className="grid gap-2">
              {g.items.map((it) => (
                <Fold key={it.id} id={it.id} title={it.q}>
                  <p className="max-w-3xl text-[15px] leading-7 text-ink-2">{it.a}</p>
                </Fold>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Frame>
  );
}
