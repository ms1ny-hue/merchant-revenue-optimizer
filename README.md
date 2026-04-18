# Relationship Economics Optimizer

Commercial-banking relationship-economics prototype for a mid-market 3PL persona (Northstar Logistics Partners, LLC).
Payments-led, treasury and credit extended. Live Plaid Sandbox API integration behind a thin Netlify Functions
backend, layered with a server-side persona mapping that translates retail Plaid sandbox accounts into a commercial
balance sheet.

**Live site:** [merchant-revenue-optimizer.netlify.app](https://merchant-revenue-optimizer.netlify.app) (deploys from `main`)
**Repo:** [github.com/ms1ny-hue/merchant-revenue-optimizer](https://github.com/ms1ny-hue/merchant-revenue-optimizer) — repo URL kept for stability; the product was previously named "Merchant Revenue Optimizer" during early iteration.

Built by Michael Stanat. Illustrative data. Not a real financial product, credit decision, or endorsement of any institution.

---

## Architecture

```
Browser (index.html)
   │
   ├── fetch /.netlify/functions/plaid-accounts        ─┐
   ├── fetch /.netlify/functions/plaid-transactions     │
   ├── fetch /.netlify/functions/plaid-item             │
   ├── fetch /.netlify/functions/plaid-identity         ├─►  Netlify Functions (Node 18+)
   ├── fetch /.netlify/functions/plaid-liabilities      │        │
   ├── fetch /.netlify/functions/plaid-auth             │        │  plaid npm SDK
   ├── POST  /.netlify/functions/plaid-link-token       │        ▼
   ├── POST  /.netlify/functions/plaid-exchange         │   Plaid Sandbox (ins_109508)
   └── GET   /.netlify/functions/plaid-webhook         ─┘        ▲
                                                                 │
                           POST /.netlify/functions/plaid-webhook ← Plaid webhook delivery
```

- **Frontend:** single-file static `index.html`, Tailwind via CDN, Chart.js, d3-geo + us-atlas topojson for the US map,
  and the Plaid Link v2 SDK loaded from `cdn.plaid.com`. Seven tabs (Merchant Profile, Payments Ops Scorecard, Pricing
  Architecture, Rail Migration, Revenue Capture Waterfall, Relationship Context, Pricing Proposal).
- **Backend:** Netlify Functions (Node, CommonJS) in `netlify/functions/`. Each function calls Plaid via the official
  `plaid` npm SDK, applies server-side persona mapping where relevant, and returns a stable envelope so the frontend
  developer panel can render consistent metadata (`request_id`, `item_id`, latency, `update_type`).
- **Persona mapping layer:** `netlify/functions/_lib/persona.js`. Maps Plaid sandbox account names (e.g. `Plaid Checking`)
  to commercial persona names (`Operating Checking`), applies scaled balances, tags groups (operating / credit / debt /
  guarantor), enforces sign convention for liabilities, and filters out three personal-sidecar accounts. Runs entirely
  server-side so the browser never sees raw sandbox labels.

---

## Plaid endpoints called

| Function file                        | Plaid endpoint                          | Purpose                                                                 |
|--------------------------------------|-----------------------------------------|-------------------------------------------------------------------------|
| `plaid-accounts.js`                  | `/accounts/get`                         | Balances. Persona mapping applied. Drives the app UI.                   |
| `plaid-transactions.js`              | `/transactions/sync`                    | Cursor-based sync. Cursor cached server-side.                           |
| `plaid-identity.js`                  | `/identity/get`                         | Counts only — owner PII suppressed in the response.                     |
| `plaid-liabilities.js`               | `/liabilities/get`                      | Credit / mortgage / student liability metrics.                          |
| `plaid-auth.js`                      | `/auth/get`                             | Routing + masked account last-4.                                         |
| `plaid-item.js`                      | `/item/get` + `/institutions/get_by_id` | Institution metadata, `update_type`, billed products.                   |
| `plaid-link-token.js`                | `/link/token/create`                    | Generates the Plaid Link token for the "Connect an account" flow.        |
| `plaid-exchange.js`                  | `/item/public_token/exchange`           | Exchanges Link's `public_token` for a persistent `access_token`.         |
| `plaid-webhook.js`                   | n/a (inbound)                           | Receives Plaid webhooks. GET returns last 5 for the dev panel.           |

---

## Token flow (sandbox bootstrap)

On the first invocation of any endpoint the shared helper (`netlify/functions/_lib/plaid.js`) does:

1. `POST /sandbox/public_token/create` with `institution_id: ins_109508` and
   `initial_products: ['auth', 'transactions', 'identity', 'liabilities']`.
2. `POST /item/public_token/exchange` — public → access token.
3. Caches the `access_token` and `item_id` in module scope (per warm Lambda instance).

Subsequent invocations reuse the cached token. If a user opens Plaid Link and completes the flow, `plaid-exchange.js`
replaces the cached token with the user-linked one and resets the sync cursor.

For production this cache would be persisted to a per-user database row; the demo uses in-memory state for clarity.

---

## Developer panel

Click the **API** button in the site header (top-right, next to the date). The panel shows, for each endpoint: the
Plaid `request_id`, `item_id`, HTTP status, server-side latency, and refreshed-at. `/item/get` additionally surfaces
the `update_type` (background vs user_present) and billed products.

A "Refresh all endpoints" button re-hits every function; per-card ↻ buttons re-hit individual endpoints. A "Connect an
account (Plaid Link)" button opens the Plaid Link modal (sandbox credentials: `user_good` / `pass_good`).

Append `?api=1` to the URL to auto-open the panel on page load.

---

## Running locally

```bash
git clone https://github.com/ms1ny-hue/merchant-revenue-optimizer.git
cd merchant-revenue-optimizer
npm install
cp .env.example .env      # then fill in PLAID_CLIENT_ID and PLAID_SECRET
npx netlify dev           # serves site + functions on http://localhost:8888
```

### Required env vars

| Name                | Purpose                                                   |
|---------------------|-----------------------------------------------------------|
| `PLAID_CLIENT_ID`   | From your Plaid dashboard.                                 |
| `PLAID_SECRET`      | Sandbox secret from your Plaid dashboard.                  |
| `PLAID_ENV`         | `sandbox` (default if unset).                              |
| `PLAID_WEBHOOK_URL` | Optional. URL where Plaid posts webhooks; include if you want webhooks recorded. |

### Offline fixture mode

If you need to work without Plaid credentials (airplane / network-partitioned environment), append `?fixture=1` to the
site URL. The frontend will load `fixtures/sample-plaid-response.json` instead of calling the Netlify function. The
fixture is persona-shaped and contains only synthetic identifiers.

---

## Repo layout

```
.
├── index.html                        Single-file static frontend
├── fixtures/
│   └── sample-plaid-response.json    Persona-shaped offline fixture
├── netlify/
│   └── functions/
│       ├── _lib/
│       │   ├── plaid.js              Shared client + token cache + response envelope
│       │   ├── persona.js            PERSONA_OVERRIDES mapping (server-side)
│       │   └── webhookStore.js       In-memory ring buffer for inbound webhooks
│       ├── plaid-accounts.js
│       ├── plaid-transactions.js
│       ├── plaid-identity.js
│       ├── plaid-liabilities.js
│       ├── plaid-auth.js
│       ├── plaid-item.js
│       ├── plaid-link-token.js
│       ├── plaid-exchange.js
│       └── plaid-webhook.js
├── netlify.toml                      Build config + [dev] block
├── package.json
└── README.md
```

---

## Disclosure

Prototype built on Plaid sandbox data and synthetic persona overlays. Not an actual financial product, credit decision,
or representation of live client data. Not affiliated with or endorsed by any financial institution. Built by Michael
Stanat.
