import {
  APPEARANCE_OPTIONS,
  unlockLevelForReward,
  xpProgressInLevel,
} from '../../shared/xp.js';
import CrusaderSprite from './CrusaderSprite';

const Character = ({ player, onCustomize }) => {
  if (!player) return null;

  const { current, needed, percent } = xpProgressInLevel(player.totalXP, player.level);

  return (
    <div className="panel hero-panel crusader-card">
      <h2 className="panel-title panel-title--gold">Crusader Card</h2>

      <div className="agent-header">
        <div className="avatar-frame avatar-frame--sprite">
          <CrusaderSprite className="agent-portrait-sprite" size={132} />
        </div>
        <div>
          <h3 className="agent-name">{player.name}</h3>
          <p className="agent-rank">{player.title ?? 'Squire'}</p>
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
        <h4 className="section-label">Rank Appearances</h4>
        <div className="customization-grid">
          {APPEARANCE_OPTIONS.map((skin) => {
            const unlocked = !skin.rewardKey || player.rewards.includes(skin.rewardKey);
            const isSelected = player.character === skin.character && player.skin === skin.skin;
            const unlockAt = skin.rewardKey ? unlockLevelForReward(skin.rewardKey) : null;

            return (
              <label
                key={skin.id}
                className={`custom-radio-label ${!unlocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="characterSkin"
                  className="custom-radio"
                  checked={isSelected}
                  disabled={!unlocked}
                  onChange={() => {
                    if (unlocked) onCustomize(skin.character, skin.skin);
                  }}
                />
                <img src={skin.art} alt={skin.label} />
                <span>{skin.label}</span>
                {!unlocked && unlockAt && (
                  <span className="locked-tag">Lv {unlockAt}</span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Character;
