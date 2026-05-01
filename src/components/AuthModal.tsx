'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';

interface Props { onAuthed: () => void; }

export default function AuthModal({ onAuthed }: Props) {
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async () => {
    const sb = getSupabase();
    if (!sb) { setError('Supabase not configured'); return; }
    setLoading(true); setError('');
    if (tab === 'in') {
      const { error: e } = await sb.auth.signInWithPassword({ email, password });
      if (e) { setError(e.message); setLoading(false); return; }
      onAuthed();
    } else {
      const { error: e } = await sb.auth.signUp({ email, password });
      if (e) { setError(e.message); setLoading(false); return; }
      setDone(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="pm-fu" style={{ width: 420, background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div className="pm-logo" style={{ margin: 0 }}>PM</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Portfolio Terminal</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>Private market intelligence</div>
          </div>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✉️</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Check your email</div>
            <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.6 }}>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.</div>
            <button className="pm-btn" style={{ marginTop: 20, width: '100%' }} onClick={() => { setDone(false); setTab('in'); }}>Back to Sign In</button>
          </div>
        ) : (
          <>
            <div className="pm-vtabs" style={{ marginBottom: 22 }}>
              {([['in', 'Sign In'], ['up', 'Create Account']] as ['in' | 'up', string][]).map(([k, l]) => (
                <div key={k} className={`pm-vtab ${tab === k ? 'on' : ''}`} style={{ flex: 1, textAlign: 'center' }} onClick={() => setTab(k)}>{l}</div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="pm-fg">
                <div className="pm-fl">Email</div>
                <input className="pm-fi" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handle()} />
              </div>
              <div className="pm-fg">
                <div className="pm-fl">Password</div>
                <input className="pm-fi" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handle()} />
              </div>
              {error && <div style={{ fontSize: 11, color: 'var(--red)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}
              <button className="pm-btn pri" style={{ width: '100%', marginTop: 4, padding: '10px 0', fontSize: 12 }} onClick={handle} disabled={loading}>
                {loading ? 'Loading…' : tab === 'in' ? 'Sign In →' : 'Create Account →'}
              </button>
            </div>

            <div style={{ fontSize: 10, color: 'var(--txt3)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              {tab === 'in' ? "Don't have an account? " : 'Already have an account? '}
              <span style={{ color: 'var(--indigo)', cursor: 'pointer' }} onClick={() => setTab(tab === 'in' ? 'up' : 'in')}>
                {tab === 'in' ? 'Create one' : 'Sign in'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
