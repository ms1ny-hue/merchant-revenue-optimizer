// Shared Plaid client + sandbox access-token bootstrap + response helpers.
//
// Token flow (sandbox):
//   1. POST /sandbox/public_token/create → public_token
//   2. POST /item/public_token/exchange  → access_token
//   3. Cache access_token in module scope (per warm Lambda instance).
//
// The cache persists across warm invocations of the same container. On a
// cold start the function bootstraps a fresh token. For a demo this is
// sufficient; for production you would persist the access_token per user
// in a database (the persona mapping layer would key off item_id).

const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET    = process.env.PLAID_SECRET;
const PLAID_ENV       = process.env.PLAID_ENV || 'sandbox';
const PLAID_WEBHOOK_URL = process.env.PLAID_WEBHOOK_URL || null;

const SANDBOX_INSTITUTION_ID = 'ins_109508';   // First Platypus Bank
const INITIAL_PRODUCTS = ['auth', 'transactions', 'identity', 'liabilities'];

function getPlaidClient() {
  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    throw new Error('Plaid credentials missing. Set PLAID_CLIENT_ID and PLAID_SECRET as env vars.');
  }
  const configuration = new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET':    PLAID_SECRET,
        'Plaid-Version':   '2020-09-14',
      },
    },
  });
  return new PlaidApi(configuration);
}

// ---------------------------------------------------------------
// Access-token cache (module-scoped; survives warm invocations).
// ---------------------------------------------------------------
let cachedAccessToken = null;
let cachedItemId      = null;
let cachedCursor      = null;

async function getOrCreateSandboxAccessToken() {
  if (cachedAccessToken) return { access_token: cachedAccessToken, item_id: cachedItemId, fresh: false };

  const client = getPlaidClient();
  const createResp = await client.sandboxPublicTokenCreate({
    institution_id: SANDBOX_INSTITUTION_ID,
    initial_products: INITIAL_PRODUCTS,
  });
  const publicToken = createResp.data.public_token;

  const exchangeResp = await client.itemPublicTokenExchange({ public_token: publicToken });
  cachedAccessToken = exchangeResp.data.access_token;
  cachedItemId      = exchangeResp.data.item_id;

  return { access_token: cachedAccessToken, item_id: cachedItemId, fresh: true };
}

function setAccessToken(access_token, item_id) {
  cachedAccessToken = access_token;
  cachedItemId      = item_id;
  cachedCursor      = null;  // reset sync cursor when item changes
}

function getCursor() { return cachedCursor; }
function setCursor(c) { cachedCursor = c; }

// ---------------------------------------------------------------
// Response helpers.
// ---------------------------------------------------------------
function ok(body, extraHeaders = {}) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function fail(status, code, message, details = {}) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: { code, message, ...details } }),
  };
}

// Maps a Plaid API exception into the shape we surface in the dev panel.
function plaidErrorPayload(err) {
  const data = err && err.response && err.response.data ? err.response.data : null;
  if (!data) {
    return {
      plaid_error: false,
      code: 'UNKNOWN',
      message: err && err.message ? err.message : String(err),
    };
  }
  return {
    plaid_error: true,
    code: data.error_code || 'UNKNOWN',
    type: data.error_type || null,
    message: data.error_message || data.display_message || 'Plaid error',
    request_id: data.request_id || null,
  };
}

// Standardised envelope returned by every function so the dev panel can
// render consistent metadata.
function envelope({ endpoint, request_id, item_id, status, latency_ms, update_type = null, data, extra = {} }) {
  return {
    meta: {
      endpoint,
      request_id,
      item_id,
      status,
      latency_ms,
      update_type,
      timestamp: new Date().toISOString(),
      env: PLAID_ENV,
    },
    data,
    ...extra,
  };
}

module.exports = {
  getPlaidClient,
  getOrCreateSandboxAccessToken,
  setAccessToken,
  getCursor,
  setCursor,
  ok, fail,
  plaidErrorPayload,
  envelope,
  PLAID_WEBHOOK_URL,
  SANDBOX_INSTITUTION_ID,
  INITIAL_PRODUCTS,
  Products, CountryCode,
};
