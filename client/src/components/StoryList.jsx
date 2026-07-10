import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteStory } from '../utils/api';

const GENRE_META = {
  fantasy: { icon: '⚔️', color: '#c084fc' },
  'sci-fi': { icon: '🚀', color: '#22d3ee' },
  mystery: { icon: '🔍', color: '#fbbf24' },
  horror: { icon: '👁️', color: '#f87171' },
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function StoryList({ stories, onRefresh }) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, storyId) => {
    e.stopPropagation();
    if (deletingId) return;

    setDeletingId(storyId);
    try {
      await deleteStory(storyId);
      onRefresh?.();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!stories || stories.length === 0) {
    return (
      <div
        className="animate-fade-in"
        style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.4 }}>📖</div>
        <p style={{ fontSize: '1.1rem', marginBottom: 8 }}>No stories yet</p>
        <p style={{ fontSize: '0.88rem' }}>Choose a genre to begin your first adventure</p>
        <button
          className="btn-primary"
          onClick={() => navigate('/')}
          style={{ marginTop: 24 }}
        >
          Start a Story
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {stories.map((story, index) => {
        const meta = GENRE_META[story.genre] || { icon: '📖', color: 'var(--accent)' };
        return (
          <button
            key={story.id}
            id={`story-item-${story.id}`}
            className={`glass-card animate-fade-in-up delay-${Math.min(index + 1, 5)}`}
            onClick={() => navigate(`/play/${story.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '20px 24px',
              textAlign: 'left',
              cursor: 'pointer',
              width: '100%',
              position: 'relative',
            }}
          >
            {/* Genre icon */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                background: `${meta.color}15`,
                border: `1px solid ${meta.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                flexShrink: 0,
              }}
            >
              {meta.icon}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {story.title || 'Untitled Story'}
              </h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span
                  style={{
                    color: meta.color,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {story.genre}
                </span>
                <span>•</span>
                <span>{story.turnCount || 0} turns</span>
                <span>•</span>
                <span>{timeAgo(story.updatedAt)}</span>
              </div>
            </div>

            {/* Delete button */}
            <button
              className="btn-ghost"
              onClick={(e) => handleDelete(e, story.id)}
              disabled={deletingId === story.id}
              style={{
                padding: 8,
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
              title="Delete story"
            >
              {deletingId === story.id ? (
                <span className="shimmer" style={{ width: 18, height: 18, display: 'block', borderRadius: '50%' }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              )}
            </button>
          </button>
        );
      })}
    </div>
  );
}
