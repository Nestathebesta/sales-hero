import { useEffect, useRef, useState } from 'react';
import { useSalesState } from '../hooks/useSalesState';
import PeonSprite from './PeonSprite';

// Ranks whose emblem image isn't in /public yet fall back to this.
const FALLBACK = '/avatars/rank-crusader.png';

// Ranks with a real sliced sprite sheet render an animated idle instead of a
// static portrait. Add rank titles here as their idle sheets are produced.
const SPRITE_RANKS = { Peon: PeonSprite };

/**
 * The current rank's character shown in the Crusader Card, with a gentle CSS
 * "idle" animation (breathing/float). On a closed deal it plays a quick cheer
 * pop (driven by salesState.closedDeal, same signal the old sprite used).
 */
const RankAvatar = ({ art, label, size = 132 }) => {
  const [cheering, setCheering] = useState(false);
  const closedDeal = useSalesState((s) => s.closedDeal);
  const prevClosedDeal = useRef(closedDeal);

  useEffect(() => {
    if (closedDeal === prevClosedDeal.current) return;
    prevClosedDeal.current = closedDeal;
    setCheering(true);
    const t = setTimeout(() => setCheering(false), 680);
    return () => clearTimeout(t);
  }, [closedDeal]);

  // Animated sprite ranks (e.g. Peon) get their own canvas idle player.
  const SpriteComponent = label ? SPRITE_RANKS[label] : null;
  if (SpriteComponent) {
    return <SpriteComponent size={size} fallbackArt={art} label={label} />;
  }

  return (
    <img
      src={art || FALLBACK}
      alt={label ? `${label} — idle` : 'Rank avatar'}
      className={`rank-avatar ${cheering ? 'rank-avatar--cheer' : 'rank-avatar--idle'}`}
      style={{ height: size }}
      draggable={false}
      onError={(e) => {
        if (e.currentTarget.src.indexOf(FALLBACK) === -1) e.currentTarget.src = FALLBACK;
      }}
    />
  );
};

export default RankAvatar;
