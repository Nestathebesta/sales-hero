import { useEffect, useState } from 'react';
import { Shield, Crown } from 'lucide-react';

const LevelUpToast = ({ level, title, isRankUp = false, onDismiss }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, isRankUp ? 5500 : 4500);
    return () => clearTimeout(timer);
  }, [level, title, isRankUp, onDismiss]);

  if (!visible) return null;

  const Icon = isRankUp ? Crown : Shield;

  return (
    <div className={`level-up-toast ${isRankUp ? 'level-up-toast--rankup' : ''}`} role="status" aria-live="polite">
      <span className="level-up-burst" aria-hidden="true" />
      <Icon size={28} aria-hidden="true" className="level-up-icon" />
      <div className="level-up-body">
        <p className="level-up-kicker">{isRankUp ? '⚔ Rank Up!' : 'Level Up'}</p>
        <p className="level-up-title">{isRankUp ? title : `Level ${level}`}</p>
        <p className="level-up-level">{isRankUp ? `Level ${level} · ${title}` : title}</p>
      </div>
    </div>
  );
};

export default LevelUpToast;
