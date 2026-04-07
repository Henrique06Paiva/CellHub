import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCellById } from '../../services/cellService';
import { fetchUsers } from '../../services/userService';
import { fetchReports } from '../../services/reportService';
import LoadingFallback from '../../components/Common/LoadingFallback';
import BackButton from '../../components/Common/BackButton';
import { useAuth } from '../../contexts/AuthContext';
import { Home, User, Users, MapPin, Calendar, ArrowLeft, Edit2, TrendingUp, Filter, FileText, Loader2 } from 'lucide-react';

const CellAdminDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [cell, setCell] = useState(null);
  const [members, setMembers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCellDetails = async () => {
      try {
        const [cellData, membersList, reportsList] = await Promise.all([
          fetchCellById(id),
          fetchUsers({ cellId: id }),
          fetchReports(userData, { cellId: id })
        ]);

        if (cellData) {
          setCell(cellData);
          setMembers(membersList || []);
          setReports(reportsList ? reportsList.slice(0, 5) : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (userData) loadCellDetails();
  }, [id, userData]);

  if (loading) return <LoadingFallback />;
  if (!cell) return <div style={{ padding: '2rem' }}>Célula não encontrada.</div>;

  // Calculo de frequência média fictício (baseado nos relatórios carregados)
  const avgAttendance = reports.length > 0 
    ? Math.round((reports.reduce((acc, r) => acc + (r.presentCount || 0), 0) / (reports.length * (members.length || 1))) * 100)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <BackButton to="/admin/cells" />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Detalhes da Célula</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Análise técnica e acompanhamento</p>
        </div>
        <button onClick={() => navigate(`/admin/cells/${id}/edit`)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Edit2 size={18} /> Editar Dados
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
        
        {/* Sidebar: Perfil da Célula */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '24px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', margin: '0 auto 1.5rem', overflow: 'hidden' }}>
              {cell.logoURL ? <img src={cell.logoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" /> : <Home size={48} color="var(--primary-color)" />}
            </div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>{cell.name}</h2>
            <div style={{ 
                display: 'inline-flex', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', background: cell.status === 'inativo' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: cell.status === 'inativo' ? '#ef4444' : '#10b981', marginBottom: '1.5rem'
            }}>
              Status: {cell.status || 'ativo'}
            </div>

            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                  <User size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>LÍDER RESPONSÁVEL</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{cell.leaderName || 'Não atribuído'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-color)' }}>
                  <MapPin size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>LOCALIZAÇÃO (CEP)</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{cell.cep || '00000-000'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Rápidos */}
          <div className="card" style={{ padding: '1.5rem', background: 'var(--primary-color)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', opacity: 0.8 }}>
              <TrendingUp size={20} />
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Frequência Média</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{avgAttendance}%</div>
            <p style={{ fontSize: '0.75rem', margin: '0.5rem 0 0 0', opacity: 0.8 }}>Baseado nos últimos {reports.length} encontros</p>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Lista de Membros */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={20} /> Membros da Célula ({members.length})</h3>
              <button onClick={() => navigate('/users/new')} style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: '700', cursor: 'pointer' }}>+ Adicionar Membro</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '800' }}>
                    {m.name?.[0]}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{m.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Relatórios Recentes */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={20} /> Relatórios Recentes</h3>
            {reports.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {reports.map(r => (
                   <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                         <span style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--primary-color)' }}>{new Date(r.date).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}</span>
                         <span style={{ fontSize: '1rem', fontWeight: '800', lineHeight: 1 }}>{new Date(r.date).getDate()}</span>
                       </div>
                       <div>
                         <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>Encontro de Célula</div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.presentCount} presentes • {r.visitorsCount || 0} visitantes</div>
                       </div>
                     </div>
                     <button onClick={() => navigate(`/reports/${r.id}`)} className="btn-icon" style={{ padding: '0.4rem' }}><ExternalLink size={16} /></button>
                   </div>
                 ))}
                 <button onClick={() => navigate('/reports')} style={{ textAlign: 'center', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>Ver histórico completo</button>
              </div>
            ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum relatório enviado recentemente.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const ExternalLink = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
);

export default CellAdminDetails;
