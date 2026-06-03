/**
 * Hourly Structured → SalesDex poller (app-native, no Claude in the loop).
 *
 * Started from server/index.js (the local/long-running entry). It is NOT used by
 * the Vercel serverless entry (api/index.js) — serverless functions can't hold a
 * timer. Disabled and harmless until STRUCTURED_MCP_URL is configured.
 */
const { readState, writeState } = require('./state');
const { syncStructuredTasks } = require('./structured');
const { isConfigured, fetchStructuredTasks } = require('./structuredClient');

const MIN_INTERVAL_MIN = 5;
const DEFAULT_INTERVAL_MIN = 60; // hourly — lighter than 30m and the sync is idempotent

/** Pull from Structured once and reconcile into game state. Returns the summary. */
async function runOnce() {
  const tasks = await fetchStructuredTasks();
  const state = await readState();
  const summary = syncStructuredTasks(state, tasks);
  await writeState(state);
  return summary;
}

/**
 * Begin polling on an interval. No-op (returns null) when unconfigured, so the
 * server boots fine without Structured credentials.
 */
function startStructuredPoller() {
  if (!isConfigured()) {
    console.log('[structured] poller disabled — set STRUCTURED_MCP_URL in server/.env to enable');
    return null;
  }
  const minutes = Math.max(
    MIN_INTERVAL_MIN,
    Number(process.env.STRUCTURED_SYNC_INTERVAL_MIN) || DEFAULT_INTERVAL_MIN
  );
  const tz = process.env.STRUCTURED_TZ || 'America/Chicago';

  const tick = async () => {
    try {
      const s = await runOnce();
      console.log(
        `[structured] synced: +${s.xpAwarded} EXP · ${s.completed} completed · ` +
          `${s.created} new (of ${s.received} pulled)`
      );
    } catch (err) {
      console.error('[structured] sync failed:', err.message);
    }
  };

  void tick(); // sync immediately on boot, then on the interval
  const handle = setInterval(tick, minutes * 60 * 1000);
  if (handle.unref) handle.unref(); // don't keep the process alive just for this
  console.log(`[structured] poller started — every ${minutes} min (tz ${tz})`);
  return handle;
}

module.exports = { startStructuredPoller, runOnce };
