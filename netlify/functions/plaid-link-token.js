// POST /.netlify/functions/plaid-link-token
// Creates a link_token for Plaid Link. The frontend uses this token to
// open the Link modal; the returned public_token is then exchanged via
// /plaid-exchange.

const {
  getPlaidClient, ok, fail, plaidErrorPayload, envelope,
  PLAID_WEBHOOK_URL, Products, CountryCode,
} = require('./_lib/plaid');

exports.handler = async () => {
  const started = Date.now();
  try {
    const client = getPlaidClient();
    const resp = await client.linkTokenCreate({
      user: { client_user_id: 'reo-demo-user' },
      client_name: 'Relationship Economics Optimizer',
      products: [Products.Auth, Products.Transactions, Products.Identity, Products.Liabilities],
      country_codes: [CountryCode.Us],
      language: 'en',
      webhook: PLAID_WEBHOOK_URL || undefined,
    });
    return ok(envelope({
      endpoint: '/link/token/create',
      request_id: resp.data.request_id,
      item_id: null,
      status: 200,
      latency_ms: Date.now() - started,
      data: {
        link_token: resp.data.link_token,
        expiration: resp.data.expiration,
      },
    }));
  } catch (err) {
    const payload = plaidErrorPayload(err);
    return fail(502, payload.code, payload.message, {
      type: payload.type,
      request_id: payload.request_id,
      endpoint: '/link/token/create',
      latency_ms: Date.now() - started,
    });
  }
};
