import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobal } from '../../contexts/GlobalContext';
import {
  fetchEventById,
  registerForEvent,
  cancelRegistration,
  fetchRegistrations,
  updateEventStatus
} from '../../services/eventService';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Tag, Edit3, QrCode,
  UserPlus, UserMinus, ExternalLink, ClipboardList, ImageIcon,
  CheckCircle2, XCircle, DollarSign, Share2
} from 'lucide-react';

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' },
  published: { label: 'Publicado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  ongoing: { label: 'Em Andamento', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  finished: { label: 'Encerrado', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
};

const TABS = [
  { key: 'overview', label: 'Visão Geral', icon: Calendar },
  { key: 'registrations', label: 'Inscritos', icon: ClipboardList },
  { key: 'gallery', label: 'Mural', icon: ImageIcon },
];

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const { showLoader, hideLoader, notify } = useGlobal();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [registering, setRegistering] = useState(false);

  const isAdmin = ['root', 'discipulador', 'lider', 'leader'].includes(userData?.role);
  const isCreator = event?.createdBy === currentUser?.uid;

  useEffect(() => {
    loadEvent();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'registrations' && isAdmin) {
      loadRegistrations();
    }
  }, [activeTab]);

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
    } catch (err) {
      notify('error', 'Erro ao carregar evento.');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async () => {
    try {
      setLoadingRegs(true);
      const data = await fetchRegistrations(id);
      setRegistrations(data);
    } catch (err) {
      notify('error', 'Erro ao carregar inscrições.');
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      await registerForEvent(id);
      notify('success', 'Inscrição realizada com sucesso!');
      loadEvent(); // Refresh
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao se inscrever.';
      notify('error', msg);
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar sua inscrição?')) return;
    try {
      showLoader('Cancelando inscrição...');
      await cancelRegistration(id);
      notify('success', 'Inscrição cancelada.');
      loadEvent();
    } catch (err) {
      notify('error', 'Erro ao cancelar inscrição.');
    } finally {
      hideLoader();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
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

  const statusInfo = STATUS_CONFIG[event.status] || STATUS_CONFIG.draft;
  const userReg = event.currentUserRegistration;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>

      {/* Back Button */}
      <button
        onClick={() => navigate('/events')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0',
          alignSelf: 'flex-start',
        }}
      >
        <ArrowLeft size={16} /> Voltar para Eventos
      </button>

      {/* Hero Banner */}
      <div style={{
        borderRadius: '16px', overflow: 'hidden', position: 'relative',
        height: '240px',
        background: event.bannerURL
          ? `url(${event.bannerURL}) center/cover no-repeat`
          : 'linear-gradient(135deg, rgba(79, 70, 229, 0.4) 0%, rgba(6, 182, 212, 0.4) 100%)',
      }}>
        {/* Dark Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.2) 100%)',
        }} />

        {/* Content over banner */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '1.5rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.25rem 0.6rem', borderRadius: '20px',
                background: statusInfo.bg, color: statusInfo.color,
                fontSize: '0.75rem', fontWeight: '700',
              }}>
                {statusInfo.label}
              </span>
              <span style={{
                padding: '0.25rem 0.6rem', borderRadius: '20px',
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                fontSize: '0.75rem', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}>
                <Tag size={11} />
                {event.type === 'celula' ? 'Célula' : event.type === 'rede' ? 'Rede' : 'Geral'}
              </span>
            </div>
            <h1 style={{
              fontSize: '1.75rem', fontWeight: '800', color: '#fff', marginBottom: '0',
              background: 'none', WebkitTextFillColor: 'unset',
            }}>
              {event.title}
            </h1>
          </div>

          {/* Admin Actions */}
          {(isAdmin || isCreator) && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={() => navigate(`/events/${id}/edit`)}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                <Edit3 size={14} /> Editar
              </button>
              {['published', 'ongoing'].includes(event.status) && (
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/events/${id}/checkin`)}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  <QrCode size={14} /> Check-in
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem',
        background: 'var(--surface-color)',
        padding: '0.35rem', borderRadius: '12px',
        border: '1px solid var(--border-color)',
      }}>
        {TABS.map(tab => {
          // Esconder tabs admin para membros
          if (tab.key === 'registrations' && !isAdmin) return null;
          if (tab.key === 'gallery' && !['finished', 'ongoing'].includes(event.status) && !isAdmin) return null;

          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: activeTab === tab.key ? '700' : '500',
                color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                background: activeTab === tab.key
                  ? 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)'
                  : 'transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                flex: '1',
                justifyContent: 'center',
              }}
            >
              <TabIcon size={15} />
              {tab.label}
              {tab.key === 'registrations' && (
                <span style={{
                  background: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.4rem',
                  borderRadius: '8px', fontSize: '0.7rem',
                }}>
                  {event.registrationCount || 0}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="event-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
          {/* Left: Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Description */}
            {event.description && (
              <div className="card static" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Sobre o Evento</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontSize: '0.925rem' }}>
                  {event.description}
                </p>
              </div>
            )}

            {/* Info Grid */}
            <div className="card static" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Detalhes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Calendar size={18} style={{ color: 'var(--primary-light)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{formatDate(event.date)}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {formatTime(event.date)}
                      {event.endDate && ` — ${formatTime(event.endDate)}`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <MapPin size={18} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{event.location?.name || 'Local não definido'}</div>
                    {event.location?.lat && event.location?.lng && (
                      <a
                        href={`https://www.google.com/maps?q=${event.location.lat},${event.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--secondary-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        Ver no mapa <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Users size={18} style={{ color: '#f59e0b' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                      {event.registrationCount || 0} inscrito{(event.registrationCount || 0) !== 1 ? 's' : ''}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {event.maxCapacity ? `${event.maxCapacity} vagas no total` : 'Vagas ilimitadas'}
                    </div>
                  </div>
                </div>

                {event.isPaid && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.1)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <DollarSign size={18} style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>R$ {Number(event.price).toFixed(2)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Evento pago</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card static" style={{ padding: '1.5rem', textAlign: 'center' }}>
              {/* Not registered */}
              {!userReg && ['published', 'ongoing'].includes(event.status) && (
                <>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'rgba(79, 70, 229, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}>
                    <UserPlus size={26} style={{ color: 'var(--primary-light)' }} />
                  </div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Participar deste evento</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    {event.isPaid
                      ? `Inscreva-se e realize o pagamento de R$ ${Number(event.price).toFixed(2)}.`
                      : 'Confirme sua presença gratuitamente.'}
                  </p>
                  <button
                    className="btn-primary"
                    onClick={handleRegister}
                    disabled={registering}
                    style={{ width: '100%', justifyContent: 'center', opacity: registering ? 0.6 : 1 }}
                  >
                    {registering ? 'Inscrevendo...' : (
                      <><UserPlus size={16} /> Inscrever-se</>
                    )}
                  </button>
                </>
              )}

              {/* Already registered */}
              {userReg && (
                <>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: userReg.checkedIn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}>
                    {userReg.checkedIn
                      ? <CheckCircle2 size={26} style={{ color: '#10b981' }} />
                      : <QrCode size={26} style={{ color: 'var(--primary-light)' }} />
                    }
                  </div>
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    {userReg.checkedIn ? 'Check-in realizado ✓' : 'Você está inscrito!'}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {userReg.checkedIn
                      ? 'Sua presença foi confirmada no evento.'
                      : userReg.status === 'pending_payment'
                        ? 'Realize o pagamento para confirmar.'
                        : 'Apresente seu QR Code na entrada do evento.'}
                  </p>

                  {/* Payment Link */}
                  {userReg.status === 'pending_payment' && event.paymentLink && (
                    <a
                      href={event.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{
                        width: '100%', justifyContent: 'center', marginBottom: '0.75rem',
                        textDecoration: 'none', display: 'flex',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      }}
                    >
                      <DollarSign size={16} /> Realizar Pagamento
                    </a>
                  )}

                  {/* QR Code ticket link */}
                  {!userReg.checkedIn && userReg.status === 'confirmed' && (
                    <button
                      className="btn-primary"
                      onClick={() => navigate(`/events/${id}/ticket`)}
                      style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
                    >
                      <QrCode size={16} /> Ver Meu QR Code
                    </button>
                  )}

                  {/* Cancel */}
                  {!userReg.checkedIn && (
                    <button
                      onClick={handleCancelRegistration}
                      style={{
                        width: '100%', padding: '0.6rem', borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        background: 'rgba(239, 68, 68, 0.06)',
                        color: '#ef4444', fontWeight: '600', fontSize: '0.85rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '0.4rem',
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                    >
                      <UserMinus size={14} /> Cancelar Inscrição
                    </button>
                  )}
                </>
              )}

              {/* Event not open */}
              {!userReg && !['published', 'ongoing'].includes(event.status) && (
                <>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'rgba(148, 163, 184, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}>
                    <XCircle size={26} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                    {event.status === 'finished' ? 'Evento encerrado' : 'Inscrições fechadas'}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {event.status === 'draft'
                      ? 'Este evento ainda não foi publicado.'
                      : 'Não é possível se inscrever neste evento.'}
                  </p>
                </>
              )}
            </div>

            {/* Scope info */}
            {(event.scope?.cellName || event.scope?.networkName) && (
              <div className="card static" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Escopo
                </div>
                {event.scope.cellName && (
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>🏠 {event.scope.cellName}</div>
                )}
                {event.scope.networkName && (
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '0.25rem' }}>🔗 {event.scope.networkName}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Registrations Tab */}
      {activeTab === 'registrations' && isAdmin && (
        <div className="card static" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Lista de Inscritos ({registrations.length})</h3>
          </div>

          {loadingRegs ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Carregando inscrições...
            </div>
          ) : registrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p>Nenhuma inscrição ainda.</p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Célula</th>
                    <th>Status</th>
                    <th>Pagamento</th>
                    <th>Check-in</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(reg => (
                    <tr key={reg.id}>
                      <td style={{ fontWeight: '600' }}>{reg.userName}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{reg.cellName || '—'}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600',
                          background: reg.status === 'confirmed' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                          color: reg.status === 'confirmed' ? '#10b981' : '#f59e0b',
                        }}>
                          {reg.status === 'confirmed' ? 'Confirmado' : 'Pend. Pagamento'}
                        </span>
                      </td>
                      <td>
                        {reg.paymentConfirmed
                          ? <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                          : <XCircle size={16} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                        }
                      </td>
                      <td>
                        {reg.checkedIn
                          ? <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.85rem' }}>✓ Presente</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                        }
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Gallery Tab — Placeholder for Phase 4 */}
      {activeTab === 'gallery' && (
        <div className="card static" style={{ padding: '3rem', textAlign: 'center' }}>
          <ImageIcon size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-muted)' }}>Mural de Memórias</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            O mural de fotos será ativado após o encerramento do evento.
          </p>
        </div>
      )}

      {/* Responsive fix for overview grid */}
      <style>{`
        @media (max-width: 768px) {
          .event-overview-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .animate-fade-in h1 {
            font-size: 1.35rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EventDetails;
