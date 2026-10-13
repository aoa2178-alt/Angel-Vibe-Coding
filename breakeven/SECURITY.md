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
| Decision report (n8n) | Sends 10 scenario fields as JSON, no personal data. The response isn't displayed, so a bad response can't inject content. Errors show a fixed message. |
| Price watcher agent | It may only append to `prices.json`, never pushes to `main`, and must pass the tests first (`agents/price-watcher.md`). |
| Framing (clickjacking) | **Fixed in this review.** `vercel.json` now sends `frame-ancestors`, so only Breakeven itself and the portfolio site can show it in a frame. It also sends `nosniff`, a referrer policy, and a permissions policy that turns off the camera, microphone and location. |

## Known and accepted

- **The n8n webhook address is public and needs no password.** A static site can't keep a secret, so anyone could post to it. The risk is spam reports, not data loss. If it's ever abused, add a rate limit or a shared-secret check in the n8n workflow. Treat `scenario_name` as untrusted text inside the workflow.
