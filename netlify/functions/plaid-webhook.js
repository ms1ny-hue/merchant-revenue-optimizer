// POST /.netlify/functions/plaid-webhook  — inbound webhook receiver.
// GET  /.netlify/functions/plaid-webhook  — returns the last N recorded
//                                           webhooks for the developer panel.
//
// Plaid sends webhooks for item state changes, transaction updates,
// liabilities updates, etc. For the demo we record the last 5 into a
// module-scoped ring buffer and expose them via GET.

const store = require('./_lib/webhookStore');
const { ok, envelope } = require('./_lib/plaid');

exports.handler = async (event) => {
  const method = event.httpMethod;

  if (method === 'POST') {
    let payload = {};
    try { payload = event.body ? JSON.parse(event.body) : {}; } catch (_) {}

    store.record({
      webhook_type: payload.webhook_type || null,
      webhook_code: payload.webhook_code || null,
      item_id: payload.item_id || null,
      new_transactions: payload.new_transactions || null,
      error_code: payload.error && payload.error.error_code || null,
      body: payload,
    });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  }

  // GET (or any other method): return the recorded events for the dev panel.
  return ok(envelope({
    endpoint: '/webhook',
    request_id: null,
    item_id: null,
    status: 200,
    latency_ms: 0,
    data: { events: store.list() },
  }));
};
