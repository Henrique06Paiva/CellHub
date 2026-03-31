import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { Network, Activity, Home, Users, AlertTriangle } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';

const NetworkView = () => {
  const { currentUser, userData } = useAuth();
  
  const [myNetwork, setMyNetwork] = useState(null);
  const [cells, setCells] = useState([]);
  const [leaders, setLeaders] = useState({});
  const [cellsMembersCount, setCellsMembersCount] = useState({});
  const [lowAttendanceSummary, setLowAttendanceSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let networkData = null;
        
        if (userData?.networkId) {
          const netDoc = await getDoc(doc(db, 'networks', userData.networkId));
          if (netDoc.exists()) {
            networkData = { id: netDoc.id, ...netDoc.data() };
          }
        } else {
          const netQ = query(collection(db, 'networks'), where('disciplerId', '==', currentUser?.uid));
          const netSnap = await getDocs(netQ);
          if (!netSnap.empty) {
            networkData = { id: netSnap.docs[0].id, ...netSnap.docs[0].data() };
          }
        }

        if (networkData) {
          setMyNetwork(networkData);

          const cellsQ = query(collection(db, 'cells'), where('networkId', '==', networkData.id));
          const cellsSnap = await getDocs(cellsQ);
          const loadedCells = cellsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setCells(loadedCells);

          const lMap = {};
          const cMap = {};
          let totalMems = 0;
          
          for (const cell of loadedCells) {
            if (cell.leaderId) {
              const lDoc = await getDoc(doc(db, 'users', cell.leaderId));
              if (lDoc.exists()) lMap[cell.leaderId] = { id: lDoc.id, ...lDoc.data() };
            }
            const memQ = query(collection(db, 'users'), where('cellId', '==', cell.id));
            const memSnap = await getDocs(memQ);
            cMap[cell.id] = memSnap.size;
          }
          setLeaders(lMap);
          setCellsMembersCount(cMap);

          // Calculate low attendance summary for the network
          const lowAttSum = {};
          const reportsQ = query(
            collection(db, 'reports'),
            where('networkId', '==', networkData.id),
            orderBy('date', 'desc'),
            limit(100) // Get recent reports to analyze
          );
          const reportsSnap = await getDocs(reportsQ);
          const reports = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          for (const cell of loadedCells) {
            const cellReports = reports.filter(r => r.cellId === cell.id).slice(0, 4);
            if (cellReports.length === 0) continue;

            const memQ = query(collection(db, 'users'), where('cellId', '==', cell.id));
            const memSnap = await getDocs(memQ);
            let countLow = 0;

            for (const memberDoc of memSnap.docs) {
              const memberId = memberDoc.id;
              const attendedCount = cellReports.filter(r => 
                r.members?.some(m => m.uid === memberId && m.present)
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
    fetchData();
  }, [currentUser, userData]);

  if (loading) return <div style={{ padding: '2rem' }}>Carregando dados da rede...</div>;
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
          <table className="data-table">
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
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma célula associada a esta rede encontrada.</p>
        )}
      </div>
    </div>
  );
};

export default NetworkView;
