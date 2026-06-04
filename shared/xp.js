/** @typedef {{ minLevel: number, title: string, unlockKey: string | null }} CareerRank */

export const XP_PER_LEVEL_SQUARE = 50;

// Max attainable level. Raised to fit the 8 career ranks spaced ~30 levels apart
// (Grand Marshal tops out at 211). KEEP IN SYNC with server/xpEngine.js.
export const MAX_LEVEL = 211;

/** Total XP required to reach a given level (level 1 = 0). */
export function xpRequiredForLevel(level) {
  if (level <= 1) return 0;
  return XP_PER_LEVEL_SQUARE * level * level;
}

export function calculateLevel(totalXP) {
  let level = 1;
  while (totalXP >= xpRequiredForLevel(level + 1)) {
    level += 1;
    if (level >= MAX_LEVEL) break;
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

/**
 * Career rank ladder — ordered low → high. Lower early thresholds so the first
 * ranks come quickly. `art` is the rank emblem under /public (drop an image at
 * that path to show it; missing files fall back to a placeholder in the UI).
 * @type {(CareerRank & { art: string })[]}
 */
export const CAREER_RANKS = [
  { minLevel: 1, title: 'Peon', unlockKey: null, art: '/assets/Peon/Peon.jpeg' },
  { minLevel: 31, title: 'Scribe', unlockKey: null, art: '/assets/Scribe/Scribe.jpeg' },
  { minLevel: 61, title: 'Messenger', unlockKey: null, art: '/assets/Messenger/Messenger.jpeg' },
  { minLevel: 91, title: 'Crusader', unlockKey: null, art: '/assets/Crusader/Crusader.jpeg' },
  { minLevel: 121, title: 'Veteran', unlockKey: null, art: '/assets/Veteran/Veteran.jpeg' },
  { minLevel: 151, title: 'Whale Hunter', unlockKey: null, art: '/assets/Whale Hunter/Whale Hunter.jpeg' },
  { minLevel: 181, title: 'Captain', unlockKey: null, art: '/assets/Captain/Captain.jpeg' },
  { minLevel: 211, title: 'Grand Marshal', unlockKey: null, art: '/assets/Grand Marshal/Grand Marshal.jpeg' },
];

export function getCareerTitle(level) {
  let title = CAREER_RANKS[0].title;
  for (const rank of CAREER_RANKS) {
    if (level >= rank.minLevel) title = rank.title;
  }
  return title;
}

/** Full rank object (title + art + minLevel) the player currently holds. */
export function getCareerRank(level) {
  let rank = CAREER_RANKS[0];
  for (const r of CAREER_RANKS) {
    if (level >= r.minLevel) rank = r;
  }
  return rank;
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

// `tint` recolors the animated hero sprite to match the chosen rank (null = the
// sprite's natural colours). Mirrors the rank-token palette.
export const APPEARANCE_OPTIONS = [
  { id: 'boy_default', character: 'boy', skin: 'default', label: 'Squire', rewardKey: null, art: '/avatars/rank-squire.png', tint: null },
  { id: 'girl_default', character: 'girl', skin: 'default', label: 'Knight Errant', rewardKey: 'girl', art: '/avatars/rank-knight.png', tint: '#5b8af0' },
  { id: 'boy_champion', character: 'boy', skin: 'champion', label: 'Crusader', rewardKey: 'boy_champion', art: '/avatars/rank-crusader.png', tint: '#e3c45a' },
  { id: 'girl_champion', character: 'girl', skin: 'champion', label: 'Commander', rewardKey: 'girl_champion', art: '/avatars/rank-commander.png', tint: '#e0566a' },
];

/** Resolve the active appearance tint for a player (null if locked/unknown). */
export function appearanceTint(player) {
  const opt = APPEARANCE_OPTIONS.find(
    (o) => o.character === player.character && o.skin === player.skin
  );
  if (!opt) return null;
  const unlocked = !opt.rewardKey || (player.rewards || []).includes(opt.rewardKey);
  return unlocked ? opt.tint : null;
}

/**
 * Tiered campaign medals. Awarded server-side (see server/medals.js — keep in
 * sync) and displayed in the Badges panel. `stat` keys map to player.stats.
 * Names are stable: never rename an existing medal or already-earned badges break.
 */
export const MEDALS = [
  { name: 'First Dial', stat: 'calls', target: 1, xp: 50, icon: '📞', blurb: 'Make 1 call' },
  { name: 'Dialer Badge', stat: 'calls', target: 25, xp: 150, icon: '☎️', blurb: '25 calls' },
  { name: 'Centurion', stat: 'calls', target: 100, xp: 400, icon: '🎯', blurb: '100 calls' },
  { name: 'First Quote', stat: 'quotes', target: 1, xp: 50, icon: '📝', blurb: 'Send 1 quote' },
  { name: 'Quote Master', stat: 'quotes', target: 10, xp: 300, icon: '🗂️', blurb: '10 quotes' },
  { name: 'Quote Sniper', stat: 'quotes', target: 50, xp: 600, icon: '🎖️', blurb: '50 quotes' },
  { name: 'Closer Badge', stat: 'policies', target: 1, xp: 500, icon: '🏆', blurb: 'Close 1 policy' },
  { name: 'Rainmaker', stat: 'policies', target: 10, xp: 1000, icon: '👑', blurb: '10 policies' },
  { name: 'Conqueror', stat: 'policies', target: 50, xp: 2500, icon: '⚔️', blurb: '50 policies' },
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
