import { useEffect, useState } from 'react';
import api from '../api/axios'

export default function DrawResults() {
  const [draws,   setDraws]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/draws')
      .then(r => setDraws(r.data.draws))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', paddingTop: '6rem', paddingBottom: '4rem' }}>
      <div className="container">

        <div style={{ textAlign: 'center', marginBottom: '4rem', animation: 'fadeUp 0.6s ease forwards' }}>
          <div className="label">Monthly draws</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginTop: '1rem' }}>
            Draw <span className="gold-text">results</span>
          </h1>
          <p style={{ color: 'var(--cream-dim)', marginTop: '1rem' }}>
            Published results for all completed monthly draws.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--cream-dim)' }}>Loading...</div>
        ) : draws.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--cream-dim)' }}>
            No draws published yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {draws.map((draw, i) => (
              <div key={draw._id} className="card" style={{
                animation: `fadeUp 0.5s ${i * 0.08}s ease forwards`,
                opacity:   0,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div className="label" style={{ marginBottom: '0.4rem' }}>{draw.month}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--cream-dim)' }}>
                        {draw.totalSubscribers} subscribers ·
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--cream-dim)' }}>
                        {draw.winners.length} winner{draw.winners.length !== 1 ? 's' : ''}
                      </span>
                      {draw.jackpotRolledOver && (
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 500,
                          color: 'var(--gold)', background: 'rgba(201,168,76,0.1)',
                          padding: '0.2rem 0.6rem', borderRadius: 20,
                          border: '1px solid rgba(201,168,76,0.2)',
                        }}>Jackpot rolled over</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--gold)' }}>
                    ₹{draw.prizePool?.total?.toLocaleString('en-IN')} pool
                  </div>
                </div>

                {/* Winning numbers */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Winning numbers
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {draw.winningNumbers.map(n => (
                      <div key={n} style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.03))',
                        border: '1px solid var(--gold-dim)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontWeight: 600,
                        color: 'var(--gold)', fontSize: '1rem',
                      }}>{n}</div>
                    ))}
                  </div>
                </div>

                {/* Prize breakdown */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Jackpot (5-match)',  value: draw.prizePool?.jackpot    },
                    { label: '4-match prize',       value: draw.prizePool?.fourMatch  },
                    { label: '3-match prize',       value: draw.prizePool?.threeMatch },
                  ].map(tier => (
                    <div key={tier.label} style={{
                      flex: 1, minWidth: 140,
                      padding: '0.75rem 1rem', background: '#111',
                      borderRadius: 'var(--radius-sm)', border: '1px solid #2A2A2A',
                    }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', marginBottom: '0.25rem' }}>{tier.label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '1.1rem' }}>
                        ₹{tier.value?.toLocaleString('en-IN') || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}