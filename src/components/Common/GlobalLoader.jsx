import React from 'react';
import { useGlobal } from '../../contexts/GlobalContext';
import { Loader2 } from 'lucide-react';

const GlobalLoader = () => {
  const { isLoading, loadingMessage } = useGlobal();

  if (!isLoading) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'rgba(15, 23, 42, 0.75)', 
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 10000,
      gap: '1.5rem',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{ 
        color: 'var(--primary-color)',
        animation: 'spin 1s linear infinite'
      }}>
        <Loader2 size={56} strokeWidth={2.5} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ 
          margin: 0, 
          fontSize: '1.25rem', 
          fontWeight: '700', 
          color: 'var(--text-main)',
          letterSpacing: '-0.02em'
        }}>{loadingMessage}</p>
        <p style={{ 
          margin: '0.25rem 0 0', 
          fontSize: '0.875rem', 
          color: 'var(--text-muted)'
        }}>Por favor, aguarde um momento.</p>
      </div>
      
      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoader;
