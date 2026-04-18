// GET /.netlify/functions/plaid-accounts
// Calls Plaid /accounts/get, applies the server-side persona mapping,
// returns the persona-shaped account list plus Plaid metadata for the
// developer panel.

const {
  getPlaidClient, getOrCreateSandboxAccessToken,
  ok, fail, plaidErrorPayload, envelope,
} = require('./_lib/plaid');
const { applyPersonaMapping } = require('./_lib/persona');

exports.handler = async () => {
  const started = Date.now();
  try {
    const client = getPlaidClient();
    const { access_token, item_id } = await getOrCreateSandboxAccessToken();
    const resp = await client.accountsGet({ access_token });
    const latency = Date.now() - started;

    const plaidAccounts = resp.data.accounts || [];
    const mapped = applyPersonaMapping(plaidAccounts);

    return ok(envelope({
      endpoint: '/accounts/get',
      request_id: resp.data.request_id,
      item_id,
      status: 200,
      latency_ms: latency,
      data: {
        accounts: mapped,
        institution: resp.data.item && resp.data.item.institution_id || null,
      },
      extra: {
        institution_id: resp.data.item && resp.data.item.institution_id || null,
      },
    }));
  } catch (err) {
    const payload = plaidErrorPayload(err);
    return fail(502, payload.code, payload.message, {
      type: payload.type,
      request_id: payload.request_id,
      endpoint: '/accounts/get',
      latency_ms: Date.now() - started,
    });
  }
};
