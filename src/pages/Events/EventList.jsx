import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobal } from '../../contexts/GlobalContext';
import { fetchEvents, deleteEvent, updateEventStatus } from '../../services/eventService';
import { Plus, Calendar, MapPin, Users, Clock, Tag, Trash2, Edit3, Eye, MoreVertical, Filter } from 'lucide-react';

const STATUS_LABELS = {
  draft: { label: 'Rascunho', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' },
  published: { label: 'Publicado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  ongoing: { label: 'Em Andamento', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  finished: { label: 'Encerrado', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
};

const TYPE_LABELS = {
  celula: 'Célula',
  rede: 'Rede',
  geral: 'Geral',
};

const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'published', label: 'Próximos' },
  { key: 'ongoing', label: 'Em Andamento' },
  { key: 'finished', label: 'Encerrados' },
];

const EventList = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { showLoader, hideLoader, notify } = useGlobal();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);

  const isAdmin = ['root', 'discipulador', 'lider', 'leader'].includes(userData?.role);
  const canCreate = ['root', 'discipulador', 'lider', 'leader'].includes(userData?.role);

  useEffect(() => {
    loadEvents();
  }, [activeTab]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId && !e.target.closest('[data-dropdown-menu]')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (activeTab !== 'all') {
        filters.status = activeTab;
      }
      const data = await fetchEvents(filters);
      setEvents(data);
    } catch (err) {
      notify('error', 'Erro ao carregar eventos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Tem certeza que deseja excluir o evento "${title}"?`)) return;
    try {
      showLoader('Excluindo evento...');
      await deleteEvent(id);
      notify('success', 'Evento excluído com sucesso.');
      loadEvents();
    } catch (err) {
      notify('error', 'Erro ao excluir evento.');
    } finally {
      hideLoader();
      setOpenMenuId(null);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      showLoader('Atualizando status...');
      await updateEventStatus(id, newStatus);
      notify('success', `Status alterado para "${STATUS_LABELS[newStatus]?.label}".`);
      loadEvents();
    } catch (err) {
      notify('error', 'Erro ao atualizar status.');
    } finally {
      hideLoader();
      setOpenMenuId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Gestão de Eventos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Planeje, publique e acompanhe os eventos da sua comunidade.
          </p>
        </div>
        {canCreate && (
          <button
            className="btn-primary"
            onClick={() => navigate('/events/new')}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Plus size={18} /> Novo Evento
          </button>
        )}
      </div>

      {/* Tabs de Filtro */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        background: 'var(--surface-color)',
        padding: '0.35rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab.key ? '700' : '500',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)'
                : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flex: '0 0 auto',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid var(--border-color)',
            borderTopColor: 'var(--primary-color)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <div className="card static" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <Calendar size={36} style={{ color: 'var(--primary-light)' }} />
          </div>
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Nenhum evento encontrado
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            {activeTab === 'all'
              ? 'Comece criando o primeiro evento da sua comunidade.'
              : `Não há eventos com status "${TABS.find(t => t.key === activeTab)?.label}".`}
          </p>
          {canCreate && activeTab === 'all' && (
            <button className="btn-primary" onClick={() => navigate('/events/new')}>
              <Plus size={18} /> Criar Primeiro Evento
            </button>
          )}
        </div>
      )}

      {/* Grid de Cards */}
      {!loading && events.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {events.map((event) => {
            const statusInfo = STATUS_LABELS[event.status] || STATUS_LABELS.draft;
            return (
              <div
                key={event.id}
                className="card"
                style={{
                  padding: '0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
                onClick={() => navigate(`/events/${event.id}`)}
              >
                {/* Banner */}
                <div style={{
                  height: '160px',
                  background: event.bannerURL
                    ? `url(${event.bannerURL}) center/cover no-repeat`
                    : 'linear-gradient(135deg, rgba(79, 70, 229, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)',
                  position: 'relative',
                }}>
                  {/* Status Badge */}
                  <div style={{
                    position: 'absolute', top: '12px', left: '12px',
                    padding: '0.3rem 0.75rem', borderRadius: '20px',
                    background: statusInfo.bg, color: statusInfo.color,
                    fontSize: '0.75rem', fontWeight: '700',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${statusInfo.color}33`,
                  }}>
                    {statusInfo.label}
                  </div>

                  {/* Type Badge */}
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    padding: '0.3rem 0.65rem', borderRadius: '20px',
                    background: 'rgba(0,0,0,0.5)', color: '#fff',
                    fontSize: '0.7rem', fontWeight: '600',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}>
                    <Tag size={11} />
                    {TYPE_LABELS[event.type] || event.type}
                  </div>

                  {/* Gradient overlay bottom */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
                    background: 'linear-gradient(to top, rgba(30, 41, 59, 1), transparent)',
                  }} />
                </div>

                {/* Content */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3 style={{
                    fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)',
                    lineHeight: '1.3', marginBottom: '0',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {event.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Calendar size={14} style={{ flexShrink: 0 }} />
                      <span>{formatDate(event.date)}</span>
                      {formatTime(event.date) && (
                        <>
                          <Clock size={14} style={{ flexShrink: 0, marginLeft: '0.25rem' }} />
                          <span>{formatTime(event.date)}</span>
                        </>
                      )}
                    </div>

                    {event.location?.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <MapPin size={14} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.location.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)',
                    marginTop: 'auto',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-light)', fontSize: '0.85rem', fontWeight: '600' }}>
                      <Users size={15} />
                      <span>{event.registrationCount || 0} inscrito{(event.registrationCount || 0) !== 1 ? 's' : ''}</span>
                    </div>

                    {event.isPaid && (
                      <div style={{
                        padding: '0.25rem 0.6rem', borderRadius: '6px',
                        background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b',
                        fontSize: '0.8rem', fontWeight: '700',
                      }}>
                        R$ {Number(event.price || 0).toFixed(2)}
                      </div>
                    )}

                    {!event.isPaid && (
                      <div style={{
                        padding: '0.25rem 0.6rem', borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
                        fontSize: '0.8rem', fontWeight: '700',
                      }}>
                        Gratuito
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Actions Menu */}
                {isAdmin && (
                  <div
                    data-dropdown-menu
                    style={{ position: 'absolute', top: '12px', right: event.type ? '90px' : '12px', zIndex: 5 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                        border: 'none', cursor: 'pointer', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenuId === event.id && (
                      <div style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: '0.35rem',
                        background: 'var(--surface-color)', border: '1px solid var(--border-color)',
                        borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        overflow: 'hidden', minWidth: '180px', zIndex: 20,
                      }}>
                        <button
                          onClick={() => { navigate(`/events/${event.id}`); setOpenMenuId(null); }}
                          style={{
                            width: '100%', padding: '0.65rem 1rem', border: 'none',
                            background: 'none', color: 'var(--text-main)', fontSize: '0.85rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            textAlign: 'left',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Eye size={14} /> Ver Detalhes
                        </button>
                        <button
                          onClick={() => { navigate(`/events/${event.id}/edit`); setOpenMenuId(null); }}
                          style={{
                            width: '100%', padding: '0.65rem 1rem', border: 'none',
                            background: 'none', color: 'var(--text-main)', fontSize: '0.85rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            textAlign: 'left',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Edit3 size={14} /> Editar
                        </button>

                        {event.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(event.id, 'published')}
                            style={{
                              width: '100%', padding: '0.65rem 1rem', border: 'none',
                              background: 'none', color: '#10b981', fontSize: '0.85rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                              textAlign: 'left',
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            ✓ Publicar
                          </button>
                        )}

                        {event.status === 'published' && (
                          <button
                            onClick={() => handleStatusChange(event.id, 'ongoing')}
                            style={{
                              width: '100%', padding: '0.65rem 1rem', border: 'none',
                              background: 'none', color: '#f59e0b', fontSize: '0.85rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                              textAlign: 'left',
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            ▶ Iniciar Evento
                          </button>
                        )}

                        {['published', 'ongoing'].includes(event.status) && (
                          <button
                            onClick={() => handleStatusChange(event.id, 'finished')}
                            style={{
                              width: '100%', padding: '0.65rem 1rem', border: 'none',
                              background: 'none', color: '#6366f1', fontSize: '0.85rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                              textAlign: 'left',
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            ■ Encerrar
                          </button>
                        )}

                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />

                        <button
                          onClick={() => handleDelete(event.id, event.title)}
                          style={{
                            width: '100%', padding: '0.65rem 1rem', border: 'none',
                            background: 'none', color: '#ef4444', fontSize: '0.85rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            textAlign: 'left',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Trash2 size={14} /> Excluir
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventList;
