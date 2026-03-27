import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockCells, mockUsers, mockAttendances } from '../../data/mockData';
import { Users, ClipboardCheck, AlertCircle } from 'lucide-react';

const CellManagement = () => {
  const { currentUser, userData } = useAuth();
  
  const myCell = mockCells.find(c => c.id === userData?.cellId);
  const members = mockUsers.filter(u => u.cellId === userData?.cellId);
  const attendances = mockAttendances.filter(a => a.cellId === userData?.cellId);

  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [presentQueue, setPresentQueue] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!myCell) {
    return <div>Você não está liderando nenhuma célula.</div>;
  }

  const togglePresence = (id) => {
    if (presentQueue.includes(id)) {
      setPresentQueue(presentQueue.filter(mId => mId !== id));
    } else {
      setPresentQueue([...presentQueue, id]);
    }
  };

  const submitReport = (e) => {
    e.preventDefault();
    if (!date) return;
    
    // Simulate API call
    console.log("Saving Attendance:", { date, presentQueue, notes });
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3000);
    setDate('');
    setNotes('');
    setPresentQueue([]);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Gestão da Liderança - {myCell.name}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Controle de membros e relatórios da célula.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Members List */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
            <Users size={24} />
            <h2 style={{ marginBottom: 0 }}>Membros ({members.length})</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{m.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.email}</div>
                </div>
                {m.role === 'leader' && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Líder</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Report Form */}
        <form onSubmit={submitReport} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--success-color)' }}>
            <ClipboardCheck size={24} />
            <h2 style={{ marginBottom: 0 }}>Relatório de Reunião</h2>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Data da Reunião</label>
            <input type="date" style={{ width: '100%' }} value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Lista de Presença</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {members.map(m => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                  <input type="checkbox" checked={presentQueue.includes(m.id)} onChange={() => togglePresence(m.id)} />
                  {m.name}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Observações</label>
            <textarea style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Visitantes, pedidos de oração..." />
          </div>

          {submitSuccess && (
            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success-color)', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} /> Relatório salvo com sucesso!
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: 'auto' }}>
            <ClipboardCheck size={20} /> Salvar Relatório
          </button>
        </form>
      </div>
    </div>
  );
};

export default CellManagement;
