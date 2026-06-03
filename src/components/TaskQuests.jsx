import { useMemo } from 'react';
import { Phone, FileText, Trophy, ScrollText, CheckCircle2, Circle } from 'lucide-react';

// Mirrors the server XP_MAP / FLAT_TASK_XP so open quests can preview a reward.
const ACTIVITY_XP = {
  'insurance/call': 30,
  'insurance/quote': 30,
  'insurance/closed_policy': 100,
};
const FLAT_TASK_XP = 20;

const KIND_ICON = {
  'insurance/call': Phone,
  'insurance/quote': FileText,
  'insurance/closed_policy': Trophy,
};

function projectedXP(task) {
  return task.eventType ? ACTIVITY_XP[task.eventType] ?? FLAT_TASK_XP : FLAT_TASK_XP;
}

function fmtTime(startTime) {
  if (startTime == null || Number.isNaN(Number(startTime))) return null;
  const h = Math.floor(startTime);
  const m = Math.round((startTime - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
}

const TaskQuests = ({ tasks }) => {
  const { open, done, earned } = useMemo(() => {
    const all = Object.values(tasks || {});
    const byTime = (a, b) => (a.startTime ?? 99) - (b.startTime ?? 99);
    const openList = all.filter((t) => !t.completed).sort(byTime);
    const doneList = all
      .filter((t) => t.completed)
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
    const earnedXP = doneList.reduce((sum, t) => sum + (t.awardedXP || 0), 0);
    return { open: openList, done: doneList, earned: earnedXP };
  }, [tasks]);

  if (open.length === 0 && done.length === 0) {
    return (
      <div className="panel pipeline-panel empty-state">
        <div className="empty-icon" aria-hidden="true">🗓️</div>
        <h2>No Quests Synced</h2>
        <p>
          Quests appear here once your <strong>Structured</strong> planner syncs. Completing a task
          there awards EXP automatically — sales tasks (calls, quotes, closes) also level up your
          pipeline.
        </p>
      </div>
    );
  }

  const renderItem = (task, isDone) => {
    const Icon = KIND_ICON[task.eventType] ?? ScrollText;
    const xp = isDone ? task.awardedXP || 0 : projectedXP(task);
    const time = fmtTime(task.startTime);
    return (
      <li key={task.id} className={`quest-item ${isDone ? 'quest-item--close' : 'quest-item--call'}`}>
        <span className="quest-icon" aria-hidden="true">
          {isDone ? <CheckCircle2 size={15} strokeWidth={2.2} /> : <Icon size={15} strokeWidth={2.2} />}
        </span>
        <span className="quest-text">
          <strong>{task.title}</strong>
          {task.eventType && <span className="quest-mult"> · {task.eventType.split('/')[1]}</span>}
        </span>
        <span className="quest-xp">{isDone ? `+${xp}` : `${xp} XP`}</span>
        {time && <span className="quest-time">{time}</span>}
      </li>
    );
  };

  return (
    <div className="panel pipeline-panel">
      <h2 className="panel-title panel-title--blue">Quests</h2>
      <p className="panel-subtitle">
        {open.length} open · {done.length} completed · {earned} EXP from your planner
      </p>

      {open.length > 0 && (
        <div className="quest-day">
          <div className="quest-day-label">
            <Circle size={11} aria-hidden="true" /> Open
          </div>
          <ul className="quest-items">{open.map((t) => renderItem(t, false))}</ul>
        </div>
      )}

      {done.length > 0 && (
        <div className="quest-day">
          <div className="quest-day-label">
            <CheckCircle2 size={11} aria-hidden="true" /> Completed
          </div>
          <ul className="quest-items">{done.map((t) => renderItem(t, true))}</ul>
        </div>
      )}
    </div>
  );
};

export default TaskQuests;
