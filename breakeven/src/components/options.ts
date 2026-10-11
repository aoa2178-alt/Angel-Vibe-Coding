import type { OptionId } from "@/lib/tco";
import type { OptionMeta } from "./ClosingBars";

/** Names, short labels, colors and one-line notes for the three ways to run AI, used on every page. */
export const OPTIONS: Record<OptionId, OptionMeta & { note: string }> = {
  api: { name: "Pay per token (API)", short: "API", swatch: "bg-api", note: "No infrastructure; usage-based pricing per token." },
  rent: { name: "Rent cloud GPUs", short: "Rent", swatch: "bg-rent", note: "Dedicated capacity billed per GPU-hour, used or idle." },
  own: { name: "Own GPUs", short: "Own", swatch: "bg-own", note: "Capital purchase in 8-GPU servers, plus power and maintenance." },
};
