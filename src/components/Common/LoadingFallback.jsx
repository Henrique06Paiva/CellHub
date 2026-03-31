import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div style={{ 
    height: '100vh', 
    width: '100vw',
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '1.25rem', 
    background: 'var(--bg-color, #0f172a)',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999
  }}>
    <div style={{ 
      animation: 'spin 1s linear infinite',
      color: 'var(--primary-color, #4f46e5)'
    }}>
      <Loader2 size={42} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      <span style={{ color: 'var(--text-main, #f8fafc)', fontSize: '1rem', fontWeight: '600' }}>Nexo-Hub</span>
      <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem' }}>Preparando ambiente...</span>
    </div>
    <style>{`
      @keyframes spin { 
        from { transform: rotate(0deg); } 
        to { transform: rotate(360deg); } 
      }
    `}</style>
  </div>
);

export default LoadingFallback;
