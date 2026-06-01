const XP_THRESHOLDS = [100, 500, 1000, 5000, 10000];

function getXpForNextLevel(level) {
  if (level <= 0 || level > XP_THRESHOLDS.length) return 10000;
  return XP_THRESHOLDS[level - 1];
}

function avatarSrc(character, skin) {
  return `/avatars/${character}_${skin}.png`;
}

const Character = ({ player, onCustomize }) => {
  if (!player) return null;

  const xpForNextLevel = getXpForNextLevel(player.level);
  const progressPercent = Math.min(100, Math.floor((player.totalXP / xpForNextLevel) * 100));

  const availableSkins = [
    { id: 'boy_default', character: 'boy', skin: 'default', label: 'Trainer Boy', unlocked: true },
    { id: 'girl_default', character: 'girl', skin: 'default', label: 'Trainer Girl', unlocked: player.rewards.includes('girl') },
    { id: 'boy_champion', character: 'boy', skin: 'champion', label: 'Champion Boy', unlocked: player.rewards.includes('boy_champion') },
    { id: 'girl_champion', character: 'girl', skin: 'champion', label: 'Champion Girl', unlocked: player.rewards.includes('girl_champion') },
  ];

  return (
    <div className="panel hero-panel">
      <h2 className="panel-title panel-title--blue">Agent Card</h2>

      <div className="agent-header">
        <img
          className="pixel-icon"
          src={avatarSrc(player.character, player.skin)}
          alt={`${player.character} ${player.skin} avatar`}
        />
        <div>
          <h3 className="agent-name">{player.name}</h3>
          <p className="agent-level">LVL {player.level}</p>
        </div>
      </div>

      <div className="xp-section">
        <div className="xp-labels">
          <span>EXP: <strong>{player.totalXP}</strong></span>
          <span>Next LVL: <strong>{xpForNextLevel}</strong></span>
        </div>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
          <div className="progress-text">{progressPercent}%</div>
        </div>
      </div>

      <div className="customize-section">
        <h4 className="section-label">Change Appearance</h4>
        <div className="customization-grid">
          {availableSkins.map((skin) => {
            const isSelected = player.character === skin.character && player.skin === skin.skin;
            return (
              <label
                key={skin.id}
                className={`custom-radio-label ${!skin.unlocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="characterSkin"
                  className="custom-radio"
                  checked={isSelected}
                  disabled={!skin.unlocked}
                  onChange={() => {
                    if (skin.unlocked) onCustomize(skin.character, skin.skin);
                  }}
                />
                <img src={avatarSrc(skin.character, skin.skin)} alt={skin.label} />
                <span>{skin.label}</span>
                {!skin.unlocked && <span className="locked-tag">Locked</span>}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Character;
