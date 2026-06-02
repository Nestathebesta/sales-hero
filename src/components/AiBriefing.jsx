import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { fetchBriefing } from '../api';

/**
 * War Council — on-demand AI coaching. Nothing fetches until the crusader
 * clicks "Summon counsel", so it never slows the initial page load. Falls back
 * to server-provided rule-based advice if no AI key is configured.
 */
const AiBriefing = () => {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [advice, setAdvice] = useState('');
  const [source, setSource] = useState('');

  const summon = async () => {
    setStatus('loading');
    try {
      const result = await fetchBriefing();
      setAdvice(result.advice);
      setSource(result.source);
      setStatus('done');
    } catch {
      setAdvice('The council is unreachable — start the GameMaster API on port 3001.');
      setSource('error');
      setStatus('error');
    }
  };

  const resolved = status === 'done' || status === 'error';

  return (
    <div className="ai-council">
      <div className="ai-council-head">
        <span className="ai-council-title">
          <Sparkles size={15} aria-hidden="true" /> War Council
        </span>
        {resolved && (
          <button type="button" className="ai-council-refresh" onClick={summon}>
            <RefreshCw size={13} aria-hidden="true" /> Again
          </button>
        )}
      </div>

      {status === 'idle' && (
        <button type="button" className="game-btn game-btn--blue ai-council-summon" onClick={summon}>
          Summon counsel
        </button>
      )}

      {status === 'loading' && <p className="ai-council-loading">The council deliberates…</p>}

      {resolved && (
        <>
          <p className="ai-council-advice">{advice}</p>
          {source === 'fallback' && (
            <p className="ai-council-note">
              Offline counsel · add <code>AI_GATEWAY_API_KEY</code> to <code>server/.env</code> for live AI.
            </p>
          )}
          {source === 'ai' && <p className="ai-council-note ai-council-note--live">⚔ Live counsel from the AI gateway.</p>}
        </>
      )}
    </div>
  );
};

export default AiBriefing;
