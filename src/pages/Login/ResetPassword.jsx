import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Users, Zap, BarChart } from 'lucide-react';

/* ─── Sub-componente: feature item do painel direito ─── */
const FeatureItem = ({ icon: Icon, title, desc }) => (
  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
    <div style={{
      background: 'rgba(79, 70, 229, 0.15)',
      color: '#818cf8',
      padding: '0.75rem',
      borderRadius: '12px',
      border: '1px solid rgba(129, 140, 248, 0.2)',
      flexShrink: 0,
    }}>
      <Icon size={24} strokeWidth={2} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem' }}>
      <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: '600', margin: 0 }}>{title}</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>{desc}</p>
    </div>
  </div>
);

/* ─── Sub-componente: indicador de força de senha ─── */
const PasswordStrength = ({ password }) => {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra maiúscula', ok: /[A-Z]/.test(password) },
    { label: 'Número', ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      {checks.map((c) => (
        <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: c.ok ? '#6ee7b7' : '#64748b', transition: 'color 0.2s' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.ok ? '#10b981' : '#334155', transition: 'background 0.2s', flexShrink: 0 }} />
          {c.label}
        </div>
      ))}
    </div>
  );
};

/* ─── Componente principal ─── */
const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [status, setStatus] = useState('loading'); // loading | form | success | invalid
  const [email, setEmail]   = useState('');

  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError]   = useState('');
  const [authError, setAuthError]         = useState('');
  const [submitting, setSubmitting]       = useState(false);

  /* Valida o código ao montar */
  useEffect(() => {
    if (!oobCode) { setStatus('invalid'); return; }
    verifyPasswordResetCode(auth, oobCode)
      .then((emailFromCode) => { setEmail(emailFromCode); setStatus('form'); })
      .catch(() => setStatus('invalid'));
  }, [oobCode]);

  /* Validação de formulário */
  const validate = () => {
    let ok = true;
    setPasswordError(''); setConfirmError(''); setAuthError('');

    if (password.length < 8) {
      setPasswordError('A senha deve ter no mínimo 8 caracteres.'); ok = false;
    }
    if (password !== confirm) {
      setConfirmError('As senhas não coincidem.'); ok = false;
    }
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus('success');
    } catch (err) {
      if (err.code === 'auth/expired-action-code') {
        setAuthError('Este link expirou. Solicite um novo e-mail de redefinição.');
      } else if (err.code === 'auth/weak-password') {
        setPasswordError('Senha fraca. Use pelo menos 8 caracteres com letras e números.');
      } else {
        setAuthError('Não foi possível redefinir a senha. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Estilos compartilhados ── */
  const inputBase = (hasError) => ({
    width: '100%',
    padding: '0.85rem 2.8rem 0.85rem 2.8rem',
    background: '#0f172a',
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.05)'}`,
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    outline: 'none',
  });

  /* ── Painel direito (igual ao Login) ── */
  const InfoPanel = () => (
    <div className="login-info-side">
      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.1,
        backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.2) 1px, transparent 1px)',
        backgroundSize: '40px 40px', zIndex: 0,
      }} />
      {/* Orbs */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '25vw', height: '25vw', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
        <h2 style={{
          fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '1.5rem',
          color: '#00d4ff', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          background: '#00d4ff',
        }}>
          Gerenciamento de Células e Redes
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '3rem' }}>
          Organize e conecte suas células de forma eficiente. Gerencie membros, acompanhe atividades e fortaleça sua rede em uma única plataforma.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <FeatureItem icon={Users}      title="Gestão de Membros"    desc="Administre células, líderes e participantes com facilidade" />
          <FeatureItem icon={BarChart}   title="Relatórios e Métricas" desc="Acompanhe o crescimento e engajamento das células" />
          <FeatureItem icon={Zap}        title="Comunicação Rápida"    desc="Mantenha todos conectados e informados em tempo real" />
        </div>
      </div>
    </div>
  );

  /* ── Renderizações por estado ── */

  if (status === 'loading') {
    return (
      <div className="login-split">
        <div className="login-form-side" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginBottom: '1rem', color: '#4f46e5' }}>
              <Lock size={36} />
            </div>
            <p>Validando link de redefinição...</p>
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </div>
        </div>
        <InfoPanel />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="login-split">
        <div className="login-form-side">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 3rem', maxWidth: '450px', width: '100%', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '50%', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <AlertCircle size={36} color="#ef4444" />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f8fafc', marginBottom: '0.75rem' }}>
                Link inválido ou expirado
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Este link de redefinição não é mais válido. Links expiram após 1 hora por segurança. Solicite um novo diretamente na tela de login.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '0.9rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff', fontSize: '1rem', fontWeight: '600', borderRadius: '8px',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)',
              }}
            >
              <ArrowLeft size={18} /> Voltar ao Login
            </button>
          </div>
        </div>
        <InfoPanel />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="login-split">
        <div className="login-form-side">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 3rem', maxWidth: '450px', width: '100%', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle2 size={40} color="#10b981" />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f8fafc', marginBottom: '0.75rem' }}>
                Senha redefinida!
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Sua nova senha foi salva com sucesso. Você já pode entrar no Nexo-Hub com ela.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '0.9rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff', fontSize: '1rem', fontWeight: '600', borderRadius: '8px',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)',
              }}
            >
              Ir para o Login <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        </div>
        <InfoPanel />
      </div>
    );
  }

  /* ── ESTADO PRINCIPAL: Formulário de nova senha ── */
  return (
    <div className="login-split">
      <div className="login-form-side">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 3rem', maxWidth: '450px', width: '100%', margin: '0 auto' }}>

          {/* Logo + título */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{
              fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #00d4ff 0%, #4f46e5 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px',
            }}>
              Nexo-Hub
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
              Crie sua nova senha de acesso
            </p>
          </div>

          {/* Caixa de e-mail vinculado */}
          {email && (
            <div style={{
              marginBottom: '1.5rem', padding: '0.75rem 1rem',
              background: 'rgba(79, 70, 229, 0.08)',
              border: '1px solid rgba(79, 70, 229, 0.2)',
              borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.6rem',
              fontSize: '0.875rem', color: '#a5b4fc',
            }}>
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              Redefinindo senha para <strong style={{ color: '#c7d2fe', marginLeft: '0.3rem' }}>{email}</strong>
            </div>
          )}

          {/* Erro global */}
          {authError && (
            <div style={{
              marginBottom: '1.5rem', padding: '0.85rem',
              background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
              borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.9rem', border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <AlertCircle size={18} /> {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} noValidate>

            {/* Nova senha */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500', color: '#e2e8f0' }}>
                Nova senha
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: '#64748b' }}>
                  <Lock size={18} />
                </div>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value.replace(/\s/g, '')); setPasswordError(''); }}
                  style={inputBase(!!passwordError)}
                  onFocus={(e)  => e.target.style.borderColor = '#4f46e5'}
                  onBlur={(e)   => !passwordError && (e.target.style.borderColor = 'rgba(255,255,255,0.05)')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '1rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', display: 'block' }}>{passwordError}</span>
              )}
              <PasswordStrength password={password} />
            </div>

            {/* Confirmar senha */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500', color: '#e2e8f0' }}>
                Confirmar nova senha
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: '#64748b' }}>
                  <Lock size={18} />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value.replace(/\s/g, '')); setConfirmError(''); }}
                  style={inputBase(!!confirmError)}
                  onFocus={(e)  => e.target.style.borderColor = '#4f46e5'}
                  onBlur={(e)   => !confirmError && (e.target.style.borderColor = 'rgba(255,255,255,0.05)')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Esconder confirmação' : 'Mostrar confirmação'}
                  style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '1rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmError && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', display: 'block' }}>{confirmError}</span>
              )}
              {/* Match indicator */}
              {confirm && !confirmError && confirm === password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#6ee7b7', marginTop: '0.5rem' }}>
                  <CheckCircle2 size={14} /> As senhas coincidem
                </div>
              )}
            </div>

            {/* Botão submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '0.9rem', marginTop: '0.5rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff', fontSize: '1rem', fontWeight: '600', borderRadius: '8px',
                border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)',
              }}
            >
              {submitting ? 'Salvando...' : 'Redefinir Senha'}
            </button>
          </form>

          {/* Voltar ao login */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/login')}
              style={{ color: '#00d4ff', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e)  => e.currentTarget.style.color = '#00d4ff'}
            >
              <ArrowLeft size={16} /> Voltar ao login
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.8rem', color: '#475569' }}>
          <span style={{ cursor: 'pointer' }} onMouseOver={e => e.target.style.color='#94a3b8'} onMouseOut={e => e.target.style.color='#475569'}>Termos de Uso</span>
          <span>&middot;</span>
          <span style={{ cursor: 'pointer' }} onMouseOver={e => e.target.style.color='#94a3b8'} onMouseOut={e => e.target.style.color='#475569'}>Política de Privacidade</span>
          <span>&middot;</span>
          <span style={{ cursor: 'pointer' }} onMouseOver={e => e.target.style.color='#94a3b8'} onMouseOut={e => e.target.style.color='#475569'}>Suporte</span>
        </div>
      </div>

      <InfoPanel />
    </div>
  );
};

export default ResetPassword;
