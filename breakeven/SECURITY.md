# Security review

**Latest review:** October 13, 2026, covering the whole live app (main), including everything added since the first review on October 6, 2026.

## What Breakeven is, from a security point of view

- A static single-page app on Vercel. There's no server code of its own, no accounts or sign-in, no database, and no API keys or secrets in the code or the browser.
- All calculations run in the browser from code and a checked-in price file.

## What was checked

| Area | Result |
|---|---|
| Secrets | None in the repo or the built site. |
| Cross-site scripting | No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `document.write`. Everything is rendered by React, which escapes text. |
| Links read from the URL | Plan settings are parsed as numbers or matched against fixed lists; anything else falls back to defaults. Old-link redirects only go to Breakeven's own pages (no open redirect). |
| Outside links | Source links in the price history must start with `https://` (enforced by `prices.test.ts`). Links that open a new tab use `noopener`. "Ask ChatGPT/Claude" opens fixed sites with the recommendation text URL-encoded. |
| Decision report | Built inside Breakeven at `/report` from the plan in the link; nothing is sent to any server. The scenario name and other answers read from the link are checked or limited before use, and React escapes them when shown. (It used to post to an n8n webhook; that was removed on October 13, 2026.) |
| Questions? panel | Searches the FAQ in the browser. "Message Angel" is a plain email link (`mailto:`) that opens the visitor's own mail app with the question and the scenario link; the app itself sends and stores nothing. |
| Price watcher agent | It may only append to `prices.json`, never pushes to `main`, and must pass the tests first (`agents/price-watcher.md`). |
| Framing (clickjacking) | **Fixed in this review.** `vercel.json` now sends `frame-ancestors`, so only Breakeven itself and the portfolio site can show it in a frame. It also sends `nosniff`, a referrer policy, and a permissions policy that turns off the camera, microphone and location. |

## Known and accepted

- None open. Breakeven sends no data anywhere: every page, including the decision report, runs entirely in the browser.
