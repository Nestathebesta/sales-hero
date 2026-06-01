import { useEffect, useRef, useState } from 'react';
import { Briefcase, Zap } from 'lucide-react';
import Character from './components/Character';
import LeadList from './components/LeadList';
import Inventory from './components/Inventory';
import ActivityFeed from './components/ActivityFeed';
import Badges from './components/Badges';
import LevelUpToast from './components/LevelUpToast';
import { fetchState, customizePlayer } from './api';

function App() {
  const [gameState, setGameState] = useState(null);
  const [activeTab, setActiveTab] = useState('leads');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [levelUpNotice, setLevelUpNotice] = useState(null);
  const prevLevelRef = useRef(null);

  const loadState = async () => {
    try {
      const state = await fetchState();
      const nextLevel = state.player?.level;
      if (
        prevLevelRef.current !== null &&
        nextLevel != null &&
        nextLevel > prevLevelRef.current
      ) {
        setLevelUpNotice({
          level: nextLevel,
          title: state.player.title ?? 'Squire',
        });
      }
      if (nextLevel != null) prevLevelRef.current = nextLevel;

      setGameState(state);
      setError(null);
    } catch (err) {
      console.error('Failed to load game state:', err);
      setError('Cannot reach GameMaster server. Start the backend on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch game state on mount
    void loadState();
    const interval = setInterval(loadState, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCustomize = async (character, skin) => {
    try {
      await customizePlayer(character, skin);
      loadState();
    } catch (err) {
      console.error('Failed to customize player:', err);
    }
  };

  const player = gameState?.player;
  const leadCount = gameState ? Object.keys(gameState.leads).length : 0;

  return (
    <div className="app-container">
      {levelUpNotice && (
        <LevelUpToast
          level={levelUpNotice.level}
          title={levelUpNotice.title}
          onDismiss={() => setLevelUpNotice(null)}
        />
      )}

      <header className="header">
        <div className="header-badge">The Sales Crusade · P&amp;C</div>
        <h1>SalesDex</h1>
        <p className="header-tagline">Forge your legacy.</p>
      </header>

      {player && (
        <div className="hud-bar">
          <div className="hud-stat">
            <span className="hud-label">Crusader</span>
            <span className="hud-value">{player.name}</span>
          </div>
          <div className="hud-stat">
            <span className="hud-label">Rank</span>
            <span className="hud-value hud-highlight">{player.title ?? 'Squire'}</span>
          </div>
          <div className="hud-stat">
            <span className="hud-label">Level</span>
            <span className="hud-value">{player.level}</span>
          </div>
          <div className="hud-stat">
            <span className="hud-label">Total EXP</span>
            <span className="hud-value">{player.totalXP}</span>
          </div>
          <div className="hud-stat">
            <span className="hud-label">Pipeline</span>
            <span className="hud-value">{leadCount}</span>
          </div>
          <div className="hud-stat">
            <span className="hud-label">Medals</span>
            <span className="hud-value">{player.badges?.length ?? 0}/3</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-panel">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Preparing the crusade...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-panel" role="alert">
          <p>{error}</p>
          <button type="button" className="game-btn game-btn--gold" onClick={loadState}>
            Retry Connection
          </button>
        </div>
      )}

      {gameState && (
        <div className="activity-feed-row">
          <ActivityFeed events={gameState.globalEvents} />
        </div>
      )}

      <aside className="sidebar">
        {gameState && (
          <>
            <Character player={gameState.player} onCustomize={handleCustomize} />
            <Badges stats={gameState.player.stats} badges={gameState.player.badges} />
          </>
        )}
      </aside>

      <main className="main-content">
        <nav className="feature-tabs" aria-label="Main sections">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            <Briefcase size={14} aria-hidden="true" />
            Pipeline
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'bag' ? 'active' : ''}`}
            onClick={() => setActiveTab('bag')}
          >
            <Zap size={14} aria-hidden="true" />
            Action Lab
          </button>
        </nav>

        {gameState && activeTab === 'leads' && (
          <LeadList leads={gameState.leads} />
        )}

        {gameState && activeTab === 'bag' && (
          <Inventory leads={gameState.leads} onTrigger={loadState} />
        )}
      </main>
    </div>
  );
}

export default App;
