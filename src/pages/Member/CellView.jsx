import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockCells, mockUsers, mockNetworks } from '../../data/mockData';
import { MapPin, Users, Calendar } from 'lucide-react';

const CellView = () => {
  const { user } = useAuth();

  const myCell = mockCells.find(c => c.id === user.cellId);
  const leader = mockUsers.find(u => u.id === myCell?.leaderId);
  const myNetwork = mockNetworks.find(n => n.id === user.networkId);
  const members = mockUsers.filter(u => u.cellId === user.cellId);

  if (!myCell) {
    return <div>Você não está vinculado a nenhuma célula.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          {myNetwork?.name}
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
            <Users size={24} />
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
                <td style={{ fontWeight: '500' }}>{m.name} {m.id === user.id && '(Você)'}</td>
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
      </div>
    </div>
  );
};

export default CellView;
