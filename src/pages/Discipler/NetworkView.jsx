import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockNetworks, mockCells, mockUsers } from '../../data/mockData';
import { Network, Activity, Home, Users } from 'lucide-react';

const NetworkView = () => {
  const { currentUser, userData } = useAuth();

  const myNetwork = mockNetworks.find(n => n.disciplerId === currentUser?.uid || n.id === userData?.networkId);
  const cells = mockCells.filter(c => c.networkId === myNetwork?.id);
  const totalMembers = cells.reduce((acc, cell) => acc + mockUsers.filter(u => u.cellId === cell.id).length, 0);

  if (!myNetwork) {
    return <div>Você não possui nenhuma rede vinculada.</div>;
  }

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
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Média de Frequência</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>90%</div> {/* static for mock */}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Células da Rede</h2>
        
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
              const leader = mockUsers.find(u => u.id === cell.leaderId);
              const cellMem = mockUsers.filter(u => u.cellId === cell.id);
              return (
                <tr key={cell.id}>
                  <td style={{ fontWeight: '600', color: 'var(--primary-hover)' }}>{cell.name}</td>
                  <td>{leader ? leader.name : <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>Sem Líder</span>}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{cell.address}</td>
                  <td>{cellMem.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NetworkView;
