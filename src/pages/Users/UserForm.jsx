import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingFallback from '../../components/Common/LoadingFallback';
import BackButton from '../../components/Common/BackButton';
import { useGlobal } from '../../contexts/GlobalContext';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchUserById, updateUser } from '../../services/userService';
import { fetchCells } from '../../services/cellService';
import { ArrowLeft, User, Mail, Phone, Shield, Users, MapPin, Calendar, Power, ChevronDown } from 'lucide-react';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, registerUserFromAdmin } = useAuth();
  const { showLoader, hideLoader, notify } = useGlobal();
  
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(!!id);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', age: '', cep: '', role: 'membro', cellId: '', status: 'ativo'
  });
  const [cells, setCells] = useState([]);

  useEffect(() => {
    if (id) {
      const loadUser = async () => {
        try {
          const data = await fetchUserById(id);
          if (data) {
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
            notify('error', 'Usuário não encontrado.');
          }
        } catch (err) {
          notify('error', 'Erro ao buscar dados do usuário.');
        } finally {
          setFetchingUser(false);
        }
      };
      loadUser();
    }
  }, [id, notify]);

  useEffect(() => {
    const loadCells = async () => {
      try {
        const currentRole = userData?.role?.toLowerCase();
        let cellsData = [];

        if (currentRole === 'root') {
          cellsData = await fetchCells();
        } else if (currentRole === 'discipulador') {
          cellsData = await fetchCells({ networkId: userData.networkId });
        } else if (currentRole === 'lider' || currentRole === 'leader') {
          if (userData.cellId) {
            const myCell = await fetchCells();
            cellsData = myCell.filter(c => c.id === userData.cellId);
          } else {
            cellsData = await fetchCells();
          }
        }

        setCells(cellsData);
        if (cellsData.length === 1) {
          setFormData(prev => ({ ...prev, cellId: cellsData[0].id }));
        }
      } catch (err) {
        console.error("Erro ao buscar células", err);
      }
    };
    if (userData) loadCells();
  }, [userData, id]);

  const getAvailableRoles = () => {
    const currentRole = userData?.role?.toLowerCase() || 'membro';
    if (currentRole === 'root') return [{ value: 'discipulador', label: 'Discipulador' }, { value: 'lider', label: 'Líder de Célula' }, { value: 'membro', label: 'Membro' }];
    if (currentRole === 'discipulador') return [{ value: 'lider', label: 'Líder de Célula' }, { value: 'membro', label: 'Membro' }];
    return [{ value: 'membro', label: 'Membro' }];
  };
  const roles = getAvailableRoles();

  const clearFieldError = (field) => {
    setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const errBorder = (field) => fieldErrors[field] ? 'var(--danger-color)' : 'var(--border-color)';

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Field-level validation
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Campo obrigatório.';
    if (!formData.email.trim()) errors.email = 'Campo obrigatório.';

    const unmaskedPhone = formData.phone.replace(/\D/g, '');
    if (unmaskedPhone && unmaskedPhone.length < 10) errors.phone = 'Deve ter pelo menos DDD + 8 dígitos.';
    
    if (formData.age && (formData.age < 0 || formData.age > 130)) errors.age = 'Idade inválida.';

    const unmaskedCep = formData.cep.replace(/\D/g, '');
    if (unmaskedCep && unmaskedCep.length !== 8) errors.cep = 'Deve conter 8 números.';

    if (['membro', 'lider', 'leader'].includes(formData.role) && !formData.cellId) errors.cellId = 'Campo obrigatório.';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      notify('error', 'Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    showLoader(id ? 'Atualizando usuário...' : 'Criando novo usuário...');
    
    try {
      const selectedCell = cells.find(c => c.id === formData.cellId);
      const payload = {
        ...formData,
        cellName: selectedCell ? selectedCell.name : null,
        networkId: selectedCell ? selectedCell.networkId : null
      };

      if (id) {
        await updateUser(id, payload);
        notify('success', 'Usuário atualizado com sucesso!');
        setTimeout(() => navigate('/users'), 1000);
      } else {
        await registerUserFromAdmin(payload);
        notify('success', 'Usuário criado com sucesso! O convite de acesso foi enviado.');
        setTimeout(() => navigate('/users'), 1000);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setFieldErrors(prev => ({ ...prev, email: 'Este e-mail já está cadastrado no sistema.' }));
        notify('error', 'Este e-mail já está em uso por outra conta.');
      } else if (err.code === 'auth/invalid-email') {
        setFieldErrors(prev => ({ ...prev, email: 'E-mail inválido.' }));
        notify('error', 'O endereço de e-mail informado não é válido.');
      } else {
        notify('error', 'Erro ao processar: ' + err.message);
      }
    } finally {
      hideLoader();
      setLoading(false);
    }
  };


  if (fetchingUser) {
    return <LoadingFallback />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Inline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <BackButton to="/users" />
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
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
          Campos com <span style={{ color: 'var(--danger-color)', fontWeight: '700', fontStyle: 'normal' }}>*</span> são campos obrigatórios.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Identificação Principal */}
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <User size={14} /> Identificação Principal
            </h3>
            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nome Completo <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                <input type="text" style={{ width: '100%', border: `1px solid ${errBorder('name')}`, borderRadius: '6px', padding: '0.65rem 1rem', boxShadow: fieldErrors.name ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} value={formData.name} onChange={e => { setFormData({...formData, name: e.target.value}); clearFieldError('name'); }} placeholder="Ex: João da Silva" />
                {fieldErrors.name && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.name}</span>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>E-mail <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                <div style={{ position: 'relative', opacity: id ? 0.7 : 1 }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: fieldErrors.email ? 'var(--danger-color)' : 'var(--text-muted)' }} />
                  <input type="email" style={{ width: '100%', paddingLeft: '2.5rem', border: `1px solid ${errBorder('email')}`, borderRadius: '6px', padding: '0.65rem 1rem 0.65rem 2.8rem', backgroundColor: id ? 'var(--surface-color)' : 'transparent', cursor: id ? 'not-allowed' : 'text', color: id ? 'var(--text-muted)' : 'var(--text-main)', boxShadow: fieldErrors.email ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="email@exemplo.com" value={formData.email} onChange={e => { setFormData({...formData, email: e.target.value.replace(/\s/g, '')}); clearFieldError('email'); }} disabled={!!id} />
                </div>
                {fieldErrors.email && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.email}</span>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Telefone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" style={{ width: '100%', paddingLeft: '2.8rem', border: `1px solid ${errBorder('phone')}`, borderRadius: '6px', padding: '0.65rem 1rem 0.65rem 2.8rem', boxShadow: fieldErrors.phone ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="(00) 00000-0000" value={formData.phone} onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').substring(0, 15);
                    setFormData({...formData, phone: val}); clearFieldError('phone');
                  }} />
                </div>
                {fieldErrors.phone && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.phone}</span>}
              </div>
            </div>
          </div>

          {/* Permissões no Sistema */}
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <Shield size={14} /> Permissões no Sistema
            </h3>
            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: id ? '1fr 1fr 1fr' : '1fr 1fr', gap: '1.5rem' }}>
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
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nível de Acesso <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                <CustomSelect 
                  value={formData.role} 
                  onChange={val => setFormData({...formData, role: val})}
                  options={roles}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Vincular à Célula <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                <CustomSelect 
                  value={formData.cellId} 
                  onChange={val => { setFormData({...formData, cellId: val}); clearFieldError('cellId'); }}
                  options={cells.map(c => ({ value: c.id, label: c.name }))}
                  icon={Users}
                  disabled={cells.length <= 1 || ['lider', 'leader'].includes(userData?.role?.toLowerCase())}
                  placeholder="Selecione a Célula..."
                  hasError={!!fieldErrors.cellId}
                />
                {fieldErrors.cellId && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.cellId}</span>}
              </div>
            </div>
          </div>

          {/* Dados Complementares */}
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <MapPin size={14} /> Dados Adicionais
            </h3>
            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Idade</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="number" min="0" max="130" style={{ width: '100%', paddingLeft: '2.8rem', border: `1px solid ${errBorder('age')}`, borderRadius: '6px', padding: '0.65rem 1rem 0.65rem 2.8rem', boxShadow: fieldErrors.age ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="Ex: 25" value={formData.age} onChange={e => { setFormData({...formData, age: e.target.value}); clearFieldError('age'); }} />
                </div>
                {fieldErrors.age && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.age}</span>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>CEP</label>
                <input type="text" style={{ width: '100%', border: `1px solid ${errBorder('cep')}`, borderRadius: '6px', padding: '0.65rem 1rem', boxShadow: fieldErrors.cep ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="00000-000" value={formData.cep} onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
                  setFormData({...formData, cep: val}); clearFieldError('cep');
                }} />
                {fieldErrors.cep && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.cep}</span>}
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

const CustomSelect = ({ value, onChange, options, icon: Icon, placeholder = "Selecione...", disabled = false, colorConfig, hasError = false }) => {
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
          border: hasError ? '1px solid var(--danger-color)' : isOpen ? '1px solid var(--primary-color)' : '1px solid var(--border-color)', 
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
          boxShadow: hasError ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : isOpen ? '0 0 0 3px rgba(79, 70, 229, 0.1)' : 'none',
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
