import { useEffect, useRef, useState } from 'react';
import { Briefcase, Zap, ScrollText, BarChart3, ListTodo } from 'lucide-react';
import Character from './components/Character';
import DailyGoals from './components/DailyGoals';
import LeadList from './components/LeadList';
import Inventory from './components/Inventory';
import QuestLog from './components/QuestLog';
import TaskQuests from './components/TaskQuests';
import StatsDashboard from './components/StatsDashboard';
import ActivityFeed from './components/ActivityFeed';
import Badges from './components/Badges';
import LevelUpToast from './components/LevelUpToast';
import { fetchState, customizePlayer } from './api';
import { MEDALS } from '../shared/xp.js';
import { salesState } from './state/stateManager';

const TABS = [
  { id: 'leads', label: 'Pipeline', Icon: Briefcase },
  { id: 'bag', label: 'Action Lab', Icon: Zap },
  { id: 'quests', label: 'Quests', Icon: ListTodo },
  { id: 'chronicle', label: 'Chronicle', Icon: ScrollText },
  { id: 'war', label: 'War Room', Icon: BarChart3 },
];

function App() {
  const [gameState, setGameState] = useState(null);
  const [activeTab, setActiveTab] = useState('leads');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [levelUpNotice, setLevelUpNotice] = useState(null);
  const prevLevelRef = useRef(null);
  const prevTitleRef = useRef(null);
  const prevPoliciesRef = useRef(null);
  const lastSigRef = useRef(null);

  const loadState = async () => {
    try {
      const state = await fetchState();

      // Skip the whole re-render when nothing changed since the last poll —
      // this is the common case and keeps the dashboard idle-cheap.
      const signature = JSON.stringify(state);
      if (signature === lastSigRef.current) return;
      lastSigRef.current = signature;

      const nextLevel = state.player?.level;
      const nextTitle = state.player?.title ?? 'Peon';
      if (
        prevLevelRef.current !== null &&
        nextLevel != null &&
        nextLevel > prevLevelRef.current
      ) {
        setLevelUpNotice({
          level: nextLevel,
          title: nextTitle,
          isRankUp: prevTitleRef.current !== null && nextTitle !== prevTitleRef.current,
        });
        salesState.celebrate(); // crusader swings a victory strike
      }
      if (nextLevel != null) prevLevelRef.current = nextLevel;
      prevTitleRef.current = nextTitle;

      const policies = state.player?.stats?.policies ?? 0;
      if (
        prevPoliciesRef.current !== null &&
        policies > prevPoliciesRef.current
      ) {
        salesState.triggerClosedDeal();
      }
      prevPoliciesRef.current = policies;

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
    let interval = null;
    const start = () => {
      if (interval) return;
      void loadState();
      interval = setInterval(loadState, 5000);
    };
    const stop = () => {
      if (interval) clearInterval(interval);
      interval = null;
    };
    // Pause polling while the tab is hidden; refresh immediately on return.
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
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
          isRankUp={levelUpNotice.isRankUp}
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
            <span className="hud-value hud-highlight">{player.title ?? 'Peon'}</span>
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
            <span className="hud-value">{player.badges?.length ?? 0}/{MEDALS.length}</span>
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
            <DailyGoals leads={gameState.leads} />
            <Badges stats={gameState.player.stats} badges={gameState.player.badges} />
          </>
        )}
      </aside>

      <main className="main-content">
        <nav className="feature-tabs" aria-label="Main sections">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`tab-btn ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        {gameState && activeTab === 'leads' && (
          <LeadList leads={gameState.leads} />
        )}

        {gameState && activeTab === 'bag' && (
          <Inventory leads={gameState.leads} onTrigger={loadState} />
        )}

        {gameState && activeTab === 'quests' && (
          <TaskQuests tasks={gameState.tasks} />
        )}

        {gameState && activeTab === 'chronicle' && (
          <QuestLog leads={gameState.leads} />
        )}

        {gameState && activeTab === 'war' && (
          <StatsDashboard player={gameState.player} leads={gameState.leads} />
        )}
      </main>
    </div>
  );
}

export default App;
