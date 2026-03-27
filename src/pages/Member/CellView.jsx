import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { MapPin, Users as UsersIcon } from 'lucide-react';

const CellView = () => {
  const { currentUser, userData } = useAuth();
  
  const [myCell, setMyCell] = useState(null);
  const [leader, setLeader] = useState(null);
  const [myNetwork, setMyNetwork] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.cellId) {
        setLoading(false);
        return;
      }
      try {
        const cellDoc = await getDoc(doc(db, 'cells', userData.cellId));
        if (cellDoc.exists()) {
          const cellData = { id: cellDoc.id, ...cellDoc.data() };
          setMyCell(cellData);
          
          if (cellData.leaderId) {
            const leaderDoc = await getDoc(doc(db, 'users', cellData.leaderId));
            if (leaderDoc.exists()) setLeader({ id: leaderDoc.id, ...leaderDoc.data() });
          }
        }

        if (userData?.networkId) {
          const networkDoc = await getDoc(doc(db, 'networks', userData.networkId));
          if (networkDoc.exists()) setMyNetwork({ id: networkDoc.id, ...networkDoc.data() });
        }

        const membersQuery = query(collection(db, 'users'), where('cellId', '==', userData.cellId));
        const membersSnap = await getDocs(membersQuery);
        setMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userData]);

  if (loading) return <div style={{ padding: '2rem' }}>Carregando dados da célula...</div>;
  if (!myCell) return <div style={{ padding: '2rem' }}>Você não está vinculado a nenhuma célula. Verifique com a liderança.</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          {myNetwork?.name || 'Rede Desconhecida'}
        </div>
        <h1>{myCell.name}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Bem-vindo de volta! Aqui estão os detalhes da sua célula.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.75rem', borderRadius: '8px', color: 'var(--primary-color)' }}>
            <MapPin size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Local do Encontro</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{myCell.address}</p>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '8px', color: 'var(--success-color)' }}>
            <UsersIcon size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Liderança</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {leader ? leader.name : 'Sem líder designado'}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Membros da Célula ({members.length})</h2>
        </div>
        
        {members.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: '500' }}>{m.name} {m.id === currentUser?.uid && '(Você)'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.email}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      background: m.role === 'leader' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                      color: m.role === 'leader' ? '#fbbf24' : 'var(--primary-color)'
                    }}>
                      {m.role === 'leader' ? 'Líder' : 'Membro'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum membro vinculado a esta célula ainda.</p>
        )}
      </div>
    </div>
  );
};

export default CellView;
