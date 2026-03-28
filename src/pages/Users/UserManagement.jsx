import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Search, MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', userToDelete.id));
      setUserToDelete(null);
    } catch (err) {
      console.error("Erro ao excluir", err);
      alert("Erro ao excluir usuário. Verifique suas permissões.");
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('name'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(user => {
    const displayIdStr = user.displayId ? String(user.displayId) : '';
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          displayIdStr.includes(searchTerm);
    if (!matchesSearch) return false;
    
    // Status normalization: undefined/null usually means active in our legacy data
    const currentStatus = user.status || 'ativo';
    
    if (statusFilter === 'Ativo') return currentStatus === 'ativo';
    if (statusFilter === 'Inativo') return currentStatus === 'inativo';
    if (statusFilter === 'Bloqueado') return currentStatus === 'bloqueado';
    return true; // Todos
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0 }}>Gestão de Usuários</h1>
        </div>
      </div>

      <div className="card static" style={{ padding: '0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface-color)' }}>
        
        {/* Top Toolbox Area */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px', borderRadius: '6px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Pesquisar usuário" 
              style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', background: 'transparent', border: 'none', fontSize: '0.875rem', color: 'var(--text-main)', outline: 'none' }}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 0.25rem' }} />

          {/* Status Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {['Todos', 'Ativo', 'Inativo', 'Bloqueado'].map(status => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  background: statusFilter === status ? 'rgba(79, 70, 229, 0.15)' : 'rgba(0,0,0,0.03)',
                  color: statusFilter === status ? 'var(--primary-color)' : 'var(--text-muted)'
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }}></div>

          {/* Action Button */}
          <button onClick={() => navigate('/users/new')} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--primary-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--primary-color)'}>
            <Plus size={18} />
            Novo
          </button>
        </div>

        {/* Table Title Block */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.125rem', color: 'var(--primary-color)', fontWeight: '700', margin: 0 }}>Lista de Usuários</h2>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando dados globais...</div>
        ) : (
          <>
            <div style={{ overflow: 'auto', flex: 1 }}>
              <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left' }}>Código</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left' }}>Nome Completo</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left' }}>E-mail</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left' }}>Cadastrado em</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', textAlign: 'center', fontWeight: '700', fontSize: '0.75rem' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nenhum usuário encontrado na pesquisa.</td></tr>
                ) : (
                  currentUsers.map((user, idx) => (
                    <tr key={user.id} style={{ cursor: 'default', background: idx % 2 === 0 ? 'var(--surface-color)' : 'var(--surface-hover)', borderBottom: '1px solid var(--border-color)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)'} onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? 'var(--surface-color)' : 'var(--surface-hover)'}>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--primary-light)', fontWeight: '700', fontFamily: 'monospace' }}>
                        {user.displayId ? `#${String(user.displayId).padStart(3, '0')}` : '---'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: '500' }}>
                        {user.name}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '500', color: user.status === 'inativo' ? '#ef4444' : user.status === 'bloqueado' ? '#f59e0b' : '#10b981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: user.status === 'inativo' ? '#ef4444' : user.status === 'bloqueado' ? '#f59e0b' : '#10b981', flexShrink: 0 }} />
                          {user.status === 'inativo' ? 'Inativo' : user.status === 'bloqueado' ? 'Bloqueado' : 'Ativo'}
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <UserActionsDropdown 
                          user={user} 
                          onView={() => navigate(`/users/${user.id}`)}
                          onEdit={() => navigate(`/users/${user.id}/edit`)}
                          onDelete={() => setUserToDelete(user)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
            
            <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', background: 'var(--surface-color)', flexShrink: 0 }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                {indexOfFirstUser + 1} - {Math.min(indexOfLastUser, filteredUsers.length)} de {filteredUsers.length} Resultados
              </span>
              
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)' }}>
                    &lt;
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', 
                        background: currentPage === i + 1 ? '#93c5fd' : 'transparent', 
                        color: currentPage === i + 1 ? '#1e3a8a' : 'var(--text-main)', 
                        border: 'none', cursor: 'pointer', fontWeight: '600',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
                      }}
                      onMouseOver={e => { if (currentPage !== i + 1) e.currentTarget.style.background = 'rgba(0,0,0,0.05)' }}
                      onMouseOut={e => { if (currentPage !== i + 1) e.currentTarget.style.background = 'transparent' }}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)' }}>
                    &gt;
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal using Portal to cover sidebar */}
      {userToDelete && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setUserToDelete(null)}>
          <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', width: '90%', maxWidth: '360px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={e => e.stopPropagation()}>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              A exclusão do usuário <strong>{userToDelete.name}</strong> é permanente. Deseja continuar?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                onClick={() => setUserToDelete(null)} 
                style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', fontWeight: '500', cursor: 'pointer', fontSize: '0.875rem', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'} 
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteUser} 
                style={{ padding: '0.5rem 1rem', background: '#ef4444', border: 'none', color: 'white', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', fontSize: '0.875rem', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#dc2626'} 
                onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const UserActionsDropdown = ({ user, onEdit, onDelete, onView }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '0.5rem', color: 'var(--text-muted)', background: 'transparent', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        title="Opções"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setIsOpen(false)} />
          <div style={{ position: 'absolute', right: '0', top: '100%', marginTop: '0.25rem', background: 'var(--surface-color)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', zIndex: 20, minWidth: '180px', overflow: 'hidden', padding: '0.5rem 0' }}>
            <button 
              onClick={() => { setIsOpen(false); onView(); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <Eye size={16} /> Ver Detalhes
            </button>
            <button 
              onClick={() => { setIsOpen(false); onEdit(); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <Edit2 size={16} /> Editar
            </button>
            <button 
              onClick={() => { 
                if (user.status === 'inativo') {
                  setIsOpen(false); 
                  onDelete();
                }
              }}
              disabled={user.status !== 'inativo'}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', color: user.status === 'inativo' ? '#ef4444' : '#fca5a5', fontSize: '0.875rem', cursor: user.status === 'inativo' ? 'pointer' : 'not-allowed', textAlign: 'left', fontWeight: '500', opacity: user.status === 'inativo' ? 1 : 0.6 }}
              onMouseOver={e => { if (user.status === 'inativo') e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)' }}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <Trash2 size={16} /> Excluir
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;
