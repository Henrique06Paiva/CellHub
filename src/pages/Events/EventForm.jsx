import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobal } from '../../contexts/GlobalContext';
import { saveEvent, fetchEventById } from '../../services/eventService';
import { fetchCells } from '../../services/cellService';
import { fetchNetworks } from '../../services/networkService';
import { ArrowLeft, ArrowRight, Check, Upload, X, MapPin, Calendar as CalendarIcon, DollarSign, Image, Info } from 'lucide-react';

const STEPS = [
  { key: 'info', label: 'Informações', icon: Info },
  { key: 'datetime', label: 'Data e Local', icon: CalendarIcon },
  { key: 'config', label: 'Configurações', icon: DollarSign },
  { key: 'banner', label: 'Banner', icon: Image },
];

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { showLoader, hideLoader, notify } = useGlobal();

  const isEditing = !!id;

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'geral',
    scope: { cellId: null, cellName: null, networkId: null, networkName: null },
    date: '',
    endDate: '',
    location: { name: '', lat: null, lng: null },
    isPaid: false,
    price: '',
    paymentLink: '',
    maxCapacity: '',
    status: 'draft',
    bannerURL: '',
  });

  // Listas para selects de escopo
  const [cells, setCells] = useState([]);
  const [networks, setNetworks] = useState([]);

  useEffect(() => {
    loadScopeData();
    if (isEditing) loadEvent();
  }, [id]);

  const loadScopeData = async () => {
    try {
      const [cellsData, networksData] = await Promise.all([
        fetchCells(userData).catch(() => []),
        fetchNetworks ? fetchNetworks(userData).catch(() => []) : Promise.resolve([]),
      ]);
      setCells(cellsData || []);
      setNetworks(networksData || []);
    } catch (err) {
      console.error('Erro ao carregar dados de escopo:', err);
    }
  };

  const loadEvent = async () => {
    try {
      showLoader('Carregando evento...');
      const data = await fetchEventById(id);
      if (!data) {
        notify('error', 'Evento não encontrado.');
        navigate('/events');
        return;
      }

      // Formatar datas para input datetime-local
      const formatForInput = (dateStr) => {
        if (!dateStr) return '';
        try {
          const d = new Date(dateStr);
          return d.toISOString().slice(0, 16);
        } catch {
          return dateStr;
        }
      };

      setFormData({
        title: data.title || '',
        description: data.description || '',
        type: data.type || 'geral',
        scope: data.scope || { cellId: null, cellName: null, networkId: null, networkName: null },
        date: formatForInput(data.date),
        endDate: formatForInput(data.endDate),
        location: data.location || { name: '', lat: null, lng: null },
        isPaid: data.isPaid || false,
        price: data.price || '',
        paymentLink: data.paymentLink || '',
        maxCapacity: data.maxCapacity || '',
        status: data.status || 'draft',
        bannerURL: data.bannerURL || '',
      });

      if (data.bannerURL) {
        setBannerPreview(data.bannerURL);
      }
    } catch (err) {
      notify('error', 'Erro ao carregar evento.');
      navigate('/events');
    } finally {
      hideLoader();
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleScopeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      scope: { ...prev.scope, [field]: value }
    }));
  };

  const handleLocationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('error', 'Selecione um arquivo de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify('error', 'A imagem deve ter no máximo 5MB.');
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.title.trim()) newErrors.title = 'Título é obrigatório.';
      if (formData.type === 'celula' && !formData.scope.cellId) newErrors.cellId = 'Selecione uma célula.';
      if (formData.type === 'rede' && !formData.scope.networkId) newErrors.networkId = 'Selecione uma rede.';
    }

    if (step === 1) {
      if (!formData.date) newErrors.date = 'Data de início é obrigatória.';
      if (!formData.location.name.trim()) newErrors.locationName = 'Local é obrigatório.';
    }

    if (step === 2) {
      if (formData.isPaid) {
        if (!formData.price || Number(formData.price) <= 0) newErrors.price = 'Defina um valor válido.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      showLoader(isEditing ? 'Salvando alterações...' : 'Criando evento...');

      const submitData = {
        ...formData,
        price: formData.isPaid ? Number(formData.price) : 0,
        maxCapacity: formData.maxCapacity ? Number(formData.maxCapacity) : null,
      };

      await saveEvent(isEditing ? id : null, submitData, bannerFile);
      notify('success', isEditing ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');
      navigate('/events');
    } catch (err) {
      notify('error', `Erro ao ${isEditing ? 'atualizar' : 'criar'} evento.`);
    } finally {
      hideLoader();
    }
  };

  // Auto-set scope based on type change
  useEffect(() => {
    if (formData.type === 'geral') {
      handleScopeChange('cellId', null);
      handleScopeChange('cellName', null);
      handleScopeChange('networkId', null);
      handleScopeChange('networkName', null);
    }
  }, [formData.type]);

  // =========================================================================
  // Styles
  // =========================================================================
  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-main)',
    fontSize: '0.925rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  };

  const errorStyle = {
    color: 'var(--danger-color)',
    fontSize: '0.8rem',
    marginTop: '0.3rem',
  };

  const fieldGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  };

  // =========================================================================
  // Render Steps
  // =========================================================================

  const renderStep0 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Título do Evento *</label>
        <input
          style={{ ...inputStyle, ...(errors.title ? { borderColor: 'var(--danger-color)' } : {}) }}
          placeholder="Ex: Retiro de Jovens 2026"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
          onBlur={(e) => e.target.style.borderColor = errors.title ? 'var(--danger-color)' : 'var(--border-color)'}
        />
        {errors.title && <span style={errorStyle}>{errors.title}</span>}
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Descrição</label>
        <textarea
          style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
          placeholder="Descrição do evento, programação, o que trazer..."
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Tipo de Evento *</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'geral', label: '🌐 Geral', desc: 'Visível para todos' },
            { key: 'rede', label: '🔗 Rede', desc: 'Visível para a rede' },
            { key: 'celula', label: '🏠 Célula', desc: 'Visível para a célula' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => handleChange('type', opt.key)}
              style={{
                flex: '1 1 100px',
                padding: '1rem',
                borderRadius: '10px',
                border: `2px solid ${formData.type === opt.key ? 'var(--primary-color)' : 'var(--border-color)'}`,
                background: formData.type === opt.key ? 'rgba(79, 70, 229, 0.08)' : 'var(--surface-color)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{opt.label.split(' ')[0]}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: formData.type === opt.key ? 'var(--primary-light)' : 'var(--text-main)' }}>
                {opt.label.split(' ').slice(1).join(' ')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Scope selector condional */}
      {formData.type === 'rede' && (
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Rede *</label>
          <select
            style={{ ...inputStyle, ...(errors.networkId ? { borderColor: 'var(--danger-color)' } : {}) }}
            value={formData.scope.networkId || ''}
            onChange={(e) => {
              const net = networks.find(n => n.id === e.target.value);
              handleScopeChange('networkId', e.target.value || null);
              handleScopeChange('networkName', net?.name || null);
            }}
          >
            <option value="">Selecione uma rede...</option>
            {networks.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
          {errors.networkId && <span style={errorStyle}>{errors.networkId}</span>}
        </div>
      )}

      {formData.type === 'celula' && (
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Célula *</label>
          <select
            style={{ ...inputStyle, ...(errors.cellId ? { borderColor: 'var(--danger-color)' } : {}) }}
            value={formData.scope.cellId || ''}
            onChange={(e) => {
              const cell = cells.find(c => c.id === e.target.value);
              handleScopeChange('cellId', e.target.value || null);
              handleScopeChange('cellName', cell?.name || null);
              handleScopeChange('networkId', cell?.networkId || null);
            }}
          >
            <option value="">Selecione uma célula...</option>
            {cells.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.cellId && <span style={errorStyle}>{errors.cellId}</span>}
        </div>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="event-form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Data e Hora de Início *</label>
          <input
            type="datetime-local"
            style={{ ...inputStyle, ...(errors.date ? { borderColor: 'var(--danger-color)' } : {}) }}
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
          {errors.date && <span style={errorStyle}>{errors.date}</span>}
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Data e Hora de Término</label>
          <input
            type="datetime-local"
            style={inputStyle}
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>
          <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />
          Local do Evento *
        </label>
        <input
          style={{ ...inputStyle, ...(errors.locationName ? { borderColor: 'var(--danger-color)' } : {}) }}
          placeholder="Ex: Igreja Central, Rua das Flores, 123"
          value={formData.location.name}
          onChange={(e) => handleLocationChange('name', e.target.value)}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
          onBlur={(e) => e.target.style.borderColor = errors.locationName ? 'var(--danger-color)' : 'var(--border-color)'}
        />
        {errors.locationName && <span style={errorStyle}>{errors.locationName}</span>}
      </div>

      <div className="event-form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Latitude</label>
          <input
            type="number"
            step="any"
            style={inputStyle}
            placeholder="-23.5505"
            value={formData.location.lat || ''}
            onChange={(e) => handleLocationChange('lat', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Longitude</label>
          <input
            type="number"
            step="any"
            style={inputStyle}
            placeholder="-46.6333"
            value={formData.location.lng || ''}
            onChange={(e) => handleLocationChange('lng', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      </div>

      <div style={{
        padding: '0.85rem 1rem',
        background: 'rgba(6, 182, 212, 0.06)',
        border: '1px solid rgba(6, 182, 212, 0.15)',
        borderRadius: '10px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
      }}>
        💡 <strong>Dica:</strong> As coordenadas são opcionais, mas permitem exibir o mapa na tela do evento. Você pode encontrá-las no Google Maps clicando com o botão direito no local.
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Capacidade Máxima</label>
        <input
          type="number"
          min="1"
          style={inputStyle}
          placeholder="Deixe em branco para ilimitado"
          value={formData.maxCapacity}
          onChange={(e) => handleChange('maxCapacity', e.target.value)}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Deixe em branco para vagas ilimitadas.
        </span>
      </div>

      {/* Toggle Pago */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '1rem 1.25rem', background: 'var(--surface-color)',
        borderRadius: '10px', border: '1px solid var(--border-color)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>Evento Pago</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Ative para definir valor e link de pagamento.
          </div>
        </div>
        <button
          onClick={() => handleChange('isPaid', !formData.isPaid)}
          style={{
            width: '52px', height: '28px', borderRadius: '14px',
            background: formData.isPaid
              ? 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))'
              : 'var(--surface-hover)',
            border: 'none', cursor: 'pointer', position: 'relative',
            transition: 'background 0.3s ease',
          }}
        >
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            background: '#fff', position: 'absolute', top: '3px',
            left: formData.isPaid ? '27px' : '3px',
            transition: 'left 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>

      {/* Campos de pagamento (condicionais) */}
      {formData.isPaid && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '1rem',
          padding: '1.25rem', background: 'rgba(245, 158, 11, 0.04)',
          border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '10px',
        }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              <DollarSign size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
              Valor (R$) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              style={{ ...inputStyle, ...(errors.price ? { borderColor: 'var(--danger-color)' } : {}) }}
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
            />
            {errors.price && <span style={errorStyle}>{errors.price}</span>}
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Link de Pagamento</label>
            <input
              style={inputStyle}
              placeholder="https://mpago.la/..."
              value={formData.paymentLink}
              onChange={(e) => handleChange('paymentLink', e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Cole o link do MercadoPago, Pix ou outra plataforma.
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Banner do Evento</label>

        {/* Preview */}
        {bannerPreview ? (
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
            <img
              src={bannerPreview}
              alt="Banner preview"
              style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={() => { setBannerFile(null); setBannerPreview(null); handleChange('bannerURL', ''); }}
              style={{
                position: 'absolute', top: '10px', right: '10px',
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.85)', border: 'none',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '200px', border: '2px dashed var(--border-color)',
            borderRadius: '12px', cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
            background: 'var(--surface-color)',
          }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.background = 'rgba(79,70,229,0.04)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--surface-color)'; }}
          >
            <Upload size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>
              Clique para selecionar uma imagem
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              JPG ou PNG, máximo 5MB
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerSelect}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      {/* Status selector */}
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Status Inicial</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['draft', 'published'].map(s => (
            <button
              key={s}
              onClick={() => handleChange('status', s)}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: `2px solid ${formData.status === s ? 'var(--primary-color)' : 'var(--border-color)'}`,
                background: formData.status === s ? 'rgba(79, 70, 229, 0.08)' : 'var(--surface-color)',
                color: formData.status === s ? 'var(--primary-light)' : 'var(--text-muted)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.875rem',
              }}
            >
              {s === 'draft' ? '📝 Rascunho' : '🚀 Publicar Agora'}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Rascunhos ficam invisíveis para membros até serem publicados.
        </span>
      </div>
    </div>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem', maxWidth: '700px', margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/events')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500',
            background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0',
            marginBottom: '0.5rem',
          }}
        >
          <ArrowLeft size={16} /> Voltar para Eventos
        </button>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          {isEditing ? 'Editar Evento' : 'Novo Evento'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {isEditing ? 'Atualize as informações do evento.' : 'Preencha as informações para criar um novo evento.'}
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', justifyContent: 'center' }}>
        {STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          return (
            <React.Fragment key={step.key}>
              <div
                onClick={() => { if (i < currentStep) setCurrentStep(i); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  cursor: i < currentStep ? 'pointer' : 'default',
                  opacity: isActive || isCompleted ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                  flex: '0 0 auto',
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCompleted
                    ? 'linear-gradient(135deg, var(--success-color), #059669)'
                    : isActive
                      ? 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))'
                      : 'var(--surface-color)',
                  border: `2px solid ${isActive ? 'var(--primary-color)' : isCompleted ? 'var(--success-color)' : 'var(--border-color)'}`,
                  transition: 'all 0.3s ease',
                }}>
                  {isCompleted ? <Check size={18} color="#fff" /> : <StepIcon size={18} color={isActive ? '#fff' : 'var(--text-muted)'} />}
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: '600', marginTop: '0.35rem',
                  color: isActive ? 'var(--primary-light)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: '1 1 30px', maxWidth: '60px', height: '2px',
                  background: i < currentStep ? 'var(--success-color)' : 'var(--border-color)',
                  marginBottom: '1.5rem',
                  transition: 'background 0.3s',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content Card */}
      <div className="card static" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {React.createElement(STEPS[currentStep].icon, { size: 20, style: { color: 'var(--primary-light)' } })}
          {STEPS[currentStep].label}
        </h3>

        {stepRenderers[currentStep]()}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <button
          className="btn-secondary"
          onClick={handlePrev}
          disabled={currentStep === 0}
          style={{ opacity: currentStep === 0 ? 0.3 : 1, cursor: currentStep === 0 ? 'not-allowed' : 'pointer' }}
        >
          <ArrowLeft size={16} /> Anterior
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button className="btn-primary" onClick={handleNext}>
            Próximo <ArrowRight size={16} />
          </button>
        ) : (
          <button className="btn-primary" onClick={handleSubmit}>
            <Check size={16} /> {isEditing ? 'Salvar Alterações' : 'Criar Evento'}
          </button>
        )}
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 480px) {
          .event-form-grid-2col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EventForm;
