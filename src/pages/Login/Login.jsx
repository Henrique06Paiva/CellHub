import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, KeyRound, Users, Zap, Eye, EyeOff,  BarChart } from 'lucide-react';

const FeatureItem = ({ icon: Icon, title, desc }) => (
  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }} className="animate-fade-in">
    <div style={{ 
      background: 'rgba(79, 70, 229, 0.15)', // Light indigo tint
      color: '#818cf8', // Indigo 400
      padding: '0.75rem', 
      borderRadius: '12px',
      border: '1px solid rgba(129, 140, 248, 0.2)'
    }}>
      <Icon size={24} strokeWidth={2} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem' }}>
      <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: '600', margin: 0 }}>{title}</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>{desc}</p>
    </div>
  </div>
);

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [loading, setLoading] = useState(false);

  const validateEmail = (value) => {
    const cleanEmail = (value || email).trim();
    if (!cleanEmail) {
      setEmailError('Por favor, informe o seu e-mail.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('O e-mail informado não é válido.');
      return false;
    }
    return true;
  };

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setAuthError('');
    setSuccessMessage('');

    if (!validateEmail()) isValid = false;

    if (!isForgotPassword) {
      if (!password) {
        setPasswordError('A senha é obrigatória.');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const cleanEmail = email.trim();

      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, cleanEmail);
        setSuccessMessage('E-mail de redefinição de senha enviado! Verifique sua caixa de entrada (e o spam).');
        setAuthError('');
      } else {
        await login(cleanEmail, password);
        navigate('/');
      }
    } catch (err) {
      console.error('Erro de Autenticação:', err);
      
      if (isForgotPassword) {
        switch (err.code) {
          case 'auth/user-not-found':
            setAuthError('Nenhuma conta encontrada com este e-mail.');
            break;
          case 'auth/invalid-email':
            setAuthError('O endereço de e-mail fornecido não é válido.');
            break;
          case 'auth/too-many-requests':
            setAuthError('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
            break;
          default:
            setAuthError('Não foi possível enviar o e-mail. Tente novamente mais tarde.');
        }
      } else {
        switch (err.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setAuthError('E-mail ou senha incorretos. Verifique e tente novamente.');
            break;
          case 'auth/invalid-email':
            setAuthError('O endereço de e-mail fornecido não é válido.');
            break;
          case 'auth/too-many-requests':
            setAuthError('Muitas tentativas falhas. Por segurança, aguarde alguns minutos.');
            break;
          case 'auth/network-request-failed':
            setAuthError('Sem conexão. Verifique sua internet e tente novamente.');
            break;
          case 'auth/configuration-not-found':
            setAuthError('Configuração pendente: Ative o provedor de "E-mail/Senha" no Firebase Console.');
            break;
          default:
            setAuthError('Não foi possível entrar no sistema agora. Tente novamente mais tarde.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setAuthError('');
    setEmailError('');
    setPasswordError('');
    setSuccessMessage('');
  };

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      background: '#090e17', // Very dark slate/navy
      overflow: 'hidden',
      color: '#f8fafc'
    }}>
      
      {/* LEFT SIDE: Form container */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10,
        backgroundColor: '#090e17',
        boxShadow: '15px 0 50px rgba(0,0,0,0.5)',
        maxWidth: '550px'
      }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          padding: '2rem 3rem',
          maxWidth: '450px',
          width: '100%',
          margin: '0 auto' 
        }}>
          
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '800', 
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #00d4ff 0%, #4f46e5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px'
            }}>
              Nexo-Hub
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
              {isForgotPassword ? 'Informe seu e-mail para redefinir a senha' : 'Acesse a plataforma de gerenciamento'}
            </p>
          </div>

          {authError && (
            <div style={{ 
              marginBottom: '1.5rem', padding: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', 
              borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <AlertCircle size={18} /> {authError}
            </div>
          )}

          {successMessage && (
            <div style={{ 
              marginBottom: '1.5rem', padding: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', 
              borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
              border: '1px solid rgba(16, 185, 129, 0.2)', lineHeight: '1.4'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} /> {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} noValidate>
            
            {/* Email Field */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500', color: '#e2e8f0' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: '#64748b' }}>
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value.replace(/\s/g, '')); setEmailError(''); }}
                  style={{
                    width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', background: '#0f172a',
                    border: `1px solid ${emailError ? '#ef4444' : 'rgba(255,255,255,0.05)'}`, 
                    borderRadius: '8px', color: '#f8fafc', fontSize: '0.95rem', transition: 'all 0.2s', outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                  onBlur={(e) => !emailError && (e.target.style.borderColor = 'rgba(255,255,255,0.05)')}
                />
              </div>
              {emailError && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', display: 'block' }}>{emailError}</span>
              )}
            </div>

            {/* Password Field */}
            {!isForgotPassword && (
              <div className="animate-fade-in">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500', color: '#e2e8f0' }}>
                  Senha
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem', color: '#64748b' }}>
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value.replace(/\s/g, '')); setPasswordError(''); }}
                    style={{
                      width: '100%', padding: '0.85rem 2.8rem 0.85rem 2.8rem', background: '#0f172a',
                      border: `1px solid ${passwordError ? '#ef4444' : 'rgba(255,255,255,0.05)'}`, 
                      borderRadius: '8px', color: '#f8fafc', fontSize: '0.95rem', transition: 'all 0.2s', outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                    onBlur={(e) => !passwordError && (e.target.style.borderColor = 'rgba(255,255,255,0.05)')}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '1rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && (
                  <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', display: 'block' }}>{passwordError}</span>
                )}
              </div>
            )}

            {/* Extras */}
            {!isForgotPassword && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }} className="animate-fade-in">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#94a3b8' }}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ cursor: 'pointer', accentColor: '#4f46e5' }}
                  />
                  Lembrar-me
                </label>
                <button 
                  type="button" 
                  onClick={toggleForgotPassword}
                  style={{ color: '#00d4ff', fontWeight: '500', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseOver={(e) => e.target.style.color = '#fff'}
                  onMouseOut={(e) => e.target.style.color = '#00d4ff'}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%', padding: '0.9rem', marginTop: isForgotPassword ? '1rem' : '0.5rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff', fontSize: '1rem', fontWeight: '600', borderRadius: '8px',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)'
              }}
              onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
            >
              {loading ? 'Processando...' : isForgotPassword ? 'Enviar Redefinição' : 'Entrar'}
            </button>
          </form>

          {/* Bottom text */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            {isForgotPassword ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Lembrou sua senha?{' '}
                <button 
                  type="button" onClick={toggleForgotPassword}
                  style={{ color: '#00d4ff', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseOver={(e) => e.target.style.color = '#fff'}
                  onMouseOut={(e) => e.target.style.color = '#00d4ff'}
                >
                  Voltar ao login
                </button>
              </p>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5' }}>
                Primeiro acesso? Entre em contato com o administrador da sua célula.
              </p>
            )}
          </div>

        </div>

        {/* Footer Links */}
        <div style={{ 
          padding: '1.5rem', borderTop: 'none', display: 'flex', justifyContent: 'center', gap: '1.5rem',
          fontSize: '0.8rem', color: '#475569'
        }}>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='#94a3b8'} onMouseOut={e => e.target.style.color='#475569'}>Termos de Uso</span>
          <span>&middot;</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='#94a3b8'} onMouseOut={e => e.target.style.color='#475569'}>Política de Privacidade</span>
          <span>&middot;</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='#94a3b8'} onMouseOut={e => e.target.style.color='#475569'}>Suporte</span>
        </div>
      </div>

      {/* RIGHT SIDE: Info panel */}
      <div style={{
        hidden: window.innerWidth < 768, // This is just a hint, we use media queries in real CSS but inline style is ok for now. Let's make it display:none on mobile via CSS but standard is fine
        flex: '1.2',
        position: 'relative',
        background: '#040b16', // Slightly darker backdrop
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem 6rem',
        overflow: 'hidden'
      }}>
        {/* Abstract Background Elements */}
        {/* Subtle grid pattern using CSS */}
        <div style={{ 
          position: 'absolute', inset: 0, opacity: 0.1, 
          backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.2) 1px, transparent 1px)',
          backgroundSize: '40px 40px', zIndex: 0
        }} />
        {/* Glowing Orbs */}
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '25vw', height: '25vw', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(50px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: '20vw', height: '20vw', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />

        {/* Info Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
          
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            lineHeight: '1.2',
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, #6EE7B7, #3B82F6, #9333EA)',
            background: '#00d4ff', // Solid cyan matching the image loosely
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Gerenciamento de Células e Redes
          </h2>
          
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '3rem' }}>
            Organize e conecte suas células de forma eficiente. Gerencie membros, acompanhe atividades e fortaleça sua rede em uma única plataforma.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <FeatureItem 
              icon={Users} 
              title="Gestão de Membros" 
              desc="Administre células, líderes e participantes com facilidade" 
            />
            <FeatureItem 
              icon={BarChart} 
              title="Relatórios e Métricas" 
              desc="Acompanhe o crescimento e engajamento das células" 
            />
            <FeatureItem 
              icon={Zap} 
              title="Comunicação Rápida" 
              desc="Mantenha todos conectados e informados em tempo real" 
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
