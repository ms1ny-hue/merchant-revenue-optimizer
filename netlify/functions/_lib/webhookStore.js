// Module-scoped ring buffer of recent Plaid webhooks. Survives warm
// invocations per Lambda instance. For production, persist to a database
// keyed by item_id — this demo uses in-memory storage consistent with the
// access_token cache.

const MAX_EVENTS = 5;
const events = [];

function record(event) {
  events.unshift({
    ...event,
    received_at: new Date().toISOString(),
  });
  while (events.length > MAX_EVENTS) events.pop();
}

function list() {
  return events.slice();
}

module.exports = { record, list, MAX_EVENTS };
