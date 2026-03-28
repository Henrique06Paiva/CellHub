import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Shield, Users, MapPin, Calendar, Power, ChevronDown } from 'lucide-react';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, registerUserFromAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(!!id);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', age: '', cep: '', role: 'membro', cellId: '', status: 'ativo'
  });
  const [cells, setCells] = useState([]);

  useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', id));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFormData({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              age: data.age || '',
              cep: data.cep || '',
              role: data.role || 'membro',
              cellId: data.cellId || '',
              status: data.status || 'ativo'
            });
          } else {
            setError('Usuário não encontrado.');
          }
        } catch (err) {
          setError('Erro ao buscar dados do usuário.');
        } finally {
          setFetchingUser(false);
        }
      };
      fetchUser();
    }
  }, [id]);

  useEffect(() => {
    const fetchCells = async () => {
      try {
        let q;
        const currentRole = userData?.role?.toLowerCase();
        
        if (currentRole === 'root') {
          q = query(collection(db, 'cells'));
        } else if (currentRole === 'discipulador') {
          q = query(collection(db, 'cells'), where('networkId', '==', userData.networkId));
        } else if (currentRole === 'lider' || currentRole === 'leader') {
          q = query(collection(db, 'cells'), where('leaderId', '==', userData.uid || userData.email)); 
          if (userData.cellId) {
             q = query(collection(db, 'cells'));
          }
        }

        if (q) {
          const snapshot = await getDocs(q);
          let cellsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          if ((currentRole === 'lider' || currentRole === 'leader') && userData.cellId) {
            cellsData = cellsData.filter(c => c.id === userData.cellId);
          }

          setCells(cellsData);
          if (cellsData.length === 1) {
            setFormData(prev => ({ ...prev, cellId: cellsData[0].id }));
          }
        }
      } catch (err) {
        console.error("Erro ao buscar células", err);
      }
    };
    if (userData) fetchCells();
  }, [userData, id]);

  const getAvailableRoles = () => {
    const currentRole = userData?.role?.toLowerCase() || 'membro';
    if (currentRole === 'root') return [{ value: 'discipulador', label: 'Discipulador' }, { value: 'lider', label: 'Líder de Célula' }, { value: 'membro', label: 'Membro' }];
    if (currentRole === 'discipulador') return [{ value: 'lider', label: 'Líder de Célula' }, { value: 'membro', label: 'Membro' }];
    return [{ value: 'membro', label: 'Membro' }];
  };
  const roles = getAvailableRoles();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Nome e E-mail são obrigatórios.');
      return;
    }

    const unmaskedPhone = formData.phone.replace(/\D/g, '');
    if (unmaskedPhone && unmaskedPhone.length < 10) {
      setError('O telefone deve ter pelo menos DDD + 8 dígitos.');
      return;
    }
    
    if (formData.age && (formData.age < 0 || formData.age > 130)) {
      setError('Idade inválida.');
      return;
    }

    const unmaskedCep = formData.cep.replace(/\D/g, '');
    if (unmaskedCep && unmaskedCep.length !== 8) {
      setError('O CEP deve conter exatamente 8 números.');
      return;
    }

    if (['membro', 'lider', 'leader'].includes(formData.role) && !formData.cellId) {
      setError('Por favor, selecione uma Célula para vincular este usuário.');
      return;
    }

    setLoading(true);
    try {
      const selectedCell = cells.find(c => c.id === formData.cellId);
      const payload = {
        ...formData,
        cellName: selectedCell ? selectedCell.name : null,
        networkId: selectedCell ? selectedCell.networkId : null
      };

      if (id) {
        await updateDoc(doc(db, 'users', id), payload);
        setSuccess('Usuário atualizado com sucesso!');
        setTimeout(() => navigate('/users'), 1500);
      } else {
        await registerUserFromAdmin(payload);
        setSuccess('Usuário criado com sucesso! O convite de acesso foi enviado.');
        setTimeout(() => navigate('/users'), 2000);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso em outra conta.');
      } else {
        setError('Erro ao processar: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUser) {
    return (
      <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Carregando dados do usuário...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Inline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <button 
          onClick={() => navigate('/users')} 
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--surface-color)'}
        >
          <ArrowLeft size={20} color="var(--text-muted)" />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {id ? 'Editar Usuário' : 'Novo Usuário'}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {id ? 'Atualize as informações cadastrais e permissões deste usuário no sistema.' : 'Preencha os dados básicos e atribua as permissões para cadastrar um novo usuário.'}
          </p>
        </div>
      </div>

      <div className="card static" style={{ padding: '2.5rem' }}>
        {error && <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger-color)', color: 'var(--danger-color)', borderRadius: '4px', marginBottom: '2rem', fontSize: '0.875rem', fontWeight: '600' }}>{error}</div>}
        {success && <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success-color)', color: 'var(--success-color)', borderRadius: '4px', marginBottom: '2rem', fontSize: '0.875rem', fontWeight: '600' }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Identificação Principal */}
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <User size={14} /> Identificação Principal
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nome Completo *</label>
                <input type="text" style={{ width: '100%', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.65rem 1rem' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: João da Silva" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>E-mail *</label>
                <div style={{ position: 'relative', opacity: id ? 0.7 : 1 }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" style={{ width: '100%', paddingLeft: '2.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.65rem 1rem 0.65rem 2.8rem', backgroundColor: id ? 'var(--surface-color)' : 'transparent', cursor: id ? 'not-allowed' : 'text', color: id ? 'var(--text-muted)' : 'var(--text-main)' }} placeholder="email@exemplo.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.replace(/\s/g, '')})} disabled={!!id} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Telefone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" style={{ width: '100%', paddingLeft: '2.8rem', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.65rem 1rem 0.65rem 2.8rem' }} placeholder="(00) 00000-0000" value={formData.phone} onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').substring(0, 15);
                    setFormData({...formData, phone: val});
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Permissões no Sistema */}
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <Shield size={14} /> Permissões no Sistema
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: id ? '1fr 1fr 1fr' : '1fr 1fr', gap: '1.5rem' }}>
              {id && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Status da Conta</label>
                  <CustomSelect 
                    value={formData.status} 
                    onChange={val => setFormData({...formData, status: val})}
                    options={[
                      { value: 'ativo', label: 'Ativo' },
                      { value: 'inativo', label: 'Inativo' }
                    ]}
                    icon={Power}
                    colorConfig={(val) => val === 'inativo' ? '#ef4444' : '#10b981'}
                  />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nível de Acesso *</label>
                <CustomSelect 
                  value={formData.role} 
                  onChange={val => setFormData({...formData, role: val})}
                  options={roles}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Vincular à Célula *</label>
                <CustomSelect 
                  value={formData.cellId} 
                  onChange={val => setFormData({...formData, cellId: val})}
                  options={cells.map(c => ({ value: c.id, label: c.name }))}
                  icon={Users}
                  disabled={cells.length <= 1 || ['lider', 'leader'].includes(userData?.role?.toLowerCase())}
                  placeholder="Selecione a Célula..."
                />
              </div>
            </div>
          </div>

          {/* Dados Complementares */}
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <MapPin size={14} /> Dados Adicionais
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Idade</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="number" min="0" max="130" style={{ width: '100%', paddingLeft: '2.8rem', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.65rem 1rem 0.65rem 2.8rem' }} placeholder="Ex: 25" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>CEP</label>
                <input type="text" style={{ width: '100%', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.65rem 1rem' }} placeholder="00000-000" value={formData.cep} onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
                  setFormData({...formData, cep: val});
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={() => navigate('/users')} style={{ padding: '0.75rem 2rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--surface-color)'}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.75rem 2.5rem' }}>
              {loading ? 'Salvando...' : id ? 'Salvar Edição' : 'Criar Conta'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

const CustomSelect = ({ value, onChange, options, icon: Icon, placeholder = "Selecione...", disabled = false, colorConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const selectedLabel = selectedOption ? selectedOption.label : placeholder;
  const currentColor = colorConfig && selectedOption ? colorConfig(selectedOption.value) : 'var(--text-main)';

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {Icon && (
         <Icon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: currentColor, zIndex: 2 }} />
      )}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%', 
          padding: Icon ? '0.65rem 2.8rem 0.65rem 2.8rem' : '0.65rem 2.8rem 0.65rem 1rem',
          border: isOpen ? '1px solid var(--primary-color)' : '1px solid var(--border-color)', 
          borderRadius: '6px', 
          backgroundColor: disabled ? 'var(--bg-color)' : 'var(--surface-color)',
          color: currentColor,
          fontWeight: colorConfig ? '600' : '400',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s',
          minHeight: '44px',
          boxShadow: isOpen ? '0 0 0 3px rgba(79, 70, 229, 0.1)' : 'none',
          userSelect: 'none'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedLabel}</span>
        <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: `translateY(-50%) rotate(${isOpen ? '180deg' : '0deg'})`, transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          backgroundColor: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 50,
          maxHeight: '220px',
          overflowY: 'auto'
        }}>
          {options.map((option) => (
             <div 
               key={option.value}
               onClick={() => { onChange(option.value); setIsOpen(false); }}
               onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)'}
               onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
               style={{
                 padding: '0.65rem 1rem',
                 paddingLeft: Icon ? '2.8rem' : '1rem',
                 cursor: 'pointer',
                 color: colorConfig ? colorConfig(option.value) : 'var(--text-main)',
                 fontWeight: option.value === value ? '600' : '400',
                 backgroundColor: option.value === value ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
                 transition: 'background 0.2s',
                 display: 'flex',
                 alignItems: 'center',
                 userSelect: 'none'
               }}
             >
               {option.label}
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserForm;
