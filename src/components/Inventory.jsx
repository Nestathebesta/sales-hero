import { useState } from 'react';
import { Phone, FileText, Trophy, Minus, Plus } from 'lucide-react';
import { triggerWebhook } from '../api';
import { salesState } from '../state/stateManager';

const ACTIONS = [
  { eventType: 'insurance/call', label: 'Dialed Lead', source: 'RingCentral', xp: 30, icon: Phone, variant: 'blue' },
  { eventType: 'insurance/quote', label: 'Sent Quote', source: 'AgencyZoom', xp: 30, icon: FileText, variant: 'gold' },
  { eventType: 'insurance/closed_policy', label: 'Closed Policy', source: 'AgencyZoom', xp: 100, icon: Trophy, variant: 'red' },
];

function slugClient(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'lead';
}

const Inventory = ({ leads, onTrigger }) => {
  const [selectedLead, setSelectedLead] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [prospectName, setProspectName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  const typed = prospectName.trim();
  const canLog = Boolean(typed || selectedLead);

  const handleAction = async (eventType) => {
    let leadId;
    let contactInfo;
    if (typed) {
      leadId = `manual_${slugClient(typed)}`;
      contactInfo = { displayName: typed };
    } else if (selectedLead) {
      leadId = selectedLead;
      contactInfo = selectedName ? { displayName: selectedName } : {};
    } else {
      return;
    }

    setBusy(true);
    try {
      await triggerWebhook(leadId, eventType, contactInfo, quantity);
      salesState.recordEvent(eventType);
      onTrigger();
      setProspectName('');
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const leadOptions = Object.values(leads || {});
  const clampQty = (v) => Math.max(1, Math.min(50, v));

  return (
    <div className="panel lead-panel">
      <h2 className="panel-title panel-title--red">Action Lab</h2>
      <p className="panel-subtitle">
        Log activity manually — pick or name a prospect, set a quantity, then choose an action. Each action earns EXP.
      </p>

      <div className="form-group">
        <label htmlFor="prospect-select">Existing prospect</label>
        <select
          id="prospect-select"
          value={selectedLead}
          onChange={(e) => {
            setSelectedLead(e.target.value);
            const opt = e.target.selectedOptions[0];
            setSelectedName(opt ? opt.dataset.name || '' : '');
          }}
          className="game-select"
          disabled={Boolean(typed)}
        >
          <option value="" data-name="">— Choose a prospect —</option>
          <option value="lead_1" data-name="John S.">John S. (Auto)</option>
          <option value="lead_2" data-name="Sarah M.">Sarah M. (Homeowners)</option>
          <option value="lead_3" data-name="David L.">David L. (Umbrella)</option>
          {leadOptions.map((l) => (
            <option key={l.id} value={l.id} data-name={l.name}>
              {l.name} (LVL {l.level})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="prospect-name">…or new prospect name</label>
        <input
          id="prospect-name"
          type="text"
          className="game-select"
          placeholder="e.g. Acme Roofing"
          value={prospectName}
          onChange={(e) => setProspectName(e.target.value)}
          maxLength={48}
        />
      </div>

      <div className="form-group qty-group">
        <label htmlFor="qty">Quantity</label>
        <div className="qty-stepper">
          <button type="button" className="qty-btn" onClick={() => setQuantity((q) => clampQty(q - 1))} aria-label="Decrease quantity">
            <Minus size={14} aria-hidden="true" />
          </button>
          <input
            id="qty"
            type="number"
            className="qty-input"
            min={1}
            max={50}
            value={quantity}
            onChange={(e) => setQuantity(clampQty(parseInt(e.target.value, 10) || 1))}
          />
          <button type="button" className="qty-btn" onClick={() => setQuantity((q) => clampQty(q + 1))} aria-label="Increase quantity">
            <Plus size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {!canLog && (
        <p className="hint-text">Choose an existing prospect or type a new name to enable logging.</p>
      )}

      <div className="action-grid">
        {ACTIONS.map(({ eventType, label, source, xp, icon: Icon, variant }) => (
          <button
            key={eventType}
            type="button"
            className={`action-btn action-btn--${variant}`}
            disabled={!canLog || busy}
            onClick={() => handleAction(eventType)}
          >
            <Icon size={20} aria-hidden="true" />
            <span className="action-btn-label">
              {label}{quantity > 1 ? ` ×${quantity}` : ''}
            </span>
            <span className="action-btn-meta">{source} · +{xp * quantity} EXP</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
