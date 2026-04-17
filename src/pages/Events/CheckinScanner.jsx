import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobal } from '../../contexts/GlobalContext';
import { fetchEventById, checkinParticipant, fetchRegistrations } from '../../services/eventService';
import {
  ArrowLeft, Camera, CheckCircle2, XCircle, Users,
  QrCode, Search, UserCheck, AlertTriangle
} from 'lucide-react';

const CheckinScanner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { notify } = useGlobal();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('scanner'); // 'scanner' | 'manual'
  const [registrations, setRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastResult, setLastResult] = useState(null); // { success, message, name }
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });

  // Camera + Scanner
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    loadEvent();
    loadRegistrations();
    return () => stopCamera();
  }, [id]);

  useEffect(() => {
    if (mode === 'scanner') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await fetchEventById(id);
      if (!data) {
        notify('error', 'Evento não encontrado.');
        navigate('/events');
        return;
      }
      setEvent(data);
    } catch {
      notify('error', 'Erro ao carregar evento.');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async () => {
    try {
      const data = await fetchRegistrations(id);
      setRegistrations(data || []);
      const total = data?.length || 0;
      const checkedIn = data?.filter(r => r.checkedIn)?.length || 0;
      setStats({ total, checkedIn });
    } catch {
      // silently fail
    }
  };

  // =========================================================================
  // Camera & QR Scanning
  // =========================================================================

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start scanning interval
      scanIntervalRef.current = setInterval(() => scanFrame(), 500);
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      notify('error', 'Não foi possível acessar a câmera. Verifique as permissões.');
      setMode('manual');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Dynamic import jsQR (lightweight QR decoder)
    try {
      const jsQR = (await import('jsqr')).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code?.data) {
        handleQRResult(code.data);
      }
    } catch {
      // jsQR not loaded yet, will retry
    }
  }, [processing]);

  const handleQRResult = async (rawData) => {
    if (processing) return;

    try {
      setProcessing(true);
      const data = JSON.parse(rawData);

      if (data.eventId !== id) {
        setLastResult({ success: false, message: 'QR Code pertence a outro evento!', name: '' });
        return;
      }

      const response = await checkinParticipant(id, data.regId, data.token);
      setLastResult({
        success: true,
        message: 'Check-in realizado!',
        name: response?.userName || 'Participante',
      });
      notify('success', `Check-in: ${response?.userName || 'Confirmado!'}`);
      loadRegistrations(); // Refresh stats
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao fazer check-in.';
      setLastResult({ success: false, message: msg, name: '' });
    } finally {
      setProcessing(false);
      // Clear result after 4 seconds
      setTimeout(() => setLastResult(null), 4000);
    }
  };

  // =========================================================================
  // Manual Check-in
  // =========================================================================

  const handleManualCheckin = async (reg) => {
    if (reg.checkedIn) {
      notify('error', `${reg.userName} já fez check-in.`);
      return;
    }
    try {
      setProcessing(true);
      await checkinParticipant(id, reg.id, reg.qrCodeToken || reg.id);
      notify('success', `Check-in: ${reg.userName}`);
      setLastResult({ success: true, message: 'Check-in realizado!', name: reg.userName });
      loadRegistrations();
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao fazer check-in.';
      notify('error', msg);
    } finally {
      setProcessing(false);
      setTimeout(() => setLastResult(null), 3000);
    }
  };

  const filteredRegs = registrations.filter(r =>
    r.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =========================================================================
  // Render
  // =========================================================================

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{
          width: '40px', height: '40px', border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary-color)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!event) return null;

  const progress = stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0;

  return (
    <div className="animate-fade-in" style={{
      display: 'flex', flexDirection: 'column', gap: '1.25rem',
      paddingBottom: '2rem', maxWidth: '600px', margin: '0 auto', width: '100%',
    }}>

      {/* Back */}
      <button
        onClick={() => navigate(`/events/${id}`)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0',
          alignSelf: 'flex-start',
        }}
      >
        <ArrowLeft size={16} /> Voltar para o Evento
      </button>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Check-in</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{event.title}</p>
      </div>

      {/* Stats Bar */}
      <div className="card static" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: 'var(--primary-light)' }} />
            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>
              {stats.checkedIn}/{stats.total}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>presentes</span>
          </div>
          <span style={{ fontWeight: '700', color: 'var(--primary-light)', fontSize: '0.95rem' }}>
            {progress.toFixed(0)}%
          </span>
        </div>
        <div style={{
          width: '100%', height: '6px', borderRadius: '3px',
          background: 'var(--surface-hover)', overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`, height: '100%', borderRadius: '3px',
            background: 'linear-gradient(90deg, var(--primary-color), #10b981)',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Mode Toggle */}
      <div style={{
        display: 'flex', gap: '0.25rem',
        background: 'var(--surface-color)',
        padding: '0.35rem', borderRadius: '12px',
        border: '1px solid var(--border-color)',
      }}>
        {[
          { key: 'scanner', label: 'Scanner QR', icon: Camera },
          { key: 'manual', label: 'Lista Manual', icon: Search },
        ].map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              style={{
                flex: 1, padding: '0.65rem 1rem',
                borderRadius: '10px', fontSize: '0.875rem',
                fontWeight: mode === tab.key ? '700' : '500',
                color: mode === tab.key ? '#fff' : 'var(--text-muted)',
                background: mode === tab.key
                  ? 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)'
                  : 'transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              }}
            >
              <TabIcon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Result Toast */}
      {lastResult && (
        <div style={{
          padding: '1rem 1.25rem', borderRadius: '12px',
          background: lastResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${lastResult.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          animation: 'fadeIn 0.3s ease',
        }}>
          {lastResult.success
            ? <CheckCircle2 size={24} style={{ color: '#10b981', flexShrink: 0 }} />
            : <XCircle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
          }
          <div>
            <div style={{
              fontWeight: '700', fontSize: '0.95rem',
              color: lastResult.success ? '#10b981' : '#ef4444',
            }}>
              {lastResult.message}
            </div>
            {lastResult.name && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {lastResult.name}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scanner Mode */}
      {mode === 'scanner' && (
        <div className="card static" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{
            position: 'relative', borderRadius: '12px', overflow: 'hidden',
            background: '#000', marginBottom: '1rem',
          }}>
            <video
              ref={videoRef}
              style={{ width: '100%', display: 'block', maxHeight: '360px', objectFit: 'cover' }}
              playsInline
              muted
            />
            {/* Scan overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: '200px', height: '200px',
                border: '3px solid rgba(99, 102, 241, 0.7)',
                borderRadius: '16px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
              }} />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Aponte a câmera para o QR Code do participante.
          </p>
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{
              position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }} />
            <input
              type="text"
              placeholder="Buscar participante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem',
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px', color: 'var(--text-main)',
                fontSize: '0.925rem', outline: 'none',
              }}
            />
          </div>

          {/* List */}
          <div className="card static" style={{ padding: '0', overflow: 'hidden' }}>
            {filteredRegs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {searchTerm ? 'Nenhum participante encontrado.' : 'Nenhuma inscrição.'}
              </div>
            ) : (
              filteredRegs.map((reg, i) => (
                <div
                  key={reg.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.85rem 1.25rem',
                    borderBottom: i < filteredRegs.length - 1 ? '1px solid var(--border-color)' : 'none',
                    opacity: reg.checkedIn ? 0.6 : 1,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{reg.userName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {reg.cellName || 'Sem célula'}
                    </div>
                  </div>

                  {reg.checkedIn ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      color: '#10b981', fontSize: '0.8rem', fontWeight: '700',
                    }}>
                      <CheckCircle2 size={16} /> Presente
                    </div>
                  ) : (
                    <button
                      onClick={() => handleManualCheckin(reg)}
                      disabled={processing}
                      style={{
                        padding: '0.45rem 0.85rem', borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
                        color: '#fff', border: 'none', cursor: 'pointer',
                        fontWeight: '600', fontSize: '0.8rem',
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        opacity: processing ? 0.5 : 1,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <UserCheck size={14} /> Check-in
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default CheckinScanner;
