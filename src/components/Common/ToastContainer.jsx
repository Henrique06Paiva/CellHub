import React from 'react';
import { useGlobal } from '../../contexts/GlobalContext';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = useGlobal();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10002,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      alignItems: 'center',
      pointerEvents: 'none',
      width: 'max-content',
      maxWidth: '90vw'
    }}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle2 size={20} color="var(--success-color)" />;
      case 'error': return <AlertCircle size={20} color="var(--danger-color)" />;
      case 'warning': return <AlertTriangle size={20} color="#f59e0b" />;
      default: return <Info size={20} color="var(--primary-light)" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success': return 'rgba(16, 185, 129, 0.3)';
      case 'error': return 'rgba(239, 68, 68, 0.3)';
      case 'warning': return 'rgba(245, 158, 11, 0.3)';
      default: return 'rgba(79, 70, 229, 0.3)';
    }
  };

  return (
    <div className="toast-item" style={{
      pointerEvents: 'auto',
      background: 'rgba(30, 41, 59, 0.9)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${getBorderColor()}`,
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      animation: 'toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      minWidth: '320px'
    }}>
      <div style={{ flexShrink: 0 }}>
        {getIcon()}
      </div>
      <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)', lineHeight: '1.4' }}>
        {toast.message}
      </div>
      <button 
        onClick={onClose}
        style={{ 
          background: 'transparent', 
          border: 'none', 
          padding: '0.25rem', 
          borderRadius: '4px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        <X size={16} />
      </button>

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .toast-item {
          max-width: 450px;
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
