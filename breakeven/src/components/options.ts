import type { OptionId } from "@/lib/tco";
import type { OptionMeta } from "./ClosingBars";

/** Names, short labels, colors and one-line notes for the three ways to run AI, used on every page. */
export const OPTIONS: Record<OptionId, OptionMeta & { note: string }> = {
  api: { name: "Pay per token (API)", short: "API", swatch: "bg-api", note: "No hardware. You pay for every token." },
  rent: { name: "Rent cloud GPUs", short: "Rent", swatch: "bg-rent", note: "Pay by the GPU-hour, busy or idle." },
  own: { name: "Own GPUs", short: "Own", swatch: "bg-own", note: "Buy whole 8-GPU servers; pay power and upkeep." },
};
