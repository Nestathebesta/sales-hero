/**
 * Pure, framework-agnostic helpers that turn the GameMaster `/state` payload
 * into the data the dashboard features need (daily goals, streaks, quest log,
 * pipeline stages, performance charts). Everything is derived from the lead
 * event history — each event is `{ type, xp, timestamp }` — so no backend
 * changes are required.
 */

export const EVENT_TYPES = {
  'insurance/call': { kind: 'call', label: 'Dialed a lead', icon: 'phone' },
  'insurance/quote': { kind: 'quote', label: 'Sent a quote', icon: 'quote' },
  'insurance/closed_policy': { kind: 'close', label: 'Closed a policy', icon: 'close' },
};

export const DAILY_GOALS = { calls: 10, quotes: 5, policies: 1 };

/** Sales pipeline stages, ordered. */
export const STAGES = ['New', 'Contacted', 'Quoted', 'Closed'];

export const STAGE_META = {
  New: { tone: 'steel', blurb: 'Fresh prospect' },
  Contacted: { tone: 'blue', blurb: 'Dialed' },
  Quoted: { tone: 'gold', blurb: 'Quote sent' },
  Closed: { tone: 'crimson', blurb: 'Policy won' },
};

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Local-time date key, e.g. "2026-06-02". */
export function dateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Flatten every lead's events into one timeline, newest first. */
export function flattenEvents(leads) {
  const out = [];
  for (const lead of Object.values(leads || {})) {
    for (const ev of lead.events || []) {
      const count = ev.count ?? 1;
      out.push({
        leadId: lead.id,
        leadName: lead.name,
        type: ev.type,
        kind: EVENT_TYPES[ev.type]?.kind ?? 'other',
        count,
        xp: (ev.xp ?? 0) * count, // total XP for the batch
        timestamp: ev.timestamp,
        ts: new Date(ev.timestamp).getTime(),
      });
    }
  }
  return out.sort((a, b) => b.ts - a.ts);
}

/** Map of dateKey -> { calls, quotes, policies, xp, total }. */
export function dailyCounts(events) {
  const map = {};
  for (const e of events) {
    const key = dateKey(e.timestamp);
    const bucket = (map[key] ??= { calls: 0, quotes: 0, policies: 0, xp: 0, total: 0 });
    const c = e.count ?? 1;
    if (e.kind === 'call') bucket.calls += c;
    else if (e.kind === 'quote') bucket.quotes += c;
    else if (e.kind === 'close') bucket.policies += c;
    bucket.xp += e.xp; // already total for the batch
    bucket.total += c;
  }
  return map;
}

const EMPTY_DAY = { calls: 0, quotes: 0, policies: 0, xp: 0, total: 0 };

export function todayCounts(daily) {
  return daily[dateKey(new Date())] ?? { ...EMPTY_DAY };
}

/**
 * Consecutive days with at least one logged action, ending today (or yesterday
 * if nothing is logged yet today — today still counts as "alive").
 */
export function computeStreak(daily) {
  const cursor = new Date();
  if (!daily[dateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (daily[dateKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Derive a lead's pipeline stage from the furthest action it has reached. */
export function leadStage(lead) {
  const types = new Set((lead.events || []).map((e) => e.type));
  if (types.has('insurance/closed_policy')) return 'Closed';
  if (types.has('insurance/quote')) return 'Quoted';
  if (types.has('insurance/call')) return 'Contacted';
  return 'New';
}

/** Group leads by derived stage, preserving STAGES order. */
export function groupByStage(leads) {
  const groups = Object.fromEntries(STAGES.map((s) => [s, []]));
  for (const lead of Object.values(leads || {})) {
    groups[leadStage(lead)].push(lead);
  }
  return groups;
}

/** Conversion funnel from authoritative cumulative stats. */
export function funnel(stats = {}) {
  const calls = stats.calls ?? 0;
  const quotes = stats.quotes ?? 0;
  const policies = stats.policies ?? 0;
  return {
    calls,
    quotes,
    policies,
    quoteRate: calls ? Math.round((quotes / calls) * 100) : 0,
    closeRate: quotes ? Math.round((policies / quotes) * 100) : 0,
    winRate: calls ? Math.round((policies / calls) * 100) : 0,
  };
}

/**
 * Cumulative-XP line series for the last `days` days, seeded with XP earned
 * before the window so the curve reflects true total growth.
 */
export function xpSeries(events, days = 14) {
  const daily = dailyCounts(events);
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startKey = dateKey(start);

  let cumulative = 0;
  for (const [key, bucket] of Object.entries(daily)) {
    if (key < startKey) cumulative += bucket.xp;
  }

  const series = [];
  const cursor = new Date(start);
  for (let i = 0; i < days; i += 1) {
    const key = dateKey(cursor);
    const day = daily[key] ?? EMPTY_DAY;
    cumulative += day.xp;
    series.push({ key, label: `${cursor.getMonth() + 1}/${cursor.getDate()}`, dayXp: day.xp, cumulative });
    cursor.setDate(cursor.getDate() + 1);
  }
  return series;
}

/** "3m ago", "2h ago", "5d ago" relative time. */
export function relativeTime(timestamp, now = Date.now()) {
  const diff = Math.max(0, now - new Date(timestamp).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
