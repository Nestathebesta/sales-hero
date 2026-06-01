const { getLead, saveLead, getPlayer, updatePlayer, addGlobalEvent } = require('./state');
const {
  calculateLevel,
  getCareerTitle,
  getUnlockedRewards,
  syncPlayerProgression,
} = require('./xpEngine');

const XP_MAP = {
  'insurance/call': 30,
  'insurance/quote': 30,
  'insurance/closed_policy': 100,
};

function applyPlayerProgression(player, previousLevel) {
  const synced = syncPlayerProgression(player);
  Object.assign(player, synced);

  if (player.level > previousLevel) {
    addGlobalEvent(
      `${player.name} was promoted to ${player.title}! (Level ${player.level})`
    );
  }

  return player.level > previousLevel;
}

function processEvent(leadId, eventType, contactInfo = {}) {
  let lead = getLead(leadId);
  let player = syncPlayerProgression(getPlayer());
  const previousPlayerLevel = player.level;
  const previousLeadLevel = lead?.level ?? 1;

  if (!lead) {
    let privacyName = 'Unknown';
    if (contactInfo.firstName && contactInfo.lastName) {
      privacyName = `${contactInfo.firstName} ${contactInfo.lastName.charAt(0)}.`;
    } else if (contactInfo.name) {
      const parts = contactInfo.name.split(' ');
      privacyName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.` : parts[0];
    }

    lead = {
      id: leadId,
      name: privacyName,
      xp: 0,
      level: 1,
      events: [],
      type: 'Prospect',
    };
    addGlobalEvent(`New prospect ${lead.name} entered the pipeline!`);
  }

  const earnedXP = XP_MAP[eventType] || 0;

  if (earnedXP > 0) {
    lead.xp += earnedXP;
    player.totalXP += earnedXP;

    if (eventType === 'insurance/call') player.stats.calls++;
    if (eventType === 'insurance/quote') player.stats.quotes++;
    if (eventType === 'insurance/closed_policy') player.stats.policies++;

    let badgeEarned = false;
    if (player.stats.calls >= 25 && !player.badges.includes('Dialer Badge')) {
      player.badges.push('Dialer Badge');
      player.totalXP += 150;
      badgeEarned = 'Dialer Badge';
    }
    if (player.stats.quotes >= 10 && !player.badges.includes('Quote Master')) {
      player.badges.push('Quote Master');
      player.totalXP += 300;
      badgeEarned = 'Quote Master';
    }
    if (player.stats.policies >= 1 && !player.badges.includes('Closer Badge')) {
      player.badges.push('Closer Badge');
      player.totalXP += 500;
      badgeEarned = 'Closer Badge';
    }

    if (badgeEarned) {
      addGlobalEvent(`${player.name} earned the ${badgeEarned}!`);
    }

    const newLeadLevel = calculateLevel(lead.xp);
    if (newLeadLevel > previousLeadLevel) {
      lead.level = newLeadLevel;
      addGlobalEvent(`${lead.name} advanced in the pipeline! (Level ${lead.level})`);
    } else {
      lead.level = newLeadLevel;
    }

    applyPlayerProgression(player, previousPlayerLevel);

    lead.events.push({
      type: eventType,
      xp: earnedXP,
      timestamp: new Date().toISOString(),
    });

    let actionText = 'interacted with';
    if (eventType === 'insurance/call') actionText = 'called';
    if (eventType === 'insurance/quote') actionText = 'sent a P&C quote to';
    if (eventType === 'insurance/closed_policy') actionText = 'closed a policy for';

    addGlobalEvent(`${player.name} ${actionText} ${lead.name}. (+${earnedXP} EXP)`);
  }

  saveLead(leadId, lead);
  updatePlayer(player);

  return { lead, player, earnedXP };
}

module.exports = {
  processEvent,
  calculateLevel,
};
