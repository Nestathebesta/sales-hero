/**
 * AI coaching via the Vercel AI Gateway (War Council, next-best-action, recap).
 *
 * The gateway key lives ONLY on the server (`AI_GATEWAY_API_KEY` in server/.env);
 * the browser calls our /api/ai/* routes and never sees it. Every generator
 * degrades to deterministic rule-based text if the gateway is unavailable, so
 * the features always work and the page never hangs.
 */
const { readState } = require('./state');

const GATEWAY_URL =
  process.env.AI_GATEWAY_URL || 'https://ai-gateway.vercel.sh/v1/chat/completions';
// Provider-prefixed model id, e.g. "openai/gpt-4o-mini", "anthropic/claude-3-5-haiku".
const MODEL = process.env.AI_GATEWAY_MODEL || 'openai/gpt-4o-mini';
const TIMEOUT_MS = Number(process.env.AI_GATEWAY_TIMEOUT_MS || 12000);

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Low-level gateway call. Returns { ok, text } or { ok:false, reason }. */
async function runGateway({ system, user, maxTokens = 140, temperature = 0.85 }) {
  const key = process.env.AI_GATEWAY_API_KEY;
  if (!key) return { ok: false, reason: 'no_key' };
  if (typeof fetch !== 'function') return { ok: false, reason: 'fetch_unavailable' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        temperature,
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
      return { ok: false, reason: `gateway_${res.status}` };
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text ? { ok: true, text } : { ok: false, reason: 'empty_response' };
  } catch (err) {
    console.error('AI gateway request failed:', err.message);
    return { ok: false, reason: err.name === 'AbortError' ? 'timeout' : 'request_failed' };
  } finally {
    clearTimeout(timer);
  }
}

/** Run the gateway with a fallback string; returns { advice, source, reason?, model? }. */
async function generate({ system, user, fallback, maxTokens, temperature }) {
  const r = await runGateway({ system, user, maxTokens, temperature });
  if (r.ok) return { advice: r.text, source: 'ai', model: MODEL };
  return { advice: fallback, source: 'fallback', reason: r.reason };
}

