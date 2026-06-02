/**
 * War Council — AI coaching via the Vercel AI Gateway.
 *
 * The gateway key lives ONLY on the server (`AI_GATEWAY_API_KEY` in server/.env).
 * The browser calls our `/ai/briefing` route; it never sees the key.
 *
 * If no key is configured (or the gateway errors), we return a deterministic
 * rule-based tip so the feature still works and the page never hangs.
 */
const { readState } = require('./state');

const GATEWAY_URL =
  process.env.AI_GATEWAY_URL || 'https://ai-gateway.vercel.sh/v1/chat/completions';
// Provider-prefixed model id, e.g. "openai/gpt-4o-mini", "anthropic/claude-3-5-haiku".
const MODEL = process.env.AI_GATEWAY_MODEL || 'openai/gpt-4o-mini';
const TIMEOUT_MS = Number(process.env.AI_GATEWAY_TIMEOUT_MS || 12000);

function summarize(state) {
  const p = state.player || {};
  const s = p.stats || {};
  const leads = Object.values(state.leads || {});
  const closed = leads.filter((l) =>
    (l.events || []).some((e) => e.type === 'insurance/closed_policy')
  ).length;
  const calls = s.calls || 0;
  const quotes = s.quotes || 0;
  const policies = s.policies || 0;
  return {
    name: p.name || 'Crusader',
    level: p.level || 1,
    title: p.title || 'Squire',
    totalXP: p.totalXP || 0,
    calls,
    quotes,
    policies,
    quoteRate: calls ? Math.round((quotes / calls) * 100) : 0,
    closeRate: quotes ? Math.round((policies / quotes) * 100) : 0,
    leadCount: leads.length,
    closed,
  };
}

/** Deterministic coaching when the gateway is unavailable. */
function fallbackAdvice(c) {
  if (c.calls === 0) {
    return `No dials logged yet, ${c.name}. The crusade begins with a single call — ride out and make first contact today.`;
  }
  if (c.quoteRate < 40) {
    return `Your dials connect, but only ${c.quoteRate}% become quotes. Slow down on discovery — uncover the pain before you raise the shield.`;
  }
  if (c.closeRate < 50) {
    return `Strong quoting, ${c.title}, yet just ${c.closeRate}% close. Follow up within the day and ask for the policy plainly — fortune favors the bold.`;
  }
  return `${c.quoteRate}% quote, ${c.closeRate}% close — disciplined work. Press the advantage: feed the pipeline so the streak never breaks.`;
}

async function generateBriefing() {
  const state = readState();
  const c = summarize(state);
  const key = process.env.AI_GATEWAY_API_KEY;

  if (!key || typeof fetch !== 'function') {
    return {
      advice: fallbackAdvice(c),
      source: 'fallback',
      reason: !key ? 'no_key' : 'fetch_unavailable',
      context: c,
    };
  }

  const system =
    'You are the War Council, a battle-hardened advisor to a property & casualty insurance "sales crusader." ' +
    'Speak in a crisp, medieval-crusader voice but give REAL, specific, actionable sales coaching grounded in the numbers given. ' +
    'Maximum two short sentences. No preamble, no lists, no markdown.';
  const user =
    `Crusader ${c.name}, rank ${c.title} (level ${c.level}). ` +
    `Lifetime: ${c.calls} calls, ${c.quotes} quotes, ${c.policies} policies closed. ` +
    `Quote rate ${c.quoteRate}%, close rate ${c.closeRate}%. ` +
    `${c.leadCount} prospects in the pipeline, ${c.closed} won. ` +
    'Give one sharp piece of coaching for the next move.';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 140,
        temperature: 0.85,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('AI gateway error', res.status, detail.slice(0, 200));
      return { advice: fallbackAdvice(c), source: 'fallback', reason: `gateway_${res.status}`, context: c };
    }

    const data = await res.json();
    const advice = data.choices?.[0]?.message?.content?.trim();
    if (!advice) {
      return { advice: fallbackAdvice(c), source: 'fallback', reason: 'empty_response', context: c };
    }
    return { advice, source: 'ai', model: MODEL, context: c };
  } catch (err) {
    console.error('AI gateway request failed:', err.message);
    return { advice: fallbackAdvice(c), source: 'fallback', reason: err.name === 'AbortError' ? 'timeout' : 'request_failed', context: c };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { generateBriefing };
