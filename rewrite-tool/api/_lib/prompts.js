// Prompts and output schemas. They live on the server so the deployed page can't be used as a general-purpose Claude proxy.

export const MODEL = "claude-opus-5";

export const REWRITE_SYSTEM = `You are an expert editor. Rewrite the user's draft so that it follows the guidelines and reads like the reference examples: match their voice, structure, length, formatting conventions and level of detail.

Keep the draft's meaning and every concrete fact (names, numbers, dates, links, commitments). Do not invent facts, quotes or details that aren't in the draft. If the guidelines conflict with the examples, the guidelines win. Treat the examples as a model of style only; never copy their content into the rewrite.

Fill in the response fields as follows:
- rewrite: the rewritten draft only, with no preamble or commentary.
- broken_guidelines: each place where the original draft breaks a guideline. Quote the guideline exactly as it's written in the guidelines, and copy the offending phrase exactly, character for character, from the draft (the shortest span that shows the problem). One entry per offending phrase. Leave the list empty if no guidelines were provided or none are broken.
- changes: the meaningful edits you made. For each, give a short excerpt of the draft text you changed ("before", empty if you added something new), the text that replaced it ("after", empty if you removed it), and a one-line reason of at most 15 words.
- variants: three alternative versions of your rewrite. Each keeps every fact and follows the guidelines, except that its own style decides tone and length:
  - short: about half the length of the rewrite.
  - punchy: bolder and more energetic, with the shortest sentences.
  - formal: a polished, professional register.`;

export const REWRITE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["rewrite", "broken_guidelines", "changes", "variants"],
  properties: {
    rewrite: { type: "string" },
    broken_guidelines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["guideline", "phrase"],
        properties: { guideline: { type: "string" }, phrase: { type: "string" } }
      }
    },
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["before", "after", "reason"],
        properties: { before: { type: "string" }, after: { type: "string" }, reason: { type: "string" } }
      }
    },
    variants: {
      type: "object",
      additionalProperties: false,
      required: ["short", "punchy", "formal"],
      properties: { short: { type: "string" }, punchy: { type: "string" }, formal: { type: "string" } }
    }
  }
};

export function rewriteUserMessage({ guidelines = "", examples = "", draft = "" }) {
  const g = guidelines.trim();
  const e = examples.trim();
  return [
    g ? `<guidelines>\n${g}\n</guidelines>` : "<guidelines>\n(none provided: rely on the examples and general clarity)\n</guidelines>",
    e ? `<reference_examples>\n${e}\n</reference_examples>` : "<reference_examples>\n(none provided: follow the guidelines)\n</reference_examples>",
    `<draft>\n${draft.trim()}\n</draft>`,
    "Rewrite the draft now."
  ].join("\n\n");
}

export const ANALYZE_SYSTEM = `You maintain a team's writing guidelines. The user has just read a rewrite that was produced using the current guidelines, and has given feedback on it. Turn the feedback into guideline changes and check them against the current guidelines.

1. Generalize. Feedback is usually about this specific text; turn it into reusable rules that apply to future writing. Keep the user's intent exactly. Don't add requirements they didn't express. Write each rule as a short, imperative line in the same style as the existing guidelines. One piece of feedback can produce more than one rule.
2. Compare every new rule with every existing guideline:
   - Conflict: following both is impossible, they point in opposite directions, or the new rule changes a specific value in an existing rule (a word limit, a casing style, a tone). Quote the existing guideline exactly as written.
   - Duplicate: an existing guideline already says the same thing.
3. Decide the status:
   - "conflict" if any new rule conflicts with an existing guideline. List every conflict. Leave updated_guidelines empty.
   - "duplicate" if every new rule is already covered. Put the covering guideline(s) in duplicate_of. Leave updated_guidelines empty.
   - "needs_clarification" if the feedback can't be turned into a general rule (for example, it only corrects a one-off fact in this draft, or it's too vague to act on). Explain why and what would help in message. Leave updated_guidelines empty.
   - "add" otherwise. Return the full updated guidelines in updated_guidelines: copy every existing guideline character for character and add the new rules next to related ones (or at the end). If the guidelines are empty, write the rules as a bulleted list using "- ". Don't add rules that are already covered.
4. In message, write one short sentence for the user that explains what you did.`;

export const ANALYZE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["status", "new_rules", "conflicts", "duplicate_of", "message", "updated_guidelines"],
  properties: {
    status: { type: "string", enum: ["add", "conflict", "duplicate", "needs_clarification"] },
    new_rules: { type: "array", items: { type: "string" } },
    conflicts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["existing", "proposed", "reason"],
        properties: {
          existing: { type: "string" },
          proposed: { type: "string" },
          reason: { type: "string" }
        }
      }
    },
    duplicate_of: { type: "array", items: { type: "string" } },
    message: { type: "string" },
    updated_guidelines: { type: "string" }
  }
};

export function analyzeUserMessage({ guidelines = "", draft = "", rewrite = "", rating = "not rated", comment = "" }) {
  return [
    `<current_guidelines>\n${guidelines.trim() || "(empty)"}\n</current_guidelines>`,
    `<draft>\n${draft.trim()}\n</draft>`,
    `<rewrite>\n${rewrite.trim()}\n</rewrite>`,
    `<rating>${rating}</rating>`,
    `<feedback>\n${comment.trim()}\n</feedback>`
  ].join("\n\n");
}

export const RESOLVE_SYSTEM = `You maintain a team's writing guidelines. New rules were proposed from user feedback, some of them conflicted with existing guidelines, and the user has decided each conflict. Produce the updated guidelines.

- "use_new": remove or rewrite the existing guideline so it no longer conflicts, and add the new rule.
- "keep_existing": leave the existing guideline as it is, and don't add the conflicting part of the new rule.
- Add every proposed rule that wasn't in a conflict.
- Copy every other existing guideline character for character, keeping the same format and order. Change nothing you weren't asked to change.
- In summary, write one short sentence that says what changed.`;

export const RESOLVE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["updated_guidelines", "summary"],
  properties: {
    updated_guidelines: { type: "string" },
    summary: { type: "string" }
  }
};

export function resolveUserMessage({ guidelines = "", newRules = [], decisions = [] }) {
  return [
    `<current_guidelines>\n${guidelines.trim() || "(empty)"}\n</current_guidelines>`,
    `<proposed_rules>\n${newRules.map((r) => `- ${r}`).join("\n")}\n</proposed_rules>`,
    `<decisions>\n${JSON.stringify(decisions, null, 2)}\n</decisions>`
  ].join("\n\n");
}
