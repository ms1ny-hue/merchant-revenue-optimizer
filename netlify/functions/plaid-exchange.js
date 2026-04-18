// POST /.netlify/functions/plaid-exchange
// Body: { public_token: string }
// Exchanges a public_token from Plaid Link for an access_token and stores
// it in the server-side cache, replacing the sandbox-bootstrapped token.

const {
  getPlaidClient, setAccessToken,
  ok, fail, plaidErrorPayload, envelope,
} = require('./_lib/plaid');

exports.handler = async (event) => {
  const started = Date.now();
  try {
    if (event.httpMethod !== 'POST') {
      return fail(405, 'METHOD_NOT_ALLOWED', 'POST required');
    }
    const body = event.body ? JSON.parse(event.body) : {};
    const public_token = body.public_token;
    if (!public_token) return fail(400, 'MISSING_PUBLIC_TOKEN', 'Body must include public_token');

    const client = getPlaidClient();
    const resp = await client.itemPublicTokenExchange({ public_token });
    setAccessToken(resp.data.access_token, resp.data.item_id);

    return ok(envelope({
      endpoint: '/item/public_token/exchange',
      request_id: resp.data.request_id,
      item_id: resp.data.item_id,
      status: 200,
      latency_ms: Date.now() - started,
      data: { ok: true },
    }));
  } catch (err) {
    const payload = plaidErrorPayload(err);
    return fail(502, payload.code, payload.message, {
      type: payload.type,
      request_id: payload.request_id,
      endpoint: '/item/public_token/exchange',
      latency_ms: Date.now() - started,
    });
  }
};
