// GET /.netlify/functions/plaid-auth
// Calls /auth/get. Routing numbers are Plaid sandbox values and safe to
// display; account numbers are hashed to their last-4 only to prevent
// leaking full account numbers into client-side state.

const crypto = require('crypto');
const {
  getPlaidClient, getOrCreateSandboxAccessToken,
  ok, fail, plaidErrorPayload, envelope,
} = require('./_lib/plaid');

function last4(s) {
  if (!s) return null;
  return String(s).slice(-4);
}

exports.handler = async () => {
  const started = Date.now();
  try {
    const client = getPlaidClient();
    const { access_token, item_id } = await getOrCreateSandboxAccessToken();
    const resp = await client.authGet({ access_token });
    const latency = Date.now() - started;

    const ach = (resp.data.numbers && resp.data.numbers.ach || []).map((n) => ({
      account_id: n.account_id,
      routing: n.routing,
      account_last4: last4(n.account),
      wire_routing: n.wire_routing || null,
    }));

    return ok(envelope({
      endpoint: '/auth/get',
      request_id: resp.data.request_id,
      item_id,
      status: 200,
      latency_ms: latency,
      data: { ach, count: ach.length },
    }));
  } catch (err) {
    const payload = plaidErrorPayload(err);
    return fail(502, payload.code, payload.message, {
      type: payload.type,
      request_id: payload.request_id,
      endpoint: '/auth/get',
      latency_ms: Date.now() - started,
    });
  }
};
