import { useEffect, useState } from 'react';

const BattleLog = ({ events }) => {
  const [displayText, setDisplayText] = useState('');

  const latestEvent =
    events && events.length > 0
      ? events[0]
      : 'Welcome to SalesDex! Head to Action Lab and trigger your first encounter.';

  useEffect(() => {
    let i = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset typewriter on new event
    setDisplayText('');
    const interval = setInterval(() => {
      setDisplayText(latestEvent.substring(0, i));
      i += 1;
      if (i > latestEvent.length) {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [latestEvent]);

  return (
    <div className="battle-log">
      <div className="battle-log-label">Battle Log</div>
      <div className="battle-log-text">
        {displayText}
        <span className="cursor-blink" aria-hidden="true">▼</span>
      </div>
    </div>
  );
};

export default BattleLog;
