import { useEffect, useState } from 'react';

const ActivityFeed = ({ events }) => {
  const [displayText, setDisplayText] = useState('');

  const latestEvent =
    events && events.length > 0
      ? events[0]
      : 'Welcome to the Sales Crusade! Open Action Lab and log your first pipeline activity.';

  useEffect(() => {
    // Note: App pauses polling while the tab is hidden, so latestEvent never
    // changes in the background and this typewriter only runs while visible.
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
    <div className="activity-feed">
      <div className="activity-feed-label">Activity Feed</div>
      <div className="activity-feed-text">
        {displayText}
        <span className="cursor-blink" aria-hidden="true">▌</span>
      </div>
    </div>
  );
};

export default ActivityFeed;
