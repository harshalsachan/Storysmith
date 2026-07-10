import { useState, useEffect, useCallback } from 'react';
import StoryList from '../components/StoryList';
import { fetchStories } from '../utils/api';

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchStories();
      setStories(data);
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <div className="ambient-orb ambient-orb-1" />

      <main className="container-narrow" style={{ position: 'relative', zIndex: 1, paddingTop: 48, paddingBottom: 80 }}>
        <div className="animate-fade-in-up" style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: 6,
            }}
          >
            My Stories
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Resume an adventure or start a new one
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="shimmer"
                style={{ height: 80, borderRadius: 'var(--radius-lg)' }}
              />
            ))}
          </div>
        ) : (
          <StoryList stories={stories} onRefresh={loadStories} />
        )}
      </main>
    </div>
  );
}
