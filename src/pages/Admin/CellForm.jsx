import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobal } from '../../contexts/GlobalContext';
import { fetchCellById, saveCell } from '../../services/cellService';
import { fetchNetworks } from '../../services/networkService';
import { fetchUsers } from '../../services/userService';
import LoadingFallback from '../../components/Common/LoadingFallback';
import BackButton from '../../components/Common/BackButton';
import { ArrowLeft, Home, Camera, User, Mail, Search, Check, ChevronDown, Loader2, MapPin, Phone, Calendar } from 'lucide-react';

const CellAdminForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, registerUserFromAdmin } = useAuth();
  const { showLoader, hideLoader, notify } = useGlobal();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    cep: '',
    address: '',
    logoURL: '',
    networkId: '',
    leaderType: 'existing', // 'existing' | 'new' | 'none'
    leaderId: '',
    leaderName: '',
    newLeaderName: '',
    newLeaderEmail: '',
    newLeaderPhone: '',
    newLeaderAge: '',
    newLeaderCep: ''
  });

  const [networks, setNetworks] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Networks
        const nets = await fetchNetworks();
        setNetworks(nets);

        // Fetch Users (potential leaders)
        const userList = await fetchUsers({ role: ['lider', 'membro'] });
        setUsers(userList);

        if (id) {
          const data = await fetchCellById(id);
          if (data) {
            setFormData(prev => ({
              ...prev,
              name: data.name || '',
              cep: data.cep || '',
              address: data.address || '',
              logoURL: data.logoURL || '',
              networkId: data.networkId || '',
              leaderId: data.leaderId || '',
              leaderName: data.leaderName || '',
              leaderType: data.leaderId ? 'existing' : 'none'
            }));
            setLogoPreview(data.logoURL || '');
          }
        } else if (userData?.role === 'discipulador') {
          setFormData(prev => ({ ...prev, networkId: userData.networkId }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    if (userData) fetchData();
  }, [id, userData]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        canvas.toBlob((blob) => {
          setLogoFile(blob);
          setLogoPreview(URL.createObjectURL(blob));
          if (fieldErrors.logo) clearFieldError('logo');
        }, 'image/jpeg', 0.85);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const clearFieldError = (field) => {
    setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const errBorder = (field) => fieldErrors[field] ? 'var(--danger-color)' : 'var(--border-color)';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!formData.name.trim()) errors.name = 'O nome da célula é obrigatórios.';
    if (!formData.cep.trim()) errors.cep = 'O CEP é obrigatórios.';
    if (!id && !logoFile) errors.logo = 'A logo da célula é obrigatória.';
    if (!formData.networkId) errors.networkId = 'Selecione uma rede.';

    if (formData.leaderType === 'new') {
      if (!formData.newLeaderName?.trim()) errors.newLeaderName = 'Campo obrigatório.';
      if (!formData.newLeaderEmail?.trim()) errors.newLeaderEmail = 'Campo obrigatório.';
      
      const unmaskedPhone = (formData.newLeaderPhone || '').replace(/\D/g, '');
      if (unmaskedPhone && unmaskedPhone.length < 10 && unmaskedPhone.length > 0) errors.newLeaderPhone = 'Deve ter pelo menos DDD + 8 dígitos.';
      
      if (formData.newLeaderAge && (formData.newLeaderAge < 0 || formData.newLeaderAge > 130)) errors.newLeaderAge = 'Idade inválida.';

      const unmaskedCep = (formData.newLeaderCep || '').replace(/\D/g, '');
      if (unmaskedCep && unmaskedCep.length !== 8 && unmaskedCep.length > 0) errors.newLeaderCep = 'Deve conter 8 números.';
    } else if (formData.leaderType === 'existing') {
        if (!formData.leaderId) errors.leaderId = 'Selecione um líder.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      notify('error', 'Preencha os campos obrigatórios.');
      return;
    }

    setLoading(true);
    showLoader(id ? 'Atualizando célula...' : 'Criando nova célula...');

    try {
      let finalLeaderId = formData.leaderId;
      let finalLeaderName = formData.leaderName;

      // 1. Criar novo líder se necessário
      if (formData.leaderType === 'new') {
        const newUserPayload = {
            name: formData.newLeaderName,
            email: formData.newLeaderEmail,
            role: 'lider',
            networkId: formData.networkId
        };
        if (formData.newLeaderPhone) newUserPayload.phone = formData.newLeaderPhone;
        if (formData.newLeaderAge) newUserPayload.age = formData.newLeaderAge;
        if (formData.newLeaderCep) newUserPayload.cep = formData.newLeaderCep;

        try {
          finalLeaderId = await registerUserFromAdmin(newUserPayload);
        } catch (authErr) {
          if (authErr.code === 'auth/email-already-in-use') {
            setFieldErrors(prev => ({ ...prev, newLeaderEmail: 'Este e-mail já está cadastrado no sistema.' }));
            notify('error', 'Este e-mail já está em uso. Use a aba "Vincular Existente" ou informe outro e-mail.');
          } else if (authErr.code === 'auth/invalid-email') {
            setFieldErrors(prev => ({ ...prev, newLeaderEmail: 'E-mail inválido.' }));
            notify('error', 'O endereço de e-mail informado não é válido.');
          } else {
            notify('error', 'Erro ao criar o líder: ' + (authErr.message || 'Erro desconhecido.'));
          }
          return;
        }
        finalLeaderName = formData.newLeaderName;
      } else if (formData.leaderType === 'existing') {
        const selUser = users.find(u => u.id === formData.leaderId);
        finalLeaderName = selUser ? selUser.name : '';
      } else {
        finalLeaderId = '';
        finalLeaderName = '';
      }

      // 2. Salvar Célula via Serviço
      const status = finalLeaderId ? 'ativo' : 'inativo';
      const cellPayload = {
        name: formData.name,
        cep: formData.cep,
        address: formData.address,
        logoURL: formData.logoURL,
        networkId: formData.networkId,
        leaderId: finalLeaderId || null,
        leaderName: finalLeaderName || null,
        status
      };

      await saveCell(id, cellPayload, logoFile);

      notify('success', "Célula salva com sucesso!");
      setTimeout(() => navigate('/admin/cells'), 1000);
    } catch (err) {
      console.error(err);
      notify('error', "Erro ao salvar: " + err.message);
    } finally {
      hideLoader();
      setLoading(false);
    }
  };


  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchUser.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (fetching) return <LoadingFallback />;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <BackButton to="/admin/cells" />
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {id ? 'Editar Célula' : 'Nova Célula'}
        </h1>
      </div>

      <div className="card static" style={{ padding: '2.5rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
          Campos com <span style={{ color: 'var(--danger-color)', fontWeight: '700', fontStyle: 'normal' }}>*</span> são campos obrigatórios.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => fileInputRef.current.click()}
                style={{ width: '120px', height: '120px', borderRadius: '24px', background: 'var(--bg-color)', border: fieldErrors.logo ? '2px dashed var(--danger-color)' : '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', boxShadow: fieldErrors.logo ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <Camera size={24} color={fieldErrors.logo ? 'var(--danger-color)' : 'var(--text-muted)'} />
                    <span style={{ fontSize: '0.7rem', color: fieldErrors.logo ? 'var(--danger-color)' : 'var(--text-muted)', marginTop: '0.5rem' }}>Subir Logo <span style={{ color: 'var(--danger-color)' }}>*</span></span>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
              {fieldErrors.logo && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block', textAlign: 'center' }}>{fieldErrors.logo}</span>}
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>NOME DA CÉLULA <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => { setFormData({...formData, name: e.target.value}); clearFieldError('name'); }}
                  placeholder="Ex: Célula Atos"
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '6px', border: `1px solid ${errBorder('name')}`, fontSize: '1.1rem', fontWeight: '600', boxShadow: fieldErrors.name ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }}
                />
                {fieldErrors.name && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.name}</span>}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>CEP <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input 
                    type="text" 
                    value={formData.cep}
                    onChange={e => { 
                      const val = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
                      setFormData({...formData, cep: val}); clearFieldError('cep'); 
                    }}
                    placeholder="00000-000"
                    style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '6px', border: `1px solid ${errBorder('cep')}`, boxShadow: fieldErrors.cep ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }}
                  />
                  {fieldErrors.cep && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.cep}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>ENDEREÇO (OPCIONAL)</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="Rua, Número, Bairro..."
                      style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 0 }} />

          {/* Seção 2: Rede (Habilitado apenas para Root) */}
          {userData?.role === 'root' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>REDE VINCULADA <span style={{ color: 'var(--danger-color)' }}>*</span></label>
              <select 
                value={formData.networkId}
                onChange={e => { setFormData({...formData, networkId: e.target.value}); clearFieldError('networkId'); }}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: `1px solid ${errBorder('networkId')}`, background: 'var(--surface-color)', color: 'var(--text-main)', cursor: 'pointer', boxShadow: fieldErrors.networkId ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }}
              >
                <option value="">Selecione uma rede...</option>
                {networks.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
              {fieldErrors.networkId && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.networkId}</span>}
            </div>
          ) : null}

          {/* Seção 3: Líder da Célula */}
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <User size={14} /> Liderança da Célula
            </h3>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {['existing', 'new', 'none'].map(type => (
                <button 
                  key={type}
                  type="button"
                  onClick={() => { setFormData({...formData, leaderType: type}); setFieldErrors({}); }}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid', borderColor: formData.leaderType === type ? 'var(--primary-color)' : 'var(--border-color)', background: formData.leaderType === type ? 'rgba(79, 70, 229, 0.1)' : 'transparent', color: formData.leaderType === type ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}
                >
                  {type === 'existing' ? 'Vincular Existente' : type === 'new' ? 'Criar Novo' : 'Sem Líder'}
                </button>
              ))}
            </div>

            {formData.leaderType === 'existing' && (
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: fieldErrors.leaderId ? 'var(--danger-color)' : 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome ou e-mail..."
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '6px', border: `1px solid ${errBorder('leaderId')}`, marginBottom: '0.5rem', boxShadow: fieldErrors.leaderId ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }}
                />
                {fieldErrors.leaderId && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>{fieldErrors.leaderId}</span>}
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  {filteredUsers.length > 0 ? filteredUsers.map(user => (
                    <div 
                      key={user.id}
                      onClick={() => { setFormData({...formData, leaderId: user.id}); clearFieldError('leaderId'); }}
                      style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: formData.leaderId === user.id ? 'rgba(79, 70, 229, 0.05)' : 'transparent', borderBottom: '1px solid var(--border-color)' }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role} • {user.email}</div>
                      </div>
                      {formData.leaderId === user.id && <Check size={18} color="var(--success-color)" />}
                    </div>
                  )) : (
                    <p style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>Nenhum usuário encontrado.</p>
                  )}
                </div>
              </div>
            )}

            {formData.leaderType === 'new' && (
              <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>NOME COMPLETO <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input type="text" value={formData.newLeaderName} onChange={e => { setFormData({...formData, newLeaderName: e.target.value}); clearFieldError('newLeaderName'); }} style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '6px', border: `1px solid ${errBorder('newLeaderName')}`, boxShadow: fieldErrors.newLeaderName ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="Nome do Líder" />
                  {fieldErrors.newLeaderName && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.newLeaderName}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>E-MAIL <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input type="email" value={formData.newLeaderEmail} onChange={e => { setFormData({...formData, newLeaderEmail: e.target.value}); clearFieldError('newLeaderEmail'); }} style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '6px', border: `1px solid ${errBorder('newLeaderEmail')}`, boxShadow: fieldErrors.newLeaderEmail ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="email@exemplo.com" />
                  {fieldErrors.newLeaderEmail && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.newLeaderEmail}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>TELEFONE</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" value={formData.newLeaderPhone} onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').substring(0, 15);
                        setFormData({...formData, newLeaderPhone: val}); clearFieldError('newLeaderPhone');
                    }} style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.8rem', borderRadius: '6px', border: `1px solid ${errBorder('newLeaderPhone')}`, boxShadow: fieldErrors.newLeaderPhone ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="(00) 00000-0000" />
                  </div>
                  {fieldErrors.newLeaderPhone && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.newLeaderPhone}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>IDADE</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="number" value={formData.newLeaderAge} onChange={e => { setFormData({...formData, newLeaderAge: e.target.value}); clearFieldError('newLeaderAge'); }} style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.8rem', borderRadius: '6px', border: `1px solid ${errBorder('newLeaderAge')}`, boxShadow: fieldErrors.newLeaderAge ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="Ex: 25" />
                  </div>
                  {fieldErrors.newLeaderAge && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.newLeaderAge}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>CEP</label>
                  <input type="text" value={formData.newLeaderCep} onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
                      setFormData({...formData, newLeaderCep: val}); clearFieldError('newLeaderCep');
                  }} style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '6px', border: `1px solid ${errBorder('newLeaderCep')}`, boxShadow: fieldErrors.newLeaderCep ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="00000-000" />
                  {fieldErrors.newLeaderCep && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.newLeaderCep}</span>}
                </div>
              </div>
            )}

            {formData.leaderType === 'none' && (
              <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.85rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Loader2 size={18} />
                <span>Esta célula será criada como <strong>INATIVA</strong>. Você poderá vincular um líder posteriormente.</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={() => navigate('/admin/cells')} style={{ padding: '0.75rem 2rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem 2.5rem', minWidth: '160px' }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : id ? 'Salvar Alterações' : 'Criar Célula'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CellAdminForm;
