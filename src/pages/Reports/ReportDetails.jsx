import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Users, UserPlus, CheckCircle, XCircle, FileText, Camera } from 'lucide-react';

const ReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const reportDoc = await getDoc(doc(db, 'reports', id));
        if (reportDoc.exists()) {
          setReport({ id: reportDoc.id, ...reportDoc.data() });
        }
      } catch (err) {
        console.error('Erro ao carregar relatório:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Carregando relatório...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Relatório não encontrado.</h2>
        <button onClick={() => navigate('/reports')} className="btn-primary">Voltar para a Lista</button>
      </div>
    );
  }

  const presencePercent = report.totalMembers > 0 ? Math.round((report.presentCount / report.totalMembers) * 100) : 0;
  const presentMembers = report.members?.filter(m => m.present) || [];
  const absentMembers = report.members?.filter(m => !m.present) || [];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            onClick={() => navigate('/reports')}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--surface-color)'}
          >
            <ArrowLeft size={20} color="var(--text-muted)" />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>Detalhes do Relatório</h1>
        </div>
      </div>

      <div className="card static" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        {/* Top Summary */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.15)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={36} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {report.cellName}
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid rgba(79, 70, 229, 0.3)', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)' }}>
                {report.meetingDayLabel}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                {new Date(report.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', width: '100%' }} />

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-color)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Presentes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success-color)' }}>{report.presentCount}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-color)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Ausentes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--danger-color)' }}>{report.absentCount}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-color)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Visitantes</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--secondary-color)' }}>{report.visitors || 0}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-color)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Taxa</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: presencePercent >= 70 ? 'var(--success-color)' : presencePercent >= 40 ? '#f59e0b' : 'var(--danger-color)' }}>{presencePercent}%</div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', width: '100%' }} />

        {/* Presence Lists */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

          {/* Present */}
          <div>
            <h4 style={{ fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={14} /> Presentes ({presentMembers.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {presentMembers.length > 0 ? presentMembers.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.85rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>{m.name}</span>
                </div>
              )) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhum membro presente.</span>
              )}
            </div>
          </div>

          {/* Absent */}
          <div>
            <h4 style={{ fontSize: '0.75rem', color: 'var(--danger-color)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <XCircle size={14} /> Ausentes ({absentMembers.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {absentMembers.length > 0 ? absentMembers.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.85rem', background: 'rgba(239, 68, 68, 0.04)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.12)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger-color)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)' }}>{m.name}</span>
                </div>
              )) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Todos estiveram presentes! 🎉</span>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {report.notes && (
          <>
            <div style={{ height: '1px', background: 'var(--border-color)', width: '100%' }} />
            <div>
              <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.75rem' }}>Observações</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.6', margin: 0, padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {report.notes}
              </p>
            </div>
          </>
        )}

        {/* Photo */}
        {report.photoURL && (
          <>
            <div style={{ height: '1px', background: 'var(--border-color)', width: '100%' }} />
            <div>
              <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={14} /> Foto do Encontro
              </h4>
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img
                  src={report.photoURL}
                  alt="Foto do encontro da célula"
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>
          </>
        )}

        {/* Footer Meta */}
        <div style={{ height: '1px', background: 'var(--border-color)', width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Preenchido por: <strong style={{ color: 'var(--text-main)' }}>{report.leaderName}</strong></span>
          <span>
            {report.createdAt?.seconds
              ? new Date(report.createdAt.seconds * 1000).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
              : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;
