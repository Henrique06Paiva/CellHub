import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
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
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-color)', 
      width: '100vw',
      minHeight: '100vh',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Orbs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw', background: 'rgba(79, 70, 229, 0.08)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-5%', width: '50vw', height: '50vw', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0
      }} />

      <div className="glass-panel animate-fade-in" style={{ 
        position: 'relative',
        zIndex: 1,
        padding: '3.5rem 3rem', 
        maxWidth: '440px', 
        width: '100%', 
        textAlign: 'center',
        background: 'rgba(15, 23, 42, 0.65)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        WebkitBackdropFilter: 'blur(24px)',
        backdropFilter: 'blur(24px)'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <span style={{ 
            fontWeight: '900', 
            fontSize: '3rem', 
            background: 'linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            letterSpacing: '-0.04em',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            Nexo-Hub
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', fontWeight: '400' }}>
          {isForgotPassword 
            ? 'Informe seu e-mail para redefinir a senha' 
            : 'Acesse a plataforma de gerenciamento'}
        </p>

        {authError && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '0.85rem', 
            background: 'rgba(239, 68, 68, 0.15)', 
            color: '#fca5a5', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            justifyContent: 'center',
            fontSize: '0.9rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <AlertCircle size={18} /> {authError}
          </div>
        )}

        {successMessage && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '0.85rem', 
            background: 'rgba(16, 185, 129, 0.15)', 
            color: '#6ee7b7', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            justifyContent: 'center',
            fontSize: '0.9rem',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease',
            textAlign: 'left',
            lineHeight: '1.4'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} /> {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }} noValidate>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-main)' }}>
              E-mail
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1.2rem', color: emailError ? 'var(--danger-color)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                <Mail size={18} strokeWidth={emailError ? 2 : 1.5} />
              </div>
              <input 
                type="email" 
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value.replace(/\s/g, ''));
                  if (emailError) setEmailError('');
                }}
                style={{ 
                  width: '100%', 
                  padding: '0.9rem 1rem 0.9rem 3rem',
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderColor: emailError ? 'var(--danger-color)' : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: emailError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
                  color: 'var(--text-main)',
                  borderRadius: '12px',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            {emailError && (
              <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', animation: 'fadeIn 0.2s ease' }}>
                {emailError}
              </span>
            )}
          </div>

          {!isForgotPassword && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-main)' }}>
                  Senha
                </label>
                <button 
                  type="button"
                  onClick={toggleForgotPassword}
                  style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--primary-color)', 
                    fontWeight: '500',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'color 0.2s ease, transform 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.color = 'var(--primary-hover)'}
                  onMouseOut={(e) => e.target.style.color = 'var(--primary-color)'}
                  onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1.2rem', color: passwordError ? 'var(--danger-color)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                  <Lock size={18} strokeWidth={passwordError ? 2 : 1.5} />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value.replace(/\s/g, ''));
                    if (passwordError) setPasswordError('');
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '0.9rem 1rem 0.9rem 3rem',
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderColor: passwordError ? 'var(--danger-color)' : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: passwordError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
                    color: 'var(--text-main)',
                    borderRadius: '12px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
              {passwordError && (
                <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', animation: 'fadeIn 0.2s ease' }}>
                  {passwordError}
                </span>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', 
              marginTop: '0.5rem', 
              padding: '1rem',
              borderRadius: '12px',
              fontSize: '1rem',
              letterSpacing: '0.5px',
              opacity: loading ? 0.7 : 1,
              boxShadow: loading ? 'none' : '0 10px 25px -5px rgba(79, 70, 229, 0.3)'
            }}
          >
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {loading ? 'Processando...' : (
                <>
                  {isForgotPassword ? (
                    <><KeyRound size={18} strokeWidth={2.5} /> Enviar E-mail de Redefinição</>
                  ) : (
                    <>Entrar <ArrowRight size={18} strokeWidth={2.5} /></>
                  )}
                </>
              )}
            </span>
          </button>
        </form>

        {isForgotPassword ? (
          <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Lembrou sua senha?
            <button 
              type="button" 
              onClick={toggleForgotPassword}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--primary-color)', 
                fontWeight: '600', 
                marginLeft: '0.5rem', 
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = 'var(--primary-hover)'}
              onMouseOut={(e) => e.target.style.color = 'var(--primary-color)'}
            >
              Voltar ao login
            </button>
          </div>
        ) : (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(79, 70, 229, 0.06)',
            border: '1px solid rgba(79, 70, 229, 0.12)',
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.5', margin: 0 }}>
              Primeiro acesso? Sua conta é criada pelo administrador da sua célula. 
              Verifique seu e-mail para o link de configuração de senha.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
