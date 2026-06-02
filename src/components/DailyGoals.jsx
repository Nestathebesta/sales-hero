import { Flame, Check } from 'lucide-react';
import {
  DAILY_GOALS,
  computeStreak,
  dailyCounts,
  flattenEvents,
  todayCounts,
} from '../lib/insights.js';

const GOAL_ROWS = [
  { key: 'calls', label: 'Calls', tone: 'blue', goal: DAILY_GOALS.calls },
  { key: 'quotes', label: 'Quotes', tone: 'gold', goal: DAILY_GOALS.quotes },
  { key: 'policies', label: 'Closes', tone: 'crimson', goal: DAILY_GOALS.policies },
];

const DailyGoals = ({ leads }) => {
  const events = flattenEvents(leads);
  const daily = dailyCounts(events);
  const today = todayCounts(daily);
  const streak = computeStreak(daily);

  const metCount = GOAL_ROWS.filter((r) => today[r.key] >= r.goal).length;
  const allMet = metCount === GOAL_ROWS.length;

  return (
    <div className="panel daily-panel">
      <div className="daily-header">
        <h3 className="panel-title panel-title--blue daily-title">Daily Crusade</h3>
        <div className={`streak-badge ${streak > 0 ? 'streak-badge--active' : ''}`}>
          <Flame size={14} aria-hidden="true" />
          <span>{streak}</span>
          <span className="streak-unit">day{streak === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div className="daily-goals">
        {GOAL_ROWS.map(({ key, label, tone, goal }) => {
          const value = today[key] ?? 0;
          const percent = Math.min(100, Math.round((value / goal) * 100));
          const done = value >= goal;
          return (
            <div key={key} className={`daily-goal ${done ? 'daily-goal--done' : ''}`}>
              <div className="daily-goal-top">
                <span className="daily-goal-label">{label}</span>
                <span className="daily-goal-count">
                  {done && <Check size={12} aria-hidden="true" />}
                  {value}<span className="daily-goal-target">/{goal}</span>
                </span>
              </div>
              <div className="daily-goal-track">
                <div className={`daily-goal-bar daily-goal-bar--${tone}`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="daily-footer">
        {allMet
          ? '⚔ Daily objectives complete — the realm is secure.'
          : `${GOAL_ROWS.length - metCount} objective${GOAL_ROWS.length - metCount === 1 ? '' : 's'} left to hold your streak.`}
      </p>
    </div>
  );
};

export default DailyGoals;
