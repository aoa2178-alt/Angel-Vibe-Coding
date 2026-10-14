# Security review

**Latest review:** October 13, 2026, covering the whole live app (main), including everything added since the first review on October 6, 2026.

## What Breakeven is, from a security point of view

- A single-page app on Vercel with one small server function, `/api/ask`, for the Questions panel. No accounts or sign-in, no database, and no API keys or secrets in the code or the browser.
- All calculations run in the browser from code and a checked-in price file.

## What was checked

| Area | Result |
|---|---|
| Secrets | None in the repo or the built site. |
| Cross-site scripting | No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `document.write`. Everything is rendered by React, which escapes text. |
| Links read from the URL | Plan settings are parsed as numbers or matched against fixed lists; anything else falls back to defaults. Old-link redirects only go to Breakeven's own pages (no open redirect). |
| Outside links | Source links in the price history must start with `https://` (enforced by `prices.test.ts`). Links that open a new tab use `noopener`. "Ask ChatGPT/Claude" opens fixed sites with the recommendation text URL-encoded. |
| Decision report | Built inside Breakeven at `/report` from the plan in the link; nothing is sent to any server. The scenario name and other answers read from the link are checked or limited before use, and React escapes them when shown. (It used to post to an n8n webhook; that was removed on October 13, 2026.) |
| Questions? panel (Ask Claude, added October 14, 2026) | A typed question, the last few turns and a short summary of the scenario on screen go to `/api/ask`, which calls the Claude API. The key is a Vercel environment variable (`ANTHROPIC_API_KEY`), never in the code or browser. The function only answers requests from Breakeven's own sites, caps the size of every field, limits each visitor to 20 questions a day, keeps answers short (400 tokens) and tells Claude to treat the scenario as data and stay on Breakeven topics. The monthly spending cap in the Anthropic console is the hard limit. Answers are shown as plain text (React escapes them). Nothing is stored. "Message Angel" is still a plain `mailto:` link. |
| Read-aloud and dark mode | Speech uses the browser's built-in voice (no audio leaves the device). The theme choice is kept in this browser's local storage, and nothing else is stored. |
| For AI agents | `/llms.txt` and the JSON-LD block are public descriptions of the app and its formulas; they contain no personal data or secrets. |
| Price watcher agent | It may only append to `prices.json`, never pushes to `main`, and must pass the tests first (`agents/price-watcher.md`). |
| Framing (clickjacking) | **Fixed in this review.** `vercel.json` now sends `frame-ancestors`, so only Breakeven itself and the portfolio site can show it in a frame. It also sends `nosniff`, a referrer policy, and a permissions policy that turns off the camera, microphone and location. |

## Known and accepted

- The per-visitor limit is kept in the function's memory, so it resets when Vercel starts a new instance; the Anthropic spending cap backs it up.
- Questions typed into the Questions panel are sent to Anthropic to answer (the panel says so). Everything else runs in the browser.
