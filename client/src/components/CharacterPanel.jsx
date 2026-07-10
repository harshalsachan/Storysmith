/**
 * CharacterPanel — displays character stats, inventory, and story info.
 */

const STAT_COLORS = {
  health: 'health',
  mana: 'mana',
  energy: 'energy',
  sanity: 'sanity',
  stamina: 'stamina',
};

function getStatColor(statName) {
  const key = statName.toLowerCase();
  return STAT_COLORS[key] || 'default';
}

function getStatMax(statName) {
  const key = statName.toLowerCase();
  const maxMap = {
    health: 100,
    mana: 100,
    energy: 100,
    sanity: 100,
    stamina: 100,
    reputation: 100,
    suspicion: 100,
  };
  return maxMap[key] || 100;
}

function formatStatName(name) {
  // camelCase → Title Case
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export default function CharacterPanel({ character, genre, turnCount }) {
  if (!character) return null;

  const stats = character.stats || {};
  const inventory = character.inventory || [];
  const flags = character.flags || {};

  // Determine which stats get bars (numeric) vs plain display
  const statEntries = Object.entries(stats);
  const barStats = statEntries.filter(
    ([, val]) => typeof val === 'number' && val <= 1000
  );
  const textStats = statEntries.filter(
    ([, val]) => typeof val !== 'number' || val > 1000
  );

  return (
    <aside
      id="character-panel"
      className="glass-card-static"
      style={{
        width: 280,
        flexShrink: 0,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        height: 'fit-content',
        position: 'sticky',
        top: 88,
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Character
          </h3>
          <span className="badge">{genre}</span>
        </div>
        {character.name && (
          <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 6 }}>
            {character.name}
          </p>
        )}
      </div>

      {/* Stats */}
      {barStats.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}
          >
            Stats
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {barStats.map(([key, value]) => {
              const maxVal = getStatMax(key);
              const pct = Math.min(100, Math.max(0, (value / maxVal) * 100));
              const colorClass = getStatColor(key);

              return (
                <div key={key}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {formatStatName(key)}
                    </span>
                    <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {value}
                    </span>
                  </div>
                  <div className="stat-bar-track">
                    <div
                      className={`stat-bar-fill ${colorClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Text stats (e.g., credits) */}
      {textStats.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {textStats.map(([key, value]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{formatStatName(key)}</span>
              <span className="font-mono" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Inventory */}
      {inventory.length > 0 && (
        <div>
          <h4
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            Inventory ({inventory.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {inventory.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ opacity: 0.5 }}>•</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Story info */}
      <div
        style={{
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Turns</span>
          <span className="font-mono">{turnCount || 0}</span>
        </div>
      </div>
    </aside>
  );
}
