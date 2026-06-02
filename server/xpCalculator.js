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
async function processEvent(leadId, eventType, contactInfo = {}) {
  const state = await readState();
  const player = state.player; // already level/title-synced by readState
  const previousPlayerLevel = player.level;

  let lead = state.leads[leadId];
  if (!lead) {
    lead = { id: leadId, name: privacyName(contactInfo), xp: 0, level: 1, events: [], type: 'Prospect' };
    state.leads[leadId] = lead;
    pushGlobalEvent(state, `New prospect ${lead.name} entered the pipeline!`);
  }
  const previousLeadLevel = lead.level ?? 1;

  const earnedXP = XP_MAP[eventType] || 0;
  if (earnedXP > 0) {
    lead.xp += earnedXP;
    player.totalXP += earnedXP;

    if (eventType === 'insurance/call') player.stats.calls += 1;
    if (eventType === 'insurance/quote') player.stats.quotes += 1;
    if (eventType === 'insurance/closed_policy') player.stats.policies += 1;

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

    lead.events.push({ type: eventType, xp: earnedXP, timestamp: new Date().toISOString() });

    let actionText = 'interacted with';
    if (eventType === 'insurance/call') actionText = 'called';
    if (eventType === 'insurance/quote') actionText = 'sent a P&C quote to';
    if (eventType === 'insurance/closed_policy') actionText = 'closed a policy for';
    pushGlobalEvent(state, `${player.name} ${actionText} ${lead.name}. (+${earnedXP} EXP)`);
  }

  await writeState(state);
  return { lead, player, earnedXP };
}

module.exports = { processEvent, calculateLevel };
