// GET /.netlify/functions/plaid-liabilities
// Calls /liabilities/get. Returns counts + high-level metrics for credit
// and student-loan accounts. Values scaled to persona convention.

const {
  getPlaidClient, getOrCreateSandboxAccessToken,
  ok, fail, plaidErrorPayload, envelope,
} = require('./_lib/plaid');
const { SCALE } = require('./_lib/persona');

exports.handler = async () => {
  const started = Date.now();
  try {
    const client = getPlaidClient();
    const { access_token, item_id } = await getOrCreateSandboxAccessToken();
    const resp = await client.liabilitiesGet({ access_token });
    const latency = Date.now() - started;

    const liabilities = resp.data.liabilities || {};
    const credit = (liabilities.credit || []).map((c) => ({
      account_id: c.account_id,
      apr_count: (c.aprs || []).length,
      is_overdue: !!c.is_overdue,
      minimum_payment_amount: (c.minimum_payment_amount || 0) * SCALE,
    }));
    const mortgage = (liabilities.mortgage || []).map((m) => ({
      account_id: m.account_id,
      interest_rate_type: m.interest_rate && m.interest_rate.type || null,
    }));
    const student = (liabilities.student || []).map((s) => ({
      account_id: s.account_id,
      outstanding_interest_amount: (s.outstanding_interest_amount || 0) * SCALE,
    }));

    return ok(envelope({
      endpoint: '/liabilities/get',
      request_id: resp.data.request_id,
      item_id,
      status: 200,
      latency_ms: latency,
      data: { credit, mortgage, student },
    }));
  } catch (err) {
    const payload = plaidErrorPayload(err);
    return fail(502, payload.code, payload.message, {
      type: payload.type,
      request_id: payload.request_id,
      endpoint: '/liabilities/get',
      latency_ms: Date.now() - started,
    });
  }
};
