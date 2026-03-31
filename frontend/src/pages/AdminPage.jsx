import { useEffect, useState } from 'react';
import api from '../api/axios'

const TABS = ['analytics', 'users', 'draws', 'winners'];

export default function AdminPage() {
  const [tab,       setTab]       = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users,     setUsers]     = useState([]);
  const [pending,   setPending]   = useState([]);
  const [search,    setSearch]    = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [drawMsg,   setDrawMsg]   = useState('');
  const [drawMode,  setDrawMode]  = useState('random');
  const [simResult, setSimResult] = useState(null);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    api.get('/admin/analytics').then(r => setAnalytics(r.data)).catch(() => {});
    api.get('/winners/admin/pending').then(r => setPending(r.data.pending)).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
  }, [tab, search, subStatus]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users', { params: { search, status: subStatus, limit: 50 } });
      setUsers(data.users);
    } catch {}
  };

  const simulateDraw = async () => {
    setLoading(true); setDrawMsg(''); setSimResult(null);
    try {
      const { data } = await api.post('/draws/simulate', { mode: drawMode });
      setSimResult(data);
      setDrawMsg('Simulation complete — review results below before publishing.');
    } catch (err) {
      setDrawMsg(err.response?.data?.message || 'Simulation failed');
    } finally { setLoading(false); }
  };

  const publishDraw = async () => {
    if (!simResult) return;
    setLoading(true);
    try {
      await api.post(`/draws/publish/${simResult.month}`);
      setDrawMsg(`Draw for ${simResult.month} published successfully.`);
      setSimResult(null);
    } catch (err) {
      setDrawMsg(err.response?.data?.message || 'Publish failed');
    } finally { setLoading(false); }
  };

  const verifyWinner = async (drawMonth, winnerId, action) => {
    try {
      await api.patch(`/winners/admin/verify/${drawMonth}/${winnerId}`, { action });
      setPending(p => p.filter(w => w.winnerId.toString() !== winnerId.toString()));
    } catch {}
  };

  const statCard = (label, value, color = 'var(--gold)') => (
    <div className="card" style={{ padding: '1.5rem' }} key={label}>
      <div style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: '6rem', paddingBottom: '4rem' }}>
      <div className="container">

        {/* Header */}
        <div style={{ marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid #2A2A2A' }}>
          <div className="label">Admin</div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginTop: '0.5rem' }}>Control panel</h1>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '0.25rem', marginBottom: '2.5rem',
          background: 'var(--black-card)', borderRadius: 'var(--radius-md)',
          padding: '0.35rem', width: 'fit-content', border: '1px solid #2A2A2A',
        }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:       '0.5rem 1.5rem',
              borderRadius:  8,
              background:    tab === t ? 'var(--gold)' : 'transparent',
              color:         tab === t ? 'var(--black)' : 'var(--cream-dim)',
              fontSize:      '0.9rem',
              fontWeight:    tab === t ? 500 : 400,
              transition:    'all 0.2s',
              textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>

        {/* ── ANALYTICS ── */}
        {tab === 'analytics' && analytics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {statCard('Total users',          analytics.users.total)}
              {statCard('Active subscribers',   analytics.users.active,  'var(--green)')}
              {statCard('Estimated MRR',        '₹' + analytics.revenue.estimatedMonthly.toLocaleString('en-IN'))}
              {statCard('Total prize pool',     '₹' + analytics.revenue.totalPrizePool.toLocaleString('en-IN'))}
              {statCard('Charity distributed',  '₹' + analytics.revenue.totalCharityContributions.toLocaleString('en-IN'), '#E2C97E')}
              {statCard('Total draws',          analytics.draws.total)}
            </div>

            {/* User breakdown */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Subscriber breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Active',    value: analytics.users.active,    color: 'var(--green)' },
                  { label: 'Inactive',  value: analytics.users.inactive,  color: 'var(--cream-dim)' },
                  { label: 'Cancelled', value: analytics.users.cancelled, color: 'var(--red)' },
                  { label: 'Lapsed',    value: analytics.users.lapsed,    color: 'var(--gold-dim)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 80, fontSize: '0.85rem', color: 'var(--cream-dim)' }}>{row.label}</div>
                    <div style={{ flex: 1, background: '#2A2A2A', borderRadius: 4, height: 6 }}>
                      <div style={{
                        width:      `${analytics.users.total ? (row.value / analytics.users.total) * 100 : 0}%`,
                        height:     '100%',
                        background: row.color,
                        borderRadius: 4,
                        transition: 'width 1s ease',
                        minWidth:   row.value > 0 ? 4 : 0,
                      }}/>
                    </div>
                    <div style={{ width: 30, fontSize: '0.85rem', color: row.color, textAlign: 'right' }}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charity breakdown */}
            {analytics.charities.breakdown.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Charity contributions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {analytics.charities.breakdown.map(c => (
                    <div key={c._id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem 1rem', background: '#111',
                      borderRadius: 'var(--radius-sm)', border: '1px solid #2A2A2A',
                    }}>
                      <span style={{ fontSize: '0.9rem' }}>{c.name}</span>
                      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '1.1rem' }}>
                        ₹{c.totalReceived.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, minWidth: 200,
                  background: 'var(--black-card)', border: '1px solid #2A2A2A',
                  borderRadius: 'var(--radius-sm)', padding: '0.65rem 1rem',
                  color: 'var(--cream)', fontSize: '0.9rem',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                onBlur={e  => e.target.style.borderColor = '#2A2A2A'}
              />
              <select value={subStatus} onChange={e => setSubStatus(e.target.value)} style={{
                background: 'var(--black-card)', border: '1px solid #2A2A2A',
                borderRadius: 'var(--radius-sm)', padding: '0.65rem 1rem',
                color: 'var(--cream)', fontSize: '0.9rem', cursor: 'pointer',
              }}>
                <option value="">All statuses</option>
                {['active', 'inactive', 'cancelled', 'lapsed'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* User table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                    {['Name', 'Email', 'Plan', 'Status', 'Joined'].map(col => (
                      <th key={col} style={{
                        padding: '1rem 1.25rem', textAlign: 'left',
                        fontSize: '0.75rem', fontWeight: 500,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: 'var(--cream-dim)',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id} style={{
                      borderBottom:  '1px solid #1A1A1A',
                      transition:    'background 0.15s',
                      animation:     `fadeIn 0.3s ${i * 0.03}s ease forwards`,
                      opacity:       0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1A1A1A'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.9rem' }}>{u.name}</td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--cream-dim)' }}>{u.email}</td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--cream-dim)', textTransform: 'capitalize' }}>
                        {u.subscription?.plan || '—'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          fontSize:      '0.75rem',
                          fontWeight:    500,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          padding:       '0.25rem 0.65rem',
                          borderRadius:  20,
                          color:         u.subscription?.status === 'active' ? 'var(--green)' :
                                         u.subscription?.status === 'cancelled' ? '#e74c3c' : 'var(--cream-dim)',
                          background:    u.subscription?.status === 'active' ? 'rgba(29,158,117,0.12)' :
                                         u.subscription?.status === 'cancelled' ? 'rgba(192,57,43,0.12)' : '#1A1A1A',
                        }}>{u.subscription?.status || 'inactive'}</span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: 'var(--cream-dim)' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--cream-dim)', fontSize: '0.9rem' }}>
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DRAWS ── */}
        {tab === 'draws' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '2rem' }}>

            {/* Controls */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Run monthly draw</h3>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--cream-dim)', marginBottom: '0.75rem' }}>Draw mode</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['random', 'weighted'].map(mode => (
                    <button key={mode} onClick={() => setDrawMode(mode)} style={{
                      flex:          1,
                      padding:       '0.6rem',
                      borderRadius:  'var(--radius-sm)',
                      border:        `1px solid ${drawMode === mode ? 'var(--gold)' : '#2A2A2A'}`,
                      background:    drawMode === mode ? 'rgba(201,168,76,0.1)' : 'transparent',
                      color:         drawMode === mode ? 'var(--gold)' : 'var(--cream-dim)',
                      fontSize:      '0.85rem',
                      textTransform: 'capitalize',
                      cursor:        'pointer',
                      transition:    'all 0.2s',
                    }}>{mode}</button>
                  ))}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--cream-dim)', marginTop: '0.5rem', lineHeight: 1.6 }}>
                  {drawMode === 'random'
                    ? 'Pure lottery — every number 1–45 has an equal chance.'
                    : 'Weighted by score frequency — popular scores have higher draw probability.'}
                </div>
              </div>

              <button onClick={simulateDraw} disabled={loading} className="btn-gold"
                style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Simulating...' : 'Simulate draw'}
              </button>

              {simResult && (
                <button onClick={publishDraw} disabled={loading} style={{
                  width:         '100%',
                  padding:       '0.75rem',
                  background:    'rgba(29,158,117,0.15)',
                  border:        '1px solid rgba(29,158,117,0.3)',
                  color:         'var(--green)',
                  borderRadius:  'var(--radius-sm)',
                  fontSize:      '0.9rem',
                  cursor:        'pointer',
                  transition:    'all 0.2s',
                }}>
                  Publish this draw
                </button>
              )}

              {drawMsg && (
                <div style={{
                  marginTop:     '1rem',
                  padding:       '0.65rem 1rem',
                  borderRadius:  'var(--radius-sm)',
                  background:    drawMsg.includes('success') || drawMsg.includes('complete')
                    ? 'rgba(29,158,117,0.12)' : 'rgba(192,57,43,0.12)',
                  border:        `1px solid ${drawMsg.includes('success') || drawMsg.includes('complete')
                    ? 'rgba(29,158,117,0.25)' : 'rgba(192,57,43,0.25)'}`,
                  color:         drawMsg.includes('success') || drawMsg.includes('complete') ? 'var(--green)' : '#e74c3c',
                  fontSize:      '0.85rem',
                  lineHeight:    1.6,
                }}>{drawMsg}</div>
              )}
            </div>

            {/* Simulation result */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                {simResult ? `Simulation — ${simResult.month}` : 'Result preview'}
              </h3>

              {!simResult ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--cream-dim)' }}>
                  Run a simulation to preview results before publishing
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Winning numbers */}
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--cream-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Winning numbers
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {simResult.winningNumbers.map(n => (
                        <div key={n} style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))',
                          border: '2px solid var(--gold)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--gold)', fontSize: '1rem',
                        }}>{n}</div>
                      ))}
                    </div>
                  </div>

                  {/* Prize pool */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {[
                      { label: 'Total pool',  value: '₹' + simResult.prizePool.total.toLocaleString('en-IN') },
                      { label: 'Jackpot',     value: '₹' + simResult.prizePool.jackpot.toLocaleString('en-IN') },
                      { label: '4-match pool',value: '₹' + simResult.prizePool.fourMatch.toLocaleString('en-IN') },
                      { label: '3-match pool',value: '₹' + simResult.prizePool.threeMatch.toLocaleString('en-IN') },
                    ].map(item => (
                      <div key={item.label} style={{
                        padding: '0.75rem', background: '#111',
                        borderRadius: 'var(--radius-sm)', border: '1px solid #2A2A2A',
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--cream-dim)', marginBottom: '0.25rem' }}>{item.label}</div>
                        <div style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '1.1rem' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Winners */}
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--cream-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Winners ({simResult.winners.length})
                    </div>
                    {simResult.winners.length === 0 ? (
                      <div style={{ color: 'var(--cream-dim)', fontSize: '0.9rem' }}>
                        No winners this draw.
                        {simResult.jackpotRolledOver && <span style={{ color: 'var(--gold)' }}> Jackpot rolls over.</span>}
                      </div>
                    ) : (
                      simResult.winners.map((w, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '0.65rem 0.75rem', background: '#111',
                          borderRadius: 'var(--radius-sm)', border: '1px solid #2A2A2A',
                          marginBottom: '0.5rem', fontSize: '0.85rem',
                        }}>
                          <span style={{ color: 'var(--cream-dim)' }}>{w.matchCount}-match winner</span>
                          <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
                            ₹{w.prizeAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Subscribers */}
                  <div style={{ fontSize: '0.82rem', color: 'var(--cream-dim)', paddingTop: '0.5rem', borderTop: '1px solid #2A2A2A' }}>
                    {simResult.totalSubscribers} active subscribers in this draw
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── WINNERS ── */}
        {tab === 'winners' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem 1.5rem 0' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Pending verification</h3>
              <p style={{ color: 'var(--cream-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                {pending.length} winner{pending.length !== 1 ? 's' : ''} awaiting review
              </p>
            </div>

            {pending.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cream-dim)' }}>
                All caught up — no pending verifications
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                    {['Winner', 'Draw', 'Match', 'Prize', 'Proof', 'Actions'].map(col => (
                      <th key={col} style={{
                        padding: '0.75rem 1.25rem', textAlign: 'left',
                        fontSize: '0.72rem', fontWeight: 500,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: 'var(--cream-dim)',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.map((w, i) => (
                    <tr key={w.winnerId} style={{
                      borderBottom:  '1px solid #1A1A1A',
                      transition:    'background 0.15s',
                      animation:     `fadeIn 0.3s ${i * 0.04}s ease forwards`,
                      opacity:       0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1A1A1A'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '0.9rem' }}>{w.user?.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--cream-dim)' }}>{w.user?.email}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--cream-dim)' }}>{w.drawMonth}</td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--gold)' }}>{w.matchCount}-match</td>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>
                        ₹{w.prizeAmount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {w.proofUrl ? (
                          <a href={w.proofUrl} target="_blank" rel="noreferrer" style={{
                            color: 'var(--gold)', fontSize: '0.82rem',
                            textDecoration: 'underline', textUnderlineOffset: 3,
                          }}>View proof</a>
                        ) : (
                          <span style={{ color: 'var(--cream-dim)', fontSize: '0.82rem' }}>Not uploaded</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => verifyWinner(w.drawMonth, w.winnerId, 'approve')}
                            style={{
                              padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-sm)',
                              background: 'rgba(29,158,117,0.15)', border: '1px solid rgba(29,158,117,0.3)',
                              color: 'var(--green)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                            }}>Approve</button>
                          <button
                            onClick={() => verifyWinner(w.drawMonth, w.winnerId, 'reject')}
                            style={{
                              padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-sm)',
                              background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.25)',
                              color: '#e74c3c', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                            }}>Reject</button>
                        </div>
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