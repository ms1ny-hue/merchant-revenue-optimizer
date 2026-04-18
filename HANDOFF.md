# HANDOFF — Plaid API integration

**Scope for this session:** Plaid API integration only. Do not touch persona, waterfall math, ABL, stress engine, pre-onboarding, or product naming. Those are separate work streams.

**Three additional work streams exist in this repo: `TIER1_MATH.md`, `TIER2_REALISM.md`, `SCRUB.md`. Do not read or execute them in this session. They are explicitly out of scope.**

---

## 1. Current state

- `data.json` — static Plaid sandbox dump committed to the repo, loaded client-side.
- `index.html` — monolithic single-file frontend. Key refs:
  - `CONFIG` at line 362
  - `PERSONA_OVERRIDES` at line 518 (flat JS object keyed on Plaid account `name`)
  - `loadData()` at line 610
  - `fetch('data.json', { cache: 'no-store' })` at line 611 — this is the static load to replace
- `netlify.toml` — has `[build]` with `functions = "netlify/functions"` and a `[dev]` block. No functions directory exists yet.
- No backend, no env vars, no Plaid Link, no webhooks, no `/transactions/sync`.
- No `.gitignore` in repo root. No `.env` file yet.
- Static site currently served locally by `python3 -m http.server 8765`; deploys to Netlify.

**Static vs live:** everything is static. The app does one `fetch()` against a local JSON file on page load. No code in the repo touches the Plaid API at runtime.

---

## 2. Non-goals this session

- The 3PL persona (Northstar Logistics Partners) and all related copy
- Revenue capture waterfall math
- ABL figures
- Bank revenue build
- Stress engine / Tab 6 scenarios
- Pre-onboarding diligence list on Tab 7
- Product naming (MRO / Merchant Revenue Optimizer)
- Pricing models
- Benchmark sourcing per scorecard row

---

## 3. Punch list (verbatim — execute in order)

**1. Add a backend.** Create Netlify Functions:
- `/.netlify/functions/plaid-accounts` calls Plaid `/accounts/get` at runtime.
- `/.netlify/functions/plaid-transactions` calls Plaid `/transactions/get` at runtime.

Store `PLAID_CLIENT_ID` and `PLAID_SECRET` in Netlify environment variables. Never expose them client-side.

**2. Build the token flow.** On first load, the backend POSTs to `/sandbox/public_token/create` with `institution_id: ins_109508` (First Platypus Bank) and `initial_products: ['auth', 'transactions', 'identity', 'liabilities']`. Exchange the public_token for an access_token via `/item/public_token/exchange`. Cache the access_token server-side (in memory is fine for a demo).

**3. Replace the static fetch.** In `index.html` line 611, change `fetch('data.json')` to `fetch('/.netlify/functions/plaid-accounts')` and a parallel call for transactions. Delete `data.json` from the repo. Preserve one local fixture path at `./fixtures/sample-plaid-response.json` for offline development. Add a query-parameter fallback: if the URL contains `?fixture=1`, the frontend loads from the fixture instead of the Netlify function. Commit the fixture. Do not commit any real Plaid response containing real identifiers.

**4. Add a visible developer panel.** Collapsible panel in header or new Tab 0 labeled "API" showing, in real time:
- Endpoint called
- HTTP status
- Plaid `request_id`
- Item ID
- Institution name and ID
- Billed products
- `update_type` from `/item/get` (background or user_present)
- Last refresh timestamp
- Latency in ms
- Refresh from Plaid button

**5. Expose more endpoints.** Beyond `/accounts/get` and `/transactions/get`, add:
- `/identity/get`
- `/liabilities/get`
- `/auth/get`
- `/item/get`

Each renders in its own small section.

**6. Add webhook handling.** Create `/.netlify/functions/plaid-webhook` that logs inbound webhooks and displays the last 5 in the developer panel.

**7. Implement `/transactions/sync`** (cursor-based) instead of only `/transactions/get`. Store the cursor server-side.

**8. Add Plaid Link.** Wire up Plaid Link on a "Connect an account" button. Sandbox login: username `user_good`, password `pass_good`. Returns a public_token your backend exchanges.

**9. Move persona mapping server-side.** Move `PERSONA_OVERRIDES` from frontend JS to the Netlify function. The function calls Plaid, applies the override schema, returns the mapped response.

**10. Add error handling.** Handle `ITEM_LOGIN_REQUIRED`, `RATE_LIMIT_EXCEEDED`, `PRODUCT_NOT_READY`. Surface in developer panel.

**11. Post the repo link publicly.** Push to public GitHub. Link from site footer and LinkedIn post.

**12. Rewrite README.** Document: endpoints called, token flow location, persona mapping layer, `netlify dev` local setup, required env vars.

---

## 4. Additional constraints

**Sandbox indicator.** Until this session is complete and the live Plaid integration is deployed, keep the existing "Sandbox dataset" indicator visible in the site header. Only remove or update it after the developer panel shows real Plaid request IDs.

**Consumer data leak check.** Before closing the session, grep the rendered UI for: `Uber`, `McDonald`, `Starbucks`, `KFC`, `FUN`, `United Airlines`, `Alberta`, `Charleson`, `Platypus`. None should render anywhere. If any appear, filter at the mapping layer or suppress at the frontend.

**Stale metadata.** Search the repo for `MIP`, `Merchant Intelligence Platform`, `Ridgeline`, `Ridgeline Beverage`. Remove all. Current persona is Northstar Logistics Partners.

---

## 5. Acceptance criteria

- DevTools Network tab shows calls to `/.netlify/functions/plaid-*`, not `data.json`.
- Developer panel shows a live Plaid `request_id` on every refresh.
- GitHub repo contains server-side code calling Plaid with real API keys in env vars.
- LinkedIn post line "Built on live Plaid API responses" is literally, verifiably true.
- No consumer merchant names render anywhere in the UI.
- No stale project references (MIP, Ridgeline) remain in the repo.

---

## 6. Secrets / environment

Required env vars:
- `PLAID_CLIENT_ID`
- `PLAID_SECRET` (sandbox key)
- `PLAID_ENV=sandbox`

Optional:
- `PLAID_WEBHOOK_URL`

**First-turn action:** create `.gitignore` in repo root containing `.env`, `.env.*`, `node_modules/`, `.netlify/` before writing any function code.
