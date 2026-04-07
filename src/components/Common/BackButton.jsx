import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ to, onClick, tooltip = 'Voltar' }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      title={tooltip}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
      onMouseOut={(e) => (e.currentTarget.style.background = 'var(--surface-color)')}
    >
      <ArrowLeft size={20} color="var(--text-muted)" />
    </button>
  );
};

export default BackButton;
