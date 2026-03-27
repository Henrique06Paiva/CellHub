import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Users, ClipboardCheck, AlertCircle } from 'lucide-react';

const CellManagement = () => {
  const { currentUser, userData } = useAuth();
  
  const [myCell, setMyCell] = useState(null);
  const [members, setMembers] = useState([]);
  const [attendances, setAttendances] = useState([]);

  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [presentQueue, setPresentQueue] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.cellId) {
        setLoading(false);
        return;
      }
      try {
        const cellDoc = await getDoc(doc(db, 'cells', userData.cellId));
        if (cellDoc.exists()) setMyCell({ id: cellDoc.id, ...cellDoc.data() });

        const memQ = query(collection(db, 'users'), where('cellId', '==', userData.cellId));
        const memSnap = await getDocs(memQ);
        setMembers(memSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const attQ = query(collection(db, 'attendances'), where('cellId', '==', userData.cellId));
        const attSnap = await getDocs(attQ);
        setAttendances(attSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
      } catch (err) {
        console.error("Erro ao carregar célula e relatórios:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userData]);

  const togglePresence = (id) => {
    if (presentQueue.includes(id)) {
      setPresentQueue(presentQueue.filter(mId => mId !== id));
    } else {
      setPresentQueue([...presentQueue, id]);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!date || !userData?.cellId) return;
    
    setSubmitting(true);
    try {
      const newReport = {
        cellId: userData.cellId,
        date,
        presentMembers: presentQueue,
        notes,
        createdAt: new Date().toISOString(),
        reportedBy: currentUser.uid
      };
      
      const docRef = await addDoc(collection(db, 'attendances'), newReport);
      
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      setDate('');
      setNotes('');
      setPresentQueue([]);
      setAttendances(prev => [...prev, { id: docRef.id, ...newReport }]);
    } catch(err) {
      console.error(err);
      alert('Erro ao salvar o relatório da célula.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando dados da liderança da célula...</div>;
  if (!myCell) return <div style={{ padding: '2rem' }}>Você não está designado(a) como líder de nenhuma célula ou os dados não foram encontrados.</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Gestão da Liderança - {myCell.name}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Controle de membros e relatórios da sua célula.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Members List */}
        <div className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start' }}>
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
                {m.role === 'leader' && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Líder</span>
                )}
              </div>
            )) : <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>A célula não possui membros cadastrados.</div>}
          </div>
        </div>

        {/* Report Form */}
        <form onSubmit={submitReport} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--success-color)' }}>
            <ClipboardCheck size={24} />
            <h2 style={{ marginBottom: 0 }}>Relatório de Reunião</h2>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Data da Reunião</label>
            <input type="date" style={{ width: '100%' }} value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Lista de Presença</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {members.length > 0 ? members.map(m => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.65rem', background: presentQueue.includes(m.id) ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface-color)', borderRadius: '6px', border: presentQueue.includes(m.id) ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                  <input type="checkbox" checked={presentQueue.includes(m.id)} onChange={() => togglePresence(m.id)} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontWeight: presentQueue.includes(m.id) ? '500' : 'normal' }}>{m.name}</span>
                </label>
              )) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sem membros para marcar presença.</span>}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>Observações (Opcional)</label>
            <textarea style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Quantidade de visitantes, pedidos de oração..." />
          </div>

          {submitSuccess && (
            <div className="animate-fade-in" style={{ padding: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <AlertCircle size={18} /> Relatório enviado e salvo no banco de dados com sucesso!
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={submitting || members.length === 0} style={{ marginTop: 'auto', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Salvando...' : <><ClipboardCheck size={20} /> Salvar Relatório</>}
          </button>
        </form>
      </div>
      
      {/* Historico Rapido */}
      {attendances.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <h2>Histórico Recente ({attendances.length})</h2>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            {attendances.sort((a,b) => new Date(b.date) - new Date(a.date)).map(att => (
              <div key={att.id} className="card" style={{ minWidth: '250px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{new Date(att.date).toLocaleDateString()}</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{att.presentMembers?.length || 0} Presentes</div>
                {att.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>"{att.notes}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CellManagement;
