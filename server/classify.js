/**
 * Classify a calendar event title into a pipeline activity by keyword.
 * Used by the /api/calendar/event endpoint (Google Calendar -> Zapier -> here).
 * Most-specific rules first so "close call" counts as a close, not a call.
 */
const RULES = [
  { type: 'insurance/closed_policy', words: ['close', 'closed', 'bind', 'bound', 'sold', 'won', 'signed', 'policy issued'] },
  { type: 'insurance/quote', words: ['quote', 'proposal', 'estimate', 'pricing'] },
  { type: 'insurance/call', words: ['call', 'dial', 'phone', 'follow up', 'follow-up', 'meeting', 'consult', 'appointment', 'intro'] },
];

/** @returns {string|null} an eventType, or null if no keyword matched */
function classifyEventTitle(title = '') {
  const t = String(title).toLowerCase();
  for (const rule of RULES) {
    if (rule.words.some((w) => t.includes(w))) return rule.type;
  }
  return null;
}

/** Pull the likely entity from an event title: text after the last connector. */
function deriveEntity(title = '') {
  let t = String(title).trim();
  const m = t.match(/(?:\bwith\b|\bw\/\b|\bto\b|\bfor\b|:|–|-)\s*(.+)$/i);
  if (m && m[1]) t = m[1].trim();
  return t.slice(0, 48) || 'Calendar Lead';
}

/** Stable id fragment from a free-text name. */
function slug(name = '') {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'unknown';
}

module.exports = { classifyEventTitle, deriveEntity, slug, RULES };
