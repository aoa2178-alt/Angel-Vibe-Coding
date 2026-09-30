// Profiles created the first time the store is empty. "Product copy" carries over the guidelines and
// history built up in the single-profile version of the tool.

const PRODUCT_GUIDELINES = `- Lead with the reader's outcome, not the feature.
- Be specific: use numbers instead of adjectives, and name real customers instead of "teams everywhere".
- Back every big claim with proof right next to it, and cite the source of any statistic.
- Keep sentences under 20 words, one idea each. Paired contrasts work well for headlines.
- Keep the whole piece short: prefer a few lines over paragraphs, and cut any sentence that repeats what the reader already got.
- Set a mood: use evocative, sensory phrasing and fragments so the copy feels like a vibe, not an explanation.
- Write to "you", in active voice. Buttons start with a verb and say exactly what happens (never "Continue", "Submit" or "Click here").
- Keep it conversational, not formal: use contractions and everyday words, and cut stiff phrases like "per our records" or "please be advised".
- Use the reader's own words: don't explain what they already know, and don't use jargon they don't.
- Name the reader's pain concretely before offering the fix.
- Answer the reader's likely objection in the copy (price, effort, risk).
- Be confident, not hyped: no absolutes ("every", "all", "guaranteed"), and at most one exclamation mark per page.
- Use one term for each concept, everywhere.
- Error messages say what happened, why, and how to fix it, without blaming the reader.`;

const RESEARCH_PRINCIPLES = `- Lead with the reader's outcome, not the feature.
- Be specific: use numbers instead of adjectives, and name real customers instead of "teams everywhere".
- Back every big claim with proof right next to it, and cite the source of any statistic.
- Keep sentences short, one idea each. Paired contrasts work well for headlines.
- Write to "you", in active voice. Buttons start with a verb and say exactly what happens (never "Continue", "Submit" or "Click here").
- Use the reader's own words: don't explain what they already know, and don't use jargon they don't.
- Name the reader's pain concretely before offering the fix.
- Answer the reader's likely objection in the copy (price, effort, risk).
- Be confident, not hyped: no absolutes ("every", "all", "guaranteed"), and at most one exclamation mark per page.
- Use one term for each concept, everywhere.
- Error messages say what happened, why, and how to fix it, without blaming the reader.`;

const AFTER_VIBE_FEEDBACK = RESEARCH_PRINCIPLES.replace(
  "- Keep sentences short, one idea each. Paired contrasts work well for headlines.",
  `- Keep sentences short, one idea each. Paired contrasts work well for headlines.
- Keep the whole piece short: prefer a few lines over paragraphs, and cut any sentence that repeats what the reader already got.
- Set a mood: use evocative, sensory phrasing and fragments so the copy feels like a vibe, not an explanation.`
);

export const SEED_PROFILES = [
  {
    id: "product-copy",
    name: "Product copy",
    createdAt: "2026-09-30T00:00:00.000Z",
    guidelines: PRODUCT_GUIDELINES,
    examples: "",
    history: [
      {
        at: "2026-09-30T15:31:58.234Z",
        kind: "added",
        summary: "Made the sentence-length rule specific (under 20 words) and added a conversational-tone rule. No conflicts.",
        rules: [
          "Keep sentences under 20 words, one idea each. Paired contrasts work well for headlines.",
          `Keep it conversational, not formal: use contractions and everyday words, and cut stiff phrases like "per our records" or "please be advised".`
        ],
        comment: "The rewrite is too formal. Keep sentences under 20 words."
      },
      {
        at: "2026-09-30T14:43:33.122Z",
        kind: "added",
        summary: "Added two rules capturing your ask for shorter, more atmospheric copy; they sit alongside the existing sentence-level brevity guideline without conflicting.",
        rules: [
          "Keep the whole piece short: prefer a few lines over paragraphs, and cut any sentence that repeats what the reader already got.",
          "Set a mood: use evocative, sensory phrasing and fragments so the copy feels like a vibe, not an explanation."
        ],
        comment: "Make it more vibey and with lesser text"
      },
      {
        at: "2026-09-30T14:40:01.569Z",
        kind: "seed",
        summary: "Started from the 11 research principles (Vercel, Ramp, Shopify)."
      }
    ],
    undo: ["", RESEARCH_PRINCIPLES, AFTER_VIBE_FEEDBACK]
  },
  {
    id: "investor-updates",
    name: "Investor updates",
    createdAt: "2026-09-30T00:00:01.000Z",
    guidelines: "",
    examples: "",
    history: [],
    undo: []
  }
];
