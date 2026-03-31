import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [scrolled,     setScrolled]     = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const isLoggedIn= !!localStorage.getItem('token');
  const isAdmin   = localStorage.getItem('userRole') === 'admin';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav style={{
      position:        'fixed',
      top:             0,
      left:            0,
      right:           0,
      zIndex:          100,
      padding:         '1.25rem 2rem',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      background:      scrolled ? 'rgba(13,13,13,0.95)' : 'transparent',
      backdropFilter:  scrolled ? 'blur(12px)' : 'none',
      borderBottom:    scrolled ? '1px solid #2A2A2A' : '1px solid transparent',
      transition:      'all 0.4s ease',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #C9A84C, #8A6F2E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#0D0D0D',
        }}>G</div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.2rem',
          color: '#F5F0E8',
          letterSpacing: '0.02em',
        }}>GolfGives</span>
      </Link>

      {/* Desktop links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        {['Charities', 'Draw results'].map(label => {
          const to = '/' + label.toLowerCase().replace(/ /g, '-');
          return (
            <Link key={label} to={to} style={{
              fontSize:      '0.9rem',
              color:         location.pathname === to ? '#C9A84C' : '#B8B0A0',
              letterSpacing: '0.02em',
              transition:    'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = '#C9A84C'}
            onMouseLeave={e => e.target.style.color = location.pathname === to ? '#C9A84C' : '#B8B0A0'}
            >{label}</Link>
          );
        })}

        {isLoggedIn ? (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    {isAdmin && (
      <Link to="/admin" className="btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
        Admin
      </Link>
    )}

    {/* Show Subscribe if not yet subscribed */}
    {localStorage.getItem('subStatus') !== 'active' && (
      <Link to="/subscribe" className="btn-gold" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
        Subscribe
      </Link>
    )}

    {localStorage.getItem('subStatus') === 'active' && (
      <Link to="/dashboard" className="btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
        Dashboard
      </Link>
    )}

    <button onClick={handleLogout} style={{
      background: 'transparent', color: '#B8B0A0',
      fontSize: '0.85rem', padding: '0.5rem',
    }}>Logout</button>
  </div>
) : (
  <div style={{ display: 'flex', gap: '1rem' }}>
    <Link to="/login" className="btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
      Login
    </Link>
    <Link to="/register" className="btn-gold" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
      Join now
    </Link>
  </div>
)}
      </div>
    </nav>
  );
}