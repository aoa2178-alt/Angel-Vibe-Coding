import { Frame, useScenario } from "@/components/Frame";
import { Card, Confidence, FactList, SourceLink } from "@/components/ui";
import { CAMPUSES, DATA, MILESTONES, lowerFirst } from "@/lib/model";

const ASSUMPTIONS: { label: string; value: string; why: string }[] = [
  { label: "Milestone dates inside each phase", value: "Fitted to public dates", why: "Companies rarely publish when transformers, cooling or GPUs arrive. Each phase's milestone dates are set so the model reproduces the public construction start, target and go-live dates; slip them in step 3." },
  { label: "PUE", value: "1.15–1.25", why: "New liquid-cooled AI campuses run around 1.1–1.3. QTS's water-free design is set a little lower." },
  { label: "Average load", value: "85%", why: "AI training and inference campuses run hot but not flat out; 85% of full power is a planning figure." },
  { label: "Lease rate", value: "$140–150 per kW per month", why: "Wholesale hyperscale leases price below the ~$195/kW-month CBRE reports for smaller colocation deployments." },
  { label: "GPU price", value: "$4 per GPU-hour", why: "Blackwell-class GPUs rent above the ~$2.82/hour H100 index (October 2026); contracted rates sit well below on-demand list prices." },
  { label: "Build cost", value: "$11–12.5M per MW of IT", why: "Crusoe's $15 billion joint venture for 1.2 GW works out to about $12.5M per MW; large hyperscale shells cost somewhat less." },
  { label: "Cost of capital", value: "8–10% a year", why: "A blended rate for project debt and equity in data center development." },
];

/** Where every number comes from: the GPU power figure, each campus's public facts, regional prices, and the assumptions. */
export function Sources() {
  const [s, setS] = useScenario("sources");
  return (
    <Frame route="sources" s={s} setS={setS}>
      <div className="mb-8 max-w-3xl">
        <p className="kicker">Sources</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">What's public, and what's assumed</h1>
        <p className="mt-4 text-lg leading-8 text-ink-2">
          Loadline separates what companies have disclosed from what the model assumes. Every fact links to its source with a confidence level;
          every assumption is editable. Checked {DATA.checked}.
        </p>
      </div>

      <div className="grid gap-6">
        {Object.values(DATA.gpuProfiles).map((g) => (
          <Card key={g.label}>
            <div className="flex items-start justify-between gap-3">
              <p className="kicker">Power per GPU · {g.label}</p>
              <Confidence level={g.confidence} />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold">{g.kwPerGpu} kW per GPU</p>
            <p className="mt-2 text-[15px] leading-7 text-ink-2">
              {g.why} <SourceLink href={g.source} />
            </p>
          </Card>
        ))}

        {CAMPUSES.map((c) => (
          <Card key={c.id}>
            <p className="kicker">
              {c.company}, {c.site}
            </p>
            <div className="mt-2">
              <FactList facts={c.facts} />
            </div>
            <p className="mt-3 flex items-start justify-between gap-3 border-t border-line pt-3 text-sm leading-6 text-ink-2">
              <span>
                Power price: ${c.region.pricePerMwh}/MWh. {c.region.priceNote} <SourceLink href={c.region.priceSource} />
              </span>
              <Confidence level="Primary" />
            </p>
          </Card>
        ))}

        <Card>
          <p className="kicker">Assumptions</p>
          <ul className="mt-2 divide-y divide-line">
            {ASSUMPTIONS.map((a) => (
              <li key={a.label} className="grid gap-1 py-3 text-sm leading-6 sm:grid-cols-[14rem_1fr] sm:gap-6">
                <span>
                  <span className="block font-semibold text-ink">{a.label}</span>
                  <span className="font-mono text-xs text-muted">{a.value}</span>
                </span>
                <span className="text-ink-2">{a.why}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <p className="kicker">The model</p>
          <dl className="mt-2 divide-y divide-line text-sm">
            {[
              ["Power", "GPUs × kW per GPU = IT MW; × PUE = facility MW"],
              ["Electricity", "facility MW × 8,760 hours × average load × $/MWh"],
              ["Go-live", `latest of ${MILESTONES.map((m) => lowerFirst(m.label)).join(", ")}, plus commissioning`],
              ["Critical path", "the milestone that finishes last; every other milestone has slack = critical date − its date"],
              ["Cost of a month late", "lost revenue (IT kW × lease rate, or GPUs × 730 h × utilization × $/GPU-hour) + build cost × cost of capital ÷ 12"],
              ["Resolve first", "slip each milestone 3 more months and rank by the cost of the go-live it moves"],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="font-semibold">{k}</dt>
                <dd className="font-mono text-[13px] leading-6 text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </Frame>
  );
}
