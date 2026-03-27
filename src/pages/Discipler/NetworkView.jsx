import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Network, Activity, Home, Users } from 'lucide-react';

const NetworkView = () => {
  const { currentUser, userData } = useAuth();
  
  const [myNetwork, setMyNetwork] = useState(null);
  const [cells, setCells] = useState([]);
  const [leaders, setLeaders] = useState({});
  const [cellsMembersCount, setCellsMembersCount] = useState({});
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
