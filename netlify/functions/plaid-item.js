// GET /.netlify/functions/plaid-item
// Calls /item/get. Returns institution metadata, billed products, and
// update_type so the developer panel can display whether the item is
// backed by a background refresh or a user-present refresh.

const {
  getPlaidClient, getOrCreateSandboxAccessToken,
  ok, fail, plaidErrorPayload, envelope,
} = require('./_lib/plaid');

exports.handler = async () => {
  const started = Date.now();
  try {
    const client = getPlaidClient();
    const { access_token, item_id } = await getOrCreateSandboxAccessToken();
    const resp = await client.itemGet({ access_token });
    const latency = Date.now() - started;

    const item = resp.data.item || {};
    const status = resp.data.status || {};
    const institutionId = item.institution_id || null;

    let institutionName = null;
    if (institutionId) {
      try {
        const instResp = await client.institutionsGetById({
          institution_id: institutionId,
          country_codes: ['US'],
        });
        institutionName = instResp.data.institution && instResp.data.institution.name || null;
      } catch (_) { /* best-effort enrichment */ }
    }

    return ok(envelope({
      endpoint: '/item/get',
      request_id: resp.data.request_id,
      item_id: item.item_id || null,
      status: 200,
      latency_ms: latency,
      update_type: item.update_type || null,
      data: {
        institution_id: institutionId,
        institution_name: institutionName,
        billed_products: item.billed_products || [],
        available_products: item.available_products || [],
        consent_expiration_time: item.consent_expiration_time || null,
        webhook: item.webhook || null,
        error: item.error || null,
        transactions_last_successful_update: status.transactions
          ? status.transactions.last_successful_update
          : null,
      },
    }));
  } catch (err) {
    const payload = plaidErrorPayload(err);
    return fail(502, payload.code, payload.message, {
      type: payload.type,
      request_id: payload.request_id,
      endpoint: '/item/get',
      latency_ms: Date.now() - started,
    });
  }
};
