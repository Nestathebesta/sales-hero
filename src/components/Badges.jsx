import { MEDALS } from '../../shared/xp.js';

const Badges = ({ stats, badges }) => {
  const earnedCount = MEDALS.filter((m) => badges.includes(m.name)).length;

  return (
    <div className="panel hero-panel badges-panel">
      <h3 className="panel-title panel-title--gold">
        Campaign Medals <span className="medal-tally">{earnedCount}/{MEDALS.length}</span>
      </h3>

      <div className="badge-grid">
        {MEDALS.map((m) => {
          const earned = badges.includes(m.name);
          const current = stats[m.stat] || 0;
          const progress = Math.min(100, Math.floor((current / m.target) * 100));
          return (
            <div key={m.name} className={`badge-card ${earned ? 'earned' : ''}`} title={m.blurb}>
              <div className="badge-icon">{m.icon}</div>
              <div className="badge-name">{m.name}</div>
              {!earned && (
                <div className="badge-progress-wrap">
                  <div className="badge-progress-bar" style={{ width: `${progress}%` }} />
                </div>
              )}
              <div className="badge-requirement">
                {earned ? 'Earned!' : `${current}/${m.target}`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="career-stats">
        <h4>Career Stats</h4>
        <div className="stats-grid">
          <div>Calls: <strong>{stats.calls || 0}</strong></div>
          <div>Quotes: <strong>{stats.quotes || 0}</strong></div>
          <div className="stats-full">Closed Policies: <strong>{stats.policies || 0}</strong></div>
        </div>
      </div>
    </div>
  );
};

export default Badges;
