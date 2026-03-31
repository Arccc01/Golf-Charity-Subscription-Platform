import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios'
import { useSmartRedirect } from '../hooks/useSmartRedirect';

function SmartCTA({ className, style, children }) {
  const navigate    = useNavigate();
  const destination = useSmartRedirect();

  return (
    <button
      onClick={() => navigate(destination)}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState(null);
  const heroRef   = useRef(null);

  useEffect(() => {
    api.get('/charities/featured')
      .then(r => setFeatured(r.data.charity))
      .catch(() => {});
  }, []);

  return (
    <div style={{ overflowX: 'hidden' }}>

      {/* ── HERO ─────────────────────────────────── */}
      <section style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        position:       'relative',
        padding:        '8rem 2rem 4rem',
        overflow:       'hidden',
      }}>
        {/* Background texture */}
        <div style={{
          position:   'absolute', inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 60% 40%, rgba(201,168,76,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(29,158,117,0.05) 0%, transparent 60%)
          `,
          zIndex: 0,
        }}/>

        {/* Grid pattern overlay */}
        <div style={{
          position:        'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(42,42,42,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(42,42,42,0.3) 1px, transparent 1px)`,
          backgroundSize:  '60px 60px',
          zIndex:          0,
        }}/>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 720 }}>

            <div className="label fade-up" style={{ animationDelay: '0s', opacity: 0 }}>
              Golf · Charity · Monthly draws
            </div>

            <h1 style={{
              fontSize:      'clamp(3rem, 7vw, 5.5rem)',
              marginTop:     '1.5rem',
              marginBottom:  '1.5rem',
              lineHeight:    1.05,
              animation:     'fadeUp 0.7s 0.1s ease forwards',
              opacity:       0,
            }}>
              Play golf.<br />
              <span className="gold-text">Give back.</span><br />
              Win big.
            </h1>

            <p style={{
              fontSize:   '1.15rem',
              color:      'var(--cream-dim)',
              maxWidth:   540,
              lineHeight: 1.8,
              animation:  'fadeUp 0.7s 0.2s ease forwards',
              opacity:    0,
            }}>
              Subscribe, enter your Stableford scores, and participate in monthly
              prize draws — while supporting the charities that matter to you.
            </p>

            <div style={{
              display:   'flex',
              gap:       '1rem',
              marginTop: '2.5rem',
              flexWrap:  'wrap',
              animation: 'fadeUp 0.7s 0.3s ease forwards',
              opacity:   0,
            }}>
             <SmartCTA className="btn-gold" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
  {localStorage.getItem('token')
    ? localStorage.getItem('subStatus') === 'active'
      ? 'Go to dashboard'
      : 'Complete subscription'
    : 'Start for ₹499/mo'}
