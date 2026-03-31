import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios'

const CATEGORIES = ['all', 'health', 'education', 'environment', 'sports', 'community', 'other'];

export default function CharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('all');
  const [loading,   setLoading]   = useState(true);
  const [selecting, setSelecting] = useState(null); // charityId being selected
  const [pct,       setPct]       = useState(10);
  const [msg,       setMsg]       = useState('');
  const isLoggedIn = !!localStorage.getItem('token');
  const navigate   = useNavigate();

  useEffect(() => { fetchCharities(); }, [search, category]);

  const fetchCharities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)            params.search   = search;
      if (category !== 'all') params.category = category;
      const { data } = await api.get('/charities', { params });
      setCharities(data.charities);
    } catch {}
    finally { setLoading(false); }
  };

  const handleSelect = async (charityId) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setMsg('');
    try {
      await api.post('/charities/select', { charityId, percentage: pct });
      setMsg('Charity selected successfully');
      setSelecting(null);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to select charity');
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: '6rem', paddingBottom: '4rem' }}>
      <div className="container">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem', animation: 'fadeUp 0.6s ease forwards' }}>
          <div className="label">Make a difference</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginTop: '1rem', marginBottom: '1rem' }}>
            Our <span className="gold-text">charities</span>
          </h1>
          <p style={{ color: 'var(--cream-dim)', maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
            Choose where your contribution goes. Every subscription automatically
            donates a minimum of 10% to your chosen cause.
          </p>
        </div>

        {/* Search + filter bar */}
        <div style={{
          display:       'flex',
          gap:           '1rem',
          marginBottom:  '3rem',
          flexWrap:      'wrap',
          alignItems:    'center',
        }}>
          <input
            type="text"
            placeholder="Search charities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex:          1,
              minWidth:      200,
              background:    'var(--black-card)',
              border:        '1px solid #2A2A2A',
              borderRadius:  'var(--radius-sm)',
              padding:       '0.75rem 1.25rem',
              color:         'var(--cream)',
              fontSize:      '0.95rem',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
            onBlur={e  => e.target.style.borderColor = '#2A2A2A'}
          />

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                padding:       '0.5rem 1.1rem',
                borderRadius:  20,
                border:        `1px solid ${category === cat ? 'var(--gold)' : '#2A2A2A'}`,
                background:    category === cat ? 'rgba(201,168,76,0.12)' : 'transparent',
                color:         category === cat ? 'var(--gold)' : 'var(--cream-dim)',
                fontSize:      '0.82rem',
                fontWeight:    category === cat ? 500 : 400,
                textTransform: 'capitalize',
                transition:    'all 0.2s',
                cursor:        'pointer',
              }}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Success/error message */}
        {msg && (
          <div style={{
            padding:       '0.75rem 1.25rem',
            borderRadius:  'var(--radius-sm)',
            background:    msg.includes('success') ? 'rgba(29,158,117,0.15)' : 'rgba(192,57,43,0.15)',
            border:        `1px solid ${msg.includes('success') ? 'rgba(29,158,117,0.3)' : 'rgba(192,57,43,0.3)'}`,
            color:         msg.includes('success') ? '#1D9E75' : '#e74c3c',
            fontSize:      '0.9rem',
            marginBottom:  '2rem',
          }}>{msg}</div>
        )}

        {/* Charity grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--cream-dim)' }}>
            Loading charities...
          </div>
        ) : charities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--cream-dim)' }}>
            No charities found for your search.
          </div>
        ) : (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap:                 '1.5rem',
          }}>
            {charities.map((charity, i) => (
              <div key={charity._id} style={{
                background:    'var(--black-card)',
                border:        `1px solid ${charity.isFeatured ? 'var(--gold-dim)' : '#2A2A2A'}`,
                borderRadius:  'var(--radius-lg)',
                overflow:      'hidden',
                transition:    'transform 0.3s, border-color 0.3s, box-shadow 0.3s',
                animation:     `fadeUp 0.5s ${i * 0.06}s ease forwards`,
                opacity:       0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform  = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
                if (!charity.isFeatured) e.currentTarget.style.borderColor = '#3A3A3A';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform  = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = charity.isFeatured ? 'var(--gold-dim)' : '#2A2A2A';
              }}>

                {/* Card top bar */}
                <div style={{
                  height:     4,
                  background: charity.isFeatured
                    ? 'linear-gradient(90deg, var(--gold-light), var(--gold))'
                    : 'linear-gradient(90deg, var(--green-dim), var(--green))',
                }}/>

                <div style={{ padding: '1.75rem' }}>
                  {/* Icon + featured badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{
                      width:         48,
                      height:        48,
                      borderRadius:  '50%',
                      background:    charity.isFeatured
                        ? 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))'
                        : 'rgba(29,158,117,0.1)',
                      border:        `1px solid ${charity.isFeatured ? 'var(--gold-dim)' : 'var(--green-dim)'}`,
                      display:       'flex',
                      alignItems:    'center',
                      justifyContent:'center',
                      fontSize:      '1.2rem',
                    }}>
                      {charity.category === 'health'      ? '🏥' :
                       charity.category === 'education'   ? '📚' :
                       charity.category === 'environment' ? '🌱' :
                       charity.category === 'sports'      ? '🏅' :
                       charity.category === 'community'   ? '🤝' : '♥'}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {charity.isFeatured && (
                        <span style={{
                          fontSize:      '0.7rem',
                          fontWeight:    500,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color:         'var(--gold)',
                          background:    'rgba(201,168,76,0.12)',
                          padding:       '0.25rem 0.6rem',
                          borderRadius:  20,
                          border:        '1px solid rgba(201,168,76,0.2)',
                        }}>Featured</span>
                      )}
                      <span style={{
                        fontSize:      '0.7rem',
                        textTransform: 'capitalize',
                        color:         'var(--cream-dim)',
                        background:    '#111',
                        padding:       '0.25rem 0.6rem',
                        borderRadius:  20,
                        border:        '1px solid #2A2A2A',
                      }}>{charity.category}</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{charity.name}</h3>
                  <p style={{
                    color:      'var(--cream-dim)',
                    fontSize:   '0.9rem',
                    lineHeight: 1.7,
                    marginBottom:'1.5rem',
                    display:    '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient:'vertical',
                    overflow:   'hidden',
                  }}>{charity.description}</p>

                  {/* Upcoming events preview */}
                  {charity.upcomingEvents?.length > 0 && (
                    <div style={{
                      padding:      '0.75rem',
                      background:   '#111',
                      borderRadius: 'var(--radius-sm)',
                      border:       '1px solid #2A2A2A',
                      marginBottom: '1.5rem',
                      fontSize:     '0.82rem',
                    }}>
                      <div style={{ color: 'var(--gold)', fontWeight: 500, marginBottom: '0.25rem' }}>
                        Upcoming: {charity.upcomingEvents[0].title}
                      </div>
                      <div style={{ color: 'var(--cream-dim)' }}>
                        {new Date(charity.upcomingEvents[0].date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </div>
                    </div>
                  )}

                  {/* Select button / inline form */}
                  {selecting === charity._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <label style={{ fontSize: '0.82rem', color: 'var(--cream-dim)' }}>
                        Contribution percentage (min 10%)
                      </label>
                      <input
                        type="number" min={10} max={100} value={pct}
                        onChange={e => setPct(Number(e.target.value))}
                        style={{
                          background: '#111', border: '1px solid #2A2A2A',
                          borderRadius: 'var(--radius-sm)', padding: '0.6rem 1rem',
                          color: 'var(--cream)', fontSize: '0.9rem',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                        onBlur={e  => e.target.style.borderColor = '#2A2A2A'}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleSelect(charity._id)} className="btn-gold"
                          style={{ flex: 1, padding: '0.6rem' }}>
                          Confirm
                        </button>
                        <button onClick={() => setSelecting(null)} className="btn-outline"
                          style={{ flex: 1, padding: '0.6rem' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelecting(charity._id)}
                      className="btn-gold"
                      style={{ width: '100%', padding: '0.7rem' }}>
                      Select this charity
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}