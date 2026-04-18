// GET /.netlify/functions/plaid-identity
// Calls /identity/get. Account-holder names and contact data are
// suppressed in the response envelope to prevent consumer PII leakage
// into the frontend — only the shape and account reference is returned.

const {
  getPlaidClient, getOrCreateSandboxAccessToken,
  ok, fail, plaidErrorPayload, envelope,
} = require('./_lib/plaid');

exports.handler = async () => {
  const started = Date.now();
  try {
    const client = getPlaidClient();
    const { access_token, item_id } = await getOrCreateSandboxAccessToken();
    const resp = await client.identityGet({ access_token });
    const latency = Date.now() - started;

    // Reduce to counts-only. We expose that identity data is present for
    // each account but never the names / emails / phones themselves.
    const redacted = (resp.data.accounts || []).map((a) => ({
      account_id: a.account_id,
      owner_count: (a.owners || []).length,
      email_count: (a.owners || []).reduce((n, o) => n + ((o.emails || []).length), 0),
      phone_count: (a.owners || []).reduce((n, o) => n + ((o.phone_numbers || []).length), 0),
      address_count: (a.owners || []).reduce((n, o) => n + ((o.addresses || []).length), 0),
    }));

    return ok(envelope({
      endpoint: '/identity/get',
      request_id: resp.data.request_id,
      item_id,
      status: 200,
      latency_ms: latency,
      data: { accounts: redacted, note: 'Owner PII suppressed server-side; counts only.' },
    }));
  } catch (err) {
    const payload = plaidErrorPayload(err);
    return fail(502, payload.code, payload.message, {
      type: payload.type,
      request_id: payload.request_id,
      endpoint: '/identity/get',
      latency_ms: Date.now() - started,
    });
  }
};
