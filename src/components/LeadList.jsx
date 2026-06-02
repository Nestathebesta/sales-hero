import { useMemo, useState } from 'react';
import { Car, Home, Umbrella, Building2, Heart, ScrollText, Lightbulb } from 'lucide-react';
import { xpProgressInLevel } from '../../shared/xp.js';
import { STAGES, STAGE_META, groupByStage } from '../lib/insights.js';
import { fetchNextAction } from '../api';

const PRODUCT_META = {
  auto: { Icon: Car, tone: 'blue' },
  home: { Icon: Home, tone: 'gold' },
  umbrella: { Icon: Umbrella, tone: 'steel' },
  commercial: { Icon: Building2, tone: 'crimson' },
  life: { Icon: Heart, tone: 'crimson' },
};

const ID_FALLBACK = { lead_1: 'auto', lead_2: 'home', lead_3: 'umbrella' };

function productMeta(lead) {
  const line = lead.productLine?.toLowerCase();
  if (line && PRODUCT_META[line]) return PRODUCT_META[line];
  const byId = ID_FALLBACK[lead.id];
  if (byId) return PRODUCT_META[byId];
  return { Icon: ScrollText, tone: 'steel' };
}

function LeadCard({ lead }) {
  const { percent } = xpProgressInLevel(lead.xp, lead.level);
  const { Icon, tone } = productMeta(lead);
  const [advice, setAdvice] = useState(null); // null | 'loading' | { text, source }

  const advise = async () => {
    setAdvice('loading');
    try {
      const r = await fetchNextAction(lead.id);
      setAdvice({ text: r.advice, source: r.source });
    } catch {
      setAdvice({ text: 'War Council unreachable — is the API running?', source: 'error' });
    }
  };

  return (
    <div className="lead-item">
      <div className={`lead-avatar lead-avatar--${tone}`} aria-hidden="true">
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="lead-info">
        <h3>{lead.name}</h3>
        <div className="lead-stats">
          <span className="level-badge">Lv {lead.level}</span>
          <span className="lead-xp">{lead.xp} EXP</span>
        </div>
        <div className="lead-progress">
          <div className="lead-progress-bar" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="lead-meta">
        <div className="lead-number">{lead.id.replace('_', '-').toUpperCase()}</div>
        <div>{lead.events.length} action{lead.events.length !== 1 ? 's' : ''}</div>
      </div>
      <div className="lead-advise-row">
        <button type="button" className="lead-advise" onClick={advise} disabled={advice === 'loading'}>
          <Lightbulb size={12} aria-hidden="true" />
          {advice === 'loading' ? 'Consulting…' : 'Next move'}
        </button>
        {advice && advice !== 'loading' && <p className="lead-advice">{advice.text}</p>}
      </div>
    </div>
  );
}

const LeadList = ({ leads }) => {
  const leadArray = Object.values(leads || {});
  const groups = useMemo(() => groupByStage(leads), [leads]);

  if (leadArray.length === 0) {
    return (
      <div className="panel pipeline-panel empty-state">
        <div className="empty-icon" aria-hidden="true">⚔</div>
        <h2>Pipeline Empty</h2>
        <p>Head to <strong>Action Lab</strong> and log your first call, quote, or close.</p>
      </div>
    );
  }

  const closed = groups.Closed.length;

  return (
    <div className="panel pipeline-panel">
      <h2 className="panel-title panel-title--blue">Active Pipeline</h2>
      <p className="panel-subtitle">
        {leadArray.length} prospect{leadArray.length !== 1 ? 's' : ''} in the crusade · {closed} won
      </p>

      <div className="stage-board">
        {STAGES.map((stage) => (
          <div key={stage} className={`stage-column stage-column--${STAGE_META[stage].tone}`}>
            <div className="stage-header">
              <span className="stage-name">{stage}</span>
              <span className="stage-count">{groups[stage].length}</span>
            </div>
            <div className="stage-body">
              {groups[stage].length === 0 ? (
                <p className="stage-empty">—</p>
              ) : (
                groups[stage]
                  .sort((a, b) => b.xp - a.xp)
                  .map((lead) => <LeadCard key={lead.id} lead={lead} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadList;
