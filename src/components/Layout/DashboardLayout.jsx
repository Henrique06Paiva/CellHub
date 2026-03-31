import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, UserCircle2, Home, ShieldCheck, Network, Users as UsersIcon, PanelLeftClose, Menu, ChevronDown, FileText, Calendar, User, Globe } from 'lucide-react';
import { SeedDevTool } from '../SeedDevTool';

const DashboardLayout = () => {
  const { currentUser, userData, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      case 'root': return 'Administrador';
      default: return 'Usuário';
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: 'var(--bg-color)', overflow: 'hidden', display: 'flex' }}>
      
      {/* Sidebar */}
      <nav style={{
        width: isSidebarOpen ? '260px' : '80px',
        height: '100%',
        background: 'var(--surface-color)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        flexShrink: 0
      }}>
        {/* Brand Header */}
        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', padding: isSidebarOpen ? '0 1.5rem' : '0', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          {isSidebarOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <span style={{ 
                fontWeight: '900', 
                fontSize: '1.75rem', 
                background: 'linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent', 
                letterSpacing: '-0.04em', 
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Nexo-Hub
              </span>
            </div>
          ) : (
            <span style={{ 
              fontWeight: '900', 
              fontSize: '1.5rem', 
              background: 'linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.04em'
            }}>
              N
            </span>
          )}
          
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: isSidebarOpen ? 'flex' : 'none', padding: '0.5rem', borderRadius: '6px' }} onMouseOver={e=>e.currentTarget.style.background='var(--surface-hover)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
             <PanelLeftClose size={20} />
          </button>
        </div>

        {/* Modules Navigation */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', overflowX: 'hidden', padding: '1.5rem 1rem' }}>
          
           <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: isSidebarOpen ? '0.5rem' : '0', textAlign: isSidebarOpen ? 'left' : 'center', opacity: isSidebarOpen ? 1 : 0.6 }}>
             {isSidebarOpen ? 'Painel Geral' : '•••'}
           </div>

           {/* PAINEL ADMIN (ROOT ONLY) */}
           {userData?.role?.toLowerCase() === 'root' && (
             <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem', paddingLeft: isSidebarOpen ? '0.5rem' : '0' }}>Admin</div>
                <NavLink to="/admin/networks" className={({ isActive }) => isActive ? 'nav-item solid-active' : 'nav-item'} style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '0.75rem 1rem' : '0.75rem 0' }} title="Gestão de Redes">
                  <Globe size={20} style={{ flexShrink: 0 }} />
                  {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Gestão de Redes</span>}
                </NavLink>
                <NavLink to="/admin/cells" className={({ isActive }) => isActive ? 'nav-item solid-active' : 'nav-item'} style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '0.75rem 1rem' : '0.75rem 0' }} title="Gestão de Células">
                  <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                  {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Gestão de Células</span>}
                </NavLink>
             </div>
           )}

           {/* PAINEL DISCIPULADOR */}
           {userData?.role?.toLowerCase() === 'discipulador' && (
             <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem', paddingLeft: isSidebarOpen ? '0.5rem' : '0' }}>Supervisão</div>
                <NavLink to="/admin/cells" className={({ isActive }) => isActive ? 'nav-item solid-active' : 'nav-item'} style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '0.75rem 1rem' : '0.75rem 0' }} title="Gestão de Células">
                  <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                  {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Gestão de Células</span>}
                </NavLink>
                <NavLink to="/network" className={({ isActive }) => isActive ? 'nav-item solid-active' : 'nav-item'} style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '0.75rem 1rem' : '0.75rem 0' }} title="Visão da Rede">
                  <Network size={20} style={{ flexShrink: 0 }} />
                  {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Visão da Rede</span>}
                </NavLink>
             </div>
           )}

           {/* PAINEL LÍDER / MEMBRO */}
           {(['lider', 'leader', 'membro', 'member'].includes(userData?.role?.toLowerCase())) && (
             <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem', paddingLeft: isSidebarOpen ? '0.5rem' : '0' }}>Operacional</div>
                <NavLink to="/my-cell" className={({ isActive }) => isActive ? 'nav-item solid-active' : 'nav-item'} style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '0.75rem 1rem' : '0.75rem 0' }} title="Minha Célula">
                  <Home size={20} style={{ flexShrink: 0 }} />
                  {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Minha Célula</span>}
                </NavLink>
                
                {['lider', 'leader'].includes(userData?.role?.toLowerCase()) && (
                  <NavLink to="/my-cell/manage" className={({ isActive }) => isActive ? 'nav-item solid-active' : 'nav-item'} style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '0.75rem 1rem' : '0.75rem 0' }} title="Gestão de Membros">
                    <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                    {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Gestão de Membros</span>}
                  </NavLink>
                )}
             </div>
           )}

           {/* FERRAMENTAS COMUNS */}
           <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: isSidebarOpen ? '0.5rem' : '0' }}>Sistema</div>
              
              {['root', 'discipulador', 'lider', 'leader'].includes(userData?.role?.toLowerCase()) && (
                <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-item solid-active' : 'nav-item'} style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '0.75rem 1rem' : '0.75rem 0' }} title="Gestão de Usuários">
                  <UsersIcon size={20} style={{ flexShrink: 0 }} />
                  {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Gestão de Usuários</span>}
                </NavLink>
              )}
              
              <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-item solid-active' : 'nav-item'} style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '0.75rem 1rem' : '0.75rem 0' }} title="Gestão de Relatórios">
                <FileText size={20} style={{ flexShrink: 0 }} />
                {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Gestão de Relatórios</span>}
              </NavLink>

              <button className="nav-item" disabled style={{ justifyContent: isSidebarOpen ? 'flex-start' : 'center', padding: isSidebarOpen ? '0.75rem 1rem' : '0.75rem 0', opacity: 0.35, cursor: 'not-allowed', background: 'transparent', border: 'none', color: 'var(--text-muted)', width: '100%' }} title="Gestão de Eventos (Em breve)">
                <Calendar size={20} style={{ flexShrink: 0 }} />
                {isSidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Gestão de Eventos</span>}
              </button>
           </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        
        {/* Background Orbs */}
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '40vw', height: '40vw', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '40vw', height: '40vw', background: 'rgba(16, 185, 129, 0.03)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

        {/* Top Header */}
        <header style={{ height: '70px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', zIndex: 20, flexShrink: 0 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', padding: '0.5rem', borderRadius: '6px', transition: 'background 0.2s' }} 
                onMouseOver={e => e.currentTarget.style.background='var(--surface-hover)'} 
                onMouseOut={e => e.currentTarget.style.background='transparent'}
                title="Expandir Menu"
              >
                <Menu size={20} />
              </button>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                background: isProfileOpen ? 'var(--surface-hover)' : 'transparent', 
                border: '1px solid', 
                borderColor: isProfileOpen ? 'var(--border-color)' : 'transparent', 
                padding: '0.25rem 0.75rem 0.25rem 0.25rem', 
                borderRadius: '40px', 
                cursor: 'pointer', 
                transition: 'all 0.2s', 
                boxShadow: isProfileOpen ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' 
              }}
              onMouseOver={e => { if(!isProfileOpen){ e.currentTarget.style.background = 'var(--surface-hover)'; } }}
              onMouseOut={e => { if(!isProfileOpen){ e.currentTarget.style.background = 'transparent'; } }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.15)', border: '2px solid rgba(79, 70, 229, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
                <UserCircle2 size={22} />
              </div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', paddingRight: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.2' }}>{userData?.name || currentUser?.email?.split('@')[0]}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--primary-light)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{getRoleName(userData?.role)}</span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                right: 0, 
                marginTop: '0.5rem', 
                background: 'var(--surface-color)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.35)', 
                width: '230px', 
                overflow: 'hidden', 
                padding: '0.5rem', 
                zIndex: 100 
              }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Conectado como</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.email}</div>
                </div>
                
                <button 
                  onClick={() => { setIsProfileOpen(false); /* navigate('/profile') future */ }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', fontWeight: '500', borderRadius: '8px', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <User size={16} /> Meu Perfil
                </button>
                
                <button 
                  onClick={logout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', fontWeight: '500', borderRadius: '8px', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={16} /> Sair da conta
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', position: 'relative', zIndex: 10 }}>
          <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </main>

      </div>
      
      {/* Dev Tool: Injetor de Mocks Firebase */}
      <SeedDevTool />
    </div>
  );
};

export default DashboardLayout;
