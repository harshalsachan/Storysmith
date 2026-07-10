/**
 * ActionSuggestions — renders suggested action pills.
 */
export default function ActionSuggestions({ actions, onSelect, disabled }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div
      id="action-suggestions"
      className="animate-fade-in-up"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        padding: '8px 0',
      }}
    >
      <span
        style={{
          width: '100%',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 2,
        }}
      >
        Suggested Actions
      </span>
      {actions.map((action, index) => (
        <button
          key={index}
          className={`action-pill animate-fade-in-up delay-${index + 1}`}
          onClick={() => onSelect(action)}
          disabled={disabled}
        >
          {action}
        </button>
      ))}
    </div>
  );
}
