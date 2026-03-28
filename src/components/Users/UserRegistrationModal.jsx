import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { X, UserPlus, Edit2, CheckCircle2, User, Mail, Phone, Shield, Users, MapPin, Calendar, Power } from 'lucide-react';

export const UserRegistrationModal = ({ isOpen, onClose, userToEdit = null }) => {
  const { userData, registerUserFromAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    cep: '',
    role: 'membro',
    cellId: ''
  });

  const [cells, setCells] = useState([]);

  useEffect(() => {
    if (userToEdit && isOpen) {
      setFormData({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        phone: userToEdit.phone || '',
        age: userToEdit.age || '',
        cep: userToEdit.cep || '',
        role: userToEdit.role || 'membro',
        cellId: userToEdit.cellId || '',
        status: userToEdit.status || 'ativo'
      });
    } else if (!userToEdit && isOpen) {
      setFormData({ name: '', email: '', phone: '', age: '', cep: '', role: 'membro', cellId: '', status: 'ativo' });
    }
  }, [userToEdit, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCells = async () => {
      try {
        let q;
        const currentRole = userData?.role?.toLowerCase();
        
        if (currentRole === 'root') {
          q = query(collection(db, 'cells'));
        } else if (currentRole === 'discipulador') {
          q = query(collection(db, 'cells'), where('networkId', '==', userData.networkId));
        } else if (currentRole === 'lider' || currentRole === 'leader') {
          // Usa getDoc indireto via getAll da Network ou já limita ao proprio
          q = query(collection(db, 'cells'), where('leaderId', '==', userData.uid || userData.email)); 
          // O Seed Tool atrela leaderId... Mas pra contornar garantido se usar o UID do auth:
          // Se o Lider já tem userData.cellId gravado, na UI filtraremos pra ele ver só a dele:
          if (userData.cellId) {
             q = query(collection(db, 'cells'));
          }
        }

        if (q) {
          const snapshot = await getDocs(q);
          let cellsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Se for lider, mostrar apenas a célula do lider proativamente
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
    fetchCells();
  }, [isOpen, userData]);

  if (!isOpen) return null;

  // Hierarquia inteligente baseada no role atual
  const getAvailableRoles = () => {
    const currentRole = userData?.role?.toLowerCase() || 'membro';
    if (currentRole === 'root') {
      return [
        { value: 'discipulador', label: 'Discipulador' },
        { value: 'lider', label: 'Líder de Célula' },
        { value: 'membro', label: 'Membro' }
      ];
    }
    if (currentRole === 'discipulador') {
      return [
        { value: 'lider', label: 'Líder de Célula' },
        { value: 'membro', label: 'Membro' }
      ];
    }
    return [
      { value: 'membro', label: 'Membro' }
    ];
  };

  const roles = getAvailableRoles();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validations
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

      if (userToEdit) {
        // Modo Edição
        await updateDoc(doc(db, 'users', userToEdit.id), payload);
        setSuccess('Usuário atualizado com sucesso!');
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2000);
      } else {
        // Modo Criação
        await registerUserFromAdmin(payload);
        setSuccess('Usuário criado com sucesso! E-mail de Primeiro Acesso foi enviado.');
        setTimeout(() => {
          onClose();
          setSuccess('');
          setFormData({ name: '', email: '', phone: '', age: '', cep: '', role: roles[0]?.value || 'membro', cellId: '', status: 'ativo' });
        }, 2500);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso em outra conta.');
      } else {
        setError('Erro ao criar usuário: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', maxWidth: '900px', background: 'var(--surface-color)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255,255,255,0.6)', position: 'relative' }}>
        
        {/* Left Sidebar */}
        <div style={{ width: '320px', background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)', padding: '3rem 2rem', color: 'white', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-20%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              {userToEdit ? <Edit2 size={28} color="white" /> : <UserPlus size={28} color="white" />}
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              {userToEdit ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              {userToEdit 
                ? 'Atualize as permissões, hierarquia e dados cadastrais deste usuário. As alterações entram em vigor imediatamente na base de dados.' 
                : 'Cadastre um novo membro ou líder informando seus dados essenciais. Um e-mail será disparado automaticamente com as orientações de primeiro login.'}
            </p>

            {!userToEdit && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.4rem', borderRadius: '50%' }}>
                    <CheckCircle2 size={16} style={{ color: 'white' }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>Acesso gerado na nuvem</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.4rem', borderRadius: '50%' }}>
                    <CheckCircle2 size={16} style={{ color: 'white' }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>Disparo de credenciais seguras</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.4rem', borderRadius: '50%' }}>
                    <CheckCircle2 size={16} style={{ color: 'white' }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>Validação via Firebase Auth</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, padding: '3rem', background: 'rgba(255,255,255,0.7)', maxHeight: '90vh', overflowY: 'auto' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-muted)', padding: '0.5rem', background: 'white', borderRadius: '50%', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', zIndex: 10 }}>
            <X size={20} />
          </button>

          {error && <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger-color)', color: 'var(--danger-color)', borderRadius: '4px', marginBottom: '2rem', fontSize: '0.875rem', fontWeight: '600' }}>{error}</div>}
          {success && <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success-color)', color: 'var(--success-color)', borderRadius: '4px', marginBottom: '2rem', fontSize: '0.875rem', fontWeight: '600' }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Section: Identificação */}
            <div>
              <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={14} /> Identificação Principal
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nome Completo *</label>
                  <input type="text" style={{ width: '100%', background: 'white', border: '1px solid var(--border-color)' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: João da Silva" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>E-mail *</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="email" style={{ width: '100%', background: 'white', paddingLeft: '2.5rem', border: '1px solid var(--border-color)' }} placeholder="email@exemplo.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.replace(/\s/g, '')})} disabled={!!userToEdit} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Telefone</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="text" style={{ width: '100%', background: 'white', paddingLeft: '2.5rem', border: '1px solid var(--border-color)' }} placeholder="(00) 00000-0000" value={formData.phone} onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').substring(0, 15);
                        setFormData({...formData, phone: val});
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)' }} />

            {/* Section: Hierarquia e Permissões */}
            <div>
              <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={14} /> Permissões no Sistema
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: userToEdit ? '1fr 1fr 1fr' : '1fr 1fr', gap: '1.25rem' }}>
                {userToEdit && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Status da Conta</label>
                    <div style={{ position: 'relative' }}>
                      <Power size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: formData.status === 'inativo' ? '#ef4444' : '#10b981' }} />
                      <select style={{ width: '100%', background: 'white', paddingLeft: '2.5rem', border: '1px solid var(--border-color)', appearance: 'auto', color: formData.status === 'inativo' ? '#ef4444' : '#10b981', fontWeight: '600' }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nível de Acesso *</label>
                  <select style={{ width: '100%', background: 'white', border: '1px solid var(--border-color)' }} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Vincular à Célula *</label>
                  <div style={{ position: 'relative' }}>
                    <Users size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <select 
                      style={{ width: '100%', background: 'white', paddingLeft: '2.5rem', border: '1px solid var(--border-color)', appearance: 'auto' }} 
                      value={formData.cellId} 
                      onChange={e => setFormData({...formData, cellId: e.target.value})}
                      disabled={cells.length <= 1}
                    >
                      <option value="">Selecione a Célula...</option>
                      {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)' }} />

            {/* Section: Dados Complementares */}
            <div>
              <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} /> Dados Complementares
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Idade</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="number" min="0" max="130" style={{ width: '100%', background: 'white', paddingLeft: '2.5rem', border: '1px solid var(--border-color)' }} placeholder="Ex: 25" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>CEP (Código Postal)</label>
                  <input type="text" style={{ width: '100%', background: 'white', border: '1px solid var(--border-color)' }} placeholder="00000-000" value={formData.cep} onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
                    setFormData({...formData, cep: val});
                  }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.75rem 2rem' }}>
                {loading ? 'Processando...' : userToEdit ? 'Salvar Configurações' : 'Criar e Enviar Acesso'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
