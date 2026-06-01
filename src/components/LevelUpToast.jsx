import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

const LevelUpToast = ({ level, title, onDismiss }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 4500);
    return () => clearTimeout(timer);
  }, [level, title, onDismiss]);

  if (!visible) return null;

  return (
    <div className="level-up-toast" role="status" aria-live="polite">
      <Shield size={28} aria-hidden="true" className="level-up-icon" />
      <div>
        <p className="level-up-kicker">Rank advanced</p>
        <p className="level-up-title">{title}</p>
        <p className="level-up-level">Level {level}</p>
      </div>
    </div>
  );
};

export default LevelUpToast;
