# Draft Rewriter

Rewrites drafts in the team's house voice with Claude. Each **voice profile** (for example, Product copy or Investor updates) has its own guidelines, reference examples and change history, shared by everyone who uses the deployment. Feedback on a rewrite turns into new guidelines, and any conflicts are sent back to you to decide.

## How it's built

- `public/`: the page (`index.html`, `app.js`, and `samples.js` for demo mode).
- `api/`: Vercel Functions. The Claude API key and all prompts stay on the server.
  - `config.js`: deployment settings, and the access-code check.
  - `profiles.js`, `profile.js`: list, create, save and delete voice profiles.
  - `rewrite.js`: streams the rewrite, the guideline check and the variants.
  - `feedback.js`: turns feedback into guideline changes.
- Storage: a private Vercel Blob store on Vercel, and `data/profiles.json` when running locally. Saves are batched (a few seconds after typing stops, or when a box loses focus) because Blob's Hobby plan includes 2,000 writes a month. A save only goes through if nobody else saved since you loaded the profile, so teammates can't silently overwrite each other.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY, TEAM_ACCESS_CODE
npm run dev                  # http://localhost:5175
```

Without `ANTHROPIC_API_KEY`, the page asks for a key (it's sent with each request and never stored on the server). With no key at all, it runs in demo mode using sample answers.

## Deploy to Vercel

Run these from this folder (`rewrite-tool/`):

```bash
npx vercel login
npx vercel link                                   # create the project
npx vercel blob create-store draft-rewriter --access private   # shared storage, then connect it to the project
npx vercel env add ANTHROPIC_API_KEY production   # paste the team's Claude key
npx vercel env add TEAM_ACCESS_CODE production    # the code teammates will enter
npx vercel --prod
```

Share the production URL and the access code with the team. A deployment without `TEAM_ACCESS_CODE` refuses every request, so the Claude key is never exposed by accident.

The first visit creates two profiles: **Product copy** (with the guidelines built up so far) and **Investor updates** (empty).

Notes:
- Vercel's Hobby plan is for personal, non-commercial use. A team tool for a company needs a Pro plan.
- Rewrites stream for up to 300 seconds, which is the Hobby maximum and well within Pro's limit.
- To rotate the access code, change `TEAM_ACCESS_CODE` and redeploy. Everyone gets asked for the new code.
