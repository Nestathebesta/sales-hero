/**
 * XP & career rank logic — keep in sync with shared/xp.js
 */
const XP_PER_LEVEL_SQUARE = 50;

function xpRequiredForLevel(level) {
  if (level <= 1) return 0;
  return XP_PER_LEVEL_SQUARE * level * level;
}

function calculateLevel(totalXP) {
  let level = 1;
  while (totalXP >= xpRequiredForLevel(level + 1)) {
    level += 1;
    if (level >= 99) break;
  }
  return level;
}

// KEEP IN SYNC with CAREER_RANKS in shared/xp.js (titles + minLevels).
const CAREER_RANKS = [
  { minLevel: 1, title: 'Peon', unlockKey: null },
  { minLevel: 2, title: 'Scribe', unlockKey: null },
  { minLevel: 3, title: 'Messenger', unlockKey: null },
  { minLevel: 8, title: 'Crusader', unlockKey: null },
  { minLevel: 16, title: 'Veteran', unlockKey: null },
  { minLevel: 28, title: 'Whale Hunter', unlockKey: null },
  { minLevel: 44, title: 'Captain', unlockKey: null },
  { minLevel: 65, title: 'Grand Marshal', unlockKey: null },
];

function getCareerTitle(level) {
  let title = CAREER_RANKS[0].title;
  for (const rank of CAREER_RANKS) {
    if (level >= rank.minLevel) title = rank.title;
  }
  return title;
}

function getUnlockedRewards(level) {
  const rewards = [];
  for (const rank of CAREER_RANKS) {
    if (rank.unlockKey && level >= rank.minLevel) {
      rewards.push(rank.unlockKey);
    }
  }
  return rewards;
}

function syncPlayerProgression(player) {
  const level = calculateLevel(player.totalXP ?? 0);
  return {
    ...player,
    level,
    title: getCareerTitle(level),
    rewards: getUnlockedRewards(level),
  };
}

module.exports = {
  calculateLevel,
  getCareerTitle,
  getUnlockedRewards,
  syncPlayerProgression,
};
