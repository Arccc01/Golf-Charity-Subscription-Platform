import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios'

const inputStyle = {
  background: '#111', border: '1px solid #2A2A2A',
  borderRadius: 'var(--radius-sm)', padding: '0.65rem 1rem',
  color: 'var(--cream)', fontSize: '0.9rem', width: '100%',
  transition: 'border-color 0.2s',
};

export default function Dashboard() {
  const [scores,   setScores]   = useState([]);
  const [wins,     setWins]     = useState([]);
  const [user,     setUser]     = useState(null);
  const [tab,      setTab]      = useState('scores');
  const [newScore, setNewScore] = useState({ points: '', datePlayed: '' });
  const [msg,      setMsg]      = useState('');
  const [payments, setPayments] = useState([]);
  const navigate = useNavigate();

useEffect(() => {
  Promise.all([
    api.get('/auth/me'),
    api.get('/scores'),
    api.get('/winners/my-wins'),
    api.get('/subscription/my-payments'), 
  ]).then(([u, s, w, p]) => {
    setUser(u.data.user);
    setScores(s.data.scores);
    setWins(w.data.myWins);
    setPayments(p.data.payments);
  }).catch(() => navigate('/login'));
}, []);

  const addScore = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const { data } = await api.post('/scores', {
        points:     Number(newScore.points),
        datePlayed: newScore.datePlayed,
      });
      setScores(data.scores);
      setNewScore({ points: '', datePlayed: '' });
      setMsg('Score added successfully');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to add score');
    }
  };

  const deleteScore = async (id) => {
    try {
      const { data } = await api.delete(`/scores/${id}`);
      setScores(data.scores);
    } catch {}
  };

  const tabs = ['scores', 'wins', 'charity'];

  return (
    <div style={{ minHeight: '100vh', paddingTop: '6rem', paddingBottom: '4rem' }}>
      <div className="container">

        {/* Header */}
        <div style={{
          display:       'flex',
          justifyContent:'space-between',
          alignItems:    'flex-end',
          marginBottom:  '3rem',
          paddingBottom: '2rem',
          borderBottom:  '1px solid #2A2A2A',
        }}>
          <div>
            <div className="label">Dashboard</div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginTop: '0.5rem' }}>
              Welcome, {user?.name?.split(' ')[0]}
            </h1>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {[
  {
    label: 'Scores logged',
    value: `${scores.length} / 5`,
  },
  {
    label: 'Draws entered',
    value: wins.length,
  },
  {
    label: 'Total won',
    value: '₹' + wins.reduce((s, w) => s + w.prizeAmount, 0).toLocaleString('en-IN'),
  },
  {
    label: 'Subscription',
    value: user?.subscription?.status
      ? user.subscription.status.charAt(0).toUpperCase() + user.subscription.status.slice(1)
      : 'Loading...',
    color: user?.subscription?.status === 'active' ? '#1D9E75' :
           user?.subscription?.status === 'lapsed' ? '#C9A84C' : '#e74c3c',
  },
].map(stat => (
  <div key={stat.label} className="card" style={{ padding: '1.5rem' }}>
    <div style={{
      fontSize: '0.8rem', color: 'var(--cream-dim)',
      marginBottom: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      {stat.label}
    </div>
    <div style={{
      fontFamily: 'var(--font-display)',
      fontSize:   '1.8rem',
      color:      stat.color || 'var(--gold)',
      fontWeight: 600,
    }}>{stat.value}</div>
  </div>
))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', background: 'var(--black-card)', borderRadius: 'var(--radius-md)', padding: '0.35rem', width: 'fit-content', border: '1px solid #2A2A2A' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:       '0.5rem 1.5rem',
              borderRadius:  '8px',
              background:    tab === t ? 'var(--gold)' : 'transparent',
              color:         tab === t ? 'var(--black)' : 'var(--cream-dim)',
              fontSize:      '0.9rem',
              fontWeight:    tab === t ? 500 : 400,
              transition:    'all 0.2s',
              textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>

        {/* SCORES TAB */}
        {tab === 'scores' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '2rem' }}>

            {/* Add score form */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Add new score</h3>
              {msg && (
                <div style={{
                  padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)',
                  background: msg.includes('success') ? 'rgba(29,158,117,0.15)' : 'rgba(192,57,43,0.15)',
                  border:     `1px solid ${msg.includes('success') ? 'rgba(29,158,117,0.3)' : 'rgba(192,57,43,0.3)'}`,
                  color:      msg.includes('success') ? '#1D9E75' : '#e74c3c',
                  fontSize:   '0.85rem',
                  marginBottom:'1rem',
                }}>{msg}</div>
              )}
              <form onSubmit={addScore} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--cream-dim)', display: 'block', marginBottom: '0.4rem' }}>
                    Stableford points (1–45)
                  </label>
                  <input
                    type="number" min={1} max={45} required
                    value={newScore.points}
                    onChange={e => setNewScore({ ...newScore, points: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                    onBlur={e  => e.target.style.borderColor = '#2A2A2A'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--cream-dim)', display: 'block', marginBottom: '0.4rem' }}>
                    Date played
                  </label>
                  <input
                    type="date" required
                    max={new Date().toISOString().split('T')[0]}
                    value={newScore.datePlayed}
                    onChange={e => setNewScore({ ...newScore, datePlayed: e.target.value })}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                    onBlur={e  => e.target.style.borderColor = '#2A2A2A'}
                  />
                </div>
                <button type="submit" className="btn-gold" style={{ width: '100%', padding: '0.75rem' }}>
                  Add score
                </button>
              </form>
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#111', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--cream-dim)' }}>
                Only your last 5 scores are kept. Adding a 6th automatically removes your oldest.
              </div>
            </div>

            {/* Score list */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                Your scores
                <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-body)', color: 'var(--cream-dim)', fontWeight: 400, marginLeft: '0.75rem' }}>
                  {scores.length} / 5
                </span>
              </h3>

              {scores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--cream-dim)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⛳</div>
                  No scores yet — add your first one
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {scores.map((s, i) => (
                    <div key={s._id} style={{
                      display:       'flex',
                      alignItems:    'center',
                      justifyContent:'space-between',
                      padding:       '1rem 1.25rem',
                      background:    '#111',
                      borderRadius:  'var(--radius-sm)',
                      border:        '1px solid #2A2A2A',
                      animation:     `fadeUp 0.4s ${i * 0.05}s ease forwards`,
                      opacity:       0,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width:        40, height: 40, borderRadius: '50%',
                          background:   'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))',
                          border:       '1px solid var(--gold-dim)',
                          display:      'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily:   'var(--font-display)', fontWeight: 600, color: 'var(--gold)',
                          fontSize:     '1rem',
                        }}>{s.points}</div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{s.points} pts</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--cream-dim)' }}>
                            {new Date(s.datePlayed).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      {i === 0 && (
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.08em',
                          textTransform: 'uppercase', color: 'var(--green)',
                          background: 'rgba(29,158,117,0.12)', padding: '0.25rem 0.6rem',
                          borderRadius: 20,
                        }}>Latest</span>
                      )}
                      <button onClick={() => deleteScore(s._id)} style={{
                        background: 'transparent', color: '#555',
                        fontSize: '0.8rem', padding: '0.25rem 0.5rem',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.target.style.color = '#e74c3c'}
                      onMouseLeave={e => e.target.style.color = '#555'}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* WINS TAB */}
        {tab === 'wins' && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>My winnings</h3>
            {wins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--cream-dim)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏆</div>
                No wins yet — keep playing!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {wins.map((w, i) => (
                  <div key={i} style={{
                    display:       'flex',
                    alignItems:    'center',
                    justifyContent:'space-between',
                    padding:       '1.25rem 1.5rem',
                    background:    '#111',
                    borderRadius:  'var(--radius-md)',
                    border:        '1px solid #2A2A2A',
                    flexWrap:      'wrap',
                    gap:           '1rem',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--gold)' }}>
                        ₹{w.prizeAmount.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--cream-dim)', marginTop: '0.25rem' }}>
                        {w.month} · {w.matchCount}-number match
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color:      w.paymentStatus === 'paid' ? 'var(--green)' : 'var(--gold)',
                      background: w.paymentStatus === 'paid' ? 'rgba(29,158,117,0.12)' : 'rgba(201,168,76,0.12)',
                      padding:    '0.3rem 0.75rem', borderRadius: 20,
                    }}>
                      {w.paymentStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHARITY TAB */}
       {tab === 'charity' && (
  <div className="card" style={{ maxWidth: 600 }}>
    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Your charity</h3>
    <p style={{ color: 'var(--cream-dim)', marginBottom: '2rem', fontSize: '0.9rem' }}>
      A minimum of 10% of your subscription goes to your selected charity each month.
    </p>

    {user?.selectedCharity ? (
      <div style={{ marginBottom: '2rem' }}>

        {/* Currently selected */}
        <div style={{
          padding:      '1.25rem 1.5rem',
          background:   '#111',
          borderRadius: 'var(--radius-md)',
          border:       '1px solid var(--gold-dim)',
          marginBottom: '1.5rem',
          display:      'flex',
          justifyContent:'space-between',
          alignItems:   'center',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Currently supporting
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
              {user.selectedCharity.name}
            </div>
          </div>
          <div style={{
            fontFamily:  'var(--font-display)',
            fontSize:    '2rem',
            color:       'var(--gold)',
            fontWeight:  600,
          }}>
            {user.charityPercentage}%
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--cream-dim)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
          You are contributing <strong style={{ color: 'var(--cream)' }}>{user.charityPercentage}%</strong> of
          your subscription to <strong style={{ color: 'var(--cream)' }}>{user.selectedCharity.name}</strong> each month.
          {user.subscription?.plan === 'monthly'
            ? ` That's ₹${Math.floor(499 * user.charityPercentage / 100)} per month.`
            : ` That's ₹${Math.floor(4999 * user.charityPercentage / 100)} per year.`}
        </div>
      </div>
    ) : (
      <div style={{
        padding:      '1.5rem',
        background:   '#111',
        borderRadius: 'var(--radius-md)',
        border:       '1px solid #2A2A2A',
        marginBottom: '1.5rem',
        color:        'var(--cream-dim)',
        fontSize:     '0.9rem',
      }}>
        You haven't selected a charity yet.
      </div>
    )}

    <a href="/charities" className="btn-gold" style={{ display: 'inline-block' }}>
      {user?.selectedCharity ? 'Change charity' : 'Browse and select a charity'}
    </a>
  </div>
)}

   {tab === 'payments' && (
  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
    <div style={{ padding: '1.5rem 1.5rem 0' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Payment history</h3>
      <p style={{ color: 'var(--cream-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        All your subscription payments and donations
      </p>
    </div>

    {payments.length === 0 ? (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cream-dim)' }}>
        No payments yet
      </div>
    ) : (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
            {['Date', 'Type', 'Plan', 'Amount', 'Charity contribution', 'Status'].map(col => (
              <th key={col} style={{
                padding:       '0.75rem 1.25rem',
                textAlign:     'left',
                fontSize:      '0.72rem',
                fontWeight:    500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color:         'var(--cream-dim)',
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payments.map((p, i) => (
            <tr key={p.id} style={{
              borderBottom: '1px solid #1A1A1A',
              transition:   'background 0.15s',
              animation:    `fadeIn 0.3s ${i * 0.04}s ease forwards`,
              opacity:      0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1A1A1A'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--cream-dim)' }}>
                {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                {p.type}
              </td>
              <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--cream-dim)', textTransform: 'capitalize' }}>
                {p.plan || '—'}
              </td>
              <td style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '1rem' }}>
                ₹{p.amount.toLocaleString('en-IN')}
              </td>
              <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--green)' }}>
                ₹{p.charityContribution.toLocaleString('en-IN')}
                {p.charity && <span style={{ color: 'var(--cream-dim)', fontSize: '0.78rem' }}> → {p.charity}</span>}
              </td>
              <td style={{ padding: '1rem 1.25rem' }}>
                <span style={{
                  fontSize:      '0.75rem',
                  fontWeight:    500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding:       '0.25rem 0.65rem',
                  borderRadius:  20,
                  color:      p.status === 'paid'    ? 'var(--green)'    :
                              p.status === 'failed'  ? '#e74c3c'         :
                              p.status === 'refunded'? 'var(--gold)'     : 'var(--cream-dim)',
                  background: p.status === 'paid'    ? 'rgba(29,158,117,0.12)' :
                              p.status === 'failed'  ? 'rgba(192,57,43,0.12)'  :
                              p.status === 'refunded'? 'rgba(201,168,76,0.12)' : '#1A1A1A',
                }}>{p.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}

      </div>
    </div>
  );
}