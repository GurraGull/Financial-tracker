'use client';

import { Component, type ReactNode } from 'react';
import Shell from '@/components/Shell';

interface State { error: Error | null }

class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#060912', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 600, fontFamily: 'monospace' }}>
            <div style={{ fontSize: 13, color: '#FF6B6B', fontWeight: 700, marginBottom: 12 }}>Runtime Error</div>
            <div style={{ fontSize: 12, color: '#FF6B6B', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 8, padding: '12px 16px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {this.state.error.message}
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {this.state.error.stack}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppPage() {
  return <ErrorBoundary><Shell /></ErrorBoundary>;
}
