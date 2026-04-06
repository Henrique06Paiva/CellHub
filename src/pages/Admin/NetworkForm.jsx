import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobal } from '../../contexts/GlobalContext';
import { fetchNetworkById, saveNetwork } from '../../services/networkService';
import { fetchUsers } from '../../services/userService';
import { ArrowLeft, Globe, Camera, User, Mail, Search, Check, ChevronDown, Loader2, Phone, Calendar } from 'lucide-react';

const NetworkForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { registerUserFromAdmin } = useAuth();
  const { showLoader, hideLoader, notify } = useGlobal();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    logoURL: '',
    disciplerType: 'existing', // 'existing' | 'new'
    disciplerId: '',
    newName: '',
    newEmail: '',
    newPhone: '',
    newAge: '',
    newCep: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (id) {
      const loadNetwork = async () => {
        try {
          const data = await fetchNetworkById(id);
          if (data) {
            setFormData(prev => ({
              ...prev,
              name: data.name || '',
              logoURL: data.logoURL || '',
              disciplerId: data.disciplerId || ''
            }));
            setLogoPreview(data.logoURL || '');
          }
        } catch (err) {
          notify('error', "Erro ao carregar rede.");
        } finally {
          setFetching(false);
        }
      };
      loadNetwork();
    }
  }, [id, notify]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersList = await fetchUsers({ role: ['discipulador', 'lider', 'membro'] });
        setUsers(usersList);
      } catch (err) {
        console.error(err);
      }
    };
    loadUsers();
  }, []);

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
    if (!formData.name.trim()) errors.name = 'O nome da rede é obrigatório.';
    if (!id && !logoFile) errors.logo = 'A logo da rede é obrigatória.';

    if (formData.disciplerType === 'new') {
      if (!formData.newName?.trim()) errors.newName = 'Campo obrigatório.';
      if (!formData.newEmail?.trim()) errors.newEmail = 'Campo obrigatório.';
      
      const unmaskedPhone = (formData.newPhone || '').replace(/\D/g, '');
      if (unmaskedPhone && unmaskedPhone.length < 10) errors.newPhone = 'Deve ter pelo menos DDD + 8 dígitos.';
      
      if (formData.newAge && (formData.newAge < 0 || formData.newAge > 130)) errors.newAge = 'Idade inválida.';

      const unmaskedCep = (formData.newCep || '').replace(/\D/g, '');
      if (unmaskedCep && unmaskedCep.length !== 8) errors.newCep = 'Deve conter 8 números.';
    } else if (!formData.disciplerId) {
      errors.disciplerId = 'Selecione um discipulador.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      notify('error', 'Preencha os campos obrigatórios.');
      return;
    }

    setLoading(true);
    showLoader(id ? 'Atualizando rede...' : 'Criando nova rede...');

    try {
      let finalDisciplerId = formData.disciplerId;

      // 1. Se for novo discipulador, criar no Auth e Firestore
      if (formData.disciplerType === 'new') {
        const newUserPayload = {
            name: formData.newName,
            email: formData.newEmail,
            role: 'discipulador'
        };
        if (formData.newPhone) newUserPayload.phone = formData.newPhone;
        if (formData.newAge) newUserPayload.age = formData.newAge;
        if (formData.newCep) newUserPayload.cep = formData.newCep;

        try {
          finalDisciplerId = await registerUserFromAdmin(newUserPayload);
        } catch (authErr) {
          // Trata erros específicos da criação de usuário
          if (authErr.code === 'auth/email-already-in-use') {
            setFieldErrors(prev => ({ ...prev, newEmail: 'Este e-mail já está cadastrado no sistema.' }));
            notify('error', 'Este e-mail já está em uso. Use a aba "Usuário Existente" ou informe outro e-mail.');
          } else if (authErr.code === 'auth/invalid-email') {
            setFieldErrors(prev => ({ ...prev, newEmail: 'E-mail inválido.' }));
            notify('error', 'O endereço de e-mail informado não é válido.');
          } else {
            notify('error', 'Erro ao criar o discipulador: ' + (authErr.message || 'Erro desconhecido.'));
          }
          return; // Interrompe sem salvar a rede
        }
      }

      // 2. Salvar Rede via Serviço
      const networkPayload = {
        name: formData.name,
        logoURL: formData.logoURL,
        disciplerId: finalDisciplerId
      };

      await saveNetwork(id, networkPayload, logoFile);

      notify('success', "Rede salva com sucesso!");
      setTimeout(() => navigate('/admin/networks'), 1000);
    } catch (err) {
      console.error(err);
      notify('error', "Erro ao salvar a rede: " + err.message);
    } finally {
      hideLoader();
      setLoading(false);
    }
  };


  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchUser.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (fetching) return <div style={{ padding: '2rem' }}>Carregando dados...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/admin/networks')} className="btn-icon">
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {id ? 'Editar Rede' : 'Nova Rede'}
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
                style={{ width: '120px', height: '120px', borderRadius: '24px', background: 'var(--bg-color)', border: fieldErrors.logo ? '2px dashed var(--danger-color)' : '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', boxShadow: fieldErrors.logo ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOME DA REDE <span style={{ color: 'var(--danger-color)' }}>*</span></label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => { setFormData({...formData, name: e.target.value}); clearFieldError('name'); }}
                placeholder="Ex: Rede Esperança"
                style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '6px', border: `1px solid ${errBorder('name')}`, fontSize: '1.1rem', fontWeight: '600', boxShadow: fieldErrors.name ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }}
              />
              {fieldErrors.name && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.name}</span>}
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: 0 }} />

          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <User size={14} /> Discipulador Responsável
            </h3>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button 
                type="button"
                onClick={() => setFormData({...formData, disciplerType: 'existing'})}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid', borderColor: formData.disciplerType === 'existing' ? 'var(--primary-color)' : 'var(--border-color)', background: formData.disciplerType === 'existing' ? 'rgba(79, 70, 229, 0.1)' : 'transparent', color: formData.disciplerType === 'existing' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}
              >
                Usuário Existente
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, disciplerType: 'new'})}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid', borderColor: formData.disciplerType === 'new' ? 'var(--primary-color)' : 'var(--border-color)', background: formData.disciplerType === 'new' ? 'rgba(79, 70, 229, 0.1)' : 'transparent', color: formData.disciplerType === 'new' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}
              >
                Criar Novo
              </button>
            </div>

            {formData.disciplerType === 'existing' ? (
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: fieldErrors.disciplerId ? 'var(--danger-color)' : 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome ou e-mail..."
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '6px', border: `1px solid ${errBorder('disciplerId')}`, marginBottom: '0.5rem', boxShadow: fieldErrors.disciplerId ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }}
                />
                {fieldErrors.disciplerId && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block' }}>{fieldErrors.disciplerId}</span>}
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  {filteredUsers.length > 0 ? filteredUsers.map(user => (
                    <div 
                      key={user.id}
                      onClick={() => { setFormData({...formData, disciplerId: user.id}); clearFieldError('disciplerId'); }}
                      style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: formData.disciplerId === user.id ? 'rgba(79, 70, 229, 0.05)' : 'transparent', borderBottom: '1px solid var(--border-color)' }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role} • {user.email}</div>
                      </div>
                      {formData.disciplerId === user.id && <Check size={18} color="var(--success-color)" />}
                    </div>
                  )) : (
                    <p style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>Nenhum usuário encontrado.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>NOME COMPLETO <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input type="text" value={formData.newName} onChange={e => { setFormData({...formData, newName: e.target.value}); clearFieldError('newName'); }} style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '6px', border: `1px solid ${errBorder('newName')}`, boxShadow: fieldErrors.newName ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="Nome do Discipulador" />
                  {fieldErrors.newName && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.newName}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>E-MAIL <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                  <input type="email" value={formData.newEmail} onChange={e => { setFormData({...formData, newEmail: e.target.value}); clearFieldError('newEmail'); }} style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '6px', border: `1px solid ${errBorder('newEmail')}`, boxShadow: fieldErrors.newEmail ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="email@exemplo.com" />
                  {fieldErrors.newEmail && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.newEmail}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>TELEFONE</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" value={formData.newPhone} onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').substring(0, 15);
                        setFormData({...formData, newPhone: val}); clearFieldError('newPhone');
                    }} style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.8rem', borderRadius: '6px', border: `1px solid ${errBorder('newPhone')}`, boxShadow: fieldErrors.newPhone ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="(00) 00000-0000" />
                  </div>
                  {fieldErrors.newPhone && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.newPhone}</span>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>IDADE</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="number" value={formData.newAge} onChange={e => { setFormData({...formData, newAge: e.target.value}); clearFieldError('newAge'); }} style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.8rem', borderRadius: '6px', border: `1px solid ${errBorder('newAge')}`, boxShadow: fieldErrors.newAge ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="Ex: 35" />
                  </div>
                  {fieldErrors.newAge && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.newAge}</span>}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>CEP</label>
                  <input type="text" value={formData.newCep} onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
                      setFormData({...formData, newCep: val}); clearFieldError('newCep');
                  }} style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '6px', border: `1px solid ${errBorder('newCep')}`, boxShadow: fieldErrors.newCep ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }} placeholder="00000-000" />
                  {fieldErrors.newCep && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>{fieldErrors.newCep}</span>}
                </div>
                <p style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    * Um e-mail de ativação será enviado para este endereço após a criação.
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={() => navigate('/admin/networks')} style={{ padding: '0.75rem 2rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem 2.5rem', minWidth: '160px' }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : id ? 'Salvar Alterações' : 'Criar Rede'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NetworkForm;
