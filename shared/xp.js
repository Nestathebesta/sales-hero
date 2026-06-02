/** @typedef {{ minLevel: number, title: string, unlockKey: string | null }} CareerRank */

export const XP_PER_LEVEL_SQUARE = 50;

/** Total XP required to reach a given level (level 1 = 0). */
export function xpRequiredForLevel(level) {
  if (level <= 1) return 0;
  return XP_PER_LEVEL_SQUARE * level * level;
}

export function calculateLevel(totalXP) {
  let level = 1;
  while (totalXP >= xpRequiredForLevel(level + 1)) {
    level += 1;
    if (level >= 99) break;
  }
  return level;
}

export function xpProgressInLevel(totalXP, level) {
  const floor = xpRequiredForLevel(level);
  const ceiling = xpRequiredForLevel(level + 1);
  const current = totalXP - floor;
  const needed = ceiling - floor;
  const percent = needed > 0 ? Math.min(100, Math.floor((current / needed) * 100)) : 100;
  return { current, needed, ceiling, floor, percent };
}

/** @type {CareerRank[]} */
export const CAREER_RANKS = [
  { minLevel: 1, title: 'Squire', unlockKey: null },
  { minLevel: 3, title: 'Knight Errant', unlockKey: 'girl' },
  { minLevel: 7, title: 'Crusader', unlockKey: 'boy_champion' },
  { minLevel: 12, title: 'Commander', unlockKey: 'girl_champion' },
  { minLevel: 20, title: 'Grand Marshal', unlockKey: null },
];

export function getCareerTitle(level) {
  let title = CAREER_RANKS[0].title;
  for (const rank of CAREER_RANKS) {
    if (level >= rank.minLevel) title = rank.title;
  }
  return title;
}

export function getUnlockedRewards(level) {
  const rewards = [];
  for (const rank of CAREER_RANKS) {
    if (rank.unlockKey && level >= rank.minLevel) {
      rewards.push(rank.unlockKey);
    }
  }
  return rewards;
}

export function unlockLevelForReward(rewardKey) {
  const rank = CAREER_RANKS.find((r) => r.unlockKey === rewardKey);
  return rank?.minLevel ?? 99;
}

export const APPEARANCE_OPTIONS = [
  { id: 'boy_default', character: 'boy', skin: 'default', label: 'Squire', rewardKey: null, art: '/avatars/rank-squire.png' },
  { id: 'girl_default', character: 'girl', skin: 'default', label: 'Knight Errant', rewardKey: 'girl', art: '/avatars/rank-knight.png' },
  { id: 'boy_champion', character: 'boy', skin: 'champion', label: 'Crusader', rewardKey: 'boy_champion', art: '/avatars/rank-crusader.png' },
  { id: 'girl_champion', character: 'girl', skin: 'champion', label: 'Commander', rewardKey: 'girl_champion', art: '/avatars/rank-commander.png' },
];

export function syncPlayerProgression(player) {
  const level = calculateLevel(player.totalXP ?? 0);
  return {
    ...player,
    level,
    title: getCareerTitle(level),
    rewards: getUnlockedRewards(level),
  };
}
