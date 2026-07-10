import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStory } from '../utils/api';

const GENRES = [
  {
    id: 'fantasy',
    name: 'Fantasy',
    description: 'Epic quests, magic, and mythical creatures in a vast medieval world.',
    icon: '⚔️',
    color: '#c084fc',
    gradient: 'linear-gradient(135deg, #7c3aed, #c084fc)',
  },
  {
    id: 'sci-fi',
    name: 'Sci-Fi',
    description: 'Space exploration, futuristic tech, and cosmic mysteries among the stars.',
    icon: '🚀',
    color: '#22d3ee',
    gradient: 'linear-gradient(135deg, #0891b2, #22d3ee)',
  },
  {
    id: 'mystery',
    name: 'Mystery',
    description: 'Dark secrets, hidden clues, and intricate puzzles waiting to be solved.',
    icon: '🔍',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #d97706, #fbbf24)',
  },
  {
    id: 'horror',
    name: 'Horror',
    description: 'Dread-filled survival against things that lurk in the shadows.',
    icon: '👁️',
    color: '#f87171',
    gradient: 'linear-gradient(135deg, #dc2626, #f87171)',
  },
];

export default function GenreSelector() {
  const navigate = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleStart = async () => {
    if (!selectedGenre || isCreating) return;
    setIsCreating(true);
    setError(null);

    try {
      const story = await createStory(selectedGenre);
      navigate(`/play/${story.id}`);
    } catch (err) {
      setError(err.message);
      setIsCreating(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Genre Grid */}
      <div
        id="genre-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
          marginBottom: 36,
        }}
      >
        {GENRES.map((genre, index) => (
          <button
            key={genre.id}
            id={`genre-card-${genre.id}`}
            onClick={() => setSelectedGenre(genre.id)}
            className={`animate-fade-in-up delay-${index + 1}`}
            style={{
              position: 'relative',
              padding: 28,
              background:
                selectedGenre === genre.id
                  ? `linear-gradient(135deg, ${genre.color}18, ${genre.color}08)`
                  : 'var(--bg-card)',
              backdropFilter: 'blur(16px)',
              border:
                selectedGenre === genre.id
                  ? `2px solid ${genre.color}60`
                  : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: selectedGenre === genre.id ? 'translateY(-4px)' : 'none',
              boxShadow:
                selectedGenre === genre.id
                  ? `0 8px 32px ${genre.color}20, 0 0 0 1px ${genre.color}30`
                  : 'var(--shadow-md)',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              if (selectedGenre !== genre.id) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = `${genre.color}30`;
                e.currentTarget.style.boxShadow = `0 8px 24px ${genre.color}15`;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedGenre !== genre.id) {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }
            }}
          >
            {/* Accent glow */}
            <div
              style={{
                position: 'absolute',
                top: -60,
                right: -60,
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: genre.color,
                opacity: selectedGenre === genre.id ? 0.08 : 0.03,
                filter: 'blur(40px)',
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
              }}
            />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>{genre.icon}</div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: selectedGenre === genre.id ? genre.color : 'var(--text-primary)',
                  marginBottom: 8,
                  transition: 'color 0.3s ease',
                }}
              >
                {genre.name}
              </h3>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                {genre.description}
              </p>

              {/* Selected indicator */}
              {selectedGenre === genre.id && (
                <div
                  className="animate-fade-in"
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: genre.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: genre.color,
                    boxShadow: `0 0 8px ${genre.color}`,
                  }} />
                  Selected
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.88rem',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* Start Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          id="start-story-btn"
          className="btn-primary"
          disabled={!selectedGenre || isCreating}
          onClick={handleStart}
          style={{
            padding: '16px 48px',
            fontSize: '1.05rem',
            ...(selectedGenre
              ? {
                  background: GENRES.find((g) => g.id === selectedGenre)?.gradient,
                }
              : {}),
          }}
        >
          {isCreating ? (
            <>
              <span className="shimmer" style={{ width: 18, height: 18, borderRadius: '50%' }} />
              Creating...
            </>
          ) : (
            <>Begin Your Adventure</>
          )}
        </button>
      </div>
    </div>
  );
}
