import {
  CAREER_RANKS,
  getCareerRank,
  xpProgressInLevel,
} from '../../shared/xp.js';
import RankAvatar from './RankAvatar';

// Ranks whose emblem image isn't in /public yet fall back to this.
const RANK_ART_FALLBACK = '/avatars/rank-crusader.png';

const Character = ({ player }) => {
  if (!player) return null;

  const { current, needed, percent } = xpProgressInLevel(player.totalXP, player.level);
  const currentRank = getCareerRank(player.level);

  return (
    <div className="panel hero-panel crusader-card">
      <h2 className="panel-title panel-title--gold">Crusader Card</h2>

      <div className="agent-header">
        <div className="avatar-frame avatar-frame--sprite">
          <RankAvatar art={currentRank.art} label={currentRank.title} size={132} />
        </div>
        <div>
          <h3 className="agent-name">{player.name}</h3>
          <p className="agent-rank">{player.title ?? 'Peon'}</p>
          <p className="agent-level">Level {player.level}</p>
        </div>
      </div>

      <div className="xp-section">
        <div className="xp-labels">
          <span>EXP <strong>{player.totalXP}</strong></span>
          <span><strong>{current}</strong> / {needed} to next</span>
        </div>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${percent}%` }} />
          <div className="progress-text">{percent}%</div>
        </div>
      </div>

      <div className="customize-section">
        <h4 className="section-label">Career Ranks</h4>
        <div className="customization-grid">
          {CAREER_RANKS.map((rank) => {
            const unlocked = player.level >= rank.minLevel;
            const isCurrent = rank.title === currentRank.title;

            return (
              <div
                key={rank.title}
                className={`custom-radio-label ${!unlocked ? 'locked' : ''} ${isCurrent ? 'selected' : ''}`}
                title={`${rank.title} — Level ${rank.minLevel}`}
              >
                <img
                  src={rank.art}
                  alt={rank.title}
                  onError={(e) => {
                    if (e.currentTarget.src.indexOf(RANK_ART_FALLBACK) === -1) {
                      e.currentTarget.src = RANK_ART_FALLBACK;
                    }
                  }}
                />
                <span>{rank.title}</span>
                {!unlocked && <span className="locked-tag">Lv {rank.minLevel}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Character;
