import { useEffect, useRef, useState } from 'react';
import { useSalesState } from '../hooks/useSalesState';
import PeonSprite from './PeonSprite';

// Ranks whose emblem image isn't in /public yet fall back to this.
const FALLBACK = '/avatars/rank-crusader.png';

// Ranks with a real sliced sprite sheet render an animated idle instead of a
// static portrait. Add rank titles here as their idle sheets are produced.
const SPRITE_RANKS = { Peon: PeonSprite };

/**
 * The current rank's character shown in the Crusader Card, with a layered CSS
 * "idle" animation (breathing bob + subtle sway) over a grounding contact
 * shadow. On a closed deal it plays a squash-and-stretch cheer pop (driven by
 * salesState.closedDeal, same signal the old sprite used).
 */
const RankAvatar = ({ art, label, size = 132 }) => {
  const [cheering, setCheering] = useState(false);
  const closedDeal = useSalesState((s) => s.closedDeal);
  const prevClosedDeal = useRef(closedDeal);

  // Start each instance partway through its idle cycle so multiple avatars
  // (and remounts) never bob in lock-step — reads as alive, not mechanical.
  // Lazy initializer: the random offset is computed once per mount.
  const [idleDelay] = useState(() => `-${(Math.random() * 3.6).toFixed(2)}s`);

  useEffect(() => {
    if (closedDeal === prevClosedDeal.current) return;
    prevClosedDeal.current = closedDeal;
    setCheering(true);
    const t = setTimeout(() => setCheering(false), 680);
    return () => clearTimeout(t);
  }, [closedDeal]);

  // Animated sprite ranks (e.g. Peon) get their own canvas idle player.
  const SpriteComponent = label ? SPRITE_RANKS[label] : null;

  return (
    <div className="avatar-stage">
      {SpriteComponent ? (
        <SpriteComponent size={size} fallbackArt={art} label={label} />
      ) : (
        <img
          src={art || FALLBACK}
          alt={label ? `${label} — idle` : 'Rank avatar'}
          className={`rank-avatar ${cheering ? 'rank-avatar--cheer' : 'rank-avatar--idle'}`}
          style={{ height: size, animationDelay: cheering ? undefined : idleDelay }}
          draggable={false}
          onError={(e) => {
            if (e.currentTarget.src.indexOf(FALLBACK) === -1) e.currentTarget.src = FALLBACK;
          }}
        />
      )}
      <span className="avatar-shadow" aria-hidden="true" />
    </div>
  );
};

export default RankAvatar;
