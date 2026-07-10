import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useStory from '../hooks/useStory';
import StoryDisplay from '../components/StoryDisplay';
import PlayerInput from '../components/PlayerInput';
import ActionSuggestions from '../components/ActionSuggestions';
import CharacterPanel from '../components/CharacterPanel';

export default function GamePage() {
  const { id } = useParams();
  const {
    story,
    character,
    turns,
    suggestedActions,
    streamingText,
    isLoading,
    isStreaming,
    error,
    loadStory,
    submitPlayerTurn,
    clearError,
  } = useStory(id);

  // Load story on mount
  useEffect(() => {
    loadStory();
  }, [loadStory]);

  // Set genre theme on body
  useEffect(() => {
    if (story?.genre) {
      document.documentElement.setAttribute('data-genre', story.genre);
    }
    return () => {
      document.documentElement.removeAttribute('data-genre');
    };
  }, [story?.genre]);

  // Auto-start first turn for new stories
  useEffect(() => {
    if (story && turns.length === 0 && !isLoading && !isStreaming) {
      submitPlayerTurn('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, turns.length, isLoading]);

  const handleSubmit = (text) => {
    submitPlayerTurn(text);
  };

  const handleActionSelect = (action) => {
    submitPlayerTurn(action);
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'float 1.2s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Loading your story...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!story) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.4 }}>❌</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Story not found</p>
          <Link to="/" className="btn-primary">
            Start a New Story
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Ambient orbs */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />

      {/* Main content area */}
      <div
        className="container"
        style={{
          flex: 1,
          display: 'flex',
          gap: 28,
          position: 'relative',
          zIndex: 1,
          height: 'calc(100vh - 64px)',
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        {/* Narrative column */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {/* Story title bar */}
          <div
            className="animate-fade-in"
            style={{
              padding: '12px 0',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <Link to="/stories" className="btn-ghost" style={{ padding: '6px 10px', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </Link>
              <h2
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {story.title || 'New Story'}
              </h2>
            </div>
            <span className="badge" style={{ flexShrink: 0 }}>{story.genre}</span>
          </div>

          {/* Story display (scrollable) */}
          <StoryDisplay
            turns={turns}
            streamingText={streamingText}
            isStreaming={isStreaming}
          />

          {/* Error message */}
          {error && (
            <div
              className="animate-fade-in"
              style={{
                padding: '12px 16px',
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#fca5a5',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <span>{error}</span>
              <button className="btn-ghost" onClick={clearError} style={{ color: '#fca5a5' }}>
                Dismiss
              </button>
            </div>
          )}

          {/* Suggested actions */}
          <ActionSuggestions
            actions={suggestedActions}
            onSelect={handleActionSelect}
            disabled={isStreaming}
          />

          {/* Player input */}
          <PlayerInput
            onSubmit={handleSubmit}
            disabled={isStreaming}
          />
        </div>

        {/* Character panel (desktop only) */}
        <div style={{ display: 'flex', flexShrink: 0 }}>
          <CharacterPanel
            character={character}
            genre={story.genre}
            turnCount={turns.length}
          />
        </div>
      </div>
    </div>
  );
}
