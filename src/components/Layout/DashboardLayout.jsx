import React from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Component, UserCircle2, Home, ShieldCheck, Network, Users as UsersIcon } from 'lucide-react';
import { SeedDevTool } from '../SeedDevTool';

const DashboardLayout = () => {
  const { currentUser, userData, logout } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const getRoleName = (role) => {
    switch(role?.toLowerCase()) {
      case 'discipulador': return 'Discipulador';
      case 'lider': return 'Líder de Célula';
      case 'leader': return 'Líder de Célula';
      case 'membro': return 'Membro';
      case 'member': return 'Membro';
      default: return 'Usuário';
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: 'var(--bg-color)', overflow: 'hidden', display: 'flex' }}>
      {/* Background Orbs baseados na tela de Login para Premium Feel */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw', background: 'rgba(37, 99, 235, 0.06)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '50vw', height: '50vw', background: 'rgba(16, 185, 129, 0.04)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }} />

      {/* Floating Glass Sidebar */}
      <nav className="glass-panel" style={{
        width: '280px',
        margin: '1.5rem 0 1.5rem 1.5rem',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        padding: '1.5rem',
        boxShadow: '0 10px 40px rgba(37, 99, 235, 0.05)'
      }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)', padding: '0.5rem', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
            <Component size={24} />
          </div>
          <span style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>CellHub</span>
        </div>

        {/* User Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem', background: 'rgba(255,255,255,0.7)', borderRadius: '16px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.9)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8)' }}>
          <div style={{ color: 'var(--primary-color)' }}>
            <UserCircle2 size={38} strokeWidth={1.2} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {userData?.name || currentUser?.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {getRoleName(userData?.role)}
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Modules */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
          
          {/* Module: Pessoal */}
          {(['membro', 'member', 'lider', 'leader'].includes(userData?.role?.toLowerCase())) && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                Pessoal
              </div>
              <NavLink to="/my-cell" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} title="Informações e membros da sua célula atual">
                <Home size={18} /> Minha Célula
              </NavLink>
            </div>
          )}

          {/* Module: Liderança */}
          {['lider', 'leader'].includes(userData?.role?.toLowerCase()) && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '0.5rem', marginTop: '0.5rem' }}>
                Liderança
              </div>
              <NavLink to="/manage" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} title="Administre relatórios e presença dos seus membros">
                <ShieldCheck size={18} /> Gestão da Célula
              </NavLink>
            </div>
          )}

          {/* Module: Supervisão */}
          {('discipulador' === userData?.role?.toLowerCase() || 'root' === userData?.role?.toLowerCase()) && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                Supervisão Global
              </div>
              <NavLink to="/network" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} title="Visão hierárquica e saúde das células">
                <Network size={18} /> Visão da Rede
              </NavLink>
            </div>
          )}

          {/* Module: Administrativo */}
          {['root', 'discipulador', 'lider', 'leader'].includes(userData?.role?.toLowerCase()) && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '0.5rem', marginTop: '0.5rem' }}>
                Administrativo
              </div>
              <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} title="Gestão de Usuários e Acessos">
                <UsersIcon size={18} /> Gestão de Usuários
              </NavLink>
            </div>
          )}
        </div>

        <button 
          onClick={logout}
          className="nav-logout"
          style={{ marginTop: '1rem' }}
        >
          <LogOut size={18} />
          <span>Sair da conta</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, height: '100%', overflowY: 'auto', padding: '2.5rem', zIndex: 1, position: 'relative' }}>
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <Outlet />
        </div>
      </main>
      
      {/* Dev Tool: Injetor de Mocks Firebase */}
      <SeedDevTool />
    </div>
  );
};

export default DashboardLayout;