function summarize(state) {
  const p = state.player || {};
  const s = p.stats || {};
  const leads = Object.values(state.leads || {});
  const closed = leads.filter((l) => (l.events || []).some((e) => e.type === 'insurance/closed_policy')).length;
  const calls = s.calls || 0;
  const quotes = s.quotes || 0;
  const policies = s.policies || 0;
  return {
    name: p.name || 'Crusader',
    level: p.level || 1,
    title: p.title || 'Peon',
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

function leadStage(lead) {
  const types = new Set((lead.events || []).map((e) => e.type));
  if (types.has('insurance/closed_policy')) return 'Closed';
  if (types.has('insurance/quote')) return 'Quoted';
  if (types.has('insurance/call')) return 'Contacted';
  return 'New';
}

// ----- War Council briefing -----

function fallbackAdvice(c) {
  if (c.calls === 0) return `No dials logged yet, ${c.name}. The crusade begins with a single call — ride out and make first contact today.`;
  if (c.quoteRate < 40) return `Your dials connect, but only ${c.quoteRate}% become quotes. Slow down on discovery — uncover the pain before you raise the shield.`;
  if (c.closeRate < 50) return `Strong quoting, ${c.title}, yet just ${c.closeRate}% close. Follow up within the day and ask for the policy plainly — fortune favors the bold.`;
  return `${c.quoteRate}% quote, ${c.closeRate}% close — disciplined work. Press the advantage: feed the pipeline so the streak never breaks.`;
}

async function generateBriefing() {
  const c = summarize(await readState());
  const system =
    'You are the War Council, a battle-hardened advisor to a property & casualty insurance "sales crusader." ' +
    'Speak in a crisp, medieval-crusader voice but give REAL, specific, actionable sales coaching grounded in the numbers given. ' +
    'Maximum two short sentences. No preamble, no lists, no markdown.';
  const user =
    `Crusader ${c.name}, rank ${c.title} (level ${c.level}). ` +
    `Lifetime: ${c.calls} calls, ${c.quotes} quotes, ${c.policies} policies closed. ` +
    `Quote rate ${c.quoteRate}%, close rate ${c.closeRate}%. ${c.leadCount} prospects, ${c.closed} won. ` +
    'Give one sharp piece of coaching for the next move.';
  return { ...(await generate({ system, user, fallback: fallbackAdvice(c) })), context: c };
}

// ----- Next-best-action (per lead) -----

function fallbackNextAction(lead, stage) {
  switch (stage) {
    case 'New': return `${lead.name} is fresh — make first contact today. Open with a question about their current coverage, not a pitch.`;
    case 'Contacted': return `You've reached ${lead.name}. Send a tailored quote next, while the conversation is still warm.`;
    case 'Quoted': return `${lead.name} has a quote in hand. Follow up within 24 hours and ask for the policy directly.`;
    case 'Closed': return `${lead.name} is won — ask for a referral and a review, then look for a cross-sell.`;
    default: return `Take the next concrete step with ${lead.name}.`;
  }
}

async function generateNextAction(leadId) {
  const state = await readState();
  const lead = state.leads[leadId];
  if (!lead) return { advice: 'No such prospect.', source: 'fallback', reason: 'not_found' };

  const stage = leadStage(lead);
  const tally = { call: 0, quote: 0, close: 0 };
  for (const e of lead.events || []) {
    const n = e.count || 1;
    if (e.type === 'insurance/call') tally.call += n;
    else if (e.type === 'insurance/quote') tally.quote += n;
    else if (e.type === 'insurance/closed_policy') tally.close += n;
  }
  const last = (lead.events || []).slice(-1)[0]?.timestamp || 'never';

  const system =
    'You are a sharp P&C insurance sales coach. Recommend the single best NEXT action for ONE prospect, grounded in their stage and history. ' +
    'A light medieval-crusader flavor is fine but be practical and specific. Max two short sentences. No markdown.';
  const user =
    `Prospect "${lead.name}" is in stage ${stage}. ` +
    `So far: ${tally.call} calls, ${tally.quote} quotes, ${tally.close} closes. Last touch: ${last}. ` +
    'What is the single best next action?';
  const out = await generate({ system, user, fallback: fallbackNextAction(lead, stage), maxTokens: 120 });
  return { ...out, leadId, leadName: lead.name, stage };
}

// ----- Daily recap -----

function todaySummary(state) {
  const key = dateKey(new Date());
  const t = { calls: 0, quotes: 0, closes: 0, xp: 0 };
  const touched = new Set();
  for (const lead of Object.values(state.leads || {})) {
    for (const e of lead.events || []) {
      if (dateKey(new Date(e.timestamp)) !== key) continue;
      const n = e.count || 1;
      if (e.type === 'insurance/call') t.calls += n;
      else if (e.type === 'insurance/quote') t.quotes += n;
      else if (e.type === 'insurance/closed_policy') t.closes += n;
      t.xp += (e.xp || 0) * n;
      touched.add(lead.id);
    }
  }
  t.leadsTouched = touched.size;
  return t;
}

function fallbackRecap(t, c) {
  if (t.calls + t.quotes + t.closes === 0) {
    return `No deeds logged today yet, ${c.name}. Sound the horn — log your first call and put a point on the board.`;
  }
  const won = t.closes > 0 ? ' A policy fell today — well fought.' : ' Keep pressing toward the close.';
  return `Today: ${t.calls} calls, ${t.quotes} quotes, ${t.closes} closes across ${t.leadsTouched} prospect(s) for ${t.xp} EXP.${won}`;
}

async function generateDailyRecap() {
  const state = await readState();
  const c = summarize(state);
  const t = todaySummary(state);
  const system =
    'You are the War Council giving a brief end-of-day recap to a P&C sales crusader, based on today\'s numbers. ' +
    'Two or three short sentences: acknowledge the day, then a practical nudge for tomorrow. Crusader tone, no markdown.';
  const user =
    `Today's tally — ${t.calls} calls, ${t.quotes} quotes, ${t.closes} closes, ${t.xp} EXP, ${t.leadsTouched} prospect(s) touched. ` +
    `Rank ${c.title} (level ${c.level}). Recap today and nudge tomorrow.`;
  const out = await generate({ system, user, fallback: fallbackRecap(t, c), maxTokens: 170 });
  return { ...out, today: t };
}

module.exports = { generateBriefing, generateNextAction, generateDailyRecap };
