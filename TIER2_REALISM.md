# TIER 2 — Realism

**Scope:** Realism fixes only. Do not touch Plaid integration, Tier 1 math, or publish prep.

**PBB in target mix** (`CONFIG.payments.inboundMixTarget`, line 387). Change from `{ ACH: 0.36, Card: 0.28, RTP: 0.26, Wire: 0.08, Check: 0.02 }` to `{ ACH: 0.30, Card: 0.28, RTP: 0.18, PBB: 0.14, Wire: 0.08, Check: 0.02 }`.

**Copilot numerics.** Search `index.html` for hard-coded copilot response strings. Prepend every numeric output with "Illustrative point estimate: " and append "(deterministic scenario, not modeled)."

**Live-modeled stress on Tab 6.** Add a "Rate shock" slider, range -300 to +300 bps, that actually recomputes. Outputs: new all-in borrowing cost, new covenant coverage ratio, trigger flag if coverage <1.15x. Other three scenarios can stay scripted.

**RAROC layer** (`CONFIG.bankRevenue`). Add:
```javascript
raroc: {
  ablRWA: 8_000_000,
  ablECL: 20_000,
  servicingCost: 85_000,
  ftpDeposits: 0.0045,
  ftpLoans: 0.0525,
  capitalHurdle: 0.11,
  requiredCapital: 880_000,
}
```
Render a second bank revenue table labeled "Net economic profit after capital and ECL."

**Benchmark sourcing** (`CONFIG.paymentsOps.scorecard`). Add a `targetBasis` field to every row. Example: `targetBasis: '95.5% STP = Visa commercial card top-quartile 2024 (illustrative)'`. Render as tooltip or footnote.

**Pricing model basis** (`CONFIG.pricingModels`). Add a `basis` field to each model. Example: `basis: 'Interchange-plus structure typical of First Data, Elavon, Chase Merchant Services mid-market offerings'`.

**Pre-onboarding diligence on Tab 7.** Remove "SCAC validation (optional)" and "Payments network risk tier (low)". Add:
- CIP and KYC refresh (31 CFR 1020)
- OFAC sanctions screening
- Beneficial ownership verification (FinCEN CTA, 25% threshold)
- Dun and Bradstreet business credit pull
- Experian or Equifax commercial bureau pull
- FMCSA broker authority verification (active MC number)
- BMC-84 surety bond verification ($75,000 minimum)
- Secretary of State good standing (Illinois)
- Evidence of E&O and cargo insurance

**Product naming.** Decide: Merchant Revenue Optimizer or Relationship Economics Optimizer. Commit to one. Update: page title tag, meta description, header logo text, footer, README. All five must match.
