const { readState, writeState, pushGlobalEvent } = require('./state');
const { calculateLevel, syncPlayerProgression } = require('./xpEngine');
const { MEDALS } = require('./medals');

const XP_MAP = {
  'insurance/call': 30,
  'insurance/quote': 30,
  'insurance/closed_policy': 100,
};

function privacyName(contactInfo = {}) {
  if (contactInfo.firstName && contactInfo.lastName) {
    return `${contactInfo.firstName} ${contactInfo.lastName.charAt(0)}.`;
  }
  if (contactInfo.name) {
    const parts = contactInfo.name.split(' ');
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.` : parts[0];
  }
  return 'Unknown';
}

/**
 * Apply a pipeline event: loads the full state once, mutates it in memory
 * (lead XP, player XP/stats/medals/level, event log), and persists once.
 */
async function processEvent(leadId, eventType, contactInfo = {}, count = 1) {
  const n = Math.max(1, Math.min(100, Math.floor(Number(count)) || 1));
  const state = await readState();
  const player = state.player; // already level/title-synced by readState
  const previousPlayerLevel = player.level;

  let lead = state.leads[leadId];
  if (!lead) {
    // displayName (manual/calendar entries) is user-chosen — keep it verbatim;
    // otherwise mask CRM PII to "First L." via privacyName.
    const leadName = contactInfo.displayName
      ? String(contactInfo.displayName).slice(0, 48)
      : privacyName(contactInfo);
    lead = { id: leadId, name: leadName, xp: 0, level: 1, events: [], type: 'Prospect' };
    state.leads[leadId] = lead;
    pushGlobalEvent(state, `New prospect ${lead.name} entered the pipeline!`);
  }
  const previousLeadLevel = lead.level ?? 1;

  const perXP = XP_MAP[eventType] || 0;
  const earnedXP = perXP * n;
  if (perXP > 0) {
    lead.xp += earnedXP;
    player.totalXP += earnedXP;

    if (eventType === 'insurance/call') player.stats.calls += n;
    if (eventType === 'insurance/quote') player.stats.quotes += n;
    if (eventType === 'insurance/closed_policy') player.stats.policies += n;

    for (const medal of MEDALS) {
      const progress = player.stats[medal.stat] || 0;
      if (progress >= medal.target && !player.badges.includes(medal.name)) {
        player.badges.push(medal.name);
        player.totalXP += medal.xp;
        pushGlobalEvent(state, `${player.name} earned the ${medal.name}! (+${medal.xp} EXP)`);
      }
    }

    lead.level = calculateLevel(lead.xp);
    if (lead.level > previousLeadLevel) {
      pushGlobalEvent(state, `${lead.name} advanced in the pipeline! (Level ${lead.level})`);
    }

    // re-derive player level/title/rewards after all XP changes
    Object.assign(player, syncPlayerProgression(player));
    if (player.level > previousPlayerLevel) {
      pushGlobalEvent(state, `${player.name} was promoted to ${player.title}! (Level ${player.level})`);
    }

    // One record carries the quantity (count) — keeps the event log compact.
    lead.events.push({ type: eventType, xp: perXP, count: n, timestamp: new Date().toISOString() });

    let actionText = 'interacted with';
    if (eventType === 'insurance/call') actionText = n > 1 ? 'logged calls for' : 'called';
    if (eventType === 'insurance/quote') actionText = n > 1 ? 'sent quotes to' : 'sent a P&C quote to';
    if (eventType === 'insurance/closed_policy') actionText = n > 1 ? 'closed policies for' : 'closed a policy for';
    const qty = n > 1 ? ` ×${n}` : '';
    pushGlobalEvent(state, `${player.name} ${actionText} ${lead.name}${qty}. (+${earnedXP} EXP)`);
  }

  await writeState(state);
  return { lead, player, earnedXP, count: n };
}

module.exports = { processEvent, calculateLevel };
