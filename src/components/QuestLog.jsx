import { useMemo } from 'react';
import { Phone, FileText, Trophy, ScrollText } from 'lucide-react';
import { EVENT_TYPES, dateKey, flattenEvents, relativeTime } from '../lib/insights.js';

const KIND_ICON = { call: Phone, quote: FileText, close: Trophy };

function dayLabel(key) {
  const today = dateKey(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (key === today) return 'Today';
  if (key === dateKey(y)) return 'Yesterday';
  const [yr, mo, da] = key.split('-').map(Number);
  return new Date(yr, mo - 1, da).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

const QuestLog = ({ leads }) => {
  const events = useMemo(() => flattenEvents(leads), [leads]);

  if (events.length === 0) {
    return (
      <div className="panel pipeline-panel empty-state">
        <div className="empty-icon" aria-hidden="true">📜</div>
        <h2>No Deeds Recorded</h2>
        <p>Your chronicle fills as you log calls, quotes, and closes in the <strong>Action Lab</strong>.</p>
      </div>
    );
  }

  // group consecutive events by day (events already sorted newest-first)
  const groups = [];
  let current = null;
  for (const ev of events) {
    const key = dateKey(ev.timestamp);
    if (!current || current.key !== key) {
      current = { key, items: [] };
      groups.push(current);
    }
    current.items.push(ev);
  }

  const totalXP = events.reduce((sum, e) => sum + e.xp, 0);

  return (
    <div className="panel pipeline-panel">
      <h2 className="panel-title panel-title--blue">Chronicle</h2>
      <p className="panel-subtitle">
        {events.length} deed{events.length !== 1 ? 's' : ''} · {totalXP} EXP earned in the field
      </p>

      <div className="quest-log">
        {groups.map((group) => (
          <div key={group.key} className="quest-day">
            <div className="quest-day-label">{dayLabel(group.key)}</div>
            <ul className="quest-items">
              {group.items.map((ev, i) => {
                const Icon = KIND_ICON[ev.kind] ?? ScrollText;
                const label = EVENT_TYPES[ev.type]?.label ?? 'Logged an action';
                return (
                  <li key={`${ev.leadId}-${ev.ts}-${i}`} className={`quest-item quest-item--${ev.kind}`}>
                    <span className="quest-icon" aria-hidden="true">
                      <Icon size={15} strokeWidth={2.2} />
                    </span>
                    <span className="quest-text">
                      {label} — <strong>{ev.leadName}</strong>
                      {ev.count > 1 ? <span className="quest-mult"> ×{ev.count}</span> : null}
                    </span>
                    <span className="quest-xp">+{ev.xp}</span>
                    <span className="quest-time">{relativeTime(ev.timestamp)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestLog;
