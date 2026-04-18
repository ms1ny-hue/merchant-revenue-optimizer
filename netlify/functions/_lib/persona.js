// Persona mapping layer — server-side.
//
// This layer takes a raw Plaid /accounts/get response and rewrites it to
// reflect the Northstar Logistics Partners persona: commercial account
// names, scaled balances, group tagging, and sign convention. Three
// personal-sidecar accounts (IRA, 401k, Student Loan) are filtered out.
//
// Why server-side: keeping the mapping rules inside the Netlify function
// means the frontend receives a persona-shaped response and never sees the
// raw sandbox owner name or the underlying Plaid consumer labels.

// Scale factor: Plaid sandbox account balances are small personal-scale
// numbers; multiply to commercial scale for the persona.
const SCALE = 10;

// plaid_account_name → persona account definition.
//
// Each rule carries:
//   name              display name on the persona balance sheet
//   group             segmentation tag for UI filtering
//   scaled_override   explicit balance in cents-less USD, used verbatim; null falls back to SCALE * raw balance
//   hidden            if true the account is dropped entirely from the returned list
//   sign              +1 keeps sign as reported; -1 flips (used for liabilities)
const MAPPING = {
  'Plaid Checking':             { name: 'Operating Checking',                       group: 'operating',  scaled_override:    620_000 },
  'Plaid Saving':               { name: 'Insurance Escrow (Cargo & Contingent)',    group: 'operating',  scaled_override:    540_000 },
  'Plaid CD':                   { name: 'Fuel Advance Reserve',                     group: 'operating',  scaled_override:    380_000 },
  'Plaid Credit Card':          { name: 'Corporate Card',                           group: 'credit',     scaled_override:    140_000 },
  'Plaid Money Market':         { name: 'Sweep Money Market',                       group: 'operating',  scaled_override:  1_180_000 },
  'Plaid IRA':                  { name: 'Executive Retirement',                     group: 'guarantor',  scaled_override:        null, hidden: true },
  'Plaid 401k':                 { name: 'Employee 401(k)',                          group: 'guarantor',  scaled_override:        null, hidden: true },
  'Plaid Student Loan':         { name: 'Partner Guarantor Note',                   group: 'debt',       scaled_override:    425_000, hidden: true },
  'Plaid Mortgage':             { name: 'Equipment Finance Line',                   group: 'debt',       scaled_override:  6_000_000 },
  'Plaid HSA':                  { name: 'Payroll & Tax Reserve',                    group: 'operating',  scaled_override:    520_000 },
  'Plaid Cash Management':      { name: 'Carrier Payout Reserve',                   group: 'operating',  scaled_override:  1_450_000 },
  'Plaid Business Credit Card': { name: 'Regional Office T&E Card',                 group: 'credit',     scaled_override:     18_000 },
};

// Fallback for any Plaid account name not in the mapping above.
const DEFAULT_RULE = { group: 'operating', scaled_override: null, hidden: false };

function applyPersonaMapping(plaidAccounts) {
  if (!Array.isArray(plaidAccounts)) return [];
  const mapped = plaidAccounts.map((a) => {
    const rule = MAPPING[a.name] || { ...DEFAULT_RULE, name: a.name };
    const rawBalance = Number(a.balances && a.balances.current) || 0;
    const sign = (a.type === 'credit' || a.type === 'loan') ? -1 : 1;
    const baseBalance = rule.scaled_override !== null && rule.scaled_override !== undefined
      ? rule.scaled_override
      : rawBalance * SCALE;
    return {
      account_id: a.account_id,
      mask: a.mask,
      type: a.type,
      subtype: a.subtype,
      name: rule.name,
      group: rule.group,
      balance: baseBalance,
      display_balance: baseBalance * sign,
      _plaid_original_name: a.name,
      _hidden: !!rule.hidden,
    };
  });
  return mapped.filter((a) => !a._hidden).map((a) => {
    const { _hidden, ...rest } = a;
    return rest;
  });
}

module.exports = { applyPersonaMapping, MAPPING, SCALE };
