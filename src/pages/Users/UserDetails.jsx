import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingFallback from '../../components/Common/LoadingFallback';
import BackButton from '../../components/Common/BackButton';
import { fetchUserById } from '../../services/userService';
import { fetchReports } from '../../services/reportService';
import { ArrowLeft, User, Mail, Phone, Calendar, Edit2, Shield, MapPin, Hash, Activity } from 'lucide-react';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData: currentAuthUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [attendance, setAttendance] = useState({ 4: 0, 8: 0, 12: 0, counts: { 4: 0, 8: 0, 12: 0 }, totals: { 4: 0, 8: 0, 12: 0 } });

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        const data = await fetchUserById(id);
        if (data) {
          setUser(data);
          
          // Fetch reports for attendance history if user has a cell
          if (data.cellId && currentAuthUser) {
            const reports = await fetchReports(currentAuthUser, { cellId: data.cellId });
            const recentReports = reports.slice(0, 12);
            
            const calcPresence = (numWeeks) => {
              const relevantReports = recentReports.slice(0, numWeeks);
              if (relevantReports.length === 0) return { pct: 0, count: 0, total: 0 };
              const presentCount = relevantReports.filter(r => 
                r.members?.some(m => m.uid === id && m.present)
              ).length;
              return {
                pct: Math.round((presentCount / relevantReports.length) * 100),
                count: presentCount,
                total: relevantReports.length
              };
            };

            const res4 = calcPresence(4);
            const res8 = calcPresence(8);
            const res12 = calcPresence(12);

            setAttendance({
              4: res4.pct, 8: res8.pct, 12: res12.pct,
              counts: { 4: res4.count, 8: res8.count, 12: res12.count },
              totals: { 4: res4.total, 8: res8.total, 12: res12.total }
            });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar usuário:", err);
      } finally {
        setLoading(false);
      }
    };
    if (currentAuthUser) loadUserDetails();
  }, [id, currentAuthUser]);

  if (loading) {
    return <LoadingFallback />;
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
          <BackButton to="/users" />
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

            {user.cellId && (
              <div>
                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={14} /> Histórico de Presença
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {[4, 8, 12].map(period => (
                    <div key={period}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Últimas {period} semanas</span>
                        <span style={{ fontWeight: '700', color: attendance[period] >= 70 ? 'var(--success-color)' : attendance[period] >= 40 ? '#f59e0b' : 'var(--danger-color)' }}>
                          {attendance[period]}% ({attendance.counts[period]}/{attendance.totals[period]})
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${attendance[period]}%`, 
                          background: attendance[period] >= 70 ? 'var(--success-color)' : attendance[period] >= 40 ? '#f59e0b' : 'var(--danger-color)',
                          boxShadow: `0 0 10px ${attendance[period] >= 70 ? 'rgba(16, 185, 129, 0.3)' : attendance[period] >= 40 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          transition: 'width 0.5s ease-out'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default UserDetails;
