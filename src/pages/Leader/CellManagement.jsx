import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCellById } from '../../services/cellService';
import { fetchUsers } from '../../services/userService';
import { fetchReports } from '../../services/reportService';
import { Users, FileText, ArrowRight, AlertTriangle, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CellManagement = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  
  const [myCell, setMyCell] = useState(null);
  const [members, setMembers] = useState([]);
  const [reportCount, setReportCount] = useState(0);
  const [lowAttendanceMembers, setLowAttendanceMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeadershipData = async () => {
      if (!userData?.cellId) {
        setLoading(false);
        return;
      }
      try {
        // Paralela: cell, membros e relatórios ao mesmo tempo
        const [cellData, membersList, cellReports] = await Promise.all([
          fetchCellById(userData.cellId),
          fetchUsers({ cellId: userData.cellId }),
          fetchReports(userData, { cellId: userData.cellId }),
        ]);

        if (cellData) setMyCell(cellData);
        setMembers(membersList || []);
        setReportCount(cellReports.length);

        const lastReports = cellReports.slice(0, 4);
        
        if (lastReports.length > 0) {
          const lowAtt = [];
          for (const member of membersList) {
            const attendedCount = lastReports.filter(r => 
              r.members?.some(m => m.uid === member.id && m.present)
            ).length;
            const pct = Math.round((attendedCount / lastReports.length) * 100);
            if (pct < 50) {
              lowAtt.push({ ...member, pct, count: attendedCount, total: lastReports.length });
            }
          }
          setLowAttendanceMembers(lowAtt);
        }
        
      } catch (err) {
        console.error("Erro ao carregar célula:", err);
      } finally {
        setLoading(false);
      }
    };
    if (userData) loadLeadershipData();
  }, [userData]);

  if (loading) return <div style={{ padding: '2rem' }}>Carregando dados da liderança da célula...</div>;
  if (!myCell) return <div style={{ padding: '2rem' }}>Você não está designado(a) como líder de nenhuma célula ou os dados não foram encontrados.</div>;

  return (
    <div>


      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Low Attendance Alert */}
        {lowAttendanceMembers.length > 0 && (
          <div style={{ 
            gridColumn: '1 / -1',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.6rem', borderRadius: '8px', color: 'var(--danger-color)' }}>
              <AlertTriangle size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Atenção Pastoral Necessária
                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '999px', color: 'var(--danger-color)' }}>
                  {lowAttendanceMembers.length} membro{lowAttendanceMembers.length !== 1 ? 's' : ''} em risco
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
                Os seguintes membros tiveram menos de 50% de presença nos últimos 4 encontros. Vale uma ligação ou visita:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {lowAttendanceMembers.map(m => (
                  <div key={m.id} onClick={() => navigate(`/users/${m.id}`)} style={{ 
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.4rem', 
                    padding: '0.35rem 0.75rem', background: 'var(--bg-color)', 
                    border: '1px solid var(--border-color)', borderRadius: '6px',
                    fontSize: '0.8rem', fontWeight: '600'
                  }}>
                    <UserMinus size={14} color="var(--danger-color)" />
                    <span style={{ color: 'var(--text-main)' }}>{m.name}</span>
                    <span style={{ color: 'var(--danger-color)', marginLeft: '0.2rem' }}>{m.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/reports/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: '12px',
            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%'
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ background: 'rgba(79, 70, 229, 0.15)', padding: '0.75rem', borderRadius: '10px', color: 'var(--primary-color)' }}>
            <FileText size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.2rem' }}>Preencher Relatório Semanal</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{reportCount} relatório{reportCount !== 1 ? 's' : ''} enviado{reportCount !== 1 ? 's' : ''}</div>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
        </button>

        <button
          onClick={() => navigate('/reports')}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem',
            background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px',
            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%'
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '10px', color: 'var(--success-color)' }}>
            <Users size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.2rem' }}>Ver Histórico de Relatórios</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Presença, visitantes e fotos</div>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      {/* Members List */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
          <Users size={24} />
          <h2 style={{ marginBottom: 0 }}>Membros ({members.length})</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {members.length > 0 ? members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: '500' }}>{m.name} {m.id === currentUser?.uid && '(Você)'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.email}</div>
              </div>
              {(m.role === 'leader' || m.role === 'lider') && (
                <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Líder</span>
              )}
            </div>
          )) : <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>A célula não possui membros cadastrados.</div>}
        </div>
      </div>
    </div>
  );
};

export default CellManagement;
