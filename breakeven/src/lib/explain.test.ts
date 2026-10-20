import { describe, expect, it } from "vitest";
import { flipSegments, volumeInWords, volumePosition, whyShort, whyThisWins } from "./explain";
import { DEFAULT_ASSUMPTIONS, DEFAULT_WORKLOAD, compare, crossovers } from "./tco";

const at = (tokensM: number) => ({ ...DEFAULT_WORKLOAD, tokensM });

describe("Plain-English explanations", () => {
  it("translates a volume into words and tokens per second", () => {
    expect(volumeInWords(2_000)).toBe("≈ 1.5 billion words a month · about 760 tokens every second");
    expect(volumeInWords(200)).toContain("150 million words");
  });

  it("explains each winner with the model's own numbers", () => {
    const api = whyThisWins(at(200), compare(at(200), DEFAULT_ASSUMPTIONS));
    expect(api).toMatch(/^At 200M tokens a month you'd keep a GPU busy only part of the time/);
    const rentCosts = compare(at(2_000), DEFAULT_ASSUMPTIONS);
    const rent = whyThisWins(at(2_000), rentCosts);
    expect(rent).toContain("about 1 GPU working all the time");
    expect(rent).toContain("$1,825");
    expect(whyThisWins(at(30_000), compare(at(30_000), DEFAULT_ASSUMPTIONS))).toMatch(/owning them .* costs less/);
  });

  it("finds the same flip points as the crossover scan", () => {
    const segs = flipSegments(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS);
    const cross = crossovers(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS);
    expect(segs[0]!.id).toBe("api");
    expect(segs[segs.length - 1]!.id).toBe("own");
    expect(segs[0]!.from).toBe(0);
    expect(segs[segs.length - 1]!.to).toBeCloseTo(1, 5);
    // The API's range ends where the crossover scan says it stops winning (within one sample step).
    expect(segs[0]!.toM / cross.apiUntilM!).toBeGreaterThan(0.9);
    expect(segs[0]!.toM / cross.apiUntilM!).toBeLessThan(1.1);
    expect(volumePosition(1)).toBe(0);
    expect(volumePosition(1e9)).toBe(1);
  });
});

describe("Read-aloud wording", () => {
  it("says short forms in full", async () => {
    const { forSpeech } = await import("@/components/Explain");
    expect(forSpeech("At 2B tokens, 1 GPU costs $11K and the API $8,000; 460M is the flip.")).toBe(
      "At 2 billion tokens, 1 G P U costs $11 thousand and the A P I $8,000; 460 million is the flip.",
    );
  });
});

describe("whyShort", () => {
  const at = (tokensM: number) => ({ ...DEFAULT_WORKLOAD, tokensM });
  it("gives the reason in one sentence with all three costs", () => {
    expect(whyShort(at(2_000), compare(at(2_000), DEFAULT_ASSUMPTIONS))).toBe("One rented GPU covers 2B tokens a month: $1,825, versus $8,000 on the API and $11,182 to own.");
    expect(whyShort(at(200), compare(at(200), DEFAULT_ASSUMPTIONS))).toMatch(/^200M tokens a month won't keep a GPU busy: the API costs \$800/);
    expect(whyShort(at(30_000), compare(at(30_000), DEFAULT_ASSUMPTIONS))).toMatch(/so owning them costs/);
  });
});
