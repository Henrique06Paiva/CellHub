import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, Edit2, Shield, MapPin, Hash } from 'lucide-react';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() });
        }
      } catch (err) {
        console.error("Erro ao carregar usuário:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Carregando perfil...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Usuário não encontrado.</h2>
        <button onClick={() => navigate('/users')} className="btn-primary">Voltar para a Lista</button>
      </div>
    );
  }

  const getRoleBadgeStyle = (role) => {
    switch(role?.toLowerCase()) {
      case 'root': return { backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#9333ea', borderColor: 'rgba(168, 85, 247, 0.3)' };
      case 'discipulador': return { backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)', borderColor: 'rgba(79, 70, 229, 0.3)' };
      case 'lider': 
      case 'leader': return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.3)' };
      default: return { backgroundColor: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-muted)', borderColor: 'rgba(100, 116, 139, 0.3)' };
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Header Inline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button 
            onClick={() => navigate('/users')} 
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--surface-color)'}
          >
            <ArrowLeft size={20} color="var(--text-muted)" />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>Perfil do Usuário</h1>
        </div>
        
        <button onClick={() => navigate(`/users/${id}/edit`)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Edit2 size={16} /> Editar Perfil
        </button>
      </div>

      <div className="card static" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* Top Profile Summary */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '2.5rem', boxShadow: '0 15px 35px -5px rgba(79, 70, 229, 0.3)', flexShrink: 0 }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>{user.name}</h2>
              {user.displayId && (
                <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary-light)', fontFamily: 'monospace' }}>#{String(user.displayId).padStart(3, '0')}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ 
                padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid', ...getRoleBadgeStyle(user.role)
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
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', width: '100%' }} />

        {/* Detailed Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2.5rem' }}>
          
          {/* Col 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={14} /> Contato
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>E-mail Primário</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.email || '-'}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Celular / WhatsApp</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.phone || 'Não informado'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={14} /> Sistema & Organograma
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Célula Vinculada</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.cellName ? user.cellName : 'Nenhuma'}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Data do Registro</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }) : 'Desconhecida'}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Código do Usuário</span>
                  <span style={{ fontWeight: '700', color: 'var(--primary-light)', fontFamily: 'monospace', fontSize: '1.1rem' }}>{user.displayId ? `#${String(user.displayId).padStart(3, '0')}` : 'Não atribuído'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={14} /> Dados Pessoais Demográficos
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Idade Reportada</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.age ? `${user.age} anos` : 'Não informada'}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Código Postal (CEP)</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.cep || 'Não informado'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default UserDetails;
