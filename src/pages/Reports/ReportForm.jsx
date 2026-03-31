import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Users, UserPlus, Camera, FileText, CheckCircle2, X, ImageIcon, Loader2 } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

// Inline error message component
const FieldError = ({ message }) => message ? (
  <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem', animation: 'fadeIn 0.2s ease' }}>
    {message}
  </span>
) : null;

// Image compression utility
const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Compression failed'));
          }
        }, 'image/jpeg', quality);
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

const ReportForm = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cell & Members
  const [cellData, setCellData] = useState(null);
  const [members, setMembers] = useState([]);

  // Form fields
  const [meetingDay, setMeetingDay] = useState('');
  const [presentIds, setPresentIds] = useState([]);
  const [memberObservations, setMemberObservations] = useState({}); // { uid: string }
  const [visitors, setVisitors] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Field-level errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [alreadySentThisWeek, setAlreadySentThisWeek] = useState(false);

  // Load cell and members
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.cellId) {
        setLoading(false);
        return;
      }

      // 1. Try to load members from cache first for instant UI
      const cacheKey = `members_${userData.cellId}`;
      const cachedMembers = sessionStorage.getItem(cacheKey);
      if (cachedMembers) {
        setMembers(JSON.parse(cachedMembers));
        // We still fetch from Firestore to ensure data is fresh but UI is already usable
      }

      try {
        const cellQ = query(collection(db, 'cells'), where('__name__', '==', userData.cellId));
        const cellSnap = await getDocs(cellQ);
        if (!cellSnap.empty) {
          setCellData({ id: cellSnap.docs[0].id, ...cellSnap.docs[0].data() });
        }

        const memQ = query(collection(db, 'users'), where('cellId', '==', userData.cellId));
        const memSnap = await getDocs(memQ);
        const membersList = memSnap.docs.map(d => ({ uid: d.id, name: d.data().name, email: d.data().email }));
        
        setMembers(membersList);
        sessionStorage.setItem(cacheKey, JSON.stringify(membersList));
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        if (!cachedMembers) {
          setError('Erro ao carregar dados da célula.');
        }
      }

      // Check if report already sent this week
      try {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        
        // Use local date string instead of ISO to avoid timezone shifts
        const y = startOfWeek.getFullYear();
        const m = String(startOfWeek.getMonth() + 1).padStart(2, '0');
        const d = String(startOfWeek.getDate()).padStart(2, '0');
        const startStr = `${y}-${m}-${d}`;

        // Fetch all reports for the cell and filter in memory to avoid "Building Index" errors
        const repQ = query(
          collection(db, 'reports'),
          where('cellId', '==', userData.cellId)
        );
        const repSnap = await getDocs(repQ);
        // Compare dates safely using noon for the report and the local week start string
        const hasThisWeek = repSnap.docs.some(d => d.data().date >= startStr);
        if (hasThisWeek) {
          setAlreadySentThisWeek(true);
        }
      } catch (err) {
        console.warn('Não foi possível verificar relatório semanal:', err);
      }

      setLoading(false);
    };
    fetchData();
  }, [userData]);

  const clearFieldError = (field) => {
    setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const toggleMember = (uid) => {
    setPresentIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleObservationChange = (uid, val) => {
    setMemberObservations(prev => ({ ...prev, [uid]: val }));
  };

  const selectAll = () => {
    if (presentIds.length === members.length) {
      setPresentIds([]);
    } else {
      setPresentIds(members.map(m => m.uid));
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    try {
      // Compress image before setting it to state
      const compressed = await compressImage(file);
      setPhoto(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
      clearFieldError('photo');
      setError('');
    } catch (err) {
      console.error('Error compressing image:', err);
      setError('Erro ao processar imagem. Tente outra.');
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Field-level validation
    const errors = {};
    if (!meetingDay && meetingDay !== 0) errors.meetingDay = 'Campo obrigatório.';
    if (visitors === '' || visitors === null || visitors === undefined) errors.visitors = 'Campo obrigatório.';
    else if (parseInt(visitors) < 0) errors.visitors = 'Não pode ser negativo.';
    if (!photo) errors.photo = 'Envie uma foto do encontro.';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    // Check weekly limit again before submitting (safe memory filter)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    // Use local date string instead of ISO to avoid timezone shifts
    const y = startOfWeek.getFullYear();
    const m = String(startOfWeek.getMonth() + 1).padStart(2, '0');
    const d = String(startOfWeek.getDate()).padStart(2, '0');
    const startStr = `${y}-${m}-${d}`;

    setSubmitting(true);
    try {
      const existingQ = query(
        collection(db, 'reports'),
        where('cellId', '==', userData.cellId)
      );
      const existingSnap = await getDocs(existingQ);
      const hasThisWeek = existingSnap.docs.some(d => d.data().date >= startStr);
      if (hasThisWeek) {
        setError('Já existe um relatório enviado esta semana para esta célula.');
        setAlreadySentThisWeek(true);
        setSubmitting(false);
        return;
      }
      let photoURL = '';
      if (photo) {
        const timestamp = Date.now();
        const extension = photo.name.split('.').pop();
        const storagePath = `reports/${userData.cellId}/${timestamp}.${extension}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, photo);
        photoURL = await getDownloadURL(storageRef);
      }

      const membersPresence = members.map(m => ({
        uid: m.uid,
        name: m.name,
        present: presentIds.includes(m.uid),
        observation: memberObservations[m.uid] || ''
      }));

      const reportData = {
        cellId: userData.cellId,
        cellName: cellData?.name || '',
        networkId: userData.networkId || null,
        leaderId: currentUser.uid,
        leaderName: userData.name || currentUser.email,
        date: new Date().toISOString().split('T')[0],
        meetingDay: parseInt(meetingDay),
        meetingDayLabel: DAYS_OF_WEEK.find(d => d.value === parseInt(meetingDay))?.label || '',
        members: membersPresence,
        presentCount: presentIds.length,
        absentCount: members.length - presentIds.length,
        totalMembers: members.length,
        visitors: parseInt(visitors) || 0,
        notes: notes.trim(),
        photoURL,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'reports'), reportData);

      setSuccess('Relatório enviado com sucesso!');
      setTimeout(() => navigate('/reports', { replace: true, state: { t: Date.now() } }), 1500);
    } catch (err) {
      console.error('Erro ao enviar relatório:', err);
      setError('Erro ao salvar o relatório. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Error border style helper
  const errBorder = (field) => fieldErrors[field] ? 'var(--danger-color)' : 'var(--border-color)';

  // Submitting overlay
  const SubmittingOverlay = () => submitting ? (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem'
    }}>
      <div style={{ animation: 'spin 1s linear infinite' }}>
        <Loader2 size={48} color="var(--primary-color)" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-main)', margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: '700' }}>Enviando relatório...</h3>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Fazendo upload da foto e salvando dados.</p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  ) : null;

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Carregando dados da célula...</div>
      </div>
    );
  }

  if (!userData?.cellId || !cellData) {
    return (
      <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Você não está vinculado a nenhuma célula.</h2>
        <button onClick={() => navigate('/reports')} className="btn-primary">Voltar</button>
      </div>
    );
  }

  if (alreadySentThisWeek) {
    return (
      <div style={{ height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', textAlign: 'center', padding: '2rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarDays size={36} color="#f59e0b" />
        </div>
        <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Relatório já enviado esta semana</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '400px', lineHeight: '1.6' }}>
          Você já enviou o relatório semanal desta célula. O próximo envio estará disponível na semana seguinte.
        </p>
        <button onClick={() => navigate('/reports')} className="btn-primary" style={{ marginTop: '0.5rem' }}>
          <ArrowLeft size={18} /> Voltar aos Relatórios
        </button>
      </div>
    );
  }

  const presentCount = presentIds.length;
  const totalCount = members.length;
  const presencePercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <SubmittingOverlay />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <button
          onClick={() => navigate('/reports')}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--surface-color)'}
        >
          <ArrowLeft size={20} color="var(--text-muted)" />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Novo Relatório
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {cellData.name} — Preencha o relatório semanal do encontro da célula.
          </p>
        </div>
      </div>

      <div className="card static" style={{ padding: '2.5rem' }}>
        {error && <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger-color)', color: 'var(--danger-color)', borderRadius: '4px', marginBottom: '2rem', fontSize: '0.875rem', fontWeight: '600' }}>{error}</div>}
        {success && <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success-color)', color: 'var(--success-color)', borderRadius: '4px', marginBottom: '2rem', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18} /> {success}</div>}

        {/* Required fields hint */}
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2rem', fontStyle: 'italic' }}>
          Campos com <span style={{ color: 'var(--danger-color)', fontWeight: '700', fontStyle: 'normal' }}>*</span> são campos obrigatórios.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          {/* Informações do Encontro */}
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <CalendarDays size={14} /> Informações do Encontro
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Dia da Semana da Célula <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                <select
                  value={meetingDay}
                  onChange={e => { setMeetingDay(e.target.value); clearFieldError('meetingDay'); }}
                  style={{ width: '100%', border: `1px solid ${errBorder('meetingDay')}`, borderRadius: '6px', padding: '0.65rem 1rem', background: 'var(--surface-color)', color: 'var(--text-main)', boxShadow: fieldErrors.meetingDay ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }}
                >
                  <option value="">Selecione...</option>
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <FieldError message={fieldErrors.meetingDay} />
              </div>
            </div>
          </div>

          {/* Lista de Presença */}
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <Users size={14} /> Lista de Presença
            </h3>

            {/* Presence Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {presentCount} de {totalCount} presentes
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: presencePercent >= 70 ? 'var(--success-color)' : presencePercent >= 40 ? '#f59e0b' : 'var(--danger-color)' }}>
                    {presencePercent}%
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'var(--surface-hover)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${presencePercent}%`,
                    borderRadius: '3px',
                    background: presencePercent >= 70 ? 'var(--success-color)' : presencePercent >= 40 ? '#f59e0b' : 'var(--danger-color)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
              <button
                type="button"
                onClick={selectAll}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', background: presentIds.length === members.length ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: presentIds.length === members.length ? 'var(--danger-color)' : 'var(--success-color)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {presentIds.length === members.length ? 'Desmarcar Todos' : 'Marcar Todos'}
              </button>
            </div>

            {/* Members List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {members.length > 0 ? members.map(m => {
                const isPresent = presentIds.includes(m.uid);
                return (
                  <div
                    key={m.uid}
                    style={{
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '0.85rem',
                      background: isPresent ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface-color)',
                      borderRadius: '10px',
                      border: isPresent ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-color)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <label 
                        onClick={() => toggleMember(m.uid)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1, userSelect: 'none' }}
                      >
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                          border: isPresent ? '2px solid var(--success-color)' : '2px solid var(--text-muted)',
                          background: isPresent ? 'var(--success-color)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}>
                          {isPresent && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>✓</span>}
                        </div>
                        <span style={{ fontSize: '0.95rem', fontWeight: isPresent ? '700' : '500', color: isPresent ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {m.name}
                        </span>
                      </label>
                      <button 
                        type="button"
                        onClick={() => toggleMember(m.uid)}
                        style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.25rem 0.5rem', borderRadius: '4px', border: 'none', background: isPresent ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isPresent ? 'var(--success-color)' : 'var(--danger-color)', cursor: 'pointer' }}
                      >
                        {isPresent ? 'Presente' : 'Ausente'}
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <FileText size={14} color="var(--text-muted)" />
                      <input 
                        type="text"
                        placeholder={isPresent ? "Observação (opcional)" : "Motivo da ausência..."}
                        value={memberObservations[m.uid] || ''}
                        onChange={(e) => handleObservationChange(m.uid, e.target.value)}
                        style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-main)', padding: '0.2rem 0', outline: 'none' }}
                        onFocus={(e) => e.target.style.borderBottom = '1px solid var(--primary-color)'}
                        onBlur={(e) => e.target.style.borderBottom = '1px solid var(--border-color)'}
                      />
                    </div>
                  </div>
                );
              }) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
                  Nenhum membro cadastrado nesta célula.
                </div>
              )}
            </div>
          </div>

          {/* Visitantes */}
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <UserPlus size={14} /> Visitantes & Registro
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Quantidade de Visitantes <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ex: 3"
                  value={visitors}
                  onChange={e => { setVisitors(e.target.value); clearFieldError('visitors'); }}
                  style={{ width: '100%', border: `1px solid ${errBorder('visitors')}`, borderRadius: '6px', padding: '0.65rem 1rem', boxShadow: fieldErrors.visitors ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none' }}
                />
                <FieldError message={fieldErrors.visitors} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Observações</label>
                <input
                  type="text"
                  placeholder="Pedidos de oração, eventos..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ width: '100%', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.65rem 1rem' }}
                />
              </div>
            </div>
          </div>

          {/* Foto da Célula */}
          <div>
            <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-color)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <Camera size={14} /> Foto do Encontro <span style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>*</span>
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />

            {photoPreview ? (
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img
                  src={photoPreview}
                  alt="Preview do encontro"
                  style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  style={{
                    position: 'absolute', top: '0.75rem', right: '0.75rem',
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                >
                  <X size={16} />
                </button>
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--success-color)', fontWeight: '600' }}>
                  <CheckCircle2 size={14} /> Foto selecionada — {photo?.name}
                </div>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => { fileInputRef.current?.click(); clearFieldError('photo'); }}
                  style={{
                    width: '100%', padding: '2.5rem', borderRadius: '12px',
                    border: fieldErrors.photo ? '2px dashed var(--danger-color)' : '2px dashed var(--border-color)',
                    background: fieldErrors.photo ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s',
                    color: fieldErrors.photo ? 'var(--danger-color)' : 'var(--text-muted)',
                    boxShadow: fieldErrors.photo ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none'
                  }}
                  onMouseOver={e => { if (!fieldErrors.photo) { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.background = 'rgba(79, 70, 229, 0.03)'; } }}
                  onMouseOut={e => { if (!fieldErrors.photo) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  <ImageIcon size={36} strokeWidth={1.5} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Clique para enviar uma foto do encontro</span>
                  <span style={{ fontSize: '0.75rem' }}>JPG, PNG ou WebP • Máximo 5MB</span>
                </button>
                <FieldError message={fieldErrors.photo} />
              </div>
            )}
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={() => navigate('/reports')} style={{ padding: '0.75rem 2rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--surface-color)'}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '0.75rem 2.5rem', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Enviando...' : <><FileText size={18} /> Enviar Relatório</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ReportForm;
