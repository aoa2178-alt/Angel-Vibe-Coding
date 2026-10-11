import { Fold } from "@/components/Fold";
import { Frame, useScenario } from "@/components/Frame";

/** The explanations behind the numbers, kept here so the working pages stay short. Each answer has an id for deep links. */
export const FAQ_GROUPS: { title: string; items: { id: string; q: string; a: string }[] }[] = [
  {
    title: "Data",
    items: [
      {
        id: "demand-data",
        q: "Where does the demand history come from?",
        a: "Public US Census series published on FRED, not seasonally adjusted so the real seasonality stays in. The tablet uses retail sales at electronics and appliance stores (MRTSSM443USN); the AI server uses new orders for electronic computers (U34ANO). Each is rescaled to a fictional product's volume. The products and company are fictional; every price, cost and lead time is a labeled assumption.",
      },
      {
        id: "delivery-data",
        q: "Where does the delivery data come from?",
        a: "The DataCo Smart Supply Chain dataset (Constante, Silva and Pereira, 2019, Mendeley Data, CC BY 4.0): 180,519 orders across five markets and four shipping modes. DataCo is a different, anonymized company; its orders are used as a delivery benchmark, mapped to the product's regions.",
      },
    ],
  },
  {
    title: "Forecast and supply plan",
    items: [
      {
        id: "methods",
        q: "How is the forecast method chosen?",
        a: "Three standard methods (same month last year, a 3-month moving average, and Holt-Winters exponential smoothing) are each fitted without the last 12 months and scored on them. The method with the lowest WAPE sets the plan; you can override it.",
      },
      {
        id: "wape",
        q: "What are WAPE and bias?",
        a: "WAPE (weighted absolute percentage error) is the total size of the misses divided by total demand over the held-out months. Bias is the net over- or under-forecast as a share of demand. The forecast error also sets the safety stock.",
      },
      {
        id: "safety-stock",
        q: "How are safety stock and order size set?",
        a: "Safety stock = z × forecast error × √(lead time + 1 month), where z comes from the service level (the chance of not running out in a replenishment cycle). Order size is the economic order quantity, √(2 × annual demand × order cost ÷ annual holding cost per unit), and never less than a month of demand.",
      },
      {
        id: "service-cost",
        q: "Why does high service cost so much?",
        a: "Safety stock grows with z, which rises steeply near 100%. Each extra point of service needs more stock than the last, so holding cost climbs faster than shortages fall. Total cost is lowest at the service level where the two balance.",
      },
      {
        id: "launch",
        q: "How is the launch quantity set?",
        a: "The newsvendor model for the first quarter on sale: build Q* = expected demand + z × its standard deviation, at the critical ratio = margin lost per unit short ÷ (margin lost + loss per unit left over, cost less salvage).",
      },
    ],
  },
  {
    title: "Allocation, bullwhip and delivery",
    items: [
      {
        id: "allocation",
        q: "How do the allocation rules differ?",
        a: "Fair share splits the shortfall in proportion to each region's demand. Priority fills regions in the order you set. Most margin fills the most profitable region first. The trade-off is margin against the lowest fill rate any region receives.",
      },
      {
        id: "bullwhip",
        q: "How is the bullwhip modeled?",
        a: "A four-tier chain: retailer, distributor, factory, supplier. Each tier forecasts with a moving average of the orders it receives, targets (lead time + 1) months of that forecast, and orders to restore the target. The bullwhip ratio is the variance of a tier's orders divided by the variance of customer demand. Sharing end-customer demand means every tier forecasts from actual sales instead of the orders it receives.",
      },
      {
        id: "late",
        q: "What drives late deliveries in the data?",
        a: "The shipping mode, not the market or the product. Late rates differ widely by mode (the faster the promise, the more often it is missed) but sit within a narrow band across markets and product categories. The lever is the delivery promise and the carrier.",
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
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">How Throughline works</h1>
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
