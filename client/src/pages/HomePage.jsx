import GenreSelector from '../components/GenreSelector';

export default function HomePage() {
  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* Ambient orbs */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />

      <main className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Hero section */}
        <div
          style={{
            textAlign: 'center',
            paddingTop: 80,
            paddingBottom: 48,
          }}
        >
          <div
            className="animate-fade-in-up"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              background: 'var(--accent-dim)',
              border: '1px solid var(--border-accent)',
              borderRadius: 999,
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--accent)',
              marginBottom: 24,
              letterSpacing: '0.02em',
            }}
          >
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 6px var(--accent)',
            }} />
            AI-Powered Interactive Fiction
          </div>

          <h1
            className="animate-fade-in-up delay-1"
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: 20,
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-secondary) 50%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your Story.<br />Your Rules.
          </h1>

          <p
            className="animate-fade-in-up delay-2"
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: 'var(--text-secondary)',
              maxWidth: 560,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            An AI game master crafts a unique narrative that responds to your
            every decision. No two adventures are ever the same.
          </p>
        </div>

        {/* Genre selection */}
        <div
          className="animate-fade-in-up delay-3"
          style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 80 }}
        >
          <h2
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              textAlign: 'center',
              marginBottom: 28,
            }}
          >
            Choose Your Genre
          </h2>
          <GenreSelector />
        </div>
      </main>
    </div>
  );
}
