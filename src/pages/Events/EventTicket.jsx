import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobal } from '../../contexts/GlobalContext';
import { fetchEventById } from '../../services/eventService';
import { ArrowLeft, Calendar, MapPin, Clock, Download } from 'lucide-react';
import QRCode from 'qrcode';

const EventTicket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const { notify } = useGlobal();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadEvent();
  }, [id]);

  useEffect(() => {
    if (event && event.currentUserRegistration) {
      generateQR();
    }
  }, [event]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await fetchEventById(id);
      if (!data) {
        notify('error', 'Evento não encontrado.');
        navigate('/events');
        return;
      }
      if (!data.currentUserRegistration) {
        notify('error', 'Você não está inscrito neste evento.');
        navigate(`/events/${id}`);
        return;
      }
      setEvent(data);
    } catch (err) {
      notify('error', 'Erro ao carregar evento.');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async () => {
    try {
      const reg = event.currentUserRegistration;
      const qrPayload = JSON.stringify({
        eventId: id,
        regId: reg.id,
        userId: currentUser?.uid,
        token: reg.qrCodeToken || reg.id,
      });

      const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 280,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
      notify('error', 'Erro ao gerar QR Code.');
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `ingresso-${event?.title?.replace(/\s+/g, '-') || 'evento'}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

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

  const reg = event.currentUserRegistration;

  return (
    <div className="animate-fade-in" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '1.5rem', paddingBottom: '2rem', maxWidth: '480px', margin: '0 auto', width: '100%',
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

      {/* Ticket Card */}
      <div style={{
        width: '100%',
        background: 'var(--surface-color)',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      }}>
        {/* Top — Event Info */}
        <div style={{
          padding: '1.75rem 1.5rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          borderBottom: '1px dashed var(--border-color)',
          position: 'relative',
        }}>
          {/* Notch circles */}
          <div style={{
            position: 'absolute', bottom: '-14px', left: '-14px',
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--bg-main)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-14px', right: '-14px',
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--bg-main)',
          }} />

          <div style={{
            fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'var(--primary-light)', marginBottom: '0.5rem',
          }}>
            🎫 Ingresso Digital
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.75rem', lineHeight: '1.3' }}>
            {event.title}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Calendar size={14} />
              <span>{formatDate(event.date)}</span>
            </div>
            {formatTime(event.date) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Clock size={14} />
                <span>{formatTime(event.date)}{event.endDate ? ` — ${formatTime(event.endDate)}` : ''}</span>
              </div>
            )}
            {event.location?.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <MapPin size={14} />
                <span>{event.location.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle — QR Code */}
        <div style={{
          padding: '2rem 1.5rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '1rem',
        }}>
          {qrDataUrl ? (
            <div style={{
              padding: '16px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            }}>
              <img
                src={qrDataUrl}
                alt="QR Code do Ingresso"
                style={{ width: '280px', height: '280px', display: 'block' }}
              />
            </div>
          ) : (
            <div style={{
              width: '280px', height: '280px', borderRadius: '16px',
              background: 'var(--surface-hover)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', fontSize: '0.9rem',
            }}>
              Gerando QR Code...
            </div>
          )}

          <p style={{
            fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center',
            maxWidth: '300px', lineHeight: '1.5',
          }}>
            Apresente este QR Code na entrada do evento para fazer o check-in.
          </p>

          {reg?.checkedIn && (
            <div style={{
              padding: '0.6rem 1.25rem', borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
              fontWeight: '700', fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              ✓ Check-in Realizado
            </div>
          )}
        </div>

        {/* Bottom — Participant Info */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px dashed var(--border-color)',
          background: 'rgba(0, 0, 0, 0.02)',
          position: 'relative',
        }}>
          {/* Notch circles */}
          <div style={{
            position: 'absolute', top: '-14px', left: '-14px',
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--bg-main)',
          }} />
          <div style={{
            position: 'absolute', top: '-14px', right: '-14px',
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--bg-main)',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                Participante
              </div>
              <div style={{ fontWeight: '700', fontSize: '1rem', marginTop: '0.15rem' }}>
                {userData?.name || userData?.displayName || 'Participante'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                Status
              </div>
              <div style={{
                fontWeight: '700', fontSize: '0.85rem', marginTop: '0.15rem',
                color: reg?.status === 'confirmed' ? '#10b981' : '#f59e0b',
              }}>
                {reg?.status === 'confirmed' ? 'Confirmado' : 'Pend. Pgto'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      {qrDataUrl && (
        <button
          className="btn-secondary"
          onClick={handleDownload}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Download size={16} /> Salvar QR Code
        </button>
      )}
    </div>
  );
};

export default EventTicket;
