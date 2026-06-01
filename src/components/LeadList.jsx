const XP_THRESHOLDS = [100, 500, 1000, 5000, 10000];

function getXpForNextLevel(level) {
  if (level <= 0 || level > XP_THRESHOLDS.length) return 10000;
  return XP_THRESHOLDS[level - 1];
}

const PRODUCT_ICONS = {
  auto: '🚗',
  home: '🏠',
  umbrella: '☂️',
  commercial: '🏢',
  life: '💼',
};

function productIcon(lead) {
  const line = lead.productLine?.toLowerCase();
  if (line && PRODUCT_ICONS[line]) return PRODUCT_ICONS[line];
  if (lead.id === 'lead_1') return PRODUCT_ICONS.auto;
  if (lead.id === 'lead_2') return PRODUCT_ICONS.home;
  if (lead.id === 'lead_3') return PRODUCT_ICONS.umbrella;
  return '📋';
}

const LeadList = ({ leads }) => {
  const leadArray = Object.values(leads || {}).sort((a, b) => b.xp - a.xp);

  if (leadArray.length === 0) {
    return (
      <div className="panel lead-panel empty-state">
        <div className="empty-icon" aria-hidden="true">📋</div>
        <h2>Pipeline Empty</h2>
        <p>Head to <strong>Action Lab</strong> and log your first call, quote, or close.</p>
      </div>
    );
  }

  return (
    <div className="panel lead-panel">
      <h2 className="panel-title panel-title--red">Active Pipeline</h2>
      <p className="panel-subtitle">{leadArray.length} prospect{leadArray.length !== 1 ? 's' : ''} in progress</p>
      <div className="lead-list-container">
        {leadArray.map((lead) => {
          const nextXp = getXpForNextLevel(lead.level);
          const progress = Math.min(100, Math.floor((lead.xp / nextXp) * 100));
          return (
            <div key={lead.id} className="lead-item">
              <div className="lead-avatar lead-avatar--icon" aria-hidden="true">
                {productIcon(lead)}
              </div>
              <div className="lead-info">
                <h3>{lead.name}</h3>
                <div className="lead-stats">
                  <span className="level-badge">LVL {lead.level}</span>
                  <span className="lead-xp">EXP: {lead.xp}</span>
                </div>
                <div className="lead-progress">
                  <div className="lead-progress-bar" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="lead-meta">
                <div className="lead-number">{lead.id.replace('_', '-').toUpperCase()}</div>
                <div>{lead.events.length} action{lead.events.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeadList;
