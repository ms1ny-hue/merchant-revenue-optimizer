# TIER 1 — Math and reconciliation

**Scope:** Math fixes only. Do not touch Plaid integration, product naming, realism pass items, or publish prep. Those are other work streams.

**Capture waterfall** (`CONFIG.capture`, line 478 of index.html). Restructure into two nested layers. Layer one: rate compression of 87 bps on $23.1M = $200,970, with sub-annotations (processor margin ~20 bps, L3 ~43 bps, downgrade qualification ~20 bps, tokenization ~4 bps) shown as components OF the 87 bps, not additions. Layer two: incremental items (auth lift $56,500, RTP ops $33,990). New total: $291,460. Search the file for "386" and fix every occurrence.

**Card rebate** (`CONFIG.bankRevenue`, line 466). Change `cardRebateBps: 10` to `cardRebateBps: 100`. Leave `cardRebate: 25_000` as is.

**ABL figures** (`CONFIG.bankRevenue`, line 468). Change `ablOutstanding: 40_000_000` to `ablOutstanding: 8_000_000`. Update downstream: $8M × 175 bps = $140,000 annual, not $700K. Fix every downstream reference to the $700K figure.

**Revenue vs inbound gap.** Change `revenue: 82_000_000` to `revenue: 68_000_000` in `CONFIG.persona`. Keep `cardAddressableInbound: 23_100_000` (34% of $68M).

**Card-addressable base commit.** Label the waterfall base as "current-state card base before rail migration." Add a second line: "post-migration card base: $19.0M." Keep $23.1M as the waterfall calculation base.

**RTP migration repricing** (`CONFIG.capture.components`, line 488). Change label from "ACH-to-RTP ops lift on inbound shipper RfP" to "Float recapture and return avoidance on inbound RTP migration." Change note to: "1.3 days float × $17.7M × 4.25% + 16 bps return avoidance × $17.7M."

**Chargeback rate** (`CONFIG.persona`, line 378). Change `chargebackRate: 0.0004` to `chargebackRate: 0.0012`.

**PBB vs RTP ordering** (`CONFIG.payments.railProfile`, line 390). Change PBB cost from `0.50` to `0.35`.

**Scoring rubric** (`CONFIG.scoring`, line 498). Add:
```javascript
rubric: {
  scale: '300-850 commercial adaptation',
  components: [
    { factor: 'Payment performance',    weight: 0.35, score: 760 },
    { factor: 'Cash flow stability',    weight: 0.25, score: 720 },
    { factor: 'Leverage',               weight: 0.20, score: 700 },
    { factor: 'Relationship tenure',    weight: 0.10, score: 680 },
    { factor: 'Industry concentration', weight: 0.10, score: 710 },
  ],
  source: 'Illustrative commercial banking risk rubric; not a production model.',
}
```
Render as a small table on Tab 1 and Tab 7 underneath the score display.

**Peer cohort label** (`CONFIG.paymentsOps.cohortNote`, line 452). Replace "benchmarks reflect top-tier commercial bank and Visa/Mastercard averages" with "benchmarks are synthetic, modeled on published Visa Performance Intelligence and Nacha operational guidance."

**Migration cost** (`CONFIG.payments.migrationCostOneTime`, line 402). Change `38_000` to `125_000`.