</SmartCTA>
            </div>

            {/* Stats row */}
            <div style={{
              display:       'flex',
              gap:           '3rem',
              marginTop:     '5rem',
              paddingTop:    '3rem',
              borderTop:     '1px solid #2A2A2A',
              animation:     'fadeUp 0.7s 0.4s ease forwards',
              opacity:       0,
            }}>
              {[
                { value: '₹4.2L+', label: 'Prize pool paid out' },
                { value: '1,200+', label: 'Active subscribers' },
                { value: '8',      label: 'Charities supported' },
              ].map(stat => (
                <div key={stat.label}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize:   '2rem',
                    color:      'var(--gold)',
                    fontWeight: 600,
                  }}>{stat.value}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--cream-dim)', marginTop: '0.25rem' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative gold orb */}
        <div style={{
          position:     'absolute',
          right:        '-5%',
          top:          '20%',
          width:        500,
          height:       500,
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)',
          pointerEvents:'none',
        }}/>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────── */}
      <section className="section" style={{ background: 'var(--black-soft)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="label">Simple process</div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginTop: '1rem' }}>
              Three steps to winning
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              {
                num: '01',
                title: 'Subscribe',
                body: 'Choose a monthly or yearly plan. A portion goes to your chosen charity automatically.',
              },
              {
                num: '02',
                title: 'Enter scores',
                body: 'Log your last 5 Stableford scores. Your numbers enter you into the monthly draw.',
              },
              {
                num: '03',
                title: 'Win prizes',
                body: 'Match 3, 4, or all 5 drawn numbers. The jackpot rolls over if unclaimed.',
              },
            ].map((step, i) => (
              <div key={step.num} className="card" style={{
                position:  'relative',
                overflow:  'hidden',
                transition:'transform 0.3s, border-color 0.3s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform   = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--gold-dim)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform   = 'translateY(0)';
                e.currentTarget.style.borderColor = '#2A2A2A';
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize:   '4rem',
                  color:      'rgba(201,168,76,0.12)',
                  position:   'absolute',
                  top:        '1rem',
                  right:      '1.5rem',
                  lineHeight: 1,
                  fontWeight: 700,
                  userSelect: 'none',
                }}>{step.num}</div>
                <div style={{
                  width:        40,
                  height:       2,
                  background:   'var(--gold)',
                  marginBottom: '1.5rem',
                }}/>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{step.title}</h3>
                <p style={{ color: 'var(--cream-dim)', lineHeight: 1.8 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIZE POOL BREAKDOWN ─────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
            <div>
              <div className="label">Prize structure</div>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginTop: '1rem', marginBottom: '1.5rem' }}>
                Transparent.<br />Fair. Exciting.
              </h2>
              <p style={{ color: 'var(--cream-dim)', lineHeight: 1.9 }}>
                Every subscription contributes to the prize pool. The split is fixed,
                automatic, and published before every draw. No hidden fees.
              </p>
              <Link to="/register" className="btn-gold" style={{ marginTop: '2rem', display: 'inline-block' }}>
                Join the draw
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: '5-number match',  pct: 40, tag: 'Jackpot',   color: '#C9A84C' },
                { label: '4-number match',  pct: 35, tag: '4-match',   color: '#1D9E75' },
                { label: '3-number match',  pct: 25, tag: '3-match',   color: '#B8B0A0' },
              ].map(tier => (
                <div key={tier.label} className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{tier.label}</span>
                    <span style={{
                      fontSize:      '1.5rem',
                      fontFamily:    'var(--font-display)',
                      color:         tier.color,
                      fontWeight:    600,
                    }}>{tier.pct}%</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ background: '#2A2A2A', borderRadius: 4, height: 4 }}>
                    <div style={{
                      width:        tier.pct + '%',
                      height:       '100%',
                      background:   tier.color,
                      borderRadius: 4,
                      transition:   'width 1s ease',
                    }}/>
                  </div>
                  {tier.tag === 'Jackpot' && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--gold-dim)', marginTop: '0.5rem' }}>
                      Rolls over if unclaimed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED CHARITY ─────────────────────── */}
      {featured && (
        <section className="section" style={{ background: 'var(--black-soft)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="label">Spotlight charity</div>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginTop: '1rem' }}>
                This month we support
              </h2>
            </div>

            <div className="card" style={{
              display:    'grid',
              gridTemplateColumns: '1fr 1fr',
              gap:        '3rem',
              alignItems: 'center',
              padding:    '3rem',
              borderColor:'var(--gold-dim)',
            }}>
              <div>
                <div style={{
                  width:        56,
                  height:       56,
                  borderRadius: '50%',
                  background:   'linear-gradient(135deg, #C9A84C22, #C9A84C44)',
                  border:       '1px solid var(--gold-dim)',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent:'center',
                  fontSize:     '1.5rem',
                  marginBottom: '1.5rem',
                }}>♥</div>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>{featured.name}</h3>
                <p style={{ color: 'var(--cream-dim)', lineHeight: 1.9 }}>{featured.description}</p>
                <Link to="/charities" className="btn-outline" style={{ marginTop: '2rem', display: 'inline-block' }}>
                  View all charities
                </Link>
              </div>
              <div style={{
                background:   'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(29,158,117,0.06))',
                borderRadius: 'var(--radius-lg)',
                border:       '1px solid #2A2A2A',
                padding:      '2.5rem',
              }}>
                <div className="label" style={{ marginBottom: '1rem' }}>Upcoming events</div>
                {featured.upcomingEvents?.length > 0 ? (
                  featured.upcomingEvents.map((ev, i) => (
                    <div key={i} style={{
                      padding:      '1rem 0',
                      borderBottom: i < featured.upcomingEvents.length - 1 ? '1px solid #2A2A2A' : 'none',
                    }}>
                      <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{ev.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--cream-dim)' }}>
                        {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {ev.location && ` · ${ev.location}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--cream-dim)' }}>No upcoming events</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA BANNER ───────────────────────────── */}
      <section style={{
        padding:    '6rem 2rem',
        background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(29,158,117,0.05) 100%)',
        borderTop:  '1px solid #2A2A2A',
        textAlign:  'center',
      }}>
        <div className="label">Ready to play?</div>
        <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', margin: '1.5rem auto', maxWidth: 600 }}>
          Join 1,200+ golfers making a difference
        </h2>
        <p style={{ color: 'var(--cream-dim)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
          From ₹499/month. Cancel anytime.
        </p>
        <Link to="/dashboard" className="btn-gold" style={{ fontSize: '1.05rem', padding: '1rem 3rem' }}>
          Get started today
        </Link>
      </section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer style={{
        padding:      '3rem 2rem',
        borderTop:    '1px solid #2A2A2A',
        textAlign:    'center',
        color:        'var(--cream-dim)',
        fontSize:     '0.85rem',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '1rem' }}>
          GolfGives
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          
        </div>
        <div style={{ marginTop: '2rem', opacity: 0.5 }}>© 2026 GolfGives. All rights reserved.</div>
      </footer>

    </div>
  );
}