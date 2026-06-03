/**
 * App-native Structured MCP client.
 *
 * Connects the sales-hero server DIRECTLY to Structured's MCP server (no Claude
 * in the loop), pulls the user's planner tasks, and returns them in the snapshot
 * shape that server/structured.js#syncStructuredTasks expects.
 *
 * Config (server/.env — see .env.example):
 *   STRUCTURED_MCP_URL    Structured's MCP endpoint (Streamable HTTP). REQUIRED to enable.
 *   STRUCTURED_MCP_TOKEN  Bearer token for that endpoint (if it uses static-token auth).
 *   STRUCTURED_TZ         IANA tz for get_today (default America/Chicago).
 *
 * NOTE: Structured does not publish a standalone MCP endpoint + OAuth surface
 * publicly (verified June 2026 — the connection used inside Claude is brokered by
 * Anthropic's connector platform). This client is written to the MCP spec and is
 * inert until STRUCTURED_MCP_URL is set; once Structured issues an endpoint/token
 * it should work as-is (OAuth, if required instead of a bearer token, plugs into
 * the transport's authProvider — see the marked seam below).
 */
// NOTE: the MCP SDK is intentionally required LAZILY (inside fetchStructuredTasks)
// so this module — and therefore server/app.js — loads even where the SDK isn't
// installed (e.g. the Vercel serverless function, which only installs root deps
// and never runs an app-native pull). The SDK lives in server/package.json.

const DEFAULT_TZ = 'America/Chicago';

/** True when enough config is present to attempt a connection. */
function isConfigured() {
  return Boolean(process.env.STRUCTURED_MCP_URL);
}

/** Parse one MCP tool result (get_today / get_inbox) into snapshot tasks. */
function parseToolTasks(result) {
  const block = (result?.content || []).find((c) => c && c.type === 'text');
  if (!block || typeof block.text !== 'string') return [];
  let data;
  try {
    data = JSON.parse(block.text);
  } catch {
    return [];
  }
  const arr = Array.isArray(data?.tasks) ? data.tasks : [];
  return arr
    .filter((t) => t && t.id != null) // drop recurring instances with no stable id
    .map((t) => ({
      id: String(t.id),
      title: t.title || 'Untitled task',
      start_time: t.start_time ?? null,
      symbol: t.symbol ?? null,
      // Structured marks completion with an ISO `completed_at` (null when open).
      completed: Boolean(t.completed_at),
      completed_at: t.completed_at ?? null,
    }));
}

/**
 * Connect to Structured over MCP, pull today's schedule + the inbox, and return
 * a de-duplicated task snapshot. Throws if not configured or the call fails.
 */
async function fetchStructuredTasks() {
  const url = process.env.STRUCTURED_MCP_URL;
  if (!url) throw new Error('STRUCTURED_MCP_URL not set — app-native sync disabled');
  const token = process.env.STRUCTURED_MCP_TOKEN;
  const tz = process.env.STRUCTURED_TZ || DEFAULT_TZ;

  // Lazy import — see note at top of file.
  const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
  const {
    StreamableHTTPClientTransport,
  } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

  const transport = new StreamableHTTPClientTransport(new URL(url), {
    // Static bearer token path. If Structured requires full OAuth instead, pass
    // an `authProvider` here (see @modelcontextprotocol/sdk/client/auth.js).
    requestInit: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });

  const client = new Client({ name: 'sales-hero', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);
  try {
    const today = await client.callTool({ name: 'get_today', arguments: { timezone: tz } });
    const inbox = await client.callTool({ name: 'get_inbox', arguments: {} });
    const merged = new Map();
    for (const t of [...parseToolTasks(today), ...parseToolTasks(inbox)]) merged.set(t.id, t);
    return [...merged.values()];
  } finally {
    await client.close().catch(() => {});
  }
}

module.exports = { isConfigured, fetchStructuredTasks, parseToolTasks };
