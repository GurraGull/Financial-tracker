'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div style={{ minHeight: '100vh', background: '#060912', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 600, fontFamily: 'monospace' }}>
        <div style={{ fontSize: 13, color: '#FF6B6B', fontWeight: 700, marginBottom: 12 }}>Runtime Error</div>
        <div style={{ fontSize: 12, color: '#FF6B6B', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 8, padding: '12px 16px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {error.message}
        </div>
        {error.digest && (
          <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>digest: {error.digest}</div>
        )}
        <div style={{ fontSize: 11, color: '#475569', marginTop: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {error.stack}
        </div>
        <button
          onClick={reset}
          style={{ marginTop: 20, padding: '8px 16px', background: 'rgba(99,91,255,0.15)', border: '1px solid rgba(99,91,255,0.4)', borderRadius: 6, color: '#635BFF', fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
