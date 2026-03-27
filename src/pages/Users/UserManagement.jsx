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
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Tem certeza que deseja EXCLUIR permanentemente o usuário ${user.name}? Esta ação não pode ser desfeita e removerá o acesso dele.`)) {
      try {
        await deleteDoc(doc(db, 'users', user.id));
      } catch (err) {
        console.error("Erro ao excluir", err);
        alert("Erro ao excluir usuário. Verifique suas permissões.");
      }
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'inativo' ? 'ativo' : 'inativo';
    const acaoText = user.status === 'inativo' ? 'ativar' : 'desativar';
    if (window.confirm(`Tem certeza que deseja ${acaoText} a conta de ${user.name}?`)) {
      try {
        await updateDoc(doc(db, 'users', user.id), { status: newStatus });
      } catch (err) {
        console.error("Erro ao alterar status", err);
        alert("Erro ao alterar status do usuário.");
      }
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

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexShrink: 0 }}>
        <div>
          <h1>Gestão de Usuários</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gerencie as contas do sistema hierarquicamente.</p>
        </div>
        
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          <span>Novo Usuário</span>
        </button>
      </div>

      <div className="card static" style={{ padding: '0', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..." 
              style={{ width: '100%', paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.7)' }}
              value={searchTerm}
              onChange={(e) => { 
                setSearchTerm(e.target.value); 
                setCurrentPage(1); 
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando dados globais...</div>
        ) : (
          <>
            <div style={{ overflow: 'auto', flex: 1 }}>
              <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Contato</th>
                  <th>Nível</th>
                  <th>Cadastro</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Nenhum usuário encontrado na pesquisa.</td></tr>
                ) : (
                  currentUsers.map(user => (
                    <tr key={user.id} style={{ cursor: 'default', opacity: user.status === 'inativo' ? 0.65 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: user.status === 'inativo' ? 'var(--border-color)' : 'var(--primary-hover)', color: user.status === 'inativo' ? 'var(--text-muted)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.name}</span>
                            {user.status === 'inativo' && (
                              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase' }}>Inativo</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>{user.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.phone || 'Sem telefone'}</div>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '0.35rem 0.85rem', 
                          borderRadius: '999px', 
                          fontSize: '0.7rem', 
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          border: '1px solid',
                          ...getRoleBadgeStyle(user.role)
                        }}>
                          {user.role || 'Membro'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <UserActionsDropdown 
                          user={user} 
                          onView={() => setSelectedUser(user)}
                          onEdit={() => { setUserToEdit(user); setIsModalOpen(true); }}
                          onDelete={() => handleDeleteUser(user)}
                          onToggleStatus={() => handleToggleStatus(user)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
            
            {totalPages > 1 && (
              <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Mostrando {indexOfFirstUser + 1} a {Math.min(indexOfLastUser, filteredUsers.length)} de {filteredUsers.length} usuários
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '0.35rem 0.85rem', border: '1px solid var(--border-color)', background: currentPage === 1 ? 'rgba(0,0,0,0.02)' : 'white', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '0.875rem', transition: 'all 0.2s', fontWeight: '500' }}
                  >
                    Anterior
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '0.35rem 0.85rem', border: '1px solid var(--border-color)', background: currentPage === totalPages ? 'rgba(0,0,0,0.02)' : 'white', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '0.875rem', transition: 'all 0.2s', fontWeight: '500' }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
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

const UserActionsDropdown = ({ user, onEdit, onDelete, onToggleStatus, onView }) => {
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
              onClick={() => { setIsOpen(false); onToggleStatus(); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', color: user.status === 'inativo' ? '#059669' : '#d97706', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <Power size={16} /> {user.status === 'inativo' ? 'Reativar Conta' : 'Desativar Conta'}
            </button>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
            <button 
              onClick={() => { setIsOpen(false); onDelete(); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <Trash2 size={16} /> Excluir permanentemente
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;
