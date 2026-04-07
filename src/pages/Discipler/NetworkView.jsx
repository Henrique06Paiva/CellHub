import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Network, Activity, Home, Users, AlertTriangle } from 'lucide-react';
import { fetchNetworks, fetchNetworkById } from '../../services/networkService';
import { fetchCells } from '../../services/cellService';
import { fetchUserById, fetchUsers } from '../../services/userService';
import { fetchReports } from '../../services/reportService';
import LoadingFallback from '../../components/Common/LoadingFallback';

const NetworkView = () => {
  const { currentUser, userData } = useAuth();
  
  const [myNetwork, setMyNetwork] = useState(null);
  const [cells, setCells] = useState([]);
  const [leaders, setLeaders] = useState({});
  const [cellsMembersCount, setCellsMembersCount] = useState({});
  const [lowAttendanceSummary, setLowAttendanceSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNetworkDataCombined = async () => {
      try {
        let networkData = null;
        
        if (userData?.networkId) {
          networkData = await fetchNetworkById(userData.networkId);
        } else if (currentUser?.uid) {
          const networks = await fetchNetworks({ disciplerId: currentUser.uid });
          if (networks.length > 0) networkData = networks[0];
        }

        if (networkData) {
          setMyNetwork(networkData);

          const loadedCells = await fetchCells({ networkId: networkData.id });
          setCells(loadedCells);

          const lMap = {};
          const cMap = {};
          
          for (const cell of loadedCells) {
            if (cell.leaderId) {
              const leaderData = await fetchUserById(cell.leaderId);
              if (leaderData) lMap[cell.leaderId] = leaderData;
            }
            const cellMembers = await fetchUsers({ cellId: cell.id });
            cMap[cell.id] = cellMembers.length;
          }
          setLeaders(lMap);
          setCellsMembersCount(cMap);

          // Calculate low attendance summary for the network
          const lowAttSum = {};
          const reports = await fetchReports(userData, { networkId: networkData.id });
          const recentReportsAll = reports.slice(0, 100);

          for (const cell of loadedCells) {
            const cellReports = recentReportsAll.filter(r => r.cellId === cell.id).slice(0, 4);
            if (cellReports.length === 0) continue;

            const cellMembers = await fetchUsers({ cellId: cell.id });
            let countLow = 0;

            for (const member of cellMembers) {
              const attendedCount = cellReports.filter(r => 
                r.members?.some(m => m.uid === member.id && m.present)
              ).length;
              const pct = Math.round((attendedCount / cellReports.length) * 100);
              if (pct < 50) {
                countLow++;
              }
            }
            if (countLow > 0) {
              lowAttSum[cell.id] = { cellName: cell.name, count: countLow };
            }
          }
          setLowAttendanceSummary(lowAttSum);
        }
      } catch (err) {
        console.error("Erro ao carregar rede:", err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) loadNetworkDataCombined();
  }, [currentUser, userData]);

  if (loading) return <LoadingFallback />;
  if (!myNetwork) return <div style={{ padding: '2rem' }}>Você não possui explícitamente nenhuma rede vinculada ou os dados não foram encontrados.</div>;

  const totalMembers = Object.values(cellsMembersCount).reduce((acc, curr) => acc + curr, 0);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Network size={36} color="var(--primary-color)" /> Visão da Rede
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Acompanhamento geral da {myNetwork.name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '1rem', borderRadius: '12px', color: 'var(--primary-color)' }}>
            <Home size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Total de Células</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{cells.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '12px', color: 'var(--success-color)' }}>
            <Users size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Total de Membros</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{totalMembers}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '12px', color: '#f59e0b' }}>
            <Activity size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Células Sem Líder</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{cells.filter(c => !c.leaderId).length}</div>
          </div>
        </div>
      </div>

      {/* Low Attendance Summary Alert */}
      {Object.keys(lowAttendanceSummary).length > 0 && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2.5rem',
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'flex-start'
        }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.75rem', borderRadius: '10px', color: 'var(--danger-color)' }}>
            <AlertTriangle size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Alertas de Baixa Frequência na Rede</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Identificamos membros com menos de 50% de presença nas seguintes células. Recomenda-se acompanhamento com os líderes:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {Object.entries(lowAttendanceSummary).map(([cellId, data]) => (
                <div key={cellId} style={{ 
                  background: 'var(--bg-color)', 
                  border: '1px solid var(--border-color)', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}>
                  <span style={{ fontWeight: '700', color: 'var(--primary-light)' }}>{data.cellName}</span>
                  <div style={{ width: '1px', height: '14px', background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--danger-color)', fontWeight: '600' }}>{data.count} membro{data.count !== 1 ? 's' : ''} em risco</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Células da Rede</h2>
        
        {cells.length > 0 ? (
          <div className="table-responsive-wrapper">
            <table className="data-table" style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th>Célula</th>
                  <th>Líder</th>
                  <th>Endereço</th>
                  <th>Membros</th>
                </tr>
              </thead>
              <tbody>
                {cells.map(cell => {
                  const leader = leaders[cell.leaderId];
                  return (
                    <tr key={cell.id}>
                      <td style={{ fontWeight: '600', color: 'var(--primary-hover)' }}>{cell.name}</td>
                      <td>{leader ? leader.name : <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>Sem Líder</span>}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{cell.address}</td>
                      <td>{cellsMembersCount[cell.id] || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma célula associada a esta rede encontrada.</p>
        )}
      </div>
    </div>
  );
};

export default NetworkView;
