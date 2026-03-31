import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const PLANS = [
  {
    key:      'monthly',
    label:    'Monthly',
    price:    '₹499',
    period:   'per month',
    features: [
      'Full score entry access',
      'Monthly draw entry',
      'Charity contribution',
      'Cancel anytime',
    ],
    badge: null,
  },
  {
    key:      'yearly',
    label:    'Yearly',
    price:    '₹4,999',
    period:   'per year',
    features: [
      'Everything in monthly',
      '2 months free',
      'Priority support',
      'Locked-in rate',
    ],
    badge: 'Best value',
  },
];

export default function SubscribePage() {
  const [selected, setSelected] = useState('yearly');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/subscription/create-order', { plan: selected });

      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        order_id:    data.orderId,
        name:        'GolfGives',
        description: selected === 'monthly' ? 'Monthly Subscription' : 'Yearly Subscription',

        handler: async (response) => {
          try {
            await api.post('/subscription/verify-payment', response);
            localStorage.setItem('subStatus', 'active');
            window.location.href = '/dashboard?subscribed=true';
          } catch {
            setError('Payment verified but activation failed. Please contact support.');
          }
        },
        prefill: {
          name:  localStorage.getItem('userName'),
          email: localStorage.getItem('userEmail'),
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: { color: '#C9A84C' },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });

      rzp.open();

    } catch (err) {
      console.log("error is:",err)
      setError(err.response?.data?.message || 'Could not initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const selectedPlan = PLANS.find(p => p.key === selected);

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '6rem 2rem 4rem',
      position:       'relative',
      overflow:       'hidden',
    }}>

      {/* Background effects */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: `
          radial-gradient(ellipse 60% 50% at 30% 50%, rgba(201,168,76,0.07) 0%, transparent 65%),
          radial-gradient(ellipse 50% 50% at 70% 50%, rgba(29,158,117,0.05) 0%, transparent 65%)
        `,
        pointerEvents: 'none',
      }}/>
      <div style={{
        position:        'absolute',
        inset:           0,
        backgroundImage: `linear-gradient(rgba(42,42,42,0.2) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(42,42,42,0.2) 1px, transparent 1px)`,
        backgroundSize:  '60px 60px',
        pointerEvents:   'none',
      }}/>

      <div style={{ width: '100%', maxWidth: 900, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{
          textAlign:  'center',
          marginBottom:'3.5rem',
          animation:  'fadeUp 0.6s ease forwards',
        }}>
          <div className="label">Join GolfGives</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginTop: '1rem', marginBottom: '1rem' }}>
            Choose your <span className="gold-text">plan</span>
          </h1>
          <p style={{ color: 'var(--cream-dim)', fontSize: '1.05rem', maxWidth: 480, margin: '0 auto' }}>
            Every plan includes monthly draw entry, score tracking,
            and automatic charity giving.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            padding:       '0.85rem 1.25rem',
            borderRadius:  'var(--radius-sm)',
            background:    'rgba(192,57,43,0.15)',
            border:        '1px solid rgba(192,57,43,0.3)',
            color:         '#e74c3c',
            fontSize:      '0.9rem',
            marginBottom:  '2rem',
            textAlign:     'center',
            animation:     'fadeIn 0.3s ease forwards',
          }}>{error}</div>
        )}

        {/* Plan cards */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 '1.5rem',
          marginBottom:        '2.5rem',
        }}>
          {PLANS.map((plan, i) => {
            const isSelected = selected === plan.key;
            return (
              <div
                key={plan.key}
                onClick={() => setSelected(plan.key)}
                style={{
                  background:    'var(--black-card)',
                  border:        `2px solid ${isSelected ? 'var(--gold)' : '#2A2A2A'}`,
                  borderRadius:  'var(--radius-lg)',
                  padding:       '2.5rem',
                  cursor:        'pointer',
                  transition:    'all 0.3s',
                  position:      'relative',
                  overflow:      'hidden',
                  animation:     `fadeUp 0.5s ${i * 0.12}s ease forwards`,
                  opacity:       0,
                  boxShadow:     isSelected ? '0 0 48px rgba(201,168,76,0.1)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#3A3A3A';
                    e.currentTarget.style.transform   = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#2A2A2A';
                    e.currentTarget.style.transform   = 'translateY(0)';
                  }
                }}
              >
                {/* Gold top bar when selected */}
                <div style={{
                  position:   'absolute',
                  top:        0, left: 0, right: 0,
                  height:     3,
                  background: isSelected
                    ? 'linear-gradient(90deg, var(--gold-light), var(--gold))'
                    : 'transparent',
                  transition: 'background 0.3s',
                }}/>

                {/* Best value badge */}
                {plan.badge && (
                  <div style={{
                    position:      'absolute',
                    top:           '1.25rem',
                    right:         '1.25rem',
                    background:    'linear-gradient(135deg, var(--gold-light), var(--gold))',
                    color:         'var(--black)',
                    fontSize:      '0.7rem',
                    fontWeight:    500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding:       '0.3rem 0.75rem',
                    borderRadius:  20,
                  }}>{plan.badge}</div>
                )}

                {/* Radio dot */}
                <div style={{
                  width:         20,
                  height:        20,
                  borderRadius:  '50%',
                  border:        `2px solid ${isSelected ? 'var(--gold)' : '#3A3A3A'}`,
                  background:    isSelected ? 'var(--gold)' : 'transparent',
                  marginBottom:  '1.75rem',
                  transition:    'all 0.25s',
                  display:       'flex',
                  alignItems:    'center',
                  justifyContent:'center',
                }}>
                  {isSelected && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--black)' }}/>
                  )}
                </div>

                {/* Plan label */}
                <div style={{
                  fontSize:      '0.8rem',
                  fontWeight:    500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color:         isSelected ? 'var(--gold)' : 'var(--cream-dim)',
                  marginBottom:  '0.75rem',
                  transition:    'color 0.3s',
                }}>{plan.label}</div>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.3rem' }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize:   '3.2rem',
                    fontWeight: 600,
                    color:      isSelected ? 'var(--gold)' : 'var(--white)',
                    lineHeight: 1,
                    transition: 'color 0.3s',
                  }}>{plan.price}</span>
                </div>
                <div style={{
                  fontSize:     '0.85rem',
                  color:        'var(--cream-dim)',
                  marginBottom: '2rem',
                }}>{plan.period}</div>

                <hr style={{ border: 'none', borderTop: '1px solid #2A2A2A', marginBottom: '1.75rem' }}/>

                {/* Features */}
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {plan.features.map(feat => (
                    <li key={feat} style={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        '0.65rem',
                      fontSize:   '0.9rem',
                      color:      isSelected ? 'var(--cream)' : 'var(--cream-dim)',
                      transition: 'color 0.3s',
                    }}>
                      <span style={{
                        width:          18,
                        height:         18,
                        borderRadius:   '50%',
                        background:     isSelected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                        border:         `1px solid ${isSelected ? 'var(--gold-dim)' : '#2A2A2A'}`,
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        fontSize:       '0.65rem',
                        color:          isSelected ? 'var(--gold)' : 'var(--green)',
                        flexShrink:     0,
                        transition:     'all 0.3s',
                      }}>✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Subscribe CTA */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="btn-gold"
            style={{
              fontSize:   '1.05rem',
              padding:    '1rem 4rem',
              minWidth:   280,
              opacity:    loading ? 0.75 : 1,
              cursor:     loading ? 'not-allowed' : 'pointer',
              position:   'relative',
            }}
          >
            {loading
              ? 'Opening payment...'
              : `Subscribe — ${selectedPlan?.price} / ${selected === 'monthly' ? 'month' : 'year'}`}
          </button>

          <p style={{
            color:      'var(--cream-dim)',
            fontSize:   '0.82rem',
            marginTop:  '1.25rem',
            lineHeight: 1.7,
          }}>
            Secure payment via Razorpay &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; 10% minimum to your chosen charity
          </p>
        </div>

        {/* Trust row */}
        <div style={{
          display:        'flex',
          justifyContent: 'center',
          gap:            '3rem',
          marginTop:      '3rem',
          paddingTop:     '2.5rem',
          borderTop:      '1px solid #2A2A2A',
          flexWrap:       'wrap',
        }}>
          {[
            { icon: '🔒', text: 'PCI-compliant payments' },
            { icon: '♥',  text: '10%+ always to charity'  },
            { icon: '↩',  text: 'Cancel anytime'           },
            { icon: '🏆', text: 'Monthly prize draws'      },
          ].map(item => (
            <div key={item.text} style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '0.5rem',
              color:      'var(--cream-dim)',
              fontSize:   '0.82rem',
            }}>
              <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        {/* Already subscribed link */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background:  'transparent',
              color:       'var(--cream-dim)',
              fontSize:    '0.85rem',
              padding:     '0.5rem',
              transition:  'color 0.2s',
              cursor:      'pointer',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--gold)'}
            onMouseLeave={e => e.target.style.color = 'var(--cream-dim)'}
          >
            Already subscribed? Go to dashboard →
          </button>
        </div>

      </div>
    </div>
  );
}