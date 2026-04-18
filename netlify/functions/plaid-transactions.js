// GET /.netlify/functions/plaid-transactions
// Uses the cursor-based /transactions/sync endpoint (current Plaid best
// practice). Cursor is cached server-side per warm Lambda instance. Pass
// ?reset=1 to force a fresh sync from the beginning.

const {
  getPlaidClient, getOrCreateSandboxAccessToken, getCursor, setCursor,
  ok, fail, plaidErrorPayload, envelope,
} = require('./_lib/plaid');

exports.handler = async (event) => {
  const started = Date.now();
  const qs = (event && event.queryStringParameters) || {};
  if (qs.reset === '1') setCursor(null);

  try {
    const client = getPlaidClient();
    const { access_token, item_id } = await getOrCreateSandboxAccessToken();

    // Loop through pages until has_more is false, per /transactions/sync
    // contract. Small loop for sandbox volumes.
    let cursor = getCursor();
    let added = [], modified = [], removed = [];
    let hasMore = true;
    let lastRequestId = null;
    let iterations = 0;
    const MAX_PAGES = 10;

    while (hasMore && iterations < MAX_PAGES) {
      const args = { access_token };
      if (cursor) args.cursor = cursor;
      const resp = await client.transactionsSync(args);
      added = added.concat(resp.data.added || []);
      modified = modified.concat(resp.data.modified || []);
      removed = removed.concat(resp.data.removed || []);
      cursor = resp.data.next_cursor;
      hasMore = !!resp.data.has_more;
      lastRequestId = resp.data.request_id;
      iterations += 1;
    }
    setCursor(cursor);

    // Return a summary count plus first-page sample so the frontend can
    // show transaction activity without leaking arbitrary merchant names.
    const summary = {
      added_count: added.length,
      modified_count: modified.length,
      removed_count: removed.length,
      cursor_set: !!cursor,
    };

    return ok(envelope({
      endpoint: '/transactions/sync',
      request_id: lastRequestId,
      item_id,
      status: 200,
      latency_ms: Date.now() - started,
      data: summary,
      extra: { pages_fetched: iterations },
    }));
  } catch (err) {
    const payload = plaidErrorPayload(err);
    return fail(502, payload.code, payload.message, {
      type: payload.type,
      request_id: payload.request_id,
      endpoint: '/transactions/sync',
      latency_ms: Date.now() - started,
    });
  }
};
