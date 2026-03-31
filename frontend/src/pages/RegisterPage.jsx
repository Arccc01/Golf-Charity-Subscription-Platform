import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios'

export default function RegisterPage() {
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token',    data.token);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail',data.user.email);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('subStatus', data.user.subscription.status);
      navigate('/subscribe');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      position: 'relative',
    }}>
      <div style={{
        position:   'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%)',
      }}/>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', animation: 'fadeUp 0.6s ease forwards' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, #C9A84C, #8A6F2E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem', fontSize: 18, fontWeight: 700, color: '#0D0D0D',
          }}>G</div>
          <h1 style={{ fontSize: '2rem' }}>Create account</h1>
          <p style={{ color: 'var(--cream-dim)', marginTop: '0.5rem' }}>Join the GolfGives community</p>
        </div>

        <div className="card">
          {error && (
            <div style={{
              background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)',
              borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
              color: '#e74c3c', fontSize: '0.9rem', marginBottom: '1.5rem',
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { label: 'Full name',  key: 'name',     type: 'text'     },
              { label: 'Email',      key: 'email',    type: 'email'    },
              { label: 'Password',   key: 'password', type: 'password' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: '0.85rem', color: 'var(--cream-dim)', display: 'block', marginBottom: '0.5rem' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  required
                  style={{
                    width: '100%', background: '#111',
                    border: '1px solid #2A2A2A', borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem', color: 'var(--cream)', fontSize: '0.95rem',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                  onBlur={e  => e.target.style.borderColor = '#2A2A2A'}
                />
              </div>
            ))}

            <button type="submit" disabled={loading} className="btn-gold" style={{
              width: '100%', padding: '0.85rem', fontSize: '0.95rem', marginTop: '0.5rem',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--cream-dim)', fontSize: '0.9rem' }}>
          Already a member?{' '}
          <Link to="/login" style={{ color: 'var(--gold)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}