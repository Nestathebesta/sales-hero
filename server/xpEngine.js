/**
 * XP & career rank logic — keep in sync with shared/xp.js
 */
const XP_PER_LEVEL_SQUARE = 50;
// KEEP IN SYNC with shared/xp.js (MAX_LEVEL).
const MAX_LEVEL = 211;

function xpRequiredForLevel(level) {
  if (level <= 1) return 0;
  return XP_PER_LEVEL_SQUARE * level * level;
}

function calculateLevel(totalXP) {
  let level = 1;
  while (totalXP >= xpRequiredForLevel(level + 1)) {
    level += 1;
    if (level >= MAX_LEVEL) break;
  }
  return level;
}

// KEEP IN SYNC with CAREER_RANKS in shared/xp.js (titles + minLevels).
const CAREER_RANKS = [
  { minLevel: 1, title: 'Peon', unlockKey: null },
  { minLevel: 31, title: 'Scribe', unlockKey: null },
  { minLevel: 61, title: 'Messenger', unlockKey: null },
  { minLevel: 91, title: 'Crusader', unlockKey: null },
  { minLevel: 121, title: 'Veteran', unlockKey: null },
  { minLevel: 151, title: 'Whale Hunter', unlockKey: null },
  { minLevel: 181, title: 'Captain', unlockKey: null },
  { minLevel: 211, title: 'Grand Marshal', unlockKey: null },
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
