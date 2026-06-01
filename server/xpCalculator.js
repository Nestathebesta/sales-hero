const { getLead, saveLead, getPlayer, updatePlayer, addGlobalEvent } = require('./state');

// XP Source Priority Table
const XP_MAP = {
  'insurance/call': 30,
  'insurance/quote': 30,
  'insurance/closed_policy': 100 // Extra rewarding for closing!
};

function calculateLevel(xp) {
  if (xp < 100) return 1;
  if (xp < 500) return 2;
  if (xp < 1000) return 3;
  if (xp < 5000) return 4;
  if (xp < 10000) return 5;
  return 6;
}

function processEvent(leadId, eventType, contactInfo = {}) {
  let lead = getLead(leadId);
  let player = getPlayer();

  if (!lead) {
    let privacyName = "Unknown";
    if (contactInfo.firstName && contactInfo.lastName) {
      privacyName = `${contactInfo.firstName} ${contactInfo.lastName.charAt(0)}.`;
    } else if (contactInfo.name) {
       const parts = contactInfo.name.split(' ');
       privacyName = parts.length > 1 ? `${parts[0]} ${parts[parts.length-1].charAt(0)}.` : parts[0];
    }

    lead = {
      id: leadId,
      name: privacyName,
      xp: 0,
      level: 1,
      events: [],
      type: 'Prospect'
    };
    addGlobalEvent(`New prospect ${lead.name} entered the pipeline!`);
  }

  const earnedXP = XP_MAP[eventType] || 0;
  
  if (earnedXP > 0) {
    lead.xp += earnedXP;
    player.totalXP += earnedXP;
    
    // Update Stats for Achievements
    if (eventType === 'insurance/call') player.stats.calls++;
    if (eventType === 'insurance/quote') player.stats.quotes++;
    if (eventType === 'insurance/closed_policy') player.stats.policies++;

    // Check Badges
    let badgeEarned = false;
    if (player.stats.calls >= 25 && !player.badges.includes("Dialer Badge")) {
      player.badges.push("Dialer Badge");
      player.totalXP += 150;
      badgeEarned = "Dialer Badge";
    }
    if (player.stats.quotes >= 10 && !player.badges.includes("Quote Master")) {
      player.badges.push("Quote Master");
      player.totalXP += 300;
      badgeEarned = "Quote Master";
    }
    if (player.stats.policies >= 1 && !player.badges.includes("Closer Badge")) {
      player.badges.push("Closer Badge");
      player.totalXP += 500;
      badgeEarned = "Closer Badge";
    }

    if (badgeEarned) {
      addGlobalEvent(`Guild agent ${player.name} earned the ${badgeEarned}!`);
    }

    // Check level up for lead
    const newLeadLevel = calculateLevel(lead.xp);
    if (newLeadLevel > lead.level) {
      lead.level = newLeadLevel;
      addGlobalEvent(`${lead.name} advanced in the pipeline! (LVL ${lead.level})`);
    }

    // Check level up for player
    const newPlayerLevel = calculateLevel(player.totalXP);
    if (newPlayerLevel > player.level) {
      player.level = newPlayerLevel;
      addGlobalEvent(`Guild agent ${player.name} reached LVL ${player.level}!`);
      
      // Reward skin/race unlocks based on player level
      if (player.level >= 2 && !player.rewards.includes("girl")) player.rewards.push("girl");
      if (player.level >= 3 && !player.rewards.includes("boy_champion")) player.rewards.push("boy_champion");
      if (player.level >= 4 && !player.rewards.includes("girl_champion")) player.rewards.push("girl_champion");
    }

    lead.events.push({
      type: eventType,
      xp: earnedXP,
      timestamp: new Date().toISOString()
    });

    // Battle Log Text
    let actionText = "interacted with";
    if (eventType === "insurance/call") actionText = "called";
    if (eventType === "insurance/quote") actionText = "sent a P&C quote to";
    if (eventType === "insurance/closed_policy") actionText = "closed a policy for";
    
    addGlobalEvent(`${player.name} ${actionText} ${lead.name}. (+${earnedXP} EXP)`);
  }

  saveLead(leadId, lead);
  updatePlayer(player);

  return { lead, player, earnedXP };
}

module.exports = {
  processEvent,
  calculateLevel
};
