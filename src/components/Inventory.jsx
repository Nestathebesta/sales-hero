import { useState } from 'react';
import { Phone, FileText, Trophy } from 'lucide-react';
import { triggerWebhook } from '../api';
import { salesState } from '../state/stateManager';

const ACTIONS = [
  {
    eventType: 'insurance/call',
    label: 'Dialed Lead',
    source: 'RingCentral',
    xp: 30,
    icon: Phone,
    variant: 'blue',
  },
  {
    eventType: 'insurance/quote',
    label: 'Sent Quote',
    source: 'AgencyZoom',
    xp: 30,
    icon: FileText,
    variant: 'green',
  },
  {
    eventType: 'insurance/closed_policy',
    label: 'Closed Policy',
    source: 'AgencyZoom',
    xp: 100,
    icon: Trophy,
    variant: 'red',
  },
];

const Inventory = ({ leads, onTrigger }) => {
  const [selectedLead, setSelectedLead] = useState('');
  const [busy, setBusy] = useState(false);

  const handleAction = async (eventType) => {
    if (!selectedLead) return;

    setBusy(true);
    try {
      await triggerWebhook(selectedLead, eventType, { firstName: 'Jane', lastName: 'Doe' });
      salesState.recordEvent(eventType);
      if (eventType === 'insurance/closed_policy') {
        salesState.triggerClosedDeal();
      }
      onTrigger();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const leadOptions = Object.values(leads || {});

  return (
    <div className="panel lead-panel">
      <h2 className="panel-title panel-title--red">Action Lab</h2>
      <p className="panel-subtitle">
        Simulate Zapier webhooks and watch your EXP climb. Pick a prospect, then choose an action.
      </p>

      <div className="form-group">
        <label htmlFor="prospect-select">Target Prospect</label>
        <select
          id="prospect-select"
          value={selectedLead}
          onChange={(e) => setSelectedLead(e.target.value)}
          className="game-select"
        >
          <option value="">— Choose a prospect —</option>
          <option value="lead_1">John S. (Auto Quote)</option>
          <option value="lead_2">Sarah M. (Homeowners)</option>
          <option value="lead_3">David L. (Umbrella)</option>
          {leadOptions.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} (LVL {l.level})
            </option>
          ))}
        </select>
      </div>

      {!selectedLead && (
        <p className="hint-text">Select a prospect above to unlock action buttons.</p>
      )}

      <div className="action-grid">
        {ACTIONS.map(({ eventType, label, source, xp, icon: Icon, variant }) => (
          <button
            key={eventType}
            type="button"
            className={`action-btn action-btn--${variant}`}
            disabled={!selectedLead || busy}
            onClick={() => handleAction(eventType)}
          >
            <Icon size={20} aria-hidden="true" />
            <span className="action-btn-label">{label}</span>
            <span className="action-btn-meta">{source} · +{xp} EXP</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
