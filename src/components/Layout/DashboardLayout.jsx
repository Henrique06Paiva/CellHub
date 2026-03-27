import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, LayoutDashboard, Component, Users as UsersIcon } from 'lucide-react';

const DashboardLayout = () => {
  const { currentUser, userData, logout } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const getRoleName = (role) => {
    switch(role) {
      case 'discipler': return 'Discipulador';
      case 'leader': return 'Líder de Célula';
      case 'member': return 'Membro';
      default: return 'Usuário';
    }
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div style={{ padding: '0.5rem 0', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Component size={28} color="var(--primary-color)" />
            <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--text-main)' }}>CelSys</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {(userData?.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{userData?.name || currentUser?.email}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getRoleName(userData?.role)}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500' }}>
            <LayoutDashboard size={20} />
            Meu Painel
          </div>
          {/* Add more nav items depending on user.role if needed */}
        </div>

        <button 
          onClick={logout}
          style={{ marginTop: 'auto', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger-color)', borderRadius: '8px', transition: 'background-color 0.2s', textAlign: 'left', width: '100%' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <LogOut size={20} />
          <span style={{ fontWeight: '500' }}>Sair da conta</span>
        </button>
      </nav>

      <main className="main-content">
        <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
