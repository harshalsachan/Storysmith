import { useEffect, useRef } from 'react';

/**
 * StoryDisplay — renders the narrative history with typewriter streaming
 * for the latest response.
 */
export default function StoryDisplay({ turns, streamingText, isStreaming }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new content appears
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, streamingText]);

  return (
    <div
      id="story-display"
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 0',
      }}
    >
      {/* Empty state */}
      {turns.length === 0 && !isStreaming && (
        <div
          className="animate-fade-in"
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}>✨</div>
          <p style={{ fontSize: '1.1rem', fontStyle: 'italic' }}>
            Your story is about to begin...
          </p>
        </div>
      )}

      {/* Rendered turns */}
      {turns.map((turn, index) => (
        <div
          key={turn.id || index}
          className="animate-fade-in-up"
          style={{ marginBottom: 32 }}
        >
          {/* Player action */}
          {turn.playerInput && turn.playerInput !== '[story begins]' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 18px',
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '16px 16px 4px 16px',
                  color: 'var(--accent-secondary)',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                }}
              >
                {turn.playerInput}
              </div>
            </div>
          )}

          {/* AI narrative */}
          <div
            className="font-narrative"
            style={{
              fontSize: '1.12rem',
              lineHeight: 1.8,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {turn.aiNarrative}
          </div>

          {/* Divider between turns */}
          {index < turns.length - 1 && (
            <div
              style={{
                margin: '28px auto',
                width: 60,
                height: 1,
                background: 'var(--border-subtle)',
              }}
            />
          )}
        </div>
      ))}

      {/* Streaming text (current response being generated) */}
      {isStreaming && streamingText && (
        <div className="animate-fade-in" style={{ marginBottom: 32 }}>
          <div
            className="font-narrative typewriter-cursor"
            style={{
              fontSize: '1.12rem',
              lineHeight: 1.8,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {streamingText}
          </div>
        </div>
      )}

      {/* Loading indicator when waiting for first chunk */}
      {isStreaming && !streamingText && (
        <div className="animate-fade-in" style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    opacity: 0.6,
                    animation: `float 1.2s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontStyle: 'italic' }}>
              The story unfolds...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
