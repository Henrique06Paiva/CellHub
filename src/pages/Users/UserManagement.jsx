import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Search, X, MoreVertical, Edit2, Trash2, Power, Eye } from 'lucide-react';
import { UserRegistrationModal } from '../../components/Users/UserRegistrationModal';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement = () => {
  const { userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
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
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
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

      <div className="card static" style={{ padding: '0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
        
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
                  background: statusFilter === status ? 'rgba(37, 99, 235, 0.15)' : 'rgba(0,0,0,0.03)',
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
          <button onClick={() => setIsModalOpen(true)} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--primary-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--primary-color)'}>
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
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left' }}>Código</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left' }}>Nome Completo</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left' }}>E-mail</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left' }}>Cadastrado em</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', borderRight: '1px solid var(--border-color)', fontWeight: '700', fontSize: '0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1rem', textAlign: 'center', fontWeight: '700', fontSize: '0.75rem' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nenhum usuário encontrado na pesquisa.</td></tr>
                ) : (
                  currentUsers.map((user, idx) => (
                    <tr key={user.id} style={{ cursor: 'default', background: idx % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid var(--border-color)' }} onMouseOver={e => e.currentTarget.style.background = '#e0e7ff'} onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#f8fafc'}>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {user.id || '---'}
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
                          onView={() => setSelectedUser(user)}
                          onEdit={() => { setUserToEdit(user); setIsModalOpen(true); }}
                          onDelete={() => setUserToDelete(user)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
            
            <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', background: 'white', flexShrink: 0 }}>
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

      <UserRegistrationModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setUserToEdit(null); }} 
        userToEdit={userToEdit}
      />

      {/* Slide-out details modal */}
      {selectedUser && (
        <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Trash2 size={32} />
            </div>
            <h3 style={{ marginTop: 0, marginBottom: '0.75rem', color: '#0f172a', fontSize: '1.25rem', fontWeight: '700' }}>Confirmar Exclusão</h3>
            <p style={{ margin: '0 0 2rem', color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Você tem certeza que deseja excluir o usuário <strong>{userToDelete.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setUserToDelete(null)} 
                style={{ flex: 1, padding: '0.75rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'} 
                onMouseOut={e => e.currentTarget.style.background = 'white'}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteUser} 
                style={{ flex: 1, padding: '0.75rem', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.background = '#dc2626'} 
                onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getRoleBadgeStyle = (role) => {
  switch(role?.toLowerCase()) {
    case 'root': return { backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#9333ea', borderColor: 'rgba(168, 85, 247, 0.3)' };
    case 'discipulador': return { backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.3)' };
    case 'lider': return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.3)' };
    case 'leader': return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.3)' };
    default: return { backgroundColor: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-muted)', borderColor: 'rgba(100, 116, 139, 0.3)' };
  }
};

const UserDetailsModal = ({ user, onClose }) => {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }}>
      <div className="card static" style={{ width: '100%', maxWidth: '420px', height: '100%', borderRadius: '0', borderLeft: '1px solid rgba(255,255,255,0.8)', overflowY: 'auto', background: 'rgba(255,255,255,0.95)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>Perfil de Usuário</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '50%' }}><X size={20} /></button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ width: '88px', height: '88px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '2.5rem', margin: '0 auto 1.25rem', boxShadow: '0 10px 25px rgba(37,99,235,0.2)' }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.25rem' }}>{user.name}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <span style={{ 
              padding: '0.35rem 1rem', 
              borderRadius: '999px', 
              fontSize: '0.75rem', 
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '1px solid',
              ...getRoleBadgeStyle(user.role)
            }}>
              {user.role || 'Membro'}
            </span>
            {user.status === 'inativo' ? (
              <span style={{ padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                Inativo
              </span>
            ) : (
              <span style={{ padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                Ativo
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Acesso & Contato</div>
            <div style={{ fontWeight: '500', color: 'var(--text-main)', marginBottom: '0.25rem' }}>E-mail: {user.email}</div>
            <div style={{ color: 'var(--text-muted)' }}>Telefone: {user.phone || 'Não informado'}</div>
          </div>
          
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Dados Pessoais</div>
            <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>Idade: {user.age ? `${user.age} anos` : 'Não informada'}</div>
            <div style={{ color: 'var(--text-muted)' }}>CEP: {user.cep || 'Não informado'}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Dados do Sistema</div>
            <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>Célula: {user.cellName ? <span style={{ fontWeight: '600' }}>{user.cellName}</span> : <span style={{ color: 'var(--text-muted)' }}>Sem célula</span>}</div>
            <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>ID Cloud: <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--surface-hover)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{user.id}</span></div>
            <div style={{ color: 'var(--text-muted)' }}>Data de criação: {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '-'}</div>
          </div>
        </div>
      </div>
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
          <div style={{ position: 'absolute', right: '0', top: '100%', marginTop: '0.25rem', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', zIndex: 20, minWidth: '180px', overflow: 'hidden', padding: '0.5rem 0' }}>
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
