const BADGE_DEFS = [
  { name: 'Dialer Badge', statKey: 'calls', target: 25, icon: '📞' },
  { name: 'Quote Master', statKey: 'quotes', target: 10, icon: '📝' },
  { name: 'Closer Badge', statKey: 'policies', target: 1, icon: '🏆' },
];

const Badges = ({ stats, badges }) => {
  return (
    <div className="panel hero-panel badges-panel">
      <h3 className="panel-title panel-title--gold">Campaign Medals</h3>

      <div className="badge-grid">
        {BADGE_DEFS.map((b) => {
          const earned = badges.includes(b.name);
          const current = stats[b.statKey] || 0;
          const progress = Math.min(100, Math.floor((current / b.target) * 100));
          return (
            <div key={b.name} className={`badge-card ${earned ? 'earned' : ''}`}>
              <div className="badge-icon">{b.icon}</div>
              <div className="badge-name">{b.name}</div>
              {!earned && (
                <div className="badge-progress-wrap">
                  <div className="badge-progress-bar" style={{ width: `${progress}%` }} />
                </div>
              )}
              <div className="badge-requirement">
                {earned ? 'Earned!' : `${current}/${b.target}`}
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
